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
| Procedural | Evidence-backed project experience (PR 3) | Planned until experience implementation; never an automatic global skill |
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
