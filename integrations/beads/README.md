# Optional Beads task coordination

NOTTH works without Beads. This is an original host integration contract, not vendored Beads code,
a downloader, bundled executable or background service. Upstream: [Beads](https://github.com/gastownhall/beads)
(formerly steveyegge/beads), MIT; README inspected 2026-10-19. Command availability is version-dependent;
the host checks the installed `bd --help` and subcommand help before executing argument arrays.

## Automatic selection and ownership
When `.beads/metadata.json` exists, context reports an unverified candidate. A context task_backend
with kind beads and an issue_id is an explicit mapping; otherwise the host inspects existing issues
and matches the actual request. Do not create duplicate issues from titles alone. A marker proves
neither an installed CLI nor reachable storage. Without existing Beads use local tasks/checkpoints.
Never auto-install/init, change global settings or add network/shell calls to cli/.

Once mapped:
- Beads owns task status, dependencies, assignee and claiming. Local tasks.md links the issue and
  acceptance scope; it is not an independently writable status replica. Checkpoint is a historical
  handoff/evidence receipt, not an authority overriding current Beads state.
- NOTTH/OpenSpec owns requirements, decisions, source revisions and verification evidence. Save
  `task_backend: { "kind": "beads", "issue_id": "project-123" }` in context with the guarded CLI.
- Link the OpenSpec change path/ID in the issue using supported host commands; retain the Beads ID
  in the context sidecar. Keep source/provider credentials out of both.

## Host execution sequence
1. Inspect installed help/version and the configured storage/sync policy. Use read-only issue
   inspection (`bd show <id>`), dependency-ready listing (`bd ready`) and supported JSON output.
2. Before implementation use supported atomic claiming (`bd update <id> --claim` in the inspected
   README). Inspect the result and current owner; conflict/unknown means no ownership claim. Do not
   steal an active claim, clear another session's assignment or retry an uncertain write blindly.
3. Check source-linked context/checkpoint before work; record meaningful-step handoff/evidence in
   NOTTH. Update the mapped issue using the installed supported interface and existing authorization.
4. Before closing (`bd close <id>`), inspect current issue/dependencies, acceptance and actual
   verification. A green local test is not merge/release approval. Claim/close receipts remain
   host-produced evidence; NOTTH does not authenticate the provider.
5. Across machines, use the project's configured Beads/Dolt remote and supported synchronization
   (`bd dolt push` / `bd dolt pull` in inspected README) only within existing authorization. The same
   repo name or local .beads directories do not establish shared state. Do not invent remotes or push
   private data. Re-read issue ownership after synchronization; do not describe stale state as live.

If a mapped Beads backend becomes unavailable, preserve its mapping and checkpoint; mark coordinated
writes BLOCKED. Do not silently switch the same task to local writable status or claim cross-machine
exclusion. Continue independent non-overlapping authorized work. No external live run is implied by
NOTTH's offline schema/package tests.
