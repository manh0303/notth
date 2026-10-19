import { readConfig } from './project-config.js';
import { safe, stat, isObject, HarnessError } from './files.js';

export const PROJECT_DECISIONS = '.notth/decisions.json';
export const emptyProjectDecisions = () => ({ schema_version: 1, decisions: [] });
const text = value => typeof value === 'string' && value.trim().length > 0 && value.length <= 4096 && !/[\x00-\x1f\x7f]/.test(value);
const id = value => typeof value === 'string' && /^[A-Za-z][A-Za-z0-9_-]{0,63}$/.test(value);
const scope = value => value === 'project' || typeof value === 'string' && /^module:[a-z][a-z0-9-]*(?:\/[a-z][a-z0-9-]*)*$/.test(value);
const fail = (ok, label) => { if (!ok) throw new HarnessError('Invalid project decisions: ' + label); };

export function loadProjectDecisions(root) {
  const value = readConfig(root, PROJECT_DECISIONS);
  if (value === null && !stat(safe(root, PROJECT_DECISIONS))) return null;
  fail(isObject(value) && value.schema_version === 1 && Object.keys(value).sort().join(',') === 'decisions,schema_version'
    && Array.isArray(value.decisions) && value.decisions.length <= 256, 'schema');
  const rows = new Map();
  for (const row of value.decisions) {
    fail(isObject(row) && Object.keys(row).every(k => ['id', 'scope', 'status', 'question', 'answer', 'reason', 'source', 'superseded_by', 'do_not_ask_again'].includes(k))
      && id(row.id) && scope(row.scope) && ['proposed', 'confirmed', 'superseded'].includes(row.status)
      && text(row.question) && !rows.has(row.id), 'entry fields or duplicate ID');
    for (const key of ['answer', 'reason', 'source']) fail(row[key] === undefined || text(row[key]), key);
    if (row.status !== 'proposed') fail(['answer', 'reason', 'source'].every(k => text(row[k])), 'confirmed/superseded decision needs answer, reason and source');
    fail(row.do_not_ask_again === undefined || typeof row.do_not_ask_again === 'boolean', 'do_not_ask_again');
    fail(row.status === 'superseded' ? id(row.superseded_by) && row.superseded_by !== row.id : row.superseded_by === undefined, 'superseded_by');
    rows.set(row.id, row);
  }
  for (const row of rows.values()) {
    const seen = new Set(); let current = row;
    while (current.status === 'superseded') {
      fail(!seen.has(current.id), 'supersession cycle'); seen.add(current.id);
      const next = rows.get(current.superseded_by);
      fail(next && next.scope === current.scope && next.status !== 'proposed', 'replacement must exist in the same scope and be confirmed/superseded');
      current = next;
    }
  }
  return value;
}

export function projectDecisionReport(root, requestedScope) {
  fail(requestedScope === undefined || scope(requestedScope), 'requested scope');
  const value = loadProjectDecisions(root);
  const decisions = (value?.decisions ?? []).filter(row => requestedScope === undefined || row.scope === 'project' || row.scope === requestedScope);
  return { status: 'ok', configured: value !== null, path: PROJECT_DECISIONS,
    confirmed: decisions.filter(row => row.status === 'confirmed'),
    proposed: decisions.filter(row => row.status === 'proposed'), superseded: decisions.filter(row => row.status === 'superseded'),
    note: 'Recorded decisions are project context, not permissions. Reuse only while scope and sources remain applicable; changed evidence can require reconsideration, even with do_not_ask_again.' };
}
