# Project conventions and architecture fit

Apply this rule before implementation and during review, including small bugfixes. Keep discovery
proportional to the task; a short task note is enough for a small change. This is an instruction
contract for the AI host, not an automatic architecture checker.

## Choose the mode per affected module
- **New (greenfield):** no established implementation in scope. Propose the smallest suitable layout,
  name/style/error/test conventions and dependency boundaries using the relevant adapter defaults.
  Resolve consequential choices through the clarification workflow before scaffolding; use established
  authorization for routine choices. Do not generate speculative layers, base classes or empty folders.
- **Maintain (brownfield):** preserve the target module's architecture, public contracts, dependency
  direction, naming, package manager and configured tools. A new feature in an existing module is still
  maintenance. Do not modernize or reformat unrelated code as a side effect.
- **Mixed:** a new module inside an existing repository adopts repository-wide contracts and shared
  infrastructure; agree only its genuinely new internal choices. Map mode and boundaries per module.

Do not infer mode from an empty source folder, the presence of a package manifest, or adapter detection
alone. Inspect the requested scope, neighboring modules and established decisions first.

## Resolve the applicable standard
Within platform/security constraints and the user's authorized scope, use this order:
1. Explicit reviewed project/module decisions (AGENTS, local.md, ADRs and approved conventions).
2. Applicable formatter/linter/build configuration and consistent patterns in the target module.
3. Adapter defaults for unresolved gaps only.

Inspect configuration and representative implementation together. One legacy file is not a convention.
If documentation, configuration or modules disagree, identify the paths and scope of the conflict;
ask only when it materially affects the task. Never copy fail-open authorization, secret logging or
another known unsafe pattern merely for consistency. Explain a safe, bounded correction; obtain a
decision when the fix changes a public contract or exceeds the authorized scope.

## Find before creating
Before adding a file, dependency or abstraction:
1. Read local instructions, build/lint/format settings, relevant module boundaries and one or two
   comparable implementations plus their tests where available.
2. Search the affected module and authorized shared packages for the needed behavior: common APIs,
   errors, mapping, pagination, clients, components, hooks, state, storage and test helpers.
3. Record a compact task note: inspected paths, selected pattern, reusable symbol/path, intended new
   code location and any gap. If nothing fits, record the search scope and why a new piece is needed.
4. Reuse only through supported public boundaries when behavior and ownership match. Do not reach
   into another module's internals, create dependency cycles or push domain-specific logic into common.
5. Prefer a local implementation over an unrelated shared abstraction. A small amount of similar code
   is acceptable when its meaning or lifecycle differs. Never invent reuse evidence.

Keep durable decisions and source paths in `.notth/local.md`, or link existing authoritative docs
there. Keep task-specific reuse evidence in the change/PR. Do not duplicate whole guides or create a
new document for every trivial edit. Update stale facts when the scope or source changes.

## Control the diff and verify
New dependencies, generic wrappers, base classes, global state and cross-module APIs need a concrete
requirement and a brief rationale. Ask before material architecture/contract changes outside agreed
scope; do not seek repeated approval for ordinary authorized implementation. No speculative framework,
unused export, dead code, commented-out implementation or unrelated cleanup in the delivered diff.

Review placement, naming, reuse, dependency direction, duplicate behavior and unnecessary abstraction.
Run applicable configured format/lint/type/build/tests and existing architecture checks through the
host; do not invent commands or install tools just to satisfy this rule. If a boundary has no automated
check, report the manual review and its limits; propose a focused check only when warranted.
Report actual results, skipped checks and new-component rationale. `aih check`, `aih verify` and
structural readiness cannot prove application convention compliance or model behavior.
