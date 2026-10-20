import { isDeepStrictEqual } from 'node:util';
import { inspectReferences } from './adaptive.js';
import { isObject, HarnessError } from './files.js';
import { redacted, reviewEvidence } from './verification-report.js';
const tasks=['spring-api','transaction-defect','maven-onboarding'];
const metrics=['human_correction_rounds','unnecessary_questions','accepted_criteria','total_criteria','elapsed_seconds','tokens','cost'];
export const ADAPTIVE_TASKS=['a-cross-host','b-interruption','c-unfamiliar','d-debug-replan','e-stale-knowledge','f-experience-reuse','g-permissions'];
const adaptiveMetrics=['incorrect_assumptions','human_interventions','recovery_success','unnecessary_repeated_steps','task_success','security_regressions'];
const controls=['model','runtime','host_version','starting_commit','permissions','budget'];
const notRun = row => ['UNPERFORMED','NOT_RUN'].includes(row.status);
const statuses=['UNPERFORMED','NOT_RUN','COMPLETED','FAILED','INTERRUPTED','BLOCKED'];
const requireThat=(v,m)=>{if(!v)throw new HarnessError('Invalid real-task comparison: '+m);};
export function comparisonTemplate(suite='legacy'){
 if(suite==='adaptive-core'){
  const report=comparisonTemplate();report.suite=suite;report.status='NOT_RUN';report.tasks=ADAPTIVE_TASKS;
  report.metadata={...report.metadata,host_version:null,permissions:null};
  report.runs=ADAPTIVE_TASKS.flatMap(task=>['without-harness','with-harness'].flatMap(condition=>[1,2,3].map(repeat=>({task_id:task,condition,repeat,status:'NOT_RUN',reason:'Controlled live-host scenario has not been executed',evidence:[],evidence_refs:[],execution_metadata:null,usage_source:null,currency:null,...Object.fromEntries([...metrics,...adaptiveMetrics].map(m=>[m,null]))}))));
  return report;
 }
 requireThat(suite==='legacy','unknown suite');
 return {schema_version:1,status:'unperformed',metadata:{model:null,runtime:null,harness_commit:null,starting_commit:null,budget:null},tasks,
   runs:tasks.flatMap(task=>['without-harness','with-harness'].flatMap(condition=>[1,2,3].map(repeat=>({task_id:task,condition,repeat,status:'UNPERFORMED',evidence:[],usage_source:null,currency:null,...Object.fromEntries(metrics.map(m=>[m,null]))}))))};
}
function distribution(values) {
 if(!values.length)return {observed_runs:0,median:null,min:null,max:null};
 const sorted=[...values].sort((a,b)=>a-b),i=Math.floor(sorted.length/2);
 return {observed_runs:values.length,median:sorted.length%2?sorted[i]:(sorted[i-1]+sorted[i])/2,min:sorted[0],max:sorted.at(-1)};
}
export function summarizeComparison(report,{root}={}){
 requireThat(isObject(report)&&report.schema_version===1&&isObject(report.metadata),'schema');redacted(report);
 const adaptive=report.suite==='adaptive-core', selectedMetrics=adaptive?[...metrics,...adaptiveMetrics]:metrics;
 requireThat(report.suite===undefined||adaptive,'unknown suite');
 requireThat(!adaptive||isDeepStrictEqual(report.tasks,ADAPTIVE_TASKS),'adaptive A–G task IDs');
 requireThat(Array.isArray(report.tasks)&&report.tasks.length===(adaptive?7:3)&&new Set(report.tasks).size===report.tasks.length&&report.tasks.every(t=>typeof t==='string'&&/^[a-z][a-z0-9-]*$/.test(t)),'unique task IDs for selected suite');
 requireThat(Array.isArray(report.runs)&&report.runs.length===report.tasks.length*6,'independent matched run slots');
 const ids=new Set();
 for(const row of report.runs){
  requireThat(isObject(row)&&report.tasks.includes(row.task_id)&&['with-harness','without-harness'].includes(row.condition)&&[1,2,3].includes(row.repeat),'task/condition/repeat');
  const id=row.task_id+'/'+row.condition+'/'+row.repeat;requireThat(!ids.has(id),'duplicate run');ids.add(id);
  requireThat(statuses.includes(row.status),'status');
  requireThat(Array.isArray(row.evidence)&&row.evidence.every(v=>typeof v==='string'&&v.trim()&&!/[\0\r\n]/.test(v)),'evidence');
  if(!notRun(row))requireThat(row.evidence.length>0,'observed run needs evidence');
  for(const m of selectedMetrics){requireThat(row[m]===null||(typeof row[m]==='number'&&Number.isFinite(row[m])&&row[m]>=0),'metric '+m);
    if(['human_correction_rounds','unnecessary_questions','accepted_criteria','total_criteria','tokens',...adaptiveMetrics].includes(m)&&row[m]!==null)requireThat(Number.isSafeInteger(row[m]),'integer metric '+m);
  }
  if(notRun(row))requireThat(selectedMetrics.every(m=>row[m]===null),'unperformed metrics must stay null');
  if(adaptive){
   requireThat(Array.isArray(row.evidence_refs),'evidence refs');
   if(notRun(row)){requireThat(typeof row.reason==='string'&&row.reason.trim()&&row.evidence_refs.length===0&&row.execution_metadata===null,'unrun reason/no execution');}
   else{
    requireThat(typeof root==='string','project root required for evidence validation');
    requireThat(inspectReferences(root,row.evidence_refs).every(r=>r.freshness==='current'),'current digest-checked evidence');
    reviewEvidence(root,row.evidence_refs);
    requireThat(isObject(row.execution_metadata)&&controls.every(k=>typeof report.metadata[k]==='string'&&report.metadata[k].trim()&&row.execution_metadata[k]===report.metadata[k]),'matching model/host/version/revision/permissions/budget');
    for(const key of ['task_success','recovery_success'])requireThat(row[key]===null||[0,1].includes(row[key]),'binary observed outcome');
    if(row.task_success===1)requireThat(row.status==='COMPLETED'&&row.total_criteria>0&&row.accepted_criteria===row.total_criteria&&row.security_regressions===0,'success needs acceptance and no safety regression');
   }
  }
  if(row.accepted_criteria!==null)requireThat(row.total_criteria!==null&&row.accepted_criteria<=row.total_criteria,'accepted/total criteria');
  if(row.tokens!==null||row.cost!==null)requireThat(typeof row.usage_source==='string'&&row.usage_source.trim(),'actual usage source');
  if(row.cost!==null)requireThat(typeof row.currency==='string'&&row.currency.trim(),'cost currency');
 }
 const currencies=new Set(report.runs.filter(r=>r.cost!==null).map(r=>r.currency));
 requireThat(currencies.size<=1,'mixed cost currencies');
 for(const task of report.tasks)requireThat(new Set(report.runs.filter(r=>r.task_id===task&&r.total_criteria!==null).map(r=>r.total_criteria)).size<=1,'inconsistent acceptance totals');
 const observed=report.runs.some(r=>!notRun(r));
 if(observed)for(const key of ['model','runtime','harness_commit','starting_commit'])requireThat(typeof report.metadata[key]==='string'&&report.metadata[key].trim(),'metadata '+key);
 const summaries=report.tasks.flatMap(task=>['without-harness','with-harness'].map(condition=>{
  const rows=report.runs.filter(r=>r.task_id===task&&r.condition===condition);
  const successes=adaptive?rows.map(r=>r.task_success).filter(v=>v!==null):[];
  return {task_id:task,condition,...(adaptive?{task_success_rate:successes.length?successes.reduce((a,b)=>a+b,0)/successes.length:null,observed_outcomes:successes.length}:{}),statuses:Object.fromEntries(statuses.map(s=>[s,rows.filter(r=>r.status===s).length])),
    metrics:Object.fromEntries(selectedMetrics.map(m=>[m,distribution(rows.map(r=>r[m]).filter(v=>v!==null))]))};
 }));
 return {status:'ok',executed:false,observed_runs:report.runs.filter(r=>!notRun(r)).length,summaries,
  note:'Summarizes manually supplied observations only. Null is unknown, not zero. Retain all failures/interruptions; independently review evidence, equal acceptance criteria and matching model/task/budget. No productivity claim or model execution is inferred.'};
}
