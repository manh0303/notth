import { taskContextReport } from './task-context.js';
import { statusReport } from './status.js';
import { knowledgeReport, localContext } from './knowledge.js';
import { projectDecisionReport } from './project-decisions.js';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { createInterface } from 'node:readline/promises';
import { safe, stat, encode, SLUG, HarnessError } from './files.js';
import { check, loadLock, guard, transaction, atomicWrite } from './harness.js';
import { setupPlan } from './environment.js';
import { loadArtifactContract, emptyArtifacts } from './artifacts.js';
import { START_CONFIG, GOALS, loadStartConfig } from './start-config.js';
import { configArchive, backupName } from './portable-config.js';
import { resumePlan } from './checkpoint.js';

function assert(ok, message) { if (!ok) throw new HarnessError(message); }
export function compactStart(root, host) {
  assert(check(root).status === 'ok', 'Fix installation drift before start');
  const lock = loadLock(root), saved = loadStartConfig(root), local = localContext(root), orientation = statusReport(root);
  return { status: orientation.status === 'blocked' ? 'blocked' : 'planned', version: lock.version, adapters: lock.adapters, capabilities: lock.capabilities ?? [],
    task: saved?.task ?? null, change: saved?.change_id ?? null, stack: local.value?.stack ?? null,
    context: { structured: local.structured, freshness: 'unchecked' },
    entry_action: host === 'kiro' ? '/harness-start' : 'Read .agents/skills/harness-start/SKILL.md',
    next_action: saved ? orientation.next_action : 'Inspect the user request and applicable project instructions; select task depth and ask only missing consequential questions.',
    progress: orientation.progress,
    task_context: orientation.task_context,
    note: 'Orientation only; no source scan, MCP probe, interview or task execution. Check freshness with seed --check.' };
}
export function startPlan(root, host) {
  assert(check(root).status === 'ok', 'Fix installation drift before start');
  const lock = loadLock(root), saved = loadStartConfig(root), contract = loadArtifactContract(root);
  const evidence = ['README.md', 'docs', 'requirements', 'pom.xml', 'package.json', 'build.gradle', 'pyproject.toml']
    .filter(name => { const p = path.join(root, name), info = stat(p); if (info?.isDirectory()) safe(root, name + '/.start-probe'); else safe(root, name); return Boolean(info); });
  const base = path.join(root, 'openspec/changes'), checkpoints = [];
  if (stat(base)) {
    safe(root, 'openspec/changes/.start-probe');
    for (const id of fs.readdirSync(base).sort().slice(0, 100)) {
      if (id !== 'archive' && SLUG.test(id) && stat(safe(root, 'openspec/changes/' + id + '/checkpoint.json'))) checkpoints.push(id);
    }
  }
  const recommendation = saved?.goal ?? (checkpoints.length ? 'resume' : contract.artifacts.mode === 'document-driven' ? 'docs'
    : evidence.some(p => ['pom.xml', 'package.json', 'build.gradle', 'pyproject.toml'].includes(p)) ? 'change' : 'idea');
  const taskContext = taskContextReport(root);
  const goal = saved?.goal;
  const workflow = goal === 'idea' ? 'solution-framing.md' : 'continuous-development.md';
  const setup = setupPlan(root, lock.adapters, process.env, host);
  let resume = null;
  if (goal === 'resume') {
    try { resume = resumePlan(root, saved.change_id); }
    catch (error) { if (!(error instanceof HarnessError)) throw error; resume = { status: 'blocked', executed: false, message: error.message, next_action: 'Restore/reconcile checkpoints and evidence before continuation, or choose a new task.' }; }
  }
  return { status: resume?.status === 'blocked' || taskContext.status === 'blocked' ? 'blocked' : 'planned', saved, discovery: { evidence, checkpoints, inputs: Object.keys(contract.artifacts.inputs), outputs: Object.keys(contract.artifacts.outputs) },
    knowledge: knowledgeReport(root),
    task_context: taskContext,
    project_decisions: projectDecisionReport(root),
    recommendation, reason: saved ? 'Reuse the saved task; choose a new goal explicitly to start another task.'
      : checkpoints.length ? 'Checkpoint candidates exist; inspect freshness before continuing.'
      : 'Based on declared sources and root build-file presence; the host must inspect their contents.',
    questions: [ ...(!saved ? [{ id: 'goal', question: 'Start from an idea, existing docs, change existing code, or resume?', options: GOALS, recommendation }] : []),
      ...(!Object.keys(contract.artifacts.inputs).length && goal !== 'resume' ? [{ id: 'input', question: 'Use which requirement path or credential-free HTTPS URL? Leave unknowns for the AI discussion.', options: ['repository', 'external', 'idea'], recommendation: evidence.includes('docs') ? 'repository' : 'idea' }] : []),
      ...(!Object.keys(contract.artifacts.outputs).length && ['idea','docs'].includes(goal) ? [{ id: 'output', question: 'Where should draft docs be written?', options: ['docs/product', 'existing destination', 'discuss with AI'], recommendation: 'docs/product' }] : []) ],
    suggested_roles: goal === 'idea' ? ['product:business-analyst', 'architecture:solution-architect']
      : goal === 'docs' ? ['core:planner', 'core:implementer', 'core:reviewer'] : ['core:implementer', 'core:reviewer'],
    agent_routes: setup.agent_configuration.roles.filter(role => (goal === 'idea' ? ['product:business-analyst', 'architecture:solution-architect'] : goal === 'docs' ? ['core:planner', 'core:implementer', 'core:reviewer'] : ['core:implementer', 'core:reviewer']).includes(role.canonical_id)),
    installed_modules: { adapters: lock.adapters, capabilities: lock.capabilities ?? [] },
    setup_questions: setup.questions, environment: setup.environment,
    resume,
    configuration: { directory: '.harness/', task: START_CONFIG, inputs_outputs: '.harness/artifacts.json', models_agents: '.harness/agents.json',
      backup: 'aih backup', restore: 'aih restore --from <project-relative-backup.json>', transfer: 'aih restore --from <backup.json> --transfer' },
    host_prompt: (Object.hasOwn(lock.files, '.agents/skills/harness-start/SKILL.md') ? 'Read .agents/skills/harness-start/SKILL.md and follow its session onboarding procedure. ' : '') + 'Read AGENTS.md, .harness/start.json if present, .harness/local.md, .harness/decisions.json if present and .harness/core/workflows/project-setup.md. '
      + 'Inspect declared input/output locations and current code. Reuse saved answers; ask only missing consequential decisions with options and a grounded recommendation. '
      + 'Use .harness/core/workflows/' + workflow + '. Discover only relevant installed agents/skills; suggest missing modules before editing project.json. '
      + 'Keep model defaults unless requested; save accepted source/output/connection choices in their project-owned configs. '
      + 'For each task apply .harness/core/workflows/session-continuity.md automatically; pin the change in this session and use context --change <id>. Do not let a saved task from another session switch your scope. '
      + 'For resumed tasks inspect checkpoint freshness and side effects. Implement accepted scope with actual verification and maintain affected docs.',
    next_steps: [host === 'kiro' ? 'In Kiro select /harness-start; complete the interview in the current AI session. This CLI plan never asks terminal questions for --host kiro.' : 'In a terminal start interviews and saves answers; without a TTY it prints this plan. Use --goal/--task to save non-interactively.',
      'Open this project in your AI tool and send host_prompt; CLI does not launch a model or read remote document contents.',
      'Use backup and copy its file outside the repository; see the configuration backup guide.'] };
}
export function saveStart(root, { goal, task, changeId, input, output, host } = {}) {
  assert(GOALS.includes(goal), 'Choose --goal idea|docs|change|resume');
  assert(typeof task === 'string' && task.trim().length > 0 && task.length <= 4096 && !/[\x00-\x1f\x7f]/.test(task), 'Supply a nonempty single-line --task (max 4096 characters)');
  assert(changeId === undefined ? goal !== 'resume' : ['change', 'resume'].includes(goal) && SLUG.test(changeId) && changeId !== 'archive', 'Use --change with change or resume and an existing change ID');
  return guard(root, () => {
    const plan = startPlan(root, host), contract = loadArtifactContract(root);
    if (goal === 'change' && changeId !== undefined) assert(Boolean(stat(safe(root, 'openspec/changes/' + changeId + '/proposal.md'))), 'Change requires an existing proposal.md');
    if (goal === 'resume') {
      assert(plan.discovery.checkpoints.includes(changeId), 'Resume requires an existing checkpoint; restore project changes/evidence first');
      resumePlan(root, changeId); // Validate checkpoint/evidence before saving any configuration.
    }
    assert(goal !== 'resume' || (input === undefined && output === undefined), 'Resume reuses source/output contracts; do not combine with --input/--output');
    const changes = {}, value = { schema_version: 1, goal, task: task.trim(), ...(changeId ? { change_id: changeId } : {}) };
    changes[START_CONFIG] = encode(value);
    if (input !== undefined || output !== undefined) {
      const artifacts = structuredClone(contract.artifacts);
      if (!contract.configured) Object.assign(artifacts, emptyArtifacts(), { mode: input ? 'document-driven' : goal === 'docs' ? 'document-driven' : 'idea-driven' });
      if (input !== undefined) {
        assert(!Object.keys(artifacts.inputs).length, 'Inputs already configured; review artifacts.json instead of replacing them through start');
        assert(typeof input === 'string' && input.trim().length > 0, 'Input cannot be empty');
        artifacts.inputs.requirements = { kind: 'requirements', location: input.startsWith('https://') ? { url: input } : { path: input }, write_policy: 'read-only' };
      }
      if (output !== undefined) {
        assert(!Object.keys(artifacts.outputs).length, 'Outputs already configured; review artifacts.json instead of replacing them through start');
        artifacts.outputs.documents = { kind: 'docs', location: { path: output }, capability: 'product', write_policy: 'propose', sources: Object.keys(artifacts.inputs) };
      }
      // Reuse the existing contract validator in a temporary workspace, before touching the target.
      validateProposed(root, artifacts);
      changes['.harness/artifacts.json'] = encode(artifacts);
    }
    for (const [name, bytes] of Object.entries(changes)) if (stat(safe(root, name)) && fs.readFileSync(safe(root, name)).equals(bytes)) delete changes[name];
    const replacing = Object.keys(changes).some(name => stat(safe(root, name)));
    let backup = null;
    if (replacing) { backup = backupName(); assert(!stat(safe(root, backup)), 'Backup collision'); changes[backup] = encode(configArchive(root)); }
    transaction(root, changes, (filename, data) => atomicWrite(filename, data, filename === (backup ? safe(root, backup) : null) ? 0o600 : 0o644));
    const next = startPlan(root, host);
    return { ...next, status: next.status === 'blocked' ? 'blocked' : 'ok', changes: Object.keys(changes), backup };
  });
}
function validateProposed(root, artifacts) {
  // Validate cross-file references with existing integrations and validate target paths through the canonical loader.
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'aih-start-'));
  try {
    fs.mkdirSync(path.join(temp, '.harness'));
    fs.writeFileSync(path.join(temp, '.harness/artifacts.json'), encode(artifacts));
    fs.writeFileSync(path.join(temp, '.harness/integrations.json'), encode(loadArtifactContract(root).integrations));
    loadArtifactContract(temp);
    for (const group of ['inputs', 'outputs']) for (const item of Object.values(artifacts[group])) {
      const name = item.location.path;
      if (name) safe(root, name + (group === 'outputs' || stat(path.join(root, name))?.isDirectory() ? '/.artifact-probe' : ''));
    }
  } finally { fs.rmSync(temp, { recursive: true, force: true }); }
}

export async function guidedStart(root, { host, ask } = {}) {
  const plan = startPlan(root, host);
  let rl;
  if (!ask) { rl = createInterface({ input: process.stdin, output: process.stdout }); ask = q => rl.question(q); }
  try {
    let goal = plan.saved?.goal;
    if (plan.saved) {
      const answer = (await ask('Saved task: ' + plan.saved.task + '\n1. Continue (recommended)  2. New task\nChoice [1]: ')).trim();
      assert(['', '1', '2'].includes(answer), 'Choose 1 or 2');
      if (answer !== '2') return plan;
      goal = undefined;
    }
    if (!goal) {
      const choice = (await ask('Goal: 1. Idea  2. Existing docs  3. Change code  4. Resume\nSuggested: ' + plan.recommendation + '\nChoice [Enter uses suggestion]: ')).trim();
      goal = choice ? GOALS[Number(choice) - 1] : plan.recommendation;
      assert(GOALS.includes(goal), 'Choose 1, 2, 3 or 4');
    }
    const changeId = goal === 'resume' ? (await ask('Checkpoint ID (' + plan.discovery.checkpoints.join(', ') + '): ')).trim() : undefined;
    const task = (await ask('What should the AI do? ')).trim();
    let input, output;
    if (!plan.discovery.inputs.length && goal !== 'resume') input = (await ask('Requirements: relative path or HTTPS URL (Enter: discuss idea/unknown sources with AI): ')).trim() || undefined;
    if (!plan.discovery.outputs.length && ['idea', 'docs'].includes(goal)) output = (await ask('Draft docs folder [docs/product; type - to discuss with AI]: ')).trim() || 'docs/product';
    if (output === '-') output = undefined;
    return saveStart(root, { goal, task, changeId, input, output, host });
  } finally { rl?.close(); }
}

export function clearStart(root) {
  return guard(root, () => {
    assert(check(root).status === 'ok', 'Fix installation drift before clearing the task');
    if (!stat(safe(root, START_CONFIG))) return { status: 'ok', changes: [], backup: null, executed: false };
    const backup = backupName(); assert(!stat(safe(root, backup)), 'Backup collision');
    const changes = { [backup]: encode(configArchive(root)), [START_CONFIG]: null };
    transaction(root, changes, (filename, data) => atomicWrite(filename, data, 0o600));
    return { status: 'ok', changes: Object.keys(changes), backup, executed: false,
      note: 'Cleared saved intake only after backup. Changes, checkpoints, evidence, documents and processes are unchanged.' };
  });
}
