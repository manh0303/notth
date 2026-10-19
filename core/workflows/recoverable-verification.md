# Recoverable verification and incremental documentation

Enter through adaptive-verification for checks requiring long-lived processes, multiple related
scenarios or interruption recovery. A short test needs no process fleet or checkpoint ceremony.
The host executes; this workflow never assumes Kiro, PowerShell, Maven, a database or HTTP APIs.

## Plan before starting

1. Inspect scoped requirements, existing test/start commands and selected adapter conventions.
   Choose applicable API/browser/mobile/CLI/batch/library checks and needed dependencies. Reuse
   running environments only after verifying identity, configuration and authorized access.
2. Define scenario groups with requirement IDs, prerequisites, actors/fixtures, expected business
   outcomes, evidence paths and cleanup. For related behavior, include an end-to-end lifecycle or
   cross-boundary journey when required by the change. Do not invent domain-specific steps.
3. Use existing artifact destinations and source policies. Start a draft/evidence log early; record
   source revision, NOT_RUN sections and pending work rather than leaving the whole report until last.
   Without Product, keep evidence in the change/project's existing documentation.

## Processes and bounded execution

- Long-lived services use the host's supported background process/session facility or the project's
  existing container/test orchestration. If unavailable, use an already authorized environment or
  report BLOCKED. An instruction cannot manufacture a missing host tool.
- Record process/session ID, command reference, working directory, ownership and log path without
  credentials. A reused process is not owned by this test. Port presence alone is not readiness.
- Poll a meaningful readiness signal with a project-appropriate deadline, bounded retries and log
  evidence. Choose timeouts based on observed startup/test needs; no universal 30-second limit.
- Run bounded groups without blocking the entire agent session. On timeout, first inspect the owned
  process and last observations; do not kill by port or terminate unrelated terminals/services.
- Never seed roles/permissions into production or shared databases. Use approved isolated fixtures,
  test-owned identifiers and scoped cleanup. Obtain credentials through host facilities, not files.

## Save after meaningful progress

After each scenario/group, persist redacted raw observations and actual pass/fail/blocked results,
then update affected draft sections. Do not append duplicate sections on every retry; use stable
requirement/scenario IDs and respect revision/source-write policies. Canonical external publication
remains subject to its write policy; local evidence can be saved while a publication is blocked.

For an OpenSpec change use the existing `checkpoint.json` contract via `aih checkpoint <id> --report
<file>` (replacement requires the observed digest). Completed groups reference actual evidence hashes;
pending/in_progress record remaining work. Include tested source/config/fixture declarations in the
baseline, uncertain side effects in operations and external revisions in external_sources. Keep reports,
logs and document references in the project's declared location. Never store access/refresh tokens or
claim a checkpoint is a live process inventory or an execution receipt verified by an independent party.
For work without OpenSpec, keep a concise handoff in existing project docs; do not force a change pack.

## Resume and finish

Read status/checkpoint and validate source, requirements, environment/fixture identity, evidence and
external revisions. Inspect unknown/prepared side effects before retrying writes. Re-authenticate only
when required using the host; do not blindly restart processes or assume a timed-out operation failed.
Retain passing evidence only while its relevant baseline remains valid. Re-run affected groups and
dependent journeys after changes; "done" is not permission to skip invalidated tests forever.
A missing/tampered evidence file blocks trusting that completed entry; inspect/recover it explicitly.

Finish with actual requirement coverage, linked related-flow results, compatibility impact,
BLOCKED/NOT_RUN gaps, owned cleanup and the next action. Notify others only with explicit user
instructions. Verification, business acceptance, merge and release are distinct states.

For repeated failures or multi-step recovery, follow `.notth/core/workflows/adaptive-execution.md`.
Observe actual results, preserve completed evidence and bound retries/replanning in the existing checkpoint.
