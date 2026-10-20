# Architecture and scope

Engineering depth extends existing Core skills through engineering-quality.md, original selective
Architecture/Product templates, registered stack rules and optional host-executed document export.
It adds no lifecycle engine, exporter dependency, schema or second specification store. See
[engineering guide](engineering-quality.md) and [reference inventory](../integrations/engineering-sources.md).

Maintainer entry point: [Harness maintenance and impact matrix](harness-maintenance.md).

Notth is a versioned instruction and workflow distribution framework. Its executable part is a
local installer and integrity checker, an optional offline lifecycle context runtime, and separate
opt-in host test drivers. The lifecycle runtime preserves external state around host-native
compaction; it does not execute tasks. See [session runtime](session-runtime.md).
It is not an LLM gateway, an orchestration server or a sandbox.

| Layer | Responsibility | Owner |
| --- | --- | --- |
| core/rules | Evidence, context loading, code/change discipline | Harness maintainers |
| core/policies | Permission and security contracts | Maintainers plus runtime admins |
| core/skills | Repeatable task procedures | Harness maintainers |
| core/agents | Role inputs, outputs and authority limits | Harness maintainers |
| core/workflows | Stage order and review evidence | Harness maintainers |
| adapters | Technology-specific defaults and suggested checks | Adapter maintainers |
| capabilities | Optional cross-stack product, UI/UX, DevOps and ad monetization workflows | Capability maintainers |
| integrations | GitHub, GitLab and MCP setup contracts/templates | Project/runtime owners |
| templates | AGENTS entry point and OpenSpec draft structure | Harness maintainers |
| core/runtime | Offline lifecycle snapshots/injection; host owns model/tools/compaction | NOTTH code, native host triggers |
| CLI + lock | Deterministic installation and update conflicts | Executable framework |
| project overrides | Domain facts, actual versions, approved exceptions | Consumer project |

## Installation design
The consumer receives a vendored .notth snapshot and .agents/skills/harness-* files. AGENTS.md gets
one marked block. The CLI leaves text outside that block intact. The generated .notth/lock.json records
schema version, release version, selected adapters, each owned content hash and an aggregate hash.
The hashes detect accidental drift; they are not signatures and cannot detect a coordinated malicious
edit to both payload and lock. Review source commit provenance and consumer lock diffs in Git.

Project-owned seeds: .notth/project.json, .notth/local.md and openspec/config.yaml. Updates preserve
their contents. Existing openspec specs/changes are never rewritten. Only previously owned, unchanged
files can be deleted when a new bundle removes them. Unknown user files are never swept away.
Identical pre-existing payload may be adopted; conflicting payload aborts the entire preflight.

init/update take an exclusive installation marker, preflight changes, and write files atomically one at
a time. Ordinary write failures roll back bytes already changed. This is not a crash-safe multi-file
filesystem transaction: a power loss, process kill or rollback I/O failure can leave partial state.
Commit consumer state before updates; after interruption inspect the marker, run check and restore from Git.
Empty directories may remain after rollback/removal. Symlinked roots/paths are intentionally unsupported.
Concurrent hostile filesystem mutation is outside the threat model; run in a trusted local workspace.

## Project environment and structural readiness

Project-owned environment.json records tools, files and command arguments; ignored machine.json may
override declared paths only. No environment values are copied into the managed lock. Installer seeds
the shared contract and preserves existing contents; the scoped ignore rule is appended transactionally.
The environment reader uses metadata/path presence only, with no execution or private-value output.

Setup is a host-facing question plan. Clarification instructions live in Core workflows.
Readiness reads project-owned OpenSpec decision/evidence sidecars and Markdown structure, returning
blocked or ready. It is not a semantic validator, runtime policy engine or approval mechanism.

## Agent/runtime boundary
Roles are Markdown handoff contracts. The host decides tool execution and delegation. A role document
does not create another agent or supply an API key. Use the same framework in an IDE assistant or your
own model-backed runtime; actual permissions, cost limits and network allowlists live in that runtime.

## Advertising monetization capability

`capabilities/monetization/` is an optional, stack-neutral guide for legitimate publisher readiness, safe ad UX, SEO and revenue analysis. It does not install provider SDKs, access Google accounts, claim consent compliance or guarantee approval/revenue. Templates are vendored into the selected consumer under `.notth/capabilities/monetization/templates/`; `aih new-doc` defaults to Product; explicit `--capability monetization` selects a declared installed template into project-owned `docs/monetization/`. Review [Monetization guide](monetization.md).

## Astro static-first adapter

Astro là technology adapter độc lập (`adapters/astro/`), không phải capability chung, dùng chung Core/Product/UIUX/DevOps khi được chọn. Sáu skills tập trung website tool tĩnh, islands, SEO, performance, Cloudflare và đường nâng cấp Micro Frontend. `aih detect` nhận diện `astro` trong root `package.json` và bỏ nhận diện React/Next chỉ đến từ `react-dom` khi dùng Astro Islands (trừ khi có `next`). Không thêm Astro runtime vào Harness và không tự chạy build/deployment. Xem [Astro walkthrough](examples/astro-micro-tools.md).

## Extending adapters
Add adapters/<id>/adapter.yaml (schema 2), rules.md, rules/, namespaced skills/, checks/verification.yaml
and evals/cases.json. Register the id in harness.yaml; add detection, installation and evaluation cases.
See docs/adapters.md for the strict JSON-compatible YAML contract. Detection is opt-in and read-only;
checks are advisory and never executed. Installed capabilities are read from the locked snapshot, not
from the latest global CLI source. Core TDD/debug/review are not duplicated in adapters.

## npm and Python distribution
The package exposes bin/aih.js as `aih`. It uses native JavaScript ES modules and Node.js built-ins:
the npm executable has no runtime dependency, network client or install hook. The pip distribution
adds a thin Python launcher for the same JavaScript CLI; Node.js 22+ remains required. Its wheel
contains the shared package allowlist, with no npm/npx invocation or Python runtime dependencies.
Source paths resolve relative to the package, not cwd. The target defaults to cwd. Local node_modules
installation is an explicit exception to overlap rejection; payload destinations never include node_modules.
The npm files allowlist ships runtime assets including the hidden OpenSpec template. A smoke test packs
and installs a real tarball globally and locally without registry access. Development tests and fixtures
are excluded from distribution. Only the development smoke script launches npm subprocesses.

## Optional capabilities (0.4.0)

Capabilities differ from technology adapters: they represent reusable workflows such as UI/UX,
not runtime stack defaults. A registered capability contains `capability.json` schema 1,
namespaced `SKILL.md` files and workflow contracts, installed only when selected. CLI copies
the selected capability under `.notth/capabilities/<id>/` and exposes its skills to
`.agents/skills/`. The existing Core and technology adapter contracts remain unchanged.

`aih skills` exposes metadata-only catalog and `aih skill <name>` retrieves a single locked
skill after drift validation. The agent host controls actual skill activation and remote MCP.
For package size, source npm distribution currently bundles all capabilities, but consumer
snapshot and AI context are selective; split distributable packages only when size warrants it.

## Product documentation capability (0.5.0)

An optional `product` capability owns business-analysis and product-documentation
role contracts and templates. Capability schema-1 now supports optional unique safe
`agents` and `templates` Markdown path lists (required fields remain unchanged).
Role files must include Inputs, Outputs, Permissions and limits, Handoff sections.
The existing `uiux` manifest without these optional fields remains valid.
Selected capability artifacts are hashed and installed with the existing lock safety.

`aih new-doc <type>` reads a locked, drift-free Product template, creates
`docs/product/<type>.md` as project-owned data, and refuses overwrite/symlinked
destinations. It never fills confidential content, fetches Confluence or auto-approves.
The approved PRD/BRD/stories/AC serve as source of truth for UI/UX and OpenSpec.

## DevOps and Kubernetes composition (0.6.0)

DevOps is an optional stack-neutral capability for release procedures and SRE; the Kubernetes adapter owns workload/Helm details. Product role/template support from 0.5 remains unchanged. Both are installed only when selected, vendored and hash-locked alongside existing modules. Integrations/runtime permissions are independently administered; no instructions can grant cloud access, override Core approval gates or trigger production changes. `aih verify`/`aih eval` use adapter-only defaults; opt in to Core and capability scenarios with `--scope all`, without executing runtime checks.

## Foundation hardening (in source; candidate not published)

`cli/composition.js` validates a selected module graph before copying managed content. Optional `module_version`, hard `requires`, soft `recommends`, `conflicts` and `compatible_adapters` use namespaced refs like `adapter:kubernetes`. Cycles, unknown refs, missing required or explicitly incompatible modules fail before writes; recommendations only warn. Config and lock schemas remain 1, and module metadata is pinned inside installed snapshots.

`aih verify/eval --scope all` reads Core, selected adapters/capabilities and matching cross-module scenarios from locked files. Default without scope is still adapter-only for compatibility. Checklists are advisory, evaluations human-scored, and no local/remote commands or models run. See [release policy](release-policy.md).

## Documented end-to-end usage

The cross-module route is described in [Getting started](getting-started.md), [Full SDLC](end-to-end-workflow.md), [Skill matrix](skill-matrix.md) and [Agent handoffs](agent-handoffs.md). All roles/skills remain instruction contracts. The four [stack walkthroughs](examples/spring-boot-api.md) illustrate permitted integrations, not a runnable scaffold or orchestration engine.

## Solution delivery capabilities

Product 1.2.0 adds MVP/outcomes and explicit template/example/quality/handoff sections. Optional
Architecture and Delivery schema-1 modules use existing roles/templates/checks/evals and locked
installation; soft recommendations never auto-select them. Core solution-framing provides proportional
overview/MVP/NFR/architecture/impact context without requiring every capability or document.
new-doc gains explicit --capability (default Product), validating installed metadata and declared
templates and preserving project-owned outputs. See [Solution workflow](solution-workflow.md).
Host configuration bridges are user-owned recipes in [tool setup](tool-setup/README.md); no host
account configuration, native-agent installation, new dependency or orchestration engine is supplied.

## Agent configuration boundary

config/agents.default.json is the canonical recommendation, locked as templates/agents.default.json in
the snapshot. agents.json is project-owned and preserved. agents.js validates/resolves aliases and
namespaced roles; setup supplies an advisory host plan with availability unverified. No provider calls,
native writes, orchestration, usage meter or automatic escalation. Old alternate sources use the packaged
default when absent; old consumers without config remain valid. See [Agent configuration](agent-configuration.md).

## Project artifact and integration contracts
Project-owned artifacts.json/integrations.json use schema 1 independently of project/lock schemas.
The installer seeds absent configs, validates before writes, and preserves custom bytes. The shared
JSON reader does not echo parse input. artifacts.js validates local paths/refs/dependencies and
provides a read-only host plan; no provider registry, connector runtime, secrets store or discovery.
new-doc routes to an explicit docs folder or returns an external template handoff without fallback
copies. OpenSpec stays repository-owned; configured outputs add structural artifact-impact coverage
and completion to readiness. See [Artifact contract](artifact-contract.md).

See [Adaptive verification and TechSpec](adaptive-verification.md) for read-only discovery, evidence reports and selective technical documentation.

## Continuous development

The [continuous-development workflow](continuous-development.md) composes existing Core and optional Product/Architecture/Delivery contracts. Baseline/impact and handoff sections extend existing OpenSpec Markdown templates; no schema, runtime, state store or CLI command is added. Hosts reconcile revisions and perform authorized section edits; structural readiness cannot enforce semantic freshness.

## Agent-first changes (unreleased)

Optional capability profiles declare asset_owner for a canonical owner; loading validates subset membership, and installation vendors canonical assets while exposing selected skills once. Optional agent/template aliases retain old IDs/routes. Root CLAUDE managed import and native skill wrappers are opt-in locked payloads; external native settings remain project-owned. Checkpoint commands store declarations/history and compute local drift without a runtime/state server. See [Agent-first migration](agent-first.md).

## Guided intake and portable configuration

start uses terminal prompts or a non-TTY plan with saved user-owned start.json; canonical source/output
declarations remain artifacts.json. backup exports an allowlisted, bounded UTF-8 config archive only.
restore validates schema/digests/configs/paths, previews conflicts, requires explicit replacement and
saves a before-backup through the same installation guard/rollback machinery. Transfer copies only
project/agent preferences and removes repository autonomy. No credentials, machine paths, locked
payload, custom skills or checkpoint/document contents are exported. Full repo recovery remains Git
and external-source backup. See [Configuration backup](configuration-backup.md).

## End-user acceptance

Core test-engineer routes public journeys to harness-end-user-testing and the end-user-acceptance
workflow. Adaptive CLI exports tool/surface hints only; the host executes actual interfaces. Optional
schema-1 journey declarations and bounded binary attachment digests qualify explicitly requested
end-user requirements by matching surface and dependency scope. Receipts are producer declarations,
not authenticated browser/model execution or UAT approval. No browser dependency/runner enters the CLI.
See [End-user testing](end-user-testing.md).

## Session onboarding and Kiro bridge (unreleased)

Core harness-start delegates semantic seed/questions to the host. Optional local.md frontmatter is
bounded YAML/JSON; legacy prose is preserved. CLI seed stores local source/config hashes in project
knowledge.json outside the managed lock. --host kiro installs locked native wrappers and SessionStart
v1; requires are read-only prerequisites, extensions are host loading plans, MCP sync imports aliases
only. No model/runtime, provider probe, network or shell execution. See [contracts](session-onboarding.md).

setup stays read-only by default; setup --apply restores missing shared seeds from the locked installed
snapshot without changing managed assets or lock. It validates existing and proposed config before
transactional writes. Optional project-owned decisions.json separates confirmed/proposed/superseded
project/module choices from per-change decisions. Config backup retains shared decisions, transfer
omits them, and context freshness includes their digest. Compact start provides orientation only,
with freshness unchecked. None of these declarations grant permission or prove live host compliance.

## Contract, driver and evidence planes

| Plane | Harness responsibility | Execution owner |
| --- | --- | --- |
| Contract | Workflow stage/entry gate/role/artifact declarations | Harness owns schema; host applies semantics |
| Driver | Optional separate conformance script; no execution in cli/ | Host or replaceable engine such as Temporal |
| Evidence | Evaluation/verification/approval record formats | Producer/reviewer owns truth and identity |

core:orchestrator is a role, not an engine. JSON contracts currently cover spec-to-code and selected
Product idea-to-prd; validation/entry readiness neither executes stages nor authenticates approval.
See [workflow contracts](workflow-contract.md), [conformance driver](conformance-runner.md), and
[pip/offline distribution](python-installation.md). The non-goal remains: no LLM gateway or server.

## Portable host bridges

init/update accepts one host ID selected by the user; canonical Harness bodies remain in the locked snapshot
and exposed .agents/skills. Kiro/Claude wrappers point at those bodies. Copilot and Gemini
use standard managed blocks in their native entry files; Claude keeps its existing import markers.
Lock drift checks only owned blocks; outside text survives updates. Host-native settings,
custom skills and external OpenSpec commands are project-owned. No symlink or machine-root
command is generated. See [Tool portability](tool-portability.md).

## Reusable project workflow

status/changes read local declarations; start --change selects an existing proposal or checkpoint,
and start --clear removes only saved intake after a config backup. No second task-state database or
process runner is introduced. Optional knowledge is a source-linked index in the project's actual docs,
not a mandated .notth tree; knowledge.json remains only a hash cache. Core recoverable-verification
uses existing checkpoint/evidence contracts and actual host process support. Product 1.8.0 connects
incremental TechSpec and related flows. `${files.<id>}` in command args reuses project/machine file
paths without executable interpolation or shell execution. See [Reusable workflows](reusable-workflows.md).

## Task-first presentation and design delivery

presentation.js renders optional human CLI summaries; JSON remains default. start --chat is a read-only
entry for all hosts, with entry_action distinct from the next task action. status derives progress from
existing task/checkpoint declarations; it does not query GitHub or authenticate delivery. No new state
store or runtime is added. Core task-experience owns depth/minimum-context/approval/handoff rules.
UIUX 1.1.0 adds a tool-neutral design-delivery workflow while retaining Figma IDs/routes.

UIUX 1.2.0 adds contextual direction and optional external-skill handoffs. Canonical project DESIGN.md
or existing design master is host-maintained, never installer-owned. The pinned upstream inventory is
documentation, not a second executable plugin registry; no downloads, Python or service calls enter
cli/. Local NOTTH instructions work without external libraries; render/MCP execution remains host-owned.

## Persistent source documents

cli/sources.js owns local import/index validation through the existing guard/transaction helpers.
Project-owned docs/sources is outside managed payload and config backup. Independent schema 1
records content-addressed originals and conversions; artifacts.json remains ownership/routing truth.
Core source-intake routes host conversion and source review. No converter, network, shell or model
runtime is added. See [Document sources](document-sources.md).

External provenance extends source manifests to schema 2 on explicit metadata import. Captures bind
canonical resource/scope, observed revision, time and completeness to exact snapshot bytes; immutable
checks bind raw host evidence to a capture. source-provenance.js validates envelopes and derives
time-qualified freshness, not live access. Schema-1 local stores remain readable without rewrite.

## Source-linked session continuity

cli/task-context.js validates optional project-owned schema-1 context.json in existing OpenSpec
changes. It holds intent and canonical trace pointers, not a second task-state or decision database.
Start/chat returns the saved task as a hint; explicit context --change pins session scope. Local hashes,
source-catalog current paths and dependency propagation identify affected links; resume includes this
report. Guarded digest/revision writes retain history. No network, shell, model or distributed lock is
introduced. Core session-continuity delegates automatic read/reconcile/checkpoint behavior to the host.
See [Session continuity](session-continuity.md).

## NOTTH namespace migration

New snapshots/configs use .notth; harness.yaml declares project_directory. cli/namespace-migration.js
preflights old .harness consumers in a bounded isolated workspace using the same current installer,
then commits the namespace/host-file changes through the existing guard/transaction. Both namespaces,
managed drift and unsafe paths fail before writes. Original bytes are backed up under ignored
.notth/backups and the receipt guides host reconciliation of old user-owned references. Legacy and new
installer markers cooperate during migration; this remains a local guard, not a crash-safe or distributed
transaction. No executable external task backend is discovered or bundled. See [Migration](notth-migration.md).

[Adaptive Core: canonical memory and host-neutral handoff](adaptive-core.md).
