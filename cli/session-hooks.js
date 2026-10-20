import fs from 'node:fs';
import { isDeepStrictEqual } from 'node:util';
import { safe, stat, encode, isObject, HarnessError } from './files.js';

const BOOTSTRAP = "(async()=>{const tag='notth-session-runtime-v1',fs=require('node:fs'),p=require('node:path'),u=require('node:url');let r=process.cwd();for(let i=0;i<20;i++){if(fs.existsSync(p.join(r,'.notth/lock.json'))){const m=await import(u.pathToFileURL(p.join(r,'.notth/core/runtime/hook.js')).href);console.log(JSON.stringify(await m.runHook(process.argv[1],r)));return}const n=p.dirname(r);if(n===r)break;r=n}throw Error('NOTTH root missing')})().catch(()=>{process.stderr.write('NOTTH lifecycle recovery blocked');process.exitCode=1})";
const KIRO_BOOTSTRAP = BOOTSTRAP.replace('console.log(JSON.stringify(await m.runHook(process.argv[1],r)));', "const o=await m.runHook(process.argv[1],r);console.log(typeof o==='string'?o:JSON.stringify(o));");
export const KIRO_CONTINUITY_HOOK = '.kiro/hooks/notth-continuity.json';
export function sessionHookChanges(root, host) {
  if (!['codex', 'claude-code', 'kiro'].includes(host)) throw new HarnessError('Native command session hooks support codex/claude-code/kiro only');
  const command = 'node -e "' + (host === 'kiro' ? KIRO_BOOTSTRAP : BOOTSTRAP) + '" ' + host;
  if (host === 'kiro') {
    const next = { version: 'v1', hooks: ['SessionStart', 'PromptSubmit', 'PreToolUse', 'AgentStop'].map(trigger => ({ name: 'NOTTH context ' + trigger, trigger, timeout: 10, action: { type: 'command', command } })) };
    const filename = safe(root, KIRO_CONTINUITY_HOOK), info = stat(filename);
    if (info) {
      if (info.size > 1024 * 1024) throw new HarnessError('Host settings exceed size limit');
      let current; try { current = JSON.parse(fs.readFileSync(filename, 'utf8')); } catch { throw new HarnessError('Invalid Kiro continuity JSON'); }
      if (!isDeepStrictEqual(current, next)) throw new HarnessError('Existing NOTTH lifecycle hook differs; reconcile before enabling');
      return {};
    }
    return { [KIRO_CONTINUITY_HOOK]: encode(next) };
  }
  const name = host === 'codex' ? '.codex/hooks.json' : '.claude/settings.local.json';
  const filename = safe(root, name), info = stat(filename);
  if (info && info.size > 1024 * 1024) throw new HarnessError('Host settings exceed size limit');
  let value = {};
  if (info) { try { value = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(fs.readFileSync(filename))); } catch { throw new HarnessError('Invalid host hook settings JSON'); } }
  if (!isObject(value) || value.hooks !== undefined && !isObject(value.hooks)) throw new HarnessError('Invalid host hook settings');
  const hooks = structuredClone(value.hooks ?? {});
  for (const event of ['SessionStart', 'UserPromptSubmit', 'PreToolUse', 'PreCompact', 'Stop']) {
    const groups = hooks[event] ?? [];
    if (!Array.isArray(groups)) throw new HarnessError('Invalid lifecycle hook groups');
    const handler = { type: 'command', command, timeout: 10 };
    let present = false;
    for (const group of groups) {
      if (!isObject(group) || !Array.isArray(group.hooks)) throw new HarnessError('Invalid lifecycle hook handlers');
      for (const item of group.hooks) {
        if (!isObject(item)) throw new HarnessError('Invalid lifecycle hook handler');
        if (typeof item.command === 'string' && item.command.includes('notth-session-runtime-v1')) {
          if (present || !isDeepStrictEqual(item, handler) || group.matcher !== '') throw new HarnessError('Existing NOTTH lifecycle hook differs; reconcile before enabling');
          present = true;
        }
      }
    }
    if (!present) groups.push({ matcher: '', hooks: [handler] });
    hooks[event] = groups;
  }
  const next = { ...value, hooks };
  return isDeepStrictEqual(next, value) ? {} : { [name]: encode(next) };
}
