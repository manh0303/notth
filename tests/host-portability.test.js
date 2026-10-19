import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { SOURCE, install, check, loadLock } from '../cli/harness.js';
const read = (r,p) => fs.readFileSync(path.join(r,p),'utf8');
function write(r,p,s) { fs.mkdirSync(path.dirname(path.join(r,p)),{recursive:true}); fs.writeFileSync(path.join(r,p),s); }
function project(t) { const r=fs.mkdtempSync(path.join(os.tmpdir(),'aih-hosts-')); t.after(()=>fs.rmSync(r,{recursive:true,force:true})); return r; }
function snapshot(r) { const out={}; function walk(d,p='') { for(const e of fs.readdirSync(d,{withFileTypes:true})) { const n=p+e.name; if(e.isDirectory())walk(path.join(d,e.name),n+'/'); else out[n]=fs.readFileSync(path.join(d,e.name)).toString('base64'); } } walk(r); return out; }
for (const host of ['kiro','claude-code','codex','cursor','copilot','gemini-cli','opencode','windsurf']) {
 test(host + ': installs only the selected bridge and preserves user configuration',t=>{
  const root=project(t);
  for(const p of ['AGENTS.md','CLAUDE.md','GEMINI.md','.github/copilot-instructions.md']) write(root,p,'# Team instructions\r\nPreserve me.\r\n');
  const userFiles=['.claude/settings.json','.opencode/commands/custom.md','.cursor/rules/custom.mdc','.windsurfrules','.agents/skills/team/SKILL.md'];
  for(const p of userFiles) write(root,p,'team-owned');
  const r=spawnSync(process.execPath,[path.join(SOURCE,'bin/aih.js'),'init','--host',host],{cwd:root,encoding:'utf8'}); assert.equal(r.status,0,r.stdout+r.stderr);
  assert.equal(check(root).status,'ok');
  const lock=loadLock(root);
  assert.equal(Object.hasOwn(lock.files,'CLAUDE.md'),host==='claude-code');
  assert.equal(Object.hasOwn(lock.files,'GEMINI.md'),host==='gemini-cli');
  assert.equal(Object.hasOwn(lock.files,'.github/copilot-instructions.md'),host==='copilot');
  assert.equal(Object.hasOwn(lock.files,'.kiro/hooks/harness-session.json'),host==='kiro');
  for(const p of ['AGENTS.md','CLAUDE.md','GEMINI.md','.github/copilot-instructions.md']) assert.ok(read(root,p).startsWith('# Team instructions\r\nPreserve me.\r\n'));
  if(host==='claude-code') assert.match(read(root,'.claude/skills/harness-start/SKILL.md'),/\.agents\/skills\/harness-start\/SKILL.md/);
  if(host==='kiro') { assert.match(read(root,'.kiro/skills/harness-start/SKILL.md'),/\.agents\/skills\/harness-start\/SKILL.md/); assert.equal(JSON.parse(read(root,'.kiro/hooks/harness-session.json')).hooks[0].action.type,'agent'); }
  assert.equal(JSON.parse(read(root,'.notth/agents.json')).provider,host==='claude-code'?'anthropic':'host');
  for(const p of userFiles) assert.equal(read(root,p),'team-owned');
  const before=snapshot(root); assert.equal(install(root,SOURCE,{command:'update'}).changes.length,0); assert.deepEqual(snapshot(root),before);
 });
}
test('changing tool preserves project state, old Kiro bridge and dry-run bytes',t=>{
 const root=project(t); install(root,SOURCE,{host:'kiro'});
 write(root,'.notth/local.md','# Verified project facts\n'); write(root,'.notth/start.json','{"schema_version":1,"goal":"change","task":"Keep active task"}');
 const before=snapshot(root); const plan=install(root,SOURCE,{command:'update',host:'gemini-cli',dryRun:true}); assert.ok(plan.changes.some(c=>c.path==='GEMINI.md')); assert.deepEqual(snapshot(root),before);
 install(root,SOURCE,{command:'update',host:'gemini-cli'});
 for(const p of ['.notth/local.md','.notth/start.json','.notth/agents.json','.kiro/hooks/harness-session.json']) assert.equal(snapshot(root)[p],before[p]);
 write(root,'GEMINI.md',read(root,'GEMINI.md')+'\nNew team guidance\n'); install(root,SOURCE,{command:'update'}); assert.match(read(root,'GEMINI.md'),/New team guidance/); assert.equal(check(root).status,'ok');
});
test('managed bridge edits, malformed markers, skill collisions and invalid lists fail before writes',t=>{
 const root=project(t); install(root,SOURCE,{host:'gemini-cli'});
 write(root,'GEMINI.md',read(root,'GEMINI.md').replace('@./AGENTS.md','@./other.md')); const before=snapshot(root); assert.equal(check(root).status,'error'); assert.throws(()=>install(root,SOURCE,{command:'update'}),/Managed files changed/); assert.deepEqual(snapshot(root),before);
 for(const host of ['kiro,codex','kiro,,codex','kiro,kiro','../unsafe',42]) {
  const r=project(t);
  assert.throws(()=>install(r,SOURCE,{host}),/host ID/); assert.deepEqual(snapshot(r),{});
 }
 const other=project(t); write(other,'.github/copilot-instructions.md','<!-- ai-harness:start -->\nIncomplete'); const original=snapshot(other); assert.throws(()=>install(other,SOURCE,{host:'copilot'}),/markers/); assert.deepEqual(snapshot(other),original);
 const collision=project(t); write(collision,'.claude/skills/harness-start/SKILL.md','user skill'); const prior=snapshot(collision); assert.throws(()=>install(collision,SOURCE,{host:'claude-code'}),/collision/); assert.deepEqual(snapshot(collision),prior);
});
test('bridge writes roll back to original user text after a late write failure',t=>{
 const root=project(t); write(root,'GEMINI.md','# User Gemini\n'); write(root,'.github/copilot-instructions.md','# User Copilot\n'); const before=snapshot(root);
 assert.throws(()=>install(root,SOURCE,{host:'gemini-cli',writer:(filename,data)=>{ if(filename.endsWith('lock.json'))throw Error('injected failure'); fs.mkdirSync(path.dirname(filename),{recursive:true}); fs.writeFileSync(filename,data); }}),/injected failure/);
 assert.deepEqual(snapshot(root),before);
});
