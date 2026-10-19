import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { importSource, sourceReport, checkSource } from '../cli/sources.js';
import { metadata, time } from '../cli/source-provenance.js';
import { SOURCE, digest, install, atomicWrite } from '../cli/harness.js';
let root;
beforeEach(() => { root = fs.mkdtempSync(path.join(os.tmpdir(), 'notth-provenance-')); });
afterEach(() => fs.rmSync(root, { recursive: true, force: true }));
const write = (name, value) => fs.writeFileSync(path.join(root, name), typeof value === 'string' ? value : JSON.stringify(value));
const readIndex = () => JSON.parse(fs.readFileSync(path.join(root, 'docs/sources/manifest.json')));
const report = () => sourceReport(root).sources[0];
function meta(overrides = {}) { return { schema_version: 1, kind: 'mcp', locator: 'https://issues.example.com/browse/APP-1',
  connection: 'issues', resource_id: 'APP-1', snapshot_sha256: digest(Buffer.from('snapshot')), revision: '17',
  captured_at: '2020-01-01T00:00:00Z', scope: 'issue-description-comments-attachments', completeness: 'partial', missing: ['attachment scan not accessible'], ...overrides }; }
function capture(overrides = {}, content = 'snapshot') {
  write('snapshot.json', content); write('meta.json', meta({ snapshot_sha256: digest(Buffer.from(content)), ...overrides }));
  return importSource(root, 'issue', { input: 'snapshot.json', metadataFile: 'meta.json' });
}
function observation(overrides = {}) {
  const current = report();
  const value = { schema_version: 1, snapshot_sha256: current.sha256, capture_sha256: current.capture_sha256,
    checked_at: '2020-01-02T00:00:00Z', outcome: 'observed', revision: '17', evidence_sha256: digest(Buffer.from('observed response')), ...overrides };
  write('evidence.txt', 'observed response'); write('check.json', value); return value;
}
function check(options = {}) { return checkSource(root, 'issue', { report: 'check.json', input: 'evidence.txt', ...options }); }
function cli(args, code = 0) {
  const p = spawnSync(process.execPath, [path.join(SOURCE, 'bin/aih.js'), ...args], { cwd: root, encoding: 'utf8' });
  assert.equal(p.status, code, p.stdout + p.stderr); return JSON.parse(p.stdout || p.stderr);
}
test('local legacy data stays schema 1; metadata opt-in upgrades without losing originals', () => {
  write('snapshot.json', 'snapshot');
  const local = importSource(root, 'issue', { input: 'snapshot.json' });
  const before = fs.readFileSync(path.join(root, 'docs/sources/manifest.json'));
  sourceReport(root); assert.deepEqual(fs.readFileSync(path.join(root, 'docs/sources/manifest.json')), before);
  assert.equal(readIndex().schema_version, 1); write('meta.json', meta());
  importSource(root, 'issue', { input: 'snapshot.json', metadataFile: 'meta.json', dryRun: true });
  assert.equal(readIndex().schema_version, 1);
  const imported = capture(); assert.equal(readIndex().schema_version, 2); assert.equal(imported.original, local.original);
  assert.equal(report().provenance.resource_id, 'APP-1'); assert.equal(report().freshness.state, 'not-checked');
  assert.deepEqual(report().freshness.missing, ['attachment scan not accessible']);
  assert.equal(capture().action, 'unchanged');
});
test('common envelope supports file, URL, MCP, connector and API without a provider dependency', () => {
  for (const kind of ['url', 'mcp', 'connector', 'api']) assert.equal(metadata(meta({ kind })).kind, kind);
  assert.equal(metadata(meta({ kind: 'file', locator: undefined })).kind, 'file');
  assert.equal(metadata(meta({ locator: undefined })).resource_id, 'APP-1');
});
test('remote revision with identical bytes retains capture history; explicit revert selects latest capture', () => {
  const first = capture();
  capture({ captured_at: '2020-01-02T00:00:00Z', revision: '18' });
  assert.equal(readIndex().sources[0].revisions.length, 1);
  assert.equal(readIndex().sources[0].revisions[0].captures.length, 2);
  capture({ captured_at: '2020-01-03T00:00:00Z', revision: '19' }, 'new bytes');
  capture({ captured_at: '2020-01-04T00:00:00Z', revision: '20' });
  assert.equal(report().sha256, first.sha256); assert.equal(report().provenance.revision, '20');
  assert.equal(readIndex().sources[0].revisions.length, 2);
});
test('freshness derives changed/unchanged/unknown/unavailable without asserting live freshness or completeness', () => {
  capture(); observation();
  assert.equal(check({ dryRun: true }).freshness.state, 'unchanged-at-check'); assert.equal(report().freshness.state, 'not-checked');
  assert.equal(check().freshness.state, 'unchanged-at-check'); assert.equal(check().action, 'unchanged');
  assert.equal(report().freshness.completeness, 'partial');
  observation({ revision: '18', checked_at: '2020-01-03T00:00:00Z' }); assert.equal(check().freshness.state, 'changed');
  observation({ revision: undefined, reason: 'Access denied', outcome: 'unavailable', checked_at: '2020-01-04T00:00:00Z' });
  assert.equal(check().freshness.state, 'unavailable');
  capture({ revision: undefined, captured_at: '2020-01-05T00:00:00Z' }); assert.equal(report().freshness.state, 'not-checked');
  observation({ revision: '18', checked_at: '2020-01-06T00:00:00Z' }); assert.equal(check().freshness.state, 'unknown');
  observation({ content_sha256: report().sha256, revision: undefined, checked_at: '2020-01-07T00:00:00Z' });
  assert.equal(check().freshness.state, 'unchanged-at-check');
});
test('contradictory hash and revision is changed; stale capture cannot receive a new observation', () => {
  capture(); observation({ content_sha256: 'a'.repeat(64) }); assert.equal(check().freshness.state, 'changed');
  const stale = observation({ checked_at: '2020-01-04T00:00:00Z' });
  capture({ captured_at: '2020-01-03T00:00:00Z', revision: '18' });
  write('check.json', stale); assert.throws(() => check(), /changed since observation/);
});
test('metadata rejects mismatched bytes, changed identity/scope, unsafe locators, invalid/misleading completeness and dates', () => {
  for (const override of [
    { locator: 'https://user:password@example.com/a' }, { locator: 'https://example.com/a?token=secret' },
    { locator: 'https://example.com/a#secret' }, { locator: 'http://example.com/a' },
    { completeness: 'complete' }, { completeness: 'partial', missing: [] },
    { connection: 'http://secret' }, { captured_at: '2020-02-31T00:00:00Z' }, { snapshot_sha256: ['a'.repeat(64)] },
  ]) assert.throws(() => metadata(meta(override)));
  assert.throws(() => time('today'));
  capture(); const before = readIndex();
  assert.throws(() => capture({ locator: 'https://example.com/other', captured_at: '2020-01-03T00:00:00Z' }), /identity/);
  assert.throws(() => capture({ scope: 'different', captured_at: '2020-01-03T00:00:00Z' }), /scope/);
  write('meta.json', meta({ snapshot_sha256: '0'.repeat(64) }));
  assert.throws(() => importSource(root, 'issue', { input: 'snapshot.json', metadataFile: 'meta.json' }), /exact input/);
  assert.throws(() => capture({ captured_at: '2999-01-01T00:00:00Z' }), /future/);
  write('other.md', 'changed'); assert.throws(() => importSource(root, 'issue', { input: 'other.md' }), /requires --metadata/);
  assert.deepEqual(readIndex(), before);
});
test('observation requires hashed evidence, ordered times and valid outcome; preserves bytes on error', () => {
  capture(); observation(); write('evidence.txt', 'wrong'); assert.throws(() => check(), /digest/);
  observation({ evidence_sha256: '1'.repeat(64) }); assert.throws(() => check(), /digest/);
  observation({ outcome: 'unavailable' }); assert.throws(() => check(), /Unavailable/);
  observation({ checked_at: '2019-01-01T00:00:00Z' }); assert.throws(() => check(), /time/);
  observation({ checked_at: '2999-01-01T00:00:00Z' }); assert.throws(() => check(), /time/);
  observation(); const result = check();
  observation({ revision: '18', checked_at: '2020-01-01T01:00:00Z' }); assert.throws(() => check(), /previous check/);
  write(result.evidence, 'edited'); assert.throws(() => sourceReport(root), /integrity conflict/);
});
test('metadata digest tampering fails; evidence rollback and complete-folder recovery preserve provenance', () => {
  capture(); observation(); let writes = 0;
  assert.throws(() => check({ writer: (filename, data) => { if (++writes === 2) throw new Error('disk'); atomicWrite(filename, data); } }), /disk/);
  assert.equal(report().freshness.state, 'not-checked'); check();
  const index = readIndex(), destination = fs.mkdtempSync(path.join(os.tmpdir(), 'notth-provenance-restore-'));
  try {
    fs.cpSync(path.join(root, 'docs'), path.join(destination, 'docs'), { recursive: true });
    install(destination, SOURCE); assert.equal(sourceReport(destination).sources[0].freshness.state, 'unchanged-at-check');
    install(destination, SOURCE, { command: 'update' }); assert.deepEqual(JSON.parse(fs.readFileSync(path.join(destination, 'docs/sources/manifest.json'))), index);
  } finally { fs.rmSync(destination, { recursive: true, force: true }); }
  index.sources[0].revisions[0].captures[0].metadata.revision = 'invented';
  write('docs/sources/manifest.json', index); assert.throws(() => sourceReport(root), /digest mismatch/);
});
test('CLI imports metadata and records evidence; rejects missing arguments and malformed JSON without echo', () => {
  write('snapshot.json', 'snapshot'); write('meta.json', meta());
  assert.equal(cli(['import-source', 'issue', '--input', 'snapshot.json', '--metadata', 'meta.json']).status, 'ok');
  observation(); assert.equal(cli(['source-check', 'issue', '--report', 'check.json', '--input', 'evidence.txt']).freshness.state, 'unchanged-at-check');
  assert.match(cli(['source-check', 'issue'], 2).message, /requires/);
  write('meta.json', '{secret-invalid');
  const error = cli(['import-source', 'issue', '--input', 'snapshot.json', '--metadata', 'meta.json'], 1);
  assert.ok(!error.message.includes('secret-invalid'));
});
