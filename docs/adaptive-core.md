# Adaptive Core

Different brains. One project memory. Continuous execution.

The AI host reasons and executes. NOTTH supplies project-owned references, continuity contracts and
local validation; it does not run a model or grant tool permissions. Install and describe the task as
usual. Hosts maintain these artifacts after meaningful progress; users need no memory ceremony.

## Canonical memory and handoff

`aih memory --change <id> --query <terms> --budget 8192` returns ranked references with stable IDs,
logical type, scope, hashes, evidence status and freshness. The byte limit covers the serialized record
array, not tokens or the outer envelope. Retrieval is deterministic metadata matching, not semantic search.
Read the original sections before relying on facts. Summary/cache freshness never confirms factual accuracy.

| View | Canonical artifacts | Authority / invalidation |
| --- | --- | --- |
| Semantic | local.md, decisions.json, declared knowledge sources, source manifest, context source links | Decisions retain proposed/confirmed/superseded status; changed hashes require reconciliation |
| Episodic | Selected task checkpoint and linked evidence | Completed declarations need baseline/evidence inspection |
| Procedural | Project change experience.json sidecars | Category/conditions and source/evidence freshness; never an automatic global skill |
| Working | Task context and checkpoint | Intent/trace links stay in context; progress/operations stay in checkpoint |

`aih handoff <id> --budget 65536` derives a host-neutral handoff from those same records. It carries
intent, accepted-scope pointers, decisions/source pointers, baseline, completed/pending steps, evidence,
blockers, side effects, next action and required capabilities. Unresolved questions and constraints stay
in canonical source sections; an oversized handoff explicitly blocks and supplies source pointers instead
of silently dropping critical context. No separate handoff file must be kept in sync.

The new host must inspect its real tools, current branch/scoped bytes and actual remote operation outcomes.
Unknown/prepared effects block blind retries. Local hashes do not check remote status. Separate workspaces
need authorized Git/artifact synchronization; missing artifacts cannot be reconstructed from private chats.
Unchanged local snapshots of external sources still need live freshness inspection in the host.

## Compatibility and ownership

Commands are additive. Existing schema-1 configs, source schemas, contexts, checkpoints, host bridges and
adapters keep their contracts. No eager migration, service, dependency, transcript import or provider API.
Use a reviewed CLI, update --dry-run, update and check on a branch. Project-owned data remains preserved;
config-only backup still excludes tasks/docs. Back up the complete synchronized project. Roll back the
consumer installation commit with its matching CLI/lock, retaining project data. Distribution version
remains release-owned. Byte limits and secret/path checks are defense in depth, not a sandbox.

Offline tests verify serialization, stale-source flags, budgets, installation and CLI behavior. They do
not verify live host compliance. See the [audit and dependency plan](../openspec/changes/adaptive-core-memory/design.md).

## Adaptive execution and recovery

[Host procedure](../core/workflows/adaptive-execution.md) extends existing checkpointing with optional
`adaptive` schema 1 (template: templates/adaptive-state.json). No separate queue/state database.
Objective and acceptance are canonical hashed references; progress stays in checkpoint lists. Events
record observed attempt outcomes or evidence-backed replans. Limits are positive and at most 20;
events are capped at 128, append one per CAS replacement. Prior event bytes and budgets are retained.

Failed action retries need a safe reason. Replanning resets consecutive no-progress, never total
step/replan counts. Unknown external operations require actual inspection and reconciliation before
further attempts. The CLI records/validates declarations; it never runs shell, tests or remote writes.

Passing attempts use the existing evidence verifier and scoped revision digest, computed by
`baselineRevision` in cli/adaptive.js. All relevant code/config/fixture/AC files must be included by
the host; local hashing cannot discover every semantic dependency. Remember/complete needs current
accepted-source coverage, no pending work/blockers/uncertain effects and a passing actual report.
Resume blocks stale code, lost raw evidence, uncertain effects and exhausted budgets while retaining
progress. Legacy snapshots without adaptive state remain valid. Existing resume now returns a
structured blocked plan for changed/missing evidence instead of throwing away the recovery view;
checkpoint saves still reject unsupported completed claims.

Older CLIs ignore optional adaptive declarations and cannot enforce their limits: use the supporting
CLI for continuity. Revert consumer snapshot/CLI together; retain project-owned checkpoint/history.

## Experience learning

`aih experiences --category <id> --tags <tag,tag>` derives eligibility from project experience records.
`aih experience <change-id>` reads one; `--report <input> [--expected <digest>]` saves a conditional
revision with preserved history. Records use the existing change directory's experience.json, not
a second progress/decision database. Active and one-level OpenSpec archives are indexed (up to 200
records; truncation/invalid/ambiguous records are reported). No automatic global export or skill install.

Only verified records with current declared code/conditions and raw verification evidence become
eligible for review. Category/tags never prove semantic applicability: the host reads applies_when and
limitations, checks live external sources and independently verifies the new task. A source/raw-evidence
edit invalidates reuse automatically. Preserved source dependencies also pin the canonical source
manifest and current capture/freshness, so identical bytes at a newer provider revision still invalidate reuse. Candidate/rejected/superseded/invalidated states retain uncertainty
and lifecycle history. Supersession needs a current verified replacement.

Experience reports store problem/context/hypothesis/approach/failures/solution, conditions/limitations,
source revision, evidence and real timestamps. Do not create one for every task or store secrets.
Project-specific data stays in the project; no model weights are changed. Use full project synchronization
and backup, since config archives intentionally omit tasks/docs/experience.

## Evaluation limits

[Controlled A–G protocol](../evals/adaptive-core.md) includes a deterministic concurrency-defect fixture
and matched with/without-NOTTH report validation. Current live results remain NOT_RUN; neither unit
tests nor the read-only hypothetical conformance driver establish real cross-host behavior. A source
digest checks declared bytes, not evidence authenticity, semantic completeness or runtime permissions.
