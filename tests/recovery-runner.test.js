import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { runRecovery, hostArguments, interruptedRun } from '../scripts/recovery-runner.js';
test('unavailable hosts are BLOCKED, probes cannot become recovery passes and evidence cannot be overwritten', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'notth-trials-'));
  try {
    const missing = async () => { const error = new Error('missing'); error.code = 'ENOENT'; throw error; };
    const report = await runRecovery({ out: path.join(root, 'missing') }, missing);
    assert.equal(report.status, 'BLOCKED'); assert.equal(report.rows.length, 3);
    assert.ok(report.rows.every(r => r.reason === 'Executable unavailable on PATH'));
    const probe = async () => ({ code: 0, stdout: 'fixture-version', stderr: '' });
    const planned = await runRecovery({ out: path.join(root, 'planned'), host: 'codex' }, probe);
    assert.equal(planned.status, 'NOT_RUN');
    await assert.rejects(runRecovery({ out: path.join(root, 'planned') }, probe), /EEXIST/);
    await assert.rejects(runRecovery({ out: path.join(root, 'no-model'), host: 'codex', execute: true }, probe), /model/);
    assert.throws(() => hostArguments('kiro', 'test'), /unverified|not verified/);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});
test('interruption driver observes marker and terminates its child process (protocol fixture, not live AI)', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'notth-interrupt-'));
  try {
    const marker = path.join(root, 'ready.json');
    const result = await interruptedRun(process.execPath, ['-e', "require('node:fs').writeFileSync('ready.json','{}');setInterval(()=>{},1000)"], root, '', 2000, marker);
    assert.equal(result.interrupted, true); assert.equal(result.timedOut, false); assert.equal(result.signal, 'SIGTERM');
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});
