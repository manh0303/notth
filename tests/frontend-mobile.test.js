import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { SOURCE, install, check, loadLock, readJson, digest } from '../cli/harness.js';
import { skillCatalog } from '../cli/capabilities.js';
import { verify, evaluate } from '../cli/adapters.js';

const added = {
  'react-nextjs': ['harness-react-nextjs-feature-delivery', 'harness-react-nextjs-behavior-testing'],
  'react-native': ['harness-react-native-screen-delivery', 'harness-react-native-behavior-testing'],
};
let base, root, source;
beforeEach(() => {
  base = fs.mkdtempSync(path.join(os.tmpdir(), 'aih-frontend-'));
  root = path.join(base, 'consumer'); source = path.join(base, 'source');
  fs.mkdirSync(root); fs.mkdirSync(source);
  for (const name of ['core', 'adapters', 'capabilities', 'integrations', 'templates', 'config', 'harness.yaml']) {
    fs.cpSync(path.join(SOURCE, name), path.join(source, name), { recursive: true });
  }
});
afterEach(() => fs.rmSync(base, { recursive: true, force: true }));
function write(file, content) {
  const p = path.join(root, file); fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content);
}
function snapshot(folder = root, prefix = '') {
  const result = {};
  for (const entry of fs.readdirSync(folder, { withFileTypes: true })) {
    const p = path.join(folder, entry.name), name = prefix + entry.name;
    if (entry.isDirectory()) Object.assign(result, snapshot(p, name + '/'));
    else result[name] = digest(fs.readFileSync(p));
  }
  return result;
}

for (const adapter of Object.keys(added)) test(`${adapter}: selected skill assets/catalog/manual eval stay scoped and locked`, () => {
  const before = snapshot();
  install(root, source, { adapters: [adapter], dryRun: true }); assert.deepEqual(snapshot(), before);
  install(root, source, { adapters: [adapter] });
  const lock = loadLock(root), catalog = skillCatalog(root, lock).skills;
  for (const name of added[adapter]) {
    const exposed = `.agents/skills/${name}/SKILL.md`, canonical = `.notth/adapters/${adapter}/skills/${name}/SKILL.md`;
    assert.ok(Object.hasOwn(lock.files, exposed)); assert.ok(Object.hasOwn(lock.files, canonical));
    assert.ok(fs.readFileSync(path.join(root, exposed)).equals(fs.readFileSync(path.join(root, canonical))));
    assert.ok(catalog.some(skill => skill.name === name));
  }
  const other = Object.keys(added).find(id => id !== adapter);
  for (const name of added[other]) assert.ok(!fs.existsSync(path.join(root, `.agents/skills/${name}/SKILL.md`)));
  assert.equal(check(root).status, 'ok');
  assert.equal(verify(root).executed, false);
  const evaluation = evaluate(root);
  assert.ok(evaluation.dataset.cases.some(c => c.id.endsWith('/test-boundaries')));
  assert.ok(evaluation.report.results.every(row => row.scores.every(score => score === null)));
  fs.appendFileSync(path.join(root, `.agents/skills/${added[adapter][0]}/SKILL.md`), '\nEdited');
  assert.equal(check(root).status, 'error');
  assert.throws(() => install(root, source, { command: 'update' }), /Managed files changed/);
});

test('older two-skill adapter bundles update additively and deselect without losing project content', () => {
  const adapters = Object.keys(added);
  for (const adapter of adapters) {
    const p = path.join(source, 'adapters', adapter, 'adapter.yaml'), metadata = readJson(p);
    metadata.module_version = '1.1.0'; metadata.skills = metadata.skills.filter(name => !added[adapter].includes(name));
    fs.writeFileSync(p, JSON.stringify(metadata));
    for (const name of added[adapter]) fs.rmSync(path.join(source, 'adapters', adapter, 'skills', name), { recursive: true });
  }
  install(root, source, { adapters });
  for (const name of Object.values(added).flat()) assert.ok(!fs.existsSync(path.join(root, `.agents/skills/${name}`)));
  const config = readJson(path.join(root, '.notth/agents.json')); config.defaultReasoning = 'high';
  const userFiles = { '.notth/local.md': 'Project conventions', '.notth/agents.json': JSON.stringify(config, null, 4) + '\r\n',
    '.codex/config.toml': 'model = "user-model"', 'src/feature.ts': '// existing app' };
  for (const [file, content] of Object.entries(userFiles)) write(file, content);
  fs.appendFileSync(path.join(root, 'AGENTS.md'), '\nLocal appendix\n');
  for (const adapter of adapters) fs.cpSync(path.join(SOURCE, 'adapters', adapter), path.join(source, 'adapters', adapter), { recursive: true });
  const before = snapshot(); install(root, source, { command: 'update', dryRun: true }); assert.deepEqual(snapshot(), before);
  install(root, source, { command: 'update' });
  for (const name of Object.values(added).flat()) assert.ok(fs.existsSync(path.join(root, `.agents/skills/${name}/SKILL.md`)));
  assert.equal(check(root).status, 'ok');
  const selection = readJson(path.join(root, '.notth/project.json')); selection.adapters = [];
  write('.notth/project.json', JSON.stringify(selection)); install(root, source, { command: 'update' });
  for (const name of Object.values(added).flat()) assert.ok(!fs.existsSync(path.join(root, `.agents/skills/${name}/SKILL.md`)));
  for (const [file, content] of Object.entries(userFiles)) assert.equal(fs.readFileSync(path.join(root, file), 'utf8'), content);
  assert.ok(fs.readFileSync(path.join(root, 'AGENTS.md'), 'utf8').endsWith('\nLocal appendix\n'));
  assert.equal(check(root).status, 'ok');
});
