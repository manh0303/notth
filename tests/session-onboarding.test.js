import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { SOURCE, install, check, changeSidecars, doctor } from '../cli/harness.js';
import { kiroPayload } from '../cli/kiro.js';
import { seed, localContext, knowledgeReport } from '../cli/knowledge.js';
import { startPlan } from '../cli/start.js';
import { agentPlan } from '../cli/agents.js';
import { requirementReport, skillRequirements } from '../cli/skill-requirements.js';
import { syncIntegrations } from '../cli/sync-integrations.js';
import { backupConfig, restoreConfig } from '../cli/portable-config.js';

function project(t, options = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(),'aih-session-'));
  t.after(() => fs.rmSync(root,{recursive:true,force:true}));
  if (options.install !== false) install(root,SOURCE,options);
  return root;
}
function write(root,name,value) { const p = path.join(root,name); fs.mkdirSync(path.dirname(p),{recursive:true}); fs.writeFileSync(p,typeof value === 'string' ? value : JSON.stringify(value)); }
const read = (root,name) => fs.readFileSync(path.join(root,name),'utf8');
function context(root) { write(root,'pom.xml','<project/>'); write(root,'.notth/local.md','---\nschema_version: 1\nstack:\n  language: java\n  version: "21"\nbuild:\n  tool: maven\napproved_deviations:\n  - id: approved-error-contract\n    rule: "Preserve the approved error contract"\n    reason: "Existing approved source"\nsources:\n  - pom.xml\n---\n# Preserved prose\n'); }
function cli(root,args,code=0) { const r=spawnSync(process.execPath,[path.join(SOURCE,'bin/aih.js'),...args],{cwd:root,encoding:'utf8'}); assert.equal(r.status,code,r.stdout+r.stderr); return JSON.parse(r.stdout||r.stderr); }

test('Kiro init installs canonical wrappers and SessionStart; preserves native/user config and auto-retains integration on update',t=>{
  const root=project(t,{install:false}); write(root,'.kiro/steering/custom.md','User steering'); write(root,'.kiro/hooks/custom.json','{}');
  install(root,SOURCE,{host:'kiro'});
  const wrapper=read(root,'.kiro/skills/harness-start/SKILL.md'); assert.match(wrapper,/\.agents\/skills\/harness-start\/SKILL.md/);
  const hook=JSON.parse(read(root,'.kiro/hooks/harness-session.json')); assert.equal(hook.version,'v1'); assert.equal(hook.hooks[0].trigger,'SessionStart'); assert.equal(hook.hooks[0].action.type,'agent');
  assert.match(hook.hooks[0].action.prompt,/Do not start an interview/);
  context(root); const before=read(root,'.notth/local.md'); install(root,SOURCE,{command:'update'});
  assert.equal(check(root).status,'ok'); assert.equal(read(root,'.notth/local.md'),before); assert.equal(read(root,'.kiro/steering/custom.md'),'User steering'); assert.equal(read(root,'.kiro/hooks/custom.json'),'{}');
  assert.equal(cli(root,['start','--host','kiro']).knowledge.status,'missing');
  assert.match(startPlan(root,'kiro').next_steps[0],/current AI session/);
});
test('Kiro collisions, managed drift and write failures cannot replace user files; dry-run is clean',t=>{
  const root=project(t,{install:false}); write(root,'.kiro/skills/harness-start/SKILL.md','custom');
  assert.throws(()=>install(root,SOURCE,{host:'kiro'}),/collision/); assert.equal(fs.existsSync(path.join(root,'.notth/lock.json')),false);
  fs.rmSync(path.join(root,'.kiro'),{recursive:true}); install(root,SOURCE,{host:'kiro',dryRun:true}); assert.equal(fs.existsSync(path.join(root,'.kiro')),false);
  assert.throws(()=>install(root,SOURCE,{host:'kiro',writer:(filename,data)=>{if(filename.endsWith('harness-session.json'))throw Error('injected');fs.mkdirSync(path.dirname(filename),{recursive:true});fs.writeFileSync(filename,data);}}),/injected/);
  assert.equal(fs.existsSync(path.join(root,'.notth/lock.json')),false); assert.equal(fs.existsSync(path.join(root,'.kiro/skills/harness-start/SKILL.md')),false);
  install(root,SOURCE,{host:'kiro'}); write(root,'.kiro/hooks/harness-session.json','{}'); assert.equal(check(root).status,'error'); assert.throws(()=>install(root,SOURCE,{command:'update'}),/Managed files changed/);
});
test('structured local context parses standard YAML, approved deviations and JSON-compatible YAML; preserves legacy prose',t=>{
  const root=project(t); context(root); const parsed=localContext(root); assert.equal(parsed.value.stack.version,'21'); assert.equal(parsed.value.approved_deviations[0].id,'approved-error-contract');
  write(root,'.notth/local.md','---\n'+JSON.stringify(parsed.value)+'\n---\nExplanation\n'); assert.deepEqual(localContext(root).value,parsed.value);
  write(root,'.notth/local.md','# Legacy free text\n'); install(root,SOURCE,{command:'update'}); assert.equal(localContext(root).structured,false); assert.equal(read(root,'.notth/local.md'),'# Legacy free text\n');
});
test('seed detects source/config/addition/deletion drift but ordinary code and machine paths do not invalidate it',t=>{
  const root=project(t); assert.equal(seed(root,{checkOnly:true}).status,'blocked'); assert.equal(fs.existsSync(path.join(root,'.notth/knowledge.json')),false);
  assert.throws(()=>seed(root,{record:true}),/Populate/); context(root); seed(root,{record:true}); assert.equal(seed(root,{checkOnly:true}).status,'ok');
  write(root,'src/Example.java','class Example {}'); write(root,'.notth/machine.json',{schema_version:1,tools:{}}); assert.equal(knowledgeReport(root).status,'current');
  write(root,'backend-conventions.md','new approved conventions'); assert.ok(knowledgeReport(root).changed_sources.includes('backend-conventions.md')); seed(root,{record:true});
  write(root,'pom.xml','<project>changed</project>'); assert.equal(seed(root,{checkOnly:true}).status,'blocked'); seed(root,{record:true});
  fs.rmSync(path.join(root,'pom.xml')); assert.ok(knowledgeReport(root).changed_sources.includes('pom.xml')); assert.throws(()=>seed(root,{record:true}),/missing knowledge/);
});
test('malformed frontmatter, private source paths, symlinks and tampered hashes fail without modifying context',t=>{
  const root=project(t); for(const body of ['---\nschema_version: 1\nschema_version: 1\n---\n', '---\nschema_version: 2\n---\n', '---\nschema_version: 1\nsources: [".env"]\n---\n','---\nschema_version: 1\nstack: &unsafe\n---\n']) {
    write(root,'.notth/local.md',body); assert.throws(()=>install(root,SOURCE,{command:'update'})); assert.equal(read(root,'.notth/local.md'),body);
  }
  context(root); seed(root,{record:true}); const cache=JSON.parse(read(root,'.notth/knowledge.json')); cache.knowledge_hash='0'.repeat(64);write(root,'.notth/knowledge.json',cache); assert.throws(()=>knowledgeReport(root),/digest mismatch/);
  fs.rmSync(path.join(root,'.notth/knowledge.json')); fs.symlinkSync(path.join(root,'pom.xml'),path.join(root,'linked.md')); const c=localContext(root).value; c.sources=['linked.md'];write(root,'.notth/local.md','---\n'+JSON.stringify(c)+'\n---\n');assert.throws(()=>seed(root,{record:true}),/Symlink/);
});
test('doctor checks declared skill prerequisites without exposing private values; MCP is explicitly unverified',t=>{
  const root=project(t); write(root,'.agents/skills/project-doc/SKILL.md','---\nname: project-doc\ndescription: Test prerequisites\nrequires:\n  machine:\n    - tools.maven.executable\n  environment:\n    - files.maven-settings.path\n    - commands.get-token\n  mcp:\n    - project-db\n---\nInstructions\n');
  assert.equal(requirementReport(root,'project-doc').missing.length,4);
  write(root,'settings.xml','PRIVATE_SETTINGS'); write(root,'.notth/environment.json',{schema_version:1,tools:{maven:{executable:'node'}},files:{'maven-settings':{path:'settings.xml'}},commands:{'get-token':{tool:'maven',args:[]}}});
  write(root,'.notth/machine.json',{schema_version:1,tools:{maven:{executable:process.execPath}}});write(root,'.notth/integrations.json',{schema_version:1,connections:{db:{via:'mcp',binding:'project-db',purpose:'Project test'}}});
  const report=doctor(root,'project-doc'); assert.equal(report.status,'ok'); assert.equal(report.prerequisites.host_checks[0].status,'unverified');assert.ok(!JSON.stringify(report).includes('PRIVATE_SETTINGS'));assert.ok(!JSON.stringify(report).includes(process.execPath));
  assert.throws(()=>skillRequirements('---\nrequires:\n  unknown: []\n---\n'),/Invalid/);
});
test('agent extensions have explicit core-first load order, missing extensions block routing and transfer omits repo extensions',t=>{
  const root=project(t), config=JSON.parse(read(root,'.notth/agents.json')); config.agents['core:security-reviewer'].extensions=['plugins/project/agents/security-reviewer.md'];write(root,'.notth/agents.json',config);
  assert.equal(agentPlan(root,'kiro').status,'blocked'); write(root,'plugins/project/agents/security-reviewer.md','# Project security\n');
  const role=agentPlan(root,'kiro').roles.find(r=>r.id==='core:security-reviewer');assert.deepEqual(role.contract_load_order,['.notth/core/agents/security-reviewer.md','plugins/project/agents/security-reviewer.md']);
  const backup=backupConfig(root), dest=project(t,{install:false});fs.copyFileSync(path.join(root,backup.backup),path.join(dest,'backup.json'));restoreConfig(dest,'backup.json',{transfer:true});assert.equal(JSON.parse(read(dest,'.notth/agents.json')).agents['core:security-reviewer'].extensions,undefined);
});
test('external propose sidecars are idempotent and never overwrite decisions or existing template metadata',t=>{
  const root=project(t); write(root,'openspec/changes/external/proposal.md','# External proposal\n');write(root,'openspec/changes/external/decisions.json','{"approved":"preserve bytes"}');
  assert.equal(changeSidecars(root,'external').created.length,3); assert.equal(read(root,'openspec/changes/external/decisions.json'),'{"approved":"preserve bytes"}');assert.deepEqual(changeSidecars(root,'external').created,[]);assert.throws(()=>changeSidecars(root,'missing'),/existing proposal/);
});
test('MCP sync imports enabled server aliases only, preserves declarations, resolves alias collisions and omits secrets',t=>{
  const root=project(t); write(root,'.notth/integrations.json',{schema_version:1,connections:{'project-db':{via:'manual',binding:'existing',purpose:'preserved'}}});
  const input=path.join(root,'mcp.json');write(root,'mcp.json',{mcpServers:{project_db:{command:'PRIVATE_COMMAND',env:{TOKEN:'PRIVATE_TOKEN'},url:'https://private.invalid',autoApprove:['write']},'project.db':{},disabled:{disabled:true}}});
  const before=read(root,'.notth/integrations.json');assert.equal(syncIntegrations(root,{from:input,dryRun:true}).added.length,2);assert.equal(read(root,'.notth/integrations.json'),before);
  const result=syncIntegrations(root,{from:input});assert.deepEqual(result.added,['project-db-2','project-db-3']);assert.equal(result.availability,'unverified'); assert.deepEqual(syncIntegrations(root,{from:input}).added,[]);
  const body=read(root,'.notth/integrations.json');assert.ok(!/PRIVATE_|private.invalid|autoApprove|command/.test(body));assert.equal(JSON.parse(body).connections['project-db'].binding,'existing');
  write(root,'mcp.json','{"SECRET_TOKEN": broken}');assert.throws(()=>syncIntegrations(root,{from:input}),e=>!e.message.includes('SECRET_TOKEN'));assert.equal(read(root,'.notth/integrations.json'),body);
});
test('CLI seed flags and update --host kiro work from an existing generic installation',t=>{
  const root=project(t); context(root);assert.equal(cli(root,['seed','--check'],1).freshness,'missing');cli(root,['seed','--record']);cli(root,['seed','--check']);cli(root,['seed','--check','--record'],2);cli(root,['doctor','--record'],2);
  const update=cli(root,['update','--host','kiro']);assert.match(update.next_steps[0],/first chat select \/harness-start/);assert.equal(check(root).status,'ok');assert.equal(cli(root,['seed','--check'],1).freshness,'stale');
});

test("Kiro bridge refuses source bundles without the canonical onboarding skill",()=>{
  assert.throws(()=>kiroPayload({}),/source bundle containing harness-start/);
});
