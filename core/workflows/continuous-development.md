# Continuous development and living documentation

## Entry and depth
Use this workflow for each feature, bugfix, business-rule change or resumed session in an idea-driven
or existing-code/document project. It coordinates spec-to-code, artifact-contract, solution-framing
and adaptive-verification; it does not replace them or require a new role, runtime or configuration.

Choose depth from impact, not task wording. A small compatible bugfix can use the existing issue/PR
or change note: expected behavior, baseline, minimal impact, regression evidence and next step.
Do not create BRD/PRD/SRS/ADR or run full-change readiness just to fix a null check. Security-sensitive,
contract/data or consequential business changes need explicit AC and an OpenSpec change. A small
new tool can use PRD-lite or equivalent intent + scoped spec/tasks; load only relevant capabilities.

## 1. Baseline discovery (including every resume)
- Confirm Git root, branch, HEAD and relevant uncommitted edits; inspect actual scoped code/tests.
- Read canonical requirements, specs, ADRs, existing project map, active OpenSpec change, decisions
  and latest evidence. Record source/section, observed revision, owner and approval status; unknown
  stays unknown. Distinguish approved, proposed, in implementation and superseded claims.
- Compare the prior handoff's revisions with current files/source versions and actual PR/check state.
  On changes, invalidate affected assumptions/evidence, re-run impact analysis and reverify affected
  behavior. Preserve unrelated user work. An old summary or a green run on an older revision is not
  current truth. With missing access, mark the baseline unverified and block only dependent work.
- Reuse design.md for change-local baseline/impact, tasks.md for progress/handoff, decisions.json
  for consequential questions and source-backed answers; use the existing project map/decision log
  for durable shared facts. Link these records, do not create a parallel context database or log.

## 2. Impact analysis and decisions
Trace stable requirement IDs through spec → code/contracts → tests/evidence. Inspect callers,
data/API/event consumers, NFR, compatibility, migration and regression impact at the affected boundary.
Use only needed perspectives; the host can perform them sequentially:

| Perspective | Activate when | Existing skill / result |
| --- | --- | --- |
| BA | Requirements/rules/use cases/AC change | Product business-analysis and acceptance-criteria; source-linked delta |
| PO / Product Manager | Value, priority, MVP/release scope or feedback changes | Product backlog-prioritization; proposed scope and actual owner decision |
| Project Manager | Dependencies, sequencing, risks or progress change | Delivery scope-change/planning; evidence-linked plan delta, no promised dates |
| SA | Architecture, data/API/event contracts, NFR or compatibility changes | Architecture change-impact/decision-records; affected map/contracts/ADR |
| Dev / QA | Implementation or behavior changes | Core spec/debugging/tdd/verification/review; regression and drift evidence |

These are existing skills when their modules are installed, not mandatory capability dependencies.
Core-only hosts capture the relevant perspective in the change note. Do not install modules or spawn
agents just to satisfy the table. Reuse existing authorization and decisions; clarify only unresolved
consequential choices. If docs and code disagree, cite both revisions and concrete differences,
identify the authorized source/owner and record the resolution before changing disputed behavior.
Neither newer code nor an approved-but-superseded document automatically wins; do independent work.

## 3. Update spec and implement
Keep approved intent distinct from proposed changes. Reuse the active OpenSpec change for the same
scope; split independent/unaccepted feedback into proposed backlog items. Preserve stable IDs and
superseded decision history. Update only affected scenarios/design/tasks before implementing the
accepted slice with harness-spec, harness-tdd or harness-debugging and the relevant adapter.
Use spec-to-code readiness for full changes, not as business approval or a small-fix paperwork gate.

## 4. Verification and selective documentation maintenance
Use adaptive-verification and harness-verification from the existing bundle. Compare each AC with
actual results at the tested revision/environment. Keep runtime PASSED/FAILED/BLOCKED/NOT_RUN and
static inspection distinct; never promote static analysis into runtime PASS or business approval.

For each change list artifacts to create, update, supersede or leave unchanged, with concrete reasons.
With configured outputs reuse artifact-impact.json for every output and affected input; without them
use the existing change/PR note. Reference exact affected sections, stable IDs, canonical destinations
and policies in artifacts.json/integrations.json. Ask storage only if it is still unknown and docs are
needed. Do not reinterpret configured aliases as access, or duplicate an external canonical source.

Use Product techspec-maintenance when installed; otherwise maintain the existing scoped docs/spec.
Preserve unrelated sections and user edits. Immediately before any source write, re-read its current
revision/hash and compare to the observed baseline. If changed, reconcile the section diff first;
if no safe concurrency guard is available, return a proposal. The host enforces access and performs
calls: read-only means no source mutation, propose means a reviewable patch/handoff, write still
requires existing bounded authorization and actual tool support.

Read-only source: leave that source unchanged and link a separate section-level proposal and owner
handoff in the impact reason/evidence. Do not record its canonical update as done. A proposal can
complete a proposal-only assignment; if canonical publication is required, report that dependency
BLOCKED. For unavailable sources, do not invent revisions/content or silently create a local master.
Existing artifact-impact status remains pending/done/blocked: done describes the recorded action,
not approval/publication. Detailed verification statuses live in the linked report. Legacy
verification.json uses passed/failed/skipped; encode BLOCKED/NOT_RUN as skipped with the explicit
reason and report link, never as passed. No JSON schema or new lifecycle registry is required.

## 5. Feedback, review and continuity
Capture supplied bug reports, UAT findings, user feedback and operational evidence in the existing
backlog/issue or a reviewable proposal under its write policy. Deduplicate by source/requirement,
record observed vs expected, source/revision, severity/value, affected IDs, owner and proposed action.
Distinguish defect against accepted AC from a new request. Feedback is proposed until an authorized
owner accepts it; do not expand active scope, promise release dates or invent operating measurements.

Track proposed → clarifying → implementing → verification → review in existing tasks/decision notes;
mark blockers at the relevant step. Report implementation complete, merged and released separately,
with actual PR merge SHA and release artifact/deployment evidence when available. Unknown is unknown.
No auto-merge/release; archive only after the existing OpenSpec merge gate.

Before handoff, require AC-to-result links, necessary checks with evidence or explicit BLOCKED/NOT_RUN,
affected-doc updates/proposals consistent with policy, and remaining work/risks/next step. Missing
mandatory checks or required publication prevent an unconditional completion claim. State the
completed scope and limitations, not simply “done”. Update the existing tasks.md handoff with current
baseline, decisions, evidence revision, blockers, remaining work, next action/owner and distinct
implementation/merge/release status. On the next session, start again at baseline discovery.

## Meaningful-step recovery
Use agent-routing.md for scoped perspectives. Keep the existing design/tasks/decisions/evidence current, then save a compact project-owned checkpoint after meaningful steps and before external side effects. aih checkpoint/resume supplies validation and local freshness hints, not execution. Record task/evidence IDs, baseline digests, completed/pending work, blockers, operation identity/status and next action; never copy chat or secrets. If interrupted, reconcile actual sources and unknown/prepared remote operations before retrying. Read real host usage/quota only when available; otherwise record unknown and retain user model settings. Use explicit actions/repository scope for an authorized autopilot; host/repo permission rules still apply.

For changed public journeys or an explicit end-user testing request, apply
`.notth/core/workflows/end-user-acceptance.md` and `harness-end-user-testing`: exercise the actual
interface, distinguish real/mocked dependencies, and include user-facing outcome evidence or concrete
BLOCKED/NOT_RUN reasons before completion. API/unit/build success cannot replace required browser/device flows.

Use [task experience](task-experience.md) for the canonical Quick/Standard/Full decision table, minimum context, scoped approvals and concise next-action handoff.

Apply [automatic session continuity](session-continuity.md) on task entry, source changes and handoff.
Keep intent/trace pointers in the active change and actual progress in existing checkpoints/backend.

For repeated failures or multi-step recovery, follow `.notth/core/workflows/adaptive-execution.md`.
Observe actual results, preserve completed evidence and bound retries/replanning in the existing checkpoint.
