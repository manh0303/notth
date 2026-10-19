import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { SOURCE, install, check, newDoc, newChange, loadLock } from '../cli/harness.js';
import { emptyArtifacts, emptyIntegrations, loadArtifactContract, artifactReport, artifactImpact } from '../cli/artifacts.js';
import { setupPlan } from '../cli/environment.js';
import { ready } from '../cli/readiness.js';

let root;
beforeEach(() => { root = fs.mkdtempSync(path.join(os.tmpdir(), 'aih-artifacts-')); });
afterEach(() => fs.rmSync(root, { recursive: true, force: true }));
const write = (p, value) => {
  const target = path.join(root, p); fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, typeof value === 'string' ? value : JSON.stringify(value));
};
const contract = () => ({ schema_version: 1, mode: 'idea-driven', inputs: {
  idea: { kind: 'idea', location: { path: 'docs/discovery/idea.md' }, write_policy: 'propose' },
}, outputs: {
  product: { kind: 'docs', capability: 'product', location: { path: 'docs/requirements' },
    owner: 'project-owner', canonical: true, sources: ['idea'], write_policy: 'propose' },
  spec: { kind: 'spec', location: { path: 'openspec' }, depends_on: ['product'] },
} });
const configure = (a = contract(), i = emptyIntegrations()) => {
  write('.notth/artifacts.json', a); write('.notth/integrations.json', i);
};
const cli = args => spawnSync(process.execPath, [path.join(SOURCE, 'bin/aih.js'), ...args], { cwd: root, encoding: 'utf8' });

test('init/update seed unconfigured project contracts without locking or overwriting custom bytes; legacy check remains valid', () => {
  install(root, SOURCE, { dryRun: true }); assert.deepEqual(fs.readdirSync(root), []);
  install(root, SOURCE);
  assert.deepEqual(loadArtifactContract(root).artifacts, emptyArtifacts());
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(SOURCE, 'templates/artifacts.json'))), emptyArtifacts());
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(SOURCE, 'templates/integrations.json'))), emptyIntegrations());
  assert.ok(!Object.hasOwn(loadLock(root).files, '.notth/artifacts.json'));
  configure(); const before = fs.readFileSync(path.join(root, '.notth/artifacts.json'));
  install(root, SOURCE, { command: 'update' });
  assert.ok(fs.readFileSync(path.join(root, '.notth/artifacts.json')).equals(before));
  assert.equal(check(root).status, 'ok');
  fs.unlinkSync(path.join(root, '.notth/artifacts.json'));
  fs.unlinkSync(path.join(root, '.notth/integrations.json'));
  assert.equal(check(root).status, 'ok');
  install(root, SOURCE, { command: 'update' });
  assert.deepEqual(loadArtifactContract(root).artifacts, emptyArtifacts());
});

test('invalid project contracts fail before install writes and never echo unknown credential fields or malformed JSON', () => {
  write('.notth/integrations.json', { schema_version: 1, connections: { db: { via: 'mcp', binding: 'db', purpose: 'test', token: 'PRIVATE_VALUE' } } });
  const before = fs.readdirSync(root);
  assert.throws(() => install(root, SOURCE), e => !e.message.includes('PRIVATE_VALUE') && /Invalid fields/.test(e.message));
  assert.deepEqual(fs.readdirSync(root), before);
  assert.ok(!fs.existsSync(path.join(root, '.notth/lock.json')));
  write('.notth/integrations.json', 'null');
  assert.throws(() => loadArtifactContract(root), /Invalid integrations schema/);
  write('.notth/integrations.json', emptyIntegrations());
  write('.notth/artifacts.json', 'null');
  assert.throws(() => loadArtifactContract(root), /Invalid artifacts schema/);
  fs.unlinkSync(path.join(root, '.notth/artifacts.json'));
  write('.notth/integrations.json', '{"PRIVATE_VALUE":');
  assert.throws(() => loadArtifactContract(root), e => /Invalid JSON/.test(e.message) && !e.message.includes('PRIVATE_VALUE'));
});

test('arbitrary host aliases are declared only; defaults keep external inputs read-only and Git changes proposed', () => {
  configure({ schema_version: 1, mode: 'document-driven', inputs: {
    source: { kind: 'docs', location: { url: 'https://example.com/wiki/123', connection: 'future-tool' }, revision: '17', canonical: true },
  }, outputs: { docs: { kind: 'docs', location: { path: 'docs/derived' }, sources: ['source'] } } },
  { schema_version: 1, connections: { 'future-tool': { via: 'mcp', binding: 'my_server', purpose: 'Read project requirements' } } });
  const r = artifactReport(root);
  assert.equal(r.connections[0].availability, 'unverified');
  assert.equal(r.entries[0].write_policy, 'read-only');
  assert.equal(r.entries[0].revision, '17');
  assert.equal(r.entries[0].canonical, true);
  assert.equal(r.entries[1].write_policy, 'propose');
  assert.equal(r.executed, false);
});

test('unknown refs, cycles, duplicate canonical owners and ambiguous doc routes are rejected', () => {
  for (const mutate of [
    c => c.outputs.product.sources.push('missing'),
    c => delete c.inputs.idea.kind,
    c => c.inputs.idea.kind = null,
    c => c.outputs.product.capability = null,
    c => c.outputs.spec.depends_on.push('missing'),
    c => c.outputs.product.depends_on = ['spec'],
    c => c.inputs.other = { kind: 'docs', location: { path: 'docs/source.md' }, canonical: true },
    c => c.outputs.other = { ...c.outputs.product, canonical: false },
    c => c.inputs.idea.location = { url: 'https://example.com/a', connection: 'unknown' },
    c => c.outputs.spec.location.path = 'remote-specs',
  ]) {
    const c = contract(); mutate(c); configure(c);
    assert.throws(() => loadArtifactContract(root));
  }
});

test('traversal, managed destinations, credential URLs, unsafe values and symlinked directories fail closed', () => {
  for (const loc of [
    { path: '../outside' }, { path: '.notth/templates' }, { path: '.git' }, { path: 'node_modules/foo' },
    { path: 'AGENTS.md' }, { path: 'nested/.GIT/docs' }, { path: '.Harness/docs' }, { path: 7 }, { path: 'docs/out', url: 'https://example.com' },
    { url: 'https://user:password@example.com/a' }, { url: 'https://example.com/a?access_token=PRIVATE_VALUE' },
  ]) {
    const c = contract(); c.outputs.product.location = loc; configure(c);
    assert.throws(() => loadArtifactContract(root));
  }
  const outside = fs.mkdtempSync(path.join(os.tmpdir(), 'aih-outside-'));
  try {
    fs.symlinkSync(outside, path.join(root, 'linked'), process.platform === 'win32' ? 'junction' : 'dir');
    const c = contract(); c.outputs.product.location.path = 'linked/docs'; configure(c);
    assert.throws(() => loadArtifactContract(root), /Symlink/);
    assert.deepEqual(fs.readdirSync(outside), []);
  } finally { fs.rmSync(outside, { recursive: true, force: true }); }
});

test('external write declarations require scoped connection and an observed revision', () => {
  const c = contract(); c.outputs.product.location = { url: 'https://example.com/wiki/123', connection: 'wiki' };
  c.outputs.product.write_policy = 'write';
  const i = { schema_version: 1, connections: { wiki: { via: 'connector', binding: 'atlassian', purpose: 'Maintain requirements', access: 'write', scope: ['space/APP'] } } };
  configure(c, i); assert.throws(() => loadArtifactContract(root), /revision/);
  c.outputs.product.revision = '17'; configure(c, i); assert.doesNotThrow(() => loadArtifactContract(root));
  i.connections.wiki.scope = []; configure(c, i); assert.throws(() => loadArtifactContract(root), /scope/);
  i.connections.wiki.scope = ['space/APP']; i.connections.wiki.access = 'read-only'; configure(c, i);
  assert.throws(() => loadArtifactContract(root), /write connection/);
});

test('setup asks storage independently of build tools, reuses declared routes, and artifacts command is read-only', () => {
  install(root, SOURCE); assert.ok(setupPlan(root, []).questions.some(q => q.id === 'artifact-storage'));
  configure(); assert.ok(!setupPlan(root, []).questions.some(q => q.id === 'artifact-storage'));
  const before = fs.readFileSync(path.join(root, '.notth/artifacts.json'));
  const r = cli(['artifacts']); assert.equal(r.status, 0, r.stderr);
  assert.equal(JSON.parse(r.stdout).executed, false);
  assert.ok(fs.readFileSync(path.join(root, '.notth/artifacts.json')).equals(before));
  assert.equal(cli(['artifacts', '--host', 'codex']).status, 2);
});

test('new-doc honors explicit local routes, refuses overwrite/read-only/missing route and preserves legacy defaults', () => {
  install(root, SOURCE, { capabilities: ['product'] });
  assert.equal(newDoc(root, 'idea').path, 'docs/discovery/idea.md');
  configure();
  assert.equal(newDoc(root, 'prd-lite').path, 'docs/requirements/prd-lite.md');
  assert.ok(!fs.existsSync(path.join(root, 'docs/product/prd-lite.md')));
  assert.throws(() => newDoc(root, 'prd-lite'), /already exists/);
  const c = contract(); c.outputs.product.write_policy = 'read-only'; configure(c);
  assert.throws(() => newDoc(root, 'brd'), /read-only/);
  delete c.outputs.product; c.outputs.spec.depends_on = []; configure(c);
  assert.throws(() => newDoc(root, 'brd'), /No document destination/);
});

test('external new-doc returns actual template and handoff without remote writes or silent local copies', () => {
  install(root, SOURCE, { capabilities: ['product'] });
  const c = contract(); c.outputs.product.location = { url: 'https://example.com/wiki/123', connection: 'wiki' };
  configure(c, { schema_version: 1, connections: { wiki: { via: 'connector', binding: 'atlassian', purpose: 'Requirements' } } });
  const r = newDoc(root, 'prd-lite');
  assert.equal(r.status, 'planned'); assert.equal(r.executed, false);
  assert.match(r.template, /draft|pending/); assert.equal(r.destination.connection, 'wiki');
  assert.ok(!fs.existsSync(path.join(root, 'docs/product/prd-lite.md')));
  assert.equal(cli(['new-doc', 'brd']).status, 0);
});

test('configured changes require impact coverage, source policy and completed maintenance evidence at review', () => {
  install(root, SOURCE); configure(); newChange(root, 'add-order');
  const base = 'openspec/changes/add-order';
  assert.deepEqual(artifactImpact(root, base, 'implement'), ['Missing/review-required artifact-impact.json']);
  const impact = { schema_version: 1, reviewed: true, items: [
    { artifact: 'output:product', action: 'update', status: 'pending', reason: 'Add order acceptance criteria' },
    { artifact: 'output:spec', action: 'create', status: 'pending', reason: 'Specify order behavior' },
  ] };
  write(base + '/artifact-impact.json', impact);
  assert.deepEqual(artifactImpact(root, base, 'implement'), []);
  assert.equal(artifactImpact(root, base, 'review').length, 2);
  for (const item of impact.items) { item.status = 'done'; item.evidence = 'Reviewed diff and test log in this change'; }
  write(base + '/artifact-impact.json', impact); assert.deepEqual(artifactImpact(root, base, 'review'), []);
  const c = contract(); c.inputs.idea.write_policy = 'read-only'; configure(c);
  impact.items.push({ artifact: 'input:idea', action: 'update', status: 'done', reason: 'Rewrite original idea', evidence: 'Diff' });
  write(base + '/artifact-impact.json', impact);
  assert.ok(artifactImpact(root, base, 'review').some(p => p.includes('Read-only')));
  assert.ok(ready(root, 'add-order').problems.some(p => p.includes('Read-only')));
  configure(emptyArtifacts()); assert.deepEqual(artifactImpact(root, base, 'review'), []);
});

test('artifact seeds participate in atomic rollback with the rest of installation', () => {
  assert.throws(() => install(root, SOURCE, { writer: (filename, data) => {
    if (filename.endsWith('integrations.json')) throw Error('Simulated write failure');
    fs.mkdirSync(path.dirname(filename), { recursive: true }); fs.writeFileSync(filename, data);
  } }), /Simulated/);
  assert.ok(!fs.existsSync(path.join(root, '.notth/artifacts.json')));
  assert.ok(!fs.existsSync(path.join(root, '.notth/lock.json')));
});
