# Adaptive verification

Load `harness-verification` after scoped discovery and before review. Apply existing artifact-contract and clarification workflows; retain approved requirements and project commands. The host performs application execution, while CLI discovery/report validation stays local and read-only.

Choose applicable verification methods from feature risk and existing tooling, retain negative and regression scenarios, isolate fixtures, and record exact business assertions. Link results and gaps to requirement IDs. Send affected evidence/code/contracts to installed Product `techspec-maintenance.md`; without Product, attach evidence to the existing OpenSpec change. Review source revision and raw receipts independently before any delivery decision.

Before concluding a test is BLOCKED, perform bounded, feature-scoped discovery in configured
evidence roots and relevant sibling folders: inspect related README, scripts and logs for the same
feature and test case. Record paths searched and missing facts. Compare the recorded gateway,
actual target and database identity, isolation confirmation, fixture policy, scope and source/code
revision with current observations. Resolve conflicts or stale/unknown identity before dependent
writes. A historic PASS remains historic, and a declaration or earlier approval is not permission
for the current operation. Continue independent checks and report exact remaining blockers.

Optional `environment.json` test_environments records gateway variable names and sourced claims;
read the original confirmation and check its applicability. CLI schema validation neither resolves
the gateway nor establishes isolation, authorization or fixture safety. Never include secrets.

On resume, use `continuous-development.md` to compare the tested revision with the current baseline.
Re-run affected checks after code/spec changes; a previous PASS does not verify a new revision.

For changed public journeys or an explicit end-user testing request, apply
`.notth/core/workflows/end-user-acceptance.md` and `harness-end-user-testing`: exercise the actual
interface, distinguish real/mocked dependencies, and include user-facing outcome evidence or concrete
BLOCKED/NOT_RUN reasons before completion. API/unit/build success cannot replace required browser/device flows.

For long-lived services, grouped scenarios or interruption recovery, use `.notth/core/workflows/recoverable-verification.md`. Persist evidence/draft updates after each meaningful group and retain prior results only while their relevant baseline remains valid.
