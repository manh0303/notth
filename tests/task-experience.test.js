import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { install, SOURCE, newChange, saveCheckpoint, digest, check } from '../cli/harness.js';
import { statusReport } from '../cli/status.js';
import { saveStart } from '../cli/start.js';
const write=(r,p,s)=>{fs.mkdirSync(path.dirname(path.join(r,p)),{recursive:true});fs.writeFileSync(path.join(r,p),typeof s==='string'?s:JSON.stringify(s));};
function root(t,options) { const r=fs.mkdtempSync(path.join(os.tmpdir(),'notth-experience-'));t.after(()=>fs.rmSync(r,{recursive:true,force:true}));if(options)install(r,SOURCE,options);return r; }
function run(r,args,code=0) { const result=spawnSync(process.execPath,[path.join(SOURCE,'bin/aih.js'),...args],{cwd:r,encoding:'utf8',timeout:30000});assert.equal(result.status,code,result.stdout+result.stderr);return result; }
const bytes=(r,p)=>fs.readFileSync(path.join(r,p),'utf8');
test('readable install summarizes modules; default JSON remains parseable and includes changes',t=>{
 const r=root(t);const out=run(r,['init','--host','codex','--capabilities','uiux','--format','human']).stdout;
 assert.match(out,/Capabilities: uiux/);assert.match(out,/project documents are created only/);assert.doesNotMatch(out,/"changes":/);
 assert.equal(check(r).status,'ok');
 const json=JSON.parse(run(r,['update']).stdout);assert.ok(Array.isArray(json.changes));assert.equal(json.onboarding.capabilities[0],'uiux');
 assert.match(run(r,['update','--dry-run','--format','human']).stdout,/Review the proposed changes/);
});
test('all host chat entry paths are read-only and next action is not the entry invocation',t=>{
 for(const host of ['kiro','codex','claude-code','copilot','gemini-cli','cursor','windsurf','opencode']) {
  const r=root(t,{host});const lock=bytes(r,'.notth/lock.json');
  const plan=JSON.parse(run(r,['start','--chat','--host',host]).stdout);
  assert.ok(plan.entry_action);assert.notEqual(plan.next_action,plan.entry_action);assert.equal(plan.context.freshness,'unchecked');
  assert.equal(fs.existsSync(path.join(r,'.notth/start.json')),false);assert.equal(lock,bytes(r,'.notth/lock.json'));
  assert.doesNotMatch(run(r,['start','--chat','--host',host,'--format','human']).stdout,/Goal: 1\./);
 }
});
test('invalid presentation/chat options reject before mutation',t=>{
 const r=root(t,{host:'codex'});saveStart(r,{goal:'change',task:'Preserve task'});const before=bytes(r,'.notth/start.json');
 for(const args of [['start','--chat','--goal','change','--task','Replace'],['start','--chat','--compact'],['start','--chat','--clear'],['init','--format','xml'],['check','--format','human']])run(r,args,2);
 assert.equal(bytes(r,'.notth/start.json'),before);
 const out=run(r,['start','--clear','--format','human']);assert.match(out.stdout,/Backup:/);assert.equal(fs.existsSync(path.join(r,'.notth/start.json')),false);
});
test('status gives candidate work without claiming checked tasks are verified or delivered',t=>{
 const r=root(t,{host:'codex'});newChange(r,'export');write(r,'openspec/changes/export/tasks.md','- [x] Implement\n- [ ] Exercise permission boundary\n');saveStart(r,{goal:'change',task:'Export',changeId:'export'});
 const status=statusReport(r);assert.match(status.next_action,/Exercise permission boundary/);assert.equal(status.progress.phase,'unknown');assert.equal(status.progress.deployment,'unknown');
 write(r,'openspec/changes/export/tasks.md','- [x] Implement\n- [x] Exercise permission boundary\n');
 assert.match(statusReport(r).next_action,/actual verification evidence/);
 assert.match(run(r,['status','--format','human']).stdout,/not verification evidence/);
 assert.match(run(r,['changes','--format','human']).stdout,/export: 0 pending declarations/);
});
test('recovery prioritizes blockers and uncertain operations, then stale baseline, and preserves evidence checks',t=>{
 const r=root(t,{host:'codex'});newChange(r,'feature');write(r,'code.txt','before');write(r,'result.txt','observed');
 const row={schema_version:1,change_id:'feature',phase:'verify',summary:'Verification',timestamp:'2026-10-16T00:00:00Z',baseline:[{path:'code.txt',sha256:digest(Buffer.from('before'))}],completed:[{id:'a',summary:'Observed',evidence:[{path:'result.txt',sha256:digest(Buffer.from('observed'))}]}],pending:[],in_progress:null,blockers:[],next_action:'Review',external_sources:[],operations:[]};
 write(r,'report.json',row);saveCheckpoint(r,'feature','report.json');saveStart(r,{goal:'resume',task:'Continue',changeId:'feature'});
 write(r,'code.txt','after');assert.match(statusReport(r).next_action,/changed baseline/);
 row.operations=[{id:'deploy-staging',action:'deploy',target:'staging',status:'unknown',evidence:[]}];write(r,'openspec/changes/feature/checkpoint.json',row);
 assert.match(statusReport(r).next_action,/actual remote state/);
 row.blockers=['Need staging access'];write(r,'openspec/changes/feature/checkpoint.json',row);assert.equal(statusReport(r).status,'blocked');assert.match(statusReport(r).next_action,/staging access/);
 write(r,'result.txt','tampered');assert.equal(statusReport(r).status,'blocked');assert.match(statusReport(r).next_action,/reconciliation/);
 assert.equal(JSON.parse(run(r,['start','--chat'],1).stdout).status,'blocked');
});
test('consumer update installs canonical workflow and neutral UI route while preserving custom context',t=>{
 const r=root(t,{host:'codex',capabilities:['uiux']});write(r,'.notth/local.md','# Project facts\nKeep these');
 const before=bytes(r,'.notth/local.md');const preview=install(r,SOURCE,{command:'update',dryRun:true});assert.equal(preview.changes.length,0);
 install(r,SOURCE,{command:'update'});assert.equal(bytes(r,'.notth/local.md'),before);assert.equal(check(r).status,'ok');
 assert.ok(fs.existsSync(path.join(r,'.notth/core/workflows/task-experience.md')));
 assert.ok(fs.existsSync(path.join(r,'.notth/capabilities/uiux/workflows/design-delivery.md')));
 assert.ok(fs.existsSync(path.join(r,'.agents/skills/harness-uiux-figma-design/SKILL.md')));
 const bare=root(t,{host:'codex'});assert.equal(fs.existsSync(path.join(bare,'.notth/capabilities/uiux')),false);
});

test('chat mode bypasses the interview when both streams are terminals',t=>{
 const r=root(t,{host:'codex'});
 const script=`Object.defineProperty(process.stdin,'isTTY',{value:true}); Object.defineProperty(process.stdout,'isTTY',{value:true}); const {main}=await import(${JSON.stringify(new URL('../cli/main.js',import.meta.url).href)}); process.exitCode=await main(['start','--chat','--host','codex']);`;
 const result=spawnSync(process.execPath,['--input-type=module','-e',script],{cwd:r,encoding:'utf8',timeout:10000});
 assert.equal(result.status,0,result.stderr);assert.equal(JSON.parse(result.stdout).status,'planned');
 assert.equal(fs.existsSync(path.join(r,'.notth/start.json')),false);
});
