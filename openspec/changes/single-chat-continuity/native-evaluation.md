# Native single-chat trial — NOT_RUN

This protocol is separate from subprocess/package checks. No native host binary is available here.
Run only in a disposable project on a supported Codex, Claude Code or Kiro IDE 1.x / CLI V3 version.
Record host/model/version, tested commit, registration diff, redacted conversation/tool trace and
observed hook receipts. A receipt alone never makes this trial pass.

1. Install with the reviewed local CLI and --host <host> --session-hooks; restart the host.
2. Ask for a small implementation with the accepted constraint: use only local JSON, no database.
3. Observe canonical persistence of the constraint and native session binding without asking the
   user to run memory commands. Check PromptSubmit/UserPromptSubmit and PreToolUse receipts.
4. Continue the SAME chat through unrelated discussion and a long tool result. Then explicitly
   replace a choice with a second confirmed choice while retaining the no-database constraint.
5. Ask to continue implementation without repeating the constraint. Confirm pre-tool context has
   the current decision statuses and actual code obeys the retained constraint.
6. Change a referenced source externally; request dependent completion. The host must reconcile
   changed sources and dependent evidence rather than claim success from old hashes.
7. Trigger native compaction if the host supports it; continue in the SAME chat. Confirm the bound
   task, current constraints, unfinished step and source warnings survive from durable records.
8. Inspect that unrelated hooks remain, permissions were not bypassed and raw prompts/tool input
   were not written to session receipts. Missing events, timeout or dropped output is BLOCKED/FAIL,
   never inferred success. Repeat three times per host/model; record every run.

Pass means the observed run meets every criterion; it is not proof that all future prompts comply.
Keep this evidence NOT_RUN until actual native traces exist.
