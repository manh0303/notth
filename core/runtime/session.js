import fs from 'node:fs';
import path from 'node:path';
import { safe, stat, digest, encode, isObject, SLUG, HarnessError, guard, transaction } from './files.js';
import { latest, freshness, validateCapture } from './provenance.js';

const MAX = 1024 * 1024;
const HASH = /^[a-f0-9]{64}$/;
const HOSTS = ['codex', 'claude-code', 'kiro'];
const requireThat = (ok, message) => { if (!ok) throw new HarnessError('Session runtime: ' + message); };
const text = value => typeof value === 'string' && value.trim().length > 0 && value.length <= 4096;
const change = id => { requireThat(typeof id === 'string' && SLUG.test(id) && id !== 'archive', 'invalid change ID'); return id; };
function read(root, name, limit = MAX) {
  const filename = safe(root, name), info = stat(filename);
  if (!info) return null;
  requireThat(info.isFile() && info.size <= limit, 'missing/oversized state file');
  return fs.readFileSync(filename);
}
function json(data) {
  try { return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(data)); }
  catch { throw new HarnessError('Session runtime: invalid state JSON'); }
}
export function runtimeIntegrity(root) {
  const bytes = read(root, '.notth/lock.json', 4 * MAX); requireThat(bytes, 'install NOTTH first');
  const lock = json(bytes);
  requireThat(lock.schema_version === 1 && isObject(lock.files) && digest(encode(lock.files)) === lock.bundle_sha256, 'invalid installation lock');
  for (const name of ['files.js', 'provenance.js', 'session.js', 'hook.js', 'package.json']) {
    const file = '.notth/core/runtime/' + name, data = read(root, file);
    requireThat(data && HASH.test(lock.files[file] ?? '') && digest(data) === lock.files[file], 'runtime is missing or modified; review update/check');
  }
  return lock;
}
function identity(root, host, sessionId) {
  requireThat(HOSTS.includes(host), 'unsupported host');
  requireThat(typeof sessionId === 'string' && /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(sessionId), 'invalid session identity');
  return { host, session_id: sessionId, workspace: digest(Buffer.from(fs.realpathSync(root))),
    path: '.notth/sessions/' + digest(Buffer.from(host + '\0' + sessionId)) + '.json' };
}
function binding(root, host, sessionId) {
  const id = identity(root, host, sessionId), bytes = read(root, id.path);
  if (!bytes) return { ...id, value: null, sha256: null };
  const row = json(bytes);
  requireThat(row.schema_version === 1 && row.host === host && row.session_id === sessionId
    && row.workspace === id.workspace && text(row.change_id), 'session binding belongs to another workspace or is malformed');
  change(row.change_id);
  return { ...id, value: row, sha256: digest(bytes) };
}
export function bindSession(root, { host, sessionId, changeId, expected } = {}) {
  return guard(root, () => {
    runtimeIntegrity(root); change(changeId);
    requireThat(read(root, 'openspec/changes/' + changeId + '/tasks.md'), 'binding requires existing tasks');
    const current = binding(root, host, sessionId);
    if (current.value?.change_id === changeId) return { status: 'ok', changed: false, binding: current.path, binding_sha256: current.sha256, change_id: changeId };
    requireThat(current.value ? expected === current.sha256 : expected === undefined, 'binding changed; reread before switching this session');
    const value = { schema_version: 1, host, session_id: sessionId, workspace: current.workspace, change_id: changeId };
    transaction(root, { [current.path]: encode(value) });
    return { status: 'ok', changed: true, binding: current.path, binding_sha256: digest(encode(value)), change_id: changeId };
  });
}
function candidates(root) {
  const folder = path.dirname(safe(root, 'openspec/changes/.session-probe'));
  if (!fs.existsSync(folder)) return [];
  const names = fs.readdirSync(folder).filter(id => SLUG.test(id) && id !== 'archive');
  requireThat(names.length <= 256, 'too many candidate tasks; pin an explicit change');
  return names.filter(id => read(root, 'openspec/changes/' + id + '/checkpoint.json') !== null).sort();
}
function redact(value, depth = 0) {
  requireThat(depth < 40, 'state nesting exceeds limit');
  if (typeof value === 'string') {
    requireThat(!/Bearer\s+[A-Za-z0-9._~-]{8,}|(?:password|api[_-]?key|access_token)\s*[:=]\s*(?!\[REDACTED\]|<REDACTED>)\S+/i.test(value), 'redact credentials before compacting');
  } else if (Array.isArray(value)) value.forEach(v => redact(v, depth + 1));
  else if (isObject(value)) for (const [key, item] of Object.entries(value)) {
    if (/^(password|secret|api[_-]?key|access[_-]?token|authorization|cookie|credentials?)$/i.test(key))
      requireThat(['[REDACTED]', '<REDACTED>'].includes(item), 'redact credential fields');
    redact(item, depth + 1);
  }
}
function sourceStates(root, context) {
  requireThat(Array.isArray(context.sources) && context.sources.length <= 64 && Array.isArray(context.links), 'invalid context source/trace lists');
  const manifestBytes = context.sources.some(s => s.source_id) ? read(root, 'docs/sources/manifest.json', 4 * MAX) : null;
  const catalog = manifestBytes ? json(manifestBytes) : null;
  if (catalog) requireThat([1, 2].includes(catalog.schema_version) && Array.isArray(catalog.sources), 'invalid source manifest');
  return context.sources.map(source => {
    requireThat(isObject(source) && text(source.id) && HASH.test(source.sha256 ?? '') && text(source.locator), 'invalid context source');
    requireThat(!/(?:^|\/)(?:\.git|node_modules|machine\.json|\.env(?:\.[^/]*)?)(?:\/|$)/.test(source.path), 'private context source');
    const bytes = read(root, source.path, 64 * MAX);
    let state = !bytes ? 'missing' : digest(bytes) === source.sha256 ? 'current' : 'changed', external = null;
    if (source.source_id) {
      const item = catalog?.sources.find(row => row.id === source.source_id);
      if (!item) state = 'superseded';
      else {
        requireThat(Array.isArray(item.revisions) && item.revisions.length > 0, 'invalid source revisions');
        const current = latest(item), paths = [current.revision.original, current.revision.normalizations?.at(-1)?.path];
        if (current.capture) validateCapture(current.capture, current.revision.sha256);
        if (!paths.includes(source.path) || current.capture && source.capture_sha256 !== current.capture.sha256) state = 'superseded';
        if (current.capture?.metadata.kind !== 'file' && current.capture) external = freshness(item);
      }
    }
    return { id: source.id, path: source.path, sha256: source.sha256, locator: source.locator, current_sha256: bytes ? digest(bytes) : null, state, external };
  });
}
export function compactionPlan(root, changeId, { budget = 8000 } = {}) {
  const lock = runtimeIntegrity(root); change(changeId);
  requireThat(Number.isSafeInteger(budget) && budget >= 1024 && budget <= 65536, 'budget must be 1024–65536 bytes');
  const base = 'openspec/changes/' + changeId + '/', inputs = {};
  const get = (name, parse = false, limit = MAX) => {
    const bytes = read(root, name, limit); inputs[name] = bytes === null ? null : digest(bytes);
    return bytes === null ? null : parse ? json(bytes) : new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  };
  const context = get(base + 'context.json', true), checkpoint = get(base + 'checkpoint.json', true);
  const decisions = get('.notth/decisions.json', true), local = get('.notth/local.md');
  requireThat(get(base + 'tasks.md') !== null, 'compaction requires existing tasks'); get(base + 'decisions.json'); get('AGENTS.md'); get('docs/sources/manifest.json', false, 4 * MAX);
  if (context) requireThat(context.schema_version === 1 && context.change_id === changeId && isObject(context.intent)
    && text(context.intent.problem) && text(context.intent.outcome), 'invalid task context');
  if (decisions) requireThat(decisions.schema_version === 1 && Array.isArray(decisions.decisions)
    && decisions.decisions.every(d => isObject(d) && ['confirmed', 'proposed', 'superseded'].includes(d.status)), 'invalid shared decisions');
  if (checkpoint) requireThat(checkpoint.schema_version === 1 && checkpoint.change_id === changeId
    && ['completed', 'pending', 'blockers', 'operations', 'baseline', 'external_sources'].every(k => Array.isArray(checkpoint[k]))
    && text(checkpoint.next_action) && text(checkpoint.summary), 'invalid checkpoint');
  const issues = [], sources = context ? sourceStates(root, context) : [];
  if (!context) issues.push('Task intent/source context is missing; inspect canonical task notes.');
  if (!checkpoint) issues.push('No checkpoint exists; inspect actual files before continuing.');
  for (const source of sources) if (source.state !== 'current' || source.external && source.external.state !== 'unchanged-at-check')
    issues.push('Reconcile source ' + source.id + ' (' + (source.state !== 'current' ? source.state : source.external.state) + ').');
  for (const ref of checkpoint?.baseline ?? []) {
    requireThat(isObject(ref) && HASH.test(ref.sha256 ?? ''), 'invalid checkpoint baseline');
    const bytes = read(root, ref.path, 64 * MAX); inputs[ref.path] = bytes ? digest(bytes) : null;
    if (!bytes || digest(bytes) !== ref.sha256) issues.push('Changed checkpoint baseline: ' + ref.path);
  }
  for (const op of checkpoint?.operations ?? []) {
    requireThat(isObject(op) && ['prepared','completed','unknown'].includes(op.status) && Array.isArray(op.evidence), 'invalid operation receipt');
    if (op.status === 'completed') requireThat(op.evidence.length > 0, 'completed operation lacks evidence');
  }
  for (const task of [...(checkpoint?.completed ?? []), ...(checkpoint?.operations ?? []).filter(op => op.status === 'completed')]) {
    requireThat(Array.isArray(task.evidence) && task.evidence.length > 0, 'completed task lacks evidence');
    for (const ref of task.evidence) {
      requireThat(isObject(ref) && HASH.test(ref.sha256 ?? ''), 'invalid evidence reference');
      const bytes = read(root, ref.path); inputs[ref.path] = bytes ? digest(bytes) : null;
      if (!bytes || digest(bytes) !== ref.sha256) issues.push('Reverify completed evidence: ' + ref.path);
    }
  }
  if (checkpoint?.external_sources.length) issues.push('Recheck external checkpoint sources against the current provider revision.');
  if (checkpoint?.operations.some(op => op.status !== 'completed')) issues.push('Inspect prepared/unknown operations before retrying side effects.');
  if (checkpoint?.blockers.length) issues.push('Resolve or scope around recorded blockers.');
  const changeDecisions = get(base + 'decisions.json', true);
  const payload = { schema_version: 1, kind: 'durable-state-capsule', change_id: changeId, bundle_sha256: lock.bundle_sha256,
    inputs, intent: context?.intent ?? null, local_facts: local, decisions, change_decisions: changeDecisions,
    trace: context?.links ?? [], sources, checkpoint, issues,
    boundary: 'Visible durable project state only. Native host owns conversation compaction. No internal reasoning, authority or remote execution is restored.' };
  redact(payload);
  const bytes = encode(payload), fits = bytes.length <= budget;
  return { status: !fits || issues.length ? 'blocked' : 'ok', change_id: changeId, budget_bytes: budget, required_bytes: bytes.length,
    fits, capsule_sha256: digest(bytes), capsule: fits ? payload : null, source: 'canonical project state', history_compacted: false,
    next_action: !fits ? 'Essential state exceeds budget; narrow task scope or raise the explicit budget. Nothing was dropped.'
      : issues.length ? 'Reconcile the listed issues before dependent work; current user authorization still applies.' : checkpoint.next_action };
}
export function recordCompaction(root, changeId, options = {}) {
  return guard(root, () => {
    const plan = compactionPlan(root, changeId, options);
    requireThat(plan.fits, 'essential context exceeds byte budget; no snapshot written');
    const base = 'openspec/changes/' + changeId + '/', name = base + 'compactions/' + plan.capsule_sha256 + '.json';
    const bytes = encode(plan.capsule), previous = read(root, name);
    requireThat(previous === null || previous.equals(bytes), 'immutable capsule collision');
    const pointer = base + 'compaction.json', value = encode({ schema_version: 1, path: name, sha256: plan.capsule_sha256 });
    const changes = {};
    if (previous === null) changes[name] = bytes;
    const oldPointer = read(root, pointer); if (!oldPointer?.equals(value)) changes[pointer] = value;
    if (Object.keys(changes).length) transaction(root, changes);
    return { ...plan, path: name, pointer, recorded: true, changed: Object.keys(changes).length > 0 };
  });
}
export function recoverSession(root, { host, sessionId, changeId, budget } = {}) {
  runtimeIntegrity(root);
  let selected = changeId, selection = changeId ? 'explicit' : null, current = null;
  if (host || sessionId) {
    current = binding(root, host, sessionId);
    if (!selected && current.value) { selected = current.value.change_id; selection = 'session-binding'; }
    requireThat(!selected || !current.value || selected === current.value.change_id, 'explicit task differs from pinned session; rebind with expected digest first');
  }
  const available = selected ? [] : candidates(root);
  if (!selected && available.length === 1) { selected = available[0]; selection = 'unique-checkpoint'; }
  if (!selected) return { status: 'blocked', selection: 'needs-selection', candidates: available, executed: false,
    binding_sha256: current?.sha256 ?? null, next_action: 'Pin the actual task from the user request; multiple/zero candidates are never resolved from shared start.json.' };
  const plan = compactionPlan(root, selected, { budget });
  const pointerBytes = read(root, 'openspec/changes/' + selected + '/compaction.json');
  let saved = null;
  if (pointerBytes) {
    const pointer = json(pointerBytes);
    requireThat(pointer.schema_version === 1 && HASH.test(pointer.sha256 ?? '')
      && pointer.path === 'openspec/changes/' + selected + '/compactions/' + pointer.sha256 + '.json', 'invalid capsule pointer');
    const bytes = read(root, pointer.path); requireThat(bytes && digest(bytes) === pointer.sha256, 'saved capsule integrity mismatch');
    saved = { path: pointer.path, current: pointer.sha256 === plan.capsule_sha256 };
  }
  return { ...plan, selection, saved_capsule: saved, binding_sha256: current?.sha256 ?? null, executed: false };
}
