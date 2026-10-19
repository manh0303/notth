import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import * as h from '../cli/harness.js';
import { detect, listAdapters, verify, evaluate, loadAdapter } from '../cli/adapters.js';

let base, root, source;
beforeEach(() => {
  base = fs.mkdtempSync(path.join(os.tmpdir(), 'aih-adapters-'));
  root = path.join(base, 'project'); source = path.join(base, 'source'); fs.mkdirSync(root); fs.mkdirSync(source);
  for (const name of ['core', 'adapters', 'integrations', 'templates', 'harness.yaml']) fs.cpSync(path.join(h.SOURCE, name), path.join(source, name), { recursive: true });
});
afterEach(() => fs.rmSync(base, { recursive: true, force: true }));
function write(file, value, dir = root) { const p = path.join(dir, file); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, typeof value === 'string' ? value : JSON.stringify(value)); }
function snapshot(dir = root) { const result = {}; function walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else if (e.isFile()) result[path.relative(dir, p)] = fs.readFileSync(p).toString('base64'); } } walk(dir); return result; }
function cli(args, expected = 0) { const r = spawnSync(process.execPath, [path.join(h.SOURCE, 'bin/aih.js'), ...args], { cwd: root, encoding: 'utf8' }); assert.equal(r.status, expected, r.stdout + r.stderr); return JSON.parse(r.stdout || r.stderr); }
function install(adapters = ['java-spring']) { h.install(root, source, { adapters }); }
function report() { const r = evaluate(root).report; Object.assign(r.metadata, { model: 'synthetic-fixture', harness_commit: 'fixture', reviewer: 'test', run_id: 'test', parameters: 'none' }); for (const row of r.results) { row.scores.fill(true); row.evidence = 'Synthetic test evidence; no model execution'; } return r; }

test('list validates six adapters and eighteen namespaced skills', () => {
  const result = listAdapters(source); assert.equal(result.adapters.length, 6);
  assert.equal(result.adapters.flatMap(a => a.skills).length, 18);
  assert.deepEqual(snapshot(), {});
});
test('detection distinguishes generic Java/Python from Spring/AI', () => {
  write('pom.xml', '<project>generic Java</project>'); write('pyproject.toml', '[project]\nname="ordinary"');
  assert.deepEqual(detect(root, source).adapters, []);
  write('pom.xml', '<groupId>org.springframework.boot</groupId>'); write('requirements.txt', 'openai>=1');
  const before = snapshot(); const result = detect(root, source);
  assert.deepEqual(result.adapters, ['ai-python', 'java-spring']); assert.equal(result.matches[0].evidence[0].file, 'pom.xml'); assert.deepEqual(snapshot(), before);
});
test('detects Gradle Kotlin Spring without executing build files', () => {
  write('build.gradle.kts', 'plugins { id("org.springframework.boot") }\nerror("DO NOT EXECUTE")');
  assert.deepEqual(detect(root, source).adapters, ['java-spring']);
});
test('detects native without treating React dependency alone as web', () => {
  write('package.json', { dependencies: { react: 'x', 'react-native': 'x' } });
  assert.deepEqual(detect(root, source).adapters, ['react-native']);
  write('package.json', { devDependencies: { next: 'x' }, peerDependencies: { 'react-dom': 'x' } });
  assert.deepEqual(detect(root, source).adapters, ['react-nextjs']);
});
test('detection stays in current module and ignores scripts text', () => {
  write('apps/web/package.json', { dependencies: { next: 'x' } }); write('package.json', { scripts: { note: 'next react-native openai' } });
  assert.deepEqual(detect(root, source).adapters, []);
});
test('detection refuses malformed JSON, oversized files and symlinks', () => {
  write('package.json', '{'); assert.throws(() => detect(root, source), /Invalid JSON/);
  write('package.json', ' '.repeat(1024 * 1024 + 1)); assert.throws(() => detect(root, source), /1 MiB/);
  fs.unlinkSync(path.join(root, 'package.json')); fs.symlinkSync(path.join(base, 'missing'), path.join(root, 'package.json'), 'file'); assert.throws(() => detect(root, source), /Symlink/);
});
test('init detect installs exactly suggested adapter; no match fails without writes', () => {
  cli(['init', '--detect', '--source', source], 1); assert.deepEqual(snapshot(), {});
  write('package.json', { dependencies: { next: 'x' } });
  cli(['init', '--detect', '--source', source, '--dry-run']); assert.ok(!fs.existsSync(path.join(root, h.LOCK)));
  cli(['init', '--detect', '--source', source]); assert.deepEqual(h.loadLock(root).adapters, ['react-nextjs']);
  assert.ok(fs.existsSync(path.join(root, '.agents/skills/harness-react-nextjs-accessible-ui/SKILL.md')));
});
test('explicit selection still works and plain init remains core-only', () => {
  write('package.json', { dependencies: { next: 'x' } }); install([]); assert.deepEqual(h.loadLock(root).adapters, []);
  assert.deepEqual(verify(root).checks, []); assert.throws(() => evaluate(root), /at least one/);
  cli(['init', '--detect', '--adapters', 'java-spring'], 2); cli(['update', '--detect'], 2); cli(['verify', '--report', 'x'], 1);
});
test('adapter schema rejects traversal, unknown execution and duplicate skill/check IDs', () => {
  const file = 'adapters/java-spring/adapter.yaml', original = h.readJson(path.join(source, file));
  for (const mutation of [m => { m.detection[0].file = '../outside'; }, m => { m.skills.push(m.skills[0]); }, m => { m.skills = ['harness-tdd']; }, m => { m.schema_version = 99; }]) {
    const m = structuredClone(original); mutation(m); write(file, m, source); assert.throws(() => install()); assert.deepEqual(snapshot(), {});
  }
  write(file, original, source);
  const f = 'adapters/java-spring/checks/verification.yaml', v = h.readJson(path.join(source, f));
  v.checks[0].execution = 'automatic'; write(f, v, source); assert.throws(() => loadAdapter(source, 'java-spring'), /Invalid check/);
  v.checks[0].execution = 'advisory'; v.checks.push(v.checks[0]); write(f, v, source); assert.throws(() => loadAdapter(source, 'java-spring'), /Duplicate checks/);
});
test('selected skills are locked, core skills remain shared, and removal preserves unrelated files', () => {
  install(['java-spring', 'react-nextjs']);
  const skills = fs.readdirSync(path.join(root, '.agents/skills'));
  const coreCount = fs.readdirSync(path.join(source, 'core/skills'), { withFileTypes: true }).filter(entry => entry.isDirectory()).length;
  assert.equal(skills.length, coreCount + loadAdapter(source, 'java-spring').skills.length + loadAdapter(source, 'react-nextjs').skills.length);
  write('.agents/skills/custom/SKILL.md', 'user skill');
  write(h.CONFIG, { schema_version: 1, adapters: ['react-nextjs'] }); h.install(root, source, { command: 'update' });
  assert.ok(!fs.existsSync(path.join(root, '.agents/skills/harness-java-spring-spring-api/SKILL.md')));
  assert.equal(fs.readFileSync(path.join(root, '.agents/skills/custom/SKILL.md'), 'utf8'), 'user skill');
});
test('edited adapter skill blocks update; unmanaged exposed skill collision blocks init', () => {
  const skill = '.agents/skills/harness-java-spring-spring-api/SKILL.md'; write(skill, 'custom'); const before = snapshot(); assert.throws(() => install(), /collision/); assert.deepEqual(snapshot(), before);
  fs.unlinkSync(path.join(root, skill)); install(); write(skill, 'edited'); assert.throws(() => h.install(root, source, { command: 'update' }), /Managed files changed/);
});
test('verify reads installed checks and never executes malicious wrapper content', () => {
  install(); write('mvnw', 'THIS MUST NEVER EXECUTE'); const before = snapshot();
  write('adapters/java-spring/checks/verification.yaml', '{', source);
  const result = cli(['verify']); assert.equal(result.status, 'planned'); assert.equal(result.executed, false);
  assert.equal(result.checks.find(c => c.id === 'maven').applicability, 'candidate');
  assert.equal(result.checks.find(c => c.id === 'gradle').applicability, 'not-detected'); assert.deepEqual(snapshot(), before);
});
test('verify and eval refuse drift in installed capability files', () => {
  install(); write('.notth/adapters/java-spring/checks/verification.yaml', '{}');
  assert.throws(() => verify(root), /drift/); assert.throws(() => evaluate(root), /drift/);
});
test('eval template binds selected cases to dataset and bundle; remains unscored', () => {
  install(['java-spring', 'react-native']); const before = snapshot(); const result = cli(['eval']);
  assert.equal(result.dataset.cases.length, loadAdapter(source, 'java-spring').cases.length + loadAdapter(source, 'react-native').cases.length);
  assert.ok(result.report.results.every(r => r.scores.every(v => v === null)));
  assert.equal(result.report.metadata.bundle_sha256, h.loadLock(root).bundle_sha256);
  assert.deepEqual(snapshot(), before); write('report.json', result.report); cli(['eval', '--report', 'report.json'], 1);
});
test('eval aggregates human evidence and returns nonzero for critical failure', () => {
  install(); const r = report(); write('report.json', r); assert.equal(cli(['eval', '--report', 'report.json']).status, 'pass');
  r.results[0].scores[0] = false; write('report.json', r); assert.deepEqual(cli(['eval', '--report', 'report.json'], 1).critical_failures, ['java-spring/outbox-atomicity']);
});
test('eval refuses stale bundle/dataset, omitted cases and empty evidence', () => {
  install(); for (const change of [r => { r.metadata.bundle_sha256 = '0'.repeat(64); }, r => { r.metadata.dataset_sha256 = '0'.repeat(64); }, r => r.results.pop(), r => { r.results[0].evidence = ''; }]) {
    const r = report(); change(r); write('report.json', r); assert.throws(() => evaluate(root, path.join(root, 'report.json')));
  }
});
test('eval ignores future source edits and rejects unlocked injected capability metadata', () => {
  install(); const before = evaluate(root); write('adapters/java-spring/evals/cases.json', '{}', source); assert.deepEqual(evaluate(root), before);
  const lock = h.loadLock(root); delete lock.files['.notth/adapters/java-spring/evals/cases.json']; lock.bundle_sha256 = h.digest(h.encode(lock.files)); write(h.LOCK, lock);
  assert.throws(() => evaluate(root), /not locked/);
});
for (const nextRelease of [false, true]) test('real npm 0.2 migration keeps notes, replaces metadata and installs new skills' +
  (nextRelease ? ' (next patch)' : ' (current release)'), () => {
  // Simulate a Release Please bump without changing repository metadata.
  if (nextRelease) {
    const next = h.manifest(source);
    const [major, minor, patch] = next.version.split('.');
    next.version = [major, minor, String(BigInt(patch) + 1n)].join('.');
    write('harness.yaml', next, source);
  }
  const fixture = h.readJson(path.join(h.SOURCE, 'tests/fixtures/npm-v0.2.0.json'));
  for (const [name, content] of Object.entries(fixture.files)) write(name, content);
  assert.throws(() => h.check(root), /aih update/); assert.throws(() => verify(root), /aih update/);
  h.install(root, source, { command: 'update' });
  // Current source version changes with Release Please; the legacy fixture remains pinned to 0.2.0.
  assert.equal(h.check(root).version, h.manifest(source).version);
  assert.ok(!fs.existsSync(path.join(root, '.notth/adapters/java-spring/adapter.json')));
  assert.ok(!fs.existsSync(path.join(root, '.agents/skills/harness-java-spring-kafka-outbox/SKILL.md')));
  assert.ok(fs.existsSync(path.join(root, '.agents/skills/harness-java-spring-spring-api/SKILL.md')));
  assert.ok(fs.readFileSync(path.join(root, 'AGENTS.md'), 'utf8').endsWith('Keep npm project notes.\n'));
});
test('edited legacy npm metadata blocks migration before any writes', () => {
  const fixture = h.readJson(path.join(h.SOURCE, 'tests/fixtures/npm-v0.2.0.json'));
  for (const [name, content] of Object.entries(fixture.files)) write(name, content);
  write('.harness/adapters/java-spring/adapter.json', '{"custom":true}'); const before = snapshot();
  assert.throws(() => h.install(root, source, { command: 'update' }), /Managed files changed/); assert.deepEqual(snapshot(), before);
});

test('Kubernetes detector is shallow and its checks are advisory', () => {
  write('notes.yaml', 'kind: Deployment');
  assert.deepEqual(detect(root, source).adapters, []);
  write('Chart.yaml', 'apiVersion: v2\\nname: payment-service');
  const before = snapshot();
  assert.deepEqual(detect(root, source).adapters, ['kubernetes']);
  assert.deepEqual(snapshot(), before);
  install(['kubernetes']);
  assert.equal(verify(root).checks.find(c => c.id === 'helm-lint').applicability, 'candidate');
  assert.equal(evaluate(root).dataset.cases.length, 2);
});

test('Astro detector prioritizes Astro over React islands, but preserves explicit Next projects', () => {
  write('package.json', { dependencies: { astro: '^5.0.0' } });
  assert.deepEqual(detect(root, source).adapters, ['astro']);
  write('package.json', { dependencies: { astro: '^5.0.0', '@astrojs/react': '^4.0.0', 'react-dom': '^19.0.0' } });
  const before = snapshot();
  const islands = detect(root, source);
  assert.deepEqual(islands.adapters, ['astro']);
  assert.deepEqual(islands.matches.map(m => m.id), ['astro']);
  assert.deepEqual(snapshot(), before, 'Detection must be read-only');
  write('package.json', { dependencies: { astro: '^5.0.0', next: '^15.0.0', 'react-dom': '^19.0.0' } });
  assert.deepEqual(detect(root, source).adapters, ['astro', 'react-nextjs']);
  write('package.json', { dependencies: { 'react-dom': '^19.0.0' } });
  assert.deepEqual(detect(root, source).adapters, ['react-nextjs']);
});

test('Astro selected adapter exposes exactly four locked skills and advisory checks', () => {
  cli(['init', '--source', source, '--adapters', 'astro']);
  assert.equal(h.check(root).status, 'ok');
  assert.deepEqual(h.loadLock(root).adapters, ['astro']);
  for (const id of ['project-architecture', 'islands', 'seo', 'performance']) {
    const name = 'harness-astro-' + id;
    const local = path.join(root, '.agents/skills', name, 'SKILL.md');
    assert.ok(fs.existsSync(local), 'Missing installed Astro skill ' + name);
    assert.equal(cli(['skill', name]).name, name);
  }
  assert.equal(cli(['skills']).skills.length, fs.readdirSync(path.join(source, 'core/skills'), { withFileTypes: true }).filter(entry => entry.isDirectory()).length + loadAdapter(source, 'astro').skills.length, 'Current Core skills plus selected Astro skills');
  const before = snapshot();
  const checks = cli(['verify']);
  assert.equal(checks.executed, false);
  assert.equal(checks.checks.length, 4);
  assert.equal(checks.checks.find(c => c.id === 'tool-browser').applicability, 'review-required');
  const evaluation = cli(['eval']);
  assert.equal(evaluation.dataset.cases.length, 4);
  assert.ok(evaluation.report.results.every(row => row.scores.every(score => score === null)));
  assert.deepEqual(snapshot(), before, 'Advisory reads must not mutate project');
});

test('Astro init --detect and composition with Product and UI/UX remain selective', () => {
  write('package.json', { dependencies: { astro: '^5', '@astrojs/react': '^4', 'react-dom': '^19' } });
  cli(['init', '--source', source, '--detect', '--dry-run']);
  const r = cli(['init', '--source', source, '--detect']);
  assert.equal(r.status, 'ok');
  assert.deepEqual(h.loadLock(root).adapters, ['astro']);
  assert.ok(!fs.existsSync(path.join(root, '.notth/adapters/react-nextjs')));
  assert.equal(cli(['check']).status, 'ok');
});

test('Astro deselection removes unmodified managed assets but preserves project-owned notes', () => {
  install(['astro']);
  write('.notth/local.md', 'Original project guidance');
  write(h.CONFIG, { schema_version: 1, adapters: [] });
  cli(['update', '--source', source]);
  assert.deepEqual(h.loadLock(root).adapters, []);
  assert.equal(fs.readFileSync(path.join(root, '.notth/local.md'), 'utf8'), 'Original project guidance');
  assert.ok(!fs.existsSync(path.join(root, '.agents/skills/harness-astro-islands/SKILL.md')));
  assert.equal(cli(['check']).status, 'ok');
});
