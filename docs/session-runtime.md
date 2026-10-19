# Optional local session runtime

NOTTH can preserve visible task state around native host compaction and inject fresh recovery
context at session start. It does **not** compress an LLM transcript itself, restore internal reasoning,
execute pending task operations, or guarantee a host follows injected context. The host still owns
its conversation window, model calls, tools and approval policy. No database, RAG, Beads or service.

## Enable once, then operate automatically

With a reviewed source/package containing this feature, in the consumer project:

```bash
aih init --host codex --session-hooks
# Existing installation:
aih update --host claude-code --session-hooks --dry-run
aih update --host claude-code --session-hooks
```

Use your existing local/package CLI invocation if `aih` is not on PATH. Explicit `--host` is required
when enabling hooks. Ordinary updates preserve already enabled hooks. The installer writes settings;
it never executes their commands. The host runs the vendored Node runtime offline after restart.
Restart the host so it reloads project settings. Node 22+ must remain available on the host PATH.

| Host | Project-owned registration | Runtime integration status |
| --- | --- | --- |
| Codex | `.codex/hooks.json` | SessionStart / PreCompact / Stop command contract; native execution unverified here |
| Claude Code | `.claude/settings.local.json` | SessionStart / PreCompact / Stop command contract; native execution unverified here |
| Kiro | Existing instruction bridge only | Command runtime integration unverified; flag refuses unsupported host |

Settings merge retains unrelated keys and handlers. Modified/duplicate NOTTH handlers fail instead
of being replaced. Before changing existing settings, original bytes (base64) are backed up locally under
`.notth/backups/session-hooks-<hash>.json` with mode 600. Dry run writes nothing; ordinary write
failures roll back installation/settings together. This is not crash-atomic across power loss.
A changed hook implementation requires explicit reconciliation; update does not silently replace it.

## Lifecycle and deterministic selection

SessionStart selects an explicit native session binding, or exactly one checkpoint-bearing change.
No match or multiple matches produce `needs-selection`. It never chooses by mtime or by shared
`.notth/start.json`. A new session with several possible tasks still needs the host to interpret the
current user request, then bind the actual native identity using `aih session`. This ambiguity cannot
be resolved safely by guessing. Session IDs come from the host, never invented by the model.

```bash
aih session <native-session-id> --host codex --change <change-id>
aih recover --host codex --session <native-session-id>
```

Bindings live in ignored `.notth/sessions/`, scoped by host, native session ID and real workspace path.
Switching a bound session requires its observed `--expected <binding-sha256>`. A binding is not a
lease or permission to write. Worktrees have distinct identities. Copying local session metadata
into another workspace fails identity checks. Checkpoints/context remain project-owned canonical data.

SessionStart rebuilds context from current files, compares saved capsule integrity/freshness, and
returns `hookSpecificOutput.additionalContext`. PreCompact and Stop persist an immutable capsule
and pointer when essential state fits. The hook does not parse `transcript_path`, run a model or
capture hidden reasoning. Claude/Codex own actual native conversation compression and its timing.
PreCompact failure **cannot be relied on to prevent native compaction**. SessionStart then rebuilds
from canonical files; facts never written there cannot be recovered by this layer.

## Compaction contract

```bash
aih compact <change-id>
aih compact <change-id> --record --budget 8000
aih recover --change <change-id>
```

The default capsule budget is 8,000 UTF-8 bytes (explicit CLI range 1,024–65,536). Capsules include
task intent, local facts, shared/change decisions with their status, source locators/current hashes,
trace links, checkpoint completed/pending/in-progress work, blockers, operation receipts and input
hashes. They reference source content instead of copying full documents. This is deterministic
selection of durable state; output explicitly says `history_compacted: false`.

Nothing essential is truncated. Oversized state returns `blocked`, required byte count and no capsule;
recording refuses to write. Hosts should reconcile or narrow canonical task scope, never delete
constraints to pass a budget. Missing context/checkpoints, changed sources/baselines/evidence,
external freshness uncertainty, and prepared/unknown side effects require reconciliation. A blocked
capsule may be recorded as a warning-bearing handoff; its status never becomes permission to continue.

Snapshots: `openspec/changes/<id>/compactions/<sha256>.json` and `compaction.json` pointer, schema 1.
Snapshots are idempotent and immutable; pointer/hash corruption refuses recovery. Recovery always
uses current canonical state rather than blindly replaying a saved snapshot. No garbage collection
is automatic. Input state must be redacted first; pattern checks are defense in depth, not a secret
scanner. Local fact/decision content is disclosed to the selected host when injection is enabled.

The runtime shares guarded writes, rollback and path safety with the CLI. It checks its vendored
files against `.notth/lock.json`. This detects ordinary drift, not an attacker replacing both code
and lock. Local event receipts are producer-declared observations, not authenticated host proof.

## Verify actual hosts separately

```bash
npm run eval:recovery -- --host all --out /absolute/new/probe-directory
npm run eval:recovery -- --host codex --model YOUR_MODEL --execute --out /absolute/new/live-directory
```

The separate packaged runner probes executables, creates an isolated disposable task, launches a
host, observes its checkpoint marker, interrupts its owned CLI process, and starts a fresh native
session with a generic continuation request. It checks distinct SessionStart receipts and a randomly
specified pending result. Reports/transcripts persist in the exclusive output directory with mode 600;
review them for sensitive host output before sharing. Temporary workspaces are removed. No flags
bypass host tool approvals or authentication. Explicit execution may consume model quota.

Executable/authentication/tool-permission failures are blockers; wrong recovery after an observed
interruption is FAIL. A version probe or simulated Node fixture never counts as a native recovery
pass. This tests one controlled checkpoint boundary, not arbitrary crashes, remote side effects,
all host versions, or triggering a real native context-window compaction. Missing CLI is BLOCKED;
Kiro command integration remains BLOCKED even when its binary is present.

Implementation evidence and remaining gaps: [change design](https://github.com/manh0303/notth/tree/main/openspec/changes/automatic-session-recovery).

## Upgrade and rollback

Update the managed runtime with its matching CLI and lock. Existing context/checkpoint schemas do
not change. Disable only the handlers containing `notth-session-runtime-v1` from the three events
in the selected native settings file, preserving other settings; restart the host. Restore a full
settings backup only after reviewing intervening user changes. Snapshot/binding data can remain
inert when hooks are disabled. Config backup is not a full backup of checkpoint/capsule history.

## Native contract references

Checked 2026-10-19 against official documentation; executable/version compatibility still needs live trials.

- [Codex hooks](https://developers.openai.com/codex/hooks/)
- [Claude Code hooks](https://code.claude.com/docs/en/hooks)
- [Kiro native compaction](https://kiro.dev/docs/compaction/) does not establish command-hook compatibility.
