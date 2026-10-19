# Design and impact

Base after integrating external-source provenance: e1771f067d87cef523ff75815e69a30d0f50dc3f on main; feature branch only.
Owner request: implement the agreed automatic continuity design; user remains merge owner.

## Reuse and decisions
Existing source manifest stores originals/conversions/revisions; existing shared decisions store
confirmed/proposed/superseded choices; checkpoint stores progress and evidence. Do not duplicate them.
context.json is a bounded trace sidecar in an existing change: concise intent, hashed source/section
pointers, typed DAG links and optional task_backend issue mapping. It has no new task status list.

Sources named by source_id must match the current preserved original or normalized path. Merely
hashing an old immutable snapshot would otherwise miss newer imports. Source bytes and locator
semantics are distinct: CLI verifies bytes and graph structure; host verifies meaning and live remote
revision/access. Relevant canonical decisions are included as source references by the host.

Context is opt-in data but automatic host workflow once task depth requires it. AGENTS/context rules,
harness-start, continuous development, task experience and review route to one canonical procedure.
Quick tasks keep existing task notes. start.json is never a session identity/claim. Context with
explicit --change is independent of another session's saved start; saved-task reports are hints.

Save uses the existing exclusive local guard and transaction/atomicWrite. Initial revision is 0;
replacements require matching expected SHA and current revision. Previous bytes are retained by
digest in context-history. This prevents cooperating local lost updates, not cross-checkout races.
No new write primitive or remote identity guarantee is claimed. Ordinary write rollback remains;
crash-safe transactions are outside current repository guarantees.

Beads is optional and host-owned. A marker is an unverified candidate; explicit mapping retains the
issue ID. Beads owns task status/claim/dependencies; OpenSpec owns intent, decisions and evidence.
Lost mapped backend access blocks coordinated writes instead of silent local fallback. No external
binary/dependency is included; current installed help determines supported commands.

## Impact matrix

| Area | Status | Evidence / reason |
| --- | --- | --- |
| core | done | templates/AGENTS.md → core/rules/context.md → session-continuity.md; checks/evals and review entry updated |
| adapter | not-applicable | Stack-independent context; adapter registry, manifests, detection and conventions unchanged |
| capability-skill | done | Existing harness-start/review procedures extended; no new skill/capability or mandatory role; bundle auto-exposes existing IDs |
| cli-config | done | task-context.js/main/start/status/checkpoint; optional project-owned schema; template auto-bundled; tests cover preservation and conflicts |
| workflow | done | One canonical continuity procedure for entry/source changes/handoff and optional Beads integration; checkpoint remains progress owner |
| documentation | done | README, CLI, architecture, reusable workflows, session guide and upstream integration limitations |
| verification | done | tests/task-context.test.js, package smoke and Core behavioral cases; actual results in verification.md; live-host protocol explicitly NOT_RUN |
| release-migration | done | CHANGELOG Unreleased/versioning notes; schemas of existing configs/locks and distribution version unchanged; full repo backup retains sidecars |

## Declaration-to-consumer chain
Existing bundle collects core/integrations/templates through cli/harness.js and npm files allowlist;
Python packaging inherits that allowlist. AGENTS and exposed harness-start load continuity; CLI
start/status/resume build read-only reports; host performs semantic reconciliation/checkpointing.
Core checks/evals and behavioral tests review pointers, freshness, concurrency and actual host limits.
docs/session-continuity.md documents usage/migration. No parallel registry or manifest is required:
existing folder ownership includes the new template/workflow/integration and cli/*.js includes code.

## Remaining validation boundary
Live host model compliance and actual Beads claims/Dolt sync are NOT_RUN, covered by the explicit
evals/session-continuity.md protocol. No universal recall/accuracy or automatic loading claim is made.

Context source references bind schema-2 capture hashes as well as snapshot bytes. External source-check
freshness propagates dependent invalidation, including identical-byte provider revision changes.
