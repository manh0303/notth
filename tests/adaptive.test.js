import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { install, newChange, saveCheckpoint, SOURCE, digest } from '../cli/harness.js';
import { resumePlan } from '../cli/checkpoint.js';
import { baselineRevision } from '../cli/adaptive.js';
let root;
const timestamp = '2026-10-20T00:00:00Z';
function write(name, value) { fs.mkdirSync(path.dirname(path.join(root, name)), { recursive: true }); fs.writeFileSync(path.join(root, name), typeof value === 'string' ? value : JSON.stringify(value)); }
const ref = name => ({ path: name, sha256: digest(fs.readFileSync(path.join(root, name))) });
beforeEach(() => { root = fs.mkdtempSync(path.join(os.tmpdir(), 'notth-adaptive-')); install(root, SOURCE); newChange(root, 'alpha'); write('code.js', 'export const result = 1;'); write('requirements.md', 'Result must equal 2'); write('failure.txt', 'Observed result 1 instead of 2'); });
afterEach(() => fs.rmSync(root, { recursive: true, force: true }));
function checkpoint() {
  return { schema_version: 1, change_id: 'alpha', phase: 'implementation', summary: 'Investigate result', timestamp,
    baseline: [ref('code.js'), ref('requirements.md')], completed: [], pending: [{ id: 'fix', summary: 'Correct result' }], in_progress: null,
    blockers: [], external_sources: [], operations: [], next_action: 'Inspect observed failure',
    adaptive: { schema_version: 1, phase: 'plan', objective: ref('requirements.md'), acceptance: [ref('requirements.md')],
      limits: { max_attempts_per_step: 3, max_replans: 2, max_no_progress: 2 }, events: [] } };
}
function save(row, expected) { write('checkpoint-input.json', row); return saveCheckpoint(root, 'alpha', 'checkpoint-input.json', expected).checkpoint_sha256; }
function attempt(row, id, extra = {}) { return { id, kind: 'attempt', step_id: 'fix', action: 'regression', outcome: 'failed', reason: 'Observed assertion failure', evidence: [ref('failure.txt')], baseline: row.baseline, timestamp, ...extra }; }
function success(row) {
  write('observed.json', { value: 2 });
  const report = { schema_version: 1, metadata: { run_id: 'fixture', feature: 'Result', source_revision: baselineRevision(row.baseline), environment: 'isolated fixture', producer: 'node:test', timestamp },
    requirements: [{ id: 'AC-1', description: 'Result equals 2', source: 'requirements.md' }],
    scenarios: [{ id: 'result', status: 'PASSED', executed: true, references: ['AC-1'], method: 'unit', preconditions: ['isolated source'], fixture: 'result fixture', steps: ['Evaluate result'], expected: '2', observed: '2', timestamp,
      mutates: false, cleanup: { strategy: 'No mutation', status: 'PASSED' },
      execution: { tool: 'node:test', command: ['node', '--test'], exit_code: 0, timeout_ms: 5000, attempts: 1, max_attempts: 1 }, evidence: [ref('observed.json')],
      assertions: [{ id: 'value', basis: 'AC-1', layer: 'result', operator: 'equal', expected: 2, actual: { evidence: 'observed.json', pointer: '/value' } }] }] };
  write('verification.json', report);
  return attempt(row, 'success', { outcome: 'passed', reason: 'Observed corrected result', evidence: [ref('verification.json')], verification: ref('verification.json'), retry: { safe: true, reason: 'Read-only regression after source correction' } });
}
test('failure -> justified replan -> verified current revision survives a fresh recovery read', () => {
  const row = checkpoint(); let expected = save(row);
  row.adaptive.phase = 'observe'; row.adaptive.events.push(attempt(row, 'first')); expected = save(row, expected);
  assert.equal(resumePlan(root, 'alpha').adaptive.no_progress, 1);
  row.adaptive.phase = 'replan'; row.adaptive.events.push({ id: 'investigate', kind: 'replan', reason: 'Use observed failure to correct the return value', evidence: [ref('failure.txt')], timestamp }); expected = save(row, expected);
  write('code.js', 'export const result = 2;'); row.baseline = [ref('code.js'), ref('requirements.md')];
  row.adaptive.events.push(success(row)); row.adaptive.phase = 'complete';
  row.completed = [{ id: 'fix', summary: 'Correct result', evidence: [ref('verification.json')] }]; row.pending = [];
  save(row, expected);
  const recovery = resumePlan(root, 'alpha'); assert.equal(recovery.revalidate_required, false); assert.equal(recovery.adaptive.verified_scope, true);
  assert.equal(recovery.adaptive.replans, 1); assert.equal(recovery.adaptive.attempts.fix, 2);
  write('code.js', 'export const result = 3;'); assert.equal(resumePlan(root, 'alpha').status, 'blocked');
  assert.throws(() => save(row, resumePlan(root, 'alpha').checkpoint_sha256), /completion needs current/);
});
test('retry budgets, no-progress guard, history and CAS cannot be silently reset', () => {
  const row = checkpoint(); row.adaptive.events.push(attempt(row, 'first')); let expected = save(row);
  row.adaptive.events.push(attempt(row, 'second')); assert.throws(() => save(row, expected), /safe retry/);
  row.adaptive.events[1].retry = { safe: true, reason: 'Transient read-only test fixture failure investigated' }; expected = save(row, expected);
  row.adaptive.events.push(attempt(row, 'third', { retry: { safe: true, reason: 'Repeat safely' } })); assert.throws(() => save(row, expected), /no-progress/); row.adaptive.events.pop();
  row.adaptive.limits.max_no_progress = 20; assert.throws(() => save(row, expected), /budgets/); row.adaptive.limits.max_no_progress = 2;
  row.adaptive.events.pop(); assert.throws(() => save(row, expected), /preserve history/);
  assert.throws(() => save(checkpoint(), '0'.repeat(64)), /changed/);
});
test('unverified attempts, old revision reports and unsafe external retries cannot complete', () => {
  const row = checkpoint(); let expected = save(row);
  row.adaptive.events.push(attempt(row, 'first', { outcome: 'passed' })); assert.throws(() => save(row, expected), /verification/); row.adaptive.events = [];
  const event = success(row); write('code.js', 'different revision'); event.baseline = [ref('code.js'), ref('requirements.md')];
  row.adaptive.events.push(event); assert.throws(() => save(row, expected), /revision mismatch/); row.adaptive.events = [];
  row.operations = [{ id: 'pr', action: 'Create PR', target: 'repository', status: 'unknown', evidence: [] }]; expected = save(row, expected);
  row.adaptive.events.push(attempt(row, 'external', { operation_id: 'pr' })); assert.throws(() => save(row, expected), /uncertain external/);
});
test('lost verification evidence yields an actionable blocked recovery without deleting progress', () => {
  const row = checkpoint(); row.adaptive.events.push(success(row)); row.adaptive.phase = 'complete';
  row.completed = [{ id: 'fix', summary: 'Correct result', evidence: [ref('verification.json')] }]; row.pending = []; save(row);
  fs.unlinkSync(path.join(root, 'observed.json'));
  const recovery = resumePlan(root, 'alpha'); assert.equal(recovery.status, 'blocked'); assert.equal(recovery.completed.length, 1);
  assert.equal(recovery.adaptive.verified_scope, false); assert.equal(recovery.revalidate_required, true);
});
test('legacy checkpoint without adaptive state remains readable and optional state cannot be dropped', () => {
  const row = checkpoint(); delete row.adaptive; let expected = save(row); assert.equal(resumePlan(root, 'alpha').adaptive, null);
  row.adaptive = checkpoint().adaptive; expected = save(row, expected); delete row.adaptive;
  assert.throws(() => save(row, expected), /discard adaptive/);
});
