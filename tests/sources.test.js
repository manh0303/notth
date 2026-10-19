import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { importSource, sourceReport } from '../cli/sources.js';
import { install, SOURCE, atomicWrite, digest } from '../cli/harness.js';
let root;
beforeEach(() => { root = fs.mkdtempSync(path.join(os.tmpdir(), 'notth-sources-')); });
afterEach(() => fs.rmSync(root, { recursive: true, force: true }));
const write = (name, bytes) => fs.writeFileSync(path.join(root, name), bytes);
const read = name => fs.readFileSync(path.join(root, name));
const index = () => JSON.parse(read('docs/sources/manifest.json'));
function cli(args, code = 0) {
  const result = spawnSync(process.execPath, [path.join(SOURCE, 'bin/aih.js'), ...args], { cwd: root, encoding: 'utf8' });
  assert.equal(result.status, code, result.stdout + result.stderr);
  return JSON.parse(result.stdout || result.stderr);
}
test('CLI preserves unicode/space filename and exact original, normalizes Markdown, deduplicates and previews', () => {
  write('Yêu cầu.md', '# Input\r\nHello\r\n');
  assert.equal(cli(['import-source', 'requirements', '--input', 'Yêu cầu.md', '--dry-run']).action, 'planned');
  assert.ok(!fs.existsSync(path.join(root, 'docs')));
  const result = cli(['import-source', 'requirements', '--input', 'Yêu cầu.md']);
  assert.deepEqual(read(result.original), read('Yêu cầu.md'));
  assert.equal(read(result.normalized).toString(), '# Input\nHello\n');
  const before = read('docs/sources/manifest.json');
  assert.equal(cli(['import-source', 'requirements', '--input', 'Yêu cầu.md']).action, 'unchanged');
  assert.deepEqual(read('docs/sources/manifest.json'), before);
  assert.equal(cli(['sources']).sources[0].approval, 'not-established');
  assert.equal(index().sources[0].revisions[0].filename, 'Yêu cầu.md');
});
test('binary original stays pending until a supplied conversion; revisions and conversions are retained', () => {
  write('source.pdf', Buffer.from([0, 1, 2, 255]));
  const pending = importSource(root, 'spec', { input: 'source.pdf' });
  assert.equal(pending.conversion, 'pending'); assert.equal(pending.normalized, null);
  write('converted.md', '# Converted\nPage 1; image omitted.\n');
  const converted = importSource(root, 'spec', { input: pending.original, normalized: 'converted.md' });
  assert.equal(converted.conversion, 'available-unreviewed');
  write('converted.md', '# Corrected conversion\n');
  importSource(root, 'spec', { input: pending.original, normalized: 'converted.md' });
  assert.equal(index().sources[0].revisions[0].normalizations.length, 2);
  write('source.pdf', 'second revision');
  const latest = importSource(root, 'spec', { input: 'source.pdf' });
  assert.equal(latest.conversion, 'pending');
  assert.equal(importSource(root, 'spec', { input: pending.original }).current, false);
  assert.equal(sourceReport(root).sources[0].sha256, latest.sha256);
  assert.equal(index().sources[0].revisions.length, 2);
  assert.ok(fs.existsSync(path.join(root, converted.normalized)));
});
test('sources survive init/update, removal of harness and complete-folder recovery into another project', () => {
  write('input.txt', 'literal ``` and # heading');
  const saved = importSource(root, 'input', { input: 'input.txt' });
  const before = read('docs/sources/manifest.json');
  install(root, SOURCE); install(root, SOURCE, { command: 'update' });
  assert.deepEqual(read('docs/sources/manifest.json'), before);
  fs.rmSync(path.join(root, '.harness'), { recursive: true });
  install(root, SOURCE);
  assert.deepEqual(read('docs/sources/manifest.json'), before);
  const destination = fs.mkdtempSync(path.join(os.tmpdir(), 'notth-recovery-'));
  try {
    fs.cpSync(path.join(root, 'docs/sources'), path.join(destination, 'docs/sources'), { recursive: true });
    install(destination, SOURCE);
    assert.equal(sourceReport(destination).sources[0].sha256, saved.sha256);
  } finally { fs.rmSync(destination, { recursive: true, force: true }); }
});
test('edited or missing indexed files block imports without modifying manifest', () => {
  write('a.md', 'original'); const saved = importSource(root, 'a', { input: 'a.md' });
  const before = read('docs/sources/manifest.json');
  write(saved.normalized, 'tampered');
  assert.throws(() => importSource(root, 'b', { input: 'a.md' }), /integrity conflict/);
  assert.deepEqual(read('docs/sources/manifest.json'), before);
  fs.unlinkSync(path.join(root, saved.normalized));
  assert.throws(() => sourceReport(root), /regular file/);
});
test('rejects malformed manifests, traversal, destination collisions, invalid UTF-8 and inappropriate flags', () => {
  write('a.md', 'a');
  assert.throws(() => importSource(root, '../bad', { input: 'a.md' }), /slug/);
  const colliding = `docs/sources/originals/a/${digest(Buffer.from('a'))}.md`;
  fs.mkdirSync(path.dirname(path.join(root, colliding)), { recursive: true }); write(colliding, 'occupied');
  assert.throws(() => importSource(root, 'a', { input: 'a.md' }), /collision/);
  assert.equal(read(colliding).toString(), 'occupied');
  write('invalid.txt', Buffer.from([0xff]));
  assert.throws(() => importSource(root, 'invalid', { input: 'invalid.txt' }), /UTF-8/);
  write('docs/sources/manifest.json', '{bad json');
  assert.throws(() => sourceReport(root), /Cannot read sources manifest/);
  write('docs/sources/manifest.json', JSON.stringify({ schema_version: 2, sources: [] }));
  assert.throws(() => sourceReport(root), /schema/);
  assert.match(cli(['import-source', 'x'], 2).message, /requires --input/);
  assert.match(cli(['sources', '--normalized', 'a.md'], 2).message, /not supported/);
});
test('symlinked source and store paths fail safely where symlinks are supported', t => {
  write('a.md', 'text');
  try { fs.symlinkSync(path.join(root, 'a.md'), path.join(root, 'linked.md')); }
  catch (error) { if (['EPERM', 'EACCES'].includes(error.code)) return t.skip('Host disallows symlink creation'); throw error; }
  assert.throws(() => importSource(root, 'a', { input: 'linked.md' }), /symlink/i);
  fs.mkdirSync(path.join(root, 'store'));
  fs.symlinkSync(path.join(root, 'store'), path.join(root, 'docs'), process.platform === 'win32' ? 'junction' : 'dir');
  assert.throws(() => importSource(root, 'a', { input: 'a.md' }), /symlink/i);
});
test('ordinary partial write failure rolls back original and normalized files', () => {
  write('a.md', 'text'); let calls = 0;
  assert.throws(() => importSource(root, 'a', { input: 'a.md', writer: (filename, data) => {
    if (++calls === 3) throw new Error('disk unavailable'); atomicWrite(filename, data);
  } }), /disk unavailable/);
  assert.equal(sourceReport(root).sources.length, 0);
  assert.ok(!fs.existsSync(path.join(root, 'docs/sources/manifest.json')));
  assert.equal(importSource(root, 'a', { input: 'a.md' }).action, 'imported');
});
test('bounded reads reject oversized files and blank conversions before any source writes', () => {
  write('large.pdf', ''); fs.truncateSync(path.join(root, 'large.pdf'), 64 * 1024 * 1024 + 1);
  assert.throws(() => importSource(root, 'large', { input: 'large.pdf' }), /size limit/);
  write('a.pdf', 'pdf'); write('empty.md', '   ');
  assert.throws(() => importSource(root, 'a', { input: 'a.pdf', normalized: 'empty.md' }), /nonempty/);
  assert.ok(!fs.existsSync(path.join(root, 'docs')));
});
test('manifest paths and hashes cannot redirect writes or hide malformed revisions', () => {
  write('a.md', 'text'); importSource(root, 'a', { input: 'a.md' });
  const good = index();
  const malformed = structuredClone(good);
  malformed.sources[0].revisions[0].original = '../outside.md';
  write('docs/sources/manifest.json', JSON.stringify(malformed));
  assert.throws(() => importSource(root, 'b', { input: 'a.md' }), /Invalid original path/);
  malformed.sources[0].revisions[0].original = good.sources[0].revisions[0].original;
  malformed.sources[0].revisions[0].sha256 = [good.sources[0].revisions[0].sha256];
  write('docs/sources/manifest.json', JSON.stringify(malformed));
  assert.throws(() => sourceReport(root), /Invalid source revision/);
});
test('absolute external input is copied without persisting machine paths', () => {
  const external = fs.mkdtempSync(path.join(os.tmpdir(), 'notth-external-'));
  try {
    const filename = path.join(external, 'outside.md'); fs.writeFileSync(filename, '# Outside');
    const result = importSource(root, 'outside', { input: filename });
    fs.rmSync(external, { recursive: true });
    assert.equal(read(result.original).toString(), '# Outside');
    assert.ok(!read('docs/sources/manifest.json').toString().includes(external));
    assert.equal(sourceReport(root).sources.length, 1);
  } finally { fs.rmSync(external, { recursive: true, force: true }); }
});
