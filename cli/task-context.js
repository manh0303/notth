import fs from 'node:fs';
import { safe, stat, digest, encode, isObject, SLUG, HarnessError } from './files.js';
import { check, guard, transaction } from './harness.js';
import { loadStartConfig } from './start-config.js';
import { projectDecisionReport } from './project-decisions.js';
import { sourceReport } from './sources.js';
import { redacted } from './verification-report.js';

const LIMIT = 256 * 1024;
const HASH = /^[a-f0-9]{64}$/;
const ID = /^[A-Za-z][A-Za-z0-9_-]{0,63}$/;
const text = v => typeof v === 'string' && v.trim().length > 0 && v.length <= 2048 && !/[\x00-\x1f\x7f]/.test(v);
const requireThat = (ok, message) => { if (!ok) throw new HarnessError('Task context: ' + message); };
function fields(row, names) {
  requireThat(isObject(row) && Object.keys(row).every(k => names.includes(k)), 'unexpected fields');
}
function bytes(root, name, limit = LIMIT) {
  const filename = safe(root, name), info = stat(filename);
  if (!info) return null;
  requireThat(info.isFile() && info.size <= limit, 'file exceeds size limit');
  return fs.readFileSync(filename);
}
function json(data) {
  try { return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(data)); }
  catch { throw new HarnessError('Task context: invalid UTF-8 JSON'); }
}
export function contextPath(id) {
  requireThat(typeof id === 'string' && SLUG.test(id) && id !== 'archive', 'invalid change ID');
  return 'openspec/changes/' + id + '/context.json';
}
function referencePath(root, name) {
  safe(root, name);
  requireThat(!/(?:^|\/)(?:\.git|node_modules|\.env(?:\.[^/]*)?|machine\.json|backups)(?:\/|$)/.test(name), 'private reference path');
}
export function validateTaskContext(root, id, row) {
  fields(row, ['schema_version', 'change_id', 'revision', 'intent', 'sources', 'links', 'task_backend']);
  requireThat(row.schema_version === 1 && row.change_id === id && Number.isSafeInteger(row.revision) && row.revision >= 0, 'schema/change/revision');
  fields(row.intent, ['problem', 'outcome']);
  requireThat(text(row.intent.problem) && text(row.intent.outcome), 'problem and outcome required');
  requireThat(Array.isArray(row.sources) && row.sources.length > 0 && row.sources.length <= 64, '1–64 sources required');
  const sources = new Set();
  for (const source of row.sources) {
    fields(source, ['id', 'path', 'sha256', 'locator', 'source_id', 'capture_sha256']);
    requireThat(typeof source.id === 'string' && ID.test(source.id) && !sources.has(source.id)
      && typeof source.sha256 === 'string' && HASH.test(source.sha256) && text(source.locator), 'source ID/hash/locator');
    referencePath(root, source.path);
    requireThat(source.path !== contextPath(id) && !source.path.includes('/context-history/'), 'self/history reference');
    if (/^docs\/sources\/(originals|normalized)\//.test(source.path)) requireThat(source.source_id !== undefined, 'preserved source requires source_id');
    if (source.source_id !== undefined) requireThat(typeof source.source_id === 'string' && SLUG.test(source.source_id) && source.source_id.length <= 64, 'source catalog ID');
    if (source.capture_sha256 !== undefined) requireThat(source.source_id !== undefined && typeof source.capture_sha256 === 'string' && HASH.test(source.capture_sha256), 'capture hash needs catalog source');
    sources.add(source.id);
  }
  requireThat(Array.isArray(row.links) && row.links.length > 0 && row.links.length <= 128, '1–128 trace links required');
  const links = new Map();
  for (const link of row.links) {
    fields(link, ['id', 'kind', 'source_refs', 'depends_on']);
    requireThat(typeof link.id === 'string' && ID.test(link.id) && !links.has(link.id)
      && ['painpoint', 'requirement', 'decision', 'task', 'evidence'].includes(link.kind), 'trace ID/kind');
    requireThat(Array.isArray(link.source_refs) && link.source_refs.length > 0 && link.source_refs.length <= 64
      && new Set(link.source_refs).size === link.source_refs.length && link.source_refs.every(ref => sources.has(ref)), 'trace source references');
    requireThat(Array.isArray(link.depends_on) && link.depends_on.length <= 128 && new Set(link.depends_on).size === link.depends_on.length, 'dependencies');
    links.set(link.id, link);
  }
  const visiting = new Set(), visited = new Set();
  function visit(link) {
    requireThat(!visiting.has(link.id), 'dependency cycle');
    if (visited.has(link.id)) return;
    visiting.add(link.id);
    for (const dep of link.depends_on) { requireThat(links.has(dep), 'unknown dependency'); visit(links.get(dep)); }
    visiting.delete(link.id); visited.add(link.id);
  }
  for (const link of links.values()) visit(link);
  // Older context sidecars may retain a retired backend declaration. It grants no behavior.
  if (row.task_backend !== undefined) {
    fields(row.task_backend, ['kind', 'issue_id']);
    requireThat(text(row.task_backend.kind) && (row.task_backend.issue_id === undefined || text(row.task_backend.issue_id)), 'legacy backend declaration');
  }
  redacted(row);
  return row;
}
function inspect(root, row) {
  const catalog = row.sources.some(s => s.source_id) ? sourceReport(root).sources : [];
  const sources = row.sources.map(source => {
    const data = bytes(root, source.path, 64 * 1024 * 1024);
    let state = data === null ? 'missing' : digest(data) === source.sha256 ? 'current' : 'changed';
    let external = null;
    if (source.source_id) {
      const entry = catalog.find(item => item.id === source.source_id);
      // Match the current path as well as its bytes: old preserved snapshots must become stale.
      if (!entry || ![entry.original, entry.normalized].includes(source.path)
        || entry.capture_sha256 && source.capture_sha256 !== entry.capture_sha256) state = 'superseded';
      if (entry?.provenance && entry.provenance.kind !== 'file') external = { capture_sha256: entry.capture_sha256,
        provenance: entry.provenance, freshness: entry.freshness };
    }
    return { ...source, state, external, current_sha256: data === null ? null : digest(data) };
  });
  const affected = new Set();
  const stale = new Set(sources.filter(needsReconciliation).map(s => s.id));
  for (let i = 0; i < row.links.length; i++) {
    for (const link of row.links) if (link.source_refs.some(ref => stale.has(ref)) || link.depends_on.some(ref => affected.has(ref))) affected.add(link.id);
  }
  return { sources, affected_links: [...affected] };
}
function needsReconciliation(source) {
  return source.state !== 'current' || source.external && source.external.freshness.state !== 'unchanged-at-check';
}
export function taskContextReport(root, changeId) {
  requireThat(check(root).status === 'ok', 'fix installation drift first');
  const saved = loadStartConfig(root), id = changeId ?? saved?.change_id;
  const shared = { namespace_migration: stat(safe(root, '.notth/namespace-migration.json')) ? '.notth/namespace-migration.json' : null, decisions: projectDecisionReport(root), local: '.notth/local.md',
    authority: 'Context is source-linked guidance, not approval. Read canonical sections; inspect external revisions in the host.' };
  if (!id) return { status: 'planned', configured: false, change_id: null, shared,
    next_action: 'Match the current user request to existing task notes/changes; do not pick a task from directory order or create a full spec for a Quick task.' };
  const name = contextPath(id), data = bytes(root, name);
  const base = 'openspec/changes/' + id + '/';
  const pointers = ['proposal.md', 'design.md', 'tasks.md', 'decisions.json', 'checkpoint.json']
    .filter(file => stat(safe(root, base + file))).map(file => base + file);
  const selection = changeId ? 'explicit' : 'saved-hint';
  if (data === null) return { status: 'planned', configured: false, change_id: id, selection, path: name, shared, pointers,
    next_action: 'Read the existing task intent/sources and checkpoint; host records a context sidecar after inspection. A saved task is a hint, never an instruction to switch another session.' };
  const row = validateTaskContext(root, id, json(data)), inspection = inspect(root, row);
  return { status: inspection.affected_links.length || inspection.sources.some(needsReconciliation) ? 'blocked' : 'ok', configured: true,
    change_id: id, selection, path: name, context_sha256: digest(data), revision: row.revision,
    intent: row.intent, ...inspection, links: row.links, shared, pointers,
    next_action: inspection.sources.some(needsReconciliation) ? 'Reconcile changed/missing/superseded sources and affected links before dependent work; preserve unrelated work.'
      : 'Read referenced canonical sections and checkpoint, verify applicability to this request, then continue authorized work. Local hashes do not prove semantic accuracy or remote freshness.' };
}
export function saveTaskContext(root, id, report, expected) {
  return guard(root, () => {
    requireThat(check(root).status === 'ok', 'fix installation drift first');
    const name = contextPath(id);
    requireThat(stat(safe(root, 'openspec/changes/' + id + '/tasks.md'))?.isFile(), 'existing change tasks required');
    const input = bytes(root, report);
    requireThat(input !== null && report !== name, 'use a separate host-prepared report');
    const row = validateTaskContext(root, id, json(input)), previous = bytes(root, name);
    const old = previous === null ? null : validateTaskContext(root, id, json(previous));
    requireThat(previous === null ? expected === undefined && row.revision === 0
      : typeof expected === 'string' && HASH.test(expected) && digest(previous) === expected && row.revision === old.revision,
    'context changed; re-read and reconcile before supplying --expected digest/revision');
    const inspection = inspect(root, row);
    requireThat(inspection.sources.every(s => s.state === 'current'), 'reconcile source hashes/current catalog revisions before saving');
    const { task_backend: retiredBackend, ...active } = row;
    const next = { ...active, revision: row.revision + 1 }, changes = { [name]: encode(next) };
    if (previous) {
      const history = 'openspec/changes/' + id + '/context-history/' + digest(previous) + '.json', existing = bytes(root, history);
      requireThat(existing === null || existing.equals(previous), 'history collision');
      if (existing === null) changes[history] = previous;
    }
    transaction(root, changes);
    return { status: 'ok', path: name, context_sha256: digest(encode(next)), revision: next.revision, executed: false };
  });
}
