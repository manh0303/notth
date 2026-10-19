import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { SOURCE, install, check, loadLock, readJson, digest } from '../cli/harness.js';
import { agentDefaults, validateAgentConfig, resolveAgent, loadAgentConfig, registeredRoles, agentPlan } from '../cli/agents.js';

let base, root, source;
beforeEach(() => {
  base = fs.mkdtempSync(path.join(os.tmpdir(), 'aih-routing-'));
  root = path.join(base, 'consumer'); source = path.join(base, 'source');
  fs.mkdirSync(root); fs.mkdirSync(source);
  for (const name of ['core', 'adapters', 'capabilities', 'integrations', 'templates', 'config', 'harness.yaml']) {
    fs.cpSync(path.join(SOURCE, name), path.join(source, name), { recursive: true });
  }
});
afterEach(() => fs.rmSync(base, { recursive: true, force: true }));
function write(name, value, folder = root) {
  const p = path.join(folder, name); fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, typeof value === 'string' ? value : JSON.stringify(value));
}
function snapshot(folder = root, prefix = '') {
  const files = {};
  for (const entry of fs.readdirSync(folder, { withFileTypes: true })) {
    const p = path.join(folder, entry.name), name = prefix + entry.name;
    if (entry.isDirectory()) Object.assign(files, snapshot(p, name + '/'));
    else files[name] = digest(fs.readFileSync(p));
  }
  return files;
}
function cli(args, expected = 0) {
  const r = spawnSync(process.execPath, [path.join(SOURCE, 'bin/aih.js'), ...args], { cwd: root, encoding: 'utf8' });
  assert.equal(r.status, expected, r.stdout + r.stderr); return JSON.parse(r.stdout || r.stderr);
}

test('recommended default covers every namespaced role without activating premium', () => {
  const config = agentDefaults(source);
  const all = registeredRoles(source, readJson(path.join(source, 'harness.yaml')).capabilities);
  assert.deepEqual(Object.keys(config.agents).sort(), Object.keys(all).sort());
  for (const [id, role] of Object.entries(config.agents)) {
    assert.equal(resolveAgent(config, id).model, 'host-default');
    assert.equal(resolveAgent(config, id).provider, 'host');
    assert.ok(['low', 'medium', 'high'].includes(role.reasoning));
  }
  assert.equal(config.agents['core:orchestrator'].reasoning, 'high');
  assert.equal(config.agents['core:implementer'].reasoning, 'medium');
  assert.equal(config.agents['architecture:solution-architect'].reasoning, 'high');
  assert.ok(config.agents['product:project-manager']); assert.ok(config.agents['delivery:project-manager']);
  assert.equal(config.execution.autoEscalateToPremium, false);
});

test('alias descriptors and role overrides preserve provider and reasoning precedence', () => {
  const config = agentDefaults(source);
  config.models.native = { provider: 'anthropic', model: 'claude-model-from-picker' };
  config.models.balanced = '@native';
  config.agents['core:implementer'] = { model: '@balanced', reasoning: 'low' };
  assert.equal(resolveAgent(validateAgentConfig(config), 'core:implementer').provider, 'anthropic');
  config.agents['core:implementer'].provider = 'bedrock';
  assert.equal(resolveAgent(validateAgentConfig(config), 'core:implementer').provider, 'bedrock');
  assert.equal(resolveAgent(config, 'core:implementer').reasoning, 'low');
  assert.equal(resolveAgent(config, 'custom:new-role').source, 'project-default');
  config.models.premium = { provider: 'openai', model: 'gpt-6-astra' };
  config.agents['core:reviewer'].model = '@premium';
  assert.equal(resolveAgent(validateAgentConfig(config), 'core:reviewer').model, 'gpt-6-astra');
  assert.equal(config.execution.autoEscalateToPremium, false, 'Explicit choice is not automatic escalation');
});

test('invalid schema, aliases, execution and unknown fields are refused with understandable errors', () => {
  const mutations = [
    c => c.schema_version = 9, c => c.secret = 'not-supported', c => c.provider = 'OpenAI',
    c => c.defaultModel = '', c => c.defaultModel = 'bad model', c => c.defaultReasoning = 'super-high',
    c => c.models.balanced = '@missing', c => c.models.a = '@a',
    c => { c.models.a = '@b'; c.models.b = '@a'; }, c => c.models = [],
    c => c.agents = [], c => c.agents.implementer = {}, c => c.agents['core:implementer'].enabled = 'yes',
    c => c.agents['core:implementer'].model = '@balanced-typo', c => c.execution.mode = 'turbo',
    c => c.execution.maxConcurrentAgents = 0, c => c.execution.maxConcurrentAgents = 33,
    c => c.execution.maxConcurrentAgents = 1.5, c => c.execution.maxRounds = 0,
    c => c.execution.maxRounds = 21, c => c.execution.autoEscalateToPremium = true,
    c => { c.execution.mode = 'single-agent'; c.execution.maxConcurrentAgents = 2; },
    c => c.hosts = [], c => c.hosts.codex = { model: 'unknown-field' },
    c => c.hosts.codex = { models: { badkey: 'x' } },
    c => c.hosts.codex = { reasoning: { invalid: 'high' } }
  ];
  for (const mutate of mutations) {
    const config = agentDefaults(source); mutate(config);
    assert.throws(() => validateAgentConfig(config), /Invalid agent configuration/);
  }
});

for (const preset of ['recommended', 'economy', 'custom']) test(`init preset ${preset} is non-interactive and config remains project-owned`, () => {
  const before = snapshot();
  cli(['init', '--source', source, '--agent-preset', preset, '--dry-run']); assert.deepEqual(snapshot(), before);
  cli(['init', '--source', source, '--agent-preset', preset]);
  const config = loadAgentConfig(root), lock = loadLock(root);
  assert.equal(config.execution.mode, preset === 'economy' ? 'single-agent' : 'hybrid');
  assert.equal(config.execution.maxConcurrentAgents, preset === 'economy' ? 1 : 2);
  assert.ok(!Object.hasOwn(lock.files, '.notth/agents.json'));
  assert.ok(Object.hasOwn(lock.files, '.notth/templates/agents.default.json'));
  assert.deepEqual(cli(['init', '--source', source]).changes, []);
  const preserved = snapshot();
  cli(['init', '--source', source, '--agent-preset', 'recommended'], 1); assert.deepEqual(snapshot(), preserved);
});

test('invalid existing config and wrong flags fail before any persistent write', () => {
  write('.notth/agents.json', '{"private":"SENSITIVE_TEXT",broken'); const before = snapshot();
  const error = cli(['init', '--source', source], 1);
  assert.match(error.message, /Invalid JSON/); assert.ok(!error.message.includes('SENSITIVE_TEXT'));
  assert.deepEqual(snapshot(), before);
  fs.unlinkSync(path.join(root, '.notth/agents.json'));
  for (const args of [['init', '--source', source, '--agent-preset', 'unknown'], ['init', '--source', source, '--agent-preset', '']]) {
    const prior = snapshot(); cli(args, args.at(-1) === '' ? 2 : 1); assert.deepEqual(snapshot(), prior);
  }
  cli(['init', '--source', source]);
  cli(['update', '--source', source, '--agent-preset', 'economy'], 2); cli(['check', '--host', 'codex'], 2);
});

test('custom providers/roles and exact bytes survive update including native host files', () => {
  install(root, source, { capabilities: ['product', 'architecture', 'delivery'] });
  const config = agentDefaults(source);
  config.agents['product:project-manager'] = { provider: 'anthropic', model: 'claude-selected', reasoning: 'medium' };
  config.agents['delivery:project-manager'] = { provider: 'google', model: 'gemini-selected', reasoning: 'low' };
  config.agents['custom:helper'] = { model: '@economy' };
  const bytes = JSON.stringify(config, null, 4) + '\r\n'; write('.notth/agents.json', bytes);
  write('CLAUDE.md', '@AGENTS.md\nKeep me'); write('.codex/config.toml', 'model = "user-choice"');
  const sourceConfig = agentDefaults(source); sourceConfig.defaultReasoning = 'high'; write('config/agents.default.json', sourceConfig, source);
  const before = snapshot(); install(root, source, { command: 'update', dryRun: true }); assert.deepEqual(snapshot(), before);
  install(root, source, { command: 'update' });
  assert.equal(fs.readFileSync(path.join(root, '.notth/agents.json'), 'utf8'), bytes);
  assert.equal(fs.readFileSync(path.join(root, '.codex/config.toml'), 'utf8'), 'model = "user-choice"');
  assert.equal(check(root).status, 'ok');
  const plan = agentPlan(root, 'codex');
  assert.notEqual(plan.roles.find(r => r.id === 'product:project-manager').model,
    plan.roles.find(r => r.id === 'delivery:project-manager').model);
  assert.equal(plan.roles.find(r => r.id === 'custom:helper').active, false);
});

test('legacy snapshots and older alternate sources seed defaults on update without mutating sources', () => {
  fs.rmSync(path.join(source, 'config'), { recursive: true });
  const fixture = readJson(path.join(SOURCE, 'tests/fixtures/npm-v0.2.0.json'));
  for (const [name, value] of Object.entries(fixture.files)) write(name, value);
  assert.throws(() => check(root), /aih update/);
  const beforeSource = snapshot(source), local = fs.readFileSync(path.join(root, '.harness/local.md'));
  install(root, source, { command: 'update' });
  assert.ok(loadAgentConfig(root)); assert.deepEqual(snapshot(source), beforeSource);
  assert.ok(fs.readFileSync(path.join(root, '.notth/local.md')).equals(local));
  const config = loadAgentConfig(root); delete config.agents['core:reviewer']; write('.notth/agents.json', config);
  assert.ok(agentPlan(root).missing_mappings.includes('core:reviewer'));
  assert.equal(agentPlan(root).roles.find(r => r.id === 'core:reviewer').source, 'project-default');
});

test('setup host plans are read-only, signal incompatible providers and never claim availability', () => {
  install(root, source, { capabilities: ['architecture', 'delivery'] });
  const explicit = loadAgentConfig(root);
  explicit.provider = 'openai'; explicit.defaultModel = 'gpt-6.1-sol';
  explicit.models.balanced = 'gpt-6.1-sol'; explicit.models.economy = 'gpt-6-luna';
  write('.notth/agents.json', explicit);
  const before = snapshot();
  assert.equal(cli(['setup', '--host', 'claude-code']).agent_configuration.status, 'host-incompatible');
  assert.equal(cli(['setup', '--host', 'gemini-cli']).agent_configuration.status, 'host-incompatible');
  const codex = cli(['setup', '--host', 'codex']).agent_configuration;
  assert.ok(codex.roles.every(role => !role.runtime_verified && role.availability === 'unverified'));
  assert.equal(codex.presets.length, 3); assert.deepEqual(snapshot(), before);
  const config = loadAgentConfig(root);
  config.hosts['claude-code'] = { models: { 'openai/gpt-6.1-sol': 'native-claude-model', 'openai/gpt-6-luna': 'native-small-model' },
    reasoning: { high: 'high', medium: 'medium', low: 'low' } };
  write('.notth/agents.json', config); const plan = agentPlan(root, 'claude-code');
  assert.equal(plan.status, 'requires-host-verification');
  assert.equal(plan.roles.find(r => r.id === 'core:implementer').host_model, 'native-claude-model');
  assert.ok(plan.roles.every(role => role.runtime_verified === false));
});

test('symlink and managed-default drift cannot overwrite config or bypass snapshot ownership', () => {
  install(root, source);
  write('.notth/templates/agents.default.json', '{}'); const before = snapshot();
  assert.equal(check(root).status, 'error');
  assert.throws(() => install(root, source, { command: 'update' }), /Managed files changed/); assert.deepEqual(snapshot(), before);
  if (process.platform !== 'win32') {
    fs.unlinkSync(path.join(root, '.notth/agents.json')); write('outside.json', JSON.stringify(agentDefaults(source)));
    fs.symlinkSync(path.join(root, 'outside.json'), path.join(root, '.notth/agents.json'));
    assert.throws(() => loadAgentConfig(root), /Symlink/);
  }
});
