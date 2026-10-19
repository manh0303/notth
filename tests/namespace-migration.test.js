import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { SOURCE, install, check, readJson, digest, encode, atomicWrite } from '../cli/harness.js';
import { backupConfig, restoreConfig } from '../cli/portable-config.js';

let root;
beforeEach(() => { root = fs.mkdtempSync(path.join(os.tmpdir(), 'notth-namespace-')); });
afterEach(() => fs.rmSync(root, { recursive: true, force: true }));
function write(name, value) {
  const p = path.join(root, name); fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, typeof value === 'string' || Buffer.isBuffer(value) ? value : JSON.stringify(value));
}
const read = name => fs.readFileSync(path.join(root, name));
function snapshot() {
  const result = {};
  function visit(name = '') {
    for (const item of fs.readdirSync(path.join(root, name), { withFileTypes: true })) {
      const p = name ? name + '/' + item.name : item.name;
      if (item.isDirectory()) visit(p); else result[p] = item.isSymbolicLink() ? fs.readlinkSync(path.join(root, p)) : read(p).toString('base64');
    }
  }
  visit(); return result;
}
function legacy() {
  const fixture = readJson(path.join(SOURCE, 'tests/fixtures/npm-v0.2.0.json'));
  for (const [name, value] of Object.entries(fixture.files)) write(name, value);
  return fixture;
}

test('fresh init uses only .notth and brands the primary README without the old product name', () => {
  install(root, SOURCE, { host: 'kiro' });
  assert.equal(check(root).status, 'ok');
  assert.ok(!fs.existsSync(path.join(root, '.harness')));
  assert.ok(!fs.existsSync(path.join(root, '.beads')));
  assert.ok(fs.existsSync(path.join(root, '.notth/core/rules/context.md')));
  for (const name of ['AGENTS.md', '.agents/skills/harness-start/SKILL.md', '.kiro/hooks/harness-session.json']) {
    assert.match(read(name).toString(), /\.notth\//); assert.doesNotMatch(read(name).toString(), /\.harness\//);
  }
  assert.match(read('AGENTS.md').toString(), /## NOTTH /);
  assert.doesNotMatch(fs.readFileSync(path.join(SOURCE, 'README.md'), 'utf8'), /AI Harness|ai-harness|Beads|\.harness/);
  assert.equal(readJson(path.join(SOURCE, 'harness.yaml')).project_directory, '.notth');
});
test('legacy migration previews without writes, preserves arbitrary/private bytes and keeps a complete rollback copy', () => {
  legacy();
  write('.harness/environment.json', { schema_version: 1, tools: {}, files: {}, commands: {} });
  write('.harness/machine.json', { schema_version: 1, tools: {}, files: {} });
  write('.harness/custom/notes.md', Buffer.from([0, 1, 255]));
  write('.harness/backups/old-config.json', 'old configuration archive');
  write('docs/sources/project-note.md', 'Original source note');
  write('openspec/changes/project/checkpoint.json', 'Retain original evidence receipt');
  const original = snapshot(), local = read('.harness/local.md');
  const dry = install(root, SOURCE, { command: 'update', dryRun: true, host: 'kiro' });
  assert.deepEqual(snapshot(), original); assert.equal(dry.status, 'planned');
  assert.deepEqual(dry.migration.from, '.harness');
  const result = install(root, SOURCE, { command: 'update', host: 'kiro' });
  assert.equal(check(root).status, 'ok'); assert.ok(!fs.existsSync(path.join(root, '.harness')));
  assert.deepEqual(read('.notth/local.md'), local);
  assert.deepEqual(read('.notth/custom/notes.md'), Buffer.from([0, 1, 255]));
  assert.equal(read('.notth/backups/old-config.json').toString(), 'old configuration archive');
  assert.equal(read('docs/sources/project-note.md').toString(), 'Original source note');
  assert.equal(read('openspec/changes/project/checkpoint.json').toString(), 'Retain original evidence receipt');
  for (const [name, value] of Object.entries(original).filter(([name]) => name.startsWith('.harness/'))) {
    assert.equal(read(result.migration.backup + '/' + name).toString('base64'), value);
  }
  if (process.platform !== 'win32') assert.equal(fs.statSync(path.join(root, '.notth/machine.json')).mode & 0o777, 0o600);
  assert.deepEqual(install(root, SOURCE, { command: 'update' }).changes, []);
});
test('legacy managed drift, mixed namespaces and native bridge collisions fail before target changes', () => {
  legacy(); write('.harness/core/rules/context.md', 'User modified managed rule');
  let before = snapshot(); assert.throws(() => install(root, SOURCE, { command: 'update' }), /Managed files changed/); assert.deepEqual(snapshot(), before);
  fs.rmSync(path.join(root, '.harness'), { recursive: true }); legacy();
  write('.notth/local.md', 'Independent namespace'); before = snapshot();
  assert.throws(() => install(root, SOURCE, { command: 'update' }), /both namespaces/); assert.deepEqual(snapshot(), before);
  fs.rmSync(path.join(root, '.notth'), { recursive: true });
  write('.kiro/skills/harness-start/SKILL.md', 'User native skill'); before = snapshot();
  assert.throws(() => install(root, SOURCE, { command: 'update', host: 'kiro' }), /collision/); assert.deepEqual(snapshot(), before);
});
test('ordinary target write failure rolls back the entire namespace and host files', () => {
  legacy(); const before = snapshot(); let calls = 0;
  assert.throws(() => install(root, SOURCE, { command: 'update', writer: (name, data) => {
    if (++calls === 5) throw new Error('Simulated disk failure'); atomicWrite(name, data);
  } }), /Simulated disk failure/);
  assert.deepEqual(snapshot(), before);
  assert.ok(!fs.existsSync(path.join(root, '.notth/lock.json')));
  assert.equal(install(root, SOURCE, { command: 'update' }).status, 'ok');
});
test('legacy lock tampering and either installer marker stop migration', () => {
  legacy();
  const value = JSON.parse(read('.harness/lock.json')); value.bundle_sha256 = '0'.repeat(64); write('.harness/lock.json', value);
  let before = snapshot(); assert.throws(() => install(root, SOURCE, { command: 'update' }), /digest mismatch/); assert.deepEqual(snapshot(), before);
  for (const name of ['.harness-install.lock', '.notth-install.lock']) {
    write(name, 'Another installer'); before = snapshot();
    assert.throws(() => install(root, SOURCE, { command: 'update' }), /Another installation/); assert.deepEqual(snapshot(), before);
    fs.unlinkSync(path.join(root, name));
  }
});
test('symlinked legacy user content is rejected without copying or deleting its target', t => {
  legacy(); write('outside.txt', 'Preserve');
  try { fs.symlinkSync(path.join(root, 'outside.txt'), path.join(root, '.harness/custom-link')); }
  catch (error) { if (['EPERM', 'EACCES'].includes(error.code)) return t.skip('Host disallows symlinks'); throw error; }
  const before = snapshot(); assert.throws(() => install(root, SOURCE, { command: 'update' }), /symlinks/);
  assert.deepEqual(snapshot(), before);
});
test('old branded configuration archives restore safely into .notth after original digest validation', () => {
  const config = JSON.stringify({ schema_version: 1, adapters: [], capabilities: [] });
  const archive = { schema_version: 1, kind: 'ai-harness-user-config', cli_version: '0.18.0',
    files: { '.harness/project.json': { content: config, sha256: digest(Buffer.from(config)) } } };
  write('archive.json', archive); restoreConfig(root, 'archive.json');
  assert.equal(read('.notth/project.json').toString(), config); assert.ok(!fs.existsSync(path.join(root, '.harness')));
  install(root, SOURCE); const saved = backupConfig(root, 'new-archive.json');
  assert.equal(JSON.parse(read(saved.backup)).kind, 'notth-user-config');
  archive.files['.harness/project.json'].sha256 = '0'.repeat(64); write('bad.json', archive);
  const before = snapshot(); assert.throws(() => restoreConfig(root, 'bad.json', { replace: true }), /digest/); assert.deepEqual(snapshot(), before);
  archive.files['.notth/project.json'] = archive.files['.harness/project.json']; write('mixed.json', archive);
  assert.throws(() => restoreConfig(root, 'mixed.json'), /conflicting namespace/);
});

test('upgrade retires the formerly locked backend guide while retaining its original bytes in backup', () => {
  legacy(); const name = '.harness/integrations/beads/README.md'; write(name, 'Legacy optional backend instructions');
  const lock = JSON.parse(read('.harness/lock.json')); lock.files[name] = digest(read(name));
  lock.bundle_sha256 = digest(encode(lock.files)); write('.harness/lock.json', lock);
  const result = install(root, SOURCE, { command: 'update' });
  assert.equal(check(root).status, 'ok');
  assert.ok(!fs.existsSync(path.join(root, '.notth/integrations/beads/README.md')));
  assert.equal(read(result.migration.backup + '/' + name).toString(), 'Legacy optional backend instructions');
});

test('a legacy installer starting a fresh project also excludes the new installer', () => {
  write('.harness-install.lock', 'Legacy init in progress'); const before = snapshot();
  assert.throws(() => install(root, SOURCE), /Another installation/); assert.deepEqual(snapshot(), before);
});
