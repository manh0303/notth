// Project-local experience sidecars, not model training or automatic global skills.
import fs from 'node:fs';
import path from 'node:path';
import { safe, stat, encode, digest, isObject, SLUG, HarnessError } from './files.js';
import { check, guard, transaction } from './harness.js';
import { sourceReport } from './sources.js';
import { readConfig } from './project-config.js';
import { contextPath } from './task-context.js';
import { inspectReferences, baselineRevision } from './adaptive.js';
import { reviewVerification, redacted } from './verification-report.js';
const assert = (ok, msg) => { if (!ok) throw new HarnessError('Experience: ' + msg); };
const text = v => typeof v === 'string' && v.trim().length > 0 && v.length <= 2048 && !/[\x00-\x1f\x7f]/.test(v);
const list = v => Array.isArray(v) && v.length <= 32 && v.every(text);
const timestamp = v => text(v) && /T.*(?:Z|[+-]\d\d:\d\d)$/.test(v) && Number.isFinite(Date.parse(v));
function secure(value) {
  redacted(value);
  assert(!/(?:https?:\/\/[^\s/]+:[^\s/]+@|-----BEGIN [A-Z ]*PRIVATE KEY-----|(?:password|api[_-]?key|access[_-]?token)\s*[=:]\s*(?!\[REDACTED\]|<REDACTED>)[A-Za-z0-9_~.+/-]{8,}|gh[pousr]_[A-Za-z0-9]{20,})/i.test(JSON.stringify(value)), 'redact credentials before saving');
}
export function experiencePath(id) { return contextPath(id).replace(/context\.json$/, 'experience.json'); }
function validate(root, id, row) {
  const keys = ['schema_version','change_id','revision','status','category','problem','context','hypothesis','approach','failures','solution','conditions','required_tags','applies_when','limitations','baseline','source_revision','verification','created_at','updated_at','reason','superseded_by'];
  assert(isObject(row) && Object.keys(row).every(k => keys.includes(k)) && row.schema_version === 1 && row.change_id === id
    && Number.isSafeInteger(row.revision) && row.revision >= 0, 'schema/change/revision');
  assert(['candidate','verified','rejected','superseded','invalidated'].includes(row.status) && typeof row.category === 'string' && SLUG.test(row.category), 'status/category');
  for (const key of ['problem','context','hypothesis','approach','solution','applies_when']) assert(text(row[key]), key);
  assert(list(row.failures) && list(row.limitations) && list(row.required_tags) && row.required_tags.every(t => SLUG.test(t)), 'failures/limitations/tags');
  assert(timestamp(row.created_at) && timestamp(row.updated_at) && Date.parse(row.updated_at) >= Date.parse(row.created_at), 'timestamps');
  if (['rejected','superseded','invalidated'].includes(row.status)) assert(text(row.reason), 'lifecycle reason');
  if (row.status === 'superseded') { experiencePath(row.superseded_by); assert(row.superseded_by !== id, 'supersession self reference'); }
  else assert(row.superseded_by === undefined, 'unexpected replacement');
  const baseline = inspectReferences(root, row.baseline), conditions = inspectReferences(root, row.conditions);
  const report = inspectReferences(root, [row.verification])[0];
  assert(row.source_revision === baselineRevision(row.baseline), 'baseline revision mismatch');
  secure(row);
  const preserved = [...row.baseline, ...row.conditions].filter(ref => /^docs\/sources\/(originals|normalized)\//.test(ref.path));
  let catalogCurrent = true;
  if (preserved.length) {
    assert(row.conditions.some(ref => ref.path === 'docs/sources/manifest.json'), 'preserved source requires hashed source manifest condition');
    const catalog = sourceReport(root).sources;
    catalogCurrent = preserved.every(ref => catalog.some(source => [source.original,source.normalized].includes(ref.path)
      && (!source.provenance || source.provenance.kind === 'file' || source.freshness.state === 'unchanged-at-check')));
  }
  let verified = false;
  if (report.freshness === 'current') {
    try {
      const result = reviewVerification(root, row.verification.path);
      verified = result.verdict === 'PASSED' && result.metadata.source_revision === row.source_revision
        && result.requirements.every(req => row.baseline.some(ref => ref.path === req.source));
    } catch (error) { if (!(error instanceof HarnessError)) throw error; }
  }
  return { baseline, conditions, report, verified,
    current: verified && catalogCurrent && [...baseline,...conditions,report].every(ref => ref.freshness === 'current') };
}
export function experienceReport(root, id) {
  assert(check(root).status === 'ok', 'fix installation drift');
  const name = experiencePath(id), row = readConfig(root, name);
  if (row === null) return { status: 'planned', configured: false, path: name, next_action: 'No experience recorded; only capture a meaningful verified solution.' };
  const inspection = validate(root, id, row);
  return { status: inspection.current ? 'ok' : 'blocked', configured: true, path: name,
    experience_sha256: digest(fs.readFileSync(safe(root, name))), record: row, inspection,
    authority: 'Project-local guidance only. Validate applicability and current requirements before reuse; never permission or model training.' };
}
export function saveExperience(root, id, reportPath, expected) {
  return guard(root, () => {
    assert(check(root).status === 'ok', 'fix installation drift');
    const name = experiencePath(id); assert(reportPath !== name, 'use separate host-prepared report');
    assert(stat(safe(root, 'openspec/changes/' + id + '/tasks.md')), 'existing task required');
    const row = readConfig(root, reportPath), inspection = validate(root, id, row);
    const previous = readConfig(root, name), previousBytes = previous ? fs.readFileSync(safe(root, name)) : null;
    if (previous) {
      validate(root, id, previous);
      assert(typeof expected === 'string' && digest(previousBytes) === expected && row.revision === previous.revision, 'record changed; re-read expected digest/revision');
      assert(row.created_at === previous.created_at && Date.parse(row.updated_at) >= Date.parse(previous.updated_at), 'preserve creation/update history');
    } else assert(expected === undefined && row.revision === 0, 'initial revision/expected');
    if (row.status === 'verified') assert(inspection.current, 'verified experience requires current scope and passing evidence');
    if (row.status === 'superseded') {
      const replacement = experienceReport(root, row.superseded_by);
      assert(replacement.configured && replacement.record.status === 'verified' && replacement.inspection.current, 'replacement must be current and verified');
    }
    const next = { ...row, revision: row.revision + 1 }, changes = { [name]: encode(next) };
    if (previous) {
      const history = 'openspec/changes/' + id + '/experience-history/' + digest(previousBytes) + '.json';
      const existing = stat(safe(root, history));
      assert(!existing || fs.readFileSync(safe(root, history)).equals(previousBytes), 'history collision');
      if (!existing) changes[history] = previousBytes;
    }
    transaction(root, changes);
    return { status: 'ok', path: name, revision: next.revision, experience_sha256: digest(encode(next)), executed: false };
  });
}
export function experienceCatalog(root, { category, tags = [] } = {}) {
  assert(check(root).status === 'ok', 'fix installation drift');
  assert(category === undefined || typeof category === 'string' && SLUG.test(category), 'category');
  assert(Array.isArray(tags) && tags.length <= 32 && tags.every(t => typeof t === 'string' && SLUG.test(t)), 'tags');
  const candidates = [];
  function scan(prefix) {
    const dir = path.dirname(safe(root, prefix + '/.experience-probe'));
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true }).sort((a,b) => a.name < b.name ? -1 : 1);
    assert(entries.length <= 1000, 'catalog too large; use explicit task retrieval');
    for (const entry of entries) {
      if (entry.name === 'archive' && prefix === 'openspec/changes') { scan(prefix + '/archive'); continue; }
      if (!entry.isDirectory() || !/^[a-zA-Z0-9_-]+$/.test(entry.name)) continue;
      const name = prefix + '/' + entry.name + '/experience.json';
      if (stat(safe(root, name))) candidates.push(name);
    }
  }
  scan('openspec/changes'); const records = [], errors = [];
  for (const name of candidates.slice(0, 200)) {
    try {
      const row = readConfig(root, name); experiencePath(row?.change_id); const result = validate(root, row.change_id, row);
      const applicability = row.status !== 'verified' ? row.status : !result.current ? 'stale'
        : category === undefined ? 'needs-category' : category !== row.category ? 'category-mismatch'
        : row.required_tags.some(tag => !tags.includes(tag)) ? 'condition-mismatch' : 'eligible-for-review';
      records.push({ id: row.change_id, path: name, category: row.category, status: row.status,
        applicability, source_revision: row.source_revision, updated_at: row.updated_at,
        note: 'Eligibility checks category/tags and local revisions only. Host must inspect applies_when, limitations and current requirements.' });
    } catch (error) { if (!(error instanceof HarnessError)) throw error; errors.push({ path: name, status: 'blocked', reason: 'Invalid or unsafe experience; inspect locally without treating it as usable knowledge.' }); }
  }
  const counts = new Map(); for (const row of records) counts.set(row.id, (counts.get(row.id) ?? 0) + 1);
  for (const row of records) if (counts.get(row.id) > 1) row.applicability = 'ambiguous';
  return { status: errors.length ? 'blocked' : 'ok', executed: false, records, errors,
    truncated: candidates.length > 200, omitted: Math.max(0, candidates.length - 200),
    note: 'Scans active and one-level archived task sidecars only. No global export, automatic promotion or external execution.' };
}
