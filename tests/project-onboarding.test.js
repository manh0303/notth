import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { SOURCE, install, check, doctor } from '../cli/harness.js';
import { setupProject } from '../cli/setup.js';
import { loadProjectDecisions, projectDecisionReport } from '../cli/project-decisions.js';
import { compactStart, startPlan } from '../cli/start.js';
import { seed, knowledgeReport } from '../cli/knowledge.js';
import { backupConfig, restoreConfig } from '../cli/portable-config.js';

function project(t, options = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'aih-project-onboard-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  if (options.install !== false) install(root, SOURCE, options);
  return root;
}
function write(root, name, value) {
  const p = path.join(root, name); fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, typeof value === 'string' ? value : JSON.stringify(value));
}
const read = (root, name) => fs.readFileSync(path.join(root, name), 'utf8');
function snapshot(root) {
  const files = {};
  function walk(folder) {
    for (const e of fs.readdirSync(path.join(root, folder), { withFileTypes: true })) {
      const name = folder ? folder + '/' + e.name : e.name;
      if (e.isDirectory()) walk(name); else if (e.isFile()) files[name] = read(root, name);
    }
  }
  walk(''); return files;
}
function cli(root, args, code = 0) {
  const r = spawnSync(process.execPath, [path.join(SOURCE, 'bin/aih.js'), ...args], { cwd: root, encoding: 'utf8' });
  assert.equal(r.status, code, r.stdout + r.stderr); return JSON.parse(r.stdout || r.stderr);
}
const confirmed = (id, scope = 'project') => ({ id, scope, status: 'confirmed', question: 'Which error contract?',
  answer: 'Use the current documented contract', reason: 'Accepted project convention', source: 'docs/conventions.md' });

test('cloned snapshot can scaffold all missing shared configs without changing managed bytes or lock', t => {
  const root = project(t, { adapters: ['java-spring'], host: 'kiro' });
  const locked = JSON.parse(read(root, '.notth/lock.json'));
  const managedBefore = Object.fromEntries(Object.keys(locked.files).map(p => [p, read(root, p)]));
  const lockBefore = read(root, '.notth/lock.json');
  for (const name of ['project.json', 'agents.json', 'artifacts.json', 'integrations.json', 'environment.json', 'local.md', 'decisions.json']) fs.rmSync(path.join(root, '.notth', name));
  fs.rmSync(path.join(root, 'openspec/config.yaml'));
  const before = snapshot(root);
  const preview = setupProject(root, { apply: true, dryRun: true });
  assert.ok(preview.changes.includes('.notth/project.json')); assert.deepEqual(snapshot(root), before);
  assert.equal(setupProject(root, { apply: true }).applied, true);
  assert.equal(check(root).status, 'ok'); assert.deepEqual(JSON.parse(read(root, '.notth/project.json')).adapters, ['java-spring']);
  assert.equal(read(root, '.notth/lock.json'), lockBefore);
  for (const [p, data] of Object.entries(managedBefore)) assert.equal(read(root, p), data, p);
  assert.equal(fs.existsSync(path.join(root, '.notth/machine.json')), false);
  assert.equal(fs.existsSync(path.join(root, '.notth/start.json')), false);
  assert.deepEqual(setupProject(root, { apply: true }).changes, []);
});

test('setup is read-only by default and preserves existing answers, custom fields, local paths and native files', t => {
  const root = project(t, { host: 'kiro' });
  write(root, '.notth/local.md', '# Existing approved project context\n');
  const agents = JSON.parse(read(root, '.notth/agents.json'));
  agents.execution.budget = { maxTokens: 42000 }; agents.agents['core:reviewer'].extensions = ['plugins/local/reviewer.md'];
  write(root, '.notth/agents.json', agents); write(root, 'plugins/local/reviewer.md', '# Review\n');
  write(root, '.notth/environment.json', { schema_version: 1, tools: { node: { executable: 'node' } }, files: {}, commands: {} });
  write(root, '.notth/machine.json', { schema_version: 1, tools: { node: { executable: process.execPath } } });
  write(root, '.kiro/steering/personal.md', '# User steering\n');
  const before = snapshot(root); setupProject(root); assert.deepEqual(snapshot(root), before);
  assert.deepEqual(setupProject(root, { apply: true }).changes, []); assert.deepEqual(snapshot(root), before);
  install(root, SOURCE, { command: 'update' }); assert.deepEqual(snapshot(root), before);
  assert.equal(doctor(root).status, 'ok');
});

test('setup rejects managed drift, selection mismatch, malformed decisions and invalid environments before writes', t => {
  const root = project(t); fs.rmSync(path.join(root, '.notth/decisions.json'));
  const managed = '.notth/core/rules/context.md', original = read(root, managed); write(root, managed, 'changed');
  let before = snapshot(root); assert.throws(() => setupProject(root, { apply: true }), /drift/); assert.deepEqual(snapshot(root), before);
  write(root, managed, original); write(root, '.notth/project.json', { schema_version: 1, adapters: ['java-spring'], capabilities: [] });
  before = snapshot(root); assert.throws(() => setupProject(root, { apply: true }), /selection changed/); assert.deepEqual(snapshot(root), before);
  write(root, '.notth/project.json', { schema_version: 1, adapters: [], capabilities: [] });
  write(root, '.notth/environment.json', { schema_version: 2 });
  before = snapshot(root); assert.throws(() => setupProject(root, { apply: true })); assert.deepEqual(snapshot(root), before);
  write(root, '.notth/environment.json', { schema_version: 1, tools: {}, files: {}, commands: {} });
  write(root, '.notth/decisions.json', { schema_version: 1, decisions: [{ ...confirmed('D-1'), source: '' }] });
  before = snapshot(root); assert.throws(() => setupProject(root, { apply: true }), /project decisions/); assert.deepEqual(snapshot(root), before);
});

test('setup rolls back missing config creation on an ordinary write failure', t => {
  const root = project(t); for (const name of ['agents.json', 'decisions.json', 'environment.json']) fs.rmSync(path.join(root, '.notth', name));
  const before = snapshot(root);
  assert.throws(() => setupProject(root, { apply: true, writer: (p, data) => {
    if (p.endsWith('decisions.json')) throw Error('injected write failure'); fs.writeFileSync(p, data);
  } }), /injected/);
  assert.deepEqual(snapshot(root), before);
});

test('project decisions retain scope/history and never make proposals or superseded answers current', t => {
  const root = project(t);
  const old = { ...confirmed('D-1'), status: 'superseded', superseded_by: 'D-2', do_not_ask_again: true };
  write(root, '.notth/decisions.json', { schema_version: 1, decisions: [old, confirmed('D-2'), confirmed('D-3', 'module:billing'),
    confirmed('D-4', 'module:catalog'), { id: 'D-5', scope: 'project', status: 'proposed', question: 'New contract?', do_not_ask_again: true }] });
  assert.equal(loadProjectDecisions(root).decisions.length, 5);
  const report = projectDecisionReport(root, 'module:billing');
  assert.deepEqual(report.confirmed.map(d => d.id), ['D-2', 'D-3']); assert.equal(report.proposed[0].id, 'D-5');
  assert.equal(report.superseded[0].id, 'D-1'); assert.match(report.note, /reconsideration/);
  assert.equal(startPlan(root).project_decisions.confirmed.length, 3);
  assert.equal(cli(root, ['decisions', '--scope', 'module:billing']).confirmed.length, 2);
  cli(root, ['decisions', '--scope', 'invalid'], 1);
});

test('decision schema rejects duplicate IDs, missing replacements and cyclic/cross-scope supersession without writes', t => {
  const root = project(t);
  for (const rows of [
    [confirmed('D-1'), confirmed('D-1')],
    [{ ...confirmed('D-1'), status: 'superseded', superseded_by: 'D-2' }],
    [{ ...confirmed('D-1'), status: 'superseded', superseded_by: 'D-2' }, { ...confirmed('D-2'), status: 'superseded', superseded_by: 'D-1' }],
    [{ ...confirmed('D-1'), status: 'superseded', superseded_by: 'D-2' }, confirmed('D-2', 'module:other')]
  ]) {
    write(root, '.notth/decisions.json', { schema_version: 1, decisions: rows }); const before = snapshot(root);
    assert.throws(() => install(root, SOURCE, { command: 'update' }), /project decisions/); assert.deepEqual(snapshot(root), before);
  }
});

test('confirmed decisions are backed up/restored for the same repo, omitted on transfer and invalidate context when changed', t => {
  const root = project(t); write(root, 'README.md', '# Project source\n');
  write(root, '.notth/local.md', '---\nschema_version: 1\nsources: ["README.md"]\n---\nObserved: README.md\n');
  write(root, '.notth/decisions.json', { schema_version: 1, decisions: [confirmed('D-1')] });
  seed(root, { record: true }); assert.equal(knowledgeReport(root).status, 'current');
  const saved = backupConfig(root), same = project(t, { install: false }), other = project(t, { install: false });
  for (const dest of [same, other]) fs.copyFileSync(path.join(root, saved.backup), path.join(dest, 'backup.json'));
  restoreConfig(same, 'backup.json'); assert.deepEqual(loadProjectDecisions(same), loadProjectDecisions(root));
  restoreConfig(other, 'backup.json', { transfer: true }); assert.equal(loadProjectDecisions(other), null);
  write(root, '.notth/decisions.json', { schema_version: 1, decisions: [confirmed('D-1'), confirmed('D-2')] });
  assert.ok(knowledgeReport(root).changed_sources.includes('.notth/decisions.json'));
});

test('compact start avoids source discovery and CLI rejects accidental saving/unrelated options', t => {
  const root = project(t, { host: 'kiro' });
  write(root, '.notth/local.md', '# Legacy context\n');
  const before = snapshot(root), compact = compactStart(root, 'kiro');
  assert.equal(compact.context.freshness, 'unchecked'); assert.equal(compact.entry_action, '/harness-start'); assert.notEqual(compact.next_action, compact.entry_action);
  assert.equal(compact.project_decisions, undefined); assert.deepEqual(snapshot(root), before);
  assert.equal(cli(root, ['start', '--compact', '--host', 'kiro']).task, null);
  assert.match(cli(root, ['setup', '--greenfield']).workflow, /greenfield-setup/);
  cli(root, ['setup', '--dry-run'], 2); cli(root, ['start', '--compact', '--goal', 'idea', '--task', 'Test'], 2);
  cli(root, ['update', '--apply'], 2); cli(root, ['seed', '--greenfield'], 2);
  fs.rmSync(path.join(root, '.notth/project.json'));
  assert.equal(cli(root, ['setup', '--apply', '--dry-run']).applied, false);
  cli(root, ['setup', '--apply']); assert.equal(check(root).status, 'ok');
});
