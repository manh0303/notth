import fs from 'node:fs';
import path from 'node:path';
import { safe, stat, isObject, SLUG, HarnessError } from './files.js';
import { agentPlan } from './agents.js';
import { readConfig } from './project-config.js';
export { readConfig } from './project-config.js';
import { artifactReport } from './artifacts.js';
import { projectDecisionReport } from './project-decisions.js';

export const ENVIRONMENT = '.notth/environment.json';
export const MACHINE = '.notth/machine.json';
export const emptyEnvironment = () => ({ schema_version: 1, tools: {}, files: {}, commands: {} });
const validText = s => typeof s === 'string' && s.trim().length > 0 && !/[\0\r\n]/.test(s);
const own = (o, k) => Object.hasOwn(o, k);
function requireThat(ok, message) { if (!ok) throw new HarnessError(message); }

function keys(value, allowed, label) {
  requireThat(isObject(value) && Object.keys(value).every(k => allowed.includes(k)), 'Invalid fields: ' + label);
}
export function loadEnvironment(root) {
  const shared = readConfig(root, ENVIRONMENT);
  const machine = readConfig(root, MACHINE);
  if (shared === null) {
    requireThat(machine === null, 'Machine configuration requires environment.json');
    return { configured: false, shared: emptyEnvironment(), machine: null };
  }
  keys(shared, ['schema_version', 'tools', 'files', 'commands'], ENVIRONMENT);
  requireThat(shared.schema_version === 1, 'Unsupported environment schema');
  for (const group of ['tools', 'files', 'commands']) {
    requireThat(isObject(shared[group]), 'Missing environment map: ' + group);
    for (const [id, value] of Object.entries(shared[group])) {
      requireThat(SLUG.test(id), 'Invalid environment identifier');
      const label = group + '/' + id;
      if (group === 'commands') {
        keys(value, ['tool', 'args'], label);
        requireThat(validText(value.tool) && own(shared.tools, value.tool), 'Unknown command tool: ' + id);
        requireThat(Array.isArray(value.args) && value.args.every(a => typeof a === 'string' && !/[\0\r\n]/.test(a)), 'Invalid arguments: ' + id);
      } else {
        const field = group === 'tools' ? 'executable' : 'path';
        keys(value, [field, 'required'], label);
        requireThat(validText(value[field]), 'Missing path: ' + label);
        requireThat(value.required === undefined || typeof value.required === 'boolean', 'Invalid required flag: ' + label);
      }
    }
  }
  if (machine !== null) {
    keys(machine, ['schema_version', 'tools', 'files'], MACHINE);
    requireThat(machine.schema_version === 1, 'Unsupported machine schema');
    for (const group of ['tools', 'files']) {
      if (machine[group] === undefined) continue;
      requireThat(isObject(machine[group]), 'Invalid machine map: ' + group);
      const field = group === 'tools' ? 'executable' : 'path';
      for (const [id, value] of Object.entries(machine[group])) {
        requireThat(SLUG.test(id) && own(shared[group], id), 'Machine override must reference a declared ' + group + ' entry');
        keys(value, [field], 'machine ' + group + '/' + id);
        requireThat(validText(value[field]), 'Invalid machine override: ' + group + '/' + id);
      }
    }
  }
  return { configured: true, shared, machine };
}

function expand(value, env, files = {}) {
  const missing = [];
  const withFiles = value.replace(/\$\{files\.([a-z][a-z0-9]*(?:-[a-z0-9]+)*)\}/g, (_, key) => {
    if (!own(files, key)) { missing.push('files.' + key); return ''; }
    return files[key];
  });
  const resolved = withFiles.replace(/\$\{([A-Za-z_][A-Za-z0-9_]*)\}/g, (_, key) => {
    if (!own(env, key) || !validText(env[key])) { missing.push(key); return ''; }
    return env[key];
  });
  return { resolved, missing: [...new Set(missing)], invalid: /\$\{/.test(resolved) };
}
function pathStatus(value, root, executable, env) {
  if ((process.platform !== 'win32' && /^[A-Za-z]:[\\/]|^\\\\/.test(value)) ||
      (process.platform === 'win32' && value.startsWith('/'))) return 'platform-mismatch';
  if (value.startsWith('~')) return 'unsupported-path'; // No implicit shell expansion.
  const bare = !path.isAbsolute(value) && !/[\\/]/.test(value);
  const candidates = executable && bare
    ? (env.PATH || '').split(path.delimiter).filter(Boolean).filter(path.isAbsolute).map(dir => path.join(dir, value))
    : [path.resolve(root, value)];
  const extensions = executable && process.platform === 'win32' && !path.extname(value)
    ? (env.PATHEXT || '.EXE;.CMD;.BAT').split(';').filter(e => /^\.[A-Za-z0-9]+$/.test(e)) : [''];
  let notExecutable = false;
  for (const candidate of candidates) for (const ext of extensions) {
    try {
      const p = candidate + ext;
      if (!fs.statSync(p).isFile()) continue;
      fs.accessSync(p, executable && process.platform !== 'win32' ? fs.constants.X_OK : fs.constants.F_OK);
      return 'present';
    } catch (e) { if (e.code === 'EACCES') notExecutable = true; }
  }
  return notExecutable ? 'not-accessible' : 'missing';
}

export function environmentReport(root, env = process.env) {
  const { configured, shared, machine } = loadEnvironment(root);
  const entries = [];
  for (const group of ['tools', 'files']) for (const [id, value] of Object.entries(shared[group])) {
    const field = group === 'tools' ? 'executable' : 'path';
    const override = machine?.[group]?.[id];
    const expanded = expand(override ? override[field] : value[field], env);
    entries.push({ group, id, source: override ? 'machine' : 'project', required: value.required !== false,
      status: expanded.missing.length ? 'missing-env' : expanded.invalid ? 'invalid-reference'
        : pathStatus(expanded.resolved, root, group === 'tools', env),
      missing_variables: expanded.missing });
  }
  // Arguments are references only; do not execute or print resolved values.
  const files = Object.fromEntries(Object.entries(shared.files).map(([id, value]) => [id, machine?.files?.[id]?.path ?? value.path]));
  for (const [id, command] of Object.entries(shared.commands)) {
    const args = command.args.map(a => expand(a, env, files));
    const missing = [...new Set(args.flatMap(a => a.missing))];
    entries.push({ group: 'commands', id, source: 'project', required: shared.tools[command.tool].required !== false,
      status: missing.length ? 'missing-env' : args.some(a => a.invalid) ? 'invalid-reference' : 'declared',
      missing_variables: missing });
  }
  const problems = entries.filter(e => e.required && !['present', 'declared'].includes(e.status))
    .map(e => e.group + '/' + e.id + ': ' + e.status);
  return { configured, machine_present: machine !== null, entries, problems,
    note: 'Presence/reference checks only. No commands executed; values and arguments are omitted. Never store credentials here.' };
}

export function setupPlan(root, adapters, env = process.env, host) {
  const environment = environmentReport(root, env);
  const artifacts = artifactReport(root);
  const configuredTools = environment.entries.some(e => e.group === 'tools');
  const questions = [];
  if (adapters.includes('java-spring') && !configuredTools) {
    const wrapper = process.platform === 'win32' ? 'mvnw.cmd' : 'mvnw';
    const hasWrapper = Boolean(stat(safe(root, wrapper)));
    const gradle = ['gradlew', 'gradlew.bat', 'build.gradle', 'build.gradle.kts'].some(p => Boolean(stat(safe(root, p))));
    if (gradle) {
      questions.push({ id: 'build-tool', question: 'Which build tool does this project use?',
        options: [{ label: 'A', value: 'gradle', description: 'Use the existing Gradle setup.' },
          { label: 'B', value: 'maven', description: 'Use Maven only if project conventions require it.' }],
        recommendation: 'A', reason: 'Gradle files exist; confirm the project convention.', allow_free_text: true });
    } else questions.push({ id: 'maven-mode', question: 'How should Maven be invoked?',
      options: [{ label: 'A', value: 'wrapper', description: 'Use the repository Maven Wrapper.' },
        { label: 'B', value: 'path', description: 'Use Maven available on PATH.' },
        { label: 'C', value: 'custom', description: 'Use an internal Maven executable and optional settings file.' }],
      recommendation: hasWrapper ? 'A' : null,
      reason: hasWrapper ? 'A wrapper exists for this OS; review it before execution.' : 'No wrapper found for this OS; ask which Maven the team uses.',
      allow_free_text: true });
  }
  if (!environment.configured || !environment.entries.length) questions.push({
    id: 'project-context', question: 'Where are the authoritative project requirements and conventions?',
    options: [{ label: 'A', value: 'repository', description: 'Use existing repository documentation and build files.' },
      { label: 'B', value: 'external', description: 'Use authorized BA/Confluence sources with revisions.' },
      { label: 'C', value: 'idea', description: 'Start from the user idea and clarify the scope.' }],
    recommendation: null, reason: 'The host must inspect existing local.md and sources before recommending.',
    allow_free_text: true
  }, {
    id: 'project-mode', question: 'What is the scope of the affected code?',
    options: [{ label: 'A', value: 'maintain', description: 'Extend existing modules using their conventions and shared APIs.' },
      { label: 'B', value: 'new', description: 'Start a new application with a minimal agreed adapter baseline.' },
      { label: 'C', value: 'mixed', description: 'Add a new module while preserving repository-wide contracts.' }],
    recommendation: null,
    reason: 'Inspect the task, local.md and neighboring code; stack detection or environment configuration does not establish project mode. Skip if already known.',
    allow_free_text: true
  });
  questions.push(...artifacts.questions);
  return { status: environment.problems.length ? 'blocked' : 'planned', environment, artifacts, questions,
    project_decisions: projectDecisionReport(root),
    agent_configuration: agentPlan(root, host),
    next_steps: ['Read AGENTS.md, .notth/local.md and the installed project-setup workflow.',
      'Apply installed Core project-conventions.md and relevant adapter conventions; establish mode per affected module even when no setup questions are suggested.',
      'Inspect comparable code and search public shared APIs before creating files, dependencies or abstractions; record source paths and reuse/new-code rationale.',
      'Skip answered questions; ask at most 1–3 consequential questions with evidence-based recommendations.',
      'Review agents.json provider/model/reasoning and preset choices; verify access/effort/delegation in the actual host before execution. No automatic premium fallback.',
      'Record shared decisions in local.md/environment.json and input/output/storage/write decisions in artifacts.json/integrations.json; reuse prior answers and host authorization.',
      'Inspect actual host tool availability before using declared connections; never store credentials in project config.',
      'Put only machine paths in ignored machine.json.',
      'Run aih doctor, then use the reviewed project commands through your AI host.'],
    note: 'Read-only host-facing suggestions, not an interactive terminal wizard or approval.' };
}
