# Design and impact

Preflight branches to already available host tools without installation. A note does not prove a CLI binding, and configured aliases do not prove access. No host execution, schema or authority is added.

| Area | Status | Evidence or reason |
| --- | --- | --- |
| core | done | continuity, task experience and artifact workflows |
| adapter | not-applicable | host-neutral behavior |
| capability-skill | not-applicable | existing workflow entry points retained |
| cli-config | not-applicable | no config or CLI contract changed |
| workflow | done | host preflight and fallback in core/workflows |
| documentation | done | integrations/mcp/README.md |
| verification | done | npm test (416), validate and package smoke passed; native host trial NOT_RUN (see evals/session-continuity.md) |
| release-migration | done | changelog; update existing managed snapshot, no schema change |
