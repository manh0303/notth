# Bugfix workflow

1. Capture expected versus observed behavior using redacted inputs and an environment fingerprint.
   Apply `.notth/core/rules/project-conventions.md`; inspect comparable code and reuse existing
   helpers before adding a fix. A small bugfix needs only a compact task note, not a full survey.
2. Create the smallest reproducible failing test or repeatable observation. If blocked, document access
   or data needed; label an unverified hypothesis as such.
3. Rank plausible causes and test one distinguishing prediction at a time.
4. Repair the cause with a minimal diff; verify the regression and adjacent boundary conditions.
5. Review blast radius, backward compatibility and rollback. Add a change spec when behavior changes.
   For a requested evidence pack or a material API/auth/data/integration/concurrency defect, load
   `.agents/skills/debug-evidence/SKILL.md` (CLI: `aih skill debug-evidence`). Capture baseline before
   patching when available and package actual after-fix runs with artifact routes and optional
   environment bug_evidence policy. Reuse harness-end-user-testing and existing verification reports.
   Small fixes with adequate existing regression evidence need only a compact note and rationale.
6. Open a PR with the reproduction command, evidence before/after and remaining uncertainty.

Use [task experience](task-experience.md) for the canonical Quick/Standard/Full decision table, minimum context, scoped approvals and concise next-action handoff.
