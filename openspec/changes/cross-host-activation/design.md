# Design and impact

Base: PR #76 commit 100b25d50c043bb14c9ce9b3fb980fde24340bbe, on main
5cef4a47c9d94f0a451338c6d4db77ab1f73e369. Scope extends the same PR; do not merge/publish.

## Implementation

Opt-in `init/update --host <host> --session-hooks` configures one native bridge. Keep the previous
Codex/Claude bootstrap byte-for-byte and add PostToolUse; extend only the exact old Kiro command
configuration. Cursor/Gemini/Copilot register their event/output schemas, OpenCode installs a local
v1 JS plugin with no SDK import or network calls. Cascade registers observers only, respecting
existing .devin workspace precedence over .windsurf. No transcript-capture hook is configured.

Runtime normalizes real native event/session fields, injects reminders through supported output
channels, and records only bounded metadata. Native execution never belongs to installer code.
Host settings merge retains unrelated handlers and backs up originals; drift/disabled config and
unknown versions fail without writes. No user/global configuration or credentials are touched.

`activation` and optional host/session check/doctor inspect registration and latest prompt/pre/post
receipts for this workspace/session/bundle. Fifteen-minute freshness is only diagnostic metadata;
pre/post must follow the current recorded prompt. Missing identity, previous task/host/workspace,
old bundle and obsolete receipts cannot become successful activation. No receipt authenticity claim;
manual fixtures can emit identical metadata. Memory persistence stays explicitly unverified until
actual canonical task/source/checkpoint files are inspected. This diagnostic itself does not enforce
semantic reconciliation or block a host's entire loop. Owner authorizes integration once; ordinary
chat needs no user memory commands. Unsupported capture follows explicit instruction fallback.

Cursor prompt outputs cannot inject ordinary context; use startup/post-tool and AGENTS. Do not
register its permission preToolUse callback just for memory; activation checks prompt/post-tool there.
Copilot prompt command output is dropped; use startup/post-tool and its instruction bridge. Cascade
stdout is not a documented model context channel, so even matching receipts remain enforcement-limited.
OpenCode targets v1 callbacks and system transform; APIs/builds without them remain unverified.
An inactive/denied host cannot be made to execute a hook by a project file; do not promise otherwise.

## Impact

| Area | Status | Evidence / reason |
| --- | --- | --- |
| core | done | Runtime aliases/receipts, AGENTS entry, generic capture and activation workflow, Core eval |
| adapter | not-applicable | No stack-specific rules/manifests/contracts change |
| capability-skill | not-applicable | Existing source-intake/harness-start workflows reused, no new skills |
| cli-config | done | session-hooks registry, activation CLI, check/doctor diagnostics, opt-in settings/backups |
| workflow | done | Task entry -> native callback -> context -> existing source/task writes -> actual-file verification |
| documentation | done | Host activation guide, CLI/reference/runtime/portability/README and versioning |
| verification | done | verification.md: full 386 tests, validate and package smoke PASS; native trials NOT_RUN |
| release-migration | done | Unreleased/migration, unchanged schemas/version/package allowlists; old receipts unverified |

Link chain: runtime SESSION_HOSTS -> sessionHookChanges -> install settings -> native event ->
runHook -> installed continuity/source-intake -> activation + actual canonical file checks ->
fixture tests/native protocol -> host activation guide. Package cli/*.js/core paths already included;
harness.yaml module/config schemas need no change. Native trials are separate and NOT_RUN.

## Native reference review

Official documentation reviewed 2026-10-21 is linked in docs/host-activation.md. Registration/output
contracts have offline fixtures; this is not a live API/client/version compatibility certification.
Owner's Kiro failure remains reported evidence, not a reproduced local client trial.
