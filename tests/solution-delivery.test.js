import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { SOURCE, install, check, newDoc, loadLock, readJson, digest } from '../cli/harness.js';
import { evaluate, verify } from '../cli/adapters.js';
import { loadCapability, skillCatalog, readSkill } from '../cli/capabilities.js';

let base, root, source;
beforeEach(() => {
  base = fs.mkdtempSync(path.join(os.tmpdir(), 'aih-solution-'));
  root = path.join(base, 'consumer'); source = path.join(base, 'source');
  fs.mkdirSync(root); fs.mkdirSync(source);
  for (const name of ['core', 'adapters', 'capabilities', 'integrations', 'templates', 'harness.yaml']) {
    fs.cpSync(path.join(SOURCE, name), path.join(source, name), { recursive: true });
  }
});
afterEach(() => fs.rmSync(base, { recursive: true, force: true }));
function write(name, content, dest = root) {
  const filename = path.join(dest, name); fs.mkdirSync(path.dirname(filename), { recursive: true });
  fs.writeFileSync(filename, typeof content === 'string' ? content : JSON.stringify(content));
}
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
function snapshot(folder = root, prefix = '') {
  const state = {};
  for (const entry of fs.readdirSync(folder, { withFileTypes: true })) {
    const full = path.join(folder, entry.name), relative = prefix + entry.name;
    if (entry.isDirectory()) Object.assign(state, snapshot(full, relative + '/'));
    else state[relative] = digest(fs.readFileSync(full));
  }
  return state;
}
function cli(args, status = 0) {
  const result = spawnSync(process.execPath, [path.join(SOURCE, 'bin/aih.js'), ...args], { cwd: root, encoding: 'utf8' });
  assert.equal(result.status, status, result.stdout + result.stderr);
  return JSON.parse(result.stdout || result.stderr);
}

for (const id of ['architecture', 'delivery']) test(`${id} installs alone, exposes only selected skills and declared draft routes`, () => {
  const info = loadCapability(source, id);
  const plan = install(root, source, { capabilities: [id], dryRun: true });
  assert.ok(plan.warnings.length > 0, 'Recommendations remain warnings');
  assert.deepEqual(fs.readdirSync(root), []);
  install(root, source, { capabilities: [id] });
  const lock = loadLock(root);
  assert.deepEqual(lock.capabilities, [id]);
  assert.ok(!fs.existsSync(path.join(root, '.notth/capabilities/product')));
  assert.ok(read('AGENTS.md').includes(`.notth/capabilities/${id}/workflows/`));
  const catalog = skillCatalog(root, lock);
  assert.equal(catalog.skills.length, fs.readdirSync(path.join(source, 'core/skills'), { withFileTypes: true }).filter(entry => entry.isDirectory()).length + info.skills.length);
  for (const name of info.skills) {
    assert.ok(readSkill(root, lock, name).content.includes('## Quality checklist'));
    assert.equal(lock.files[`.agents/skills/${name}/SKILL.md`], lock.files[`.notth/capabilities/${id}/skills/${name}/SKILL.md`]);
  }
  for (const template of info.templates) {
    const name = path.basename(template, '.md');
    const result = cli(['new-doc', name, '--capability', id]);
    assert.equal(result.path, `docs/${id}/${name}.md`);
    assert.equal(result.capability, id);
    assert.equal(read(result.path), fs.readFileSync(path.join(source, info.template_aliases?.[template] ?? `capabilities/${id}/${template}`), 'utf8'));
  }
  assert.equal(check(root).status, 'ok');
});

test('Product defaults remain compatible and same-named plans have explicit namespaces', () => {
  install(root, source, { capabilities: ['product', 'delivery'] });
  assert.equal(cli(['new-doc', 'delivery-plan']).path, 'docs/product/delivery-plan.md');
  assert.equal(cli(['new-doc', 'delivery-plan', '--capability', 'delivery']).path, 'docs/delivery/delivery-plan.md');
  assert.equal(cli(['new-doc', 'idea']).path, 'docs/discovery/idea.md');
  assert.equal(cli(['new-doc', 'mvp']).path, 'docs/product/mvp.md');
  const before = snapshot();
  for (const args of [['new-doc', 'delivery-plan', '--capability', 'delivery'],
    ['new-doc', 'overview', '--capability', '../outside'], ['new-doc', 'overview', '--capability', 'architecture'],
    ['new-doc', 'not-declared', '--capability', 'delivery']]) cli(args, 1);
  for (const args of [['check', '--capability', 'delivery'], ['new-doc', 'mvp', '--capability', '']]) cli(args, 2);
  assert.deepEqual(snapshot(), before);
});

test('new-doc refuses a bundled but undeclared template and all managed drift', () => {
  write('capabilities/architecture/templates/hidden.md', '# Undeclared template', source);
  install(root, source, { capabilities: ['architecture'] });
  assert.ok(loadLock(root).files['.notth/capabilities/architecture/templates/hidden.md']);
  let before = snapshot();
  assert.throws(() => newDoc(root, 'hidden', 'architecture'), /Unknown document type/);
  assert.deepEqual(snapshot(), before);
  write('.notth/capabilities/architecture/templates/overview.md', 'Edited managed template');
  before = snapshot();
  assert.throws(() => newDoc(root, 'overview', 'architecture'), /drift/);
  assert.throws(() => install(root, source, { command: 'update' }), /Managed files changed/);
  assert.deepEqual(snapshot(), before);
});

test('capability draft refuses an existing symlink destination without touching its target', () => {
  if (process.platform === 'win32') return;
  install(root, source, { capabilities: ['architecture'] });
  write('outside.md', 'Keep original'); fs.mkdirSync(path.join(root, 'docs/architecture'), { recursive: true });
  fs.symlinkSync(path.join(root, 'outside.md'), path.join(root, 'docs/architecture/overview.md'));
  assert.throws(() => newDoc(root, 'overview', 'architecture'), /Symlink/);
  assert.equal(read('outside.md'), 'Keep original');
});

test('selection upgrade/removal preserves approved docs, old Product plans, local facts and host bridges', () => {
  install(root, source, { capabilities: ['product'] });
  newDoc(root, 'delivery-plan'); write('docs/product/delivery-plan.md', 'Approved old plan');
  write('.notth/local.md', 'Reviewed project facts'); write('CLAUDE.md', '@AGENTS.md\nUser rule');
  write('GEMINI.md', '@./AGENTS.md');
  const config = readJson(path.join(root, '.notth/project.json'));
  config.capabilities = ['product', 'architecture', 'delivery']; write('.notth/project.json', config);
  const before = snapshot(); install(root, source, { command: 'update', dryRun: true });
  assert.deepEqual(snapshot(), before);
  install(root, source, { command: 'update' }); newDoc(root, 'overview', 'architecture');
  write('docs/architecture/overview.md', 'Approved architecture'); newDoc(root, 'delivery-plan', 'delivery');
  config.capabilities = ['product']; write('.notth/project.json', config);
  install(root, source, { command: 'update' });
  assert.ok(!Object.keys(loadLock(root).files).some(name => name.startsWith('.notth/capabilities/architecture/')));
  assert.ok(!fs.existsSync(path.join(root, '.notth/capabilities/architecture/capability.json')));
  assert.ok(!fs.existsSync(path.join(root, '.agents/skills/harness-architecture-project-context/SKILL.md')));
  assert.equal(read('docs/architecture/overview.md'), 'Approved architecture');
  assert.equal(read('docs/product/delivery-plan.md'), 'Approved old plan');
  assert.equal(read('.notth/local.md'), 'Reviewed project facts');
  assert.equal(read('CLAUDE.md'), '@AGENTS.md\nUser rule'); assert.equal(read('GEMINI.md'), '@./AGENTS.md');
  assert.equal(check(root).status, 'ok');
});

test('three-role composition exports locked manual checks and unscored traceable cases without writes', () => {
  install(root, source, { capabilities: ['product', 'architecture', 'delivery'] });
  const before = snapshot(), ev = evaluate(root, undefined, 'all'), checks = verify(root, 'all');
  assert.ok(ev.dataset.cases.some(c => c.id === 'composition/product-solution-delivery'));
  for (const id of ['core/proportional-solution-flow', 'capability/product/mvp-not-feature-count',
    'capability/architecture/pattern-levels', 'capability/architecture/unknown-nfr',
    'capability/architecture/stale-map', 'capability/delivery/no-invented-deadline', 'capability/delivery/scope-delta']) {
    assert.ok(ev.dataset.cases.some(c => c.id === id), id);
    assert.ok(ev.report.results.find(c => c.id === id).scores.every(score => score === null));
  }
  assert.equal(checks.executed, false);
  assert.ok(checks.checks.filter(c => c.capability).every(c => c.execution === 'manual' && c.command.length === 0));
  assert.deepEqual(snapshot(), before);
  configWithoutDelivery();
  assert.ok(!evaluate(root, undefined, 'all').dataset.cases.some(c => c.id === 'composition/product-solution-delivery'));
  function configWithoutDelivery() {
    const config = readJson(path.join(root, '.notth/project.json')); config.capabilities = ['product', 'architecture'];
    write('.notth/project.json', config); install(root, source, { command: 'update' });
  }
});

test('Product/Architecture/Delivery skill bodies link templates with examples and quality without loading the whole catalog', () => {
  for (const id of ['product', 'architecture', 'delivery']) {
    const info = loadCapability(source, id);
    for (const name of info.skills) {
      const body = fs.readFileSync(path.join(source, `capabilities/${id}/skills/${name}/SKILL.md`), 'utf8');
      for (const heading of ['## Template', '## Example', '## Quality checklist', '## Handoff']) assert.ok(body.includes(heading), `${name}: ${heading}`);
      const matches = [...body.matchAll(/\.notth\/capabilities\/([a-z-]+)\/templates\/([a-z-]+)\.md/g)];
      assert.ok(matches.length > 0, `${name}: no installed template reference`);
      for (const [, owner, type] of matches) assert.ok(loadCapability(source, owner).templates.includes(`templates/${type}.md`));
    }
  }
});
