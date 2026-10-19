# CLI contract

Invocation: `aih COMMAND [--target /existing/project]`.
Node.js 22+; built-in modules only; no network, subprocesses, remote provider calls or dependency installs.
Output is JSON on stdout on success; errors use stderr. Drift reports from check and failed evaluation reports use stdout with exit 1.
Exit 0 means the requested operation succeeded; 1 means validation/I/O/drift failure or blocked readiness/setup; 2 is a CLI usage error. Help and version are plain text; no arguments displays help.

| Command | Options | Effect |
| --- | --- | --- |
| list | --source | List validated adapters and namespaced skills |
| detect | --source | Read target build files and return heuristic matches with evidence |
| resolve | --source; --adapters a,b; --capabilities a,b | Validate module selection and compatibility; read-only |
| verify | --scope adapters/core/capabilities/all or --adaptive or --report file | Advisory checks, metadata plan or evidence consistency; executed false, no subprocesses |
| eval | --scope adapters/core/capabilities/all; --report FILE | Emit unscored template or aggregate reviewed report; no model calls |
| init | --host ID (optional); --detect OR --adapters a,b; --capabilities a,b; --agent-preset recommended/economy/custom; --source; --dry-run; --allow-major | Install a snapshot and seed project agent preferences; exact rerun without explicit preset is idempotent |
| update | --host ID (optional); --source; --dry-run; --allow-major | Update unedited owned files and seed missing project files |
| check | none | Compare installed files/block with lock and selection; no writes |
| doctor | --skill NAME (optional) | check plus configured environment/path diagnostics and generic PATH hints; no execution |
| setup | --host; --apply [--dry-run]; --greenfield | Read-only by default; --apply creates missing user config from installed templates without reinstalling the snapshot |
| decisions | --scope project/module:name (optional) | Read confirmed/proposed/superseded shared choices; project scope is included in module results; no approval or writes |
| artifacts | none | Report declared inputs/outputs/storage/write policy and host connection aliases; no discovery or tool calls |
| ready ID | --stage implement/review | Structural readiness; blocked returns exit 1, ready returns exit 0; no business approval |
| new-change ID | none | Create an unapproved OpenSpec draft using installed templates |
| new-doc TYPE | --capability ID (default product) | Copy one selected locked template into the owner's project docs without overwrite; Product idea/research use `docs/discovery/`, other Product types use `docs/product/` |
| skills | none | List installed skill metadata only |
| skill NAME | none | Read one installed, locked skill |

All commands default --target to the current directory. --source defaults to the installed package.
For a global install, upgrade the CLI with `npm install -g @manhd_d/notth@latest` before
`aih update --dry-run` and `aih update`. Update never fetches npm. `aih --version` reports the CLI
version; `aih check` reports the project snapshot version. For a local install, update the local
dependency and use `npx aih`. Application tests must be executed separately.
--help/-h and --version/-v are available. Unknown, duplicate and inapplicable flags fail.
Source and target cannot contain one another, except source inside target/node_modules for local npm installs. Symlinks in roots, source
payload or destination paths are rejected. IDs are lowercase hyphenated slugs; archive is reserved.
Astro projects are detected from `astro` in package.json dependencies; `react-dom` used only for Astro islands is not a standalone React/Next.js detection when `next` is absent. Explicit `--adapters astro,react-nextjs` remains valid. `aih init --adapters astro` installs static-first rules/skills but no Astro packages or Cloudflare deployment.
Selection changes belong in .harness/project.json; unknown or duplicate adapters fail validation.

## Optional monetization capability

`aih init --capabilities monetization` installs five stack-independent advertising/revenue skills and 2 Markdown workflows with 4 templates. Combine with `--adapters astro` or `react-nextjs`; `product` and `uiux` are optional. `aih verify --scope capabilities` gives an unexecuted manual publisher policy/consent checklist. `aih new-doc` defaults to Product; explicitly choose `--capability monetization` to scaffold a declared installed template into project-owned `docs/monetization/` without overwrite. No Google account access, ads publishing or metrics APIs are provided. See [Monetization guide](monetization.md).

## Project environment and clarification

See [Project configuration](project-configuration.md) for the schema and Maven example.
Init/update seed a project-owned environment.json and append /machine.json to .harness/.gitignore,
preserving previous content. Private machine files are not created, locked or published by the CLI.
Doctor returns nonzero for configured required paths/variables that are missing; diagnostics omit values.
Setup returns questions/options/recommendations for the AI host; it does not read stdin or write answers.
Init/update/new-doc/new-change also return next_steps without executing them.

See [Change readiness](change-readiness.md): new changes include decisions.json and verification.json
when those templates are present in the installed lock. Legacy snapshots still scaffold their existing
files; update first to adopt sidecars. ready does not rewrite old changes, validate upstream OpenSpec,
run tests, infer every semantic ambiguity or verify that recorded evidence is true.

## Ownership and conflict behavior
AGENTS.md ownership covers only text between the unique start/end markers, inclusive. Any modification
inside the block is drift; text before/after is user-owned. A malformed marker pair fails safely.
The snapshot and exposed harness skills are fully owned files. init refuses different unmanaged content;
identical content can be adopted. Existing OpenSpec config is project-owned and preserved, not validated
by this CLI. Run the upstream OpenSpec validator for spec/config correctness.
check detects changed/missing locked files and mismatched adapter selection. It does not verify all
application code, external tools, remote origin or model behavior. The lock is not a cryptographic signature.

## Recovering failures
For conflicts, preserve custom work in Git, move project-specific rules to local.md and restore managed
files from the last install commit. Re-run dry-run. Do not manually regenerate hashes to suppress drift.
For an interrupted install inspect .harness-install.lock, confirm no installer is running, remove the
stale marker and restore a known-good installation from Git. Then check and retry on a branch.
There is no uninstall command; revert the installation commit. No command merges or publishes changes.

## Capability commands
list/detect read the CLI package or explicit --source. verify/eval require a valid installed snapshot and
read its pinned metadata, rules and cases. Every referenced capability file must be covered by the lock.
Detection reads only declared paths directly in --target, capped at 1 MiB per file; malformed package JSON
and symlink probes fail. It does not infer framework versions or recurse into workspaces/node_modules.
init --detect refuses empty detection; it cannot be combined with --adapters or used on update.
verify labels file presence as candidate/not-detected, and manual checks as review-required. This is not
proof that a script exists, a command is safe, or a native toolchain is available. Commands are never run.
eval without --report emits {dataset, report}; save/edit only the report object as the submission.
Missing metadata, null/nonboolean scores, missing/duplicate/unknown cases or stale hashes fail validation.
Any false criterion returns status fail and exit 1, including a list of critical failures where relevant.

## Selective capabilities and progressive skill loading (0.4.0)

- `aih init --capabilities uiux` is optional and independent of `--adapters`.
- `aih list` returns a `capabilities` array alongside adapter metadata.
- `aih skills` lists **installed** names/descriptions and paths only (no full skill bodies).
- `aih skill harness-uiux-figma-design` returns only that single installed, locked skill text.
- Invalid, duplicate and unknown capability IDs fail before installing. Custom capabilities must have a registered and valid source manifest.
- For existing installs, edit the `capabilities` array in `.harness/project.json`, then use `aih update --dry-run` followed by `aih update`. Init refuses an already installed conflicting selection.
- Selecting a capability copies only its managed snapshot and exposed skills into the consumer. npm package transport itself still contains all bundled capabilities.
- Neither `skills` nor `skill` contacts the network or runs model/tool integrations. Both require a drift-free installed snapshot.

## Product docs and safe template scaffolding (0.5.0)

- `aih init --capabilities product` or `aih init --capabilities product,uiux` installs
  Product workflows, role contracts, document templates and skill pointers.
- `aih list` returns capability agents/templates metadata alongside skills/workflows.
- `aih new-doc brd`, `aih new-doc prd`, `aih new-doc backlog`, etc. safely
  copy **one** locked template from `.harness/capabilities/product/templates/` to
  the project-owned `docs/product/<type>.md`. An existing file is never overwritten.
- `aih skills` lists descriptions only; `aih skill harness-product-brd-generation`
  loads specific task guidance when needed.
- For installed projects, change `.harness/project.json` selection and run update/check.
- Documents must be populated by an authorized AI host using source references;
  no command retrieves Confluence, calls an LLM or claims stakeholder approval.

## Module composition (foundation hardening)

`aih resolve --adapters java-spring,kubernetes --capabilities product,uiux,devops` is read-only and validates dependencies, conflicts, version metadata, and declared compatibility before install. Optional recommendations only warn. Init/update use the same resolver.

## Unified eval scopes

`aih verify --scope all` and `aih eval --scope all` include the Core and installed capability/adapter contracts plus matching cross-module scenarios. `adapters` is the unchanged default for backward compatibility. `capabilities` and `core` isolate those cases. Older installed snapshots without Core evaluation assets must be upgraded first. The CLI emits advisory checks and a human-scored report; it never executes provider commands or AI evaluations.

## Human workflows and examples

See [Getting started](getting-started.md) for CLI boundaries, [Full SDLC](end-to-end-workflow.md) for review gates, [Skill matrix](skill-matrix.md) for valid skill IDs and [Agent handoffs](agent-handoffs.md) for role responsibilities. The four [examples](examples/fullstack-web.md) distinguish advisory `aih` commands from external build, AI and deployment tools.


## Product document templates — discovery and specifications

With the optional `product` capability selected, `aih new-doc idea` and `aih new-doc research` safely create `docs/discovery/<type>.md` in the consumer repository. Other names including `prd-lite`, `srs` and `use-cases` create `docs/product/<type>.md`.

All types must be declared templates in the installed, hash-locked Product manifest. Commands refuse unknown names, traversal, overwrite, collisions and installation drift. These are **blank templates only**, not AI-generated content. Read [Documentation workflows](documentation-workflows.md) for the two intake paths and approvals.

### Convention setup guidance

`aih setup` suggests a new/maintain/mixed scope question for unconfigured environments without guessing an answer. Regardless of suggested questions, the host must inspect existing conventions and reuse opportunities; a configured tool does not establish project mode. Answers stay in project-owned `.harness/local.md`. See [Project conventions](project-conventions.md). No application scanning, scaffolding or commands are executed.

## Architecture and Delivery drafts

`aih new-doc <type>` still defaults to Product (idea/research remain under docs/discovery).
Use `aih new-doc overview --capability architecture`, `aih new-doc adr --capability architecture` or
`aih new-doc delivery-plan --capability delivery` for a declared template in that installed capability.
Output is project-owned docs/<capability>/<type>.md; locked metadata/templates are required, drift and
overwrite are refused, and no draft is filled or approved. --capability is supported only by new-doc.
The historical Product delivery-plan path remains supported; do not duplicate an accepted plan.
See [Solution workflow](solution-workflow.md) and [host setup](tool-setup/README.md).

## Agent preferences

`aih init --agent-preset recommended|economy|custom` seeds project-owned agents.json non-interactively;
existing files are validated/preserved and explicit preset overwrite is refused. `aih setup --host codex`
(or claude-code/gemini-cli/cursor/copilot/custom ID) exports resolved roles and compatibility limitations
without probing models or editing host files. No extra config command, runtime or usage tracking.
See [Agent configuration](agent-configuration.md).
Setup exit 0 means the read-only plan was produced, not that all models are usable. Inspect the nested
agent_configuration.status and active route availability; host-incompatible/unverified requests require
actual host checks before execution.

## Artifact contract
[Input/output/storage and integrations](artifact-contract.md) are project-owned configs. Init/update
seed absent configs and preserve existing bytes; check validates schemas/references before writes.
`aih artifacts` is read-only; setup suggests missing storage decisions. Explicit docs routes override
legacy new-doc folders; external routes return a template/host handoff with executed false and no
local fallback. Configured output contracts require reviewed artifact-impact.json coverage in ready;
review stage requires declared completion/evidence. No remote calls, source writes or approval claims.

See [Adaptive verification and TechSpec](adaptive-verification.md) for read-only discovery, evidence reports and selective technical documentation.

## Agent-first additions (unreleased)

aih agents shows canonical IDs, skill preferences and model declarations. init --host claude-code seeds a native preset only when agents.json is absent. init/update --link-claude and --claude-skills opt in to managed import/wrappers; native settings remain user-owned. checkpoint <id> --report saves project-owned recovery state; --expected supplies prior digest for replacement. resume <id> is read-only. See [Agent-first guide](agent-first.md). No command launches agents, probes providers, merges or measures quota.

## Start, backup và restore (bản nâng cấp này)

| Lệnh | Hành vi |
| --- | --- |
| `aih start` | Terminal: intake ngắn; không TTY: read-only plan; trả host_prompt |
| `aih start --goal docs --task "Implement requirements" --input docs/requirements --output docs/specs` | Lưu task và seed nguồn/output còn thiếu |
| `aih backup [--output backups/config.json]` | Export tối đa 9 file cấu hình dùng chung, gồm decisions.json; không ghi đè archive |
| `aih restore --from config.json --dry-run` | Kiểm tra schema/digest và xem file/conflict trước ghi |
| `aih restore --from config.json [--replace]` | Phục hồi cùng dự án, tự backup trước thay file khác nội dung |
| `aih restore --from config.json --transfer` | Chuyển module/model; bỏ repo autonomy và nguồn/task/domain/command cũ |

Tất cả nhận --target. Đường dẫn --from/--output tính từ project root. --host dùng với start;
--change dùng cho start --goal change (proposal có sẵn) hoặc resume (checkpoint có sẵn). Các flags sai command bị từ chối. Lệnh --dry-run thuộc restore
không đổi target hoặc chờ stdin. Fresh repo restore trước init; installed repo update/check sau khi
selection đổi. Đọc [Start](start.md) và [Configuration backup](configuration-backup.md) cho giới hạn,
phục hồi checkpoint và rollback. Các lệnh không truy cập remote, chạy model, cấp quyền hay auto-merge.

## End-user acceptance (unreleased)

verify --adaptive exports end_user_acceptance with metadata surface/tool candidates, required context,
Core skill/workflow references and a host prompt. The CLI does not execute interfaces or install tooling.
verify --report accepts optional schema-1 end-user requirement targets, surface/journey fields and
separately bounded binary attachment digests. Wrong-surface/mocked/unknown scope cannot satisfy full
end-user acceptance. See [End-user guide](end-user-testing.md); producer receipts need independent review.

## Session onboarding commands

See [Kiro quick start](tool-setup/kiro.md) and [schema/ownership](session-onboarding.md).

| Command | Options | Effect |
| --- | --- | --- |
| init / update | --host kiro | Lock native wrappers + v1 SessionStart; preserve custom host files |
| start | --host kiro | Read-only host question plan, including TTY |
| start | --compact [--host kiro] | Short JSON orientation without terminal intake/source scan; freshness is unchecked, no MCP access claim |
| setup | --apply [--dry-run]; --greenfield | Scaffold missing user config only; existing paths/answers and managed payload/lock stay intact; --greenfield selects host guidance |
| decisions | --scope module:name | Read project-wide and matching module choices; host must check source applicability |
| seed | --record OR --check | Plan loading, record reconciled hashes or check freshness; no model calls |
| doctor | --skill NAME | Check local requires; MCP remains unverified |
| sync-integrations | --host kiro; --from FILE; --dry-run | Import aliases only; no credentials/server execution/tool inference |
| change-sidecars ID | none | Add missing external proposal sidecars; no overwrite |

New commands require supporting reviewed source/release.

## Workflow contract (schema 1)

`aih workflow validate` validates locked installed workflows without execution.
`aih ready <id> --workflow spec-to-code --stage implement` opts into declared entry/approval gates;
`--workflow idea-to-prd` requires Product. Legacy implement/review without --workflow retain behavior.
[Contract and approvals](workflow-contract.md). Runner stays separate: [conformance](conformance-runner.md).
All CLI commands also work through [pip/offline](python-installation.md); Node.js 22+ still required.

## AI tool selection

Choose one host: `aih init --host kiro` or `aih init --host claude-code`, for example.
Supported guides cover kiro, codex, claude-code, cursor, copilot, gemini-cli, opencode and windsurf.
Fresh installation adds only the selected tool's required bridge. Codex/Cursor/OpenCode/Windsurf
reuse AGENTS.md without duplicate rules. Claude selection enables import/wrappers; legacy
individual flags remain supported. Unknown safe IDs remain valid for custom hosts without a bridge.
When changing tool, use `update --host <tool>`; existing managed bridges and project state are preserved.
Model defaults follow the selected host on fresh install; existing agents.json is never converted.
See [Tool portability](tool-portability.md) for ownership, migration and validation limits.

## Daily orientation and recoverable work

| Command | Effect |
| --- | --- |
| `aih status` | Read-only task/modules/change/task declarations and checkpoint freshness/side-effect guidance |
| `aih changes` | Read-only local change list, bounded to 100 with a truncation flag; excludes archive |
| `aih start --goal change --change <id> --task <text>` | Save an existing proposal selection without requiring a checkpoint |
| `aih start --clear` | Back up config, remove saved intake only; preserve changes/evidence/docs/processes |

No automatic archive, task sync, service start or semantic completion inference. Existing resume
still requires a real checkpoint. All support the same npm/pip/offline invocation.
Command arguments may reference declared `${files.<id>}`; doctor resolves machine overrides and
`${ENV_NAME}` for reference checks only, without printing values or running commands.
See [Reusable workflows](reusable-workflows.md) and [Project configuration](project-configuration.md).

## Task-first output (supporting source/release required)

init/update/start/status/changes accept `--format human|json`; omitted means JSON for compatibility.
Human output summarizes relevant results, preserves warnings and does not infer execution. Errors
remain JSON and exit codes unchanged. Unsupported commands reject --format before any write.
`start --chat` gives read-only compact orientation on every host. It cannot be combined with saving,
clear or compact flags; use `--goal ... --task ...` to save. Bare start's existing TTY interview remains.
Compact/chat adds entry_action separately from next_action and capabilities/progress. Status adds
progress with declared phase, blockers and unknown remote delivery state. No persisted schema changes.

[Persistent input documents: originals, Markdown and recovery](document-sources.md).

`aih import-source <id> --input <file> [--normalized <md>] [--dry-run]` preserves a local source
and optional host conversion. `aih sources` verifies and lists the source store. Both accept
`--target`; neither requires an installed snapshot or changes artifacts.json automatically.
