# Agent-first delivery and recovery

Use the same reviewed CLI and project snapshot. Upgrade older installations using the migration steps below; distribution versions remain release-PR owned.

## Responsibility and scope
Core Orchestrator selects only needed BA, PO/Product Manager, SA, PM, Developer and QA/Reviewer perspectives. Single host performs them sequentially; independent workers require actual host delegation. Inspect scope, approved requirements/ADRs and existing conventions first. Open architecture/technology choices go to SA with alternatives/trade-offs and actual owner decision. Reuse accepted choices without asking again. Adapters implement accepted designs; they do not choose infrastructure.

Core-only works on unsupported stacks. Registered detection is metadata, not a supported-stack restriction or runtime readiness guarantee. All remaining adapter skills take approved SA decisions as input. The Java outbox/migration and Astro Cloudflare/microfrontend recipes are retired; old IDs return migration guidance after update. Existing old snapshots still contain their old locked skills until reviewed update. Edited managed retired files block the whole update rather than being deleted silently.

## Selective capabilities and compatibility
Analysis exposes 11 canonical Product skills for requirements/domain/AC/traceability/TechSpec. Discovery exposes 5 for idea/research/MVP/PRD/outcomes. product remains the 16-skill compatibility bundle. Select either or both without duplicate skill IDs. Canonical Product assets are vendored to retain shared references and old template paths; this controls exposed context, not npm download size. There are no new npm packages.

```sh
aih init --capabilities analysis,architecture,delivery
aih agents
aih skills
aih new-doc srs --capability analysis
```

For existing consumers edit project.json capabilities on a branch and use update --dry-run/update/check. Product new-doc routes stay usable when the selected profile declares that template. Profile-specific routes default to docs/<profile>; existing artifact outputs take precedence. No existing document is moved.

core:project-manager is canonical. product:project-manager and delivery:project-manager remain configured role aliases with their model overrides; canonical_id identifies the same responsibility. Delivery-plan aliases resolve to one locked template but preserve old output routes and old user docs.

## Models, autonomy and budgets
New seeds keep the host-selected model (provider host, model host-default). Existing agents.json bytes are preserved. init --host claude-code seeds Anthropic native aliases sonnet/haiku/opus only when absent; aliases do not verify account access. Explicit mappings/premium choice still require actual host support. Optional execution.autonomy declares assisted/autopilot, actions and repositories; autopilot needs explicit nonempty action/repository scope. Optional budget declares maxTokens or maxCost/currency. These settings neither grant user authorization nor enforce permissions/quota. Defaults remain assisted by absence; this repository's no-auto-merge rule applies to its own development.

Example optional declaration:
```json
{"mode":"autopilot","actions":["read","edit","test","commit","create-pr"],"repositories":["team/project"]}
```

This is execution.autonomy, not a complete agents.json replacement. Merge/release/deploy/source-write need explicit action scope and actual user authorization plus host/repository rules. Do not manufacture quota or auto-switch to paid models.

## Brownfield and Claude
```sh
aih init --detect --host claude-code --link-claude --claude-skills
aih doctor
```

Without Claude host selection or opt-in flags, init/update preserves CLAUDE.md. Selecting --host claude-code enables the import/wrappers; --link-claude appends only a managed @AGENTS.md import, preserving BOM/line endings/user text; existing active imports are left alone. The managed block is drift-checked and subsequent updates preserve it. --claude-skills installs locked wrappers directing the host to full canonical .agents skills; custom native skills/settings survive and collisions abort before writes. Verify actual loading with Claude /context and invoke a wrapper in an authorized session. CLI tests do not prove live skill loading.

Doctor examines root CLAUDE.md/CLAUDE.local.md and .claude/CLAUDE.md, excluding imports mentioned inside code/comments. It warns about possible instruction shadowing, not a proven host failure. Claude version, ancestor/global files, plugins and settings remain unverified. Official documentation: https://code.claude.com/docs/en/memory and https://code.claude.com/docs/en/skills .

Maven detection follows declared module paths at most two levels, 64 POMs, 1 MiB per file and 4 MiB total. Evidence identifies each POM; missing/deeper modules produce warnings. Unsafe paths/symlinks, XML entities/CDATA and interpolation fail rather than being resolved. This is a bounded metadata reader, not general XML/profile/interpolation resolution. Other monorepos need host discovery.

Team-owned .agents/.claude skills outside Harness names are preserved and excluded from the Harness catalog/check. check validates locked files, not user skill semantics. The host can load those skills normally. Unowned collisions at a Harness destination fail; no global scanning or adoption occurs.

## Meaningful-step checkpoint and recovery
Use existing OpenSpec design/tasks/decisions/evidence as authoritative work records. Save a compact machine checkpoint after meaningful steps and before external side effects; do not copy chat history or secrets. See the [checkpoint fixture](examples/checkpoint.json).

```sh
aih checkpoint change-id --report handoff.json
aih resume change-id
aih checkpoint change-id --report next-handoff.json --expected <prior-checkpoint-sha256>
```

Checkpoint requires an existing change and intact installation. Baseline/evidence paths are project-relative, local regular files with SHA-256 and 1 MiB limits. Completed tasks/operations need evidence; receipts are producer-declared. Replacements require the observed previous digest and preserve previous bytes in checkpoint-history. This is trusted-workspace compare-before-write, not a cross-host database transaction.

Resume is read-only: flag stale baseline and unknown/prepared side effects; check actual source/remote state before retry. Do not recreate PRs/publications whose outcome is unknown. External source revisions are declarations and need host reconciliation. Omit usage or use null when unknown; measured cost needs source/currency. Evidence drift blocks recovery until reconciled. Interrupted work before a checkpoint may still need reconstruction.

## Verification, evaluation and rollback
Use existing adaptive verification/report/TechSpec contracts and source-write policy. UAT and operational feedback update the existing backlog/proposal, not accepted scope automatically. BA domain work includes glossary/data dictionary/state/decision tables when relevant. Required runtime/source publication checks stay BLOCKED/NOT_RUN when inaccessible.

Local tests and real tarball smoke validate contracts, preservation, drift, alias routes and recovery; live agents remain unscored until authorized host/model/budget. For 18-run manually entered comparison use [real-task protocol](../evals/real-task-comparison.md) and scripts/compare-tasks.js; missing observations remain null.

Review update --dry-run/update/check, snapshot Git diff and changed catalog. No custom configs, source documents, native settings or work records are automatically migrated. Re-export eval reports because bundle/dataset hashes change. Revert the consumer snapshot commit to roll back. Existing module/role/template routes are retained; consumers depending on retired recipes must review the migration before upgrading.
