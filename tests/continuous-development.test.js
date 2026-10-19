import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { SOURCE, install, check, newChange, loadLock } from '../cli/harness.js';
import { evaluate, verify } from '../cli/adapters.js';
import { artifactImpact, artifactReport } from '../cli/artifacts.js';

let base, root;
beforeEach(() => { base = fs.mkdtempSync(path.join(os.tmpdir(), 'aih-continuous-')); root = path.join(base, 'consumer'); fs.mkdirSync(root); });
afterEach(() => fs.rmSync(base, { recursive: true, force: true }));
const read = (p, folder = root) => fs.readFileSync(path.join(folder, p), 'utf8');
function write(p, value, folder = root) {
  const target = path.join(folder, p); fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, typeof value === 'string' ? value : JSON.stringify(value));
}
const ids = ['feature', 'small-bug', 'business-rule', 'drift', 'resume', 'read-only', 'feedback'].map(s => 'core/continuous-' + s);

test('Core-only consumers discover the workflow, scaffold continuity in existing records and export all seven unscored scenarios', () => {
  install(root, SOURCE);
  const lock = loadLock(root);
  const workflow = '.notth/core/workflows/continuous-development.md';
  assert.ok(read('AGENTS.md').includes(workflow));
  assert.equal(read(workflow), read('core/workflows/continuous-development.md', SOURCE));
  assert.ok(lock.files[workflow]);
  assert.deepEqual(lock.capabilities, []);
  assert.ok(!fs.existsSync(path.join(root, '.notth/capabilities/product')));
  newChange(root, 'accepted-feature');
  const files = fs.readdirSync(path.join(root, 'openspec/changes/accepted-feature')).sort();
  assert.deepEqual(files, ['.openspec.yaml', 'artifact-impact.json', 'decisions.json', 'design.md', 'proposal.md', 'specs', 'tasks.md', 'verification.json']);
  for (const file of ['design.md', 'tasks.md']) {
    assert.equal(read('openspec/changes/accepted-feature/' + file),
      read('templates/openspec/' + file, SOURCE).replaceAll('{{change_id}}', 'accepted-feature'));
  }
  const result = evaluate(root, undefined, 'core');
  for (const id of ids) assert.ok(result.dataset.cases.some(c => c.id === id && c.critical));
  assert.ok(result.report.results.filter(c => ids.includes(c.id)).every(c => c.scores.every(s => s === null)));
  assert.equal(verify(root, 'core').executed, false);
  assert.equal(check(root).status, 'ok');
});

test('reviewed update preserves current user docs, handoff, decisions and routes instead of migrating old context', () => {
  const oldSource = path.join(base, 'old-source'); fs.mkdirSync(oldSource);
  for (const name of ['core', 'adapters', 'capabilities', 'integrations', 'templates', 'harness.yaml']) {
    fs.cpSync(path.join(SOURCE, name), path.join(oldSource, name), { recursive: true });
  }
  // Synthetic older snapshot, not a claim about a released bundle.
  fs.unlinkSync(path.join(oldSource, 'core/workflows/continuous-development.md'));
  write('templates/AGENTS.md', '<!-- ai-harness:start -->\nOlder snapshot {{version}}\n<!-- ai-harness:end -->\n', oldSource);
  write('templates/openspec/tasks.md', '# Tasks: {{change_id}}\n- [ ] Existing task\n', oldSource);
  install(root, oldSource, { capabilities: ['product', 'architecture', 'delivery'] });
  newChange(root, 'in-progress');
  const owned = {
    'docs/requirements.md': 'FR-002 rev 3, approved\nUser section must survive.\n',
    'docs/architecture/project-map.md': 'Code B; ADR-002 supersedes ADR-001\n',
    'src/existing.txt': 'User work at B\n',
    '.notth/local.md': 'Canonical docs already chosen; do not ask again.\n',
    'openspec/changes/in-progress/tasks.md': '# Tasks\n- [ ] Reconcile A against B\nHandoff: PASS at A, not current proof\n',
    'openspec/changes/in-progress/decisions.json': { schema_version: 1, reviewed: true, decisions: [] },
    '.notth/artifacts.json': { schema_version: 1, mode: 'document-driven', inputs: {}, outputs: {
      docs: { kind: 'docs', location: { path: 'docs' }, write_policy: 'propose' },
    } },
  };
  for (const [p, value] of Object.entries(owned)) write(p, value);
  write('AGENTS.md', 'User instructions\n' + read('AGENTS.md') + '\nUser footer\n');
  const before = Object.fromEntries(Object.keys(owned).map(p => [p, read(p)]));
  const oldLock = read('.notth/lock.json');
  install(root, SOURCE, { command: 'update', dryRun: true });
  assert.equal(read('.notth/lock.json'), oldLock);
  for (const [p, bytes] of Object.entries(before)) assert.equal(read(p), bytes);
  install(root, SOURCE, { command: 'update' });
  for (const [p, bytes] of Object.entries(before)) assert.equal(read(p), bytes);
  assert.ok(read('AGENTS.md').startsWith('User instructions\n'));
  assert.ok(read('AGENTS.md').endsWith('\nUser footer\n'));
  assert.equal(read('.notth/templates/openspec/tasks.md'), read('templates/openspec/tasks.md', SOURCE));
  assert.equal(check(root).status, 'ok');
  write('.notth/core/workflows/continuous-development.md', read('.notth/core/workflows/continuous-development.md') + '\nLocal managed edit\n');
  const lockBeforeConflict = read('.notth/lock.json');
  assert.throws(() => install(root, SOURCE, { command: 'update' }));
  assert.equal(read('.notth/lock.json'), lockBeforeConflict);
  for (const [p, bytes] of Object.entries(before)) assert.equal(read(p), bytes);
});

test('read-only proposal handoff uses unchanged source plus existing evidence contract; required publication stays blocked', () => {
  install(root, SOURCE);
  write('.notth/artifacts.json', { schema_version: 1, mode: 'document-driven', inputs: {
    canonical: { kind: 'requirements', location: { url: 'https://example.com/requirements', connection: 'wiki' }, revision: '17', write_policy: 'read-only', canonical: true },
  }, outputs: { derived: { kind: 'docs', location: { path: 'docs/derived' }, sources: ['canonical'] } } });
  write('.notth/integrations.json', { schema_version: 1, connections: { wiki: { via: 'connector', binding: 'wiki', purpose: 'Read requirements', access: 'read-only' } } });
  const change = 'openspec/changes/source-proposal';
  const impact = { schema_version: 1, reviewed: true, items: [
    { artifact: 'input:canonical', action: 'unchanged', status: 'done', reason: 'Read-only; section proposal in design.md for owner review. No canonical publication performed.' },
    { artifact: 'output:derived', action: 'update', status: 'done', reason: 'Affected BR-007 section only', evidence: 'Reviewable derived doc patch: PR diff for docs/derived/rule.md' },
  ] };
  write(change + '/artifact-impact.json', impact);
  assert.deepEqual(artifactImpact(root, change, 'review'), []);
  const report = artifactReport(root);
  assert.equal(report.connections[0].availability, 'unverified');
  assert.equal(report.executed, false);
  impact.items[0].action = 'update'; write(change + '/artifact-impact.json', impact);
  assert.ok(artifactImpact(root, change, 'review').some(p => p.includes('Read-only')));
  impact.items[0].action = 'unchanged'; impact.items[0].status = 'blocked';
  impact.items[0].reason = 'Assignment requires canonical publication; owner/tool unavailable.';
  write(change + '/artifact-impact.json', impact);
  assert.ok(artifactImpact(root, change, 'review').some(p => p.includes('Blocked artifact')));
});

test('cross-role evaluation is selected only with all relevant capabilities, and remains unscored', () => {
  install(root, SOURCE, { capabilities: ['product', 'architecture', 'delivery'] });
  const result = evaluate(root, undefined, 'all');
  const id = 'composition/continuous-role-handoff';
  assert.ok(result.dataset.cases.some(c => c.id === id));
  assert.ok(result.report.results.find(c => c.id === id).scores.every(s => s === null));
  for (const name of ['harness-product-business-analysis', 'harness-product-traceability', 'harness-product-backlog-prioritization', 'harness-architecture-change-impact', 'harness-delivery-scope-change']) {
    assert.ok(read('.agents/skills/' + name + '/SKILL.md').includes('continuous-development.md'));
  }
  const config = JSON.parse(read('.notth/project.json')); config.capabilities = ['product'];
  write('.notth/project.json', config); install(root, SOURCE, { command: 'update' });
  assert.ok(!evaluate(root, undefined, 'all').dataset.cases.some(c => c.id === id));
});
