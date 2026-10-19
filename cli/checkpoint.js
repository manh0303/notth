import { taskContextReport } from './task-context.js';
import fs from 'node:fs';
import { safe, stat, digest, isObject, HarnessError } from './files.js';
import { readConfig } from './project-config.js';
import { redacted } from './verification-report.js';
const requireThat=(v,m)=>{if(!v)throw new HarnessError('Invalid checkpoint: '+m);};
const text=v=>typeof v==='string'&&v.trim().length>0&&v.length<=1024&&!/[\0\r\n]/.test(v);
export function checkpointPath(id) {
  requireThat(typeof id==='string'&&/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(id)&&id!=='archive','change ID');
  return 'openspec/changes/'+id+'/checkpoint.json';
}
function references(root,rows,verify=false) {
  requireThat(Array.isArray(rows),'reference list');
  return rows.map(r=>{
    requireThat(isObject(r)&&text(r.path)&&/^[a-f0-9]{64}$/.test(r.sha256),'local reference/digest');
    const p=safe(root,r.path),info=stat(p);
    requireThat(info?.isFile()&&info.size<=1024*1024,'reference missing/oversized');
    const actual=digest(fs.readFileSync(p));if(verify)requireThat(actual===r.sha256,'evidence digest mismatch');
    return {...r,current_sha256:actual,current:actual===r.sha256};
  });
}
export function validateCheckpoint(root,id,row) {
  requireThat(isObject(row)&&row.schema_version===1&&row.change_id===id,'schema/change mismatch');redacted(row);
  requireThat(text(row.phase)&&text(row.summary)&&text(row.next_action),'phase/summary/next action');
  requireThat(typeof row.timestamp==='string'&&/T.*(?:Z|[+-]\d\d:\d\d)$/.test(row.timestamp)&&Number.isFinite(Date.parse(row.timestamp)),'timezone timestamp');
  references(root,row.baseline);
  requireThat(Array.isArray(row.completed)&&Array.isArray(row.pending)&&Array.isArray(row.blockers),'task lists');
  const ids=new Set();
  for(const task of [...row.completed,...row.pending,...(row.in_progress?[row.in_progress]:[])]){
    requireThat(isObject(task)&&text(task.id)&&!ids.has(task.id)&&text(task.summary),'unique task ID/summary');ids.add(task.id);
  }
  for(const task of row.completed)requireThat(references(root,task.evidence,true).length>0,'completed task needs evidence');
  requireThat(row.in_progress===null||isObject(row.in_progress),'in_progress');
  requireThat(row.blockers.every(text),'blockers');
  requireThat(Array.isArray(row.external_sources)&&row.external_sources.every(s=>isObject(s)&&text(s.location)&&text(s.revision)),'external source declarations');
  requireThat(Array.isArray(row.operations),'operation list');const operations=new Set();
  for(const op of row.operations){
    requireThat(isObject(op)&&text(op.id)&&!operations.has(op.id)&&text(op.action)&&text(op.target)&&['prepared','completed','unknown'].includes(op.status),'operation receipt');operations.add(op.id);
    const refs=references(root,op.evidence,true);if(op.status==='completed')requireThat(refs.length>0,'completed operation needs evidence');
  }
  if(row.usage!==undefined){
    requireThat(isObject(row.usage)&&text(row.usage.source),'measured usage source');
    for(const k of ['tokens','cost','remaining_tokens'])if(row.usage[k]!==null&&row.usage[k]!==undefined)requireThat(Number.isFinite(row.usage[k])&&row.usage[k]>=0,'usage');
    if(row.usage.cost!==null&&row.usage.cost!==undefined)requireThat(text(row.usage.currency),'cost currency');
  }
  return row;
}
export function resumePlan(root,id) {
  const name=checkpointPath(id),row=readConfig(root,name);requireThat(row!==null,'checkpoint missing');validateCheckpoint(root,id,row);
  const baseline=references(root,row.baseline),pendingOperations=row.operations.filter(o=>o.status!=='completed');
  const taskContext=taskContextReport(root,id);
  const revalidate=baseline.some(r=>!r.current)||taskContext.status==='blocked';
  return {status:row.blockers.length?'blocked':'planned',executed:false,change_id:id,checkpoint:name,
    checkpoint_sha256:digest(fs.readFileSync(safe(root,name))),baseline,revalidate_required:revalidate,
    task_context:taskContext,
    phase:row.phase,summary:row.summary,completed:row.completed,pending:row.pending,in_progress:row.in_progress,blockers:row.blockers,
    next_action:row.next_action,operations_to_reconcile:pendingOperations,
    external_sources:row.external_sources.map(s=>({...s,availability:'unverified'})),usage:row.usage??null,
    note:'Read-only recovery plan. Reconcile changed sources, completed evidence and unknown/prepared side effects against actual host/remote state before retrying. Receipts and usage are producer-declared; no remote operation, model or quota probe.'};
}
