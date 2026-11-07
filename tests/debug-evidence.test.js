import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { install, check, SOURCE, loadLock } from '../cli/harness.js';
import { skillCatalog, readSkill } from '../cli/capabilities.js';
import { loadEnvironment, environmentReport } from '../cli/environment.js';
import { agentPlan } from '../cli/agents.js';

const write = (root, p, value) => { const file = path.join(root,p); fs.mkdirSync(path.dirname(file), {recursive:true}); fs.writeFileSync(file, typeof value === 'string' ? value : JSON.stringify(value)); };
function project(t, host) { const root=fs.mkdtempSync(path.join(os.tmpdir(),'notth-debug-evidence-')); t.after(()=>fs.rmSync(root,{recursive:true,force:true})); if(host)install(root,SOURCE,{host}); return root; }
const policy = () => ({artifact:'bug-proof',folder_pattern:'{date}/{prefix}-{id}',prefix:'debug',runner:'project',base_url_env:'TEST_GATEWAY_BASE_URL'});
const environment = () => ({schema_version:1,tools:{},files:{},commands:{},bug_evidence:policy()});
function configure(root, env=environment()) {
  write(root,'.notth/artifacts.json',{schema_version:1,mode:'idea-driven',inputs:{},outputs:{'bug-proof':{kind:'evidence',location:{path:'verification/debug'},write_policy:'propose',canonical:true}}});
  write(root,'.notth/environment.json',env);
}
for(const host of ['codex','claude-code','kiro','cursor','copilot','gemini-cli','opencode','windsurf']) test(host+': exact unprefixed skill installs, loads and updates with all resources',t=>{
  const root=project(t,host), lock=loadLock(root);
  assert.equal(check(root).status,'ok');
  assert.equal(skillCatalog(root,lock).skills.filter(s=>s.name==='debug-evidence').length,1);
  assert.match(readSkill(root,lock,'debug-evidence').content,/name: debug-evidence/);
  for(const resource of ['assets/evidence-pack.md','references/golden-sample.md'])
    assert.ok(fs.readFileSync(path.join(root,'.agents/skills/debug-evidence',resource),'utf8').includes('NOT_RUN'));
  if(['kiro','claude-code'].includes(host)) {
    const bridge=host==='kiro'?'.kiro':'.claude';
    assert.match(fs.readFileSync(path.join(root,bridge,'skills/debug-evidence/SKILL.md'),'utf8'),/\.agents\/skills\/debug-evidence\/SKILL.md/);
  }
  const before=fs.readFileSync(path.join(root,'.notth/environment.json'));
  assert.deepEqual(install(root,SOURCE,{command:'update',host}).changes,[]);
  assert.deepEqual(fs.readFileSync(path.join(root,'.notth/environment.json')),before);
  assert.equal(fs.existsSync(path.join(root,'verification')),false,'Install must not create a fake pack');
});

test('skill ownership fails safely for custom collisions, edited resources and custom namespace lock entries',t=>{
  const root=project(t);
  write(root,'.agents/skills/debug-evidence/SKILL.md','project custom skill');
  assert.throws(()=>install(root,SOURCE),/collision/);
  assert.equal(fs.existsSync(path.join(root,'.notth/lock.json')),false);
  assert.equal(fs.readFileSync(path.join(root,'.agents/skills/debug-evidence/SKILL.md'),'utf8'),'project custom skill');
  const installed=project(t,'kiro');
  write(installed,'.agents/skills/debug-evidence/assets/evidence-pack.md','edited');
  assert.equal(check(installed).status,'error');
  assert.throws(()=>install(installed,SOURCE,{command:'update'}),/modified|drift|edited|changed/i);
  const lock=loadLock(installed);lock.files['.agents/skills/project-custom/SKILL.md']='0'.repeat(64);
  write(installed,'.notth/lock.json',lock);
  assert.throws(()=>loadLock(installed),/Invalid lock entry/);
});

test('portable policy validates references without runner execution or secrets and survives update',t=>{
  const root=project(t,'codex'); configure(root);
  assert.deepEqual(loadEnvironment(root).shared.bug_evidence,policy());
  const report=JSON.stringify(environmentReport(root,{TEST_GATEWAY_BASE_URL:'https://secret.example/private'}));
  assert.doesNotMatch(report,/secret.example/);
  assert.equal(fs.existsSync(path.join(root,'verification')),false);
  const before=fs.readFileSync(path.join(root,'.notth/environment.json'));
  install(root,SOURCE,{command:'update'});
  assert.deepEqual(fs.readFileSync(path.join(root,'.notth/environment.json')),before);
  for(const bug_evidence of [undefined,null]) { const env=environment(); if(bug_evidence===undefined)delete env.bug_evidence;else env.bug_evidence=null;write(root,'.notth/environment.json',env);assert.doesNotThrow(()=>loadEnvironment(root)); }
  assert.ok(agentPlan(root).roles.some(a=>a.skills.optional.includes('debug-evidence')));
});

for(const [name,mutate] of [
  ['unknown output',v=>v.artifact='absent'], ['traversal',v=>v.folder_pattern='../{date}/{id}'],
  ['absolute path',v=>v.folder_pattern='/{date}/{id}'], ['Windows path',v=>v.folder_pattern='C:\\{date}\\{id}'],
  ['managed path',v=>v.folder_pattern='.notth/{date}/{id}'], ['unknown placeholder',v=>v.folder_pattern='{date}/{id}/{token}'],
  ['missing date',v=>v.folder_pattern='{id}'], ['unsafe prefix',v=>v.prefix='../ticket'],
  ['command runner',v=>v.runner='python runner.py'], ['credential URL',v=>v.base_url_env='https://user:pass@example.com'],
  ['unknown key',v=>v.root='debug'],
]) test('reject bug policy '+name,t=>{const root=project(t,'codex'),env=environment();mutate(env.bug_evidence);configure(root,env);assert.throws(()=>loadEnvironment(root));});

test('policy respects artifact schema and read-only/external routes',t=>{
  const root=project(t,'codex');configure(root);
  const artifact=JSON.parse(fs.readFileSync(path.join(root,'.notth/artifacts.json')));
  artifact.outputs['bug-proof'].location={url:'https://example.com/evidence'};
  artifact.outputs['bug-proof'].write_policy='read-only';write(root,'.notth/artifacts.json',artifact);
  assert.doesNotThrow(()=>loadEnvironment(root),'Read-only external route is valid configuration, not permission to write');
  assert.equal(fs.existsSync(path.join(root,'verification')),false);
  artifact.outputs['bug-proof'].kind='docs';write(root,'.notth/artifacts.json',artifact);assert.throws(()=>loadEnvironment(root),/evidence output/);
});

test('test environment declarations are optional, validated and never treated as verified',t=>{
  const root=project(t,'codex');const env=environment();
  env.test_environments={'test-site':{gateway_env:'TEST_GATEWAY',type:'test',isolation:'confirmed',fixture_retention:'allowed_when_authorized',source:'debug/confirmation.md',confirmed_at:'2026-11-04'}};
  configure(root,env);assert.doesNotThrow(()=>loadEnvironment(root));
  assert.doesNotMatch(JSON.stringify(environmentReport(root,{TEST_GATEWAY:'https://private.example/path'})),/private\.example/);
  for(const mutation of [v=>v.source='../secret',v=>v.gateway_env='https://user:password@example.com',v=>v.confirmed_at='2026-02-30',v=>v.password='secret']) {
    const invalid=structuredClone(env);mutation(invalid.test_environments['test-site']);configure(root,invalid);
    assert.throws(()=>loadEnvironment(root),e=>!e.message.includes('password')&&!e.message.includes('secret'));
  }
  delete env.test_environments;configure(root,env);assert.doesNotThrow(()=>loadEnvironment(root));
});
