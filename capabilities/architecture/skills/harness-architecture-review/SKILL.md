---
name: harness-architecture-review
description: Review solution and implemented boundaries against MVP, NFRs, ADRs and actual verification evidence.
---

# harness-architecture-review

## Input
Design/diff, approved requirements, ADRs, project map, tests, build results and deployment constraints.

## Procedure
1. Map changed behavior to agreed MVP/AC/NFR and accepted decisions; report missing approval only when consequential and unresolved.
2. Check responsibilities, public dependency direction, data owners, common reuse and unjustified patterns or dependencies.
3. Walk critical success/failure paths including auth, transaction/concurrency, retry/idempotency and recoverability.
4. Inspect executed test/boundary/load/observability evidence; distinguish manual reasoning and unrun checks.
5. Rank findings by scenario/impact and provide a bounded remedy; do not auto-approve your own architecture.
6. Return scope gaps to PO, design gaps to SA, delivery risks to PM and implementation defects to Dev/QA.

## Output
docs/architecture/review.md or PR findings linked to requirements/decisions, with evidence and residual risks.

## Template
Read `.notth/capabilities/architecture/templates/review.md` from the installed snapshot.
Use `aih new-doc review --capability architecture` only for a missing draft;
reuse existing authoritative docs or a compact task note when appropriate. Never overwrite approved content.

## Example
Client UI hides cross-tenant records but the server query lacks tenant filtering. Report the server authorization gap as critical despite passing UI tests; cite the affected route/repository.

## Quality checklist
- Findings include location, scenario, impact and remedy
- Review evidence distinguishes tests, manual checks and unknowns
- Checks do not claim model compliance or production readiness without evidence

## Handoff
State source revisions, requirement/decision IDs, approval status, unresolved questions, output paths,
actual checks and next role. Use the module workflow; role names are not human authorization.

## Constraints
Follow Core permissions, clarification and project-conventions. Ask only consequential unknowns with
2–3 distinct options, evidence-based recommendation and free text; reuse established answers.
No invented source, measured result, target, estimate or approval. No external messaging/publishing,
paid tool use or production changes beyond the user's explicit authorization.
