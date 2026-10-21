import { bindSession, recoverSession, compactionPlan, recordCompaction } from '../core/runtime/session.js';
import { memoryReport, handoffReport } from './memory.js';
import { activationReport } from './activation.js';
import { SESSION_HOSTS } from './session-hooks.js';
import { taskContextReport, saveTaskContext } from './task-context.js';
import { importSource, sourceReport, checkSource } from './sources.js';
import { statusReport, changesReport } from './status.js';
import { seed } from './knowledge.js';
import { syncIntegrations } from './sync-integrations.js';
import { renderResult } from './presentation.js';
import { startPlan, saveStart, guidedStart, compactStart, clearStart } from './start.js';
import { setupProject } from './setup.js';
import { projectDecisionReport } from './project-decisions.js';
import { backupConfig, restoreConfig } from './portable-config.js';
import { listAdapters, detect, verify, evaluate } from './adapters.js';
import { listCapabilities, skillCatalog, readSkill } from './capabilities.js';
import { resolveModules } from './composition.js';
import { parseArgs } from 'node:util';
import { ready } from './readiness.js';
import { workflowReport } from './workflow.js';
import { resumePlan } from './checkpoint.js';
import { agentPlan } from './agents.js';
import { adaptiveVerification } from './verification.js';
import { reviewVerification } from './verification-report.js';
import { artifactReport } from './artifacts.js';
import { SOURCE, readJson, targetRoot, install, check, doctor, newChange, changeSidecars, newDoc, loadLock, saveCheckpoint } from './harness.js';
import path from 'node:path';

const HELP = `aih — install reusable AI development rules into a project

Usage: aih <command> [options]
  list                 List available adapters and capabilities
  checkpoint <id>      Save a validated --report handoff; replace with --expected digest
  compact <id>         Build a loss-checked durable capsule; --record persists before native compaction
  session <id>         Pin native session identity with --host/--change and conditional --expected
  recover              Resolve --session/--host or an explicit --change without shared intake guesses
  resume <id>          Inspect checkpoint freshness and side effects before continuation
  agents               Show installed agent contracts and declared model/skill routing
  skills               List installed skill names/descriptions without full content
  skill <name>         Load one installed skill on demand
  detect               Suggest adapters with evidence from target files
  resolve              Validate a module selection and show compatibility warnings
  verify               Plan checks or validate --report evidence (does not execute)
  eval                 Emit evaluation template, or score --report <file>
  init                 Install rules and selected adapters
  update               Apply the installed CLI bundle to the project (no download)
  check                Check Harness file integrity, not application tests
  doctor               Check installation, configured paths and tool presence
  seed                 Plan context loading; --record reconciled hashes or --check freshness
  sync-integrations    Import Kiro MCP aliases only; verify tools in the active host
  change-sidecars <id>  Add missing OpenSpec sidecars without overwriting existing files
  status               Show current task/change and recovery guidance (read-only)
  changes              List local OpenSpec changes and declared task counts (read-only)
  start                Guide intake; reuse saved answers and hand off to your AI host
  backup               Export user configuration (not docs/checkpoints/secrets)
  restore              Restore --from backup; --transfer reuses modules/model preferences
  setup                Suggest questions; --apply scaffolds missing user config only
  decisions            Read shared decisions; --scope module:<name> narrows context
  source-check <id>   Record host freshness --report with raw evidence --input
  memory               Retrieve bounded canonical memory references (--query, --budget)
  handoff <id>         Read a host-neutral task handoff; reconcile before execution
  context              Read task context; --change selects scope; --report saves with --expected
  sources              List preserved sources and verify their content hashes
  import-source <id>   Preserve --input; attach host conversion with --normalized <md>
  activation           Check --host/--session hook configuration and current local event receipts
  artifacts            Show input/output/storage and connection declarations (read-only)
  workflow validate    Validate installed workflow contracts (read-only)
  ready <id>           Check structural change readiness, not approval
  new-change <id>      Create an OpenSpec draft using installed templates
  new-doc <type>       Scaffold a locked capability template (default: product)

Options:
  --session-hooks     init/update: opt in to project-local native hooks for the selected host
  --session <id>      recover/activation/check/doctor: actual native host session identity
  --budget <bytes>    byte limit: compact/recover default 8000; memory/handoff default 8192
  --apply             setup: create missing user configs from the installed snapshot
  --greenfield        setup: select new-project guidance, not an adapter or architecture
  --clear             start: back up and clear saved intake; preserve changes/evidence
  --format <format>   init/update/start/status/changes: human or json (default json)
  --chat              start: read-only chat orientation on every host; no interview
  --compact           start: short read-only orientation; skips terminal intake/source scan
  --record            seed: record hashes after host context reconciliation
  --check             seed: read-only freshness check
  --skill <name>      doctor: check one canonical/project skill prerequisite contract
  --goal <type>       start: idea, docs, change, resume (saves with --task)
  --task <text>       start: task description; --change selects an existing change/resume ID
  --metadata <json>  import-source: source identity, revision and capture scope
  --normalized <md>  import-source: host-converted Markdown for this exact input revision
  --input <path/url>  import-source: local file; start: seed requirements if none declared
  --output <path>     start: draft docs directory; backup: archive path
  --from <file>       restore: project-relative archive file
  --transfer          restore: only modules/agent models; omit old autonomy
  --replace           restore: explicit replacement; automatic before-backup
  --target <directory> Project directory (default: current directory)
  --detect            init only: opt in to detected stack selection
  --stage <type>      ready: workflow stage ID; legacy implement/review stay compatible
  --workflow <id>     ready: opt into full workflow gates and approval records
  --capability <id>   new-doc only: installed template owner (default: product)
  --agent-preset <id> init only: recommended (default), economy, custom; no overwrite
  --link-claude       init/update: opt in to a managed CLAUDE.md import
  --claude-skills     init/update: opt in to canonical .claude/skills wrappers
  --host <id>         kiro,codex,claude-code,gemini-cli,cursor,copilot,opencode,windsurf or custom ID
                      Choose one tool per command
  --scope <type>      verify/eval: adapters (default), capabilities, core, all
  --adaptive          verify: discover a read-only project verification plan
  --expected <sha>    context/checkpoint: observed prior checkpoint digest for replacement
  --report <file>     context/checkpoint: save handoff; eval: score; verify: validate evidence; new-doc techspec: link evidence
  --adapters <a,b>     init/resolve: java-spring,react-nextjs,react-native,ai-python,kubernetes,astro
  --capabilities <a,b> init/resolve: uiux,product,architecture,delivery,devops,monetization
  --source <directory> init/update/list/detect/resolve: trusted alternate bundle directory
  --dry-run           init/update/setup --apply/import-source: preview without persistent changes
  --allow-major       init/update: acknowledge a major version migration
  -h, --help          Show help
  -v, --version       Show installed CLI version

All hosts: init --host <host> → first AI chat: invoke/read harness-start.
Kiro exposes /harness-start; other clients can read .agents/skills/harness-start/SKILL.md.
User settings: .notth/; backup exports only documented user files.
Restore config before init on a fresh project; --transfer excludes old sources/tasks.
The host runs application tests; verify prints plans or validates supplied evidence.
Update a global CLI with npm install -g @manhd_d/notth@latest,
then run aih update --dry-run, aih update, and aih check in the project.

Examples:
  aih init --adapters java-spring --capabilities uiux
  aih init --adapters astro --capabilities product,uiux
  aih init --adapters astro --capabilities monetization
  aih resolve --adapters java-spring,kubernetes --capabilities product,uiux,devops
  aih setup
  aih init --agent-preset economy
  aih init --host kiro
  aih status
  aih changes
  aih start --goal change --change add-order --task "Implement the accepted change"
  aih start --clear
  aih setup --host codex
  aih doctor
  aih ready add-order --stage implement
  aih skills
  aih verify --adaptive
  aih verify --report verification/report.json
  aih new-doc techspec --report verification/report.json
  aih new-doc brd
  aih new-doc idea
  aih new-doc research
  aih new-doc prd-lite
  aih new-doc srs
  aih new-doc use-cases
  aih new-doc mvp
  aih new-doc overview --capability architecture
  aih new-doc delivery-plan --capability delivery
  aih init --adapters java-spring,kubernetes --capabilities product,devops
  aih skill harness-product-brd-generation
  aih skill harness-uiux-figma-design
  aih update --dry-run
  aih new-change add-order
`;

export function main(argv = process.argv.slice(2)) {
  let args;
  try {
    args = parseArgs({ args: argv, allowPositionals: true, strict: true, tokens: true, options: {
      query: { type: 'string' }, 'session-hooks': { type: 'boolean' }, session: { type: 'string' }, budget: { type: 'string' }, metadata: { type: 'string' }, normalized: { type: 'string' }, format: { type: 'string' }, chat: { type: 'boolean' }, clear: { type: 'boolean' }, apply: { type: 'boolean' }, greenfield: { type: 'boolean' }, compact: { type: 'boolean' }, record: { type: 'boolean' }, check: { type: 'boolean' }, skill: { type: 'string' }, goal: { type: 'string' }, task: { type: 'string' }, change: { type: 'string' }, input: { type: 'string' }, output: { type: 'string' }, from: { type: 'string' }, transfer: { type: 'boolean' }, replace: { type: 'boolean' }, target: { type: 'string' }, adapters: { type: 'string' }, capabilities: { type: 'string' }, capability: { type: 'string' }, source: { type: 'string' },
      workflow: { type: 'string' }, 'agent-preset': { type: 'string' }, host: { type: 'string' }, expected: { type: 'string' },
      'link-claude': { type: 'boolean' }, 'claude-skills': { type: 'boolean' }, adaptive: { type: 'boolean' }, detect: { type: 'boolean' }, report: { type: 'string' }, scope: { type: 'string' }, stage: { type: 'string' },
      'dry-run': { type: 'boolean' }, 'allow-major': { type: 'boolean' },
      help: { type: 'boolean', short: 'h' }, version: { type: 'boolean', short: 'v' },
    } });
    const seen = new Set();
    for (const token of args.tokens.filter(t => t.kind === 'option')) {
      if (seen.has(token.name)) throw new Error(`Duplicate option: --${token.name}`);
      seen.add(token.name);
    }
    if (args.values.help || !argv.length) { console.log(HELP); return 0; }
    if (args.values.version) { console.log(readJson(path.join(SOURCE, 'package.json')).version); return 0; }
    const [command, name, ...extra] = args.positionals;
    if (!['activation', 'memory', 'handoff', 'compact', 'session', 'recover', 'context', 'source-check', 'sources', 'import-source', 'status', 'changes', 'workflow', 'decisions', 'seed', 'sync-integrations', 'change-sidecars', 'start', 'backup', 'restore', 'init', 'update', 'check', 'doctor', 'new-change', 'new-doc', 'list', 'detect', 'resolve', 'verify', 'eval', 'skills', 'skill', 'setup', 'ready', 'artifacts', 'agents', 'checkpoint', 'resume'].includes(command)) throw new Error(`Unknown command: ${command}`);
    if (extra.length || (!['handoff', 'compact', 'session', 'source-check', 'import-source', 'workflow', 'change-sidecars', 'new-change', 'new-doc', 'skill', 'ready', 'checkpoint', 'resume'].includes(command) && name !== undefined) || (['handoff', 'compact', 'session', 'source-check', 'import-source', 'workflow', 'change-sidecars', 'new-change', 'new-doc', 'skill', 'ready', 'checkpoint', 'resume'].includes(command) && name === undefined)) throw new Error('Unexpected or missing positional argument; run aih --help');
    const allowed = new Set(['target', ...(['init', 'update'].includes(command) ? ['source', 'dry-run', 'allow-major'] : []), ...(['init', 'resolve'].includes(command) ? ['adapters', 'capabilities'] : []), ...(command === 'init' ? ['detect'] : []), ...(['list', 'detect', 'resolve'].includes(command) ? ['source'] : []), ...(command === 'eval' ? ['report'] : []), ...(command === 'ready' ? ['stage'] : []), ...(['verify', 'eval'].includes(command) ? ['scope'] : [])]);
    if (['init','update','start','status','changes'].includes(command)) allowed.add('format');
    if (args.values.format !== undefined && !['human','json'].includes(args.values.format)) throw new Error('--format must be human or json');
    if (['activation', 'check', 'doctor'].includes(command)) for (const key of ['host', 'session']) allowed.add(key);
    if (command === 'activation' && !args.values.host) throw new Error('activation requires --host');
    if (['check', 'doctor'].includes(command) && args.values.session !== undefined && !args.values.host) throw new Error('--session requires --host');
    if (command === 'memory') for (const key of ['change', 'query', 'budget']) allowed.add(key);
    if (command === 'handoff') allowed.add('budget');
    if (command === 'source-check') { for (const key of ['report', 'input', 'dry-run']) allowed.add(key); if (!args.values.report || !args.values.input) throw new Error('source-check requires --report and --input'); }
    if (command === 'compact') { allowed.add('record'); allowed.add('budget'); }
    if (command === 'session') { for (const key of ['host', 'change', 'expected']) allowed.add(key); if (!args.values.host || !args.values.change) throw new Error('session requires --host and --change'); }
    if (command === 'recover') { for (const key of ['host','session','change','budget']) allowed.add(key); }
    if (command === 'context') {
      for (const key of ['change', 'report', 'expected']) allowed.add(key);
      if (args.values.report && !args.values.change) throw new Error('context --report requires --change');
      if (args.values.expected !== undefined && !args.values.report) throw new Error('context --expected requires --report');
    }
    if (command === 'import-source') { for (const key of ['input', 'normalized', 'metadata', 'dry-run']) allowed.add(key); if (!args.values.input) throw new Error('import-source requires --input'); }
    if (command === 'workflow' && name !== 'validate') throw new Error('Usage: aih workflow validate');
    if (command === 'ready') allowed.add('workflow');
    if (command === 'seed') { allowed.add('record'); allowed.add('check'); if (args.values.record && args.values.check) throw new Error('Choose --record or --check'); }
    if (command === 'doctor') allowed.add('skill');
    if (command === 'sync-integrations') { for (const key of ['host','from','dry-run']) allowed.add(key); }
    if (command === 'start') {
      for (const key of ['goal','task','change','input','output','host','compact','clear','chat']) allowed.add(key);
      if (args.values.clear && ['goal','task','change','input','output','compact','host','chat'].some(k => args.values[k] !== undefined)) throw new Error('--clear cannot be combined with intake options');
      if (args.values.chat && ['goal','task','change','input','output','compact','clear'].some(k => args.values[k] !== undefined)) throw new Error('--chat is read-only and cannot be combined with intake options');
      if (args.values.compact && ['goal','task','change','input','output'].some(k => args.values[k] !== undefined)) throw new Error('--compact cannot save intake answers');
    }
    if (command === 'decisions') allowed.add('scope');
    if (command === 'setup') {
      for (const key of ['apply','greenfield','dry-run']) allowed.add(key);
      if (args.values['dry-run'] && !args.values.apply) throw new Error('setup --dry-run requires --apply');
    }
    if (command === 'backup') allowed.add('output');
    if (command === 'restore') { for (const key of ['from','transfer','replace','dry-run']) allowed.add(key); if (!args.values.from) throw new Error('restore requires --from'); }
    if (command === 'start' && !args.values.goal && ['task','change','input','output'].some(key => args.values[key] !== undefined)) throw new Error('start saving options require --goal');
    if (command === 'checkpoint') { allowed.add('report'); allowed.add('expected'); if (!args.values.report) throw new Error('checkpoint requires --report'); }
    if (command === 'new-doc') { allowed.add('capability'); allowed.add('report'); }
    if (command === 'verify') { allowed.add('adaptive'); allowed.add('report'); }
    if (args.values.adaptive && args.values.report) throw new Error('Choose --adaptive or --report');
    if (args.values.scope && (args.values.adaptive || (command === 'verify' && args.values.report))) throw new Error('--scope applies only to advisory checks');
    if (command === 'init') allowed.add('agent-preset');
    if (['setup','agents','init','update'].includes(command)) allowed.add('host');
    if (['init','update'].includes(command)) { allowed.add('session-hooks'); allowed.add('link-claude'); allowed.add('claude-skills'); }
    for (const key of Object.keys(args.values)) if (!allowed.has(key)) throw new Error(`--${key} is not supported for ${command}`);
    if (args.values.detect && args.values.adapters !== undefined) throw new Error('Choose either --detect or --adapters');
    for (const key of ['goal', 'task', 'change', 'input', 'output', 'from', 'target', 'source', 'adapters', 'capabilities', 'capability', 'report', 'agent-preset', 'host']) if (args.values[key] !== undefined && !args.values[key].trim()) throw new Error(`--${key} cannot be empty`);
  } catch (error) { console.error(JSON.stringify({ status: 'error', message: error.message })); return 2; }
  try {
    const { values, positionals: [command, name] } = args;
    const root = targetRoot(values.target ?? process.cwd());
    const print = result => console.log(values.format === 'human' ? renderResult(command, result, values) : JSON.stringify(result, null, 2));
    let result;
    if (command === 'activation') result = activationReport(root, { host: values.host, sessionId: values.session });
    else if (command === 'compact') result = values.record ? recordCompaction(root, name, { budget: values.budget === undefined ? undefined : Number(values.budget) }) : compactionPlan(root, name, { budget: values.budget === undefined ? undefined : Number(values.budget) });
    else if (command === 'session') result = bindSession(root, { host: values.host, sessionId: name, changeId: values.change, expected: values.expected });
    else if (command === 'recover') result = recoverSession(root, { host: values.host, sessionId: values.session, changeId: values.change, budget: values.budget === undefined ? undefined : Number(values.budget) });
    else if (command === 'memory') result = memoryReport(root, { changeId: values.change, query: values.query, budget: values.budget });
    else if (command === 'handoff') result = handoffReport(root, name, { budget: values.budget });
    else if (command === 'source-check') result = checkSource(root, name, { report: values.report, input: values.input, dryRun: values['dry-run'] });
    else if (command === 'context') result = values.report ? saveTaskContext(root, values.change, values.report, values.expected) : taskContextReport(root, values.change);
    else if (command === 'sources') result = sourceReport(root);
    else if (command === 'import-source') result = importSource(root, name, { input: values.input, normalized: values.normalized, metadataFile: values.metadata, dryRun: values['dry-run'] });
    else if (command === 'status') result = statusReport(root);
    else if (command === 'changes') result = changesReport(root);
    else if (command === 'workflow') {
      if (check(root).status !== 'ok') throw new Error('Fix installation drift before reading workflows');
      result = workflowReport(path.join(root, '.notth'), loadLock(root).capabilities ?? []);
    } else if (command === 'start') {
      if (values.clear) { print(clearStart(root)); return 0; }
      if (!values.chat && !values.compact && !values.goal && values.host !== 'kiro' && process.stdin.isTTY && process.stdout.isTTY) return guidedStart(root, { host: values.host }).then(value => { print(value); return value.status === 'blocked' ? 1 : 0; }).catch(error => { console.error(JSON.stringify({ status: 'error', message: error.message })); return 1; });
      result = (values.chat || values.compact) ? compactStart(root, values.host) : values.goal ? saveStart(root, { goal: values.goal, task: values.task, changeId: values.change, input: values.input, output: values.output, host: values.host }) : startPlan(root, values.host);
    } else if (command === 'setup') result = setupProject(root, { apply: values.apply, dryRun: values['dry-run'], greenfield: values.greenfield, host: values.host });
    else if (command === 'decisions') { if (check(root).status !== 'ok') throw new Error('Fix installation drift before reading decisions'); result = projectDecisionReport(root, values.scope); }
    else if (command === 'seed') result = seed(root, { record: values.record, checkOnly: values.check });
    else if (command === 'sync-integrations') result = syncIntegrations(root, { host: values.host, from: values.from, dryRun: values['dry-run'] });
    else if (command === 'change-sidecars') result = changeSidecars(root, name);
    else if (command === 'backup') result = backupConfig(root, values.output);
    else if (command === 'restore') result = restoreConfig(root, values.from, { dryRun: values['dry-run'], transfer: values.transfer, replace: values.replace });
    else if (command === 'init' || command === 'update') {
      const source = targetRoot(values.source ?? SOURCE);
      const selection = values.detect ? detect(root, source).adapters : undefined;
      if (values.detect && !selection.length) throw new Error('No stack detected; choose --adapters explicitly or omit --detect for core only');
      result = install(root, source, {
        command, adapters: selection ?? (values.adapters === undefined ? undefined : values.adapters.split(',').map(v => v.trim())),
        sessionHooks: values['session-hooks'], agentPreset: values['agent-preset'], host: values.host, linkClaude: values['link-claude'], claudeSkills: values['claude-skills'],
        capabilities: values.capabilities === undefined ? undefined : values.capabilities.split(',').map(v => v.trim()),
        dryRun: values['dry-run'], allowMajor: values['allow-major'],
      });
    } else if (command === 'list') { const source = targetRoot(values.source ?? SOURCE); result = { ...listAdapters(source), capabilities: listCapabilities(source) }; }
    else if (command === 'skills' || command === 'skill') {
      const state = check(root);
      if (state.status !== 'ok') throw new Error(`Fix installation drift before loading skills: ${state.problems.join(', ')}`);
      const lock = loadLock(root);
      result = command === 'skills' ? skillCatalog(root, lock) : readSkill(root, lock, name);
    }
    else if (command === 'resolve') result = resolveModules(targetRoot(values.source ?? SOURCE), {
      adapters: values.adapters === undefined ? [] : values.adapters.split(',').map(x => x.trim()),
      capabilities: values.capabilities === undefined ? [] : values.capabilities.split(',').map(x => x.trim()),
    });
    else if (command === 'detect') result = detect(root, targetRoot(values.source ?? SOURCE));
    else if (command === 'verify') {
      if (values.adaptive || values.report) { if (check(root).status !== 'ok') throw new Error('Fix installation drift before verification'); }
      result = values.report ? reviewVerification(root, values.report) : values.adaptive ? adaptiveVerification(root, SOURCE) : verify(root, values.scope ?? 'adapters');
    }
    else if (command === 'eval') result = evaluate(root, values.report, values.scope ?? 'adapters');
    else if (command === 'checkpoint') result = saveCheckpoint(root, name, values.report, values.expected);
    else if (command === 'resume') { if (check(root).status !== 'ok') throw new Error('Fix installation drift before resume'); result = resumePlan(root, name); }
    else if (command === 'agents') { if (check(root).status !== 'ok') throw new Error('Fix installation drift before reading agents'); result = agentPlan(root, values.host); }
    else if (command === 'artifacts') {
      if (check(root).status !== 'ok') throw new Error('Fix installation drift before reading artifact declarations');
      result = artifactReport(root);
    }
    else if (command === 'ready') {
      const state = check(root);
      if (state.status !== 'ok') throw new Error('Fix installation drift before setup/readiness checks');
      result = ready(root, name, values.stage ?? 'implement', values.workflow);
    }
    else if (command === 'new-change') result = newChange(root, name);
    else if (command === 'new-doc') result = newDoc(root, name, values.capability ?? 'product', { report: values.report });
    else result = command === 'doctor' ? doctor(root, values.skill) : check(root);
    if (command === 'init' || command === 'update') result.next_steps = values['dry-run']
      ? ['Review the proposed changes, then repeat without --dry-run.']
      : [values.host === 'kiro' ? 'Open this project in Kiro. In your first chat select /harness-start; the agent asks only missing questions and saves context.' : 'Open this project in your AI tool. In your first chat invoke harness-start, or ask it to read .agents/skills/harness-start/SKILL.md and describe your task; the agent asks only missing questions and saves context.',
         'Review local.md/environment.json and artifacts.json/integrations.json; record input/output/storage/ownership, keep credentials in the host and personal paths in ignored machine.json.',
         'Run doctor and review/commit shared configuration and snapshot. Use backup; copy its file outside the repo. See docs/configuration-backup.md.'];
    if (command === 'new-change') result.next_steps = [
      'Resolve consequential ambiguity with the user and record answers/sources in decisions.json.',
      'When artifact outputs are configured, record create/update/unchanged impact and source-write policy in artifact-impact.json.',
      'Fill the change documents, then run aih ready ' + name + ' --stage implement.',
      'After implementation, record actual verification evidence and run aih ready ' + name + ' --stage review.'];
    if (command === 'new-doc') result.next_steps = ['Populate the draft from authorized sources; clarify missing decisions before implementation.'];
    if (['init','update'].includes(command) && !values['dry-run']) {
      const installed = loadLock(root);
      result.onboarding = { adapters: installed.adapters, capabilities: installed.capabilities ?? [],
        prompt: 'Read .agents/skills/harness-start/SKILL.md and use Notth for this task: [your task].' };
    }
    if (['check', 'doctor'].includes(command) && values.host) {
      result.activation = activationReport(root, { host: values.host, sessionId: values.session });
      if (result.status === 'ok' && result.activation.status !== 'ok') result.status = 'blocked';
    }
    if (['init', 'update'].includes(command) && values.host && !values['dry-run']) result.activation = SESSION_HOSTS.includes(values.host)
      ? activationReport(root, { host: values.host }) : { status: 'blocked', activation: 'unsupported-host', persistence: 'unverified' };
    print(result);
    return ['error', 'fail', 'blocked'].includes(result.status) ? 1 : 0;
  } catch (error) { console.error(JSON.stringify({ status: 'error', message: error.message })); return 1; }
}
