import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import * as h from '../cli/harness.js';
import { loadCapability, readSkill } from '../cli/capabilities.js';
import { loadAdapter } from '../cli/adapter-schema.js';

const read = p => fs.readFileSync(path.join(h.SOURCE, p), 'utf8');
function root(t) {
  const p = fs.mkdtempSync(path.join(os.tmpdir(), 'notth-engineering-'));
  t.after(() => fs.rmSync(p, { recursive: true, force: true })); return p;
}

test('Core-only exposes deeper coding with no optional modules or generated documents', t => {
  const p = root(t); h.install(p, h.SOURCE, {}); const lock = h.loadLock(p);
  assert.ok(lock.files['.notth/core/workflows/engineering-quality.md']);
  assert.ok(lock.files['.notth/integrations/engineering-sources.md']);
  assert.match(readSkill(p, lock, 'harness-debugging').content, /falsifiable/);
  assert.match(readSkill(p, lock, 'harness-tdd').content, /characterize observable behavior/);
  assert.ok(!fs.existsSync(path.join(p, '.notth/capabilities/product')));
  assert.ok(!fs.existsSync(path.join(p, 'docs')));
  assert.ok(!Object.keys(lock.files).some(k => /[.](docx|pdf|pptx)$/.test(k)));
});

test('Selected stacks install registered engineering rules and contextual checks/evals', t => {
  const p = root(t);
  h.install(p, h.SOURCE, { adapters: ['java-spring', 'react-nextjs', 'react-native'], capabilities: ['product', 'architecture'] });
  const lock = h.loadLock(p);
  for (const id of ['java-spring', 'react-nextjs', 'react-native']) {
    const adapter = loadAdapter(h.SOURCE, id);
    assert.ok(adapter.rules.includes('rules/engineering.md'));
    assert.ok(lock.files[`.notth/adapters/${id}/rules/engineering.md`]);
    assert.ok(adapter.checks.some(c => c.id === 'engineering-depth'));
  }
  const cap = loadCapability(h.SOURCE, 'product');
  assert.ok(cap.workflows.includes('workflows/document-export.md'));
  assert.ok(lock.files['.notth/capabilities/product/workflows/document-export.md']);
  assert.ok(lock.files['.notth/capabilities/architecture/templates/overview.md']);
  assert.match(readSkill(p, lock, 'harness-product-techspec').content, /transaction\/concurrency/);
});

test('Updated snapshots preserve project documents/configuration and reject managed drift', t => {
  const p = root(t); h.install(p, h.SOURCE, { capabilities: ['product', 'architecture'] });
  fs.mkdirSync(path.join(p, 'docs/architecture'), { recursive: true });
  fs.writeFileSync(path.join(p, 'docs/architecture/overview.md'), 'User-approved custom architecture');
  fs.writeFileSync(path.join(p, '.notth/local.md'), 'Custom context');
  h.install(p, h.SOURCE, { command: 'update' });
  assert.equal(fs.readFileSync(path.join(p, 'docs/architecture/overview.md'), 'utf8'), 'User-approved custom architecture');
  assert.equal(fs.readFileSync(path.join(p, '.notth/local.md'), 'utf8'), 'Custom context');
  fs.appendFileSync(path.join(p, '.notth/core/workflows/engineering-quality.md'), '\nLocal edit');
  assert.throws(() => h.install(p, h.SOURCE, { command: 'update' }));
});

test('Six-group discovery chain and source/license boundaries are explicit', () => {
  assert.match(read('templates/AGENTS.md'), /engineering-quality/);
  assert.match(read('core/workflows/spec-to-code.md'), /engineering-quality/);
  assert.match(read('core/agents/documentation.md'), /document-export/);
  assert.match(read('capabilities/product/skills/harness-product-document-review/SKILL.md'), /document-export/);
  assert.match(read('capabilities/product/workflows/document-export.md'), /Render every page\/slide/);
  assert.match(read('capabilities/product/workflows/document-export.md'), /BLOCKED/);
  const sources = read('integrations/engineering-sources.md');
  for (const repo of ['obra/superpowers', 'vercel-labs/agent-skills', 'arc42/arc42-template', 'adr/madr', 'github/spec-kit', 'anthropics/skills']) assert.ok(sources.includes(repo));
  assert.match(sources, /source-available/);
  assert.match(read('docs/README.md'), /engineering-quality.md/);
  for (const p of ['core/skills/harness-debugging/SKILL.md', 'core/skills/harness-tdd/SKILL.md', 'core/skills/harness-review/SKILL.md', 'core/skills/harness-verification/SKILL.md']) {
    assert.equal((read(p).match(/^## Output$/gm) ?? []).length, 1);
  }
});

test('A synthetic prior module snapshot updates additively without replacing user settings', t => {
  const p = root(t), source = root(t);
  for (const name of ['core', 'adapters', 'capabilities', 'integrations', 'templates', 'harness.yaml']) {
    fs.cpSync(path.join(h.SOURCE, name), path.join(source, name), { recursive: true });
  }
  const capPath = path.join(source, 'capabilities/product/capability.json');
  const cap = JSON.parse(fs.readFileSync(capPath, 'utf8'));
  cap.workflows = cap.workflows.filter(p => p !== 'workflows/document-export.md');
  cap.module_version = '1.8.0'; fs.writeFileSync(capPath, JSON.stringify(cap));
  fs.unlinkSync(path.join(source, 'capabilities/product/workflows/document-export.md'));
  const adapterPath = path.join(source, 'adapters/java-spring/adapter.yaml');
  const adapter = JSON.parse(fs.readFileSync(adapterPath, 'utf8'));
  adapter.rules = adapter.rules.filter(p => p !== 'rules/engineering.md');
  adapter.module_version = '1.2.0'; fs.writeFileSync(adapterPath, JSON.stringify(adapter));
  fs.unlinkSync(path.join(source, 'adapters/java-spring/rules/engineering.md'));
  h.install(p, source, { adapters: ['java-spring'], capabilities: ['product'] });
  const config = fs.readFileSync(path.join(p, '.notth/agents.json'), 'utf8');
  assert.ok(!fs.existsSync(path.join(p, '.notth/capabilities/product/workflows/document-export.md')));
  const preview = h.install(p, h.SOURCE, { command: 'update', dryRun: true });
  assert.ok(preview.changes.length > 0);
  assert.ok(!fs.existsSync(path.join(p, '.notth/capabilities/product/workflows/document-export.md')));
  h.install(p, h.SOURCE, { command: 'update' });
  assert.ok(fs.existsSync(path.join(p, '.notth/capabilities/product/workflows/document-export.md')));
  assert.ok(fs.existsSync(path.join(p, '.notth/adapters/java-spring/rules/engineering.md')));
  assert.equal(fs.readFileSync(path.join(p, '.notth/agents.json'), 'utf8'), config);
});
