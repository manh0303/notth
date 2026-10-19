# Set up Notth in your AI tool

Harness installs project instructions; it does not install an IDE, start an AI model or connect accounts.
You need Node.js 22+, your chosen AI tool and a project folder. pip additionally needs Python 3.9+;
see [pip/offline setup](../python-installation.md). npm and pip use the same onboarding.

## 1. Install Harness in your project

Registry commands require a published supporting package. If unavailable, use the
[source/offline path](../getting-started.md#cài-từ-source-khi-registry-chưa-có-package) with the same host and chat flow.

Open a terminal in the **project root** (the folder you open in your IDE), not in the Notth source repo:

```bash
npx --yes @manhd_d/notth init --host codex
npx --yes @manhd_d/notth check
```

Replace `codex` with your one tool: `claude-code`, `cursor`, `copilot`, `gemini-cli`, `kiro`, `opencode` or `windsurf`.
For a new app, create its repository/folder first. Core works with any stack.
Optionally add `--detect` to the same init command to select supported stacks, or choose adapters/capabilities
in [Getting started](../getting-started.md). For an existing Harness installation, use the update steps below.

`npx` does not install a global `aih` command. Optional: run
`npm install -g @manhd_d/notth`, then use `aih` instead of `npx --yes @manhd_d/notth`.

## 2. Open your AI tool

Install/sign in through its official guide, open this same project and follow the matching Harness guide:

| AI tool | Install the tool | Load Harness | Guide |
| --- | --- | --- | --- |
| **Codex** | [CLI / IDE](https://developers.openai.com/codex/quickstart/) | `AGENTS.md`; native `.agents/skills` | [Setup](codex.md) |
| **Claude Code** | [Install](https://code.claude.com/docs/en/setup) | `AGENTS.md` when enabled/not shadowed; otherwise a `CLAUDE.md` import | [Setup](claude-code.md) |
| **Cursor** | [Install](https://cursor.com/docs) | `AGENTS.md`; native `.agents/skills` | [Setup](cursor.md) |
| **GitHub Copilot** | [Install](https://docs.github.com/en/copilot) | Client-specific instructions; CLI native `.agents/skills` | [Setup](copilot.md) |
| **Gemini CLI** | [Install](https://geminicli.com/docs/) | `GEMINI.md` import; native `.agents/skills` alias | [Setup](gemini-cli.md) |
| **OpenCode** | [Install](https://opencode.ai/docs/) | `AGENTS.md`; native `.agents/skills` | [Setup](opencode.md) |
| **Windsurf** | [Install](https://docs.windsurf.com/) | Root/scoped `AGENTS.md`; canonical skill fallback | [Setup](windsurf.md) |
| **Kiro** | [IDE / CLI](https://kiro.dev/docs/getting-started/installation/) | `init --host kiro`; first session `/harness-start`, managed wrappers + SessionStart | [Setup](kiro.md) |

Existing instructions/settings remain yours. Do not replace host configs or copy the whole Harness into
them. Host/version/account capabilities vary; these guides are not live-client compatibility results.

Choose one tool, for example `init --host kiro` or `init --host claude-code`.
On existing installs use `update --host <tool> --dry-run`, then repeat without `--dry-run`.
Only the selected tool's bridge is added; previously managed bridges are preserved on updates.
Claude selection creates its import/wrappers; Copilot/Gemini selection adds managed instruction blocks.
See [ownership, switching tools and new-project migration](../tool-portability.md).

## 3. Start the first session

Invoke **harness-start** if your client discovers the installed skill, or send this same prompt:

> Read .agents/skills/harness-start/SKILL.md and follow it for this project. My task: [task].

Kiro exposes `/harness-start`. Other clients have native discovery/import differences in the guides;
reading the canonical skill is the common fallback. It asks only missing consequential questions and
saves answers incrementally. `aih start --compact --host <host>` returns read-only orientation; use
`start`/host_prompt if terminal intake is preferred. Reuse the existing npm, pip or offline CLI.

For a loading-only check, ask the host to report selected adapters/capabilities and one exact relevant
installed skill path without executing anything; compare with project.json and actual files. Client
claims are not live compatibility evidence. `check` verifies the snapshot, not model behavior.

You do not need to configure models, native subagents or MCP to begin. Harness role files are contracts,
not automatically created native agents. See [Agent configuration](../agent-configuration.md) when needed.

## Existing installs and updates

Commit your current project state on a branch. Review and apply the new snapshot:

```bash
npx --yes @manhd_d/notth@latest update --dry-run
npx --yes @manhd_d/notth@latest update
npx --yes @manhd_d/notth@latest check
```

Review the diff, run project tests and restart/reload your AI session if needed. With a global install,
upgrade the CLI first. Keep project context in `.notth/local.md`; do not edit managed skills.

For cloud work, the connected workspace must contain the installed project files and application tools;
commit the snapshot to the working branch when the host obtains code from Git. Local-only files,
credentials and MCP access are not automatically available remotely. Configure authorized connections
through the host, then record source/output policies in [Artifact contracts](../artifact-contract.md).

Official discovery references checked 2026-10-13; native login, cloud access and live-agent behavior
were not tested here.

For the shared task-first flow, see [simple use](../simple-use.md). On a supporting CLI, `start --chat --host <your-host> --format human` never opens a terminal interview. Native discovery still requires a real client check.
