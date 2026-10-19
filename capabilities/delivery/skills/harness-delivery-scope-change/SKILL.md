---
name: harness-delivery-scope-change
description: Evaluate scope changes across product value, architecture, dependencies and delivery before re-planning.
---

# harness-delivery-scope-change

## Input
Change request, reviewed baseline scope/MVP, affected requirements/ADRs, plan and available estimates.

## Procedure
1. Preserve the baseline and describe the proposed delta and motivation; identify decision owner.
2. Ask BA/PO for requirement/value/AC impact, SA for contract/NFR/data impact and DevOps for release impact as applicable.
3. Compare defer, replace and expand options with explicit trade-offs; avoid invented cost/dates.
4. Resolve consequential owner decisions before implementing affected behavior; continue independent authorized work.
5. Update only affected scope/traceability/ADR/plan records and OpenSpec tasks after the real decision.
6. Report revised dependencies, acceptance, risks and rollback considerations; preserve history.

## Output
docs/delivery/change-assessment.md and reviewed updates to existing plan/requirements/design.

## Template
Read `.notth/capabilities/delivery/templates/change-assessment.md` from the installed snapshot.
Use `aih new-doc change-assessment --capability delivery` only for a missing draft;
reuse existing authoritative docs or a compact task note when appropriate. Never overwrite approved content.

## Example
Adding bulk import to the search MVP requires async jobs, limits and duplicate policy. Present defer or replace a lower-value feature; do not quietly promise the same release date.

## Quality checklist
- Baseline and delta are explicit and source-linked
- Cross-role impacts and options are assessed
- Scope/date approval is from the actual owner

## Handoff
State source revisions, requirement/decision IDs, approval status, unresolved questions, output paths,
actual checks and next role. Use the module workflow; role names are not human authorization.

## Constraints
Follow Core permissions, clarification and project-conventions. Ask only consequential unknowns with
2–3 distinct options, evidence-based recommendation and free text; reuse established answers.
No invented source, measured result, target, estimate or approval. No external messaging/publishing,
paid tool use or production changes beyond the user's explicit authorization.

## Feedback and evidence
Use Core `continuous-development.md` for proposed feedback vs accepted scope and session continuity.
Update dependencies, risks and plan progress from actual evidence. Track implementation complete,
merged and released separately with PR/release references; absent evidence stays unknown. Store
remaining work and next action in existing change tasks, without another progress registry.
