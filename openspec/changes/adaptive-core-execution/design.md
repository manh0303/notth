# Adaptive execution design

Reuse checkpoint CAS/history and verification-report assertions. New cli/adaptive.js validates optional
state and derives counters; cli/memory-reference.js shares safe local hashing without importing host
execution. No task queue, duplicated progress store, shell runner or mandatory state for Quick edits.
A scoped hash is not independent proof that all relevant code/fixtures were included. Host execution,
authenticity, semantic scope and permissions remain independently reviewed.

Checkpoint schema stays 1 with optional adaptive schema 1. One event appended per save; fixed limits,
no destructive history edits. Source/AC changes need evidence-backed replan. Completion needs current
scoped verification and no unresolved work/effects. Reading stale evidence retains declarations with
BLOCKED, while completed claims on save still require actual evidence. Historical failed events may be
stale without authorizing their reuse. No automatic budget reset; owner resolves consequential scope changes.

| Area | Status | Evidence / reason |
| --- | --- | --- |
| core | done | adaptive-execution + continuity/bugfix/continuous/recoverable guidance; existing policies |
| adapter | not-applicable | No stack/domain rules or registry changes |
| capability-skill | not-applicable | Existing Core skills reach workflows; no skill/capability contract change |
| cli-config | done | adaptive/checkpoint/harness validators, reference helper, optional bundled template |
| workflow | done | Recall through Remember; host owns actual execution; Quick tasks remain light |
| documentation | done | adaptive-core/CLI/versioning guidance and dependency order |
| verification | done | adaptive/legacy/memory tests and package smoke; actual logs in verification.md; live NOT_RUN |
| release-migration | done | CHANGELOG, optional schema compatibility, rollback; release version untouched |

Link chain: optional template/validator → existing bundle/package allowlists → continuity/bugfix entry
→ adaptive procedure → checkpoint/raw evidence tests and packaged smoke → adaptive-core guide.

Base: PR1 feat/adaptive-core-memory. PR3 depends on this branch. Retarget/rebase after owner merges
PR1; no claim this branch starts from a reviewed/merged PR1. Live hosts remain NOT_RUN.
