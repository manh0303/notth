---
name: harness-architecture-decision-records
description: Record traceable architecture decisions with alternatives, consequences and reconsideration triggers.
---

# harness-architecture-decision-records

## Input
Decision question, actual drivers/evidence, options, current ADRs and stakeholder answers.

## Procedure
1. Locate related accepted/superseded ADRs; avoid a second conflicting decision on the same scope.
2. Record a stable ID, status, scope, source revision, owner and date; proposed is not accepted.
3. Explain the problem, viable options and evaluation against drivers; document selected option only after an actual decision.
4. Capture positive/negative consequences, verification, migration/rollback and measurable triggers for reconsideration.
5. Link requirement/NFR IDs, module/contracts and OpenSpec change. Preserve superseded history and update the project map.
6. For a trivial reversible choice, a task note is enough; do not manufacture an ADR for every edit.

## Engineering depth
Use the original MADR-informed ADR outline for consequential choices: decision question/context,
drivers, viable alternatives, chosen option/owner evidence, positive/negative consequences and
validation/reconsideration. If scope changes, supersede/link rather than silently rewriting an accepted
decision. Do not manufacture options, measurements or an approval to satisfy the template.

## Output
A project-owned ADR, e.g. docs/architecture/decisions/adr-001.md, linked from project-map and active OpenSpec design.

## Template
Read `.notth/capabilities/architecture/templates/adr.md` from the installed snapshot.
Use `aih new-doc adr --capability architecture` only for a missing draft;
reuse existing authoritative docs or a compact task note when appropriate. Never overwrite approved content.

## Example
ADR-001 proposes synchronous provider calls for the first release. Owner confirms the latency trade-off; status becomes accepted. Reconsider when measured timeouts exceed the agreed threshold; that threshold stays pending until agreed.

## Quality checklist
- Accepted status has actual owner decision evidence
- Alternatives and negative consequences are explicit
- Superseded records and implementation links stay traceable

## Handoff
State source revisions, requirement/decision IDs, approval status, unresolved questions, output paths,
actual checks and next role. Use the module workflow; role names are not human authorization.

## Constraints
Follow Core permissions, clarification and project-conventions. Ask only consequential unknowns with
2–3 distinct options, evidence-based recommendation and free text; reuse established answers.
No invented source, measured result, target, estimate or approval. No external messaging/publishing,
paid tool use or production changes beyond the user's explicit authorization.
