import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { install, newChange, SOURCE, digest } from '../cli/harness.js';
import { baselineRevision } from '../cli/adaptive.js';
import { experienceReport, saveExperience, experienceCatalog, experiencePath } from '../cli/experience.js';
import { importSource, sourceReport, checkSource } from '../cli/sources.js';
import { memoryReport } from '../cli/memory.js';
let root;
const timestamp = '2020-01-02T00:00:00Z';
function write(name, value) { fs.mkdirSync(path.dirname(path.join(root, name)), { recursive: true }); fs.writeFileSync(path.join(root, name), typeof value === 'string' ? value : JSON.stringify(value)); }
const ref = name => ({ path: name, sha256: digest(fs.readFileSync(path.join(root, name))) });
beforeEach(() => { root = fs.mkdtempSync(path.join(os.tmpdir(), 'notth-experience-')); install(root, SOURCE); newChange(root, 'alpha'); write('code.js', 'Correct atomic update'); write('requirements.md', 'Atomic update prevents lost writes'); write('architecture.md', 'Single transactional store'); });
afterEach(() => fs.rmSync(root, { recursive: true, force: true }));
function record(id = 'alpha') {
  const baseline = [ref('code.js'), ref('requirements.md'), ref('architecture.md')]; write('observed.json', { lost_writes: 0 });
  write('verification.json', { schema_version: 1, metadata: { run_id: 'fixture', feature: 'Atomic update', source_revision: baselineRevision(baseline), environment: 'isolated fixture', producer: 'node:test', timestamp },
    requirements: [{ id: 'AC-1', description: 'No lost writes', source: 'requirements.md' }],
    scenarios: [{ id: 'race', status: 'PASSED', executed: true, references: ['AC-1'], method: 'unit', preconditions: ['isolated transaction fixture'], fixture: 'synthetic report fixture', steps: ['Observe updates'], expected: '0 lost writes', observed: '0 lost writes', timestamp,
      mutates: false, cleanup: { strategy: 'No mutation', status: 'PASSED' }, execution: { tool: 'node:test', command: ['node','--test'], exit_code: 0, timeout_ms: 5000, attempts: 1, max_attempts: 1 },
      evidence: [ref('observed.json')], assertions: [{ id: 'lost', basis: 'AC-1', layer: 'state', operator: 'equal', expected: 0, actual: { evidence: 'observed.json', pointer: '/lost_writes' } }] }] });
  return { schema_version: 1, change_id: id, revision: 0, status: 'verified', category: 'lost-update',
    problem: 'Concurrent updates lost writes', context: 'Transactional local store', hypothesis: 'Read-modify-write races', approach: 'Inspect regression then use atomic update',
    failures: ['Read then write overwrote a newer value'], solution: 'Apply verified atomic update under the accepted transaction boundary',
    conditions: [ref('architecture.md')], required_tags: ['transactional-store'], applies_when: 'Same transactional boundary and update semantics', limitations: ['Recheck distributed consistency separately'],
    baseline, source_revision: baselineRevision(baseline), verification: ref('verification.json'), created_at: timestamp, updated_at: timestamp };
}
function save(row, expected) { write('experience-input.json', row); return saveExperience(root, row.change_id, 'experience-input.json', expected); }
test('verified experience retrieval checks category, conditions and current evidence without global promotion', () => {
  save(record());
  assert.equal(experienceCatalog(root).records[0].applicability, 'needs-category');
  assert.equal(experienceCatalog(root, { category: 'ui-layout', tags: ['transactional-store'] }).records[0].applicability, 'category-mismatch');
  assert.equal(experienceCatalog(root, { category: 'lost-update' }).records[0].applicability, 'condition-mismatch');
  assert.equal(experienceCatalog(root, { category: 'lost-update', tags: ['transactional-store'] }).records[0].applicability, 'eligible-for-review');
  assert.ok(memoryReport(root, { query: 'lost-update' }).records.some(r => r.type === 'procedural'));
  const result = spawnSync(process.execPath, [path.join(SOURCE,'bin/aih.js'),'experiences','--category','lost-update','--tags','transactional-store'], { cwd: root, encoding: 'utf8' });
  assert.equal(result.status, 0); assert.equal(JSON.parse(result.stdout).records[0].applicability, 'eligible-for-review');
  write('architecture.md', 'Different distributed transaction boundary');
  assert.equal(experienceCatalog(root, { category: 'lost-update', tags: ['transactional-store'] }).records[0].applicability, 'stale');
  assert.equal(experienceReport(root, 'alpha').status, 'blocked');
});
test('lost raw evidence invalidates reuse and unsafe or unverified promotion never writes a record', () => {
  const good = record();
  for (const mutate of [r => r.solution = 'Use api_key=unredactedsecret123', r => r.conditions[0].path = '.env', r => r.source_revision = 'fake-revision', r => r.baseline[0].sha256 = '0'.repeat(64)]) {
    const row = structuredClone(good); mutate(row); assert.throws(() => save(row)); assert.equal(fs.existsSync(path.join(root, experiencePath('alpha'))), false);
  }
  const invalid = JSON.parse(fs.readFileSync(path.join(root,'verification.json'))); invalid.scenarios[0].status = 'NOT_RUN'; invalid.scenarios[0].executed = false; invalid.scenarios[0].assertions = []; invalid.scenarios[0].reason = 'No host'; delete invalid.scenarios[0].execution;
  write('verification.json', invalid); good.verification = ref('verification.json'); assert.throws(() => save(good), /passing evidence/);
  save(record()); write('observed.json', { lost_writes: 2 });
  assert.equal(experienceCatalog(root).records[0].applicability, 'stale');
});
test('CAS/history, rejection, supersession and archived discovery preserve project records', () => {
  const first = save(record()); let current = experienceReport(root,'alpha');
  const row = current.record; row.status = 'rejected'; row.reason = 'Does not cover the new boundary';
  const rejected = save(row, first.experience_sha256); assert.equal(rejected.revision, 2);
  assert.throws(() => save(row, first.experience_sha256), /changed/);
  assert.equal(experienceCatalog(root).records[0].applicability, 'rejected');
  newChange(root, 'beta'); save(record('beta'));
  current = experienceReport(root,'alpha'); current.record.status = 'superseded'; current.record.superseded_by = 'beta'; current.record.reason = 'Verified replacement'; save(current.record, current.experience_sha256);
  assert.equal(experienceCatalog(root).records.find(r => r.id === 'alpha').applicability, 'superseded');
  fs.mkdirSync(path.join(root,'openspec/changes/archive'), { recursive: true });
  fs.renameSync(path.join(root,'openspec/changes/beta'),path.join(root,'openspec/changes/archive/2026-10-20-beta'));
  assert.ok(experienceCatalog(root).records.some(r => r.id === 'beta' && r.path.includes('/archive/')));
  assert.ok(fs.readdirSync(path.join(root,'openspec/changes/alpha/experience-history')).length >= 2);
});
test('malformed experiences are quarantined and duplicate identities never become eligible', () => {
  save(record()); write('openspec/changes/beta/experience.json', '{invalid');
  assert.equal(experienceCatalog(root).errors.length, 1);
  write('openspec/changes/beta/experience.json', experienceReport(root,'alpha').record);
  assert.ok(experienceCatalog(root, { category: 'lost-update', tags: ['transactional-store'] }).records.every(r => r.applicability === 'ambiguous'));
});

test('identical external bytes with a newer capture invalidate experience through canonical manifest', () => {
  write('source.md','Accepted source');
  const metadata = {schema_version:1,kind:'mcp',snapshot_sha256:ref('source.md').sha256,locator:'https://example.com/REQ-1',resource_id:'REQ-1',revision:'1',captured_at:'2020-01-01T00:00:00Z',scope:'description',completeness:'complete',missing:[]};
  write('metadata.json',metadata); importSource(root,'request',{input:'source.md',metadataFile:'metadata.json'});
  const source = sourceReport(root).sources[0]; write('receipt.txt','Observed provider revision 1');
  write('observation.json',{schema_version:1,snapshot_sha256:source.sha256,capture_sha256:source.capture_sha256,checked_at:'2020-01-01T01:00:00Z',outcome:'observed',revision:'1',evidence_sha256:ref('receipt.txt').sha256});
  checkSource(root,'request',{report:'observation.json',input:'receipt.txt'});
  const row=record(); row.conditions.push(ref(source.normalized),ref('docs/sources/manifest.json')); save(row);
  assert.equal(experienceReport(root,'alpha').inspection.current,true);
  metadata.revision='2';metadata.captured_at='2020-01-02T00:00:00Z';write('metadata.json',metadata);
  importSource(root,'request',{input:'source.md',metadataFile:'metadata.json'});
  assert.equal(experienceReport(root,'alpha').inspection.current,false);
});
