import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import * as h from '../cli/harness.js';
import { listCapabilities, loadCapability } from '../cli/capabilities.js';

let base, project, source;
beforeEach(() => {
  base = fs.mkdtempSync(path.join(os.tmpdir(), 'aih-product-'));
  project = path.join(base, 'consumer');
  source = path.join(base, 'source');
  fs.mkdirSync(project); fs.mkdirSync(source);
  for (const p of ['core', 'adapters', 'capabilities', 'integrations', 'templates', 'harness.yaml']) {
    fs.cpSync(path.join(h.SOURCE, p), path.join(source, p), { recursive: true });
  }
});
afterEach(() => fs.rmSync(base, { recursive: true, force: true }));
function write(name, body, dest = project) {
  const file = path.join(dest, name); fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, typeof body === 'string' ? body : JSON.stringify(body));
}
function cli(args, code = 0) {
  const r = spawnSync(process.execPath, [path.join(h.SOURCE, 'bin/aih.js'), ...args], { cwd: project, encoding: 'utf8' });
  assert.equal(r.status, code, r.stdout + r.stderr);
  return JSON.parse(r.stdout || r.stderr);
}
function snapshot() {
  const files = {};
  function walk(dir) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) walk(full);
      else files[path.relative(project, full)] = fs.readFileSync(full).toString('base64');
    }
  }
  walk(project);
  return files;
}

test('Product is independently registered with role/template contracts; UI/UX schema 1 stays valid', () => {
  const list = listCapabilities(source);
  const product = list.find(c => c.id === 'product'), uiux = list.find(c => c.id === 'uiux');
  assert.equal(list.length, 8);
  assert.equal(product.skills.length, 16);
  assert.equal(product.agents.length, 5);
  assert.equal(product.templates.length, 19);
  assert.equal(product.workflows.length, 8);
  assert.deepEqual(uiux.agents, []);
  assert.deepEqual(uiux.templates, []);
  assert.equal(loadCapability(source, 'product').id, 'product');
  assert.deepEqual(snapshot(), {});
});

test('Product-only installs roles, templates and 16 skills but not UI/UX or adapters', () => {
  cli(['init', '--source', source, '--capabilities', 'product']);
  const lock = h.loadLock(project);
  assert.deepEqual(lock.capabilities, ['product']);
  assert.deepEqual(lock.adapters, []);
  assert.ok(fs.existsSync(path.join(project, '.notth/capabilities/product/agents/business-analyst.md')));
  assert.ok(fs.existsSync(path.join(project, '.notth/capabilities/product/templates/brd.md')));
  assert.ok(fs.existsSync(path.join(project, '.agents/skills/harness-product-prd-generation/SKILL.md')));
  assert.ok(!fs.existsSync(path.join(project, '.notth/capabilities/uiux')));
  assert.ok(!fs.existsSync(path.join(project, '.notth/adapters')));
  assert.equal(cli(['check']).status, 'ok');
  const catalog = cli(['skills']);
  assert.equal(catalog.skills.length, fs.readdirSync(path.join(source, 'core/skills'), { withFileTypes: true }).filter(entry => entry.isDirectory()).length + loadCapability(source, 'product').skills.length);
  assert.ok(!JSON.stringify(catalog).includes('## Procedure'));
  assert.match(cli(['skill', 'harness-product-business-analysis']).content, /AS-IS and TO-BE/);
  assert.equal(cli(['list', '--source', source]).capabilities.length, 8);
});

test('Product and UI/UX install together without collisions, adapters remain optional', () => {
  cli(['init', '--source', source, '--capabilities', 'uiux,product']);
  assert.deepEqual(h.loadLock(project).capabilities, ['product', 'uiux']);
  assert.ok(fs.existsSync(path.join(project, '.agents/skills/harness-product-traceability/SKILL.md')));
  assert.ok(fs.existsSync(path.join(project, '.agents/skills/harness-uiux-user-flow/SKILL.md')));
  assert.equal(cli(['check']).status, 'ok');
  assert.deepEqual(cli(['init', '--source', source, '--capabilities', 'product,uiux']).changes, []);
});

test('new-doc scaffolds only declared Product templates without overwrites or modifying managed files', () => {
  cli(['init', '--source', source, '--capabilities', 'product']);
  const original = fs.readFileSync(path.join(source, 'capabilities/product/templates/brd.md'));
  const res = cli(['new-doc', 'brd']);
  assert.equal(res.status, 'ok');
  assert.equal(res.path, 'docs/product/brd.md');
  assert.ok(fs.readFileSync(path.join(project, res.path)).equals(original));
  assert.equal(cli(['check']).status, 'ok');
  write('docs/product/brd.md', 'Reviewed company-owned BRD');
  const before = snapshot();
  cli(['new-doc', 'brd'], 1);
  cli(['new-doc', '../outside'], 1);
  cli(['new-doc', 'not-a-template'], 1);
  cli(['new-doc', 'readme.md'], 1);
  assert.deepEqual(snapshot(), before);
  cli(['update', '--source', source]);
  assert.equal(fs.readFileSync(path.join(project, 'docs/product/brd.md'), 'utf8'), 'Reviewed company-owned BRD');
  assert.equal(cli(['check']).status, 'ok');
});

test('new-doc needs installed Product; rejects symlink target without writing outside repository', () => {
  cli(['init', '--source', source]);
  const before = snapshot(); cli(['new-doc', 'prd'], 1); assert.deepEqual(snapshot(), before);
  const p = path.join(project, '.notth/project.json');
  const cfg = h.readJson(p); cfg.capabilities = ['product']; write('.notth/project.json', cfg);
  cli(['update', '--source', source]);
  const outside = path.join(base, 'outside'); fs.mkdirSync(outside);
  fs.symlinkSync(outside, path.join(project, 'docs'), process.platform === 'win32' ? 'junction' : 'dir');
  cli(['new-doc', 'prd'], 1);
  assert.deepEqual(fs.readdirSync(outside), []);
  assert.equal(cli(['check']).status, 'ok');
});

test('capability selection change preserves user docs and removes deselected files safely', () => {
  cli(['init', '--source', source, '--capabilities', 'product']);
  cli(['new-doc', 'prd']); write('docs/product/prd.md', 'Approved release plan');
  write('.notth/project.json', {schema_version:1,adapters:[],capabilities:[]});
  assert.equal(cli(['check'], 1).status, 'error');
  cli(['update', '--source', source]);
  assert.equal(cli(['check']).status, 'ok');
  assert.ok(!fs.existsSync(path.join(project, '.agents/skills/harness-product-prd-generation/SKILL.md')));
  assert.ok(!fs.existsSync(path.join(project, '.notth/capabilities/product/templates/brd.md')));
  assert.equal(fs.readFileSync(path.join(project,'docs/product/prd.md'),'utf8'), 'Approved release plan');
});

test('invalid Product role/template manifests are refused before any writes', () => {
  const name = 'capabilities/product/capability.json', original = h.readJson(path.join(source, name));
  const corruptions = [
    m => { m.agents.push(m.agents[0]); },
    m => { m.agents = ['agents/../escape.md']; },
    m => { m.templates = ['templates/../../escape.md']; },
    m => { m.templates = ['templates/no-file.md']; },
    m => { m.skills.push('harness-tdd'); },
    m => { m.schema_version = 2; },
    m => { m.extra = 'unexpected'; }
  ];
  for (const mutate of corruptions) {
    const doc = structuredClone(original); mutate(doc);
    write(name, doc, source);
    cli(['init', '--source', source, '--capabilities', 'product'], 1);
    assert.deepEqual(snapshot(), {});
  }
  write(name, original, source);
  const rolePath = 'capabilities/product/agents/business-analyst.md';
  write(rolePath, 'no role contract', source);
  cli(['init', '--source', source, '--capabilities', 'product'], 1);
  assert.deepEqual(snapshot(), {});
});

test('tampered installed Product skills and templates block reads and update', () => {
  cli(['init', '--source', source, '--capabilities', 'product']);
  write('.notth/capabilities/product/templates/prd.md', 'compromised');
  const before = snapshot();
  cli(['check'], 1);
  cli(['skills'], 1);
  cli(['skill', 'harness-product-prd-generation'], 1);
  cli(['new-doc', 'prd'], 1);
  cli(['update', '--source', source], 1);
  assert.deepEqual(snapshot(), before);
});

test('new-doc still works from pinned installed template even if future source changes', () => {
  cli(['init', '--source', source, '--capabilities', 'product']);
  write('capabilities/product/templates/brd.md', 'later source mutation', source);
  const result = cli(['new-doc', 'brd']);
  assert.equal(result.status, 'ok');
  assert.notEqual(fs.readFileSync(path.join(project,result.path),'utf8'), 'later source mutation');
});

test('Idea and research use discovery folder; detailed Product specs remain product-owned', () => {
  cli(['init', '--source', source, '--capabilities', 'product']);
  for (const type of ['idea', 'research', 'prd-lite', 'srs', 'use-cases']) {
    const res = cli(['new-doc', type]);
    const folder = ['idea', 'research'].includes(type) ? 'discovery' : 'product';
    assert.equal(res.path, `docs/${folder}/${type}.md`);
    assert.ok(fs.existsSync(path.join(project, res.path)));
    assert.equal(
      fs.readFileSync(path.join(project, res.path), 'utf8'),
      fs.readFileSync(path.join(source, `capabilities/product/templates/${type}.md`), 'utf8')
    );
  }
  assert.equal(cli(['check']).status, 'ok');
  const before = snapshot();
  for (const type of ['idea', 'research', 'prd-lite', 'srs', 'use-cases']) cli(['new-doc', type], 1);
  assert.deepEqual(snapshot(), before);
  cli(['update', '--source', source]);
  assert.deepEqual(snapshot(), before);
});

test('Document discovery skill metadata can be read without activating other capabilities', () => {
  cli(['init', '--source', source, '--capabilities', 'product']);
  for (const name of ['harness-product-idea-discovery','harness-product-product-research',
    'harness-product-srs-generation','harness-product-use-case-generation']) {
    const loaded = cli(['skill', name]);
    assert.equal(loaded.name, name);
    assert.match(loaded.content, /## Constraints/);
  }
});
