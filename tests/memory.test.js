import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { install, newChange, saveCheckpoint, SOURCE, digest, check } from '../cli/harness.js';
import { saveTaskContext } from '../cli/task-context.js';
import { memoryReport, handoffReport, memoryReference } from '../cli/memory.js';
let root;
const base = 'openspec/changes/alpha/';
function write(name, value) { fs.mkdirSync(path.dirname(path.join(root, name)), { recursive: true }); fs.writeFileSync(path.join(root, name), typeof value === 'string' ? value : JSON.stringify(value)); }
const hash = name => digest(fs.readFileSync(path.join(root, name)));
beforeEach(() => { root = fs.mkdtempSync(path.join(os.tmpdir(), 'notth-memory-')); install(root, SOURCE); newChange(root, 'alpha'); });
afterEach(() => fs.rmSync(root, { recursive: true, force: true }));
function task() {
  write('context-input.json', { schema_version: 1, change_id: 'alpha', revision: 0,
    intent: { problem: 'Lost continuity', outcome: 'Retain accepted constraints' },
    sources: [{ id: 'request', path: base + 'proposal.md', sha256: hash(base + 'proposal.md'), locator: 'Scope and constraints' }],
    links: [{ id: 'REQ-1', kind: 'requirement', source_refs: ['request'], depends_on: [] }] });
  saveTaskContext(root, 'alpha', 'context-input.json');
  write('receipt.md', 'Observed first step');
  write('checkpoint-input.json', { schema_version: 1, change_id: 'alpha', phase: 'verify', summary: 'Implementation prepared', next_action: 'Run regression',
    timestamp: new Date().toISOString(), baseline: [{ path: base + 'proposal.md', sha256: hash(base + 'proposal.md') }],
    completed: [{ id: 'inspect', summary: 'Inspect baseline', evidence: [{ path: 'receipt.md', sha256: hash('receipt.md') }] }],
    pending: [{ id: 'verify', summary: 'Run regression' }], in_progress: null, blockers: [], external_sources: [],
    operations: [{ id: 'pr', action: 'Create PR', target: 'repository', status: 'unknown', evidence: [] }] });
  saveCheckpoint(root, 'alpha', 'checkpoint-input.json');
}
test('derived retrieval has stable IDs, bounded bytes, no copied document bodies and no writes', () => {
  task(); const before = hash(base + 'context.json');
  const report = memoryReport(root, { changeId: 'alpha', query: 'constraints', budget: 2048 });
  assert.ok(report.budget.used <= 2048); assert.ok(report.budget.omitted > 0);
  assert.ok(report.records.some(r => r.id === 'working:context'));
  assert.equal(JSON.stringify(report).includes('Lost continuity'), false);
  assert.equal(hash(base + 'context.json'), before);
  const cli = spawnSync(process.execPath, [path.join(SOURCE, 'bin/aih.js'), 'memory', '--change', 'alpha', '--query', 'constraints', '--budget', '2048'], { cwd: root, encoding: 'utf8' });
  assert.equal(cli.status, 0, cli.stderr);
  assert.deepEqual(JSON.parse(cli.stdout), report);
  assert.equal(check(root).status, 'ok');
});
test('fresh host gets canonical accepted scope, completed steps and uncertain effects without transcripts', () => {
  task(); const run = spawnSync(process.execPath, [path.join(SOURCE, 'bin/aih.js'), 'handoff', 'alpha', '--budget', '65536'], { cwd: root, encoding: 'utf8' });
  const report = JSON.parse(run.stdout); assert.equal(report.complete, true);
  assert.equal(report.intent.problem, 'Lost continuity'); assert.equal(report.accepted_scope[0].id, 'REQ-1');
  assert.equal(report.checkpoint.completed[0].id, 'inspect'); assert.equal(report.host_capabilities, 'UNVERIFIED');
  assert.equal(report.status, 'blocked'); assert.match(report.next_action, /actual operation/);
  assert.equal(report.checkpoint.operations_to_reconcile[0].status, 'unknown');
  write(base + 'proposal.md', 'Changed accepted scope');
  const changed = handoffReport(root, 'alpha', { budget: 65536 });
  assert.equal(changed.checkpoint.revalidate_required, true);
  assert.ok(memoryReport(root, { changeId: 'alpha' }).records.some(r => r.id === 'task-source:request' && r.freshness === 'stale'));
});
test('missing state, budget overflow and unsafe paths are explicit; legacy snapshots remain valid', () => {
  assert.equal(handoffReport(root, 'alpha').intent, null);
  assert.equal(memoryReport(root).status, 'ok');
  task(); const compact = handoffReport(root, 'alpha', { budget: 1024 });
  assert.equal(compact.complete, false); assert.equal(compact.status, 'blocked');
  assert.ok(compact.required_bytes > compact.budget_bytes);
  for (const name of ['../escape', '.env', '.notth/machine.json', '.git/config']) assert.throws(() => memoryReference(root, name));
  assert.throws(() => memoryReport(root, { budget: -1 }));
  const before = hash(base + 'checkpoint.json'); install(root, SOURCE, { command: 'update', host: 'claude-code' });
  assert.equal(hash(base + 'checkpoint.json'), before); assert.equal(check(root).status, 'ok');
});
