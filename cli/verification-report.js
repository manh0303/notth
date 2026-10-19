import fs from 'node:fs';
import { reviewJourney } from './journey-evidence.js';
import { isDeepStrictEqual } from 'node:util';
import { safe, stat, digest, isObject, HarnessError } from './files.js';
import { readConfig } from './project-config.js';

const text = v => typeof v === 'string' && v.trim().length > 0 && !/[\0\r\n]/.test(v);
const list = a => Array.isArray(a) && a.length > 0 && a.every(text) && new Set(a).size === a.length;
const assert = (ok, msg) => { if (!ok) throw new HarnessError(msg); };
const statuses = ['PASSED', 'FAILED', 'BLOCKED', 'NOT_RUN'];
const errorKinds = ['timeout', 'network', 'http', 'application', 'assertion', 'environment'];
const finite = n => typeof n === 'number' && Number.isFinite(n) && n >= 0;
const iso = s => text(s) && /^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/.test(s) && Number.isFinite(Date.parse(s));
const secretKey = /^(password|passwd|secret|api[_-]?key|access[_-]?token|refresh[_-]?token|authorization|cookie|credentials?)$/i;
export function redacted(value) {
  if (typeof value === 'string') {
    assert(!/Bearer\s+[A-Za-z0-9._~-]{8,}/i.test(value), 'Redact bearer credentials before verification');
    return;
  }
  if (Array.isArray(value)) { value.forEach(redacted); return; }
  if (!isObject(value)) return;
  for (const [k, v] of Object.entries(value)) {
    if (secretKey.test(k)) assert(v === '[REDACTED]' || v === '<REDACTED>', 'Redact credential fields before verification');
    redacted(v);
  }
}
export function reviewEvidence(root, refs) {
  assert(Array.isArray(refs), 'Invalid evidence list');
  return refs.map(ref => {
    assert(isObject(ref) && text(ref.path) && typeof ref.sha256 === 'string' && /^[a-f0-9]{64}$/.test(ref.sha256), 'Invalid evidence reference');
    const p = safe(root, ref.path), info = stat(p);
    assert(info?.isFile() && info.size <= 1024 * 1024, 'Evidence missing or exceeds 1 MiB');
    const bytes = fs.readFileSync(p);
    assert(digest(bytes) === ref.sha256, 'Evidence digest mismatch');
    const body = bytes.toString('utf8');
    try { redacted(JSON.parse(body)); } catch (e) {
      if (e instanceof HarnessError) throw e;
      assert(!/Bearer\s+[A-Za-z0-9._~-]{8,}|(?:password|api[_-]?key|access_token)\s*[:=]\s*(?!\[REDACTED\]|<REDACTED>)\S+/i.test(body), 'Redact credentials in evidence');
    }
    return ref;
  });
}
function observedValue(root, refs, actual) {
  assert(isObject(actual) && text(actual.evidence) && refs.some(r => r.path === actual.evidence) &&
    typeof actual.pointer === 'string' && (actual.pointer === '' || actual.pointer.startsWith('/')), 'Assertion needs a JSON evidence pointer');
  let value;
  try { value = JSON.parse(fs.readFileSync(safe(root, actual.evidence), 'utf8')); }
  catch { throw new HarnessError('Assertion evidence must be JSON'); }
  if (actual.pointer !== '') for (const part of actual.pointer.slice(1).split('/')) {
    assert(!/~(?![01])/.test(part), 'Invalid JSON pointer escape');
    const key = part.replaceAll('~1', '/').replaceAll('~0', '~');
    assert(value !== null && typeof value === 'object' && Object.hasOwn(value, key), 'Assertion JSON pointer is missing');
    value = value[key];
  }
  return value;
}
function assertion(row, root, refs) {
  assert(isObject(row) && text(row.id) && text(row.basis) && Object.hasOwn(row, 'expected'), 'Assertions need independent expected/observed values and requirement basis');
  const { expected, operator } = row;
  assert(['transport', 'schema', 'business', 'state', 'authorization', 'result'].includes(row.layer), 'Assertion needs a semantic layer');
  const observed = observedValue(root, refs, row.actual);
  if (Object.hasOwn(row, 'observed')) assert(isDeepStrictEqual(row.observed, observed), 'Typed observation does not match raw evidence');
  let passed;
  if (operator === 'equal') passed = isDeepStrictEqual(observed, expected);
  else if (operator === 'not-equal') passed = !isDeepStrictEqual(observed, expected);
  else if (operator === 'contains') {
    assert(typeof observed === 'string' || Array.isArray(observed), 'Contains assertion needs string or array');
    passed = typeof observed === 'string' ? typeof expected === 'string' && observed.includes(expected) : observed.some(v => isDeepStrictEqual(v, expected));
  } else if (operator === 'type') {
    assert(['object', 'array', 'string', 'number', 'boolean', 'null'].includes(expected), 'Invalid expected JSON type');
    const actual = observed === null ? 'null' : Array.isArray(observed) ? 'array' : typeof observed;
    passed = actual === expected;
  } else throw new HarnessError('Unsupported assertion operator');
  return { id: row.id, basis: row.basis, layer: row.layer, actual: row.actual, operator, expected, observed, passed };
}

export function reviewVerification(root, reportPath) {
  const report = readConfig(root, reportPath);
  assert(isObject(report) && report.schema_version === 1 && isObject(report.metadata), 'Invalid verification report schema');
  redacted(report);
  const meta = report.metadata;
  for (const field of ['run_id', 'feature', 'source_revision', 'environment', 'producer']) assert(text(meta[field]), 'Missing report metadata: ' + field);
  assert(iso(meta.timestamp), 'Report needs an ISO timestamp with timezone');
  if (meta.usage !== undefined) {
    assert(isObject(meta.usage) && text(meta.usage.source), 'Runtime usage needs an actual measurement source');
    for (const key of ['tokens', 'cost']) if (meta.usage[key] !== undefined) assert(finite(meta.usage[key]), 'Invalid measured usage');
    if (meta.usage.cost !== undefined) assert(text(meta.usage.currency), 'Measured cost requires currency');
  }
  assert(Array.isArray(report.requirements) && report.requirements.length > 0, 'Declare requirement/AC coverage');
  const reqs = new Map();
  for (const req of report.requirements) {
    assert(isObject(req) && text(req.id) && !reqs.has(req.id) && text(req.description) && text(req.source), 'Invalid/duplicate requirement');
    assert(req.verification_target === undefined || ['behavior', 'end-user'].includes(req.verification_target), 'Unknown requirement verification target');
    assert(req.verification_target !== 'end-user' || ['web', 'mobile', 'cli', 'api'].includes(req.surface), 'End-user requirement needs an interface surface');
    reqs.set(req.id, req);
  }
  assert(Array.isArray(report.scenarios) && report.scenarios.length > 0, 'Declare scenarios, including NOT_RUN/BLOCKED gaps');
  const ids = new Set();
  const scenarios = report.scenarios.map(row => {
    assert(isObject(row) && text(row.id) && !ids.has(row.id) && statuses.includes(row.status) && typeof row.executed === 'boolean', 'Invalid/duplicate scenario status');
    ids.add(row.id);
    assert(list(row.references) && row.references.every(r => reqs.has(r)), 'Unknown/missing requirement references');
    assert(text(row.method) && list(row.preconditions) && text(row.fixture) && list(row.steps) && text(row.expected) && text(row.observed), 'Scenario needs preconditions, fixture, steps and expected/observed results');
    assert(iso(row.timestamp), 'Scenario needs an ISO timestamp');
    assert(typeof row.mutates === 'boolean' && isObject(row.cleanup) && text(row.cleanup.strategy) && statuses.includes(row.cleanup.status), 'Scenario needs mutation/cleanup classification');
    if (row.error !== undefined) assert(isObject(row.error) && errorKinds.includes(row.error.kind) && text(row.error.message), 'Invalid error classification');
    assert(row.expected_error === undefined || ['http', 'application'].includes(row.expected_error), 'Expected errors must name HTTP/application semantics, never arbitrary exceptions');
    const refs = reviewEvidence(root, row.evidence);
    const assertionIds = new Set();
    assert(Array.isArray(row.assertions), 'Invalid assertions');
    const assertions = row.assertions.map(a => {
      const result = assertion(a, root, refs);
      assert(!assertionIds.has(result.id) && row.references.includes(result.basis), 'Assertion ID/basis must match this scenario coverage');
      assertionIds.add(result.id); return result;
    });
    if (!row.executed) {
      assert(row.execution === undefined, 'Unexecuted scenarios cannot contain execution receipts');
      assert(['BLOCKED', 'NOT_RUN'].includes(row.status) && text(row.reason) && assertions.length === 0, 'Unexecuted scenarios cannot contain runtime assertions or claim PASS/FAIL');
    } else {
      assert(['PASSED', 'FAILED'].includes(row.status) && isObject(row.execution), 'Executed scenario needs execution receipt');
      const ex = row.execution;
      assert(text(ex.tool) && list(ex.command) && Number.isInteger(ex.exit_code) &&
        Number.isInteger(ex.timeout_ms) && ex.timeout_ms > 0 &&
        Number.isInteger(ex.attempts) && ex.attempts > 0 &&
        Number.isInteger(ex.max_attempts) && ex.max_attempts >= ex.attempts, 'Execution needs tool, command, exit code and bounded timeout/attempts');
      assert(refs.length > 0, 'Executed scenarios need digest-checked evidence');
      if (ex.duration_ms !== undefined) assert(finite(ex.duration_ms), 'Invalid observed duration');
      const permittedError = !row.error || (row.expected_error === row.error.kind && ['http', 'application'].includes(row.error.kind));
      const semantic = !['api', 'backend-e2e', 'business-workflow', 'authorization', 'security', 'browser-e2e', 'mobile-e2e', 'cli-e2e', 'end-user'].includes(row.method) || assertions.some(a => a.layer !== 'transport');
      const pass = semantic && ex.exit_code === 0 && assertions.length > 0 && assertions.every(a => a.passed) && permittedError &&
        (!row.mutates || row.cleanup.status === 'PASSED');
      // Trust no typed PASS: recompute assertion/execution/cleanup consistency.
      assert(row.status === (pass ? 'PASSED' : 'FAILED'), 'Claimed status contradicts assertions, execution, error or cleanup');
    }
    return { ...row, assertions, evidence: refs, ...reviewJourney(root, row) };
  });
  const requirements = [...reqs.values()].map(req => {
    const linked = scenarios.filter(s => s.references.includes(req.id));
    return { ...req, verification: linked.length > 0 && linked.every(s => s.status === 'PASSED' && s.assertions.some(a => a.basis === req.id && a.passed))
      && (req.verification_target !== 'end-user' || linked.some(s => s.status === 'PASSED' && s.acceptance_scope === 'end-user' && s.journey.surface === req.surface && s.assertions.some(a => a.basis === req.id && a.layer !== 'transport' && a.passed))) ? 'VERIFIED' : 'UNVERIFIED',
      scenarios: linked.map(s => s.id) };
  });
  const counts = Object.fromEntries(statuses.map(s => [s, scenarios.filter(row => row.status === s).length]));
  const verdict = counts.FAILED ? 'FAILED' : counts.BLOCKED ? 'BLOCKED'
    : counts.NOT_RUN || requirements.some(r => r.verification === 'UNVERIFIED') ? 'NOT_RUN' : 'PASSED';
  return { status: { PASSED: 'ok', FAILED: 'fail', BLOCKED: 'blocked', NOT_RUN: 'planned' }[verdict],
    verdict, schema_version: 1, metadata: meta, counts, requirements, scenarios, executed: false,
    note: 'Evidence/report consistency only. Execution receipts are producer-declared; inspect raw logs and source revision independently. No application commands or model calls are run by aih.' };
}

const cell = s => String(s).replace(/[\r\n]/g, ' ').replace(/\|/g, '\\|').replace(/</g, '&lt;');
export function techspecEvidence(summary) {
  return [
    '# TechSpec: ' + cell(summary.metadata.feature),
    '',
    'Status: draft / pending-review. Source revision: ' + cell(summary.metadata.source_revision),
    'Runtime report: ' + summary.verdict + '. Static-analysis statements remain UNVERIFIED until independently checked.',
    '',
    '## Feature overview and source contracts',
    'UNVERIFIED: link approved requirements, relevant source/code revision and existing contracts; inspect only affected sections.',
    '',
    '## Architecture, business rules and interfaces',
    'UNVERIFIED: document applicable components, business/error flows, API/data/auth/integrations. Omit sections not relevant to this project.',
    '',
    '## Requirements and verification',
    '| Requirement | Source | Verification | Scenarios |',
    '| --- | --- | --- | --- |',
    ...summary.requirements.map(r => '| ' + cell(r.id) + ' — ' + cell(r.description) + ' | ' + cell(r.source) + ' | ' + r.verification + ' | ' + cell(r.scenarios.join(', ')) + ' |'),
    '',
    '## Scenario results',
    '| Scenario | Method / acceptance scope | Status | Expected | Observed | Evidence |',
    '| --- | --- | --- | --- | --- | --- |',
    ...summary.scenarios.map(s => '| ' + cell(s.id) + ' | ' + cell(s.method + ' / ' + s.acceptance_scope) + ' | ' + s.status + ' | ' + cell(s.expected) + ' | ' + cell(s.observed) + ' | ' + cell(s.evidence.map(e => e.path + ' sha256:' + e.sha256).join(', ')) + ' |'),
    '',
    '## Limitations and change maintenance',
    'Report validation checks consistency, not independent execution authenticity or business approval.',
    'Preserve existing user edits; propose only affected section changes with before/after revision, contract compatibility and artifact-impact evidence.',
    'Source/output write policy and actual host permission apply. No automatic source overwrite, merge or deployment.',
    '',
  ].join('\n');
}
