# PR 1 verification

Baseline main c378465: npm test PASS (359 tests). Candidate:
- npm test PASS, 362 tests, 0 failed/skipped.
- npm run validate PASS (offline structure).
- npm run test:package PASS, real offline npm tarball global/local install including memory/handoff.
- node --test tests/memory.test.js tests/evals.test.js PASS after final scope/eval updates.
- git diff --check PASS.

Actual logs and scoped source hashes: evidence/. Package smoke was run twice after adding packaged
memory/handoff checks. No model, registry publication or remote write was used by these checks.
Live cross-host continuation: NOT_RUN — no Claude Code/Kiro runtime connected to this workspace.
Offline child-process CLI recovery verifies shared serialization only. Source digests identify tested
implementation bytes; evidence documentation itself is written after execution.
