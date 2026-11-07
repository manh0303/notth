# Design and impact

Optional schema-1 test_environments records a gateway variable name and project-relative confirmation source. It neither reads the source nor verifies a database or grants permissions. Older CLIs reject this field; back up and remove it before rollback. Consumer files remain project-owned.

| Area | Status | Evidence or reason |
| --- | --- | --- |
| core | done | adaptive verification and harness-verification |
| adapter | not-applicable | host-neutral behavior |
| capability-skill | done | harness-verification skill updated |
| cli-config | done | cli/environment.js optional validation, old configs accepted |
| workflow | done | bounded sibling evidence discovery and current-target reconciliation |
| documentation | done | docs/adaptive-verification.md |
| verification | done | npm test (417), validate and package smoke passed; native host trial NOT_RUN (evals/session-continuity.md) |
| release-migration | done | changelog and rollback guidance; project data preserved |
