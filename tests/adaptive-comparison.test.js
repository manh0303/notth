import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { comparisonTemplate, summarizeComparison, ADAPTIVE_TASKS } from '../cli/comparison.js';
import { digest } from '../cli/files.js';
test('A–G matched template preserves null outcomes and legacy comparison remains unchanged', () => {
  const report = comparisonTemplate('adaptive-core'); assert.deepEqual(report.tasks, ADAPTIVE_TASKS); assert.equal(report.runs.length, 42);
  assert.ok(report.runs.every(r => r.status === 'NOT_RUN' && r.tokens === null));
  const summary = summarizeComparison(report); assert.equal(summary.observed_runs, 0); assert.ok(summary.summaries.every(s => s.task_success_rate === null));
  assert.equal(comparisonTemplate().runs.length, 18); assert.throws(() => comparisonTemplate('unknown'));
  report.runs[0].task_success = 1; assert.throws(() => summarizeComparison(report), /unperformed/);
});
test('observed comparisons require matching controls, raw hashes and visible safety regressions', t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(),'notth-comparison-')); t.after(() => fs.rmSync(root,{recursive:true,force:true}));
  const body = 'Synthetic report-validator observation, not a live host trial'; fs.writeFileSync(path.join(root,'evidence.txt'),body);
  const report = comparisonTemplate('adaptive-core');
  Object.assign(report.metadata,{model:'fixture-model',runtime:'fixture-host',host_version:'fixture-v1',harness_commit:'fixture-source',starting_commit:'fixture-baseline',permissions:'Read/Edit/Test; no remote writes',budget:'60 seconds'});
  const row = report.runs[0]; Object.assign(row,{status:'COMPLETED',reason:'Report parser fixture only',evidence:['evidence.txt'],evidence_refs:[{path:'evidence.txt',sha256:digest(Buffer.from(body))}],execution_metadata:Object.fromEntries(['model','runtime','host_version','starting_commit','permissions','budget'].map(k=>[k,report.metadata[k]])),accepted_criteria:2,total_criteria:2,task_success:1,security_regressions:0});
  assert.equal(summarizeComparison(report,{root}).observed_runs,1);
  row.execution_metadata.host_version='different'; assert.throws(()=>summarizeComparison(report,{root}),/matching/); row.execution_metadata.host_version='fixture-v1';
  row.security_regressions=1; assert.throws(()=>summarizeComparison(report,{root}),/safety regression/); row.task_success=0; row.status='FAILED';
  assert.equal(summarizeComparison(report,{root}).summaries[0].metrics.security_regressions.max,1);
  row.tokens=100; assert.throws(()=>summarizeComparison(report,{root}),/usage/); row.tokens=null;
  const secret='Bearer abcdefghijklmnop'; fs.writeFileSync(path.join(root,'evidence.txt'),secret); row.evidence_refs[0].sha256=digest(Buffer.from(secret)); assert.throws(()=>summarizeComparison(report,{root}),/Redact/);
  fs.writeFileSync(path.join(root,'evidence.txt'),'changed'); assert.throws(()=>summarizeComparison(report,{root}),/digest-checked/);
});
