# Adaptive execution and recovery

## Why
Recovery instructions lack durable bounded attempt/replan enforcement and current-code completion binding.

## What changes
Optional adaptive state in existing checkpoint, raw-evidence and scoped-revision verification, actionable stale recovery.
PR2 stacks on feat/adaptive-core-memory (PR #70); owner merge order 1 → 2 → 3. No runtime or release.
