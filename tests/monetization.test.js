import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import * as h from '../cli/harness.js';
import { loadCapability, listCapabilities } from '../cli/capabilities.js';

let base, root, source;
beforeEach(() => {
  base = fs.mkdtempSync(path.join(os.tmpdir(), 'aih-monetization-'));
  root = path.join(base, 'consumer'); source = path.join(base, 'source');
  fs.mkdirSync(root); fs.mkdirSync(source);
  for (const name of ['core','adapters','capabilities','integrations','templates','harness.yaml']) {
    fs.cpSync(path.join(h.SOURCE, name), path.join(source, name), { recursive: true });
  }
});
afterEach(() => fs.rmSync(base, { recursive: true, force: true }));
function cli(args, expected = 0) {
  const r = spawnSync(process.execPath, [path.join(h.SOURCE, 'bin/aih.js'), ...args], { cwd: root, encoding: 'utf8' });
  assert.equal(r.status, expected, r.stdout + r.stderr);
  return JSON.parse(r.stdout || r.stderr);
}
function write(p, content) {
  const dest = path.join(root, p);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, content);
}
function snapshot() {
  const result = {};
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, {withFileTypes:true})) {
      const filename = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(filename);
      else result[path.relative(root, filename)] = fs.readFileSync(filename).toString('base64');
    }
  }
  walk(root); return result;
}

test('Monetization is independently registered with full source-validated skill, workflow and template contracts', () => {
  const names = listCapabilities(source).map(c => c.id);
  assert.deepEqual(names, ['uiux','product','devops','monetization','architecture','delivery','analysis','discovery']);
  const m = loadCapability(source, 'monetization');
  assert.equal(m.module_version, '1.0.0');
  assert.equal(m.skills.length, 5);
  assert.equal(m.workflows.length, 2);
  assert.equal(m.templates.length, 4);
  assert.equal(m.checks.length, 4);
  assert.equal(m.cases.length, 4);
  assert.deepEqual(m.agents, []);
  assert.deepEqual(snapshot(), {});
});

test('Minimal monetization-only install exposes five skills without Astro, Product, UIUX, or DevOps', () => {
  assert.deepEqual(cli(['resolve','--source',source,'--capabilities','monetization']).adapters, []);
  cli(['init','--source',source,'--capabilities','monetization']);
  const lock = h.loadLock(root);
  assert.deepEqual(lock.adapters, []);
  assert.deepEqual(lock.capabilities, ['monetization']);
  assert.ok(!fs.existsSync(path.join(root,'.notth/capabilities/product')));
  assert.ok(!fs.existsSync(path.join(root,'.notth/adapters/astro')));
  assert.equal(cli(['check']).status,'ok');
  const catalog = cli(['skills']);
  assert.equal(catalog.skills.length, fs.readdirSync(path.join(source, 'core/skills'), { withFileTypes: true }).filter(entry => entry.isDirectory()).length + loadCapability(source, 'monetization').skills.length);
  for(const id of ['adsense-integration','ad-placement-ux','seo-growth','analytics-revenue','publisher-compliance']) {
    const name = 'harness-monetization-'+id;
    assert.equal(cli(['skill',name]).name,name);
    assert.ok(fs.existsSync(path.join(root,'.agents/skills',name,'SKILL.md')));
  }
  const before = snapshot();
  const plan = cli(['verify','--scope','capabilities']);
  assert.equal(plan.executed,false);
  assert.equal(plan.checks.length,4);
  assert.ok(plan.checks.every(c=>c.capability==='monetization'&&c.applicability==='review-required'));
  const evalResult = cli(['eval','--scope','capabilities']);
  assert.equal(evalResult.dataset.cases.length,4);
  assert.ok(evalResult.report.results.every(r=>r.scores.every(s=>s===null)));
  assert.deepEqual(snapshot(),before);
});

test('Monetization composes optionally with Astro, Product and UIUX without collision', () => {
  const selection = cli(['resolve','--source',source,'--adapters','astro','--capabilities','monetization,product,uiux']);
  assert.deepEqual(selection.adapters,['astro']);
  assert.deepEqual(selection.capabilities,['monetization','product','uiux']);
  cli(['init','--source',source,'--adapters','astro','--capabilities','product,uiux,monetization']);
  const lock = h.loadLock(root);
  assert.deepEqual(lock.capabilities,['monetization','product','uiux']);
  assert.ok(fs.existsSync(path.join(root,'.agents/skills/harness-astro-seo/SKILL.md')));
  assert.ok(fs.existsSync(path.join(root,'.agents/skills/harness-monetization-seo-growth/SKILL.md')));
  assert.ok(fs.existsSync(path.join(root,'.agents/skills/harness-product-prd-generation/SKILL.md')));
  assert.equal(cli(['check']).status,'ok');
  assert.equal(cli(['verify','--scope','all']).executed,false);
});

test('Monetization templates require explicit owner selection rather than changing the Product default', () => {
  cli(['init','--source',source,'--capabilities','monetization']);
  assert.ok(fs.existsSync(path.join(root,'.notth/capabilities/monetization/templates/site-monetization-plan.md')));
  assert.equal(cli(['new-doc','site-monetization-plan'],1).status,'error');
  assert.ok(!fs.existsSync(path.join(root,'docs/monetization')));
  const explicit = cli(['new-doc','site-monetization-plan','--capability','monetization']);
  assert.equal(explicit.path, 'docs/monetization/site-monetization-plan.md');
  assert.equal(cli(['check']).status,'ok');
});

test('Monetization update removes managed skills but preserves project-owned documents', () => {
  cli(['init','--source',source,'--capabilities','monetization']);
  write('docs/monetization/site-monetization-plan.md','Human-reviewed site plan');
  write('.notth/project.json',JSON.stringify({schema_version:1,adapters:[],capabilities:[]}));
  assert.equal(cli(['check'],1).status,'error');
  cli(['update','--source',source]);
  assert.equal(cli(['check']).status,'ok');
  assert.ok(!fs.existsSync(path.join(root,'.agents/skills/harness-monetization-adsense-integration/SKILL.md')));
  assert.equal(fs.readFileSync(path.join(root,'docs/monetization/site-monetization-plan.md'),'utf8'),'Human-reviewed site plan');
});

test('Monetization malformed or tampered manifests fail closed without project modifications', () => {
  const target=path.join(source,'capabilities/monetization/capability.json');
  const pristine=fs.readFileSync(target,'utf8');
  const x=JSON.parse(pristine);x.templates.push('templates/missing.md');
  fs.writeFileSync(target,JSON.stringify(x));
  const before=snapshot();
  assert.equal(cli(['init','--source',source,'--capabilities','monetization'],1).status,'error');
  assert.deepEqual(snapshot(),before);
  fs.writeFileSync(target,pristine);
  cli(['init','--source',source,'--capabilities','monetization']);
  write('.notth/capabilities/monetization/workflows/site-to-adsense.md','tampered');
  assert.equal(cli(['check'],1).status,'error');
  assert.equal(cli(['verify','--scope','capabilities'],1).status,'error');
});
