# Claude Code

## Install and open

1. Install/sign in using [official Claude Code setup](https://code.claude.com/docs/en/setup).
2. Run [common setup](README.md) in your project root.
3. Run `claude` from that same root.

## Load and verify

Direct `AGENTS.md` support requires Claude Code v2.1.277+ and the relevant instruction setting/plugin.
By default, an existing `CLAUDE.md`, `.claude/CLAUDE.md` or `CLAUDE.local.md` in the working directory
or its ancestors can prevent direct loading.

For a compatibility bridge, add this line outside code fences to the root `CLAUDE.md`; create it
if absent and keep existing content:

```markdown
@AGENTS.md
```

An import inside `.claude/CLAUDE.md` uses `@../AGENTS.md` instead.
In Claude's chat, use `/context` to inspect loaded memory files, then run the
[read-only setup prompt](README.md#3-start-the-first-session).
Organization policies may restrict loading; an import does not bypass them.

## Skills

Claude's native project skills live in `.claude/skills`, not Harness's `.agents/skills`.
The basic setup works by asking Claude to read the needed canonical skill.
For native slash invocation, use a small pointer wrapper rather than copying the skill body.

With a supporting reviewed CLI, `init/update --host claude-code` creates the managed
`CLAUDE.md` import and native skill wrappers together, preserving existing content/settings.
Existing `--link-claude` and `--claude-skills` flags still allow selecting either bridge separately.
Without Claude selection or those flags, no new Claude bridge is created. Once installed,
bridges are retained on updates. See [Tool portability](../tool-portability.md).

## Optional configuration

Use [Agent configuration](../agent-configuration.md) only when needed; keep existing settings.
Models, native agents and access remain Claude-controlled, not selected automatically by a role.

## Official references

Checked 2026-10-13; no logged-in Claude client or live-agent smoke was run.

- [Memory, AGENTS conditions and imports](https://code.claude.com/docs/en/memory)
- [Native skills](https://code.claude.com/docs/en/skills)
- [Models](https://code.claude.com/docs/en/model-config)

## Common first-session onboarding

npm and pip/offline use the same `aih init --host claude-code` bundle and canonical harness-start.
Invoke harness-start when your client exposes it, or send:

> Read .agents/skills/harness-start/SKILL.md and follow it for this project. My task: [task].

Reuse saved answers; do not start a second terminal interview. Client-specific imports/discovery above
still apply. [pip/offline prerequisites and updates](../python-installation.md).

For the shared task-first flow, see [simple use](../simple-use.md). On a supporting CLI, `start --chat --host <your-host> --format human` never opens a terminal interview. Native discovery still requires a real client check.

## Optional native session hooks

Enable once with `aih update --host claude-code --session-hooks` after reviewing `--dry-run`.
Restart the client to reload settings. SessionStart injects canonical recovery and PreCompact/Stop
save durable capsules. Native conversation compression stays host-owned.
[Contract, executable prerequisites, live-test gaps and rollback](../session-runtime.md).
