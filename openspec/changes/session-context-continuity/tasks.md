# Tasks

- [x] Inspect current source, AGENTS, architecture and maintenance/release boundaries.
- [x] Implement bounded optional context, source-current checks and transitive affected links.
- [x] Add guarded digest/revision save and retained history; preserve old consumers and user data.
- [x] Connect start/chat/status/resume and automatic host entry/review/handoff instructions.
- [x] Add Beads optional integration without installer execution, downloads or new dependencies.
- [x] Add recovery, concurrent-writer, malformed/source-path and package smoke checks.
- [x] Document limits, migration/backup, Core checks/evals and live-host protocol.
- [ ] Human review/merge; separate release PR handles distribution publication.

## Handoff
Implementation and offline validation are tracked in verification.md. Live model compliance and real
Beads multi-machine claiming remain NOT_RUN; this is an explicit integration verification boundary,
not a completed live claim. Merge/publication are separate owner actions. Retain feature branch.
