import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync, spawn } from 'node:child_process';
import { install, newChange, saveCheckpoint, SOURCE, digest, check } from '../cli/harness.js';
import { taskContextReport, saveTaskContext, contextPath } from '../cli/task-context.js';
import { importSource, sourceReport, checkSource } from '../cli/sources.js';
import { compactStart, saveStart } from '../cli/start.js';
import { resumePlan } from '../cli/checkpoint.js';

let root;
const base = 'openspec/changes/alpha/';
function write(name, value) {
  fs.mkdirSync(path.dirname(path.join(root, name)), { recursive: true });
  fs.writeFileSync(path.join(root, name), typeof value === 'string' || Buffer.isBuffer(value) ? value : JSON.stringify(value));
}
const read = name => fs.readFileSync(path.join(root, name));
function cli(args, code = 0) {
  const result = spawnSync(process.execPath, [path.join(SOURCE, 'bin/aih.js'), ...args], { cwd: root, encoding: 'utf8' });
  assert.equal(result.status, code, result.stdout + result.stderr);
  return JSON.parse(result.stdout || result.stderr);
}
function fixture() {
  return { schema_version: 1, change_id: 'alpha', revision: 0,
    intent: { problem: 'Sessions forget the accepted request', outcome: 'Continue from source-linked intent' },
    sources: [{ id: 'request', path: base + 'proposal.md', sha256: digest(read(base + 'proposal.md')), locator: 'Why' }],
    links: [
      { id: 'PP-1', kind: 'painpoint', source_refs: ['request'], depends_on: [] },
      { id: 'REQ-1', kind: 'requirement', source_refs: ['request'], depends_on: ['PP-1'] },
      { id: 'TASK-1', kind: 'task', source_refs: ['request'], depends_on: ['REQ-1'] },
      { id: 'EVIDENCE-1', kind: 'evidence', source_refs: ['request'], depends_on: ['TASK-1'] },
    ] };
}
beforeEach(() => { root = fs.mkdtempSync(path.join(os.tmpdir(), 'notth-continuity-')); install(root, SOURCE); newChange(root, 'alpha'); });
afterEach(() => fs.rmSync(root, { recursive: true, force: true }));

test('fresh CLI sessions recover task intent automatically through chat; explicit scope resists another saved task', () => {
  write('context-report.json', fixture());
  const saved = cli(['context', '--change', 'alpha', '--report', 'context-report.json']);
  assert.equal(saved.revision, 1);
  saveStart(root, { goal: 'change', task: 'Continue alpha', changeId: 'alpha' });
  const resumed = cli(['start', '--chat']).task_context;
  assert.equal(resumed.intent.problem, fixture().intent.problem);
  assert.equal(resumed.selection, 'saved-hint');
  assert.equal(resumed.status, 'ok');
  newChange(root, 'beta'); saveStart(root, { goal: 'change', task: 'Other session', changeId: 'beta' });
  assert.equal(cli(['context', '--change', 'alpha']).change_id, 'alpha');
  assert.equal(cli(['start', '--chat']).task_context.change_id, 'beta');
  assert.equal(check(root).status, 'ok');
});
test('source edits invalidate dependent links transitively and recovery without changing historical bytes', () => {
  const row = fixture();
  write('evidence.md', 'Original regression observation');
  row.sources.push({ id: 'test', path: 'evidence.md', sha256: digest(read('evidence.md')), locator: 'Regression check' });
  row.links[3].source_refs = ['test'];
  write('context-report.json', row); saveTaskContext(root, 'alpha', 'context-report.json');
  const handoff = { schema_version: 1, change_id: 'alpha', phase: 'implementation', summary: 'First step done',
    next_action: 'Check regression', timestamp: new Date().toISOString(), baseline: [], completed: [],
    pending: [{ id: 'regression', summary: 'Check regression' }], in_progress: null, blockers: [], external_sources: [], operations: [] };
  write('handoff.json', handoff); saveCheckpoint(root, 'alpha', 'handoff.json');
  const before = read(contextPath('alpha'));
  assert.equal(resumePlan(root, 'alpha').revalidate_required, false);
  write(base + 'proposal.md', 'Changed requested outcome');
  const report = cli(['context', '--change', 'alpha'], 1);
  assert.deepEqual(report.affected_links, ['PP-1', 'REQ-1', 'TASK-1', 'EVIDENCE-1']);
  assert.equal(resumePlan(root, 'alpha').revalidate_required, true);
  assert.deepEqual(read(contextPath('alpha')), before);
});
test('new imported revisions invalidate old snapshots even with unchanged old bytes', () => {
  write('input.md', 'First requirement');
  const source = importSource(root, 'requirements', { input: 'input.md' });
  const row = fixture(); row.sources[0] = { id: 'request', source_id: 'requirements', path: source.normalized,
    sha256: digest(read(source.normalized)), locator: 'Requirement one' };
  write('context-report.json', row); saveTaskContext(root, 'alpha', 'context-report.json');
  write('input.md', 'New requirement'); importSource(root, 'requirements', { input: 'input.md' });
  assert.equal(taskContextReport(root, 'alpha').sources[0].state, 'superseded');
  assert.throws(() => saveTaskContext(root, 'alpha', 'context-report.json'), /context changed/);
  const current = taskContextReport(root, 'alpha'); row.revision = current.revision;
  write('context-report.json', row);
  assert.throws(() => saveTaskContext(root, 'alpha', 'context-report.json', current.context_sha256), /current catalog/);
});
test('conditional revisions retain history and reject stale writer or revision', () => {
  write('context-report.json', fixture());
  const first = saveTaskContext(root, 'alpha', 'context-report.json'), before = read(contextPath('alpha'));
  const row = JSON.parse(before); row.intent.outcome = 'Accepted refined outcome'; write('context-report.json', row);
  const next = saveTaskContext(root, 'alpha', 'context-report.json', first.context_sha256);
  assert.equal(next.revision, 2);
  assert.deepEqual(read(base + 'context-history/' + first.context_sha256 + '.json'), before);
  assert.throws(() => saveTaskContext(root, 'alpha', 'context-report.json', first.context_sha256), /context changed/);
  assert.throws(() => saveTaskContext(root, 'alpha', 'context-report.json', next.context_sha256), /context changed/);
});
test('concurrent sessions cannot silently overwrite a context revision', async () => {
  write('context-report.json', fixture()); const first = saveTaskContext(root, 'alpha', 'context-report.json');
  write('context-report.json', JSON.parse(read(contextPath('alpha'))));
  const run = () => new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [path.join(SOURCE, 'bin/aih.js'), 'context', '--change', 'alpha', '--report', 'context-report.json', '--expected', first.context_sha256], { cwd: root });
    child.on('error', reject); child.on('close', resolve);
  });
  const codes = await Promise.all([run(), run()]);
  assert.deepEqual(codes.sort(), [0, 1]); assert.equal(taskContextReport(root, 'alpha').revision, 2);
});
test('missing sources and invalid references/cycles/paths fail without overwrites', () => {
  const good = fixture();
  for (const mutate of [
    row => row.links[0].depends_on.push('EVIDENCE-1'),
    row => row.links[0].source_refs.push('unknown'),
    row => row.sources[0].path = '../outside.md',
    row => row.sources[0].path = '.env',
    row => row.sources[0].sha256 = '0'.repeat(64),
    row => row.intent.problem = 'Bearer abcdefghijklmnop',
    row => row.sources[0].path = base + 'missing.md',
  ]) {
    const row = structuredClone(good); mutate(row); write('bad.json', row);
    assert.throws(() => saveTaskContext(root, 'alpha', 'bad.json'));
    assert.ok(!fs.existsSync(path.join(root, contextPath('alpha'))));
  }
  write('context-report.json', good); saveTaskContext(root, 'alpha', 'context-report.json');
  fs.unlinkSync(path.join(root, base + 'proposal.md'));
  assert.equal(taskContextReport(root, 'alpha').sources[0].state, 'missing');
});
test('legacy context is optional; install/update preserves context without an external task backend', () => {
  assert.equal(taskContextReport(root).configured, false);
  assert.equal(taskContextReport(root, 'alpha').configured, false);
  assert.ok(compactStart(root).task_context);
  const row = fixture(); write('context-report.json', row);
  saveTaskContext(root, 'alpha', 'context-report.json'); const before = read(contextPath('alpha'));
  install(root, SOURCE, { command: 'update' });
  assert.deepEqual(read(contextPath('alpha')), before);
  const report = taskContextReport(root, 'alpha');
  assert.equal(report.task_backend, undefined);
  assert.equal(report.shared.coordination, undefined);
  assert.ok(!fs.existsSync(path.join(root, '.notth/integrations/beads')));
  assert.match(read('AGENTS.md').toString(), /session-continuity/);
  assert.match(read('.agents/skills/harness-start/SKILL.md').toString(), /session-continuity/);
});
test('CLI flags, oversized reports, malformed JSON and symlinked references are rejected', t => {
  cli(['context', '--report', 'report.json'], 2); cli(['context', '--expected', 'abc'], 2);
  cli(['context', '--change', '../bad'], 1); cli(['context', '--input', 'input.md'], 2);
  write('bad.json', '{bad'); assert.throws(() => saveTaskContext(root, 'alpha', 'bad.json'), /invalid UTF-8 JSON/);
  write('bad.json', 'x'.repeat(256 * 1024 + 1)); assert.throws(() => saveTaskContext(root, 'alpha', 'bad.json'), /size limit/);
  const row = fixture(); write('context-report.json', row); saveTaskContext(root, 'alpha', 'context-report.json');
  try { fs.symlinkSync(path.join(root, base + 'proposal.md'), path.join(root, 'linked.md')); }
  catch (error) { if (['EPERM', 'EACCES'].includes(error.code)) return t.skip('Symlinks unavailable'); throw error; }
  row.sources[0].path = 'linked.md'; write('bad.json', row);
  assert.throws(() => saveTaskContext(root, 'alpha', 'bad.json'), /Symlink/);
});

test('external capture changes with identical bytes and unavailable checks invalidate returning task context', () => {
  write('input.md', 'External requirement');
  const metadata = { schema_version: 1, kind: 'mcp', snapshot_sha256: digest(read('input.md')),
    locator: 'https://issues.example.com/browse/TASK-1', resource_id: 'TASK-1', revision: '1',
    captured_at: '2020-01-01T00:00:00Z', scope: 'description', completeness: 'complete', missing: [] };
  write('metadata.json', metadata);
  importSource(root, 'issue', { input: 'input.md', metadataFile: 'metadata.json' });
  let source = sourceReport(root).sources[0];
  const row = fixture(); row.sources[0] = { id: 'request', source_id: 'issue', path: source.normalized,
    sha256: digest(read(source.normalized)), capture_sha256: source.capture_sha256, locator: 'Description' };
  write('context-report.json', row); saveTaskContext(root, 'alpha', 'context-report.json');
  assert.equal(taskContextReport(root, 'alpha').status, 'blocked');
  write('evidence.txt', 'Observed revision 1');
  const observation = { schema_version: 1, snapshot_sha256: source.sha256, capture_sha256: source.capture_sha256,
    checked_at: '2020-01-02T00:00:00Z', outcome: 'observed', revision: '1', evidence_sha256: digest(read('evidence.txt')) };
  write('observation.json', observation); checkSource(root, 'issue', { report: 'observation.json', input: 'evidence.txt' });
  assert.equal(taskContextReport(root, 'alpha').status, 'ok');
  delete observation.revision; observation.outcome = 'unavailable'; observation.reason = 'Access denied'; observation.checked_at = '2020-01-03T00:00:00Z';
  write('observation.json', observation); checkSource(root, 'issue', { report: 'observation.json', input: 'evidence.txt' });
  const blocked = taskContextReport(root, 'alpha');
  assert.equal(blocked.status, 'blocked'); assert.equal(blocked.sources[0].external.freshness.state, 'unavailable');
  metadata.revision = '2'; metadata.captured_at = '2020-01-04T00:00:00Z'; write('metadata.json', metadata);
  importSource(root, 'issue', { input: 'input.md', metadataFile: 'metadata.json' });
  assert.equal(taskContextReport(root, 'alpha').sources[0].state, 'superseded');
});

test('retired task-backend declarations are inert on read and omitted on a guarded save', () => {
  const row = fixture(); row.revision = 1; row.task_backend = { kind: 'beads', issue_id: 'legacy-123' };
  write(contextPath('alpha'), row);
  const current = taskContextReport(root, 'alpha'); assert.equal(current.task_backend, undefined);
  assert.equal(current.shared.coordination, undefined);
  write('context-report.json', row); saveTaskContext(root, 'alpha', 'context-report.json', current.context_sha256);
  assert.equal(JSON.parse(read(contextPath('alpha'))).task_backend, undefined);
});
