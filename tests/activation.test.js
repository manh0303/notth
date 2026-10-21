import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import { install, SOURCE, check } from '../cli/harness.js';
import { runHook } from '../core/runtime/hook.js';
import { activationReport } from '../cli/activation.js';
import { sessionHookPath } from '../cli/session-hooks.js';
import { digest } from '../cli/files.js';

const write = (root, name, value) => { const file = path.join(root, name); fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, typeof value === 'string' ? value : JSON.stringify(value)); };
function project(t, options = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'notth-activation-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  install(root, SOURCE, options); return root;
}
const native = {
  codex: ['UserPromptSubmit', 'PreToolUse', 'PostToolUse'],
  'claude-code': ['UserPromptSubmit', 'PreToolUse', 'PostToolUse'],
  kiro: ['PromptSubmit', 'PreToolUse', 'PostToolUse'],
  cursor: ['beforeSubmitPrompt', 'postToolUse'],
  'gemini-cli': ['BeforeAgent', 'BeforeTool', 'AfterTool'],
  copilot: ['userPromptSubmitted', 'preToolUse', 'postToolUse'],
  windsurf: ['pre_user_prompt', 'pre_mcp_tool_use', 'post_mcp_tool_use'],
};
const identity = (host, root, event) => host === 'cursor'
  ? { hook_event_name: event, conversation_id: 'native-current', workspace_roots: [root], cwd: root }
  : host === 'copilot' ? { sessionId: 'native-current', cwd: root }
  : host === 'windsurf' ? { agent_action_name: event, trajectory_id: 'native-current' }
  : { hook_event_name: event, session_id: 'native-current', cwd: root };

for (const [host, events] of Object.entries(native)) test(host + ': packaged-style command events and session-specific diagnostics', t => {
  const root = project(t, { host, sessionHooks: true });
  const registration = JSON.parse(fs.readFileSync(path.join(root, sessionHookPath(root, host)), 'utf8'));
  if (host === 'cursor') assert.equal(registration.hooks.preToolUse, undefined, 'Memory integration must not decide tool permissions');
  assert.equal(activationReport(root, { host }).activation, 'session-required');
  assert.equal(activationReport(root, { host, sessionId: 'native-current' }).status, 'blocked');
  for (const [index, event] of events.entries()) {
    const group = host === 'kiro' ? registration.hooks.find(h => h.trigger === event) : registration.hooks[event][0];
    const handler = group.action ?? group.hooks?.[0] ?? group;
    const input = { ...identity(host, root, event), prompt: 'do-not-persist-prompt', tool_input: { token: 'do-not-persist-input' }, tool_response: 'do-not-persist-result'.repeat(5000) };
    const result = spawnSync(handler.command ?? handler.bash, { shell: true, cwd: root, input: JSON.stringify(input), encoding: 'utf8', timeout: 10000 });
    assert.equal(result.status, 0, result.stderr);
    if (host === 'cursor' && index === 0) assert.deepEqual(JSON.parse(result.stdout), { continue: true });
    if (index === events.length - 1) {
      if (host === 'kiro') assert.match(result.stdout, /preserve it now/);
      else if (host === 'cursor') assert.match(JSON.parse(result.stdout).additional_context, /preserve it now/);
      else if (host === 'copilot') assert.match(JSON.parse(result.stdout).additionalContext, /preserve it now/);
      else if (host === 'windsurf') assert.deepEqual(JSON.parse(result.stdout), {});
      else assert.match(JSON.parse(result.stdout).hookSpecificOutput.additionalContext, /preserve it now/);
    }
  }
  const report = activationReport(root, { host, sessionId: 'native-current' });
  assert.equal(report.activation, 'observed-local');
  assert.equal(report.status, host === 'windsurf' ? 'blocked' : 'ok');
  assert.equal(report.persistence, 'unverified'); assert.equal(report.live_host, 'unverified');
  assert.equal(activationReport(root, { host, sessionId: 'another-session' }).status, 'blocked');
  assert.equal(activationReport(root, { host, sessionId: 'native-current', now: Date.now() + 16 * 60 * 1000 }).status, 'blocked');
  const folder = path.join(root, '.notth/sessions', digest(Buffer.from(host + '\0native-current')));
  const receiptBytes = fs.readdirSync(folder).map(name => fs.readFileSync(path.join(folder, name), 'utf8')).join();
  assert.doesNotMatch(receiptBytes, /do-not-persist/);
  assert.equal(check(root).status, 'ok');
  assert.deepEqual(install(root, SOURCE, { command: 'update', host, sessionHooks: true }).changes, []);
});

test('OpenCode local plugin injects context without SDK dependencies, transcript reads or remote calls', async t => {
  const root = project(t, { host: 'opencode', sessionHooks: true });
  const pluginPath = path.join(root, sessionHookPath(root, 'opencode'));
  const { NotthContinuity } = await import(pathToFileURL(pluginPath).href);
  const hooks = await NotthContinuity({ directory: root });
  await hooks['chat.message']({ sessionID: 'native-current' });
  await hooks['tool.execute.before']({ sessionID: 'native-current' });
  const output = { output: 'original result' };
  await hooks['tool.execute.after']({ sessionID: 'native-current' }, output);
  assert.ok(output.output.startsWith('original result\n\n'));
  assert.match(output.output, /preserve it now/);
  const system = { system: [] };
  await hooks['experimental.chat.system.transform']({ sessionID: 'native-current' }, system);
  assert.match(system.system[0], /Host-neutral|host-neutral/);
  assert.equal(activationReport(root, { host: 'opencode', sessionId: 'native-current' }).activation, 'observed-local');
  assert.equal(activationReport(root, { host: 'opencode', sessionId: 'native-current' }).persistence, 'unverified');
  await assert.rejects(hooks['chat.message']({}), /identity/);
});

test('native settings merge, disabled handlers, dry-run and partial-write rollback preserve user configuration', t => {
  for (const host of ['cursor', 'gemini-cli', 'copilot', 'windsurf']) {
    const root = project(t), name = sessionHookPath(root, host);
    const original = { ...(host === 'cursor' || host === 'copilot' ? { version: 1 } : {}), custom: 'retained', hooks: { unrelated: [{ command: 'user-command' }] } };
    write(root, name, original);
    install(root, SOURCE, { command: 'update', host, sessionHooks: true, dryRun: true });
    assert.deepEqual(JSON.parse(fs.readFileSync(path.join(root, name))), original);
    assert.throws(() => install(root, SOURCE, { command: 'update', host, sessionHooks: true, writer: () => { throw Error('simulated write failure'); } }), /simulated/);
    assert.deepEqual(JSON.parse(fs.readFileSync(path.join(root, name))), original);
    install(root, SOURCE, { command: 'update', host, sessionHooks: true });
    const merged = JSON.parse(fs.readFileSync(path.join(root, name)));
    assert.equal(merged.custom, original.custom); assert.deepEqual(merged.hooks.unrelated, original.hooks.unrelated);
    assert.ok(fs.readdirSync(path.join(root, '.notth/backups')).some(n => n.startsWith('session-hooks-')));
    merged.disableAllHooks = true; write(root, name, merged);
    assert.equal(activationReport(root, { host, sessionId: 'native-current' }).activation, 'configuration-blocked');
    assert.throws(() => install(root, SOURCE, { command: 'update', host, sessionHooks: true }), /disabled/);
  }
});

test('activation never trusts copied/stale receipts, missing registrations or a post-tool receipt from an older turn', async t => {
  const root = project(t, { host: 'codex', sessionHooks: true });
  const input = event => ({ hook_event_name: event, session_id: 'current', cwd: root });
  for (const event of native.codex) await runHook('codex', root, input(event));
  assert.equal(activationReport(root, { host: 'codex', sessionId: 'current' }).status, 'ok');
  const folder = '.notth/sessions/' + digest(Buffer.from('codex\0current'));
  const post = path.join(root, folder, 'latest-PostToolUse.json');
  const row = JSON.parse(fs.readFileSync(post)); row.timestamp = new Date(Date.now() - 60000).toISOString(); write(root, folder + '/latest-PostToolUse.json', row);
  assert.equal(activationReport(root, { host: 'codex', sessionId: 'current' }).status, 'blocked');
  row.timestamp = new Date().toISOString(); row.bundle_sha256 = '0'.repeat(64); write(root, folder + '/latest-PostToolUse.json', row);
  assert.equal(activationReport(root, { host: 'codex', sessionId: 'current' }).status, 'blocked');
  const copied = project(t, { host: 'codex', sessionHooks: true });
  fs.cpSync(path.join(root, '.notth/sessions'), path.join(copied, '.notth/sessions'), { recursive: true });
  assert.equal(activationReport(copied, { host: 'codex', sessionId: 'current' }).status, 'blocked');
  fs.rmSync(path.join(root, '.codex/hooks.json'));
  assert.equal(activationReport(root, { host: 'codex', sessionId: 'current' }).activation, 'not-configured');
  const cli = spawnSync(process.execPath, [path.join(SOURCE, 'bin/aih.js'), 'activation', '--host', 'codex', '--session', 'current'], { cwd: root, encoding: 'utf8' });
  assert.equal(cli.status, 1); assert.equal(JSON.parse(cli.stdout).configured, false);
  await assert.rejects(runHook('copilot', root, { sessionId: 'current', cwd: root, hook_event_name: 'postToolUse' }, 'preToolUse'), /differs/);
});

test('Windsurf respects modern workspace precedence and never registers transcript capture', t => {
  const root = project(t);
  write(root, '.devin/hooks.json', { hooks: { post_write_code: [{ command: 'user-format' }] } });
  install(root, SOURCE, { command: 'update', host: 'windsurf', sessionHooks: true });
  assert.equal(fs.existsSync(path.join(root, '.windsurf/hooks.json')), false);
  const value = JSON.parse(fs.readFileSync(path.join(root, '.devin/hooks.json')));
  assert.equal(value.hooks.post_write_code[0].command, 'user-format');
  assert.equal(value.hooks.post_cascade_response_with_transcript, undefined);
});
