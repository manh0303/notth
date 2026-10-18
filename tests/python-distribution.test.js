import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { assertSeparate } from '../cli/files.js';

test('Python overlap exception accepts notth and legacy markers only in .venv site-packages', t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'notth-marker-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  for (const location of ['.venv/Lib/site-packages/ai_harness/_bundle', 'other/ai_harness/_bundle']) {
    const source = path.join(root, location);
    fs.mkdirSync(source, { recursive: true });
    for (const name of ['notth', 'manhd-ai-harness', 'unrelated']) {
      fs.writeFileSync(path.join(source, '_python_distribution.json'), JSON.stringify({ name }));
      if (location.startsWith('.venv/') && name !== 'unrelated') {
        assert.doesNotThrow(() => assertSeparate(root, source));
      } else {
        assert.throws(() => assertSeparate(root, source), /must not overlap/);
      }
    }
  }
});
