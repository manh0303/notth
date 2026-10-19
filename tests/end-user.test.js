import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { SOURCE, install, check, digest } from '../cli/harness.js';
import { adaptiveVerification } from '../cli/verification.js';
import { reviewVerification } from '../cli/verification-report.js';
function root(t) { const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'aih-user-')); t.after(() => fs.rmSync(dir, { recursive: true, force: true })); return dir; }
function write(dir, name, value) { const filename = path.join(dir, name); fs.mkdirSync(path.dirname(filename), { recursive: true }); fs.writeFileSync(filename, typeof value === 'string' || Buffer.isBuffer(value) ? value : JSON.stringify(value)); }
function fixture(dir) {
  // Report-validation data only; this unit fixture does not claim an actual browser run.
  const observed = JSON.stringify({ visible: 'Saved', persisted: true }); write(dir, 'verification/observations.json', observed);
  return { schema_version: 1, metadata: { run_id: 'unit-fixture', feature: 'Save', source_revision: 'fixture', environment: 'isolated', producer: 'report-contract-test', timestamp: '2026-10-14T00:00:00Z' },
    requirements: [{ id: 'AC-1', description: 'Saved item visible after reload', source: 'synthetic fixture', verification_target: 'end-user', surface: 'web' }],
    scenarios: [{ id: 'save', status: 'PASSED', executed: true, references: ['AC-1'], method: 'browser-e2e', preconditions: ['isolated test app'], fixture: 'test-owned item', steps: ['open form', 'fill', 'click save', 'reload'], expected: 'Saved item visible', observed: 'Saved item visible', timestamp: '2026-10-14T00:00:00Z', mutates: true,
      cleanup: { strategy: 'delete owned item', status: 'PASSED' }, execution: { tool: 'fixture', command: ['fixture-validation'], exit_code: 0, timeout_ms: 5000, attempts: 1, max_attempts: 1 },
      journey: { surface: 'web', actor: 'test-editor', entrypoint: 'http://127.0.0.1/test', interaction: 'browser', dependencies: 'real', attachments: [] },
      evidence: [{ path: 'verification/observations.json', sha256: digest(Buffer.from(observed)) }], assertions: [{ id: 'visible', basis: 'AC-1', layer: 'result', operator: 'equal', expected: 'Saved', actual: { evidence: 'verification/observations.json', pointer: '/visible' } },
        { id: 'persisted', basis: 'AC-1', layer: 'state', operator: 'equal', expected: true, actual: { evidence: 'verification/observations.json', pointer: '/persisted' } }] }] };
}
const review = (dir, value) => { write(dir, 'verification/report.json', value); return reviewVerification(dir, 'verification/report.json'); };
for (const [label, files, surfaces, tools] of [
  ['web without runner', { 'package.json': { dependencies: { next: '1' } } }, ['web'], 'Playwright if a new runner is agreed'],
  ['existing Cypress', { 'package.json': { dependencies: { next: '1' }, devDependencies: { cypress: '1' } } }, ['web'], 'cypress'],
  ['static tool', { 'index.html': '<main>Calculator</main>' }, ['web'], 'authorized host browser tool'],
  ['native device', { 'package.json': { dependencies: { 'react-native': '1' }, devDependencies: { detox: '1' } } }, ['mobile'], 'detox'],
  ['API workflow', { 'openapi.yaml': 'openapi: 3.1.0' }, ['api'], 'existing HTTP/API test client'],
  ['CLI', { 'package.json': { bin: { tool: 'cli.js' } } }, ['cli'], 'authorized host terminal and existing CLI tests'],
]) test('end-user plan: ' + label, t => {
  const dir = root(t); for (const [name, value] of Object.entries(files)) write(dir, name, value);
  const plan = adaptiveVerification(dir, SOURCE).end_user_acceptance;
  assert.deepEqual(plan.surface_hints, surfaces); assert.equal(plan.executed, false);
  assert.ok(plan.tools.some(row => row.candidates.includes(tools))); assert.ok(plan.tools.every(row => row.availability === 'unverified'));
});
test('unknown surface does not invent a UI and installer ships Core QA paths without dependencies', t => {
  const dir = root(t); const before = adaptiveVerification(dir, SOURCE);
  assert.deepEqual(before.end_user_acceptance.surface_hints, []); assert.equal(fs.readdirSync(dir).length, 0);
  install(dir, SOURCE); assert.equal(check(dir).status, 'ok');
  assert.ok(fs.existsSync(path.join(dir, '.agents/skills/harness-end-user-testing/SKILL.md')));
  assert.ok(fs.existsSync(path.join(dir, '.notth/core/workflows/end-user-acceptance.md')));
  assert.equal(fs.existsSync(path.join(dir, 'package.json')), false);
});
test('matching real interface satisfies target consistency; legacy behavior reports remain compatible', t => {
  const dir = root(t), value = fixture(dir);
  assert.equal(review(dir, value).requirements[0].verification, 'VERIFIED');
  assert.equal(review(dir, value).scenarios[0].acceptance_scope, 'end-user');
  delete value.requirements[0].verification_target; delete value.requirements[0].surface; delete value.scenarios[0].journey;
  assert.equal(review(dir, value).verdict, 'PASSED');
});
for (const dependencies of ['mocked', 'unknown']) test(dependencies + ' dependencies cannot satisfy full end-user target', t => {
  const dir = root(t), value = fixture(dir); value.scenarios[0].journey.dependencies = dependencies;
  const result = review(dir, value); assert.equal(result.scenarios[0].status, 'PASSED');
  assert.equal(result.requirements[0].verification, 'UNVERIFIED'); assert.equal(result.verdict, 'NOT_RUN');
});
test('API or unit proof cannot stand in for a required web interface journey', t => {
  const dir = root(t), value = fixture(dir);
  value.scenarios[0].method = 'api'; Object.assign(value.scenarios[0].journey, { surface: 'api', interaction: 'http' });
  assert.equal(review(dir, value).requirements[0].verification, 'UNVERIFIED');
  delete value.scenarios[0].journey; value.scenarios[0].method = 'unit';
  assert.equal(review(dir, value).verdict, 'NOT_RUN');
});
test('browser transport-only PASS and inconsistent interface declarations are rejected', t => {
  const dir = root(t), value = fixture(dir);
  value.scenarios[0].assertions.forEach(row => row.layer = 'transport'); assert.throws(() => review(dir, value), /contradicts/);
  value.scenarios[0].assertions[0].layer = 'result'; value.scenarios[0].journey.interaction = 'http'; assert.throws(() => review(dir, value), /interface/);
});
test('binary attachments are digest-checked separately from assertion JSON', t => {
  const dir = root(t), value = fixture(dir), bytes = Buffer.from([137,80,78,71,0,255,1]);
  write(dir, 'verification/screen.png', bytes);
  value.scenarios[0].journey.attachments.push({ kind: 'screenshot', path: 'verification/screen.png', sha256: digest(bytes) });
  assert.equal(review(dir, value).verdict, 'PASSED');
  write(dir, 'verification/screen.png', Buffer.from([1,2])); assert.throws(() => review(dir, value), /digest/);
});
for (const [label, mutate] of [
  ['wrong expected surface', v => v.requirements[0].surface = 'unknown'],
  ['missing required surface', v => delete v.requirements[0].surface],
  ['attachment traversal', v => v.scenarios[0].journey.attachments = [{ kind: 'trace', path: '../escape.zip', sha256: '0'.repeat(64) }]],
  ['attachment missing', v => v.scenarios[0].journey.attachments = [{ kind: 'trace', path: 'missing.zip', sha256: '0'.repeat(64) }]],
  ['attachment extension', v => v.scenarios[0].journey.attachments = [{ kind: 'trace', path: 'verification/observations.json', sha256: '0'.repeat(64) }]],
  ['credential URL', v => v.scenarios[0].journey.entrypoint = 'https://user:private@example.com'],
  ['credential query', v => v.scenarios[0].journey.entrypoint = 'https://example.com/?access_token=private'],
]) test('reject user journey ' + label, t => { const dir = root(t), value = fixture(dir); mutate(value); assert.throws(() => review(dir, value)); });
test('attachment limits, duplicates and symlinks fail before evidence claims', t => {
  const dir = root(t), value = fixture(dir), name = 'verification/large.zip';
  write(dir, name, Buffer.from([1])); const fd = fs.openSync(path.join(dir, name), 'r+'); fs.ftruncateSync(fd, 50 * 1024 * 1024 + 1); fs.closeSync(fd);
  value.scenarios[0].journey.attachments = [{ kind: 'trace', path: name, sha256: '0'.repeat(64) }]; assert.throws(() => review(dir, value), /50 MiB/);
  write(dir, name, Buffer.from([1])); const ref = { kind: 'trace', path: name, sha256: digest(Buffer.from([1])) };
  value.scenarios[0].journey.attachments = [ref, ref]; assert.throws(() => review(dir, value), /duplicate/);
  if (process.platform !== 'win32') { fs.unlinkSync(path.join(dir, name)); fs.symlinkSync(path.join(dir, 'verification/observations.json'), path.join(dir, name));
    value.scenarios[0].journey.attachments = [ref]; assert.throws(() => review(dir, value), /Symlink/); }
});
test('unavailable interface stays BLOCKED and does not invent execution evidence', t => {
  const dir = root(t), value = fixture(dir), row = value.scenarios[0];
  row.status = 'BLOCKED'; row.executed = false; row.reason = 'Browser unavailable'; row.assertions = []; row.evidence = []; delete row.execution;
  const result = review(dir, value); assert.equal(result.verdict, 'BLOCKED'); assert.equal(result.requirements[0].verification, 'UNVERIFIED');
  assert.equal(result.scenarios[0].acceptance_scope, 'not-executed');
});

test('unit/API rows cannot launder a browser declaration into end-user proof', t => {
  const dir = root(t), value = fixture(dir);
  for (const method of ['unit', 'component', 'build', 'api']) { value.scenarios[0].method = method; assert.throws(() => review(dir, value), /method\/surface/); }
});
