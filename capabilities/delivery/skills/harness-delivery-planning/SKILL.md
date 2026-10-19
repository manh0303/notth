---
name: harness-delivery-planning
description: Plan value-bearing delivery slices and dependencies from reviewed scope and team-supplied estimates.
---

# harness-delivery-planning

## Input
Reviewed MVP/backlog, architecture decisions, dependency graph, actual capacity/estimates and release constraints.

## Procedure
1. Identify deployable vertical outcomes, acceptance criteria and prerequisites; avoid one disconnected layer per milestone.
2. Map task/repository/owner dependencies and integration order; expose critical blockers and external confirmations.
3. Use team estimates and known capacity, record ranges/assumptions; when absent propose order, not invented dates or velocity.
4. Define completion evidence and planned quality/security/architecture gates proportional to risk.
5. Include migration/release/rollback responsibilities with DevOps, and feedback checkpoints with PO.
6. Publish a plan draft for actual owner review; update status only from observed completed work and source links.

## Output
docs/delivery/delivery-plan.md linked to stories, ADRs, OpenSpec tasks and risks.

## Template
Read `.notth/capabilities/delivery/templates/delivery-plan.md` from the installed snapshot.
Use `aih new-doc delivery-plan --capability delivery` only for a missing draft;
reuse existing authoritative docs or a compact task note when appropriate. Never overwrite approved content.

## Example
Customer-search delivery: authorization + create + query + tests form the first usable slice. Bulk import follows schema readiness. With no capacity estimate, order the slices and label dates unknown.

## Quality checklist
- Every slice has user value and observable acceptance
- Dependencies and accountable owners are explicit
- Dates/capacity have sources and completion has evidence

## Handoff
State source revisions, requirement/decision IDs, approval status, unresolved questions, output paths,
actual checks and next role. Use the module workflow; role names are not human authorization.

## Constraints
Follow Core permissions, clarification and project-conventions. Ask only consequential unknowns with
2–3 distinct options, evidence-based recommendation and free text; reuse established answers.
No invented source, measured result, target, estimate or approval. No external messaging/publishing,
paid tool use or production changes beyond the user's explicit authorization.
