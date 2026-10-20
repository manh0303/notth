# Adaptive execution

Use for meaningful multi-step work, debugging and interruption recovery; Quick edits keep a scoped
check and concise handoff. This is a host execution contract, never a model/runtime or permission grant.

Recall → Understand → Plan → Execute → Observe → Verify → Replan when needed → Remember.

1. Recall through memory/context/handoff; inspect canonical intent, accepted constraints, unresolved
   decisions and current sources. Reconcile stale dependencies. Never infer approval from memory.
2. Understand objective and acceptance in existing source sections. Plan scoped steps in the existing
   checkpoint completed/pending/in_progress lists, not a second task queue. Choose only needed skills.
3. For bounded adaptive work, add the optional `adaptive` field from templates/adaptive-state.json to
   the existing checkpoint report. Pin objective/acceptance source hashes, small positive limits and phase.
4. Execute one authorized meaningful step with the host's tools. Record an attempt only after observable
   results, with unique ID, step ID, stable action label, actual timestamp, outcome/reason, evidence and
   tested baseline references. Failed/blocked attempts remain failures, not completed work.
5. Before claiming passed, run actual checks. Use the existing verification report with raw assertions.
   Save the intended baseline, then read `resume.verification_revision` before checks and bind
   metadata.source_revision to that value. The equivalent `baselineRevision` algorithm is `sha256:` plus
   SHA-256 of encode(sorted [{path,sha256}]), paths in ascending ASCII order. It identifies the declared scope, not an independently
   authenticated Git revision or exhaustive dependency closure. Include all relevant code/config/fixtures
   and objective/acceptance sources. Do not refresh hashes after running tests against older bytes.
6. Observe and investigate failure. A retry of a failed action needs `retry.safe=true` plus a concrete
   reason; that declaration grants no tool permission. Preserve unknown/prepared effects and inspect
   their actual remote status before retry. Do not mark a successful effect as failed just to rerun it.
   If an operation remains uncertain, save its observation/receipt separately before further attempts.
7. Replan with a unique `kind=replan` event, reason and current evidence. It resets consecutive lack of
   progress, not per-step attempt/replan totals. Existing events and limits cannot be dropped/raised
   through checkpoint replacement. On exhaustion preserve work, stop ineffective repetition and ask
   the owner about a consequential scope/budget change; record it separately, never reset counters silently.
8. Save after each meaningful step using checkpoint --report and observed --expected digest. Exactly
   one new event per replacement; CAS/history prevent silent concurrent overwrites. This does not save
   while the host is stopped or override an independent workspace. Source/AC changes require a replan.
9. Verify before remember/complete: current declared baseline and accepted-source coverage, actual
   passing report, no pending/in-progress steps, blockers or uncertain effects. Experience learning is
   selective, never automatically turn every completion into a global rule.

`resume` exposes derived counters, exhaustion, evidence freshness and next action. Missing/tampered
legacy evidence returns a blocked plan with retained progress; saving completed claims still needs
valid evidence. Historical failed events may remain stale; new observations must be current. Preserve
completed valid work; invalidate and rerun only affected verification. All receipts remain producer-
declared: the host/reviewer must inspect actual tools, evidence authenticity and semantic coverage.
