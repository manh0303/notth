# Kiro-only candidate verification

Historical tested candidate: commit 100b25d50c043bb14c9ce9b3fb980fde24340bbe.
PR scope subsequently expands into cross-host activation; use the sibling cross-host-activation
verification record for final candidate results. Digests below identify the earlier candidate.

Base: main 5cef4a47c9d94f0a451338c6d4db77ab1f73e369. Candidate branch: fix/kiro-memory-capture.

- node --test tests/session-onboarding.test.js: PASS, 12 tests, 0 failed/skipped.
- npm test: PASS, 375 tests, 0 failed/skipped.
- npm run validate: PASS, no structural errors.
- npm run test:package: PASS, real tarball global/local/offline installation and portable Kiro bridge.
- git diff --check: PASS.

Tests cover default capture registrations without session-hooks, an older SessionStart-only managed
bridge update, read-only dry-run, existing drift/collision protections and preserved source/task files.
Other existing tests verify CLI source/context/checkpoint semantics, not agent obedience.
Native Kiro execution: NOT_RUN. No Kiro IDE/CLI is connected here. The owner's earlier failure was
reported, not reproduced against an observed client/version/payload. New hooks require the reviewed
bundle installed into the consumer and Kiro reloaded. Agent prompts depend on actual hook execution,
model compliance and file/tool permissions; deterministic automatic source capture is not implemented.
Use evals/session-continuity.md's Kiro trial before advertising successful native persistence.
No merge, release, registry publication or remote source update is part of this change.

Tested behavioral source digests:
- cli/kiro.js: `1d07470cac5add2da63998e2be40798bed19738f3d4bcb57db8fae2644be4eb5`
- core/workflows/session-continuity.md: `86dc4bdadf02c237406466cd9601c936a13dc22a511f3e92611035c5868c322f`
- core/evals/cases.json: `61d1f3fdf009bd9e8b26cb247b88b4b864d2f3a9ec40a7b95ba2eda145c5ac75`
- tests/session-onboarding.test.js: `f74f62e084d6dfb6ab34e32ed3840eaecb01b0da39463b08d2570cfbe6b926a9`
