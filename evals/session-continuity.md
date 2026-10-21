# Live host continuity protocol

Status: NOT_RUN. Offline tests exercise fresh CLI processes and simultaneous writers, not live
model compliance. Run this protocol on each intended host/version/model before advertising it.

1. Install the reviewed bundle in a disposable consumer. Give a concrete request with an original
   pain point, one accepted constraint and a rejected alternative. Do not mention context commands.
2. Observe whether the host reads session-continuity automatically and captures source-backed intent,
   canonical decisions, trace pointers and meaningful-step checkpoint. Record actual tool transcript.
3. Start session B on independent task beta. Ensure session A's pinned alpha scope survives B saving
   start.json. Reopen alpha in a fresh session without copying the old chat; check intent and next step.
4. Change alpha's requirement source and a shared decision; import a newer preserved source while
   retaining the old original. Returning host must reconcile affected links and evidence before work,
   preserve unrelated beta work and not silently bless new hashes or reuse rejected decisions.
5. Have two hosts prepare the same context revision. Only one conditional write may succeed; the
   other must reread and reconcile, not force overwrite. Inspect task ownership independently.

6. Block external connector access in a separate run. Host should report only
   concrete dependent blockers, preserve context and continue independent authorized work. A Quick
   task should not produce a full spec or ask the user to maintain memory files.

Record PASS/FAIL/BLOCKED/NOT_RUN per step with raw redacted transcript, source/host revisions and
actual artifacts. Evaluate original painpoint-to-acceptance outcome and mistaken context reuse, not
just command presence. Token savings and accuracy percentages need measured baselines; no claims here.

## Kiro immediate capture (unscored)

In a disposable project install the reviewed Kiro bridge without `--session-hooks`, restart Kiro,
and submit a project Jira task with a Confluence MCP source. Do not mention saving or CLI commands.
Observe actual PromptSubmit/PostToolUse execution, task intent saved before dependent work, and the
authorized source snapshot linked into that task immediately after retrieval. Verify content against
the observed response, including scope, partial pages and revision uncertainty. Continue in a fresh
chat using only the task identity; require actual retained intent, current step and next action.
Repeat an unchanged result (no duplicate), denied local writes (honest blocker), and unrelated/general
question (no spurious task). Bookkeeping must not start a capture loop or repeat remote side effects.
Record client/model version, hook status, redacted transcript, file diffs and source hashes. Disabled
or unsupported hooks are BLOCKED, missed saves after observed hooks are FAIL. Offline payload tests
are not a substitute. These agent prompts may consume host quota; native execution here is NOT_RUN.

## Native lifecycle recovery and compaction boundary (unscored)

Enable native hooks in an isolated consumer. Start a source-linked task; save checkpoint and new
constraints, interrupt the host after a checkpoint boundary, then open a fresh native session with
only “continue the saved task”. Require actual SessionStart invocation, correct task/result, retained
proposed/confirmed decision distinctions and source evidence; edit a source between sessions and
require reconciliation. Repeat with two tasks/session bindings to reject cross-task intake hints.
Trigger the host's real native context compaction and verify post-compaction context injection and
saved decision/evidence retention. Oversized durable state must be reported, never truncated.
Use the separate recovery runner for the controlled interruption case; it does not trigger actual
native compaction. Current native Codex/Claude/Kiro results are BLOCKED / unscored, not CLI PASS.
