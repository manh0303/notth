import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { SOURCE, manifest, bundle } from '../cli/harness.js';
import { loadAdapter } from '../cli/adapter-schema.js';

const read = name => fs.readFileSync(path.join(SOURCE, name), 'utf8');
const areas = text => [...text.matchAll(/^\| ([a-z][a-z-]*) \|/gm)].map(match => match[1]).sort();

test('maintainer entry points reach the canonical guide and its actual linked targets', () => {
  const guide = 'docs/harness-maintenance.md';
  for (const entry of ['AGENTS.md', 'README.md', 'CONTRIBUTING.md', '.github/pull_request_template.md']) {
    assert.ok(read(entry).includes(guide), `${entry} must direct maintainers to ${guide}`);
  }
  for (const target of ['../templates/AGENTS.md', '../cli/harness.js', '../cli/adapters.js',
    '../harness.yaml', 'adapters.md', 'architecture.md', 'versioning.md', 'release-policy.md',
    'skill-matrix.md', 'agent-handoffs.md', '../evals/README.md',
    'templates/harness-change-impact.md', '../.github/pull_request_template.md',
    '../tests/maintenance.test.js', '../scripts/smoke-package.js']) {
    assert.ok(read(guide).includes(`](${target})`), `Guide is missing canonical target ${target}`);
    assert.ok(fs.existsSync(path.resolve(SOURCE, 'docs', target)), `Missing target ${target}`);
  }
});

test('impact matrix, copyable template and PR checklist cover the same areas without duplicates', () => {
  const expected = ['core', 'adapter', 'capability-skill', 'cli-config', 'workflow',
    'documentation', 'verification', 'release-migration'].sort();
  for (const name of ['docs/harness-maintenance.md', 'docs/templates/harness-change-impact.md',
    '.github/pull_request_template.md']) {
    assert.deepEqual(areas(read(name)), expected, `${name}: missing, duplicate or divergent impact area`);
    for (const state of ['done', 'pending', 'not-applicable']) assert.ok(read(name).includes(state));
  }
});

test('every Core rule is installed and directly discoverable from generated consumer AGENTS', () => {
  const { files } = bundle(SOURCE, { schema_version: 1, adapters: [], capabilities: [] });
  const entry = files['AGENTS.md'].toString();
  for (const name of fs.readdirSync(path.join(SOURCE, 'core/rules')).filter(name => name.endsWith('.md'))) {
    const installed = `.notth/core/rules/${name}`;
    assert.ok(files[installed], `Core rule is not distributed: ${name}`);
    assert.ok(entry.includes(installed), `Generated AGENTS cannot discover Core rule: ${name}`);
  }
  assert.ok(!entry.includes('harness-maintenance.md'), 'Maintainer instructions must not become consumer instructions');
  assert.ok(!Object.keys(files).some(name => name.includes('harness-change-impact')));
});

test('registered adapter rules remain discoverable through their installed indexes', () => {
  for (const id of manifest(SOURCE).adapters) {
    const adapter = loadAdapter(SOURCE, id);
    const { files } = bundle(SOURCE, { schema_version: 1, adapters: [id], capabilities: [] });
    const prefix = `.notth/adapters/${id}/`;
    assert.ok(files['AGENTS.md'].toString().includes(prefix + 'rules.md'));
    const index = files[prefix + 'rules.md'].toString();
    for (const rule of adapter.rules) {
      assert.ok(files[prefix + rule], `Undistributed rule: ${id}/${rule}`);
      assert.ok(index.includes(rule), `Adapter index does not direct the host to ${id}/${rule}`);
      assert.equal(files[prefix + rule].toString(), read(`adapters/${id}/${rule}`));
    }
  }
});
