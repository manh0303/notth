# Design and impact: debug-evidence

## Baseline and authorized scope
Base main: 93c58182b17c3f96d8a80b91de593d86e95b1545, after PR 77. Worktree is isolated from the
previous feature checkout. User accepted the portable evidence proposal and chose the exact name
`debug-evidence`; no legacy skill rename, merge or release is requested.

## Reuse and decisions
- Core debugging already diagnoses cause and retains regression evidence. End-user testing performs
  actual interface checks; verification report validation remains the sole machine-readable report
  contract. The new skill packages those outputs without a second PASS engine.
- Existing bundle recursively copies Core skills/resources. Exact unprefixed support is needed in
  catalog, readSkill, managed lock and Claude/Kiro wrappers; arbitrary custom skill names remain
  outside NOTTH ownership. Collision/drift preflight and transactional installation are reused.
- Optional environment schema-1 bug_evidence policy references an artifacts.json output kind evidence.
  Paths are not duplicated. Pattern/prefix/runner and optional environment-variable name are validated,
  never executed/resolved by the installer. Null/absent policy is backward compatible; seed null only
  for new configs. Artifacts schema and external write/authorization rules remain unchanged.
- Pack template and synthetic NOT_RUN reference live beside the skill. Real stdout is created only
  by a real host run; per-attempt history, code/deployed-build identity and cleanup stay visible.

## Impact matrix
| Area | Status | Evidence / reason |
| --- | --- | --- |
| core | done | debug-evidence resources, debugging/review/bugfix entry points, test-engineer preference, check/eval cases |
| adapter | not-applicable | Language-neutral; no stack manifests or technology choices change |
| capability-skill | done | Core skill installed in canonical and selected host bridges; no optional capability changed |
| cli-config | done | Exact-name helpers and catalog; environment policy schema; legacy/null policy and ownership tests |
| workflow | done | AGENTS -> bugfix/debugging -> debug-evidence + end-user execution -> verification/reviewer handoff |
| documentation | done | Guide, config, matrix, handoff, architecture and portability links; source examples synthetic |
| verification | done | 416 tests, validate and package smoke PASS; verification.md records limits; native/model behavior remains NOT_RUN |
| release-migration | done | Changelog and versioning: preserve user config, resolve name collisions, rollback matching CLI/config; no version bump |

## Declaration-to-consumer chain
core/skills/debug-evidence -> bundle recursion -> locked .notth/core + .agents/skills with resources ->
Claude/Kiro canonical wrappers when selected -> AGENTS/bugfix and relevant role/skill -> real host
execution through existing testing/verification -> actual run/pack review -> debug-evidence guide.
Package allowlists already include cli/*.js, core/, templates/ and docs/; package smoke checks them.

## Risks, migration and limitations
Old CLIs reject the unprefixed namespace/new optional config field. Update the CLI before updating a
consumer; keep custom conflicting skills until ownership is reconciled. Matching rollback retains
project-owned evidence and restores the matching snapshot/config. No arbitrary custom namespace
is adopted. No live host trial or model-compliance percentage is inferred from offline tests. A
source example date, copied PASS summary or HTTP success cannot prove the corrected behavior.
