# Design and impact

Schema-1 report metadata optionally declares type and superseding report path, scope and reason. The validator checks structure and safe paths but does not verify replacement coverage or mutate old verdicts. Reviewers must independently compare evidence and actual sources.

| Area | Status | Evidence or reason |
| --- | --- | --- |
| core | done | artifact and adaptive verification workflows |
| adapter | not-applicable | host-neutral behavior |
| capability-skill | not-applicable | existing workflows and skill retained |
| cli-config | done | cli/verification-report.js optional metadata |
| workflow | done | acceptance source and report history contracts |
| documentation | done | docs/verification.md |
| verification | done | npm test (417), validate and package smoke passed; native host trial NOT_RUN (evals/session-continuity.md) |
| release-migration | done | changelog; legacy reports supported, metadata is advisory |
