import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { SOURCE, install, check, digest } from '../cli/harness.js';
import { startPlan, saveStart, guidedStart } from '../cli/start.js';
import { USER_FILES, backupConfig, restoreConfig } from '../cli/portable-config.js';
let parent, root;
beforeEach(() => { parent = fs.mkdtempSync(path.join(os.tmpdir(), 'aih-portable-')); root = path.join(parent, 'source'); fs.mkdirSync(root); install(root, SOURCE); });
afterEach(() => fs.rmSync(parent, { recursive: true, force: true }));
function write(name, value, target = root) { const p = path.join(target, name); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, typeof value === 'string' ? value : JSON.stringify(value)); }
const read = (name, target = root) => fs.readFileSync(path.join(target, name), 'utf8');
function snapshot(target = root) { return Object.fromEntries(USER_FILES.filter(name => fs.existsSync(path.join(target, name))).map(name => [name, read(name, target)])); }
function target(backup) { const dest = path.join(parent, 'destination'); fs.mkdirSync(dest); fs.copyFileSync(path.join(root, backup), path.join(dest, 'backup.json')); return dest; }
function cli(args, code = 0) { const p = spawnSync(process.execPath, [path.join(SOURCE, 'bin/aih.js'), ...args], { cwd: root, encoding: 'utf8' }); assert.equal(p.status, code, p.stdout + p.stderr); return JSON.parse(p.stdout || p.stderr); }

test('start discovers sources and recommends based on evidence without writes or forced model selection', () => {
  write('pom.xml', '<project/>'); fs.mkdirSync(path.join(root, 'docs'));
  const before = snapshot(), plan = cli(['start']);
  assert.equal(plan.recommendation, 'change'); assert.ok(plan.discovery.evidence.includes('docs'));
  assert.match(plan.host_prompt, /Keep model defaults/); assert.deepEqual(snapshot(), before);
});
test('start saves a task and source/output declarations; repeat reuses answers; update preserves exact bytes', () => {
  saveStart(root, { goal: 'docs', task: 'Implement approved requirements', input: 'docs/requirements', output: 'docs/specs' });
  const before = snapshot(), plan = startPlan(root);
  assert.equal(plan.saved.goal, 'docs'); assert.deepEqual(plan.discovery.inputs, ['requirements']);
  assert.deepEqual(plan.questions, []);
  assert.deepEqual(JSON.parse(read('.notth/artifacts.json')).outputs.documents.location, { path: 'docs/specs' });
  install(root, SOURCE, { command: 'update' }); assert.deepEqual(snapshot(), before); assert.equal(check(root).status, 'ok');
  assert.throws(() => saveStart(root, { goal: 'docs', task: 'Overwrite', input: 'other-docs' }), /already configured/);
  assert.deepEqual(snapshot(), before);
});
test('terminal interview persists choices and does not repeat saved task or source questions', async () => {
  const answers = ['1', 'Plan an MVP', '', ''], questions = [];
  const result = await guidedStart(root, { ask: async q => { questions.push(q); return answers.shift(); } });
  assert.equal(result.saved.goal, 'idea'); assert.equal(result.saved.task, 'Plan an MVP'); assert.equal(answers.length, 0);
  let calls = 0; const repeat = await guidedStart(root, { ask: async () => { calls++; return ''; } });
  assert.equal(calls, 1); assert.deepEqual(repeat.saved, result.saved);
});
test('invalid start inputs or resume checkpoint fail before changing user files', () => {
  const before = snapshot();
  for (const options of [ { goal: 'wrong', task: 'Task' }, { goal: 'docs', task: 'Task', input: 'https://example.com/?token=SECRET' },
    { goal: 'docs', task: 'Task', output: '../escape' }, { goal: 'resume', task: 'Resume', changeId: 'missing' } ]) {
    assert.throws(() => saveStart(root, options)); assert.deepEqual(snapshot(), before);
  }
  write('openspec/changes/broken/checkpoint.json', { schema_version: 1 });
  assert.throws(() => saveStart(root, { goal: 'resume', task: 'Continue', changeId: 'broken' }), /checkpoint/);
  assert.deepEqual(snapshot(), before);
});
test('backup excludes machine, managed files, docs, checkpoint, custom skills and env values; roundtrip restores before init', () => {
  write('.notth/machine.json', { schema_version: 1, tools: {} }); write('docs/private.md', 'DOC_CONTENT');
  write('openspec/changes/old/checkpoint.json', 'CHECKPOINT_CONTENT'); write('.agents/skills/custom/SKILL.md', 'CUSTOM_SKILL');
  const backup = backupConfig(root), archive = JSON.parse(read(backup.backup));
  assert.deepEqual(Object.keys(archive.files).sort(), Object.keys(snapshot()).sort());
  assert.ok(!JSON.stringify(archive).includes('DOC_CONTENT')); assert.ok(!JSON.stringify(archive).includes('CHECKPOINT_CONTENT'));
  assert.ok(!JSON.stringify(archive).includes('CUSTOM_SKILL'));
  const dest = target(backup.backup), before = snapshot();
  restoreConfig(dest, 'backup.json'); assert.deepEqual(snapshot(dest), before);
  install(dest, SOURCE); assert.deepEqual(snapshot(dest), before); assert.equal(check(dest).status, 'ok');
  assert.equal(fs.existsSync(path.join(dest, '.notth/machine.json')), false);
});
test('transfer reuses models/modules and clears repo autonomy, omitting task, context, sources and commands', () => {
  saveStart(root, { goal: 'docs', task: 'Old repo task', input: 'docs/old', output: 'docs/specs' });
  const agents = JSON.parse(read('.notth/agents.json'));
  agents.execution.autonomy = { mode: 'autopilot', actions: ['merge'], repositories: ['old/repo'] };
  write('.notth/agents.json', agents);
  const backup = backupConfig(root), dest = target(backup.backup);
  restoreConfig(dest, 'backup.json', { transfer: true });
  assert.equal(JSON.parse(read('.notth/agents.json', dest)).defaultModel, agents.defaultModel);
  assert.equal(JSON.parse(read('.notth/agents.json', dest)).execution.autonomy, undefined);
  for (const name of ['.notth/start.json', '.notth/artifacts.json', '.notth/environment.json', '.notth/local.md']) assert.equal(fs.existsSync(path.join(dest, name)), false);
  install(dest, SOURCE); assert.equal(startPlan(dest).saved, null); assert.deepEqual(startPlan(dest).discovery.inputs, []);
});
test('restore dry-run previews collisions, replacement makes before-backup, and no replace refuses writes', () => {
  write('.notth/local.md', '# Original\n'); const backup = backupConfig(root);
  write('.notth/local.md', '# Current\n'); const before = snapshot();
  const plan = restoreConfig(root, backup.backup, { dryRun: true });
  assert.ok(plan.conflicts.includes('.notth/local.md')); assert.deepEqual(snapshot(), before);
  assert.throws(() => restoreConfig(root, backup.backup), /differs/); assert.deepEqual(snapshot(), before);
  const result = restoreConfig(root, backup.backup, { replace: true });
  assert.equal(read('.notth/local.md'), '# Original\n');
  assert.equal(JSON.parse(read(result.backup)).files['.notth/local.md'].content, '# Current\n');
  assert.ok(read('.notth/.gitignore').includes('/backups/'));
});
test('restore rejects digest tamper, unknown schema, traversal, managed entries and invalid JSON before writes', () => {
  const backup = backupConfig(root), original = JSON.parse(read(backup.backup)), before = snapshot();
  for (const mutate of [ a => a.schema_version = 99, a => a.files['.notth/local.md'].content += 'tampered',
    a => a.files['../escape'] = a.files['.notth/local.md'], a => a.files['.notth/lock.json'] = a.files['.notth/local.md'],
    a => { const content = '{"secret":"SECRET_BAD_JSON"'; a.files['.notth/agents.json'] = { content, sha256: digest(Buffer.from(content)) }; } ]) {
    const archive = structuredClone(original); mutate(archive); write('bad.json', archive);
    assert.throws(() => restoreConfig(root, 'bad.json'), error => !error.message.includes('SECRET_BAD_JSON'));
    assert.deepEqual(snapshot(), before);
  }
});
test('backup and restore refuse symlinked paths, oversized files and reused output', () => {
  const backup = backupConfig(root, 'copy.json'); assert.throws(() => backupConfig(root, 'copy.json'), /exists/);
  write('.notth/local.md', 'x'.repeat(1024 * 1024 + 1)); assert.throws(() => backupConfig(root), /exceeds/);
  write('.notth/local.md', '# Valid');
  if (process.platform !== 'win32') {
    fs.symlinkSync(path.join(parent), path.join(root, 'link'));
    assert.throws(() => backupConfig(root, 'link/out.json'), /Symlink/);
    const dest = target(backup.backup); fs.symlinkSync(root, path.join(dest, '.notth'));
    assert.throws(() => restoreConfig(dest, 'backup.json'), /Symlink/);
  }
});
test('ordinary restore write failure rolls back changed user config', () => {
  const backup = backupConfig(root); write('.notth/local.md', '# New');
  const before = snapshot(); let calls = 0;
  assert.throws(() => restoreConfig(root, backup.backup, { replace: true, writer: (filename, bytes) => {
    if (++calls === 2) throw new Error('Simulated write failure'); fs.mkdirSync(path.dirname(filename), { recursive: true }); fs.writeFileSync(filename, bytes);
  } }), /Simulated/);
  assert.deepEqual(snapshot(), before); assert.equal(fs.existsSync(path.join(root, '.notth-install.lock')), false);
});
test('CLI accepts explicit save and backup/restore flags, rejects unrelated/missing flags', () => {
  assert.equal(cli(['start', '--goal', 'change', '--task', 'Fix the bug']).saved.task, 'Fix the bug');
  const backup = cli(['backup', '--output', 'profile.json']); assert.equal(backup.backup, 'profile.json');
  assert.equal(cli(['restore', '--from', 'profile.json', '--dry-run']).status, 'planned');
  cli(['start', '--task', 'No goal'], 2); cli(['backup', '--transfer'], 2); cli(['restore'], 2);
});

test('resume blockers/missing evidence remain blocked and a new task can replace saved resume intent', () => {
  write('openspec/changes/paused/checkpoint.json', { schema_version: 1, change_id: 'paused', phase: 'implement', summary: 'Paused work', timestamp: '2026-10-14T00:00:00Z', baseline: [], completed: [], pending: [], in_progress: null, blockers: ['Need source access'], next_action: 'Review access', external_sources: [], operations: [] });
  assert.equal(saveStart(root, { goal: 'resume', task: 'Continue', changeId: 'paused' }).status, 'blocked');
  assert.equal(startPlan(root).resume.executed, false);
  fs.unlinkSync(path.join(root, 'openspec/changes/paused/checkpoint.json'));
  assert.equal(startPlan(root).status, 'blocked');
  assert.equal(saveStart(root, { goal: 'change', task: 'New task' }).status, 'ok');
});
test('invalid optional task schema and active installer marker stop writes', () => {
  write('.notth/start.json', 'null'); const before = snapshot();
  assert.throws(() => install(root, SOURCE, { command: 'update' }), /start.json/);
  assert.deepEqual(snapshot(), before); fs.unlinkSync(path.join(root, '.notth/start.json'));
  write('.notth-install.lock', 'active');
  assert.throws(() => saveStart(root, { goal: 'change', task: 'Task' }), /active/);
  assert.throws(() => backupConfig(root), /active/);
});
