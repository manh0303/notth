import fs from 'node:fs';
import { isDeepStrictEqual } from 'node:util';
import { safe, stat, encode, isObject, HarnessError } from './files.js';
import { SESSION_HOSTS } from '../core/runtime/session.js';
export { SESSION_HOSTS } from '../core/runtime/session.js';

const BOOTSTRAP = "(async()=>{const tag='notth-session-runtime-v1',fs=require('node:fs'),p=require('node:path'),u=require('node:url');let r=process.cwd();for(let i=0;i<20;i++){if(fs.existsSync(p.join(r,'.notth/lock.json'))){const m=await import(u.pathToFileURL(p.join(r,'.notth/core/runtime/hook.js')).href);console.log(JSON.stringify(await m.runHook(process.argv[1],r)));return}const n=p.dirname(r);if(n===r)break;r=n}throw Error('NOTTH root missing')})().catch(()=>{process.stderr.write('NOTTH lifecycle recovery blocked');process.exitCode=1})";
const KIRO_BOOTSTRAP = BOOTSTRAP.replace('console.log(JSON.stringify(await m.runHook(process.argv[1],r)));', "const o=await m.runHook(process.argv[1],r);console.log(typeof o==='string'?o:JSON.stringify(o));");
export const KIRO_CONTINUITY_HOOK = '.kiro/hooks/notth-continuity.json';
const EVENTS = {
  codex: ['SessionStart', 'UserPromptSubmit', 'PreToolUse', 'PostToolUse', 'PreCompact', 'Stop'],
  'claude-code': ['SessionStart', 'UserPromptSubmit', 'PreToolUse', 'PostToolUse', 'PreCompact', 'Stop'],
  kiro: ['SessionStart', 'PromptSubmit', 'PreToolUse', 'AgentStop', 'PostToolUse'],
  cursor: ['sessionStart', 'beforeSubmitPrompt', 'postToolUse', 'preCompact', 'stop'],
  'gemini-cli': ['SessionStart', 'BeforeAgent', 'BeforeTool', 'AfterTool', 'PreCompress', 'AfterAgent'],
  copilot: ['sessionStart', 'userPromptSubmitted', 'preToolUse', 'postToolUse', 'preCompact', 'agentStop'],
  opencode: ['chat.message', 'tool.execute.before', 'tool.execute.after'],
  windsurf: ['pre_user_prompt', 'pre_read_code', 'pre_write_code', 'pre_run_command', 'pre_mcp_tool_use', 'post_mcp_tool_use', 'post_cascade_response'],
};
export const activationEvents = host => host === 'cursor' ? ['UserPromptSubmit', 'PostToolUse'] : ['UserPromptSubmit', 'PreToolUse', 'PostToolUse'];
const MODERN_BOOTSTRAP = KIRO_BOOTSTRAP.replace('runHook(process.argv[1],r)', 'runHook(process.argv[1],r,undefined,process.argv[2])');
export const OPENCODE_PLUGIN = String.raw`// notth-session-runtime-v1 — project-local, dependency-free OpenCode v1 plugin.
import { pathToFileURL } from 'node:url';
import path from 'node:path';
export const NotthContinuity = async ({ directory }) => {
  const { runHook } = await import(pathToFileURL(path.join(directory, '.notth/core/runtime/hook.js')).href);
  const invoke = (event, sessionID) => runHook('opencode', directory, { hook_event_name: event, session_id: sessionID, cwd: directory });
  return {
    'chat.message': async (input) => { await invoke('UserPromptSubmit', input.sessionID); },
    'tool.execute.before': async (input) => { await invoke('PreToolUse', input.sessionID); },
    'tool.execute.after': async (input, output) => {
      const context = await invoke('PostToolUse', input.sessionID);
      if (typeof output.output !== 'string') throw Error('NOTTH requires an OpenCode v1 tool output');
      output.output += '\n\n' + context;
    },
    'experimental.chat.system.transform': async (input, output) => {
      if (input.sessionID) output.system.push(await invoke('ContextRefresh', input.sessionID));
    },
  };
};
`;
function settings(root, name) {
  const filename = safe(root, name), info = stat(filename);
  if (!info) return null;
  if (!info.isFile() || info.size > 1024 * 1024) throw new HarnessError('Host settings exceed size limit');
  try {
    const value = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(fs.readFileSync(filename)));
    if (!isObject(value)) throw new Error('object required');
    return value;
  }
  catch { throw new HarnessError('Invalid host hook settings JSON'); }
}
export function sessionHookPath(root, host) {
  const paths = { codex: '.codex/hooks.json', 'claude-code': '.claude/settings.local.json', kiro: KIRO_CONTINUITY_HOOK,
    cursor: '.cursor/hooks.json', 'gemini-cli': '.gemini/settings.json', copilot: '.github/hooks/notth-continuity.json',
    opencode: '.opencode/plugins/notth-continuity.js', windsurf: '.windsurf/hooks.json' };
  if (!SESSION_HOSTS.includes(host)) throw new HarnessError('Unsupported native session host');
  if (host === 'windsurf') {
    const devin = settings(root, '.devin/hooks.json');
    if (isObject(devin?.hooks) && Object.keys(devin.hooks).length) return '.devin/hooks.json';
  }
  return paths[host];
}
export function sessionHookChanges(root, host) {
  const name = sessionHookPath(root, host);
  if (host === 'opencode') {
    const filename = safe(root, name), info = stat(filename);
    if (!info) return { [name]: Buffer.from(OPENCODE_PLUGIN) };
    if (info.size > 1024 * 1024 || fs.readFileSync(filename, 'utf8') !== OPENCODE_PLUGIN) throw new HarnessError('Existing NOTTH lifecycle hook differs; reconcile before enabling');
    return {};
  }
  const command = 'node -e "' + (host === 'kiro' ? KIRO_BOOTSTRAP : BOOTSTRAP) + '" ' + host;
  let value = settings(root, name);
  if (host === 'kiro') {
    const hooks = EVENTS.kiro.map(trigger => ({ name: 'NOTTH context ' + trigger, trigger, timeout: 10, action: { type: 'command', command } }));
    const next = { version: 'v1', hooks }, legacy = { version: 'v1', hooks: hooks.filter(h => h.trigger !== 'PostToolUse') };
    if (value && !isDeepStrictEqual(value, next) && !isDeepStrictEqual(value, legacy)) throw new HarnessError('Existing NOTTH lifecycle hook differs; reconcile before enabling');
    return isDeepStrictEqual(value, next) ? {} : { [name]: encode(next) };
  }
  value ??= {};
  if (!isObject(value) || value.hooks !== undefined && !isObject(value.hooks)) throw new HarnessError('Invalid host hook settings');
  if (value.enabled === false || value.disableAllHooks === true || value.hooks?.enabled === false || value.tools?.enableHooks === false) throw new HarnessError('Host hooks are explicitly disabled; review host settings');
  const flat = ['cursor', 'copilot', 'windsurf'].includes(host);
  if (['cursor', 'copilot'].includes(host) && value.version !== undefined && value.version !== 1) throw new HarnessError('Unsupported host hooks version');
  const hooks = structuredClone(value.hooks ?? {});
  for (const event of EVENTS[host]) {
    const eventCommand = ['codex', 'claude-code'].includes(host) ? command : 'node -e "' + MODERN_BOOTSTRAP + '" ' + host + ' ' + event;
    const handler = host === 'cursor' ? { command: eventCommand, timeout: 10 }
      : host === 'windsurf' ? { command: eventCommand, powershell: eventCommand, show_output: false }
      : host === 'copilot' ? { type: 'command', bash: eventCommand, powershell: eventCommand, timeoutSec: 10 }
      : { type: 'command', command: eventCommand, timeout: host === 'gemini-cli' ? 10000 : 10,
          ...(host === 'gemini-cli' ? { name: 'notth-continuity-' + event } : {}) };
    if (host === 'gemini-cli' && Array.isArray(hooks.disabled) && [handler.name, handler.command].some(id => hooks.disabled.includes(id))) throw new HarnessError('NOTTH hook is explicitly disabled');
    const groups = hooks[event] ?? [];
    if (!Array.isArray(groups)) throw new HarnessError('Invalid lifecycle hook groups');
    let present = false;
    for (const group of groups) {
      if (!isObject(group) || !flat && !Array.isArray(group.hooks)) throw new HarnessError('Invalid lifecycle hook handlers');
      for (const item of flat ? [group] : group.hooks) {
        if (!isObject(item)) throw new HarnessError('Invalid lifecycle hook handler');
        if ([item.command, item.bash, item.powershell].some(cmd => typeof cmd === 'string' && cmd.includes('notth-session-runtime-v1'))) {
          if (present || !isDeepStrictEqual(item, handler) || group.enabled === false || group.disabled === true || !flat && group.matcher !== '') throw new HarnessError('Existing NOTTH lifecycle hook differs; reconcile before enabling');
          present = true;
        }
      }
    }
    if (!present) groups.push(flat ? handler : { matcher: '', hooks: [handler] });
    hooks[event] = groups;
  }
  const next = { ...value, ...(['cursor', 'copilot'].includes(host) ? { version: 1 } : {}), hooks };
  return isDeepStrictEqual(next, value) ? {} : { [name]: encode(next) };
}
