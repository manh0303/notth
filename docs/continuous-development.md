# Continuous development & living documentation

Give the host a normal request: “Add feature X”, “Fix bug Y”, “Change business rule Z” or
“Continue change X”. The installed AGENTS entry selects Core
[continuous-development](../core/workflows/continuous-development.md):
change request → baseline discovery → impact analysis → update spec → implementation → verification
→ documentation maintenance → review. No new CLI command, runtime, watcher or mandatory multi-agent setup.

## Working across changes and sessions
The host reads actual requirements/specs/ADRs, code and evidence revisions before each change. It
compares any previous handoff with current sources, including uncommitted edits, and rechecks affected
assumptions/tests when the baseline changed. Existing OpenSpec design/tasks/decisions, project map and
decision log retain continuity; chat summaries are navigation hints, not authority.

| Existing record | Maintained information |
| --- | --- |
| OpenSpec design.md or small-fix issue/PR note | Baseline revisions/status/authority, scope and artifact impact |
| OpenSpec tasks.md | Proposed/clarifying/implementing/verification/review, blockers and next-session handoff |
| decisions.json / existing decision log | Consequential unresolved questions and actual accepted decisions with sources |
| Existing project map / ADR | Touched shared boundaries, contracts and accepted/superseded decisions |
| artifacts.json / integrations.json | Canonical destinations, source-write policy and host connection aliases |
| artifact-impact.json | Configured outputs and affected inputs: actions, unchanged reasons, progress and evidence |
| Existing verification report / verification.json | AC results, commands, raw evidence, tested revision and gaps |

The phase labels are prose in existing records, not extra JSON enum values. Artifact status still
uses draft/approved/superseded; decisions use open/resolved; impact uses pending/done/blocked.
Verification reports use PASSED/FAILED/BLOCKED/NOT_RUN. The legacy readiness sidecar accepts only
passed/failed/skipped: use skipped with an explicit BLOCKED/NOT_RUN reason and report reference.
`aih ready` remains structural only; it does not enforce source freshness or certify business approval.

## Proportional scope
A small bugfix needs current expected behavior, minimal impact, a regression check and handoff; it
can keep these in its existing issue/PR without a full OpenSpec pack. A new small tool can use a short
intent/PRD-lite plus scoped spec/tasks. Contracts, sensitive behavior or business changes need explicit
AC and impact analysis. Load BA/PO/Product Manager/Project Manager/SA perspectives only as needed;
Core-only consumers can record them in a compact change note. Optional modules add depth, not gates.
See [examples and evaluation setup](examples/continuous-development.md).

## Maintaining documents safely
Maintain only affected sections and retain stable requirement IDs through spec → code → tests/evidence.
Inspect the actual document before editing; preserve unrelated text. For conflicting docs/code, record
both anchors/revisions, establish authority and resolve consequential decisions instead of choosing
whichever is newer. Re-read source revision immediately before writing; reconcile concurrent edits
or return a proposal if safe concurrency checks are unavailable.

Reuse [artifact routing](artifact-contract.md). Ask where canonical docs belong only if no existing
choice answers it. read-only never mutates its source; propose delivers a reviewable patch; write
also needs an authorized, available host tool. Declared connections do not grant access. External
sources unavailable to the host remain unverified; do not invent their contents or a second master.

For a read-only input, artifact-impact can record unchanged + a reason linking the proposed section
patch and owner handoff. Do not label its canonical update done. If the assignment is proposal-only,
that proposal is its deliverable; if source publication is required, keep it BLOCKED and state the
remaining dependency. Every configured output still needs an action/reason; unchanged outputs do not
need rewritten files. Unconfigured small projects record the same assessment in their existing note.

## Verification, feedback and completion
Reuse [adaptive verification & TechSpec](adaptive-verification.md).
Record AC-to-observed-result links and current revision, with BLOCKED/NOT_RUN for missing execution.
Static inspection does not prove runtime success. Proposed documentation is not business approval.
Feedback from bugs/UAT/users/operations goes into the existing backlog or a reviewable proposal;
deduplicate and distinguish a defect against accepted AC from a new request. Only actual accepted
scope changes enter implementation. No automatic timeline or release commitment.

At handoff state completed scope, AC/evidence, affected docs/proposals, remaining work/risks and next
action. Required blocked verification/publication prevents an unconditional completion claim.
Implementation complete, merged and released are separate facts supported by separate evidence.
Archive only after the existing OpenSpec merge gate; creating the PR does not merge or release it.

## Using a reviewed source bundle
On a consumer branch with current work committed, install/use the reviewed CLI source, then:

```sh
aih update --dry-run
aih update
aih check
# Only when a full change is needed; reuse an existing change for continued scope:
aih new-change change-rule
aih verify --adaptive
```

Tell the host: “Read AGENTS.md. Continue change-rule; reconcile the current baseline with its handoff,
then implement the accepted remaining scope and maintain affected docs under the source-write policy.”
For full changes use `aih ready change-rule --stage implement` and `--stage review` after filling actual
records. `aih eval --scope all` exports scenarios; it does not run a model. Product is needed only for
its optional document templates/TechSpec skill. Existing docs/configs/changes are preserved on update;
add missing baseline/handoff sections selectively, do not regenerate old changes. Revert the consumer
installation commit to roll back; re-export evaluations after bundle hashes change.

## Checkpoint and recovery

Use aih agents for canonical responsibilities and preferred skills; load only needed perspectives. For a machine-readable meaningful-step handoff use aih checkpoint <id> --report file.json and aih resume <id>. Keep design/tasks/decisions and evidence authoritative; checkpoint references them instead of copying chat. Reconcile baseline drift and unknown side effects before retry; quota/usage remains unknown without actual host data. See [Agent-first guide](agent-first.md).
