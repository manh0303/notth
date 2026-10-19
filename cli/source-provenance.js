import { HarnessError, isObject, SLUG, digest, encode } from './files.js';

export const HASH = /^[a-f0-9]{64}$/;
const fail = message => { throw new HarnessError(message); };
export function fields(value, required, optional = []) {
  if (!isObject(value) || required.some(k => !Object.hasOwn(value, k))
      || Object.keys(value).some(k => ![...required, ...optional].includes(k))) fail('Invalid source provenance fields');
}
const text = value => typeof value === 'string' && value.trim().length > 0 && value.length <= 2048 && !/[\x00-\x1f\x7f]/.test(value);
export function hash(value) { if (typeof value !== 'string' || !HASH.test(value)) fail('Invalid provenance hash'); }
export function time(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{1,3})?Z$/.test(value)
      || !Number.isFinite(Date.parse(value))) fail('Expected a UTC ISO timestamp');
  const canonical = new Date(value).toISOString();
  if (canonical.slice(0, 19) !== value.slice(0, 19)) fail('Invalid calendar timestamp');
}
export function locator(value) {
  if (!text(value)) fail('Invalid source locator');
  let url;
  try { url = new URL(value); } catch { fail('Invalid source locator'); }
  // Queries often contain signed credentials. Store a canonical permalink, never a tool endpoint.
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash)
    fail('Use a credential-free HTTPS permalink without query or fragment');
}
export function metadata(value) {
  fields(value, ['schema_version', 'kind', 'snapshot_sha256', 'scope', 'captured_at', 'completeness', 'missing'],
    ['locator', 'resource_id', 'connection', 'revision']);
  if (value.schema_version !== 1 || !['file', 'url', 'mcp', 'api', 'connector'].includes(value.kind)) fail('Invalid source metadata schema/kind');
  hash(value.snapshot_sha256); time(value.captured_at);
  if (!text(value.scope) || !['complete', 'partial', 'unknown'].includes(value.completeness)
      || !Array.isArray(value.missing) || value.missing.length > 100 || !value.missing.every(text)
      || new Set(value.missing).size !== value.missing.length) fail('Invalid source scope/completeness');
  if ((value.completeness === 'complete' && value.missing.length) || (value.completeness === 'partial' && !value.missing.length)) fail('Completeness conflicts with missing content');
  for (const key of ['resource_id', 'revision']) if (value[key] !== undefined && !text(value[key])) fail('Invalid source identifier/revision');
  if (value.connection !== undefined && (typeof value.connection !== 'string' || !SLUG.test(value.connection))) fail('Use a connection alias, never credentials');
  if (value.locator !== undefined) locator(value.locator);
  if (value.kind === 'file' && value.locator !== undefined) fail('File provenance must not store machine paths or URLs');
  if (value.kind !== 'file' && !value.locator && !(value.connection && value.resource_id)) fail('External source requires a permalink or connection plus resource ID');
  if (['url', 'api'].includes(value.kind) && !value.locator) fail('URL/API source requires a canonical permalink');
  return value;
}
export function identity(value) {
  // A stable permalink permits a different transport; otherwise the binding + resource ID identify it.
  return JSON.stringify([value.kind === 'file' ? 'file' : 'external', value.locator ?? [value.connection, value.resource_id], value.scope]);
}
export function capture(value) { metadata(value); return { sha256: digest(encode(value)), metadata: value }; }
export function validateCapture(value, snapshotHash) {
  fields(value, ['sha256', 'metadata']); hash(value.sha256); metadata(value.metadata);
  if (value.metadata.snapshot_sha256 !== snapshotHash || digest(encode(value.metadata)) !== value.sha256) fail('Capture provenance digest mismatch');
}
export function latest(source) {
  let revision = source.revisions.at(-1), found;
  for (const item of source.revisions) for (const value of item.captures ?? []) {
    if (!found || Date.parse(value.metadata.captured_at) > Date.parse(found.metadata.captured_at)) { revision = item; found = value; }
  }
  return { revision, capture: found };
}
export function observation(value) {
  fields(value, ['schema_version', 'snapshot_sha256', 'capture_sha256', 'checked_at', 'outcome', 'evidence_sha256'],
    ['revision', 'content_sha256', 'reason']);
  if (value.schema_version !== 1 || !['observed', 'unavailable'].includes(value.outcome)) fail('Invalid source observation schema/outcome');
  for (const key of ['snapshot_sha256', 'capture_sha256', 'evidence_sha256']) hash(value[key]);
  time(value.checked_at);
  if (value.content_sha256 !== undefined) hash(value.content_sha256);
  for (const key of ['revision', 'reason']) if (value[key] !== undefined && !text(value[key])) fail('Invalid observation revision/reason');
  if (value.outcome === 'unavailable' && (!value.reason || value.revision !== undefined || value.content_sha256 !== undefined)) fail('Unavailable observations require a reason and no claimed revision/content');
  if (value.outcome === 'observed' && value.revision === undefined && value.content_sha256 === undefined) fail('Observed source needs a revision or exact snapshot hash');
  return value;
}
export function freshness(source) {
  const current = latest(source), meta = current.capture?.metadata;
  const check = source.checks?.filter(c => c.report.capture_sha256 === current.capture?.sha256).at(-1)?.report;
  let state = 'not-checked';
  if (check?.outcome === 'unavailable') state = 'unavailable';
  else if (check) {
    const compared = [];
    if (check.revision !== undefined && meta.revision !== undefined) compared.push(check.revision === meta.revision);
    if (check.content_sha256 !== undefined) compared.push(check.content_sha256 === current.revision.sha256);
    state = compared.includes(false) ? 'changed' : compared.length ? 'unchanged-at-check' : 'unknown';
  }
  return { state, checked_at: check?.checked_at ?? null, completeness: meta?.completeness ?? 'unknown',
    missing: meta?.missing ?? [], basis: 'Host-supplied observation; no live connection or freshness guarantee.' };
}
