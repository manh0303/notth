import fs from 'node:fs';
import path from 'node:path';
import { safe, stat, readJson, isObject, SLUG, SOURCE, HarnessError } from './files.js';

export const AGENT_CONFIG = '.notth/agents.json';
export const DEFAULT_AGENTS = 'config/agents.default.json';
export const PRESETS = ['recommended', 'economy', 'custom'];
export const REASONING = ['none', 'minimal', 'low', 'medium', 'high', 'xhigh', 'max', 'ultra'];
const ROLE = /^[a-z][a-z0-9-]*:[a-z][a-z0-9-]*$/;
const text = value => typeof value === 'string' && value.trim() === value && value.length > 0
  && value.length <= 256 && !/[\x00-\x1f\x7f]/.test(value);
const requireThat = (condition, label) => { if (!condition) throw new HarnessError('Invalid agent configuration: ' + label); };
function fields(value, allowed, required, label) {
  requireThat(isObject(value) && Object.keys(value).every(key => allowed.includes(key))
    && required.every(key => Object.hasOwn(value, key)), label + ' fields');
}
function reference(value, label) {
  requireThat(text(value), label + ' must be nonempty single-line text (max 256 characters)');
  if (value.startsWith('@')) requireThat(SLUG.test(value.slice(1)), label + ' alias syntax');
  else requireThat(!/\s/.test(value), label + ' model ID must not contain whitespace');
}
function provider(value, label) { requireThat(typeof value === 'string' && SLUG.test(value), label + ' provider ID'); }
function reasoning(value, label) { requireThat(REASONING.includes(value), label + ' reasoning level'); }

export function resolveModel(config, referenceValue, visited = []) {
  if (!referenceValue.startsWith('@')) return { model: referenceValue, provider: config.provider };
  const alias = referenceValue.slice(1);
  requireThat(Object.hasOwn(config.models, alias), 'unknown alias @' + alias);
  requireThat(!visited.includes(alias), 'cyclic alias @' + alias);
  const descriptor = config.models[alias];
  const next = typeof descriptor === 'string' ? descriptor : descriptor.model;
  const resolved = resolveModel(config, next, [...visited, alias]);
  return { ...resolved, provider: typeof descriptor === 'object' ? descriptor.provider ?? resolved.provider : resolved.provider };
}

export function validateAgentConfig(config) {
  fields(config, ['schema_version', 'provider', 'defaultModel', 'defaultReasoning', 'models', 'agents', 'execution', 'hosts'],
    ['schema_version', 'provider', 'defaultModel', 'defaultReasoning', 'models', 'agents', 'execution'], 'root');
  requireThat(config.schema_version === 1, 'unsupported schema_version');
  provider(config.provider, 'default'); reference(config.defaultModel, 'defaultModel');
  reasoning(config.defaultReasoning, 'default');
  requireThat(isObject(config.models) && Object.keys(config.models).length <= 64, 'models map (max 64 aliases)');
  for (const [alias, descriptor] of Object.entries(config.models)) {
    requireThat(SLUG.test(alias), 'alias ID');
    if (typeof descriptor === 'string') reference(descriptor, 'models.' + alias);
    else {
      fields(descriptor, ['model', 'provider'], ['model'], 'models.' + alias);
      reference(descriptor.model, 'models.' + alias);
      if (descriptor.provider !== undefined) provider(descriptor.provider, 'models.' + alias);
    }
  }
  resolveModel(config, config.defaultModel);
  for (const alias of Object.keys(config.models)) resolveModel(config, '@' + alias);
  requireThat(isObject(config.agents) && Object.keys(config.agents).length <= 128, 'agents map (max 128 roles)');
  for (const [id, agent] of Object.entries(config.agents)) {
    requireThat(ROLE.test(id), 'role ID must use namespace:role');
    fields(agent, ['model', 'provider', 'reasoning', 'enabled', 'extensions'], [], id);
    if (agent.extensions !== undefined) {
      requireThat(Array.isArray(agent.extensions) && agent.extensions.length <= 16 && new Set(agent.extensions).size === agent.extensions.length, id + ' extensions');
      for (const file of agent.extensions) requireThat(typeof file === 'string' && /^[A-Za-z0-9._/-]+[.]md$/.test(file) && !file.startsWith('/') && !file.split('/').some(p => !p || p === '.' || p === '..') && !/^\.notth\/(?:core|adapters|capabilities|templates)\//.test(file), id + ' extension path must be project-owned Markdown');
    }
    if (agent.model !== undefined) { reference(agent.model, id); resolveModel(config, agent.model); }
    if (agent.provider !== undefined) provider(agent.provider, id);
    if (agent.reasoning !== undefined) reasoning(agent.reasoning, id);
    requireThat(agent.enabled === undefined || typeof agent.enabled === 'boolean', id + ' enabled');
  }
  const execution = config.execution;
  fields(execution, ['mode', 'maxConcurrentAgents', 'maxRounds', 'autoEscalateToPremium', 'autonomy', 'budget'],
    ['mode', 'maxConcurrentAgents', 'maxRounds', 'autoEscalateToPremium'], 'execution');
  requireThat(['single-agent', 'hybrid', 'multi-agent'].includes(execution.mode), 'execution mode');
  requireThat(Number.isSafeInteger(execution.maxConcurrentAgents) && execution.maxConcurrentAgents >= 1
    && execution.maxConcurrentAgents <= 32, 'maxConcurrentAgents must be an integer from 1 to 32');
  requireThat(execution.mode !== 'single-agent' || execution.maxConcurrentAgents === 1, 'single-agent requires maxConcurrentAgents=1');
  requireThat(Number.isSafeInteger(execution.maxRounds) && execution.maxRounds >= 1 && execution.maxRounds <= 20,
    'maxRounds must be an integer from 1 to 20');
  requireThat(execution.autoEscalateToPremium === false, 'autoEscalateToPremium must be false; select premium explicitly');
  if (execution.autonomy !== undefined) {
    const a=execution.autonomy;
    fields(a,['mode','actions','repositories'],['mode','actions','repositories'],'autonomy');
    requireThat(['assisted','autopilot'].includes(a.mode),'autonomy mode');
    const allowed=['read','edit','test','commit','push','create-pr','source-write','merge','release','deploy'];
    requireThat(Array.isArray(a.actions)&&new Set(a.actions).size===a.actions.length&&a.actions.every(v=>allowed.includes(v)),'autonomy actions');
    requireThat(Array.isArray(a.repositories)&&new Set(a.repositories).size===a.repositories.length&&a.repositories.every(v=>text(v)&&/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(v)),'autonomy repositories');
    requireThat(a.mode!=='autopilot'||(a.actions.length>0&&a.repositories.length>0),'autopilot needs explicit actions and repository scope');
  }
  if (execution.budget !== undefined) {
    const b=execution.budget;fields(b,['maxTokens','maxCost','currency'],[],'budget');
    requireThat(b.maxTokens===undefined||(Number.isSafeInteger(b.maxTokens)&&b.maxTokens>0),'maxTokens');
    requireThat(b.maxCost===undefined||(Number.isFinite(b.maxCost)&&b.maxCost>=0&&text(b.currency)),'maxCost/currency');
    requireThat(b.maxTokens!==undefined||b.maxCost!==undefined,'budget needs a declared limit');
  }
  const hosts = config.hosts ?? {};
  requireThat(isObject(hosts) && Object.keys(hosts).length <= 16, 'hosts map (max 16 profiles)');
  for (const [id, profile] of Object.entries(hosts)) {
    requireThat(SLUG.test(id), 'host ID'); fields(profile, ['models', 'reasoning'], [], 'host ' + id);
    for (const key of ['models', 'reasoning']) {
      const map = profile[key] ?? {};
      requireThat(isObject(map) && Object.keys(map).length <= 128, 'host ' + id + ' ' + key + ' map');
      for (const [from, to] of Object.entries(map)) {
        requireThat(key === 'models' ? text(from) && from.includes('/') : REASONING.includes(from), 'host mapping key');
        requireThat(text(to) && !to.startsWith('@'), 'host mapping target must be explicit native text');
      }
    }
  }
  return config;
}

function readConfiguration(root, relative) {
  const filename = safe(root, relative), info = stat(filename);
  if (!info) return null;
  requireThat(info.isFile() && info.size <= 1024 * 1024, relative + ' must be a file up to 1 MiB');
  let config;
  try { config = JSON.parse(fs.readFileSync(filename, 'utf8')); }
  catch { throw new HarnessError('Invalid JSON in ' + relative); }
  return validateAgentConfig(config);
}
export function loadAgentConfig(root) {
  const config = readConfiguration(root, AGENT_CONFIG);
  for (const agent of Object.values(config?.agents ?? {})) for (const file of agent.extensions ?? []) safe(root, file);
  return config;
}

export function agentDefaults(source = SOURCE, preset = 'recommended', host) {
  requireThat(PRESETS.includes(preset), 'unknown preset; use recommended, economy or custom');
  // Older alternate bundles remain usable; the packaged CLI supplies the new canonical seed.
  const seed = host === 'claude-code' ? 'config/agents.claude-code.json' : DEFAULT_AGENTS;
  const config = structuredClone(readConfiguration(source, seed) ?? readConfiguration(SOURCE, seed));
  requireThat(config !== null, 'missing canonical default');
  if (preset === 'economy') {
    config.defaultModel = '@economy'; config.defaultReasoning = 'low';
    config.execution.mode = 'single-agent'; config.execution.maxConcurrentAgents = 1;
    for (const agent of Object.values(config.agents)) { agent.model = '@economy'; agent.reasoning = 'low'; }
  }
  return validateAgentConfig(config);
}

export function registeredRoles(source, capabilities = []) {
  const roles = {};
  const folder = path.dirname(safe(source, 'core/agents/.role-index'));
  for (const name of fs.readdirSync(folder).filter(name => name.endsWith('.md')).sort()) {
    roles['core:' + name.slice(0, -3)] = 'core/agents/' + name;
  }
  for (const id of capabilities) {
    const metadata = readJson(safe(source, `capabilities/${id}/capability.json`));
    for (const file of metadata.agents ?? []) {
      const role = id + ':' + path.basename(file, '.md');
      roles[role] = metadata.agent_aliases?.[file] ?? `capabilities/${metadata.asset_owner ?? id}/${file}`;
    }
  }
  return roles;
}

export function resolveAgent(config, id) {
  const agent = Object.hasOwn(config.agents, id) ? config.agents[id] : {};
  const resolved = resolveModel(config, agent.model ?? config.defaultModel);
  return { id, ...resolved, provider: agent.provider ?? resolved.provider,
    extensions: agent.extensions ?? [], reasoning: agent.reasoning ?? config.defaultReasoning, enabled: agent.enabled !== false,
    source: Object.hasOwn(config.agents, id) ? 'role' : 'project-default' };
}

export function agentPlan(root, host) {
  if (host !== undefined) requireThat(typeof host === 'string' && SLUG.test(host), 'host ID');
  const config = loadAgentConfig(root);
  const presets = [{ label: 'A', value: 'recommended', description: 'Keep the host-selected model; hybrid, at most two concurrent agents when supported.' },
    { label: 'B', value: 'economy', description: 'Economy model, single-agent roles.' },
    { label: 'C', value: 'custom', description: 'Edit provider/model/reasoning and role/host mappings explicitly.' }];
  const note = 'Read-only declaration. No provider/model probing, native config writes, agent spawning, permission/concurrency/token enforcement or usage tracking. Autonomy and budget are declarations; verify actual user authorization and host limits. Verify model access, effort and delegation in the actual host before execution.';
  if (!config) return { status: 'not-configured', configured: false, presets, roles: [], note };
  const lock = readJson(safe(root, '.notth/lock.json'));
  const registry = registeredRoles(path.join(root, '.notth'), lock.capabilities ?? []);
  const ids = [...new Set([...Object.keys(registry), ...Object.keys(config.agents)])].sort();
  const profile = config.hosts?.[host] ?? {};
  const roles = ids.map(id => {
    const requested = resolveAgent(config, id);
    const active = requested.enabled && Object.hasOwn(registry, id);
    const mapping = profile.models?.[requested.provider + '/' + requested.model];
    const incompatible = !mapping && ((host === 'claude-code' &&
      (!['host', 'anthropic', 'bedrock', 'vertex'].includes(requested.provider) || requested.model.startsWith('gpt-'))) ||
      (host === 'gemini-cli' && (!['host', 'google', 'vertex'].includes(requested.provider) || requested.model.startsWith('gpt-'))));
    const parts = registry[id]?.split('/');
    const canonical = parts ? (parts[0] === 'core' ? 'core:' : parts[1] + ':') + path.basename(registry[id], '.md') : id;
    const skills = registry[id] ? preferredSkills(fs.readFileSync(safe(path.join(root, '.notth'), registry[id]), 'utf8')) : { required: [], optional: [] };
    const extensionFiles = requested.extensions.map(file => { const info = stat(safe(root,file)); requireThat(!info || info.size <= 65536, 'extension exceeds 64 KiB'); return { path: file, status: info ? 'present' : 'missing' }; });
    return { ...requested, extension_files: extensionFiles, contract_load_order: [registry[id] ? '.notth/' + registry[id] : null, ...requested.extensions].filter(Boolean), active, canonical_id: canonical, skills, contract: registry[id] ? '.notth/' + registry[id] : null,
      host_model: mapping ?? requested.model, host_reasoning: profile.reasoning?.[requested.reasoning] ?? requested.reasoning,
      mapping: mapping ? 'explicit-user-host-mapping' : 'requested',
      availability: active && incompatible ? 'incompatible-provider' : 'unverified',
      runtime_verified: false };
  });
  return { status: roles.some(role => role.active && role.extension_files.some(f => f.status === 'missing')) ? 'blocked' : roles.some(role => role.active && role.availability === 'incompatible-provider') ? 'host-incompatible' : 'requires-host-verification',
    configured: true, host: host ?? null, presets, execution: config.execution, roles,
    missing_mappings: Object.keys(registry).filter(id => !Object.hasOwn(config.agents, id)), note };
}

export function preferredSkills(body) {
  const result={required:[],optional:[]};
  const section=body.split('## Preferred skills')[1]?.split(/\n## /)[0] ?? '';
  for(const line of section.split(/\r?\n/)){
    const kind=line.match(/^- (Required|Optional):/)?.[1]?.toLowerCase();if(!kind)continue;
    result[kind].push(...[...line.matchAll(/harness-[a-z0-9-]+/g)].map(m=>m[0]));
  }
  for(const list of Object.values(result))if(new Set(list).size!==list.length)throw new HarnessError('Duplicate preferred skill');
  return result;
}
export function validatePreferredSkills(body, known) {
  if(!body.includes('## Preferred skills'))throw new HarnessError('Agent missing preferred skill declaration');
  const declared=preferredSkills(body);
  for(const name of [...declared.required,...declared.optional])if(!known.has(name))throw new HarnessError('Unknown preferred skill: '+name);
  return declared;
}
