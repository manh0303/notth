---
name: harness-debugging
description: Diagnose a reproducible defect before changing production code.
---

# debugging

## Input
Observed symptom, expected result, redacted reproduction data and environment.
## Procedure
1. Establish a repeatable test or observation of the exact symptom.
2. Minimize inputs and isolate the boundary. For intermittent behavior record frequency and seed.
3. List ranked hypotheses with distinguishing predictions; test one at a time.
4. Repair the supported cause and keep a regression test.
5. Verify adjacent cases and explain the causal chain.
## Engineering depth
Before patching, distinguish observations from hypotheses: inspected revision, exact expected/observed
result, minimal reproducer, logs/trace across the failing boundary, and one falsifiable prediction per
hypothesis. Change one cause variable at a time. If repeated attempts fail, stop speculative patching,
revisit assumptions and checkpoint evidence; propose a deeper investigation rather than widening scope.
For races use coordinated requests/barriers and assert the invariant/final state; for flaky failures
record attempts and failures, not a single lucky rerun. Remove temporary diagnostics after validation.
Diagnosis-only requests stop at cause/evidence and proposed remedy; implementation needs authorization.

## Output
Reproduction, supported cause, minimal patch, before/after evidence and unresolved limitations.
## Constraints
Do not expose secrets or request production credentials. Ask for missing evidence when access blocks diagnosis.
Do not call a speculative edit a confirmed fix.

## Continuous changes
Start with `.notth/core/workflows/continuous-development.md`: verify expected behavior against
current approved requirements and actual code revision, not only the old handoff. Preserve a compact
bug note, regression evidence and affected artifacts with unchanged reasons; avoid unrelated BRD/PRD/ADR.
Return newly discovered out-of-scope defects as proposed backlog items, not automatic extra work.
