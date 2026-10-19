import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import * as h from '../cli/harness.js';
import { readSkill, loadCapability } from '../cli/capabilities.js';

const read = p => fs.readFileSync(path.join(h.SOURCE, p), 'utf8');
function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'notth-ui-design-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  return root;
}

test('UI design selection exposes canonical skills, pins and template without owning project design', t => {
  const root = fixture(t);
  fs.writeFileSync(path.join(root, 'DESIGN.md'), 'Approved brand — preserve bytes');
  h.install(root, h.SOURCE, { capabilities: ['uiux'], host: 'codex' });
  const lock = h.loadLock(root);
  for (const id of ['harness-uiux-design-direction', 'harness-uiux-external-design']) {
    assert.match(readSkill(root, lock, id).content, /## Procedure/);
    assert.ok(lock.files[`.agents/skills/${id}/SKILL.md`]);
  }
  for (const p of ['integrations/design-skills.md', 'templates/design-system.md', 'evals/visual-comparison.md']) {
    assert.ok(lock.files[`.notth/capabilities/uiux/${p}`]);
  }
  assert.ok(!lock.files['DESIGN.md']);
  h.install(root, h.SOURCE, { command: 'update' });
  assert.equal(fs.readFileSync(path.join(root, 'DESIGN.md'), 'utf8'), 'Approved brand — preserve bytes');
  assert.match(fs.readFileSync(path.join(root, 'AGENTS.md'), 'utf8'), /design-delivery/);
  assert.ok(!Object.keys(lock.files).some(p => p.endsWith('.py')));
});

test('core-only stays selective and does not create a design master', t => {
  const root = fixture(t);
  h.install(root, h.SOURCE, {});
  assert.ok(!fs.existsSync(path.join(root, 'DESIGN.md')));
  assert.ok(!fs.existsSync(path.join(root, '.notth/capabilities/uiux')));
  assert.throws(() => readSkill(root, h.loadLock(root), 'harness-uiux-design-direction'));
});

test('legacy uiux snapshot upgrades additively and refuses edited integration guidance', t => {
  const root = fixture(t), old = fixture(t);
  for (const name of ['core', 'adapters', 'capabilities', 'integrations', 'templates', 'harness.yaml']) {
    fs.cpSync(path.join(h.SOURCE, name), path.join(old, name), { recursive: true });
  }
  const capFile = path.join(old, 'capabilities/uiux/capability.json');
  const meta = JSON.parse(fs.readFileSync(capFile, 'utf8'));
  meta.skills = meta.skills.filter(s => !['harness-uiux-design-direction', 'harness-uiux-external-design'].includes(s));
  meta.module_version = '1.1.0';
  fs.writeFileSync(capFile, JSON.stringify(meta));
  for (const id of ['harness-uiux-design-direction', 'harness-uiux-external-design']) {
    fs.rmSync(path.join(old, 'capabilities/uiux/skills', id), { recursive: true });
  }
  h.install(root, old, { capabilities: ['uiux'], host: 'kiro' });
  fs.writeFileSync(path.join(root, '.notth/local.md'), 'Existing project context');
  h.install(root, h.SOURCE, { command: 'update' });
  assert.ok(fs.existsSync(path.join(root, '.kiro/skills/harness-uiux-design-direction/SKILL.md')));
  assert.ok(fs.existsSync(path.join(root, '.agents/skills/harness-uiux-figma-design/SKILL.md')));
  assert.equal(fs.readFileSync(path.join(root, '.notth/local.md'), 'utf8'), 'Existing project context');
  fs.appendFileSync(path.join(root, '.notth/capabilities/uiux/integrations/design-skills.md'), '\nUser edit');
  assert.throws(() => h.install(root, h.SOURCE, { command: 'update' }));
});

test('UI design guidance has an entry-to-use-to-review chain and external boundaries', () => {
  const cap = loadCapability(h.SOURCE, 'uiux');
  assert.equal(cap.module_version, '1.2.0');
  const flow = read('capabilities/uiux/workflows/design-delivery.md');
  for (const id of ['design-direction', 'external-design', 'design-system', 'design-review']) {
    assert.ok(flow.includes(`harness-uiux-${id}`));
  }
  assert.match(read('core/agents/implementer.md'), /canonical DESIGN.md/);
  assert.match(read('capabilities/uiux/skills/harness-uiux-design-review/SKILL.md'), /NOT_RUN\/BLOCKED/);
  const sources = read('capabilities/uiux/integrations/design-skills.md');
  for (const pin of ['56ea9cf174ed86786187daa9de0e6247cb0747e4', '0337446dadde6f8c94210444e2aa9d546126480f']) assert.ok(sources.includes(pin));
  assert.match(sources, /MIT/); assert.match(sources, /Apache-2.0/);
  assert.match(sources, /no upstream prose, scripts or datasets are copied/);
  for (const id of ['preserve-existing-design', 'offline-design-fallback', 'review-render-not-build', 'external-source-and-export']) {
    assert.ok(cap.cases.some(c => c.id === id));
  }
});
