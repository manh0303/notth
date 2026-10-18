# Use Notth with a short request

Install once in the project root with your existing npm/pip/offline CLI. Choose one host:

```sh
npx --yes @manhd_d/notth init --host codex
```

The new optional `--format human` flag requires a release containing this change, or a reviewed
source checkout. It is not assumed available in the currently published registry package.
In AI chat invoke harness-start if exposed, or use the portable first-session fallback:

> Read .agents/skills/harness-start/SKILL.md and use Notth for this task: [your request].

After the host has loaded the entry point, describe the next task directly. Do not paste all rules.

| Task | Example request |
| --- | --- |
| New project | Build a minimal product website: headline, setup video placeholder and workflow. Propose only missing important choices. |
| Existing code | Add export for the filtered list; preserve current permissions and conventions, test and prepare a PR. |
| Bug | Search is slow with a date filter. Reproduce the cause, fix it and show verification. |
| Resume | Continue the saved task. Reconcile changes and tell me what remains. |

The agent chooses Quick/Standard/Full by impact, not line count; these are workflow depths, not CLI
modes. It asks only consequential missing questions, reuses decisions and keeps relevant evidence.
You need not name roles or gates. Host-native discovery is client/version-dependent; a generated
bridge alone is not proof the host loaded instructions. See [host guides](tool-setup/README.md).

## Optional terminal orientation

For a supporting source/release:

```sh
aih start --chat --host codex --format human
aih status --format human
aih changes --format human
```

`--chat` is read-only for every host, even in a terminal. Existing bare start interview behavior
and JSON defaults remain compatible. `--format human` is supported by init/update/start/status/changes;
errors remain structured JSON. Use your existing npx/offline invocation instead of aih when necessary.
An unknown phase means no checkpoint declares one. Task counts are declarations, not proof of tests,
merge or deployment. The host reconciles remote evidence. Do not write a fake checkpoint to resume.

## What gets created?

- `.harness/`: managed workflow snapshot plus project-owned context/configuration.
- `.agents/skills/`: discoverable task instructions; the selected host may also need a bridge.
- Project docs: written by the AI when needed, from accepted inputs/templates; init does not author them.

Notth is the product name; `aih` is the compatible CLI; `harness-*` are compatible skill IDs.
npm uses `@manhd_d/notth`; Python uses `notth` and still needs Node.js 22+.
CLI version and the installed project snapshot may differ until a reviewed update.

## Common blockers

| Symptom | Next action |
| --- | --- |
| npm E404 | Confirm package/version; use the reviewed [source/offline path](getting-started.md#cài-từ-source-khi-registry-chưa-có-package), never invent a successful install |
| Node missing/old | Install an approved Node.js 22+ runtime; pip does not replace Node |
| Skill not listed | Explicitly ask the host to read the canonical SKILL.md; check host/version support |
| Managed drift | Inspect changes, preserve custom rules in project-owned locations, restore managed bytes from the trusted snapshot; do not edit lock hashes |
| Context stale | Inspect seed changed_sources, reconcile affected facts, then seed --record |
| No MCP/design access | Verify actual tools; use an agreed alternative or report the dependent output blocked |
| Several unfinished changes | Choose the intended change; do not resume an arbitrary first entry |

## Release boundaries

The agent records approval scope/source in existing decision/approval records. Design acceptance does
not authorize publication. Existing specific authorization is reused while its scope remains valid.
Completion reports distinguish code, tests, PR, merge, deployment and live verification.
See [migration](versioning.md), [CLI](cli.md), [live evaluation](../evals/new-user-experience.md).
