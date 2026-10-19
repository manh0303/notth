import { isDeepStrictEqual } from 'node:util';
import { isObject, digest, encode, HarnessError } from './files.js';
import { memoryReference } from './memory-reference.js';
import { reviewVerification } from './verification-report.js';

const assert = (ok, message) => { if (!ok) throw new HarnessError('Adaptive execution: ' + message); };
const text = v => typeof v === 'string' && v.trim().length > 0 && v.length <= 2048 && !/[\x00-\x1f\x7f]/.test(v);
const fields = (v, names) => assert(isObject(v) && Object.keys(v).every(k => names.includes(k)), 'unexpected fields');
const phases = ['recall', 'understand', 'plan', 'execute', 'observe', 'verify', 'replan', 'remember', 'complete', 'paused'];
export function baselineRevision(refs) {
  return 'sha256:' + digest(encode(refs.map(({ path, sha256 }) => ({ path, sha256 })).sort((a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0)));
}
export function inspectReferences(root, rows) {
  assert(Array.isArray(rows) && rows.length > 0 && rows.length <= 128, '1–128 references required');
  const seen = new Set();
  return rows.map(ref => {
    fields(ref, ['path', 'sha256', 'locator']);
    assert(typeof ref.sha256 === 'string' && /^[a-f0-9]{64}$/.test(ref.sha256) && !seen.has(ref.path), 'unique source hash');
    assert(ref.locator === undefined || text(ref.locator), 'locator'); seen.add(ref.path);
    return memoryReference(root, ref.path, ref.sha256);
  });
}
export function validateAdaptive(root, checkpoint, { verifyEvidence = true } = {}) {
  const state = checkpoint.adaptive;
  if (state === undefined) return null;
  fields(state, ['schema_version', 'phase', 'objective', 'acceptance', 'limits', 'events']);
  assert(state.schema_version === 1 && phases.includes(state.phase), 'schema/phase');
  inspectReferences(root, [state.objective]); inspectReferences(root, state.acceptance);
  fields(state.limits, ['max_attempts_per_step', 'max_replans', 'max_no_progress']);
  for (const key of ['max_attempts_per_step', 'max_replans', 'max_no_progress'])
    assert(Number.isSafeInteger(state.limits[key]) && state.limits[key] > 0 && state.limits[key] <= 20, 'bounded positive limits');
  assert(Array.isArray(state.events) && state.events.length <= 128, 'bounded event history');
  const steps = new Set([...checkpoint.completed, ...checkpoint.pending, ...(checkpoint.in_progress ? [checkpoint.in_progress] : [])].map(t => t.id));
  const ids = new Set(), attempts = new Map(); let replans = 0, noProgress = 0, lastAttempt = null, lastReview = null, lastEvidenceCurrent = true;
  for (const event of state.events) {
    fields(event, ['id', 'kind', 'step_id', 'action', 'outcome', 'reason', 'evidence', 'baseline', 'verification', 'retry', 'timestamp', 'operation_id']);
    assert(text(event.id) && !ids.has(event.id) && text(event.reason), 'unique event ID/reason'); ids.add(event.id);
    assert(typeof event.timestamp === 'string' && /T.*(?:Z|[+-]\d\d:\d\d)$/.test(event.timestamp) && Number.isFinite(Date.parse(event.timestamp)), 'event timestamp');
    const evidence = inspectReferences(root, event.evidence);
    const strictEvent = verifyEvidence && event === state.events.at(-1);
    if (strictEvent) assert(evidence.every(r => r.freshness === 'current'), 'event evidence missing or changed');
    if (event.kind === 'replan') {
      assert(++replans <= state.limits.max_replans, 'replan budget exhausted');
      assert(['step_id', 'action', 'outcome', 'baseline', 'verification', 'retry', 'operation_id'].every(k => event[k] === undefined), 'replan fields');
      noProgress = 0; continue;
    }
    assert(event.kind === 'attempt' && steps.has(event.step_id) && text(event.action)
      && ['passed', 'failed', 'blocked'].includes(event.outcome), 'attempt step/action/outcome');
    assert(noProgress < state.limits.max_no_progress, 'no-progress budget exhausted; investigate and replan');
    const count = (attempts.get(event.step_id) ?? 0) + 1; attempts.set(event.step_id, count);
    assert(count <= state.limits.max_attempts_per_step, 'step attempt budget exhausted');
    inspectReferences(root, event.baseline);
    if (event.operation_id !== undefined) assert(text(event.operation_id) && checkpoint.operations.some(op => op.id === event.operation_id), 'unknown operation reference');
    if (event.retry !== undefined) {
      fields(event.retry, ['safe', 'reason']); assert(event.retry.safe === true && text(event.retry.reason), 'safe retry justification');
    }
    const prior = state.events.slice(0, state.events.indexOf(event)).findLast(e => e.kind === 'attempt' && e.step_id === event.step_id && e.action === event.action);
    if (prior && prior.outcome !== 'passed') assert(event.retry?.safe === true, 'repeated failed action requires safe retry rationale');
    if (event.outcome === 'passed') {
      assert(isObject(event.verification) && event.evidence.some(r => r.path === event.verification.path && r.sha256 === event.verification.sha256), 'passing attempt needs evidence-bound verification report');
      const currentReport = inspectReferences(root, [event.verification])[0];
      lastReview = null;
      if (strictEvent || currentReport.freshness === 'current') {
        try {
          lastReview = reviewVerification(root, event.verification.path);
          assert(lastReview.verdict === 'PASSED' && lastReview.metadata.source_revision === baselineRevision(event.baseline), 'verification verdict/revision mismatch');
        } catch (error) { if (strictEvent) throw error; lastReview = null; }
      }
    } else assert(event.verification === undefined, 'failed attempts do not carry passing verification');
    noProgress = event.outcome === 'passed' ? 0 : noProgress + 1; lastAttempt = event;
    lastEvidenceCurrent = evidence.every(r => r.freshness === 'current');
  }
  const scope = inspectReferences(root, [state.objective, ...state.acceptance].filter((r, i, all) => all.findIndex(x => x.path === r.path) === i));
  const baseline = lastAttempt ? inspectReferences(root, lastAttempt.baseline) : [];
  const verifiedScope = lastAttempt?.outcome === 'passed' && [...[state.objective], ...state.acceptance].every(ref =>
    lastAttempt.baseline.some(r => r.path === ref.path && r.sha256 === ref.sha256))
    && state.acceptance.every(ref => {
      return lastReview?.requirements.some(req => req.source === ref.path && req.verification === 'VERIFIED');
    });
  const reconciliation = !lastEvidenceCurrent || Boolean(lastAttempt?.outcome === 'passed' && !verifiedScope) || scope.some(r => r.freshness !== 'current') || baseline.some(r => r.freshness !== 'current');
  const unknown = checkpoint.operations.some(op => op.status !== 'completed');
  if (verifyEvidence && ['remember', 'complete'].includes(state.phase)) assert(verifiedScope && !reconciliation
    && checkpoint.pending.length === 0 && checkpoint.in_progress === null && checkpoint.blockers.length === 0 && !unknown,
  'completion needs current acceptance/baseline verification, no pending tasks/blockers/unknown effects');
  return { phase: state.phase, attempts: Object.fromEntries(attempts), replans, no_progress: noProgress,
    limits: state.limits, last_attempt: lastAttempt?.id ?? null, verified_scope: Boolean(verifiedScope),
    revalidate_required: reconciliation,
    exhausted: lastAttempt?.outcome !== 'passed' && (noProgress >= state.limits.max_no_progress || replans >= state.limits.max_replans || (attempts.get(lastAttempt?.step_id) ?? 0) >= state.limits.max_attempts_per_step),
    authority: 'Local contract only; host permissions and actual tool availability remain independent.' };
}
export function validateAdaptiveUpdate(previous, next) {
  const before = previous?.adaptive, after = next.adaptive;
  if (!before) { if (after) assert(after.events.length <= 1, 'attach adaptive state incrementally'); return; }
  assert(after !== undefined, 'cannot discard adaptive history');
  assert(isDeepStrictEqual(before.limits, after.limits), 'cannot silently raise/reset budgets; resolve a consequential scope/budget decision separately');
  assert(after.events.length >= before.events.length && after.events.length <= before.events.length + 1
    && isDeepStrictEqual(after.events.slice(0, before.events.length), before.events), 'append at most one event; preserve history');
  const appended = after.events.length > before.events.length ? after.events.at(-1) : null;
  if (appended?.kind === 'attempt' && appended.operation_id) assert(!previous.operations.some(op => op.id === appended.operation_id && op.status !== 'completed'), 'inspect uncertain external side-effect outcome before retrying');
  const changedScope = !isDeepStrictEqual(before.objective, after.objective) || !isDeepStrictEqual(before.acceptance, after.acceptance);
  if (changedScope) assert(after.events.length > before.events.length && after.events.at(-1).kind === 'replan', 'changed acceptance requires evidence-backed replan');
}
