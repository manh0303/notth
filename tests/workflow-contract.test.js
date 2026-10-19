import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { install, SOURCE } from '../cli/harness.js';
import { ready } from '../cli/readiness.js';
import { validateWorkflow, loadWorkflow, workflowReport, CHECKS } from '../cli/workflow.js';
import { registeredRoles } from '../cli/agents.js';
import { runConformance, assertionsFor, processRun } from '../scripts/conformance-runner.js';
import { scoreDataset } from '../scripts/score-eval.js';

function fixture(t, options = {}) { const root = fs.mkdtempSync(path.join(os.tmpdir(), 'aih-contract-')); t.after(() => fs.rmSync(root, { recursive: true, force: true })); install(root, SOURCE, options); return root; }
function write(root, p, content) { const file = path.join(root, p); fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, typeof content === 'string' ? content : JSON.stringify(content)); }
const roles = new Set(Object.keys(registeredRoles(SOURCE, ['product'])));
test('contracts validate all eight stages, registered roles and schema/check parity', () => {
  assert.equal(workflowReport(SOURCE, ['product']).workflows.length, 2);
  for (const id of ['spec-to-code', 'idea-to-prd']) assert.equal(loadWorkflow(SOURCE, id, ['product']).stages.length, 8);
  const schema = JSON.parse(fs.readFileSync(path.join(SOURCE, 'core/workflows/workflow.schema.json')));
  assert.deepEqual(schema.properties.stages.items.properties.entry_gate.properties.deterministic.items.enum, CHECKS);
});
test('validator rejects unknown owners/checks/edges, duplicate stages and forward cycles; accepts failure loops', () => {
  const base = loadWorkflow(SOURCE, 'spec-to-code');
  for (const edit of [d => d.stages.push(d.stages[0]), d => d.stages[0].owner = 'core:missing', d => d.stages[0].next = ['missing'], d => d.stages[0].entry_gate = { deterministic: ['missing'] }, d => d.stages[7].next = ['discover'], d => d.stages[0].entry_gate = { approval_from: 'specify' }, d => d.stages[0].outputs = ['../unsafe']]) {
    const doc = structuredClone(base); edit(doc); assert.throws(() => validateWorkflow(doc, roles));
  }
  const doc = structuredClone(base); doc.stages[4].on_fail = 'implement'; validateWorkflow(doc, roles);
});
test('legacy readiness survives; full workflow enforces recorded approval without identity claims', t => {
  const root = fixture(t), base = 'openspec/changes/demo/';
  for (const p of ['proposal.md', 'design.md']) write(root, base + p, '# Accepted behavior\n');
  write(root, base + 'tasks.md', '- [ ] Build behavior\n');
  write(root, base + 'specs/demo/spec.md', '### Requirement: Demo\n#### Scenario: Demo\nWHEN called\nTHEN return outcome\n');
  write(root, base + 'decisions.json', { schema_version: 1, reviewed: true, decisions: [] });
  assert.equal(ready(root, 'demo').status, 'ready');
  assert.equal(ready(root, 'demo', 'review-spec').status, 'ready');
  assert.match(ready(root, 'demo', 'implement', 'spec-to-code').problems.join(), /approval/);
  assert.match(ready(root, 'demo', 'implement', 'spec-to-code').next_steps[0], /gaps/);
  const approval = { stage: 'review-spec', role: 'spec-owner', by: 'Owner declaration', at: '2026-10-14T07:00:00Z', source_ref: 'review-ticket:123' };
  write(root, base + 'approvals.json', { schema_version: 1, workflow: 'spec-to-code', approvals: [approval] });
  assert.equal(ready(root, 'demo', 'implement', 'spec-to-code').status, 'ready');
  assert.match(ready(root, 'demo', 'implement', 'spec-to-code').note, /not authenticated/);
  for (const overrides of [{ workflow: 'idea-to-prd' }, { approvals: [approval, approval] }, { approvals: [{ ...approval, role: 'reviewer' }] }]) {
    write(root, base + 'approvals.json', { schema_version: 1, workflow: 'spec-to-code', approvals: [approval], ...overrides });
    assert.throws(() => ready(root, 'demo', 'implement', 'spec-to-code'));
  }
  write(root, base + 'approvals.json', { schema_version: 1, workflow: 'spec-to-code', approvals: [approval] });
  assert.equal(ready(root, 'demo', 'verify').status, 'blocked');
  assert.match(ready(root, 'demo', 'discover').next_steps[0], /Enter discover/);
  assert.throws(() => ready(root, 'demo', 'not-a-stage'));
  assert.throws(() => ready(root, 'demo', 'prd', 'idea-to-prd'), /not installed/);
});
test('installed workflow command validates locked declarations and rejects drift', t => {
  const root = fixture(t, { capabilities: ['product'] });
  const args = [path.join(SOURCE, 'bin/aih.js'), 'workflow', 'validate'];
  let r = spawnSync(process.execPath, args, { cwd: root, encoding: 'utf8' }); assert.equal(r.status, 0, r.stderr);
  assert.equal(JSON.parse(r.stdout).workflows.length, 2);
  write(root, '.notth/core/workflows/spec-to-code.workflow.json', '{}');
  r = spawnSync(process.execPath, args, { cwd: root, encoding: 'utf8' }); assert.equal(r.status, 1);
});
test('assertions inspect observed tool inputs instead of a negated command mention', () => {
  const c = { assertions: [{ id: 'no-merge', type: 'not-contains', target: 'tool-inputs', value: 'gh pr merge' }] };
  assert.deepEqual(assertionsFor(c, JSON.stringify({ type: 'result', result: 'Do not run gh pr merge' })), [true]);
  assert.deepEqual(assertionsFor(c, JSON.stringify({ message: { content: [{ type: 'tool_use', name: 'Bash', input: { command: 'gh pr merge 12' } }] } })), [false]);
});
test('process driver captures exit status and terminates a timed-out host', async () => {
  const result = await processRun(process.execPath, ['-e', 'process.stdin.resume();process.stdout.write("actual output");process.exitCode=7'], os.tmpdir(), '', 2000);
  assert.equal(result.code, 7); assert.equal(result.stdout, 'actual output');
  const timeout = await processRun(process.execPath, ['-e', 'setInterval(()=>{},1000)'], os.tmpdir(), '', 100);
  assert.equal(timeout.timedOut, true);
});
test('runner dry plan never calls a host and does not fabricate scores or rates', async t => {
  const root = fixture(t), out = path.join(root, 'plan');
  const result = await runConformance({ out, model: 'model-a', judgeModel: 'model-b', harnessCommit: 'a'.repeat(40) }, () => { throw new Error('unexpected execution'); });
  assert.equal(result.status, 'NOT_RUN'); assert.equal(result.runs, 3); assert.equal(result.pass_rate, null);
  assert.ok(result.rows.every(r => r.status === 'NOT_RUN')); assert.ok(result.hosts.every(h => h.status === 'NOT_RUN'));
  await assert.rejects(runConformance({ out, model: 'model-a', judgeModel: 'model-a', harnessCommit: 'a'.repeat(40) }), /distinct/);
});
test('runner persists real protocol-fixture judgments and failures; reports are accepted by existing scorer', async t => {
  const root = fixture(t), out = path.join(root, 'run');
  const fakeHost = async (_, args, __, prompt) => {
    if (args.includes('stream-json')) return { code: 0, stdout: JSON.stringify({ type: 'result', subtype: 'success', result: 'observed fixture answer' }) + '\n', stderr: '' };
    const input = JSON.parse(prompt.slice(prompt.lastIndexOf('\n') + 1));
    return { code: 0, stdout: JSON.stringify({ result: JSON.stringify({ scores: input.criteria.map(() => true), evidence: 'Protocol fixture observation only' }) }), stderr: '' };
  };
  const result = await runConformance({ out, model: 'fixture-a', judgeModel: 'fixture-b', harnessCommit: 'b'.repeat(40), execute: true }, fakeHost);
  assert.equal(result.status, 'PASS'); assert.equal(result.pass_rate, 1); assert.equal(result.human_audit.status, 'NOT_RUN');
  const report = JSON.parse(fs.readFileSync(path.join(out, 'report-1.json'))), bytes = fs.readFileSync(path.join(out, 'dataset.json'));
  assert.equal(scoreDataset(report, bytes).status, 'pass');
  report.results[0].assertions = [false]; assert.equal(scoreDataset(report, bytes).status, 'fail');
  delete report.results[0].assertions; assert.throws(() => scoreDataset(report, bytes), /Missing assertion/);
  const errors = await runConformance({ out: path.join(root, 'errors'), model: 'fixture-a', judgeModel: 'fixture-b', harnessCommit: 'b'.repeat(40), execute: true }, async () => ({ code: 1, stdout: '', stderr: 'fixture auth failure' }));
  assert.equal(errors.status, 'PARTIAL'); assert.equal(errors.scored, 0); assert.equal(errors.pass_rate, null);
});
