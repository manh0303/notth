import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { SOURCE, install, check, loadLock, readJson, digest, newChange } from '../cli/harness.js';
import { setupPlan, emptyEnvironment } from '../cli/environment.js';
import { verify, evaluate } from '../cli/adapters.js';

const adapters = ['java-spring', 'react-nextjs', 'react-native'];
let root;
beforeEach(() => { root = fs.mkdtempSync(path.join(os.tmpdir(), 'aih-conventions-')); });
afterEach(() => fs.rmSync(root, { recursive: true, force: true }));
function write(name, value) {
  const filename = path.join(root, name);
  fs.mkdirSync(path.dirname(filename), { recursive: true });
  fs.writeFileSync(filename, typeof value === 'string' ? value : JSON.stringify(value));
}
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
function snapshot(folder = root, prefix = '') {
  const result = {};
  for (const entry of fs.readdirSync(folder, { withFileTypes: true })) {
    const filename = path.join(folder, entry.name), name = prefix + entry.name;
    if (entry.isDirectory()) Object.assign(result, snapshot(filename, name + '/'));
    else result[name] = digest(fs.readFileSync(filename));
  }
  return result;
}

for (const adapter of [null, ...adapters]) test(`install exposes locked conventions only for selected modules: ${adapter ?? 'core'}`, () => {
  const selected = adapter ? [adapter] : [];
  install(root, SOURCE, { adapters: selected });
  const lock = loadLock(root), core = '.notth/core/rules/project-conventions.md';
  assert.equal(lock.files[core], digest(fs.readFileSync(path.join(SOURCE, 'core/rules/project-conventions.md'))));
  assert.ok(read('AGENTS.md').includes(core), 'Installed entry point must link the policy');
  for (const id of adapters) {
    const name = `.notth/adapters/${id}/rules/conventions.md`;
    assert.equal(Object.hasOwn(lock.files, name), id === adapter);
    assert.equal(fs.existsSync(path.join(root, name)), id === adapter);
    if (id === adapter) {
      const metadata = readJson(path.join(root, `.notth/adapters/${id}/adapter.yaml`));
      assert.ok(metadata.rules.includes('rules/conventions.md'));
      assert.equal(lock.files[name], digest(fs.readFileSync(path.join(SOURCE, `adapters/${id}/rules/conventions.md`))));
      assert.ok(read(`.notth/adapters/${id}/rules.md`).includes('rules/conventions.md'));
    }
  }
  assert.equal(check(root).status, 'ok');
});

test('legacy update adds convention assets without rewriting project context or unmanaged AGENTS', () => {
  const fixture = readJson(path.join(SOURCE, 'tests/fixtures/npm-v0.2.0.json'));
  for (const [name, value] of Object.entries(fixture.files)) write(name, value);
  const local = read('.harness/local.md'), agents = read('AGENTS.md');
  write('.harness/environment.json', emptyEnvironment());
  write('docs/team-conventions.md', '# Team conventions\nKeep approved module boundaries.\n');
  const before = snapshot();
  const dry = install(root, SOURCE, { command: 'update', dryRun: true });
  assert.ok(dry.changes.some(row => row.path === '.notth/core/rules/project-conventions.md'));
  assert.deepEqual(snapshot(), before);
  install(root, SOURCE, { command: 'update' });
  assert.equal(read('.notth/local.md'), local);
  assert.equal(read('.notth/environment.json'), JSON.stringify(emptyEnvironment()));
  assert.equal(read('docs/team-conventions.md'), '# Team conventions\nKeep approved module boundaries.\n');
  const stripManaged = value => value.replace(/<!-- ai-harness:start -->[\s\S]*?<!-- ai-harness:end -->/, '');
  assert.equal(stripManaged(read('AGENTS.md')), stripManaged(agents));
  assert.equal(check(root).status, 'ok');
  for (const id of loadLock(root).adapters.filter(id => adapters.includes(id))) {
    assert.ok(fs.existsSync(path.join(root, `.notth/adapters/${id}/rules/conventions.md`)));
  }
  assert.deepEqual(install(root, SOURCE, { command: 'update' }).changes, []);
});

test('setup suggests mode without inference or writes and retains guidance with configured tools', () => {
  install(root, SOURCE, { adapters: ['java-spring'] });
  write('pom.xml', '<project/>');
  write('.notth/local.md', '# Established facts\nMode: maintain; use existing modules.\n');
  let before = snapshot();
  const question = setupPlan(root, ['java-spring']).questions.find(q => q.id === 'project-mode');
  assert.deepEqual(question.options.map(o => o.value), ['maintain', 'new', 'mixed']);
  assert.equal(question.recommendation, null);
  assert.equal(question.allow_free_text, true);
  assert.deepEqual(snapshot(), before);
  write('.notth/environment.json', { ...emptyEnvironment(), tools: { node: { executable: process.execPath } } });
  before = snapshot();
  const configured = setupPlan(root, ['java-spring']);
  assert.deepEqual(configured.questions.map(q => q.id), ['artifact-storage']);
  assert.match(configured.next_steps.join(' '), /mode per affected module/);
  assert.match(configured.next_steps.join(' '), /Skip answered questions/);
  assert.deepEqual(snapshot(), before);
});

test('advisory checks and unscored cases are scoped to the installed snapshot', () => {
  install(root, SOURCE, { adapters });
  const before = snapshot(), plan = verify(root, 'all');
  assert.equal(plan.executed, false);
  const conventionChecks = plan.checks.filter(c => ['project-conventions', 'convention-fit'].includes(c.id));
  assert.equal(conventionChecks.length, 4);
  for (const c of conventionChecks) {
    assert.equal(c.execution, 'manual');
    assert.deepEqual(c.command, []);
  }
  const exported = evaluate(root, undefined, 'all');
  for (const id of ['core/new-project-baseline', 'core/mixed-module-conventions',
    'core/reuse-without-boundary-violation', 'core/unsafe-legacy-convention', 'core/conflicting-convention-sources',
    'java-spring/reuse-spring-common', 'react-nextjs/reuse-web-conventions', 'react-native/reuse-mobile-conventions']) {
    assert.ok(exported.dataset.cases.some(c => c.id === id));
    const result = exported.report.results.find(r => r.id === id);
    assert.ok(result.scores.every(score => score === null));
    assert.equal(result.evidence, '');
  }
  assert.ok(evaluate(root).dataset.cases.every(c => !c.id.startsWith('core/')));
  assert.deepEqual(snapshot(), before);
  fs.appendFileSync(path.join(root, '.notth/adapters/java-spring/rules/conventions.md'), '\nCustom managed edit\n');
  const edited = snapshot();
  assert.equal(check(root).status, 'error');
  assert.throws(() => install(root, SOURCE, { command: 'update' }), /Managed files changed/);
  assert.throws(() => verify(root, 'all'), /drift/);
  assert.deepEqual(snapshot(), edited);
});

test('new changes use the installed convention and reuse design section', () => {
  install(root, SOURCE);
  newChange(root, 'add-customer');
  const design = read('openspec/changes/add-customer/design.md');
  assert.match(design, /## Convention and Reuse Plan/);
  assert.match(design, /reusable public APIs/);
  assert.match(read('.notth/local.md'), /## Development conventions/);
});
