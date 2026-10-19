# PR3 actual validation

- npm test: PASS, 375 tests, 0 failed/skipped (Node v24.19.0, Linux).
- npm run validate: PASS.
- npm run test:package: PASS, real offline global/local tarball and experience/template/eval assets.
- npm run test:python: PASS, offline wheel/sdist, shared bytes, preservation, missing Node, no npm/registry.
- npm run check:release: PASS, local metadata only, version unchanged at 0.18.0.
- Focused experience/memory/comparison/verification suite: PASS, 36 tests.
- compare-tasks adaptive template/report CLI: PASS; 42 NOT_RUN slots, 0 observed live runs, null success rates.
- git diff --check: PASS.

Source hashes and full actual logs are under evidence/. The deterministic concurrency fixture was run
separately and EXPECTEDLY FAILED (one pass, one failure, actual value 1 vs required 100); it is the
controlled benchmark starting defect, not an unresolved NOTTH test failure. Root npm test excludes
this explicitly documented fixture. No model was used to repair or evaluate it.

An initial focused external-source test used a future capture timestamp relative to UTC and correctly
failed provenance validation. Replaced it with stable past fixture timestamps; reran focused/full gates.

Live A–G trials: NOT_RUN. Host PATH discovery found no codex/claude/kiro client; current Work Mode
implementation tools are not an independently controlled continuation/interruption trial. The existing
Read-only hypothetical driver cannot execute these scenarios. No transcript, reviewer, score, tokens or
productivity improvement is fabricated. evaluation-status.json records unavailable trials and nulls.
PR1 (#70) and PR2 (#71) GitHub Harness CI were observed successful before preparing this PR.

Compatibility covered by existing released-snapshot/config/adapters/host bridge tests and package
checks. This local run is Linux Node24; remote CI owns Node22/Windows and Python matrix coverage.
No merge, package publish, tag, release or protection-setting change performed.

Remaining limits: metadata retrieval is not semantic search; a hash covers declared files, not all
semantic dependencies; experience eligibility needs host review and independent current-task checks;
receipts/report consistency do not independently authenticate execution or grant permissions.
