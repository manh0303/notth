# Clarify consequential ambiguity before implementation

Apply during setup, requirement discovery and any later change that exposes a new consequential gap.

1. Read the user request, project facts, relevant code/specs and previously recorded decisions.
   Read .notth/decisions.json for project-wide/applicable module choices, then the active change's
   decisions.json. Confirm applicability; superseded/proposed records are not current decisions.
2. Separate verified facts, consequential unknowns and reversible implementation details.
   Ask about business behavior, public API contracts, data changes, authorization or costly architecture.
   Use project conventions for routine choices; record assumptions rather than blocking every edit.
3. Ask 1–3 questions per turn. For each, explain the decision in one sentence and give 2–3 distinct
   choices labeled A/B/C, a short trade-off for each, and free text. Recommend one only when supported
   by evidence and explain why. If evidence is insufficient, say so instead of inventing a default.
   Use the host's question UI if available; plain text is a valid fallback.
4. For critical decisions, an unanswered question is not approval. Pause only the affected slice;
   continue independent authorized work. Do not silently implement a suggested answer.
5. Save shared setup facts in local.md/environment.json and confirmed project/module choices in
   .notth/decisions.json. Reuse them without asking again while scope and sources still apply.
   Changed evidence may reopen an affected choice; do_not_ask_again is not permanent authority.
   Save change-specific questions, selected
   answers and source references in decisions.json. Set reviewed=true only after examining the actual
   scope for consequential ambiguity; an empty decision list is valid when there are no such gaps.
   Status open means unresolved; resolved needs both answer and source. Preserve superseded decisions
   in Git/history and update affected specs when the user changes an answer.
6. Run `aih ready <id> --stage implement` where a full spec is appropriate. A structural result does
   not supply authorization. User authorization already given remains valid; do not ask a second
   generic confirmation once the material decisions are settled.
7. During code/review, record real verification evidence. Small low-risk changes can use the lightweight
   workflow with an explicit rationale instead of scaffolding a full change.

Example: "On duplicate phone number: A reject creation; B update the existing customer; C return the
existing record unchanged. A matches the create-only API in the current PRD; confirm or correct it."
Do not use that recommendation unless the actual source supports it.
