import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { SOURCE, install, check, newChange } from '../cli/harness.js';
import { environmentReport, loadEnvironment, setupPlan, emptyEnvironment } from '../cli/environment.js';
import { ready } from '../cli/readiness.js';

let root;
beforeEach(() => { root = fs.mkdtempSync(path.join(os.tmpdir(), 'aih-setup-')); });
afterEach(() => fs.rmSync(root, { recursive: true, force: true }));
function write(name, content) {
  const p = path.join(root, name);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, typeof content === 'string' ? content : JSON.stringify(content));
}
function read(name) { return fs.readFileSync(path.join(root, name), 'utf8'); }
function cli(args, code = 0) {
  const result = spawnSync(process.execPath, [path.join(SOURCE, 'bin/aih.js'), ...args], { cwd: root, encoding: 'utf8' });
  assert.equal(result.status, code, result.stdout + result.stderr);
  return JSON.parse(result.stdout || result.stderr);
}
const base = 'openspec/changes/add-order/';
function completeDraft() {
  newChange(root, 'add-order');
  write(base + 'proposal.md', '# Orders\nCreate an order for the authenticated customer.\n');
  write(base + 'design.md', '# Design\nUse the existing service and transactional repository.\n');
  write(base + 'tasks.md', '# Tasks\n## Implementation\n- [ ] Implement order creation\n## After merge\n- [ ] Archive change\n');
  write(base + 'specs/add-order/spec.md', '## ADDED Requirements\n### Requirement: Order\nThe API SHALL create an order.\n#### Scenario: Creation\n- **WHEN** a customer submits valid data\n- **THEN** return the new order ID.\n');
  write(base + 'decisions.json', { schema_version: 1, reviewed: true, decisions: [] });
}

test('install/update preserve project and machine content and append a scoped ignore rule; dry run is clean', () => {
  install(root, SOURCE, { dryRun: true });
  assert.deepEqual(fs.readdirSync(root), []);
  write('.notth/.gitignore', '# Existing rule\ncache/\n!/machine.json');
  write('.notth/environment.json', emptyEnvironment());
  write('.notth/machine.json', { schema_version: 1, tools: {} });
  const before = read('.notth/machine.json');
  install(root, SOURCE);
  assert.equal(read('.notth/environment.json'), JSON.stringify(emptyEnvironment()));
  assert.equal(read('.notth/machine.json'), before);
  assert.equal(read('.notth/.gitignore'), '# Existing rule\ncache/\n!/machine.json\n/backups/\n/machine.json\n/sessions/\n');
  assert.equal(check(root).status, 'ok');
  assert.deepEqual(install(root, SOURCE, { command: 'update' }).changes, []);
  assert.equal(read('.notth/machine.json'), before);
});

test('custom executable overrides PATH; settings are checked without reading or exposing private values', () => {
  const privatePath = path.join(root, 'private tools', process.platform === 'win32' ? 'mvn.cmd' : 'mvn');
  fs.mkdirSync(path.dirname(privatePath));
  fs.writeFileSync(privatePath, 'DO NOT EXECUTE');
  fs.chmodSync(privatePath, 0o755);
  write('settings.xml', 'SECRET_SETTINGS_VALUE');
  write('.notth/environment.json', { schema_version: 1,
    tools: { maven: { executable: 'missing-maven', required: true } },
    files: { settings: { path: '${PROJECT_MAVEN_SETTINGS}' } },
    commands: { test: { tool: 'maven', args: ['-s', '${PROJECT_MAVEN_SETTINGS}', 'verify'] } } });
  write('.notth/machine.json', { schema_version: 1, tools: { maven: { executable: privatePath } } });
  const report = environmentReport(root, { PROJECT_MAVEN_SETTINGS: path.join(root, 'settings.xml'), PATH: '' });
  assert.deepEqual(report.problems, []);
  assert.equal(report.entries[0].source, 'machine');
  const output = JSON.stringify(report);
  for (const privateValue of [privatePath, root, 'SECRET_SETTINGS_VALUE', 'verify']) assert.ok(!output.includes(privateValue));
  write('.notth/machine.json', { schema_version: 1, tools: { maven: { executable: path.join(root, 'absent') } } });
  assert.ok(environmentReport(root, { PROJECT_MAVEN_SETTINGS: 'settings.xml' }).problems.includes('tools/maven: missing'));
});

test('missing env vars and optional tools are diagnostic, shell text is never executed', () => {
  write('.notth/environment.json', { schema_version: 1,
    tools: { maven: { executable: '${PROJECT_MAVEN}' }, optional: { executable: 'absent-optional', required: false } },
    files: {}, commands: {} });
  const report = environmentReport(root, {});
  assert.deepEqual(report.problems, ['tools/maven: missing-env']);
  assert.deepEqual(report.entries[0].missing_variables, ['PROJECT_MAVEN']);
  write('.notth/environment.json', { schema_version: 1, tools: { maven: { executable: 'mvn; touch EXECUTED' } }, files: {}, commands: {} });
  assert.equal(environmentReport(root, { PATH: '' }).entries[0].status, 'missing');
  assert.equal(fs.existsSync(path.join(root, 'EXECUTED')), false);
});

test('machine cannot inject commands, unknown IDs, required flags or malformed private input', () => {
  write('.notth/environment.json', { schema_version: 1, tools: { maven: { executable: 'mvn' } }, files: {}, commands: {} });
  for (const machine of [
    { schema_version: 1, commands: {} },
    { schema_version: 1, tools: { unknown: { executable: 'x' } } },
    { schema_version: 1, tools: { maven: { executable: 'x', required: false } } },
    { schema_version: 9 }
  ]) {
    write('.notth/machine.json', machine);
    assert.throws(() => loadEnvironment(root));
  }
  write('.notth/machine.json', '{"password":"PRIVATE_VALUE", broken');
  assert.throws(() => loadEnvironment(root), e => !e.message.includes('PRIVATE_VALUE') && /Invalid JSON/.test(e.message));
});

test('environment schema rejects malformed maps and command references; config symlinks are refused', () => {
  write('.notth/environment.json', { schema_version: 1, tools: {}, files: {}, commands: { test: { tool: 'missing', args: [] } } });
  assert.throws(() => environmentReport(root), /Unknown command tool/);
  write('.notth/environment.json', { ...emptyEnvironment(), tools: [] });
  assert.throws(() => environmentReport(root), /Missing environment map/);
  if (process.platform !== 'win32') {
    fs.unlinkSync(path.join(root, '.notth/environment.json'));
    write('outside.json', emptyEnvironment());
    fs.symlinkSync(path.join(root, 'outside.json'), path.join(root, '.notth/environment.json'));
    assert.throws(() => environmentReport(root), /Symlink/);
  }
});

test('setup recommends an existing wrapper, honors configured tools and emits no forced Maven choice for Gradle', () => {
  install(root, SOURCE, { adapters: ['java-spring'] });
  write(process.platform === 'win32' ? 'mvnw.cmd' : 'mvnw', 'wrapper');
  const plan = cli(['setup']);
  assert.equal(plan.questions[0].recommendation, 'A');
  assert.equal(plan.questions[0].allow_free_text, true);
  write('build.gradle.kts', 'plugins {}');
  assert.equal(setupPlan(root, ['java-spring']).questions[0].id, 'build-tool');
  write('.notth/environment.json', { ...emptyEnvironment(), tools: { maven: { executable: process.execPath } } });
  assert.deepEqual(setupPlan(root, ['java-spring']).questions.map(q => q.id), ['artifact-storage']);
  write('.notth/environment.json', { ...emptyEnvironment(), tools: { maven: { executable: '${UNSET_AIH_TEST_VAR}' } } });
  assert.equal(cli(['doctor'], 1).environment.entries[0].status, 'missing-env');
  assert.equal(cli(['setup'], 1).status, 'blocked');
});

test('CLI init/dry-run/scaffold expose honest next steps and new drafts are blocked', () => {
  const dry = cli(['init', '--dry-run']);
  assert.match(dry.next_steps[0], /without --dry-run/);
  const result = cli(['init']);
  assert.match(result.next_steps[0], /first chat.*harness-start/);
  assert.doesNotMatch(result.next_steps[0], /Run start/);
  const change = cli(['new-change', 'add-order']);
  assert.match(change.next_steps.join(' '), /decisions.json/);
  assert.ok(fs.existsSync(path.join(root, base, 'verification.json')));
  const report = cli(['ready', 'add-order'], 1);
  assert.equal(report.executed, false);
  assert.ok(report.problems.some(p => p.includes('Draft placeholders')));
  assert.ok(report.problems.some(p => p.includes('ambiguity review')));
  cli(['ready', 'add-order', '--stage', 'unknown'], 1);
  cli(['check', '--stage', 'review'], 2);
  cli(['ready'], 2);
});

test('readiness blocks open decisions and incomplete evidence without requiring post-merge archive', () => {
  install(root, SOURCE); completeDraft();
  assert.equal(ready(root, 'add-order').status, 'ready');
  write(base + 'decisions.json', { schema_version: 1, reviewed: true,
    decisions: [{ id: 'duplicate', question: 'Duplicate policy?', status: 'open' }] });
  assert.ok(ready(root, 'add-order').problems.includes('Unresolved decision: duplicate'));
  write(base + 'decisions.json', { schema_version: 1, reviewed: true,
    decisions: [{ id: 'duplicate', question: 'Duplicate policy?', status: 'resolved', answer: 'Reject duplicates', source: 'User decision in ticket 42' }] });
  assert.equal(ready(root, 'add-order').status, 'ready');
  assert.equal(ready(root, 'add-order', 'review').status, 'blocked');
  write(base + 'tasks.md', read(base + 'tasks.md').replace('[ ] Implement', '[x] Implement'));
  write(base + 'verification.json', { schema_version: 1, checks: [
    { name: 'unit', status: 'passed', evidence: 'CI run 42 / unit log' },
    { name: 'integration', status: 'skipped', reason: 'Internal VPN unavailable; reviewer must inspect this gap' }
  ] });
  const review = cli(['ready', 'add-order', '--stage', 'review']);
  assert.equal(review.status, 'ready');
  assert.equal(review.tasks.pending, 0);
  assert.equal(review.skipped_checks.length, 1);
  assert.match(review.note, /not business approval/);
  write(base + 'verification.json', { schema_version: 1, checks: [{ name: 'unit', status: 'passed', evidence: 'TODO' }] });
  assert.equal(ready(root, 'add-order', 'review').status, 'blocked');
  write(base + 'verification.json', { schema_version: 1, checks: [{ name: 'unit', status: 'failed', evidence: 'Failure log' }] });
  assert.equal(ready(root, 'add-order', 'review').status, 'blocked');
});

test('readiness catches invalid decisions, skipped-only evidence and pending tasks outside After merge', () => {
  install(root, SOURCE); completeDraft();
  write(base + 'decisions.json', { schema_version: 1, reviewed: true,
    decisions: [{ id: 'a', question: 'Which?', status: 'resolved' }] });
  assert.equal(ready(root, 'add-order').status, 'blocked');
  write(base + 'decisions.json', { schema_version: 1, reviewed: true, decisions: [] });
  write(base + 'tasks.md', '# Tasks\n- [x] Implement\n## After merge\n- [ ] Archive\n## Review\n- [ ] Security review\n');
  write(base + 'verification.json', { schema_version: 1, checks: [{ name: 'test', status: 'skipped', reason: 'Unavailable' }] });
  const report = ready(root, 'add-order', 'review');
  assert.equal(report.tasks.pending, 1);
  assert.ok(report.problems.includes('No completed passing check or manual review recorded'));
});

test('readiness ignores code examples but detects placeholders, missing specs, traversal and symlinks', () => {
  install(root, SOURCE); completeDraft();
  fs.appendFileSync(path.join(root, base, 'design.md'), '\n```text\nTODO example\n```\n');
  assert.equal(ready(root, 'add-order').status, 'ready');
  fs.appendFileSync(path.join(root, base, 'design.md'), '\nTBD behavior\n');
  assert.equal(ready(root, 'add-order').status, 'blocked');
  assert.throws(() => ready(root, '../outside'), /Invalid change/);
  fs.rmSync(path.join(root, base, 'specs'), { recursive: true });
  assert.ok(ready(root, 'add-order').problems.includes('Missing delta specs'));
  if (process.platform !== 'win32') {
    fs.mkdirSync(path.join(root, 'foreign'));
    fs.symlinkSync(path.join(root, 'foreign'), path.join(root, base, 'specs'));
    assert.throws(() => ready(root, 'add-order'), /Symlink/);
  }
});

test('legacy environments remain optional and setup/ready reject managed drift', () => {
  install(root, SOURCE);
  fs.unlinkSync(path.join(root, '.notth/environment.json'));
  assert.equal(cli(['doctor']).environment.configured, false);
  completeDraft();
  fs.appendFileSync(path.join(root, '.notth/core/rules/context.md'), 'drift');
  assert.match(cli(['ready', 'add-order'], 1).message, /drift/);
  assert.match(cli(['setup'], 1).message, /drift/);
});
