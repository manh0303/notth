# Change impact analysis — requirements, UI and implementation

## Trigger
A Confluence page, approved brief, BRD/PRD requirement or business rule changed.

## Steps
1. Compare approved source version with the newly retrieved authorized version and note added/removed/changed claims; do not assume link text reflects changes.
2. Identify affected BR/FR/NFR, PRD requirements, epics, stories, acceptance criteria using traceability IDs.
3. Identify downstream UI screen IDs and OpenSpec changes only when real mapping entries exist; `pending` is not evidence of a completed artifact.
4. Analyze scope, security, privacy, business process, cost and schedule impacts. Ask accountable owners to decide whether to accept the change.
5. Draft proposed changes with new source anchors and a rollback/review plan; never overwrite approved Figma, code or product docs automatically.
6. Re-run document-review; resolve new consequential decisions before downstream handoff. Reuse existing scoped authorization and approval evidence instead of repeating approvals.

## Output
Impact in the active OpenSpec design or existing canonical change-impact document (do not create a parallel log), mapping `old source version → new version → affected IDs → proposed change → owner/status` and explicit review checkpoints. No automatic external updates.

Apply `.notth/core/workflows/artifact-contract.md` for canonical source revisions and storage/write
policies. Record configured output impact in artifact-impact.json; complete docs/spec/UI updates or
report blocking dependencies with evidence before review. Do not treat structural readiness as approval.

For implementation documentation and affected-section evidence updates, follow `techspec-maintenance.md` with `harness-product-techspec`.

Enter via Core `continuous-development.md` for each change/resume; reconcile baseline and carry stable IDs into code/tests/evidence. Treat supplied feedback as proposed backlog scope until accepted.
