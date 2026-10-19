---
name: harness-verification
description: Select proportional project checks and report requirement-linked runtime evidence without false PASS claims.
---

# Adaptive verification

## Input
Approved requirements/AC, scoped code and contracts, existing project tests/commands, artifact sources and actual host permissions.

## Procedure
1. Discover languages, frameworks, architecture, routes/auth, data dependencies, existing docs and test entry points. `aih verify --adaptive` supplies metadata hints only; inspect scoped source and record unknowns.
2. Select needed unit, integration, API/contract, backend/browser/mobile E2E, authorization/security, regression or AI/RAG evaluation. Reuse existing frameworks. A static site needs no invented API; a mobile app needs no forced browser suite.
For changed public journeys or an explicit end-user request, load harness-end-user-testing and the
   installed end-user-acceptance workflow; use the actual interface and distinguish real/mocked scope.
3. Derive scenarios from requirements: CRUD, approval/roles, state transitions, uploads, asynchronous events, transactions or external integrations only when applicable. Record preconditions, isolated fixtures, steps, expected business assertions, cleanup and evidence.
4. Check actual tools, permissions and environment. Declare BLOCKED for missing infrastructure/access; NOT_RUN for skipped scope. Agree consequential gaps using existing clarification workflow.
5. Execute through authorized host tools with bounded timeouts/retries. Assert transport plus business/schema/state/authorization semantics. Expected errors require exact HTTP/application assertions; timeout/network exceptions never pass by default.
6. Capture redacted raw observations, digests, executed command/tool, revision, timestamp/environment, expected/observed, error category and fixture cleanup. Record cost/tokens only from actual measurements. Use the report contract in the guide and `aih verify --report` for consistency validation.
7. Report requirement coverage VERIFIED only with linked passing evidence; otherwise UNVERIFIED. Review raw execution independently and hand affected documentation to Product TechSpec maintenance.

## Engineering depth
Create a compact risk-to-evidence matrix in the existing task/report: requirement ID → risk → scenario
→ test layer → real/mocked dependencies → revision/evidence/result. Prioritize distinguishing outcomes
over duplicating every test at every layer. Public contract changes need consumer/compatibility checks;
data invariants need actual vendor integration/concurrency evidence when semantics matter. Code coverage
alone is not acceptance. Changed requirements invalidate their old evidence even if code is unchanged.
For performance record workload, baseline/candidate environment and measurements; never infer faster
execution from a recommended pattern. Reuse recoverable-verification checkpoints for long checks.

## Output
Proportional verification plan, PASSED/FAILED/BLOCKED/NOT_RUN scenario report, VERIFIED/UNVERIFIED requirement coverage and unresolved limitations.

## Constraints
No killing by port, production/shared database fixture edits, MAX(ID)+1 IDs, embedded credentials or blanket catch-as-success. Use test-owned IDs and cleanup only owned fixtures. Permission enforcement belongs to the host. Static inspection and producer-declared receipts are not independent runtime proof. Reuse harness-tdd/debugging/ai-evaluation rather than creating a runner or making paid model calls each PR.

## Recoverable execution
For long-lived processes or grouped checks read `.notth/core/workflows/recoverable-verification.md`. Use actual host background/session support and reviewed project commands, bounded readiness checks and owned cleanup. Save evidence and draft updates per meaningful group through existing checkpoints; revalidate requirements/code/config/fixtures and uncertain side effects on resume. Related user journeys come from the accepted scope, not a fixed domain template.
