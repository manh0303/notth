import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import * as h from '../cli/harness.js';
import { listCapabilities, loadCapability, skillCatalog, readSkill } from '../cli/capabilities.js';

let base, project, source;
beforeEach(() => {
  base = fs.mkdtempSync(path.join(os.tmpdir(), 'aih-uiux-'));
  project = path.join(base, 'project');
  source = path.join(base, 'source');
  fs.mkdirSync(project); fs.mkdirSync(source);
  for (const name of ['core', 'adapters', 'capabilities', 'integrations', 'templates', 'harness.yaml']) {
    fs.cpSync(path.join(h.SOURCE, name), path.join(source, name), { recursive: true });
  }
});
afterEach(() => fs.rmSync(base, { recursive: true, force: true }));
function write(relative, content, root = project) {
  const target = path.join(root, relative);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, typeof content === 'string' ? content : JSON.stringify(content));
}
function run(args, exit = 0) {
  const result = spawnSync(process.execPath, [path.join(h.SOURCE, 'bin/aih.js'), ...args], { cwd: project, encoding: 'utf8' });
  assert.equal(result.status, exit, result.stdout + result.stderr);
  return JSON.parse(result.stdout || result.stderr);
}
function snapshot() {
  const files = {};
  function walk(root) {
    for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
      const file = path.join(root, entry.name);
      if (entry.isDirectory()) walk(file);
      else if (entry.isFile()) files[path.relative(project, file)] = fs.readFileSync(file).toString('base64');
    }
  }
  walk(project); return files;
}

test('registered UI/UX capability preserves Figma workflows and adds neutral design delivery', () => {
  const registered = listCapabilities(source);
  assert.equal(registered.length, 8);
  assert.equal(registered.find(c => c.id === 'devops').skills.length, 6);
  assert.equal(loadCapability(source, 'devops').workflows.length, 2);
  assert.ok(registered.some(c => c.id === 'uiux'));
  assert.ok(registered.some(c => c.id === 'product'));
  assert.equal(registered.find(c => c.id === 'uiux').skills.length, 8);
  assert.deepEqual(loadCapability(source, 'uiux').workflows, ['workflows/docs-to-figma.md', 'workflows/idea-to-figma.md', 'workflows/design-delivery.md']);
  assert.deepEqual(snapshot(), {});
});

test('core-only install excludes UI/UX and keeps project small', () => {
  run(['init', '--source', source]);
  const lock = h.loadLock(project);
  assert.deepEqual(lock.adapters, []);
  assert.deepEqual(lock.capabilities, []);
  assert.ok(!fs.existsSync(path.join(project, '.notth/capabilities')));
  assert.ok(!fs.existsSync(path.join(project, '.agents/skills/harness-uiux-figma-design/SKILL.md')));
  assert.equal(run(['check']).status, 'ok');
});

test('selective uiux installation copies only selected skills and workflow', () => {
  run(['init', '--source', source, '--capabilities', 'uiux']);
  const lock = h.loadLock(project);
  assert.deepEqual(lock.capabilities, ['uiux']);
  assert.deepEqual(lock.adapters, []);
  assert.ok(fs.existsSync(path.join(project, '.notth/capabilities/uiux/workflows/docs-to-figma.md')));
  assert.ok(fs.existsSync(path.join(project, '.agents/skills/harness-uiux-figma-design/SKILL.md')));
  assert.ok(!fs.existsSync(path.join(project, '.notth/adapters/java-spring')));
  assert.equal(run(['check']).status, 'ok');
  assert.deepEqual(run(['init', '--source', source, '--capabilities', 'uiux']).changes, []);
});

test('UI/UX combines with a stack adapter without installing unrelated adapters', () => {
  run(['init', '--source', source, '--capabilities', 'uiux', '--adapters', 'react-nextjs']);
  const lock = h.loadLock(project);
  assert.deepEqual(lock.capabilities, ['uiux']);
  assert.deepEqual(lock.adapters, ['react-nextjs']);
  assert.ok(fs.existsSync(path.join(project, '.agents/skills/harness-react-nextjs-accessible-ui/SKILL.md')));
  assert.ok(!fs.existsSync(path.join(project, '.notth/adapters/java-spring')));
});

test('list, skills and skill disclose metadata before locked full content', () => {
  run(['init', '--source', source, '--capabilities', 'uiux']);
  assert.equal(run(['list', '--source', source]).capabilities.length, 8);
  const before = snapshot(), result = run(['skills']);
  assert.equal(result.skills.length, fs.readdirSync(path.join(source, 'core/skills'), { withFileTypes: true }).filter(entry => entry.isDirectory()).length + loadCapability(source, 'uiux').skills.length);
  const entry = result.skills.find(s => s.name === 'harness-uiux-figma-design');
  assert.ok(entry.description);
  assert.ok(!JSON.stringify(result).includes('## Procedure'));
  const full = run(['skill', 'harness-uiux-figma-design']);
  assert.match(full.content, /## Procedure/);
  assert.match(full.content, /Figma MCP/);
  assert.deepEqual(snapshot(), before);
  run(['skill', 'not-installed'], 1);
  run(['skill', '../outside'], 1);
  run(['skill', 'harness-java-spring-spring-api'], 1);
});

test('capability selection changes require project-owned config and update', () => {
  run(['init', '--source', source]);
  const filename = path.join(project, h.CONFIG), config = h.readJson(filename);
  config.capabilities = ['uiux']; write(h.CONFIG, config);
  assert.equal(run(['check'], 1).status, 'error');
  run(['init', '--source', source, '--capabilities', 'uiux'], 1);
  run(['update', '--source', source]); assert.equal(run(['check']).status, 'ok');
  write('.notth/local.md', 'Project data');
  config.capabilities = []; write(h.CONFIG, config);
  run(['update', '--source', source]);
  assert.equal(run(['check']).status, 'ok');
  assert.ok(!fs.existsSync(path.join(project, '.agents/skills/harness-uiux-figma-design/SKILL.md')));
  assert.equal(fs.readFileSync(path.join(project, '.notth/local.md'), 'utf8'), 'Project data');
});

test('unsupported or malformed capability definitions fail before writing', () => {
  for (const choice of ['unknown', 'uiux,uiux', '../outside', 'uiux,']) {
    run(['init', '--source', source, '--capabilities', choice], 1);
    assert.deepEqual(snapshot(), {});
  }
  const file = 'capabilities/uiux/capability.json', original = h.readJson(path.join(source, file));
  for (const mutate of [m => { m.skills.push(m.skills[0]); }, m => { m.skills = ['harness-tdd']; },
    m => { m.workflows = ['../escape.md']; }, m => { m.schema_version = 999; }]) {
    const changed = structuredClone(original); mutate(changed); write(file, changed, source);
    run(['init', '--source', source, '--capabilities', 'uiux'], 1);
    assert.deepEqual(snapshot(), {});
  }
});

test('edited and symlinked capability payloads block update or install', () => {
  const sourceSkill = path.join(source, 'capabilities/uiux/skills/harness-uiux-figma-design/SKILL.md');
  fs.unlinkSync(sourceSkill);
  fs.symlinkSync(path.join(base, 'outside'), sourceSkill, 'file');
  run(['init', '--source', source, '--capabilities', 'uiux'], 1);
  assert.deepEqual(snapshot(), {});
  fs.rmSync(sourceSkill); fs.copyFileSync(path.join(h.SOURCE, 'capabilities/uiux/skills/harness-uiux-figma-design/SKILL.md'), sourceSkill);
  run(['init', '--source', source, '--capabilities', 'uiux']);
  write('.agents/skills/harness-uiux-figma-design/SKILL.md', 'tampered');
  const before = snapshot();
  run(['skills'], 1); run(['skill', 'harness-uiux-figma-design'], 1);
  run(['update', '--source', source], 1);
  assert.deepEqual(snapshot(), before);
});

test('legacy lock and project config without capabilities remain compatible', () => {
  run(['init', '--source', source]);
  const lock = h.readJson(path.join(project, h.LOCK));
  delete lock.capabilities;
  lock.bundle_sha256 = h.digest(h.encode(lock.files));
  write(h.LOCK, lock);
  const config = h.readJson(path.join(project, h.CONFIG));
  delete config.capabilities;
  write(h.CONFIG, config);
  assert.equal(run(['check']).status, 'ok');
  run(['update', '--source', source]);
  assert.equal(run(['check']).status, 'ok');
  assert.deepEqual(h.loadLock(project).capabilities, []);
});

test('DevOps capability and Kubernetes adapter install together without external effects', () => {
  run(['init', '--source', source, '--adapters', 'java-spring,kubernetes', '--capabilities', 'devops']);
  assert.deepEqual(h.loadLock(project).adapters, ['java-spring', 'kubernetes']);
  assert.deepEqual(h.loadLock(project).capabilities, ['devops']);
  assert.ok(fs.existsSync(path.join(project, '.agents/skills/harness-devops-deployment/SKILL.md')));
  assert.ok(fs.existsSync(path.join(project, '.agents/skills/harness-kubernetes-workload-review/SKILL.md')));
  assert.ok(!fs.existsSync(path.join(project, '.notth/capabilities/uiux')));
  assert.equal(run(['check']).status, 'ok');
  assert.equal(run(['verify']).executed, false);
  assert.ok(run(['eval']).dataset.cases.some(c => c.id === 'kubernetes/unsafe-rollout'));
  const before = snapshot();
  run(['skill', 'harness-devops-incident-response']);
  assert.deepEqual(snapshot(), before);
});

test('DevOps can be removed and drift blocks updates', () => {
  run(['init', '--source', source, '--capabilities', 'devops']);
  const config = h.readJson(path.join(project, h.CONFIG));
  config.capabilities = []; write(h.CONFIG, config);
  run(['update', '--source', source]);
  assert.ok(!fs.existsSync(path.join(project, '.agents/skills/harness-devops-ci-cd/SKILL.md')));
  config.capabilities = ['devops']; write(h.CONFIG, config);
  run(['update', '--source', source]); assert.equal(run(['check']).status, 'ok');
  write('.notth/capabilities/devops/workflows/pr-to-production.md', 'tampered');
  const before = snapshot(); run(['update', '--source', source], 1);
  assert.deepEqual(snapshot(), before);
});

test('capability and combined evaluation scopes remain advisory and locked', () => {
  run(['init', '--source', source, '--capabilities', 'product,uiux,devops', '--adapters', 'java-spring,kubernetes']);
  const before = snapshot();
  const checks = run(['verify', '--scope', 'all']);
  assert.equal(checks.executed, false);
  assert.ok(checks.checks.some(x => x.capability === 'product'));
  assert.ok(checks.checks.some(x => x.core === true));
  const report = run(['eval', '--scope', 'all']);
  assert.equal(report.scope, 'all');
  assert.ok(report.dataset.cases.some(x => x.id === 'composition/product-uiux-handoff'));
  assert.ok(report.dataset.cases.some(x => x.id === 'composition/release-approval'));
  assert.ok(report.dataset.cases.some(x => x.id.startsWith('capability/')));
  assert.ok(report.dataset.cases.some(x => x.id.startsWith('core/')));
  assert.deepEqual(snapshot(), before);
  const synthetic = report.report;
  Object.assign(synthetic.metadata, { model: 'synthetic', harness_commit: 'test', reviewer: 'test',
    run_id: 'test', parameters: 'offline' });
  for (const row of synthetic.results) { row.scores.fill(true); row.assertions?.fill(true); row.evidence = 'Synthetic only; no model executed'; }
  write('report.json', synthetic);
  assert.equal(run(['eval', '--scope', 'all', '--report', 'report.json']).status, 'pass');
  run(['eval', '--scope', 'adapters', '--report', 'report.json'], 1);
  write('.notth/capabilities/product/evals/cases.json', '{}');
  run(['eval', '--scope', 'all'], 1);
});

test('core-only scope is available without adapters; legacy adapter scope stays unchanged', () => {
  run(['init', '--source', source]);
  assert.equal(run(['verify']).checks.length, 0);
  run(['eval'], 1);
  const core = run(['eval', '--scope', 'core']);
  assert.ok(core.dataset.cases.some(c => c.id === 'core/approval-boundary'));
  assert.ok(!core.dataset.cases.some(c => c.id.startsWith('composition/')));
  assert.equal(run(['verify', '--scope', 'core']).executed, false);
  run(['eval', '--scope', 'wrong'], 1);
});
