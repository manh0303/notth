# Audit and target architecture

Audited main `c378465100cdd745432de3452d2909dd0004f9ab` (0.18.0). Code and tests inspected locally;
no live Claude/Kiro behavior verified. IMPLEMENTED means executable or installed contract as stated,
not proof that every AI host follows it.

| Capability | Existing Implementation | Gap | Proposed Change | Priority |
| --- | --- | --- | --- | --- |
| Persistent Context — IMPLEMENTED | knowledge.js/localContext + seed hash cache; project-owned local.md | No unified reader | Derived semantic references | P1 |
| Task Context — IMPLEMENTED | task-context.js, source hashes, DAG invalidation, guarded history | Separate retrieval interface | Reuse sources/links, no duplicate progress | P1 |
| Checkpoint / Resume — PARTIAL | checkpoint.js + harness saveCheckpoint; evidence hashes/history | Failed/missing evidence aborts read; no bounded adaptive counters | PR2 stale-aware recovery, optional adaptive extension | P1 |
| Source Provenance — IMPLEMENTED | sources.js/source-provenance.js: originals, conversions, capture and observations | External live freshness host-owned | Expose current catalog references, retain uncertainty | P1 |
| Knowledge Indexing — PARTIAL | knowledge.js discovery + optional project-knowledge workflow/index | No category/ranking view | Deterministic metadata retrieval, bounded bytes | P1 |
| Agent Routing — IMPLEMENTED | agents.js, defaults, installed roles/skills | Host activation remains advisory | Reuse unchanged | P2 |
| Context Freshness — IMPLEMENTED | source revisions, capture hashes, seed digests, transitive affected links | Cross-view presentation | Propagate stale/inspect-source status | P1 |
| Verification — PARTIAL | verification-report.js assertions/raw hashes; adaptive-verification plan | Report source revision declared; execution retries guidance only | PR2 bind adaptive evidence to scoped bytes | P1 |
| Approvals — IMPLEMENTED | permissions/security, readiness + workflow approvals | Local declarations are not runtime authorization | Preserve precedence, no permission import | P1 |
| Session Continuity — PARTIAL | session-continuity workflow, context + checkpoint integration | No single portable view; no durable attempt counters | Handoff view then adaptive checkpoint extension | P1 |
| Host Bridges — IMPLEMENTED / UNVERIFIED live | Codex/Kiro/Claude/Cursor/Copilot/Gemini/OpenCode/Windsurf entry points | Live cross-host trial absent | Preserve bridges, capability uncertainty; PR3 protocol | P1 |
| Evaluation — PARTIAL | conformance runner, score-eval, comparisons, session protocols | A–G adaptive benchmark and matched baselines | PR3 extend cases/protocol, honest NOT_RUN | P1 |
| Experience — MISSING evidence-backed records | project-knowledge and task-experience guide task depth, not learning | No governed solution records/applicability checks | PR3 project-owned experience tied to verification | P2 |

## Reuse versus new

Canonical docs/local/decisions + source manifests → context source/trace contracts → derived memory/handoff.
Existing checkpoint is the only task-progress store. PR2 adds optional adaptive state there. PR3 stores
new experience content only (not duplicated tasks/docs) under project docs, referencing original evidence.
No vector DB, server, agent runtime, mandatory tool or model dependency. CLI remains local built-ins.

## Dependency plan

1. `feat/adaptive-core-memory` from audited main: reader, portability, freshness/budget tests.
2. `feat/adaptive-core-execution` from PR1 head: optional checkpoint execution contract, safe retry,
   verified-revision guards and recovery tests. Stacked PR; retarget/rebase after PR1 owner merge.
3. `feat/adaptive-core-experience` from PR2 head: experience validation/retrieval, A–G live eval protocol,
   matched baseline recording and docs. Retarget/rebase after PR2 owner merge. No merge/release here.

## Impact matrix

| Area | Status | Evidence / reason |
| --- | --- | --- |
| core | done | session-continuity guidance + AGENTS template, existing policies retained |
| adapter | not-applicable | No stack rules/registry/versions change |
| capability-skill | done | harness-start discovers memory/handoff; no new skill/capability |
| cli-config | done | memory.js + main.js; existing schema/ownership/allowlist reused |
| workflow | done | session-continuity loads derived view then canonical references |
| documentation | done | docs/adaptive-core.md, CLI, architecture, continuity, docs index |
| verification | done | memory.test.js + package smoke; actual results in verification.md; live hosts NOT_RUN |
| release-migration | done | CHANGELOG + versioning; additive CLI, no distribution bump |

Declaration → cli/*.js package allowlist and Core/template bundle → generated AGENTS + harness-start
→ continuity workflow → memory behavior tests + package smoke → adaptive-core/CLI guide.
All original data remains project-owned. Live host trials remain NOT_RUN; see PR3 scope.
