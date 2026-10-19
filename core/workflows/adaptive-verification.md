# Adaptive verification

Load `harness-verification` after scoped discovery and before review. Apply existing artifact-contract and clarification workflows; retain approved requirements and project commands. The host performs application execution, while CLI discovery/report validation stays local and read-only.

Choose applicable verification methods from feature risk and existing tooling, retain negative and regression scenarios, isolate fixtures, and record exact business assertions. Link results and gaps to requirement IDs. Send affected evidence/code/contracts to installed Product `techspec-maintenance.md`; without Product, attach evidence to the existing OpenSpec change. Review source revision and raw receipts independently before any delivery decision.

On resume, use `continuous-development.md` to compare the tested revision with the current baseline.
Re-run affected checks after code/spec changes; a previous PASS does not verify a new revision.

For changed public journeys or an explicit end-user testing request, apply
`.notth/core/workflows/end-user-acceptance.md` and `harness-end-user-testing`: exercise the actual
interface, distinguish real/mocked dependencies, and include user-facing outcome evidence or concrete
BLOCKED/NOT_RUN reasons before completion. API/unit/build success cannot replace required browser/device flows.

For long-lived services, grouped scenarios or interruption recovery, use `.notth/core/workflows/recoverable-verification.md`. Persist evidence/draft updates after each meaningful group and retain prior results only while their relevant baseline remains valid.
