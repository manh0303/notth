#!/usr/bin/env node
// Explicit host execution only. Never imported by the installer or lifecycle runtime.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { parseArgs } from 'node:util';
import { pathToFileURL } from 'node:url';
import { install, newChange, SOURCE, digest } from '../cli/harness.js';
import { processRun } from './conformance-runner.js';

const executables = { codex: 'codex', 'claude-code': 'claude', kiro: 'kiro-cli' };
export function hostArguments(host, model) {
  if (host === 'codex') return ['exec', '--skip-git-repo-check', '--json', '--sandbox', 'workspace-write', '--model', model, '-'];
  if (host === 'claude-code') return ['-p', '--verbose', '--output-format', 'stream-json', '--model', model];
  throw new Error('Kiro command lifecycle integration is not verified');
}
export function interruptedRun(executable, args, cwd, prompt, timeout, marker) {
  return new Promise((resolve, reject) => {
    const child = spawn(executable, args, { cwd, shell: false, stdio: ['pipe','pipe','pipe'] });
    let stdout = '', stderr = '', size = 0, interrupted = false, timedOut = false, overflow = false;
    let force;
    const stop = () => { child.kill('SIGTERM'); force ??= setTimeout(() => child.kill('SIGKILL'), 5000); };
    const poll = setInterval(() => { if (!interrupted && fs.existsSync(marker)) { interrupted = true; stop(); } }, 25);
    const timer = setTimeout(() => { timedOut = true; stop(); }, timeout);
    const hard = setTimeout(() => child.kill('SIGKILL'), timeout + 5000);
    for (const [stream, key] of [[child.stdout, 'out'], [child.stderr, 'err']]) stream.on('data', data => {
      size += data.length; if (size > 8 * 1024 * 1024) { overflow = true; stop(); return; }
      if (key === 'out') stdout += data; else stderr += data;
    });
    const clear = () => { clearInterval(poll); clearTimeout(timer); clearTimeout(hard); clearTimeout(force); };
    child.stdin.on('error', () => {}); child.stdin.end(prompt);
    child.on('error', error => { clear(); reject(error); });
    child.on('close', (code, signal) => { clear(); resolve({ code, signal, stdout, stderr, interrupted, timedOut, overflow }); });
  });
}
function receipts(root) {
  const folder = path.join(root, '.notth/sessions');
  if (!fs.existsSync(folder)) return [];
  return fs.readdirSync(folder, { withFileTypes: true }).filter(d => d.isDirectory()).flatMap(d => {
    const events = path.join(folder, d.name, 'events');
    return fs.existsSync(events) ? fs.readdirSync(events).map(name => JSON.parse(fs.readFileSync(path.join(events, name)))) : [];
  });
}
export async function runRecovery(options, runHost = processRun, interrupt = interruptedRun) {
  const { out, host = 'all', execute = false, model, timeout = 120000 } = options;
  if (!out || !(host === 'all' || Object.hasOwn(executables, host))) throw new Error('Supply --out and a supported --host');
  if (execute && (host === 'all' || !model?.trim())) throw new Error('Execution requires one explicit --host and --model');
  if (!Number.isSafeInteger(timeout) || timeout < 1000 || timeout > 1800000) throw new Error('Invalid timeout');
  const directory = path.resolve(out); fs.mkdirSync(directory); // Exclusive: never overwrite evidence.
  const summary = { schema_version: 1, kind: 'native-session-recovery-trial', status: 'NOT_RUN', model: model ?? null, node: process.version, runner_sha256: digest(fs.readFileSync(new URL(import.meta.url))), started_at: new Date().toISOString(),
    boundary: 'Fixture tests and version probes are not live recovery passes. Hook receipts are unauthenticated local evidence. No automatic native-compaction trigger is tested.', rows: [] };
  const save = (name, value) => fs.writeFileSync(path.join(directory, name), JSON.stringify(value, null, 2) + '\n', { mode: 0o600 });
  for (const target of host === 'all' ? Object.keys(executables) : [host]) {
    const row = { host: target, status: 'NOT_RUN', reason: 'Awaiting explicit --execute, model and successful native evidence' }; summary.rows.push(row);
    let scratch;
    try {
      const probe = await runHost(executables[target], ['--version'], directory, '', 10000);
      save(target + '-probe.json', probe);
      if (probe.code !== 0 || probe.timedOut || probe.overflow) { row.status = 'BLOCKED'; row.reason = 'Executable version probe failed'; continue; }
      row.version = probe.stdout.trim();
      if (target === 'kiro') { row.status = 'BLOCKED'; row.reason = 'Native command lifecycle bridge unverified; no recovery pass claimed'; continue; }
      if (!execute) continue;
      scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'notth-native-recovery-'));
      install(scratch, SOURCE, { host: target, sessionHooks: true });
      row.bundle_sha256 = JSON.parse(fs.readFileSync(path.join(scratch, '.notth/lock.json'))).bundle_sha256;
      newChange(scratch, 'recovery-trial');
      const base = 'openspec/changes/recovery-trial/', challenge = randomBytes(16).toString('hex');
      const write = (name, value) => fs.writeFileSync(path.join(scratch, name), JSON.stringify(value, null, 2));
      const context = { schema_version: 1, change_id: 'recovery-trial', intent: { problem: 'A new session must recover saved work without repeated instructions', outcome: 'Write recovery-result.json with exactly {"recovered":"' + challenge + '"} after the interruption' },
        sources: [{ id: 'request', path: base + 'proposal.md', sha256: digest(fs.readFileSync(path.join(scratch, base + 'proposal.md'))), locator: 'Why' }], links: [] };
      write(base + 'context.json', context);
      const checkpoint = { schema_version: 1, change_id: 'recovery-trial', phase: 'implementation', timestamp: new Date().toISOString(), summary: 'Task intentionally interrupted', next_action: context.intent.outcome,
        baseline: [], completed: [], pending: [{ id: 'recover', summary: context.intent.outcome }], in_progress: null, blockers: [], external_sources: [], operations: [] };
      write(base + 'checkpoint.json', checkpoint);
      const args = hostArguments(target, model), marker = path.join(scratch, 'interrupt-ready.json');
      const first = await interrupt(executables[target], args, scratch,
        'This is an interruption test. Inspect the saved task and checkpoint. Create interrupt-ready.json with {"ready":true}, then keep inspecting the task; the test driver will interrupt you. Do not produce recovery-result.json in this session.', timeout, marker);
      save(target + '-first.json', first);
      const firstReceipts = receipts(scratch); save(target + '-first-hooks.json', firstReceipts);
      if (!first.interrupted || first.timedOut || first.overflow || fs.existsSync(path.join(scratch, 'recovery-result.json'))) { row.status = 'BLOCKED'; row.reason = 'No clean observed interruption boundary'; continue; }
      const second = await runHost(executables[target], args, scratch, 'Continue the saved task in this project and finish its pending work.', timeout);
      save(target + '-second.json', second);
      const allReceipts = receipts(scratch); save(target + '-all-hooks.json', allReceipts);
      const starts = allReceipts.filter(r => r.event === 'SessionStart' && r.host === target && r.change_id === 'recovery-trial');
      const distinctSessions = new Set(starts.map(r => r.session_id)).size;
      let result = null; try { result = JSON.parse(fs.readFileSync(path.join(scratch, 'recovery-result.json'))); } catch { /* Failed assertion below. */ }
      row.assertions = { interrupted: first.interrupted, fresh_native_sessions: distinctSessions >= 2, first_hook_observed: firstReceipts.some(r => r.event === 'SessionStart'),
        successful_second_exit: second.code === 0 && !second.timedOut && !second.overflow, correct_result: result?.recovered === challenge && Object.keys(result).length === 1 };
      row.status = !row.assertions.successful_second_exit ? 'BLOCKED' : Object.values(row.assertions).every(Boolean) ? 'PASS' : 'FAIL';
      row.reason = 'Inspect transcripts and producer-declared hook receipts; this is one fixture, not a universal recovery guarantee';
      save(target + '-fixture.json', { context, checkpoint, result });
    } catch (error) { row.status = 'BLOCKED'; row.reason = error.code === 'ENOENT' ? 'Executable unavailable on PATH' : 'Host trial failed: ' + error.message; }
    finally { if (scratch) fs.rmSync(scratch, { recursive: true, force: true }); save('summary.json', summary); }
  }
  summary.status = summary.rows.every(r => r.status === 'PASS') ? 'PASS' : summary.rows.some(r => r.status === 'FAIL') ? 'FAIL' : summary.rows.some(r => r.status === 'BLOCKED') ? 'BLOCKED' : 'NOT_RUN';
  save('summary.json', summary); return summary;
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    const { values, positionals } = parseArgs({ options: { out: { type: 'string' }, host: { type: 'string' }, model: { type: 'string' }, execute: { type: 'boolean' }, timeout: { type: 'string' } } });
    if (positionals.length) throw new Error('Unexpected positional argument');
    const summary = await runRecovery({ ...values, timeout: values.timeout === undefined ? undefined : Number(values.timeout) });
    console.log(JSON.stringify(summary, null, 2)); process.exitCode = ['PASS', 'NOT_RUN'].includes(summary.status) ? 0 : 1;
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
