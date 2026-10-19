# Agent configuration and model routing

Harness declares preferences; the AI host performs model selection and execution. No provider calls,
automatic native configuration, agent creation, token enforcement or usage tracking is supplied.

## Setup
```bash
aih init --adapters java-spring --capabilities product,architecture,delivery
# Or, for a new consumer:
aih init --agent-preset economy
aih setup --host codex
aih check
```
Run only the init variant appropriate to a new consumer. Existing installs use reviewed update
--dry-run/update/check. Recommended is the default; custom seeds the same valid starting file for
editing. An explicit preset against existing agents.json refuses overwrite. setup prints A/B/C choices
and resolved routes; it never interviews or writes answers. No new aih config command is necessary.

## Ownership
Canonical recommendation: config/agents.default.json in the package/source. It is copied as locked
.notth/templates/agents.default.json. Project-owned .notth/agents.json is seeded on init or the
first reviewed update and then preserved byte-for-byte, outside the managed lock. Editing it is expected.
Old snapshots without agents.json remain readable. An older alternate --source without the new default
uses the installed CLI's canonical seed; no source files are changed. Invalid custom config blocks writes
with a field-level error; it is not reset automatically. Keep credentials in host-managed secrets, not here.

## Contract and precedence
Schema version 1 uses provider, defaultModel, defaultReasoning, models, agents and execution, with
optional hosts. Role IDs are namespace:role: core:planner, product:project-manager and
 delivery:project-manager retain distinct configuration IDs but alias the canonical core:project-manager responsibility. Defaults cover all current roles; only installed selected
roles are active. Unknown/custom role IDs can be declared but are not asserted to have a host contract.
Future unmapped installed roles inherit project defaults and are listed by setup.

Models are explicit native/opaque IDs or @alias references. models values are strings or
{provider, model} descriptors; alias graphs must be finite, declared and acyclic. A bare balanced is
an opaque model ID, while @balanced is an alias; this avoids silently accepting alias typos.
Resolution: role model → project default model; role provider → alias descriptor provider → project
provider; role reasoning → project default reasoning. Changing only defaultModel does not override
explicit role mappings. enabled:false disables a dedicated route, not required review/security policies.

```json
{
  "schema_version": 1,
  "provider": "host",
  "defaultModel": "host-default",
  "defaultReasoning": "medium",
  "models": { "economy": "host-default", "balanced": "host-default", "premium": "host-default" },
  "agents": {
    "core:orchestrator": { "model": "@balanced", "reasoning": "high" },
    "core:implementer": { "model": "@balanced", "reasoning": "medium" },
    "core:documentation": { "model": "@economy", "reasoning": "low" }
  },
  "execution": { "mode": "hybrid", "maxConcurrentAgents": 2, "maxRounds": 3, "autoEscalateToPremium": false },
  "hosts": {}
}
```
This is a partial example; omitted registered roles inherit defaults. The shipped default covers Core,
Product, Architecture and Delivery roles. Orchestrator/Planner/Architect/Reviewer/Security Reviewer
use declared high/medium reasoning preferences; new seeds retain host-selected models and documentation uses low reasoning. Explicit provider/model examples below illustrate configuration and are not defaults.
Economy is Luna low with single-agent/one concurrent session; it is a preference, not a cost guarantee.

Reasoning levels structurally accepted: none, minimal, low, medium, high, xhigh, max, ultra. Actual
supported levels vary by model/client. Mode is single-agent, hybrid or multi-agent; concurrency is
integer 1–32, rounds 1–20, and single-agent requires concurrency 1. These are schema bounds and advisory
requests, not runtime capacity claims. Automatic premium escalation must be false; explicitly select
@premium or another native model if desired. JSON max size 1 MiB; no shell text is executed.

## Cross-provider and host mapping
For Claude, choose an available Anthropic model and provider explicitly; OpenAI model IDs do not
become Claude models. Gemini likewise needs an available Google/Vertex model. A role override may use:
```json
{ "provider": "anthropic", "model": "native-model-id-from-your-host", "reasoning": "medium" }
```
The placeholder is not an availability assertion. Alias descriptors allow the same explicit provider/model
choice across several roles. Supported vendor transport/authentication must be configured in the host.

Optional hosts.<host>.models maps provider/model to an explicit native replacement, and hosts.<host>.reasoning
maps logical effort to native values. These are user-selected substitutions, not claims of equivalent
models. For example, after inspecting the real Claude picker, replace this illustrative mapping target:
```json
{ "models": { "openai/gpt-6.1-sol": "native-claude-model-id" }, "reasoning": { "medium": "medium" } }
```
Put it inside hosts.claude-code. Configure every active request that needs translation, including Luna
for documentation if used; unmapped incompatible routes are reported. setup marks availability unverified
and runtime_verified:false even when a mapping is supplied. Unknown hosts also require verification.

## Actual native integration
[Tool setup](tool-setup/README.md) explains project-owned bridges. [Codex](tool-setup/codex.md),
[Claude Code](tool-setup/claude-code.md) and [Gemini CLI](tool-setup/gemini-cli.md) contain model/native
configuration references. Copy only a reviewed mapping into existing native config; do not overwrite it.
CLI/IDE single sessions may retain one model while playing many roles; per-role preferences require
supported native agents or deliberate separate sessions. Cursor/Copilot availability and reasoning
controls vary by client. No role JSON automatically creates a native subagent or changes current session.

## Lightweight execution
[Routing workflow](../core/workflows/agent-routing.md) sizes execution to the task. Hybrid defaults to
one lead plus at most one independent helper when supported. Keep inputs scoped, load skill metadata
before one needed body and checkpoint unresolved work. Actual usage/quotas come from the host; no fake
budget meter is inferred from model tiers, maxRounds or concurrency. See [Agent handoffs](agent-handoffs.md).

## Agent-first defaults and declarations (unreleased)

New seeds use host/host-default so the actual host model remains selected; old agents.json is preserved. Claude host init offers native aliases only when absent. aih agents resolves canonical role IDs and required/optional skill preferences. Optional execution.autonomy and execution.budget are validated declarations, not execution permission or quota enforcement. Checkpoint real usage or unknown; never infer cost or auto-escalate. See [Agent-first guide](agent-first.md).

## Project role extensions

Role overrides can add `extensions: ["plugins/project/agents/security-reviewer.md"]`.
`aih agents` exports core-first contract_load_order and blocks missing extensions. The host loads
them in order, preserving core security and reconciling conflicts. Extensions do not transfer to
another project. See [session contracts](session-onboarding.md#role-extensions).
