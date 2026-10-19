import { brotliDecompressSync } from 'node:zlib';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { SOURCE, safe, install, check, newDoc, newChange, saveCheckpoint, loadLock } from '../cli/harness.js';
import { detect } from '../cli/adapters.js';
import { claudeReport, hasAgentsImport } from '../cli/claude.js';
import { agentPlan, agentDefaults, validateAgentConfig, validatePreferredSkills } from '../cli/agents.js';
import { readSkill, skillCatalog, loadCapability } from '../cli/capabilities.js';
import { resumePlan } from '../cli/checkpoint.js';
import { comparisonTemplate, summarizeComparison } from '../cli/comparison.js';
const sha=s=>createHash('sha256').update(s).digest('hex');
function project(t){const root=fs.mkdtempSync(path.join(os.tmpdir(),'aih-agent-first-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));return root;}
function write(root,p,body){const f=path.join(root,p);fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(f,typeof body==='string'?body:JSON.stringify(body));}
const read=(root,p)=>fs.readFileSync(path.join(root,p),'utf8');
function snapshot(root){const out={};const walk=(p,rel='')=>{for(const e of fs.readdirSync(p,{withFileTypes:true})){const q=path.join(p,e.name),r=rel+e.name;if(e.isDirectory())walk(q,r+'/');else out[r]=fs.readFileSync(q).toString('base64');}};walk(root);return out;}
function cli(root,args,expected=0){const r=spawnSync(process.execPath,[path.join(SOURCE,'bin/aih.js'),...args],{cwd:root,encoding:'utf8',timeout:30000});assert.equal(r.status,expected,r.stdout+r.stderr);return JSON.parse(r.stdout||r.stderr);}
test('brownfield init-detect, Claude opt-in, custom skill preservation and drift',t=>{
 const root=project(t),agents='Existing project instructions\r\n',claude='\ufeff# Team Claude\r\nKeep this content.\r\n';
 write(root,'AGENTS.md',agents);write(root,'CLAUDE.md',claude);write(root,'pom.xml','<project><modules><module>service</module></modules></project>');write(root,'service/pom.xml','<project>org.springframework.boot</project>');
 write(root,'.agents/skills/team-check/SKILL.md','Team-owned procedures');write(root,'.claude/settings.json','{"model":"team-model"}');
 cli(root,['init','--detect','--host','claude-code','--link-claude','--claude-skills']);
 assert.deepEqual(loadLock(root).adapters,['java-spring']);assert.ok(read(root,'AGENTS.md').startsWith(agents));
 assert.ok(read(root,'CLAUDE.md').startsWith(claude));assert.equal(claudeReport(root).files[0].imports_agents,true);
 assert.equal(JSON.parse(read(root,'.notth/agents.json')).provider,'anthropic');
 assert.equal(read(root,'.claude/settings.json'),'{"model":"team-model"}');
 const before=snapshot(root);cli(root,['init','--detect','--link-claude','--claude-skills']);assert.deepEqual(snapshot(root),before);
 write(root,'.agents/skills/team-check/SKILL.md','Team edits are not Harness drift');assert.equal(check(root).status,'ok');
 write(root,'.notth/core/rules/foundations.md','changed');assert.equal(check(root).status,'error');
});
test('default init preserves CLAUDE and doctor warns; imports in code are not active',t=>{
 const root=project(t),body='# Existing\n\x60@AGENTS.md\x60\n\x60\x60\x60md\n@AGENTS.md\n\x60\x60\x60\n';write(root,'CLAUDE.md',body);
 install(root,SOURCE);assert.equal(read(root,'CLAUDE.md'),body);assert.equal(claudeReport(root).status,'warning');
 assert.equal(hasAgentsImport('@AGENTS.md'),true);assert.equal(hasAgentsImport(body),false);
 write(root,'.claude/CLAUDE.md','@../AGENTS.md\n');assert.equal(claudeReport(root).files.at(-1).imports_agents,true);
});
test('managed Claude block is checked; outside edits survive update and failures roll back',t=>{
 const root=project(t);write(root,'CLAUDE.md','# Team\n');install(root,SOURCE,{linkClaude:true});write(root,'CLAUDE.md',read(root,'CLAUDE.md')+'\nUser addition\n');
 install(root,SOURCE,{command:'update'});assert.match(read(root,'CLAUDE.md'),/User addition/);assert.equal(check(root).status,'ok');
 write(root,'CLAUDE.md',read(root,'CLAUDE.md').replace('@AGENTS.md','@OTHER.md'));assert.equal(check(root).status,'error');
 assert.throws(()=>install(root,SOURCE,{command:'update'}));assert.match(read(root,'CLAUDE.md'),/@OTHER.md/);
 const other=project(t);write(other,'CLAUDE.md','# Old');let n=0;
 assert.throws(()=>install(other,SOURCE,{linkClaude:true,writer:(file,data)=>{if(++n===4)throw Error('write failed');fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,data);}}));
 assert.equal(read(other,'CLAUDE.md'),'# Old');assert.ok(!fs.existsSync(path.join(other,'.notth/lock.json')));
});
test('native skill collisions fail before mutations; user agents/model settings are preserved',t=>{
 const root=project(t);write(root,'.claude/skills/harness-tdd/SKILL.md','User collision');const before=snapshot(root);
 assert.throws(()=>install(root,SOURCE,{claudeSkills:true}),/collision/);assert.deepEqual(snapshot(root),before);
 const other=project(t);const custom=agentDefaults(SOURCE);custom.provider='custom';custom.defaultModel='my-model';
 write(other,'.notth/agents.json',custom);const bytes=read(other,'.notth/agents.json');install(other,SOURCE,{host:'claude-code'});
 assert.equal(read(other,'.notth/agents.json'),bytes);assert.equal(JSON.parse(read(other,'.notth/templates/agents.default.json')).provider,'host');
});
test('Maven declared modules are bounded and produce per-module evidence',t=>{
 const root=project(t);write(root,'pom.xml','<project><modules><module>a</module><module>missing</module></modules></project>');
 write(root,'a/pom.xml','<project><modules><module>b</module></modules></project>');write(root,'a/b/pom.xml','<project>org.springframework.boot<modules><module>deeper</module></modules></project>');
 const result=detect(root,SOURCE);assert.deepEqual(result.adapters,['java-spring']);assert.equal(result.matches[0].evidence[0].file,'a/b/pom.xml');assert.equal(result.warnings.length,2);
 write(root,'pom.xml','<modules><module>../escape</module></modules>');assert.throws(()=>detect(root,SOURCE),/unsafe/);
 write(root,'pom.xml','<!DOCTYPE project [<!ENTITY x SYSTEM "file:///secret">]><project/>');assert.throws(()=>detect(root,SOURCE),/Unsupported/);
 write(root,'pom.xml','x'.repeat(1024*1024+1));assert.throws(()=>detect(root,SOURCE),/1 MiB/);
});
test('analysis/discovery reuse canonical Product assets, union without duplicate skills and old routes',t=>{
 const root=project(t);install(root,SOURCE,{capabilities:['analysis']});
 const names=skillCatalog(root,loadLock(root)).skills.map(s=>s.name);assert.ok(names.includes('harness-product-techspec'));assert.ok(!names.includes('harness-product-idea-discovery'));
 assert.equal(newDoc(root,'srs').path,'docs/product/srs.md');assert.equal(newDoc(root,'brd','analysis').path,'docs/analysis/brd.md');
 assert.throws(()=>newDoc(root,'idea'),/not installed/i);
 const other=project(t);install(other,SOURCE,{capabilities:['product','analysis','discovery','delivery']});
 const skills=skillCatalog(other,loadLock(other)).skills;assert.equal(skills.length,new Set(skills.map(s=>s.name)).size);
 const plan=agentPlan(other);for(const id of ['product:project-manager','delivery:project-manager'])assert.equal(plan.roles.find(r=>r.id===id).canonical_id,'core:project-manager');
 const d=newDoc(other,'delivery-plan');assert.equal(read(other,d.path),read(SOURCE,'templates/delivery-plan.md'));
 assert.equal(loadCapability(SOURCE,'discovery').skills.length,5);
});
test('retired recipes are removed, old IDs yield migration guidance',t=>{
 const root=project(t);install(root,SOURCE,{adapters:['java-spring','astro']});const lock=loadLock(root);
 for(const id of ['harness-java-spring-kafka-outbox','harness-java-spring-database-migration','harness-astro-cloudflare','harness-astro-microfrontend']){
  assert.ok(!Object.hasOwn(lock.files,'.agents/skills/'+id+'/SKILL.md'));assert.equal(readSkill(root,lock,id).retired,true);
 }
 assert.ok(!read(root,'.notth/adapters/java-spring/rules/database.md').includes('outbox'));
});
test('unknown preferred skills and unscoped autopilot are rejected',()=>{
 assert.throws(()=>validatePreferredSkills('## Preferred skills\n- Required: harness-unknown',new Set()),/Unknown/);
 const c=agentDefaults(SOURCE);c.execution.autonomy={mode:'autopilot',actions:['merge'],repositories:[]};assert.throws(()=>validateAgentConfig(c),/scope/);
 c.execution.autonomy.repositories=['team/project'];assert.equal(validateAgentConfig(c),c);
 c.execution.budget={maxTokens:1000};assert.equal(validateAgentConfig(c),c);c.execution.budget.maxTokens=-1;assert.throws(()=>validateAgentConfig(c),/maxTokens/);
});
function checkpoint(root){write(root,'code.txt','baseline');write(root,'evidence.txt','actual fixture evidence');return {schema_version:1,change_id:'feature',phase:'implementation',summary:'One task completed',timestamp:'2026-10-13T10:00:00Z',baseline:[{path:'code.txt',sha256:sha('baseline')}],completed:[{id:'one',summary:'Fixture verified',evidence:[{path:'evidence.txt',sha256:sha('actual fixture evidence')}]}],pending:[{id:'two',summary:'Next task'}],in_progress:null,blockers:[],next_action:'Inspect and implement task two',external_sources:[{location:'https://example.com/docs',revision:'r1'}],operations:[{id:'publish-one',action:'create-pr',target:'team/project',status:'unknown',evidence:[]}]};}
test('checkpoint resume detects stale baseline and unknown side effects; CAS/history preserve progress',t=>{
 const root=project(t);install(root,SOURCE);newChange(root,'feature');const row=checkpoint(root);write(root,'handoff.json',row);
 const saved=saveCheckpoint(root,'feature','handoff.json');const plan=resumePlan(root,'feature');assert.equal(plan.revalidate_required,false);assert.equal(plan.operations_to_reconcile.length,1);assert.equal(plan.usage,null);
 write(root,'code.txt','new baseline');assert.equal(resumePlan(root,'feature').revalidate_required,true);
 assert.throws(()=>saveCheckpoint(root,'feature','handoff.json'),/exists/);
 row.summary='Updated handoff';write(root,'handoff.json',row);saveCheckpoint(root,'feature','handoff.json',saved.checkpoint_sha256);
 assert.ok(fs.existsSync(path.join(root,'openspec/changes/feature/checkpoint-history',saved.checkpoint_sha256+'.json')));
 assert.throws(()=>saveCheckpoint(root,'feature','handoff.json',saved.checkpoint_sha256),/changed/);
 write(root,'evidence.txt','tampered');assert.throws(()=>resumePlan(root,'feature'),/digest/);
});
test('checkpoint missing evidence, secret fields, wrong change and unsafe paths fail before write',t=>{
 const root=project(t);install(root,SOURCE);newChange(root,'feature');
 for(const mutate of [r=>r.change_id='other',r=>r.password='secret',r=>r.completed[0].evidence=[],r=>r.baseline[0].path='../escape']){
  const row=checkpoint(root);mutate(row);write(root,'handoff.json',row);assert.throws(()=>saveCheckpoint(root,'feature','handoff.json'));
  assert.ok(!fs.existsSync(path.join(root,'openspec/changes/feature/checkpoint.json')));
 }
});
test('comparison preserves null metrics and failures; no model runs or fabricated productivity',()=>{
 const r=comparisonTemplate();assert.equal(r.runs.length,18);const empty=summarizeComparison(r);assert.equal(empty.observed_runs,0);assert.equal(empty.summaries[0].metrics.cost.median,null);
 r.metadata={model:'actual-model',runtime:'actual-host',harness_commit:'fixture-sha',starting_commit:'fixture-base',budget:'same-declared'};
 Object.assign(r.runs[0],{status:'FAILED',human_correction_rounds:2,unnecessary_questions:1,accepted_criteria:2,total_criteria:4,evidence:['actual reviewed fixture transcript']});
 const result=summarizeComparison(r);assert.equal(result.observed_runs,1);assert.equal(result.summaries[0].statuses.FAILED,1);assert.equal(result.summaries[0].metrics.human_correction_rounds.median,2);
 r.runs[0].cost=1;assert.throws(()=>summarizeComparison(r),/usage/);
 r.runs[0].cost=null;r.runs[0].accepted_criteria=5;assert.throws(()=>summarizeComparison(r),/accepted/);
});

function releasedSnapshot(root){
 const fixture=JSON.parse(read(SOURCE,'tests/fixtures/npm-v0.12.0.json'));
 const bytes=brotliDecompressSync(Buffer.from(fixture.payload,'base64'),{maxOutputLength:8*1024*1024});
 assert.equal(sha(bytes),fixture.sha256);const files=JSON.parse(bytes);assert.equal(Object.keys(files).length,fixture.file_count);
 for(const [p,body] of Object.entries(files)){safe(root,p);write(root,p,body);}
 assert.throws(()=>check(root),/aih update/);return fixture;
}
test('actual released 0.12 snapshot upgrades, retires recipes, preserves config/docs and is idempotent',t=>{
 const root=project(t);const fixture=releasedSnapshot(root);assert.equal(fixture.source_tree,'191a2fea0cd44613f5e66b8c482892af839db1d3');
 const agentBytes=read(root,'.harness/agents.json'),local=read(root,'.harness/local.md');
 write(root,'docs/team.md','Approved team document');write(root,'CLAUDE.md','# Team host');
 const before=snapshot(root);const plan=install(root,SOURCE,{command:'update',dryRun:true,linkClaude:true,claudeSkills:true});assert.deepEqual(snapshot(root),before);
 assert.ok(plan.changes.some(c=>c.action==='delete'&&c.path.includes('kafka-outbox')));
 install(root,SOURCE,{command:'update',linkClaude:true,claudeSkills:true});assert.equal(check(root).status,'ok');
 assert.equal(read(root,'.notth/agents.json'),agentBytes);assert.equal(read(root,'.notth/local.md'),local);assert.equal(read(root,'docs/team.md'),'Approved team document');
 assert.ok(!fs.existsSync(path.join(root,'.agents/skills/harness-java-spring-kafka-outbox/SKILL.md')));
 assert.equal(install(root,SOURCE,{command:'update'}).changes.length,0);
});
test('edited retired recipe blocks actual 0.12 update before any write',t=>{
 const root=project(t);releasedSnapshot(root);write(root,'.agents/skills/harness-java-spring-kafka-outbox/SKILL.md','User edit');
 const before=snapshot(root);assert.throws(()=>install(root,SOURCE,{command:'update'}),/Managed files changed/);assert.deepEqual(snapshot(root),before);
});
test('analysis TechSpec uses canonical external Product route without local fallback',t=>{
 const root=project(t);install(root,SOURCE,{capabilities:['analysis']});
 write(root,'.notth/artifacts.json',{schema_version:1,mode:'idea-driven',inputs:{},outputs:{docs:{kind:'docs',capability:'product',canonical:true,location:{url:'https://example.com/spec',connection:'wiki'},write_policy:'propose'}}});
 write(root,'.notth/integrations.json',{schema_version:1,connections:{wiki:{via:'mcp',binding:'team-wiki',purpose:'docs'}}});
 const result=newDoc(root,'techspec','analysis');assert.equal(result.status,'planned');assert.equal(result.executed,false);assert.ok(!fs.existsSync(path.join(root,'docs/analysis/techspec.md')));
});
test('README translations share selectors, quick start and real setup links',()=>{
 for(const file of ['README.md','docs/i18n/README.vi.md','docs/i18n/README.zh-CN.md','docs/i18n/README.es.md']){
  const text=read(SOURCE,file);for(const language of ['English','Tiếng Việt','简体中文','Español'])assert.ok(text.includes(language));
  assert.ok(text.includes('npx --yes @manhd_d/notth init'));for(const host of ['codex','claude-code','cursor','copilot','gemini-cli','kiro'])assert.ok(text.includes('tool-setup/'+host+'.md'));
 }
});

test('comparison does not aggregate incompatible acceptance totals or currencies',()=>{
 const r=comparisonTemplate();r.metadata={model:'actual',runtime:'host',harness_commit:'candidate',starting_commit:'same-base'};
 for(const row of r.runs.slice(0,2))Object.assign(row,{status:'COMPLETED',evidence:['fixture'],total_criteria:4,accepted_criteria:4,usage_source:'fixture measurement',cost:1,currency:'USD'});
 r.runs[1].currency='EUR';assert.throws(()=>summarizeComparison(r),/currencies/);
 r.runs[1].currency='USD';r.runs[1].total_criteria=5;assert.throws(()=>summarizeComparison(r),/acceptance/);
});
