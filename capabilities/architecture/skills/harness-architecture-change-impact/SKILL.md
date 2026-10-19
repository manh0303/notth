---
name: harness-architecture-change-impact
description: Assess change impact and architecture drift using a source-linked living project map.
---

# harness-architecture-change-impact

## Input
Requested change, current project-map/ADRs, affected source revisions, API/event/schema consumers and existing tests.

## Procedure
1. Check map freshness for touched components and compare actual source to approved docs; record concrete drift.
2. Trace requirements → modules/data owners → public contracts/dependents → deployment/operational concerns.
3. Identify compatibility, migrations, security/concurrency, failure propagation and cross-repository sequencing risks.
4. Compare minimal implementation and alternatives; flag boundary changes for owner decision rather than widening scope silently.
5. Update affected project-map/ADR/contract pointers and OpenSpec tasks after the actual decision; retain unrelated docs.
6. Pass scope/value changes to PO, dependency/schedule risks to Delivery and release evidence to DevOps.

## Output
Updated docs/architecture/project-map.md and change-specific impact notes linked to affected IDs/paths.

## Template
Read `.notth/capabilities/architecture/templates/project-map.md` from the installed snapshot.
Use `aih new-doc project-map --capability architecture` only for a missing draft;
reuse existing authoritative docs or a compact task note when appropriate. Never overwrite approved content.

## Example
A phone-normalization change affects the unique index, API duplicate policy and imports. Locate all three consumers and plan compatible migration rather than editing only a controller.

## Quality checklist
- Dependent public contracts and data ownership were considered
- Drift has concrete paths/revisions and a reviewed resolution
- No speculative impact or unrelated broad refactor

## Handoff
State source revisions, requirement/decision IDs, approval status, unresolved questions, output paths,
actual checks and next role. Use the module workflow; role names are not human authorization.

## Constraints
Follow Core permissions, clarification and project-conventions. Ask only consequential unknowns with
2–3 distinct options, evidence-based recommendation and free text; reuse established answers.
No invented source, measured result, target, estimate or approval. No external messaging/publishing,
paid tool use or production changes beyond the user's explicit authorization.

## Session continuity
Use Core `continuous-development.md` to compare map, requirements/ADRs, code and evidence revisions
with the prior handoff. Record drift with both source anchors and authority/owner; do not choose code
or docs by recency alone. Refresh only touched map/contract/ADR sections after reconciliation.
