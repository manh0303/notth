import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { createHash, randomUUID } from 'node:crypto';
import { install, SOURCE, newDoc, check } from '../cli/harness.js';
import { adaptiveVerification } from '../cli/verification.js';
import { reviewVerification } from '../cli/verification-report.js';
const timestamp = '2026-10-13T00:00:00Z';
function project(t) { const root=fs.mkdtempSync(path.join(os.tmpdir(),'aih-verification-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));return root; }
function write(root,name,value) { const p=path.join(root,name);fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,typeof value==='string'?value:JSON.stringify(value)); }
function report(root,observed={state:'approved'}) {
 const bytes=JSON.stringify(observed);write(root,'evidence.json',bytes);
 return {schema_version:1,metadata:{run_id:'fixture',feature:'Approval',source_revision:'test-fixture',environment:'isolated-loopback',producer:'node:test',timestamp},requirements:[{id:'AC-1',description:'Approval changes state',source:'fixture requirement'}],scenarios:[{id:'approval',status:'PASSED',executed:true,references:['AC-1'],method:'business-workflow',preconditions:['test-owned record'],fixture:'random isolated ID',steps:['create','approve','read','delete'],expected:'approved',observed:'approved',timestamp,mutates:true,cleanup:{strategy:'delete test-owned record',status:'PASSED'},execution:{tool:'node:test',command:['node','--test','tests/verification.test.js'],exit_code:0,timeout_ms:5000,attempts:1,max_attempts:1},evidence:[{path:'evidence.json',sha256:createHash('sha256').update(bytes).digest('hex')}],assertions:[{id:'state',basis:'AC-1',layer:'state',operator:'equal',expected:'approved',actual:{evidence:'evidence.json',pointer:'/state'}}]}]};
}
function review(root,r) {write(root,'report.json',r);return reviewVerification(root,'report.json');}
const fixtures=[
 ['backend',{'pom.xml':'<dependencies>spring-boot-starter-test junit testcontainers rest-assured</dependencies>','openapi.json':{openapi:'3.1.0'}},['unit','integration','api','contract']],
 ['fullstack',{'package.json':{dependencies:{next:'1'},devDependencies:{vitest:'1','@playwright/test':'1'},scripts:{build:'next build',test:'vitest'}}},['unit','browser-e2e','component']],
 ['static',{'package.json':{dependencies:{astro:'1'},scripts:{build:'astro build'}},'index.html':'<main>calculator</main>'},['build','accessibility']],
 ['existing-doc',{'docs/spec.md':'Approved requirements','package.json':{devDependencies:{jest:'1'},scripts:{test:'jest'}}},['unit']],
 ['state-workflow',{'openapi.yaml':'openapi: 3.1.0','docs/flow.md':'draft -> approved -> archived'},['contract','api']],
 ['mobile',{'package.json':{dependencies:{'react-native':'1'},devDependencies:{detox:'1'}}},['mobile-e2e','component']],
 ['python-ai',{'requirements.txt':'pytest\nlangchain'},['unit','ai-rag-evaluation']],
];
for(const [name,files,methods] of fixtures) test('adaptive discovery: '+name,t=>{
 const root=project(t);for(const [p,c] of Object.entries(files))write(root,p,c);
 install(root,SOURCE,{command:'init',capabilities:['product']});
 const before=fs.readFileSync(path.join(root,'.notth/artifacts.json'),'utf8');
 const result=adaptiveVerification(root,SOURCE);
 assert.equal(result.executed,false);for(const m of methods)assert.ok(result.methods.some(x=>x.method===m),m);
 if(name==='static')assert.ok(!result.methods.some(x=>x.method==='api'));
 assert.equal(fs.readFileSync(path.join(root,'.notth/artifacts.json'),'utf8'),before);
});
test('report links digest-checked observations and TechSpec preserves existing docs',t=>{
 const root=project(t);install(root,SOURCE,{command:'init',capabilities:['product']});const r=report(root);
 assert.equal(review(root,r).verdict,'PASSED');assert.equal(review(root,r).requirements[0].verification,'VERIFIED');
 newDoc(root,'techspec','product',{report:'report.json'});const content=fs.readFileSync(path.join(root,'docs/product/techspec.md'),'utf8');assert.match(content,/UNVERIFIED/);assert.match(content,/AC-1/);
 assert.throws(()=>newDoc(root,'techspec','product',{report:'report.json'}),/already exists/);assert.equal(check(root).status,'ok');
 assert.throws(()=>newDoc(root,'prd','product',{report:'report.json'}),/only/);
});
for(const [name,mutate] of [
 ['false PASS',r=>r.scenarios[0].assertions[0].expected='wrong'],
 ['typed observation',r=>r.scenarios[0].assertions[0].observed='wrong'],
 ['HTTP 200 alone',r=>r.scenarios[0].assertions[0].layer='transport'],
 ['catch timeout',r=>{r.scenarios[0].error={kind:'timeout',message:'deadline'};}],
 ['unbounded retry',r=>r.scenarios[0].execution.max_attempts=0],
 ['failed cleanup',r=>r.scenarios[0].cleanup.status='FAILED'],
 ['unsafe evidence',r=>r.scenarios[0].evidence[0].path='../escape'],
 ['digest mismatch',r=>r.scenarios[0].evidence[0].sha256='0'.repeat(64)],
 ['missing pointer',r=>r.scenarios[0].assertions[0].actual.pointer='/missing'],
 ['credential',r=>r.metadata.password='secret-value'],
 ['fake unexecuted PASS',r=>r.scenarios[0].executed=false],
])test('reject '+name,t=>{const root=project(t),r=report(root);mutate(r);assert.throws(()=>review(root,r));});
test('failed and blocked coverage stays UNVERIFIED; usage is optional',t=>{
 const root=project(t),r=report(root);r.scenarios[0].assertions[0].expected='wrong';r.scenarios[0].status='FAILED';assert.equal(review(root,r).verdict,'FAILED');
 const s=r.scenarios[0];s.status='BLOCKED';s.executed=false;s.assertions=[];s.reason='Host unavailable';delete s.execution;assert.equal(review(root,r).verdict,'BLOCKED');assert.equal(review(root,r).requirements[0].verification,'UNVERIFIED');
 s.status='NOT_RUN';assert.equal(review(root,r).verdict,'NOT_RUN');
});
test('actual isolated HTTP workflow checks role, state, read and owned cleanup',async t=>{
 const root=project(t),records=new Map(),id=randomUUID();
 const server=http.createServer((req,res)=>{res.setHeader('content-type','application/json');const reply=(code,body)=>{res.statusCode=code;res.end(JSON.stringify(body));};
 if(req.url!=='/'+id)return reply(404,{error:'missing'});
 if(req.method==='POST'){records.set(id,{state:'draft'});return reply(201,records.get(id));}
 if(req.method==='PATCH'){if(req.headers['x-test-role']!=='approver')return reply(403,{error:'forbidden'});records.set(id,{state:'approved'});return reply(200,records.get(id));}
 if(req.method==='DELETE'){records.delete(id);return reply(200,{removed:true});}
 return records.has(id)?reply(200,records.get(id)):reply(404,{error:'missing'});
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));t.after(()=>new Promise(resolve=>server.close(resolve)));
 const url='http://127.0.0.1:'+server.address().port+'/'+id;
 const call=(method,headers={})=>fetch(url,{method,headers,signal:AbortSignal.timeout(5000)});
 try{
 const created=await call('POST');assert.equal(created.status,201);assert.equal((await created.json()).state,'draft');
 const denied=await call('PATCH');assert.equal(denied.status,403);assert.equal((await denied.json()).error,'forbidden');assert.equal((await (await call('GET')).json()).state,'draft');
 const approved=await call('PATCH',{'x-test-role':'approver'});assert.equal(approved.status,200);const observed=await approved.json();assert.equal(observed.state,'approved');
 assert.equal((await (await call('GET')).json()).state,'approved');await call('DELETE');assert.equal(records.size,0);assert.equal((await call('GET')).status,404);
 assert.equal(review(root,report(root,observed)).verdict,'PASSED');
 }finally{records.delete(id);}
});
test('every claimed requirement needs its own passing assertion',t=>{
 const root=project(t),r=report(root);r.requirements.push({id:'AC-2',description:'Denied role never mutates',source:'fixture'});r.scenarios[0].references.push('AC-2');
 const result=review(root,r);assert.equal(result.verdict,'NOT_RUN');assert.equal(result.requirements[1].verification,'UNVERIFIED');
});
test('external TechSpec handoff reuses policy and preserves canonical source',t=>{
 const root=project(t);install(root,SOURCE,{command:'init',capabilities:['product']});report(root);const r=report(root);write(root,'report.json',r);
 write(root,'docs/approved.md','Approved user text');
 write(root,'.notth/artifacts.json',{schema_version:1,mode:'document-driven',inputs:{ba:{kind:'docs',location:{path:'docs/approved.md'},write_policy:'read-only'}},outputs:{docs:{kind:'docs',capability:'product',canonical:true,sources:['ba'],location:{url:'https://example.com/docs',connection:'wiki'},write_policy:'propose'}}});
 write(root,'.notth/integrations.json',{schema_version:1,connections:{wiki:{via:'mcp',binding:'existing-host-tool',purpose:'docs'}}});
 const result=newDoc(root,'techspec','product',{report:'report.json'});assert.equal(result.status,'planned');assert.equal(result.executed,false);assert.equal(result.write_policy,'propose');assert.match(result.template,/AC-1/);
 assert.equal(fs.readFileSync(path.join(root,'docs/approved.md'),'utf8'),'Approved user text');assert.ok(!fs.existsSync(path.join(root,'docs/product/techspec.md')));
});
test('redacted evidence accepted; exposed credential evidence rejected',t=>{
 const root=project(t);let r=report(root,{state:'approved',password:'[REDACTED]'});assert.equal(review(root,r).verdict,'PASSED');
 r=report(root,{state:'approved',password:'private-value'});assert.throws(()=>review(root,r),/Redact/);
});
test('malformed scripts fail safely and command secrets are not echoed',t=>{
 const root=project(t);write(root,'package.json',{scripts:[]});assert.throws(()=>adaptiveVerification(root,SOURCE),/scripts/);
 write(root,'package.json',{scripts:{test:'PRIVATE_COMMAND_VALUE'}});const result=adaptiveVerification(root,SOURCE);assert.ok(!JSON.stringify(result).includes('PRIVATE_COMMAND_VALUE'));
});
