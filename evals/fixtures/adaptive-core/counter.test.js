import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createCounter } from './counter.js';
test('isolated counters and sequential increments', async () => {
  const a = createCounter(), b = createCounter();
  assert.equal(await a.increment(), 1); assert.equal(await a.increment(), 2);
  assert.equal(a.read(), 2); assert.equal(b.read(), 0);
});
test('concurrent increments preserve all accepted updates', async () => {
  const counter = createCounter();
  await Promise.all(Array.from({ length: 100 }, () => counter.increment()));
  assert.equal(counter.read(), 100);
});
