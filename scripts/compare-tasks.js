#!/usr/bin/env node
import fs from 'node:fs';
import { safe, stat, HarnessError } from '../cli/files.js';
import { comparisonTemplate, summarizeComparison } from '../cli/comparison.js';
try {
 const args=process.argv.slice(2);let result;
 if(args.length===1&&args[0]==='--template')result=comparisonTemplate();
 else if(args.length===3&&args[0]==='--template'&&args[1]==='--suite')result=comparisonTemplate(args[2]);
 else if(args.length===2&&args[0]==='--report'){
  const p=safe(process.cwd(),args[1]),info=stat(p);
  if(!info?.isFile()||info.size>1024*1024)throw new HarnessError('Report missing or exceeds 1 MiB');
  let row;try{row=JSON.parse(fs.readFileSync(p,'utf8'));}catch{throw new HarnessError('Invalid comparison JSON');}
  result=summarizeComparison(row,{root:process.cwd()});
 }else throw new HarnessError('Usage: node scripts/compare-tasks.js --template [--suite adaptive-core] | --report project-relative.json');
 console.log(JSON.stringify(result,null,2));
}catch(error){console.error(JSON.stringify({status:'error',message:error.message}));process.exitCode=1;}
