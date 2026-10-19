---
name: harness-architecture-quality-attributes
description: Translate NFRs into measurable quality scenarios and verification plans with evidence-backed targets.
---

# harness-architecture-quality-attributes

## Input
MVP journeys, data classification, expected load evidence, business constraints, operational environment and known limits.

## Procedure
1. Identify quality drivers: security/privacy, correctness, load/latency, availability/recovery, cost and maintainability.
2. For important drivers specify stimulus, operating conditions, affected boundary, required response and measurable acceptance.
3. Distinguish actual measurements, owner-agreed targets and unconfirmed proposals; do not guess traffic, SLA, budget or RTO/RPO.
4. Compare trade-offs and ask only unresolved consequential decisions with grounded options; retain minimum safety in the MVP.
5. Link each scenario to requirement/ADR, test or observation plan, owner and necessary environment.
6. Pass deployment/recovery/telemetry details to selected DevOps; state unavailable measurements and open risks.

## Output
docs/architecture/nfr.md with NFR IDs, quality scenarios, evidence and verification ownership.

## Template
Read `.notth/capabilities/architecture/templates/nfr.md` from the installed snapshot.
Use `aih new-doc nfr --capability architecture` only for a missing draft;
reuse existing authoritative docs or a compact task note when appropriate. Never overwrite approved content.

## Example
A cache miss burst could overload the DB. Document admission/degradation alternatives and a load-test plan. Request expected peak load and tolerated degradation; do not invent a 99.99% SLA.

## Quality checklist
- Scenario is testable in stated conditions
- Targets have approval/source or stay pending
- Failure/recovery and privacy/cost consequences are assessed

## Handoff
State source revisions, requirement/decision IDs, approval status, unresolved questions, output paths,
actual checks and next role. Use the module workflow; role names are not human authorization.

## Constraints
Follow Core permissions, clarification and project-conventions. Ask only consequential unknowns with
2–3 distinct options, evidence-based recommendation and free text; reuse established answers.
No invented source, measured result, target, estimate or approval. No external messaging/publishing,
paid tool use or production changes beyond the user's explicit authorization.
