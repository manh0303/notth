import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { SOURCE, install, newChange, check, digest, saveCheckpoint } from '../cli/harness.js';
import { statusReport, changesReport } from '../cli/status.js';
import { saveStart, clearStart } from '../cli/start.js';
import { loadStartConfig } from '../cli/start-config.js';
import { environmentReport } from '../cli/environment.js';
function project(t,options={}) { const r=fs.mkdtempSync(path.join(os.tmpdir(),'aih-reusable-'));t.after(()=>fs.rmSync(r,{recursive:true,force:true}));install(r,SOURCE,options);return r; }
const read=(r,p)=>fs.readFileSync(path.join(r,p),'utf8');
function write(r,p,v) { fs.mkdirSync(path.dirname(path.join(r,p)),{recursive:true});fs.writeFileSync(path.join(r,p),typeof v==='string'?v:JSON.stringify(v)); }
function cli(r,args,code=0) { const s=spawnSync(process.execPath,[path.join(SOURCE,'bin/aih.js'),...args],{cwd:r,encoding:'utf8'});assert.equal(s.status,code,s.stdout+s.stderr);return JSON.parse(s.stdout||s.stderr); }
function snapshot(r) { const out={};function walk(d,p=''){for(const e of fs.readdirSync(d,{withFileTypes:true})){const n=p+e.name;if(e.isDirectory())walk(path.join(d,e.name),n+'/');else out[n]=fs.readFileSync(path.join(d,e.name)).toString('base64');}}walk(r);return out; }
for(const [host,adapters] of [['codex',[]],['kiro',['java-spring']],['claude-code',['react-nextjs']],['opencode',['ai-python']]]) {
 test(host+': same status/change workflow without domain assumptions',t=>{
  const r=project(t,{host,adapters});assert.equal(cli(r,['status']).task,null);assert.deepEqual(cli(r,['changes']).changes,[]);
  newChange(r,'feature');write(r,'openspec/changes/feature/tasks.md','- [x] 1. Implement public behavior\n- [ ] 2. Verify cross-boundary outcome\n```md\n- [ ] ignored example\n```\n- [ ] 3. Review\n');
  const lock=read(r,'.notth/lock.json');const saved=cli(r,['start','--goal','change','--change','feature','--task','Implement accepted scope']);assert.equal(saved.saved.change_id,'feature');
  const before=snapshot(r),status=cli(r,['status']);assert.equal(status.task,'Implement accepted scope');assert.equal(status.change,'feature');assert.equal(status.tasks.checked,1);assert.equal(status.tasks.unchecked,2);assert.equal(status.tasks.first_unchecked,'2. Verify cross-boundary outcome');assert.equal(status.executed,false);assert.deepEqual(snapshot(r),before);
  assert.equal(cli(r,['changes']).changes[0].active,true);assert.equal(read(r,'.notth/lock.json'),lock);
  assert.ok(fs.existsSync(path.join(r,'.notth/templates/knowledge-index.md')));assert.ok(!fs.existsSync(path.join(r,'docs/knowledge')));
  const cleared=cli(r,['start','--clear']);assert.ok(cleared.backup);assert.equal(loadStartConfig(r),null);assert.ok(fs.existsSync(path.join(r,'openspec/changes/feature/tasks.md')));assert.equal(read(r,'.notth/lock.json'),lock);assert.deepEqual(clearStart(r).changes,[]);
 });
}
test('selection rejects missing proposal, unsafe IDs and incompatible flags without changing state',t=>{
 const r=project(t);const before=snapshot(r);
 for(const args of [['start','--goal','change','--change','missing','--task','Work'],['start','--goal','change','--change','../escape','--task','Work'],['start','--goal','idea','--change','feature','--task','Work']])cli(r,args,1);
 for(const args of [['start','--clear','--goal','change'],['status','--clear'],['changes','--host','kiro']])cli(r,args,2);
 assert.deepEqual(snapshot(r),before);
 write(r,'.notth/start.json',{schema_version:1,goal:'change',task:'Keep me'});write(r,'openspec/changes/feature/tasks.md','- [ ] x'.repeat(160000));const prior=read(r,'.notth/start.json');assert.throws(()=>changesReport(r),/1 MiB/);assert.equal(read(r,'.notth/start.json'),prior);
});
test('clear backs up only intake, can be restored, and refuses invalid state',t=>{
 const r=project(t);saveStart(r,{goal:'change',task:'Work'});const body=read(r,'.notth/start.json'),cleared=clearStart(r);
 cli(r,['restore','--from',cleared.backup]);assert.equal(read(r,'.notth/start.json'),body);
 write(r,'.notth/start.json','{}');assert.throws(()=>clearStart(r),/schema/);assert.equal(read(r,'.notth/start.json'),'{}');
});
test('status exposes stale baseline/unknown operations and blocks trusting changed evidence',t=>{
 const r=project(t);newChange(r,'feature');write(r,'code.txt','baseline');write(r,'evidence.txt','observed result');
 const row={schema_version:1,change_id:'feature',phase:'verification',summary:'First group checked',timestamp:'2026-10-15T00:00:00Z',baseline:[{path:'code.txt',sha256:digest(Buffer.from('baseline'))}],completed:[{id:'one',summary:'Observed group',evidence:[{path:'evidence.txt',sha256:digest(Buffer.from('observed result'))}]}],pending:[{id:'two',summary:'Remaining group'}],in_progress:null,blockers:[],next_action:'Inspect remaining group',external_sources:[],operations:[{id:'one',action:'test-write',target:'isolated-fixture',status:'unknown',evidence:[]}]};
 write(r,'report.json',row);saveCheckpoint(r,'feature','report.json');saveStart(r,{goal:'resume',changeId:'feature',task:'Continue'});
 assert.equal(statusReport(r).recovery.operations_to_reconcile.length,1);write(r,'code.txt','changed');assert.equal(statusReport(r).recovery.revalidate_required,true);
 write(r,'evidence.txt','tampered');assert.equal(statusReport(r).status,'blocked');assert.equal(cli(r,['status'],1).status,'blocked');
});
test('file arguments reuse machine overrides/environment without executing or printing private paths',t=>{
 const r=project(t);const file=path.join(r,'private-config.txt');fs.writeFileSync(file,'private');
 write(r,'.notth/environment.json',{schema_version:1,tools:{runner:{executable:process.execPath}},files:{config:{path:'${UNSET_FILE}'}},commands:{test:{tool:'runner',args:['--config=${files.config}']}}});
 write(r,'.notth/machine.json',{schema_version:1,files:{config:{path:file}}});
 const ok=environmentReport(r,{});assert.deepEqual(ok.problems,[]);assert.equal(ok.entries.find(e=>e.group==='commands').status,'declared');assert.ok(!JSON.stringify(ok).includes(file));
 write(r,'.notth/machine.json',{schema_version:1,files:{config:{path:'${MY_FILE}'}}});assert.equal(environmentReport(r,{MY_FILE:file}).entries.find(e=>e.group==='commands').status,'declared');
 const missing=environmentReport(r,{});assert.ok(missing.problems.length);assert.ok(missing.entries.find(e=>e.group==='commands').missing_variables.includes('MY_FILE'));
 const cfg=JSON.parse(read(r,'.notth/environment.json'));cfg.commands.test.args=['${files.missing}'];write(r,'.notth/environment.json',cfg);assert.ok(environmentReport(r,{}).entries.find(e=>e.group==='commands').missing_variables.includes('files.missing'));
 assert.equal(check(r).status,'ok');
});

test('bounded change listing still reports a selected change outside the first page and excludes archive',t=>{
 const r=project(t);for(let i=0;i<101;i++)write(r,'openspec/changes/item-'+String(i).padStart(3,'0')+'/proposal.md','# Proposal');
 write(r,'openspec/changes/archive/old/tasks.md','- [ ] Archived');write(r,'openspec/changes/item-100/tasks.md','- [ ] Last-page task');
 saveStart(r,{goal:'change',changeId:'item-100',task:'Selected last item'});const report=changesReport(r);
 assert.equal(report.changes.length,100);assert.equal(report.truncated,true);assert.ok(!report.changes.some(row=>row.id==='archive'));assert.equal(statusReport(r).tasks.first_unchecked,'Last-page task');
});
test('switching from Kiro gives guidance for the current chosen host while preserving old managed files',t=>{
 const r=project(t,{host:'kiro'});const result=cli(r,['update','--host','claude-code']);
 assert.doesNotMatch(result.next_steps[0],/Open this project in Kiro/);assert.ok(fs.existsSync(path.join(r,'.kiro/hooks/harness-session.json')));assert.ok(fs.existsSync(path.join(r,'.claude/skills/harness-start/SKILL.md')));
});
