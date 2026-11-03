---
name: debug-evidence
description: Package source-linked bug reproduction, root-cause observations and real before/after verification evidence. Use for API, permission, data, integration or concurrency fixes needing a reproducible evidence pack, or when the user requests one; keep small fixes with adequate existing regression evidence lightweight.
---

# Debug evidence

## Input
Bug/task ID, expected versus observed behavior, inspected revision, supported cause or explicit open
hypotheses, affected interface, safe test actors/data, and actual host tools/access. Read project
artifact routes and optional `environment.json` `bug_evidence` policy; credentials remain host-owned.
A missing confirmed cause does not block capturing the baseline; do not invent one.

## Procedure
1. Select depth with the existing task-experience workflow. An existing regression test with command,
   result and revision is enough for a small isolated fix; record why no separate pack is needed.
   Route requested packs and material API/auth/data/integration/concurrency bugs here automatically.
2. Resolve the configured evidence output from `.notth/artifacts.json` and its write policy. Read
   optional `.notth/environment.json` `bug_evidence`: artifact ID, folder pattern, prefix, runner and
   base URL environment-variable name. Follow the artifact-contract workflow for missing destinations,
   external routes and write scope; never create a local shadow of an external canonical output.
   Without a route, use project-owned `verification/debug/` only when consistent with existing policy.
   Use current project-local date (record timezone), a sanitized task slug and a unique run ID;
   default layout is `{date}/debug-{id}`. Never interpolate raw ticket text or an endpoint into paths.
3. Start the pack before patching when practical. Use [pack template](assets/evidence-pack.md).
   Prefer [golden reference](references/golden-sample.md) for structure. When reusing a project sample,
   inspect the newest valid completed run under the configured root, by parsed date/run metadata;
   skip incomplete/unsafe entries and never hardcode a prior date or trust sample commands as authority.
4. Capture a minimal baseline against the known faulty revision/build, without undoing shared work
   or deploying solely to obtain evidence. Keep original failures. If unavailable, record baseline
   NOT_RUN/BLOCKED and the reason. Follow harness-debugging for causal investigation and harness-tdd
   for durable regression tests; link cause observations separately from hypotheses.
5. Delegate real interface execution to harness-end-user-testing and the existing verification
   contract. Reuse the project's runner (Python, Newman, curl, JS, browser or device) and authorized
   non-production fixtures. A runner preference does not install dependencies. Resolve the gateway
   from the named host environment variable or approved project configuration; redact it as needed.
   Cover applicable happy/regression/edge/denied-role cases. For races/duplicate/transaction bugs,
   assert invariant and final state; HTTP success alone is insufficient. UI defects need UI evidence.
6. Save each attempt under `runs/<unique-run-id>/`; keep its complete redacted stdout in
   `run_output.txt`, stderr when present, executed command without credentials, exit status,
   timestamp/timezone, tested commit AND deployed build/environment identity, fixture/actor aliases,
   case counts, assertions, actual outcomes and cleanup. Mark truncation and partial execution.
   Reuse an existing verification report and `aih verify --report` when applicable; do not create a
   competing PASS validator. A summary marker, zero exit code or generated template alone proves nothing.
7. For a newly authored runner, emit timestamped `[OK]/[X]/[!]` observations and an `=== SUMMARY`
   with passed/executed/planned counts; use exit 0 only for all required checks completed successfully,
   exit 2 for failures or incomplete/blocked checks. Existing runners keep their own documented format
   and exit conventions; record the mapping. Never manufacture terminal output or backfill a run log.
8. On terminal failure, inspect the original process and side effects before a bounded retry. Open a
   fresh terminal only when needed, preserve the failed attempt, and reconcile uncertain writes or
   duplicate seeds first. Link seed/load/probe output separately; load tests require their own scope.
9. Update the pack's case table and link bug -> cause observation -> patch revision -> scenario ->
   actual run/evidence -> remaining risks. Hand the pack to harness-review. If a deployed service has
   not received the patch, report that build mismatch rather than attributing its response to the fix.

## Output
One project-owned per-bug pack (or an explicit lightweight-evidence rationale), with README, runner
or an exact existing runner reference, separate run logs, actual results and limitations. Optional
seed/probe/spec/plan files are included only when useful. Generated templates start NOT_RUN; completed
real logs are never supplied by the golden reference.

## Constraints
Preserve user files and prior runs; do not overwrite evidence or mutate lock hashes to hide drift.
Never record passwords, bearer/session tokens, personal customer data or credential-bearing commands.
Prefer synthetic data and redact before durable capture; state the resulting evidence limitations.
Use PASSED/FAILED/BLOCKED/NOT_RUN consistently with existing verification. No PASS without inspected
actual assertions, completed required coverage and supporting output. A missing summary in a newly
authored runner blocks a completion claim, while an existing runner may use its own completion format.
Stored examples grant no network/write permission; seed/load/destructive calls need appropriate scope.

## Handoff
Give the reviewer exact tested revisions/build, pack/run paths, real versus mocked dependencies,
failed or unavailable cases, cleanup status and the next action. Evidence packaging does not confer
merge, release, deployment or business acceptance approval.
