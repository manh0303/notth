---
name: harness-delivery-risk-management
description: Maintain owned delivery risks, assumptions, blockers and dependencies with response triggers.
---

# harness-delivery-risk-management

## Input
Plan, stakeholder/source constraints, technical/operational findings and actual progress evidence.

## Procedure
1. Identify risks versus current issues, assumptions and dependencies; link each to source and affected outcome.
2. Assess impact and likelihood qualitatively or with actual evidence; do not invent numerical risk scores.
3. Assign proposed/confirmed owner, mitigation, trigger, contingency and decision needed; clarify critical gaps.
4. Track unresolved external dependencies and review cadence; no autonomous stakeholder messages or calendar writes.
5. Update risk state only with evidence; carry accepted residual risks to release/PO decision and architecture review.

## Output
docs/delivery/risk-register.md and evidence-based status draft.

## Template
Read `.notth/capabilities/delivery/templates/risk-register.md` from the installed snapshot.
Use `aih new-doc risk-register --capability delivery` only for a missing draft;
reuse existing authoritative docs or a compact task note when appropriate. Never overwrite approved content.

## Example
Internal provider sandbox is unreachable: current blocker, not a completed test. Owner confirms access plan; integration milestone remains at risk until an observed connectivity check succeeds.

## Quality checklist
- Risk and observed issue are distinguished
- Owner, trigger, response and source are present
- Status does not fabricate progress or communicate externally

## Handoff
State source revisions, requirement/decision IDs, approval status, unresolved questions, output paths,
actual checks and next role. Use the module workflow; role names are not human authorization.

## Constraints
Follow Core permissions, clarification and project-conventions. Ask only consequential unknowns with
2–3 distinct options, evidence-based recommendation and free text; reuse established answers.
No invented source, measured result, target, estimate or approval. No external messaging/publishing,
paid tool use or production changes beyond the user's explicit authorization.
