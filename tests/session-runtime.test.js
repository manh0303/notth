import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { install, newChange, SOURCE, digest, check } from '../cli/harness.js';
import { compactionPlan, recordCompaction, recoverSession, bindSession } from '../core/runtime/session.js';
import { runHook } from '../core/runtime/hook.js';
let root;
const write = (name, value) => { const file = path.join(root, name); fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, typeof value === 'string' ? value : JSON.stringify(value)); };
function seed(id = 'alpha') {
  newChange(root, id);
  const base = 'openspec/changes/' + id + '/';
  write(base + 'context.json', { schema_version: 1, change_id: id, intent: { problem: 'Lost accepted constraints', outcome: 'Resume the correct task' },
    sources: [{ id: 'request', path: base + 'proposal.md', locator: 'Why', sha256: digest(fs.readFileSync(path.join(root, base + 'proposal.md'))) }],
    links: [{ id: 'REQ-1', kind: 'requirement', source_refs: ['request'], depends_on: [] }] });
  write(base + 'checkpoint.json', { schema_version: 1, change_id: id, phase: 'implementation', timestamp: new Date().toISOString(), summary: 'Task accepted', next_action: 'Implement regression',
    baseline: [], completed: [], pending: [{ id: 'test', summary: 'Implement regression' }], in_progress: null, blockers: [], external_sources: [], operations: [] });
}
beforeEach(() => { root = fs.mkdtempSync(path.join(os.tmpdir(), 'notth-runtime-')); install(root, SOURCE, { host: 'codex', sessionHooks: true }); seed(); });
afterEach(() => fs.rmSync(root, { recursive: true, force: true }));
test('capsules preserve intent, decisions, evidence and pending work without transcript or reasoning state', () => {
  write('.notth/decisions.json', { schema_version: 1, decisions: [{ id: 'one', status: 'confirmed', summary: 'Preserve sources' }, { id: 'two', status: 'proposed', summary: 'Unaccepted option' }] });
  const plan = compactionPlan(root, 'alpha'); assert.equal(plan.status, 'ok'); assert.equal(plan.history_compacted, false);
  assert.equal(plan.capsule.decisions.decisions[1].status, 'proposed'); assert.equal(plan.capsule.checkpoint.pending[0].id, 'test');
  assert.equal(plan.capsule.trace[0].id, 'REQ-1'); assert.equal(plan.capsule.sources[0].state, 'current');
  const first = recordCompaction(root, 'alpha'); assert.equal(first.recorded, true); assert.equal(recordCompaction(root, 'alpha').changed, false);
  assert.equal(recoverSession(root).saved_capsule.current, true);
  write('openspec/changes/alpha/proposal.md', 'Changed request');
  const recovery = recoverSession(root); assert.equal(recovery.status, 'blocked'); assert.equal(recovery.saved_capsule.current, false);
  assert.equal(recovery.capsule.sources[0].state, 'changed');
  assert.equal(fs.existsSync(path.join(root, first.path)), true);
});
test('budget overflow and credentials refuse snapshots without dropping facts', () => {
  assert.equal(compactionPlan(root, 'alpha', { budget: 1024 }).capsule, null);
  assert.throws(() => recordCompaction(root, 'alpha', { budget: 1024 }), /budget/);
  assert.equal(fs.existsSync(path.join(root, 'openspec/changes/alpha/compaction.json')), false);
  write('.notth/local.md', 'api_key=secret-value'); assert.throws(() => compactionPlan(root, 'alpha'), /redact/);
});
test('session scope resists global hints, ambiguous task choice, stale rebind and copied workspace', () => {
  bindSession(root, { host: 'codex', sessionId: 'native-one', changeId: 'alpha' }); seed('beta');
  write('.notth/start.json', { change_id: 'beta' });
  assert.equal(recoverSession(root, { host: 'codex', sessionId: 'native-one' }).change_id, 'alpha');
  assert.equal(recoverSession(root, { host: 'codex', sessionId: 'native-two' }).selection, 'needs-selection');
  assert.throws(() => bindSession(root, { host: 'codex', sessionId: 'native-one', changeId: 'beta' }), /reread/);
  const observed = recoverSession(root, { host: 'codex', sessionId: 'native-one' }).binding_sha256;
  bindSession(root, { host: 'codex', sessionId: 'native-one', changeId: 'beta', expected: observed });
  assert.throws(() => recoverSession(root, { host: 'codex', sessionId: 'native-one', changeId: 'alpha' }), /differs/);
  assert.throws(() => bindSession(root, { host: 'codex', sessionId: '../escape', changeId: 'alpha' }), /identity/);
  const copy = root + '-copy'; fs.cpSync(root, copy, { recursive: true });
  try { assert.throws(() => recoverSession(copy, { host: 'codex', sessionId: 'native-one' }), /another workspace/); }
  finally { fs.rmSync(copy, { recursive: true, force: true }); }
});
test('completed evidence, external checks and unknown side effects require reconciliation', () => {
  const file = path.join(root, 'openspec/changes/alpha/checkpoint.json'), row = JSON.parse(fs.readFileSync(file));
  write('evidence.md', 'Passed');
  row.operations = [{ id: 'write', action: 'remote write', target: 'test', status: 'completed', evidence: [{ path: 'evidence.md', sha256: digest(Buffer.from('Passed')) }] }];
  write('openspec/changes/alpha/checkpoint.json', row); assert.equal(compactionPlan(root, 'alpha').status, 'ok');
  write('evidence.md', 'Changed'); assert.equal(compactionPlan(root, 'alpha').status, 'blocked');
  row.operations[0].status = 'unknown'; write('openspec/changes/alpha/checkpoint.json', row);
  assert.match(compactionPlan(root, 'alpha').capsule.issues.join(), /unknown/);
});
test('native lifecycle command works offline in a CommonJS project and a subdirectory across processes', async () => {
  write('package.json', { type: 'commonjs' }); fs.mkdirSync(path.join(root, 'nested'));
  const hooks = JSON.parse(fs.readFileSync(path.join(root, '.codex/hooks.json'))).hooks;
  function invoke(event) {
    const command = hooks[event][0].hooks[0].command;
    const result = spawnSync(command, { shell: true, cwd: path.join(root, 'nested'), input: JSON.stringify({ hook_event_name: event, session_id: 'real-session', cwd: root, transcript_path: '/never-read' }), encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr); return JSON.parse(result.stdout);
  }
  assert.match(invoke('SessionStart').hookSpecificOutput.additionalContext, /Resume the correct task/);
  invoke('PreCompact'); invoke('Stop');
  assert.equal(recoverSession(root, { host: 'codex', sessionId: 'real-session' }).saved_capsule.current, true);
  const sessions = fs.readdirSync(path.join(root, '.notth/sessions'), { withFileTypes: true }).filter(d => d.isDirectory());
  assert.equal(fs.readdirSync(path.join(root, '.notth/sessions', sessions[0].name, 'events')).length, 3);
  assert.equal(check(root).status, 'ok');
  await assert.rejects(runHook('codex', root, { hook_event_name: 'SessionStart', session_id: 'outside', cwd: os.tmpdir() }), /outside/);
});
test('hook settings merge preserves other handlers and backups, rejects drift, and update is idempotent', () => {
  const other = { permissions: { allow: ['Read'] }, hooks: { SessionStart: [{ matcher: 'startup', hooks: [{ type: 'command', command: 'echo user-owned' }] }] } };
  write('.claude/settings.local.json', other);
  install(root, SOURCE, { command: 'update', host: 'claude-code', sessionHooks: true, dryRun: true });
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(root, '.claude/settings.local.json'))), other);
  assert.equal(fs.existsSync(path.join(root, '.notth/backups')), false);
  install(root, SOURCE, { command: 'update', host: 'claude-code', sessionHooks: true });
  const merged = JSON.parse(fs.readFileSync(path.join(root, '.claude/settings.local.json')));
  assert.deepEqual(merged.permissions, other.permissions); assert.deepEqual(merged.hooks.SessionStart[0], other.hooks.SessionStart[0]);
  assert.equal(fs.readdirSync(path.join(root, '.notth/backups')).some(n => n.startsWith('session-hooks-')), true);
  const bytes = fs.readFileSync(path.join(root, '.claude/settings.local.json'));
  install(root, SOURCE, { command: 'update', host: 'claude-code', sessionHooks: true }); assert.deepEqual(fs.readFileSync(path.join(root, '.claude/settings.local.json')), bytes);
  merged.hooks.Stop[0].hooks[0].timeout = 99; write('.claude/settings.local.json', merged);
  assert.throws(() => install(root, SOURCE, { command: 'update', host: 'claude-code', sessionHooks: true }), /differs/);
});
test('runtime edits and capsule tampering fail closed; CLI flags reach runtime', () => {
  const result = spawnSync(process.execPath, [path.join(SOURCE, 'bin/aih.js'), 'compact', 'alpha', '--budget', '65536', '--record'], { cwd: root, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  const saved = JSON.parse(result.stdout); write(saved.path, '{}'); assert.throws(() => recoverSession(root), /integrity/);
  write('.notth/core/runtime/session.js', '// edited'); assert.throws(() => compactionPlan(root, 'alpha'), /modified/);
});
