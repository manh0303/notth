---
name: harness-product-mvp-definition
description: Define a usable MVP with in/out scope, acceptance, minimum safeguards and explicit owner decisions.
---

# harness-product-mvp-definition

## Input
Original idea or approved requirements, users, constraints, business rules, known alternatives and decision sources.

## Procedure
1. Identify one target actor, problem and observable user outcome; distinguish prototype, MVP and later release goals.
2. Map the end-to-end journey, including required authorization, data integrity and recoverable failure behavior.
3. Compare a few viable scope cuts by value, feasibility, dependency and evidence. Resolve material scope choices with the actual owner; do not accept your own recommendation.
4. List in/out scope, AC IDs, required NFRs, validation method, success signals and unknown baselines/targets.
5. Trace each included capability to the journey; defer optional analytics or bulk tools without deferring necessary security.
6. Check against existing PRD/BA sources, record the agreed version and pass gaps to BA or Architecture.

## Output
Project-owned docs/product/mvp.md or an MVP section linked from PRD, with scope owner and review status.

## Template
Read `.notth/capabilities/product/templates/mvp.md` from the installed snapshot.
Use `aih new-doc mvp` only for a missing draft;
reuse existing authoritative docs or a compact task note when appropriate. Never overwrite approved content.

## Example
Customer-search MVP: an authorized employee creates and finds customers within permitted organization scope. Bulk import is deferred; tenant access checks and duplicate policy are required. Usage target stays unknown until owner confirmation.

## Quality checklist
- A complete user outcome, not an arbitrary count of features
- Each scope item links AC and minimum quality constraints
- Explicit exclusions, decision source and unresolved owner questions

## Handoff
Read the shared installed contract `.notth/capabilities/product/common/document-contract.md`; pass only affected scope and relevant perspectives.

## Constraints
Follow Core permissions, clarification and project-conventions. Ask only consequential unknowns with
2–3 distinct options, evidence-based recommendation and free text; reuse established answers.
No invented source, measured result, target, estimate or approval. No external messaging/publishing,
paid tool use or production changes beyond the user's explicit authorization.
