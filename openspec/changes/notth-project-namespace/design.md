# Design and impact

Base: 880063ba7d19db7cf6476134372ee1b138ffaab2 (main after context PR #67).
Owner explicitly authorized the folder rename, README branding and removal of Beads.

## Namespace and compatibility
All active runtime/config/template/host paths use .notth. harness.yaml declares project_directory;
manifest validation accepts the fixed supported directory while legacy manifests without the field
remain readable. Technical command/skill IDs and internal ownership markers remain stable to avoid
duplicating instruction blocks/native wrappers. Immutable fixture and historical change/release bytes
remain original, including old namespace references that document past behavior.

cli/namespace-migration.js is the sole legacy namespace transition. The public installer detects a
legacy directory, takes the new and legacy cooperative local markers, and stages a relocated copy
in a bounded isolated workspace. It verifies the original aggregate lock before mapping its path keys;
the normal current installer checks individual original managed hashes, config, selection/version and
native collisions there. Prospective native-wrapper paths are included in stage preflight even when
the old lock did not own them. Target writes begin only after this validation completes.

One existing transaction applies new namespace/host files and deletes migrated old files. Arbitrary
project-owned files, machine configuration, existing backups and their bytes are retained. Original
namespace and previously owned host files are backed up under ignored .notth/backups; a receipt
records the mapping. New migrated files default to 0600 where supported. Ordinary write failure rolls
back and clears empty target directories for retry. Process kill/power loss keeps the existing
installer's non-crash-safe transaction limits. Both namespaces already present fail before writes.

The migration bounds legacy content to 20,000 files / 512 MiB and external instructions to 4 MiB.
Unsafe paths/symlinks or missing lock fail without partial adoption. The no-write dry-run uses the
same isolated preflight and returns a plan without target file/directory writes. Read-only old-layout
commands give actionable update guidance instead of silently consulting two namespaces.

Project-owned notes/commands/checkpoint/evidence bytes are not mass-rewritten. harness-start uses
the migration receipt to reconcile relevant references after inspecting moved files and revalidates
affected evidence. Config restore maps only legacy envelope paths, then validates original content
digests, whitelist and merged config before target writes; mixed colliding envelopes fail.

## Retired backend
Remove the guide, marker detection and backend report/selection instructions. Existing context
backend declarations remain readable as inert legacy data and are omitted on the next guarded save.
Local source-linked intent, traceability, CAS/history and checkpoints continue to work independently.
There is no substitute external runtime or task orchestration claim.

## Impact matrix

| Area | Status | Evidence / reason |
| --- | --- | --- |
| core | done | Core rules/workflows/checks/entry skills use .notth; backend selection removed; receipt-driven reference reconciliation |
| adapter | done | All adapter instruction pointers updated to .notth; registry IDs, stack behavior and module selection unchanged |
| capability-skill | done | Capability/template/skill pointers updated; existing IDs retained, no new role or optional dependency |
| cli-config | done | Namespace constants/paths, installer preflight/migration/guard, config archive compatibility and manifest declaration |
| workflow | done | New-layout start/setup/context/checkpoint flows; legacy users update then resume/reconcile actual evidence |
| documentation | done | Root and translated README branding, migration procedure, CLI/config/backup/architecture/host guides |
| verification | done | Original 0.1/0.2/0.12 fixture migrations, migration/rollback/lock/backup tests, package and Python smoke; see verification.md |
| release-migration | done | Unreleased changelog/versioning and rollback; project/lock schemas remain 1; version remains Release Please-owned |

## Link chain
Manifest + cli/files.js namespace → bundle/installer + npm allowlist/Python shared bundle → generated
AGENTS/native wrappers → Core/capability/adapter instructions → source-linked task/checkpoint behavior
→ behavioral/unit/package smoke → README and migration guide. No parallel module registry is added.
Retired guide disappears from new/updated managed payload; its former bytes remain in rollback backup.

## Review boundary
Host interpretation/reference reconciliation and cross-machine coordination remain host-owned; no
live model recall guarantee follows from offline tests. Windows/Node 22 execution is delegated to CI.
Human merge and a separate reviewed release PR remain necessary before registry publication.
