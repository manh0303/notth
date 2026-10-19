# Verification evidence

Environment: Linux, Node.js 24.19.0, npm 11.9.0. Executed 2026-10-19 against the feature worktree.

| Check | Result | Observed evidence |
| --- | --- | --- |
| npm test | PASSED | 349 tests, 349 pass, 0 fail, 0 skipped; final run duration 29097.13 ms |
| npm run validate | PASSED | status ok, 6 adapters, 8 capabilities, 365 managed files, errors [] |
| npm run check:release | PASSED | status ok, distribution 0.18.0, 14 modules; no publish |
| npm run test:package | PASSED | status ok, 418 package files; actual offline npm pack/global/local install and installed context/save/resume fixture |
| git diff --check | PASSED | No whitespace errors |
| Live AI host continuity | NOT_RUN | Protocol in evals/session-continuity.md; no model invocation or universal client loading claim |
| Live Beads/Dolt coordination | NOT_RUN | Optional host contract only; no installed provider/runtime exercised |
| Windows / Node 22 | NOT_RUN locally | Existing GitHub Actions matrix remains responsible; no local portability result claimed |

## Behavioral coverage
tests/task-context.test.js exercises fresh CLI processes recovering intent through start/chat;
explicit alpha scope after another session saves beta; changed sources invalidating transitive
links and checkpoint recovery; newer imported revisions superseding unchanged old snapshots;
digest/revision conflicts and actual concurrent child-process writers; history retention;
malformed references, cycles, missing files, unsafe paths, credentials and symlinks; optional legacy
state, update preservation and unverified Beads marker/mapping. All nine tests passed, including schema-2 external capture/freshness integration.

scripts/smoke-package.js verifies packaged CLI/workflow/integration/template presence and performs
context save/read/resume using the actual installed package. Existing Core install/update and
configuration preservation checks remain passing. No new runtime dependency, executable installer
network/shell path, model, global agent setting, auto-merge or publish was introduced.

## Review boundary and next owner
Static implementation review checked module cycles at runtime through the full suite, path/size
bounds, guarded local writes and historical data preservation. Source locators, approval, semantic
accuracy, remote revisions and Beads ownership still require actual host inspection. Human reviews
and merges this feature PR; Release Please handles the subsequent distribution release separately.
