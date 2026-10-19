import fs from 'node:fs';
import path from 'node:path';
import { safe, stat, digest, encode, isObject, HarnessError } from './files.js';
import { readConfig } from './project-config.js';
import { frontmatter } from './structured.js';
import { check, loadLock, guard, transaction } from './harness.js';

export const KNOWLEDGE = '.notth/knowledge.json';
const CONTEXT = ['.notth/local.md', '.notth/environment.json', '.notth/agents.json', '.notth/artifacts.json', '.notth/integrations.json', '.notth/decisions.json'];
const EXCLUDE = new Set(['.git', '.notth', '.harness', '.agents', '.kiro', '.claude', 'node_modules', 'target', 'build', 'dist', '.next', '.venv', 'vendor']);
const RELEVANT = /^(?:AGENTS\.md|README\.md|OVERVIEW\.md|pom\.xml|package\.json|build\.gradle(?:\.kts)?|pyproject\.toml|[^/]*(?:conventions|workflow|testing)[^/]*\.md)$/i;
function assert(ok, message) { if (!ok) throw new HarnessError(message); }
function bytes(root, name) {
  const p = safe(root, name), info = stat(p);
  assert(!info || info.size <= 1024 * 1024, 'Knowledge source exceeds 1 MiB: ' + name);
  return info ? fs.readFileSync(p) : null;
}
export function localContext(root) {
  const body = bytes(root, '.notth/local.md')?.toString('utf8') ?? '';
  const parsed = frontmatter(body, '.notth/local.md');
  if (!parsed) return { structured: false, value: null };
  const value = parsed.value;
  assert(value.schema_version === 1 && Object.keys(value).every(k => ['schema_version', 'stack', 'build', 'approved_deviations', 'sources'].includes(k)), 'Invalid local.md schema');
  for (const key of ['stack', 'build']) if (value[key] !== undefined) {
    assert(isObject(value[key]) && Object.values(value[key]).every(v => typeof v === 'string' && v.length <= 512), 'Invalid local.md ' + key);
  }
  const deviations = value.approved_deviations ?? [];
  assert(Array.isArray(deviations) && deviations.length <= 128 && deviations.every(v => isObject(v)
    && ['id', 'rule', 'reason'].every(k => typeof v[k] === 'string' && v[k].trim())
    && Object.keys(v).every(k => ['id', 'rule', 'reason', 'source'].includes(k)))
    && new Set(deviations.map(v => v.id)).size === deviations.length, 'Invalid approved_deviations');
  const sources = value.sources ?? [];
  assert(Array.isArray(sources) && sources.length <= 128 && new Set(sources).size === sources.length, 'Invalid local.md sources');
  for (const name of sources) {
    safe(root, name);
    assert(!name.startsWith('.notth/') && !name.startsWith('.harness/') && !name.startsWith('.agents/') && !name.startsWith('.kiro/') && !name.startsWith('.claude/') && !/(?:^|\/)(?:\.git|node_modules|machine\.json|\.env(?:\..*)?)(?:\/|$)/.test(name), 'Private or unsupported knowledge source');
  }
  return { structured: true, value };
}
function discover(root) {
  const files = []; let visited = 0;
  function walk(folder, depth) {
    for (const entry of fs.readdirSync(path.join(root, folder), { withFileTypes: true }).sort((a,b) => a.name.localeCompare(b.name))) {
      assert(++visited <= 10000, 'Knowledge discovery exceeds 10000 entries; narrow the workspace');
      const name = folder ? folder + '/' + entry.name : entry.name;
      if (entry.isSymbolicLink()) continue;
      if (entry.isDirectory() && depth < 4 && !EXCLUDE.has(entry.name)) walk(name, depth + 1);
      else if (entry.isFile() && RELEVANT.test(entry.name)) { safe(root, name); files.push(name); }
    }
  }
  walk('', 0);
  assert(files.length <= 256, 'Knowledge discovery exceeds 256 sources');
  return files.sort();
}
function hashes(root, names) { return Object.fromEntries(names.map(name => [name, bytes(root, name)]).map(([name,data]) => [name, data === null ? null : digest(data)])); }
function state(root) {
  const local = localContext(root), discovered = discover(root);
  return { local, discovered, source_hashes: hashes(root, [...new Set([...discovered, ...(local.value?.sources ?? [])])].sort()), context_hashes: hashes(root, CONTEXT), bundle_sha256: loadLock(root).bundle_sha256 };
}
function savedKnowledge(root) {
  const saved = readConfig(root, KNOWLEDGE);
  if (!saved) { assert(!stat(safe(root, KNOWLEDGE)), 'Invalid knowledge schema'); return null; }
  assert(isObject(saved) && saved.schema_version === 1 && Object.keys(saved).sort().join(',') === 'bundle_sha256,context_hashes,knowledge_hash,schema_version,source_hashes', 'Invalid knowledge schema');
  for (const group of ['source_hashes', 'context_hashes']) {
    assert(isObject(saved[group]) && Object.keys(saved[group]).length <= 384, 'Invalid knowledge hashes');
    for (const [name, hash] of Object.entries(saved[group])) { safe(root, name); assert(hash === null || /^[a-f0-9]{64}$/.test(hash), 'Invalid knowledge digest'); }
  }
  const { knowledge_hash, ...content } = saved;
  assert(knowledge_hash === digest(encode(content)), 'Knowledge digest mismatch');
  return saved;
}
export function knowledgeReport(root) {
  const current = state(root), saved = savedKnowledge(root);
  const changed = [];
  for (const group of ['source_hashes', 'context_hashes']) for (const name of new Set([...Object.keys(current[group]), ...Object.keys(saved?.[group] ?? {})])) {
    if (current[group][name] !== saved?.[group]?.[name]) changed.push(name);
  }
  if (saved && current.bundle_sha256 !== saved.bundle_sha256) changed.push('.notth/lock.json');
  return { status: !saved ? 'missing' : changed.length ? 'stale' : 'current', structured: current.local.structured,
    changed_sources: [...new Set(changed)].sort(), sources: Object.keys(current.source_hashes),
    knowledge_hash: saved?.knowledge_hash ?? null,
    note: 'Local declared-source freshness only; remote revisions and facts remain host-verified. Summaries do not override scoped instructions.' };
}
export function seed(root, { record = false, checkOnly = false } = {}) {
  assert(check(root).status === 'ok', 'Fix installation drift before seed');
  if (!record) {
    const report = knowledgeReport(root);
    return { ...report, status: checkOnly ? report.status === 'current' ? 'ok' : 'blocked' : 'planned', freshness: report.status,
      next_steps: ['Use /harness-start in your AI session; inspect changed/new sources, populate structured local.md and shared environment.json.',
        'Keep personal paths in ignored machine.json. Record only evidence-backed facts and already approved deviations.',
        'After reconciliation run aih seed --record; --check detects changes without updating the cache.'] };
  }
  return guard(root, () => {
    const current = state(root);
    assert(current.local.structured && current.local.value.sources?.length > 0, 'Populate structured local.md with inspected sources before recording knowledge');
    assert(Object.values(current.source_hashes).every(v => v !== null), 'Resolve missing knowledge sources before recording');
    const previous = savedKnowledge(root);
    const value = { schema_version: 1, source_hashes: current.source_hashes, context_hashes: current.context_hashes, bundle_sha256: current.bundle_sha256 };
    value.knowledge_hash = digest(encode(value));
    if (previous?.knowledge_hash !== value.knowledge_hash) transaction(root, { [KNOWLEDGE]: encode(value) });
    return { status: 'ok', path: KNOWLEDGE, knowledge_hash: value.knowledge_hash, changed: previous?.knowledge_hash !== value.knowledge_hash,
      note: 'Recorded host-reconciled source hashes; this does not certify summary correctness.' };
  });
}
