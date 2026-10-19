import fs from 'node:fs';
import path from 'node:path';
import { safe, stat, isObject, SLUG, HarnessError } from './files.js';
import { readConfig } from './project-config.js';

export const ARTIFACTS = '.notth/artifacts.json';
export const INTEGRATIONS = '.notth/integrations.json';
export const emptyArtifacts = () => ({ schema_version: 1, mode: 'unconfigured', inputs: {}, outputs: {} });
export const emptyIntegrations = () => ({ schema_version: 1, connections: {} });
const policies = ['read-only', 'propose', 'write'];
const text = s => typeof s === 'string' && s.trim().length > 0 && !/[\0\r\n]/.test(s);
const assert = (ok, message) => { if (!ok) throw new HarnessError(message); };
const fields = (o, allowed, label) => assert(isObject(o) && Object.keys(o).every(k => allowed.includes(k)), 'Invalid fields: ' + label);
const strings = a => Array.isArray(a) && a.every(text) && new Set(a).size === a.length;
const reserved = p => /(?:^|\/)(?:\.git|\.notth|\.harness|\.agents|node_modules|AGENTS\.md)(?:\/|$)/i.test(p);

function location(root, value, label, output) {
  fields(value, ['path', 'url', 'connection'], label);
  assert(Number(value.path !== undefined) + Number(value.url !== undefined) === 1, 'Choose one path or URL: ' + label);
  if (value.path !== undefined) {
    assert(text(value.path), 'Invalid artifact path: ' + label);
    assert(value.connection === undefined, 'Local artifacts do not need a connection: ' + label);
    // safe() normally expects a file leaf. A probe checks all directory segments without writing.
    if (output || stat(path.join(root, value.path))?.isDirectory()) safe(root, value.path + '/.artifact-probe');
    else safe(root, value.path);
    if (output) assert(!reserved(value.path), 'Output overlaps managed or private content: ' + label);
  } else {
    assert(text(value.url), 'Invalid artifact URL: ' + label);
    let url;
    try { url = new URL(value.url); } catch { throw new HarnessError('Invalid artifact URL: ' + label); }
    assert(url.protocol === 'https:' && !url.username && !url.password, 'Use a credential-free HTTPS URL: ' + label);
    assert(![...url.searchParams.keys()].some(k => /^(token|access_token|api[_-]?key|password|secret|authorization|sig|signature)$/i.test(k)),
      'Credential parameters are not allowed: ' + label);
    if (value.connection !== undefined) assert(SLUG.test(value.connection), 'Invalid connection reference: ' + label);
  }
}

export function loadArtifactContract(root) {
  const rawArtifacts = readConfig(root, ARTIFACTS), rawIntegrations = readConfig(root, INTEGRATIONS);
  assert(rawArtifacts !== null || !stat(safe(root, ARTIFACTS)), 'Invalid artifacts schema');
  assert(rawIntegrations !== null || !stat(safe(root, INTEGRATIONS)), 'Invalid integrations schema');
  const artifacts = rawArtifacts ?? emptyArtifacts(), integrations = rawIntegrations ?? emptyIntegrations();
  fields(integrations, ['schema_version', 'connections'], INTEGRATIONS);
  assert(integrations.schema_version === 1 && isObject(integrations.connections), 'Invalid integrations schema');
  for (const [id, c] of Object.entries(integrations.connections)) {
    assert(SLUG.test(id), 'Invalid connection identifier');
    fields(c, ['via', 'binding', 'purpose', 'access', 'scope'], 'connection/' + id);
    assert(['mcp', 'connector', 'manual'].includes(c.via), 'Invalid connection transport: ' + id);
    assert(text(c.binding) && /^[A-Za-z0-9_.-]+$/.test(c.binding), 'Use a host binding alias, not credentials or an endpoint: ' + id);
    assert(text(c.purpose), 'Missing connection purpose: ' + id);
    assert(c.access === undefined || policies.includes(c.access), 'Invalid connection access: ' + id);
    assert(c.scope === undefined || strings(c.scope), 'Invalid connection scope: ' + id);
    if (c.access === 'write') assert(c.scope?.length > 0, 'Write connection requires an explicit scope: ' + id);
  }
  fields(artifacts, ['schema_version', 'mode', 'inputs', 'outputs'], ARTIFACTS);
  assert(artifacts.schema_version === 1 && ['unconfigured', 'idea-driven', 'document-driven'].includes(artifacts.mode),
    'Invalid artifacts schema or mode');
  const canonical = new Set(), docRoutes = new Set();
  for (const group of ['inputs', 'outputs']) {
    assert(isObject(artifacts[group]), 'Missing artifact map: ' + group);
    for (const [id, a] of Object.entries(artifacts[group])) {
      assert(SLUG.test(id), 'Invalid artifact identifier');
      const label = group + '/' + id;
      fields(a, ['kind', 'location', 'owner', 'revision', 'status', 'write_policy', 'canonical', 'capability',
        ...(group === 'outputs' ? ['sources', 'depends_on'] : [])], label);
      assert(typeof a.kind === 'string' && SLUG.test(a.kind), 'Invalid artifact kind: ' + label);
      location(root, a.location, label, group === 'outputs');
      for (const key of ['owner', 'revision']) if (a[key] !== undefined) assert(text(a[key]), 'Invalid ' + key + ': ' + label);
      assert(a.status === undefined || ['draft', 'approved', 'superseded'].includes(a.status), 'Invalid artifact status: ' + label);
      assert(a.write_policy === undefined || policies.includes(a.write_policy), 'Invalid write policy: ' + label);
      assert(a.canonical === undefined || typeof a.canonical === 'boolean', 'Invalid canonical flag: ' + label);
      assert(a.capability === undefined || (typeof a.capability === 'string' && SLUG.test(a.capability)), 'Invalid artifact capability: ' + label);
      const connection = a.location.connection;
      if (connection !== undefined) assert(Object.hasOwn(integrations.connections, connection), 'Unknown connection: ' + label);
      if (a.location.url && a.write_policy === 'write') {
        assert(connection !== undefined && integrations.connections[connection].access === 'write',
          'External writes require a declared write connection: ' + label);
        assert(text(a.revision), 'External writes require an observed revision or snapshot reference: ' + label);
      }
      const key = a.kind + '/' + (a.capability ?? (a.kind === 'docs' ? 'product' : ''));
      if (a.canonical) { assert(!canonical.has(key), 'Conflicting canonical artifacts: ' + key); canonical.add(key); }
      if (group === 'outputs') {
        for (const k of ['sources', 'depends_on']) assert(a[k] === undefined || strings(a[k]), 'Invalid ' + k + ': ' + label);
        if (a.kind === 'docs') { assert(!docRoutes.has(key), 'Ambiguous document destination: ' + key); docRoutes.add(key); }
        if (a.kind === 'spec') assert(a.location.path === 'openspec', 'OpenSpec must stay in the repository at openspec');
      }
    }
  }
  if (artifacts.mode === 'unconfigured') assert(!Object.keys(artifacts.inputs).length && !Object.keys(artifacts.outputs).length,
    'Choose an artifact mode before declaring inputs or outputs');
  for (const [id, a] of Object.entries(artifacts.outputs)) {
    for (const source of a.sources ?? []) assert(Object.hasOwn(artifacts.inputs, source), 'Unknown input source: outputs/' + id);
    for (const dep of a.depends_on ?? []) assert(dep !== id && Object.hasOwn(artifacts.outputs, dep), 'Unknown/self output dependency: ' + id);
  }
  const active = new Set(), done = new Set();
  const visit = id => {
    assert(!active.has(id), 'Cyclic artifact dependencies');
    if (done.has(id)) return;
    active.add(id); for (const dep of artifacts.outputs[id].depends_on ?? []) visit(dep);
    active.delete(id); done.add(id);
  };
  for (const id of Object.keys(artifacts.outputs)) visit(id);
  return { configured: artifacts.mode !== 'unconfigured', present: rawArtifacts !== null, artifacts, integrations };
}

export function writePolicy(artifact, output = false) {
  return artifact.write_policy ?? (output || artifact.location.path ? 'propose' : 'read-only');
}

export function artifactReport(root) {
  const c = loadArtifactContract(root);
  const entries = ['inputs', 'outputs'].flatMap(group => Object.entries(c.artifacts[group]).map(([id, a]) => ({
    ref: (group === 'inputs' ? 'input:' : 'output:') + id, kind: a.kind,
    location: a.location, owner: a.owner ?? null, revision: a.revision ?? null,
    capability: a.capability ?? (a.kind === 'docs' ? 'product' : null),
    canonical: a.canonical === true, status: a.status ?? 'draft',
    write_policy: writePolicy(a, group === 'outputs'), sources: a.sources ?? [], depends_on: a.depends_on ?? [],
  })));
  const connections = Object.entries(c.integrations.connections).map(([id, a]) => ({
    id, via: a.via, binding: a.binding, access: a.access ?? 'read-only', scope: a.scope ?? [],
    availability: 'unverified',
  }));
  const questions = [];
  if (!c.configured || !Object.keys(c.artifacts.outputs).length) questions.push({
    id: 'artifact-storage', question: 'Where should project docs and any UI/UX outputs be stored and maintained?',
    options: [{ label: 'A', value: 'repository', description: 'Keep docs/spec in Git; select only outputs needed for this project.' },
      { label: 'B', value: 'external', description: 'Use authorized Confluence/Figma or another system; record exact destinations and canonical ownership.' },
      { label: 'C', value: 'mixed', description: 'Choose one canonical owner per artifact and explicit Git/external destinations.' }],
    recommendation: 'A', reason: 'Git provides versioned docs and PR review without requiring another connection; reuse a known team choice instead.',
    allow_free_text: true,
  });
  return { status: 'planned', configured: c.configured, mode: c.artifacts.mode, entries, connections, questions,
    executed: false, note: 'Declared artifact contract only. No retrieval, publication, MCP discovery or permission enforcement. Host tools and authorization must be verified.' };
}

export function docRoute(root, capability, name) {
  const c = loadArtifactContract(root);
  const row = Object.entries(c.artifacts.outputs).find(([, a]) => a.kind === 'docs' && (a.capability ?? 'product') === capability);
  if (!row) { assert(!c.configured, 'No document destination declared for capability: ' + capability); return null; }
  const [id, a] = row;
  assert(writePolicy(a, true) !== 'read-only', 'Document destination is read-only: ' + id);
  if (a.location.url) return { id, external: true, destination: a.location, write_policy: writePolicy(a, true) };
  return { id, external: false, path: a.location.path + '/' + name + '.md', write_policy: writePolicy(a, true) };
}

export function artifactImpact(root, base, stage) {
  const c = loadArtifactContract(root);
  if (!c.configured || !Object.keys(c.artifacts.outputs).length) return [];
  const impact = readConfig(root, base + '/artifact-impact.json'), problems = [], seen = new Set();
  if (!isObject(impact) || impact.schema_version !== 1 || impact.reviewed !== true || !Array.isArray(impact.items))
    return ['Missing/review-required artifact-impact.json'];
  for (const row of impact.items) {
    if (!isObject(row) || typeof row.artifact !== 'string' || seen.has(row.artifact)) { problems.push('Invalid/duplicate artifact impact'); continue; }
    seen.add(row.artifact);
    const match = row.artifact.match(/^(input|output):([a-z][a-z0-9]*(?:-[a-z0-9]+)*)$/);
    const a = match && c.artifacts[match[1] === 'input' ? 'inputs' : 'outputs'][match[2]];
    if (!a || !['unchanged', 'create', 'update', 'supersede'].includes(row.action) ||
        !['pending', 'done', 'blocked'].includes(row.status) || !text(row.reason) || /\b(?:TODO|TBD|FIXME)\b|\{\{[^}]+\}\}/i.test(row.reason)) {
      problems.push('Invalid artifact impact entry'); continue;
    }
    if (row.action !== 'unchanged' && writePolicy(a, match[1] === 'output') === 'read-only') problems.push('Read-only artifact cannot be changed: ' + row.artifact);
    if (row.status === 'blocked') problems.push('Blocked artifact: ' + row.artifact);
    if (stage === 'review' && (row.status !== 'done' || (row.action !== 'unchanged' && (!text(row.evidence) || /\b(?:TODO|TBD|FIXME)\b|\{\{[^}]+\}\}/i.test(row.evidence)))))
      problems.push('Artifact maintenance evidence missing: ' + row.artifact);
  }
  for (const id of Object.keys(c.artifacts.outputs)) if (!seen.has('output:' + id)) problems.push('Missing output impact: ' + id);
  return problems;
}
