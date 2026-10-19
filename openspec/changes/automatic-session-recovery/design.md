# Design and impact

Native lifecycle → local runtime → canonical task/source/checkpoint reads → bounded capsule → host
additionalContext. Shared guarded filesystem primitives are extracted from the CLI into core/runtime;
source provenance implementation is shared through a CLI re-export. Core bundle discovery packages
this directory automatically; its package.json preserves ESM inside CommonJS consumer projects.
No second task database, provider model adapter or installer subprocess is introduced.

Selection: explicit scope → host/native-session binding → unique checkpoint → needs-selection.
CAS protects session switching. Canonical input digests and live local source hashes invalidate saved
capsules. Essential facts are retained or the budget fails; this is not LLM history summarization.
Local receipts are unauthenticated; integrity hashes detect drift, not hostile replacement of runtime.
Guarded rollback handles ordinary write failures, not process death or OS crash atomicity.

## Impact matrix

| Area | Status | Evidence / reason |
| --- | --- | --- |
| core | done | core/runtime, session-continuity workflow, AGENTS entry point, behavioral scenario |
| adapter | not-applicable | Stack adapter contracts and manifests are unchanged; host settings are CLI integration |
| capability-skill | not-applicable | Existing harness-start already loads session-continuity; skill contracts and capability registry unchanged |
| cli-config | done | compact/session/recover, opt-in hook merge/backups, ignored local sessions, runtime/package tests |
| workflow | done | Native lifecycle supplements existing context/checkpoint workflow, ambiguous selection fails closed |
| documentation | done | session-runtime guide, CLI/architecture/README/continuity entry points; limitations explicit |
| verification | pending | Local gates and probe results recorded in tasks; actual native host E2E remains blocked |
| release-migration | done | CHANGELOG + versioning; schemas additive; disable-handler rollback documented; version unchanged |

## Verification boundary

Local runtime process tests exercise hook JSON, immutable capsules, multiple task isolation, stale
sources, evidence, unsafe identity, oversize/secret rejection, hook preservation/drift and CommonJS.
The recovery runner keeps fixture evidence distinct from native host execution. On this environment
all three executable probes return BLOCKED (not on PATH). No native recovery, native auto-compaction,
model obedience, Kiro command bridge or end-to-end latency/token benefit has been verified.
The PR must remain draft until native execution evidence is reviewed, or reviewers explicitly accept
this bounded implementation while retaining the disclosed follow-up work.
