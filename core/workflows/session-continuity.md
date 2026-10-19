# Automatic task continuity

Apply on each task entry, resume, material source/decision change and meaningful-step handoff.
This is host-owned housekeeping: users describe work, never manage memory files or repeat context
commands. Reuse the installed CLI invocation; no download, new service or mandatory dependency.
It cannot run while the host is stopped or force a client that does not load project instructions.

## Enter and pin scope
1. Match the current user request to the existing change/task note. Pin its ID in this session.
   `.notth/start.json` is a shared intake hint, not session identity or a lock. Another session's
   saved task must not switch this session. Ask only if multiple targets genuinely fit the request.
2. Use `aih memory --change <id> --query <relevant terms> --budget 8192` for a bounded, derived
   index of canonical references. Read only relevant original sections. Semantic facts, episodic outcomes,
   procedural experiences and working state are logical views, never new competing stores.
   For an existing change run `aih context --change <id>` automatically; start/chat also exposes a
   saved task's context as a hint. Read applicable shared/module decisions and the returned canonical
   sections, not every document. For Quick tasks use the existing issue/PR/task note with intent,
   source references and next action; do not manufacture a full OpenSpec change or an empty sidecar.
3. Read checkpoint with `aih resume <id>` when present. Inspect actual branch/HEAD/scoped edits and
   remote operations. A current hash proves matching bytes only. Confirm that sources support the
   remembered problem/outcome and still apply to this request; proposals are not confirmed choices.

## Preserve intent and traceability
For Standard/Full changes, prepare a project-owned JSON report from
`.notth/templates/task-context.json` after reading actual sources. Save with
`aih context --change <id> --report <path>`; on replacement pass the observed `--expected` digest
and current revision from the read report. CLI increments revision and preserves prior bytes in
context-history. Never edit context.json directly or refresh hashes just to silence a conflict.

- Keep only the concise problem and requested outcome in intent. Link constraints, rejected options
  and actual confirmed decisions in their canonical local.md/decisions/design sections; do not
  duplicate a decision store. Include relevant decision files as hashed sources when relied on.
- Sources have stable IDs, project-relative paths, exact SHA-256 and section/page/message locators.
  Imported originals/conversions must include source_id from the source manifest, so a newer
  preserved revision invalidates the older snapshot even while its bytes remain intact.
- Links use stable IDs and kinds painpoint/requirement/decision/task/evidence, source_refs and
  depends_on. Model dependencies as a DAG: requirements depend on painpoints, tasks on requirements,
  evidence on tested tasks. Each source pointer locates the canonical content; no copied fact corpus.
- Preserve the user's actual supplied feedback before summarizing it, using source-intake and the
  existing source/write policy. For chat without a durable message URI, store only a minimal authorized
  excerpt in the existing change note, label it as a captured excerpt and link it; never invent IDs,
  approval, inaccessible chat history or verbatim content that was not available.
- External Jira/Confluence/MCP sources: retain provider ID/URL/revision in the existing source catalog
  or change note and hash that local snapshot. Host must separately check the live revision and access
  policy; local context never certifies remote freshness. Report unavailable sources explicitly.

## Refresh and coordinate
On changed/missing/superseded sources, the report marks directly and transitively affected links.
Re-read those sources, reconcile intent/decisions/spec and invalidate dependent evidence. Save only
after semantic reconciliation and matching current hashes; continue independent work meanwhile.
An unexpected new revision during save means another writer won: re-read, merge scoped pointers
and retry using the new digest. Never force overwrite or reuse stale --expected.

Separate worktrees synchronize through reviewed Git changes, not live local file locks. Without
shared coordination, serialize overlapping work and report ownership unverified instead of claiming
exclusive task ownership. No external task backend is required or auto-detected.

## Save progress without user maintenance
After each meaningful step and before side effects, update the existing tasks/evidence and save a
checkpoint using the existing contract. Reconcile context if its referenced content changed; save it
before checkpointing. Keep completed/pending/operations in checkpoint,
not a second progress list in context. Do not capture secrets or whole chat transcripts.
Before final handoff, reload context for the pinned change; verify painpoint-to-AC-to-evidence links,
actual test revision and remaining blockers. Missing/stale context prevents dependent completion
claims, not unrelated authorized work. Users see only useful progress or a consequential blocker.

No shell in host: perform the same scoped reads and host-supported conditional writes, keep actual
source revisions, and label CLI validation NOT_RUN. Without safe conditional write, provide a scoped
proposal instead of overwriting another writer. Do not claim automatic loading or live compliance
until tested on that host; missing runtime capability is not a reason to ask users to maintain memory.

External source metadata integration: when the manifest has a capture_sha256, include that exact
capture_sha256 in the context source. Identical snapshot bytes can represent a newer provider revision;
a changed capture invalidates the older context. External freshness observations are exposed with
provenance; changed/unavailable/unknown/not-checked observations require dependent reconciliation.
An unchanged-at-check receipt remains time-qualified and requires host rechecking for current work.
Context can retain an unavailable source as memory, without certifying it usable for execution.

## Host-neutral handoff
On a host switch read `aih handoff <id>` using the same synchronized project artifacts. Check
required capabilities against actual host tools; the report never grants them. Inspect accepted scope
through context source locators, decisions through their canonical files, and completed work through
checkpoint evidence. An oversized handoff returns BLOCKED with pointers: load bounded sections without
discarding constraints, unresolved questions or next actions. Missing state in another workspace requires
authorized synchronization. Do not import provider transcripts or assume private model reasoning.

For bounded multi-step work apply `.notth/core/workflows/adaptive-execution.md`; keep optional
adaptive events inside checkpoint.json. `resume` exposes counters and invalidated verification.

For selective verified experience capture/reuse, follow `.notth/core/workflows/experience-learning.md`.
