# Design and impact

Use project-owned docs/sources with an independent schema-1 manifest. Stable IDs collect revisions;
original SHA identifies revisions and Markdown SHA distinguishes conversions. New revisions append;
reimports of old revisions never roll back latest implicitly. Imports verify existing indexed files,
reject malformed metadata/symlinks/collisions, bound reads and use installer guard/rollback. A complete
folder copy is recoverable without machine-specific paths. Atomicity has the existing power-loss limit.

CLI does local deterministic UTF-8 text normalization only. Host conversion is explicit and unreviewed;
no parser or provider execution enters the installer. artifacts.json remains the ownership/routing
contract and retains remote provenance. Existing package allowlist includes the new CLI/workflow/docs;
harness.yaml distribution/module registry needs no new entry or version change.

## Impact matrix
| Area | Status | Evidence / reason |
| --- | --- | --- |
| core | done | source-intake workflow; harness-start/spec entry points; Core behavioral case |
| adapter | not-applicable | stack-independent source storage; no adapter contracts change |
| capability-skill | done | existing Core skills route intake; no new capability/skill IDs |
| cli-config | done | sources.js/main.js; independent manifest; strict validation; no config schema change |
| workflow | done | artifact-contract/source-intake; host conversion and review handoff |
| documentation | done | document-sources, CLI, README/VI entry, architecture, backup guide |
| verification | done | 331 tests pass; validate and package smoke pass; see verification.md; live host NOT_RUN |
| release-migration | done | Unreleased changelog/versioning; Release Please owns distribution bump |

## Declaration-to-consumer chain
Core workflow/skill → bundle's recursive Core collection → installed .harness/Core and exposed skills
→ harness-start/spec intake → sources command hash verification + host fidelity review → source guide.
CLI allowlist → npm packaged command smoke → consumer originals/normalized/manifest.
No live host conversion fidelity or behavioral compliance claimed before actual evaluation.
