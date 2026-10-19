import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import * as h from '../cli/harness.js';

let base, project, source;
beforeEach(() => {
  base = fs.mkdtempSync(path.join(os.tmpdir(), 'aih-test-'));
  project = path.join(base, 'project with spaces');
  source = path.join(base, 'source');
  fs.mkdirSync(project);
  fs.mkdirSync(source);
  for (const name of ['core', 'adapters', 'integrations', 'templates', 'harness.yaml']) fs.cpSync(path.join(h.SOURCE, name), path.join(source, name), { recursive: true });
});
afterEach(() => fs.rmSync(base, { recursive: true, force: true }));

function run(command = 'init', args = [], code = 0) {
  const result = spawnSync(process.execPath, [path.join(h.SOURCE, 'bin/aih.js'), command,
    ...(['init', 'update'].includes(command) ? ['--source', source] : []), ...args], { cwd: project, encoding: 'utf8' });
  assert.equal(result.status, code, result.stdout + result.stderr);
  return JSON.parse(result.stdout || result.stderr);
}
function snapshot(root = project) {
  const result = {};
  const visit = dir => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, entry.name);
      if (entry.isDirectory()) visit(p);
      else if (entry.isFile()) result[path.relative(root, p).split(path.sep).join('/')] = fs.readFileSync(p).toString('base64');
    }
  };
  visit(root); return result;
}
function write(name, data) {
  const p = path.join(project, name); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, data);
}
function nextPatch() {
  const [major, minor, patch] = h.manifest(source).version.split('.');
  return [major, minor, String(BigInt(patch) + 1n)].join('.');
}
function bump(version) {
  const p = path.join(source, 'harness.yaml'), value = h.readJson(p);
  value.version = version; fs.writeFileSync(p, JSON.stringify(value));
}

test('init defaults to cwd, installs all adapters and passes check', () => {
  run('init', ['--adapters', 'java-spring,react-nextjs,react-native,ai-python']);
  assert.ok(fs.existsSync(path.join(project, '.notth/adapters/ai-python/rules.md')));
  assert.ok(fs.existsSync(path.join(project, '.agents/skills/harness-tdd/SKILL.md')));
  assert.equal(run('check').status, 'ok');
});
test('explicit --target supports paths with spaces', () => {
  const other = path.join(base, 'another project'); fs.mkdirSync(other);
  run('init', ['--target', other]);
  assert.ok(fs.existsSync(path.join(other, h.LOCK))); assert.deepEqual(snapshot(), {});
});
test('preserves existing AGENTS bytes, CRLF and Unicode; rerun is idempotent', () => {
  const original = Buffer.from('# Quy tắc\r\nKeep me\r\n'); write('AGENTS.md', original);
  run(); const before = snapshot(); assert.deepEqual(run().changes, []);
  assert.deepEqual(snapshot(), before);
  assert.ok(fs.readFileSync(path.join(project, 'AGENTS.md')).subarray(0, original.length).equals(original));
});
test('dry-run leaves no files', () => {
  assert.ok(run('init', ['--dry-run']).changes.length > 10); assert.deepEqual(snapshot(), {});
});
test('unmanaged collision refuses full install', () => {
  write('.agents/skills/harness-tdd/SKILL.md', 'project owned');
  const before = snapshot(); run('init', [], 1); assert.deepEqual(snapshot(), before);
});
for (const futureMinor of [false, true]) test('update preserves project overrides, config and AGENTS appendix' +
  (futureMinor ? ' (future minor release)' : ' (current release)'), () => {
  if (futureMinor) {
    const [major, minor] = h.manifest(source).version.split('.');
    bump([major, String(BigInt(minor) + 1n), '0'].join('.'));
  }
  run('init', ['--adapters', 'java-spring']);
  fs.appendFileSync(path.join(project, 'AGENTS.md'), '\nLocal appendix\n');
  write('.notth/local.md', 'Custom policy'); write('openspec/config.yaml', 'schema: spec-driven\ncontext: Custom\n');
  const next = nextPatch(); bump(next); run('update');
  assert.equal(run('check').version, next);
  assert.ok(fs.readFileSync(path.join(project, 'AGENTS.md'), 'utf8').endsWith('\nLocal appendix\n'));
  assert.equal(fs.readFileSync(path.join(project, '.notth/local.md'), 'utf8'), 'Custom policy');
  assert.match(fs.readFileSync(path.join(project, 'openspec/config.yaml'), 'utf8'), /Custom/);
});
test('changed payload blocks check and update before writing', () => {
  run(); fs.appendFileSync(path.join(project, '.notth/core/rules/context.md'), '\nCustom\n');
  const before = snapshot(); bump(nextPatch()); run('update', [], 1); run('check', [], 1);
  assert.deepEqual(snapshot(), before);
});
test('edited managed AGENTS block is detected', () => {
  run(); const p = path.join(project, 'AGENTS.md');
  fs.writeFileSync(p, fs.readFileSync(p, 'utf8').replace('Never treat', 'Always treat'));
  run('check', [], 1); run('update', [], 1);
});
test('malformed markers fail without writes', () => {
  for (const value of [h.START, h.END + h.START, h.START + h.START + h.END]) {
    write('AGENTS.md', value); const before = snapshot(); run('init', [], 1); assert.deepEqual(snapshot(), before);
  }
});
test('adapter change removes only unedited old managed files', () => {
  run('init', ['--adapters', 'java-spring']);
  write(h.CONFIG, JSON.stringify({ schema_version: 1, adapters: ['react-nextjs'] }));
  run('check', [], 1); run('update'); run('check');
  assert.ok(!fs.existsSync(path.join(project, '.notth/adapters/java-spring/rules.md')));
  assert.ok(fs.existsSync(path.join(project, '.notth/adapters/react-nextjs/rules.md')));
});
test('obsolete managed file removed, unrelated user file preserved', () => {
  run(); write('.notth/user-note.md', 'Keep');
  fs.unlinkSync(path.join(source, 'core/rules/context.md')); run('update');
  assert.ok(!fs.existsSync(path.join(project, '.notth/core/rules/context.md')));
  assert.equal(fs.readFileSync(path.join(project, '.notth/user-note.md'), 'utf8'), 'Keep');
});
test('deleted managed file is drift', () => {
  run(); fs.unlinkSync(path.join(project, '.notth/core/rules/context.md')); run('check', [], 1);
});
test('major upgrade needs flag, downgrade fails even with flag', () => {
  run(); bump('1.0.0'); const before = snapshot(); run('update', [], 1); assert.deepEqual(snapshot(), before);
  run('update', ['--allow-major']); bump('0.9.0'); run('update', ['--allow-major'], 1);
});
test('unknown, duplicate and empty adapter IDs fail', () => {
  for (const value of ['../../outside', 'java-spring,java-spring', 'java-spring,']) run('init', ['--adapters', value], 1);
  assert.deepEqual(snapshot(), {});
});
test('update on uninstalled project fails', () => run('update', [], 1));
test('symlinked destination parent and broken leaf cannot write outside target', () => {
  const outside = path.join(base, 'outside'); fs.mkdirSync(outside);
  fs.symlinkSync(outside, path.join(project, '.notth'), process.platform === 'win32' ? 'junction' : 'dir');
  run('init', [], 1); assert.deepEqual(fs.readdirSync(outside), []);
  fs.unlinkSync(path.join(project, '.notth'));
  fs.symlinkSync(path.join(outside, 'missing'), path.join(project, 'AGENTS.md'), 'file');
  run('init', [], 1); assert.ok(!fs.existsSync(path.join(outside, 'missing')));
});
test('source symlink rejected', () => {
  fs.symlinkSync(path.join(base, 'missing'), path.join(source, 'core/rules/linked.md'), 'file'); run('init', [], 1);
});
test('source and target overlap rejected', () => run('init', ['--target', source], 1));
test('target symlink rejected', () => {
  const link = path.join(base, 'link'); fs.symlinkSync(project, link, process.platform === 'win32' ? 'junction' : 'dir');
  run('init', ['--target', link], 1); assert.deepEqual(snapshot(), {});
});
test('lock path traversal rejected even with recalculated digest', () => {
  run(); const lock = h.readJson(path.join(project, h.LOCK));
  lock.files['.notth/core/../../../outside'] = 'a'.repeat(64); lock.bundle_sha256 = h.digest(h.encode(lock.files));
  write(h.LOCK, JSON.stringify(lock)); run('update', [], 1);
});
test('lock digest tampering detected', () => {
  run(); const lock = h.readJson(path.join(project, h.LOCK)); lock.files['AGENTS.md'] = 'a'.repeat(64);
  write(h.LOCK, JSON.stringify(lock)); run('check', [], 1);
});
test('exclusive install marker prevents concurrent install', () => {
  write('.notth-install.lock', '123'); const before = snapshot(); run('init', [], 1); assert.deepEqual(snapshot(), before);
});
test('ordinary write failure restores original file bytes', () => {
  write('first.txt', 'original'); const before = snapshot();
  assert.throws(() => h.transaction(project, { 'first.txt': Buffer.from('changed'), 'second.txt': Buffer.from('new') }, (p, data) => {
    if (p.endsWith('second.txt')) throw new Error('simulated write failure'); h.atomicWrite(p, data);
  }), /simulated write failure/);
  assert.deepEqual(snapshot(), before);
});
test('full failed install restores AGENTS and removes lock marker', () => {
  write('AGENTS.md', '# Original\n'); const before = snapshot();
  assert.throws(() => h.install(project, source, { writer: (p, data) => {
    if (p === path.join(project, h.LOCK)) throw new Error('simulated disk failure'); h.atomicWrite(p, data);
  } }), /simulated disk failure/);
  assert.deepEqual(snapshot(), before);
});
test('new-change uses pinned installed templates and refuses overwrite/traversal', () => {
  run(); fs.writeFileSync(path.join(source, 'templates/openspec/proposal.md'), 'Different future template');
  const result = run('new-change', ['add-order']); assert.ok(fs.existsSync(path.join(result.path, 'specs/add-order/spec.md')));
  assert.match(fs.readFileSync(path.join(result.path, 'proposal.md'), 'utf8'), /TODO/);
  const before = snapshot();
  for (const name of ['add-order', '../outside', 'archive']) run('new-change', [name], 1);
  assert.deepEqual(snapshot(), before);
});
test('doctor only reports tool presence and installation state', () => {
  run(); const before = snapshot(); assert.equal(typeof run('doctor').tools.node, 'boolean'); assert.deepEqual(snapshot(), before);
});
test('wrong config schema and missing config fail safely', () => {
  run(); write(h.CONFIG, '{"schema_version":9,"adapters":[]}'); run('check', [], 1);
  fs.unlinkSync(path.join(project, h.CONFIG)); const before = snapshot(); run('check', [], 1); run('update', [], 1);
  assert.deepEqual(snapshot(), before);
});
test('malformed source and adapter manifest fail', () => {
  bump('latest'); run('init', [], 1); bump('0.2.0');
  fs.writeFileSync(path.join(source, 'adapters/java-spring/adapter.yaml'), '[]'); run('init', ['--adapters', 'java-spring'], 1);
});
test('managed payload is reproducible regardless of adapter order', () => {
  run('init', ['--adapters', 'react-nextjs,java-spring']); const first = snapshot(); delete first[h.CONFIG];
  project = path.join(base, 'second'); fs.mkdirSync(project); run('init', ['--adapters', 'java-spring,react-nextjs']);
  const second = snapshot(); delete second[h.CONFIG]; assert.deepEqual(first, second);
});
test('CLI help/version, invalid flags and duplicate args', () => {
  for (const option of ['--help', '-h', '--version', '-v']) {
    const r = spawnSync(process.execPath, [path.join(h.SOURCE, 'bin/aih.js'), option], { cwd: project, encoding: 'utf8' });
    assert.equal(r.status, 0); assert.ok(r.stdout.length); assert.deepEqual(snapshot(), {});
  }
  run('check', ['--dry-run'], 2); run('init', ['--wat'], 2); run('new-change', [], 2);
  run('init', ['--target', project, '--target', project], 2); run('init', ['--target='], 2);
});
for (const nextRelease of [false, true]) test('real Python 0.1 fixture checks and upgrades preserving project content' +
  (nextRelease ? ' (next patch)' : ' (current release)'), () => {
  // Simulate a Release Please bump without changing repository metadata.
  if (nextRelease) {
    const [major, minor, patch] = h.manifest(source).version.split('.');
    bump([major, minor, String(BigInt(patch) + 1n)].join('.'));
  }
  const fixture = h.readJson(path.join(h.SOURCE, 'tests/fixtures/python-v0.1.0.json'));
  for (const [name, content] of Object.entries(fixture.files)) write(name, content);
  assert.match(run('check', [], 1).message, /aih update/);
  const local = fs.readFileSync(path.join(project, '.harness/local.md'));
  run('update');
  // Assert the checked-out Harness distribution version, not a hardcoded release candidate.
  assert.equal(run('check').version, h.manifest(source).version);
  assert.ok(fs.readFileSync(path.join(project, '.notth/local.md')).equals(local));
  const agents = fs.readFileSync(path.join(project, 'AGENTS.md'), 'utf8');
  assert.ok(agents.startsWith('# Existing project\n')); assert.ok(agents.endsWith('Keep this appendix.\n'));
});
test('edited Python 0.1 fixture refuses upgrade without overwrite', () => {
  const fixture = h.readJson(path.join(h.SOURCE, 'tests/fixtures/python-v0.1.0.json'));
  for (const [name, content] of Object.entries(fixture.files)) write(name, content);
  fs.appendFileSync(path.join(project, '.harness/core/rules/context.md'), 'Custom');
  const before = snapshot(); run('update', [], 1); assert.deepEqual(snapshot(), before);
});

test('Notth updates legacy AI Harness ownership without duplicating blocks or losing user context', () => {
  const manifestFile = path.join(source, 'harness.yaml');
  const currentManifest = fs.readFileSync(manifestFile, 'utf8');
  const legacyManifest = JSON.parse(currentManifest);
  legacyManifest.name = 'ai-harness';
  legacyManifest.distribution.npm = '@manhd_d/ai-harness';
  fs.writeFileSync(manifestFile, JSON.stringify(legacyManifest));
  const templateFile = path.join(source, 'templates/AGENTS.md');
  const currentTemplate = fs.readFileSync(templateFile, 'utf8');
  fs.writeFileSync(templateFile, currentTemplate.replace('## NOTTH ', '## AI Harness '));
  write('AGENTS.md', '# Project instructions\nPreserve this prefix.\n');
  run('init', ['--adapters', 'java-spring']);
  fs.appendFileSync(path.join(project, 'AGENTS.md'), '\nPreserve this appendix.\n');
  write('.notth/local.md', 'Reviewed project facts\n');
  const config = fs.readFileSync(path.join(project, '.notth/project.json'));
  fs.writeFileSync(manifestFile, currentManifest);
  fs.writeFileSync(templateFile, currentTemplate);
  run('update', ['--dry-run']);
  run('update');
  assert.equal(run('check').status, 'ok');
  const agents = fs.readFileSync(path.join(project, 'AGENTS.md'), 'utf8');
  assert.equal(agents.split('<!-- ai-harness:start -->').length - 1, 1);
  assert.match(agents, /## NOTTH /);
  assert.ok(agents.startsWith('# Project instructions\nPreserve this prefix.\n'));
  assert.ok(agents.endsWith('\nPreserve this appendix.\n'));
  assert.equal(fs.readFileSync(path.join(project, '.notth/local.md'), 'utf8'), 'Reviewed project facts\n');
  assert.deepEqual(fs.readFileSync(path.join(project, '.notth/project.json')), config);
  assert.ok(fs.existsSync(path.join(project, '.agents/skills/harness-start/SKILL.md')));
  assert.deepEqual(run('update').changes, []);
});
