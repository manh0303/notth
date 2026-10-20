// Derived views over canonical project artifacts. No memory database or provider calls.
import fs from 'node:fs';
import { safe, stat, digest, encode, HarnessError } from './files.js';
import { check } from './harness.js';
import { localContext, knowledgeReport } from './knowledge.js';
import { projectDecisionReport } from './project-decisions.js';
import { sourceReport } from './sources.js';
import { taskContextReport, contextPath } from './task-context.js';
import { resumePlan, checkpointPath } from './checkpoint.js';
import { redacted } from './verification-report.js';

export { memoryReference } from './memory-reference.js';
import { memoryReference } from './memory-reference.js';

function ready(root) { if (check(root).status !== 'ok') throw new HarnessError('Fix installation drift before memory access'); }
export function memoryBudget(value = 8192) {
  const budget = Number(value);
  if (!Number.isSafeInteger(budget) || budget < 1024 || budget > 65536) throw new HarnessError('Memory budget must be 1024–65536 bytes');
  return budget;
}
export function memoryReport(root, { changeId, query = '', budget: limit, experiences = [] } = {}) {
  ready(root); const budget = memoryBudget(limit);
  if (typeof query !== 'string' || query.length > 512 || /[\x00-\x1f]/.test(query)) throw new HarnessError('Invalid memory query');
  redacted(query);
  const records = [], seen = new Set();
  function add(id, type, name, locator, evidence, freshness, priority = 0, expected) {
    if (seen.has(id)) return; seen.add(id);
    const source = memoryReference(root, name, expected);
    records.push({ id, type, scope: changeId && /^(working|task-source|episode):/.test(id) ? 'task:' + changeId : 'project',
      source: { ...source, locator }, evidence_status: evidence,
      freshness: source.freshness !== 'current' ? source.freshness : freshness,
      authority: 'guidance-only', priority });
  }
  const knowledge = knowledgeReport(root), local = localContext(root);
  add('semantic:local', 'semantic', '.notth/local.md', 'Project facts; inspect original sections', 'declared',
    knowledge.status === 'current' ? 'current' : 'needs-reconciliation', 2);
  for (const name of local.value?.sources ?? []) add('semantic:' + name, 'semantic', name, 'Declared project source', 'unverified', 'inspect-source');
  const decisions = projectDecisionReport(root);
  for (const status of ['confirmed', 'proposed', 'superseded']) for (const decision of decisions[status]) {
    add('decision:' + decision.id, 'semantic', decisions.path, 'decision:' + decision.id + ' scope:' + decision.scope,
      status === 'confirmed' ? 'declared-confirmed' : status, status === 'superseded' ? 'superseded' : 'inspect-source', status === 'confirmed' ? 3 : -2);
  }
  for (const source of sourceReport(root).sources) if (source.normalized) {
    add('source:' + source.id, 'semantic', source.normalized, 'source:' + source.id, 'captured-source',
      source.provenance && source.provenance.kind !== 'file' ? 'remote-check-required' : 'inspect-source');
  }
  if (changeId) {
    const context = taskContextReport(root, changeId);
    if (context.configured) {
      add('working:context', 'working', contextPath(changeId), 'Intent and trace links', 'declared', context.status === 'ok' ? 'current' : 'stale', 5);
      for (const source of context.sources) add('task-source:' + source.id, 'semantic', source.path, source.locator, 'source-linked',
        source.state !== 'current' ? 'stale' : source.external ? 'remote-check-required' : 'current', 3, source.sha256);
    }
    if (stat(safe(root, checkpointPath(changeId)))) {
      add('working:checkpoint', 'working', checkpointPath(changeId), 'Progress, evidence and side effects', 'declared', 'inspect-baseline', 5);
      const checkpoint = resumePlan(root, changeId);
      for (const task of checkpoint.completed) add('episode:' + changeId + ':' + task.id, 'episodic', checkpointPath(changeId),
        'completed:' + task.id, 'evidence-linked-declaration', checkpoint.revalidate_required ? 'stale' : 'inspect-baseline', 1);
    }
  }
  for (const experience of experiences) add('experience:' + experience.id, 'procedural', experience.path,
    experience.category, 'verified-report', experience.applicability, 1);
  const terms = query.toLowerCase().split(/[^\p{L}\p{N}_-]+/u).filter(Boolean);
  const ranked = records.map(({ priority, ...row }) => ({ ...row, relevance: priority + terms.reduce((n, term) => n + (JSON.stringify(row).toLowerCase().includes(term) ? 4 : 0), 0) }))
    .filter(r => !['superseded', 'rejected', 'invalidated'].includes(r.freshness))
    .sort((a, b) => b.relevance - a.relevance || a.id.localeCompare(b.id));
  const selected = [];
  for (const row of ranked) if (encode([...selected, row]).length <= budget) selected.push(row);
  const used = encode(selected).length;
  redacted(selected);
  return { status: 'ok', schema_version: 1, executed: false, records: selected,
    budget: { unit: 'bytes', limit: budget, used, omitted: ranked.length - selected.length },
    knowledge_freshness: knowledge.status,
    note: 'Derived references only; ranking uses metadata, not full document semantics. Budget covers serialized records, not model tokens. Read canonical sections; freshness is not factual verification or permission.' };
}

export function handoffReport(root, id, { budget: limit } = {}) {
  ready(root); const budget = memoryBudget(limit), context = taskContextReport(root, id);
  const checkpoint = stat(safe(root, checkpointPath(id))) ? resumePlan(root, id) : null;
  const pointers = [...new Set([...(context.pointers ?? []), '.notth/local.md', '.notth/decisions.json', ...(context.configured ? [context.path] : [])])]
    .filter(name => stat(safe(root, name))).map(name => memoryReference(root, name));
  const report = { status: context.status === 'blocked' || checkpoint?.status === 'blocked' || checkpoint?.revalidate_required || checkpoint?.blockers.length || checkpoint?.operations_to_reconcile.length ? 'blocked' : 'planned',
    schema_version: 1, change_id: id, executed: false, intent: context.intent ?? null,
    contract: 'notth-project-handoff-v1', authority: 'guidance-only', pointers,
    // Requirements/constraints/decisions stay canonical; links locate their actual source sections.
    accepted_scope: context.links?.filter(link => ['requirement', 'decision'].includes(link.kind)) ?? [],
    sources: context.sources ?? [], checkpoint,
    required_capabilities: ['project-read', 'conditional-project-write', 'verify-current-revision', 'inspect-side-effects-before-retry'],
    host_capabilities: 'UNVERIFIED', synchronization: 'Caller must provide the same authorized synchronized project artifacts; missing state is not recoverable from another provider chat.',
    next_action: !context.configured ? context.next_action : checkpoint?.operations_to_reconcile.length
      ? 'Inspect actual operation outcomes before retrying; reconcile baseline and evidence.'
      : context.status === 'blocked' || checkpoint?.revalidate_required ? 'Reconcile changed sources and affected verification before dependent work.' : checkpoint?.next_action ?? context.next_action };
  redacted(report);
  if (encode(report).length <= budget) return { ...report, budget_bytes: budget, complete: true };
  return { status: 'blocked', schema_version: 1, change_id: id, executed: false, contract: report.contract, complete: false,
    budget_bytes: budget, required_bytes: encode(report).length,
    pointers: [contextPath(id), checkpointPath(id)],
    next_action: 'Handoff exceeds budget. Load canonical context/checkpoint in bounded sections; intent, constraints and evidence have not been silently summarized away.' };
}
