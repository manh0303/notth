# Optional DevOps capability

Stack-independent CI/CD, Docker, deployment, infrastructure planning, observability and incident-response instructions.

```bash
aih init --capabilities devops
aih init --adapters java-spring,kubernetes --capabilities devops
aih skills
aih skill harness-devops-deployment
aih check
```

For existing installations edit the `capabilities` array in `.notth/project.json`, then run `aih update --dry-run`, `aih update`, `aih check`. Combine with an app adapter and optional `kubernetes` adapter when relevant.

Core owns permission gates; `devops` owns cross-stack workflows; adapters own technology specifics. Integrations own provider connectivity. No runtime agents, CI executions or cloud APIs are installed or invoked by these markdown modules. A deployment approval must name artifact and environment, not merely the PR.

**Evaluation scope:** `aih verify --scope all` includes advisory DevOps/Core/adapter checks, and `aih eval --scope all` includes DevOps and matching composition scenarios. Without `--scope`, both commands remain adapter-only for compatibility. Neither command executes CI, a model, a workflow or deployment; evaluation requires separately observed evidence and human scoring.

See [PR to production](workflows/pr-to-production.md) and [incident recovery](workflows/incident-recovery.md).


## Full SDLC handoff

See [Full SDLC](../../docs/end-to-end-workflow.md), [Skill matrix](../../docs/skill-matrix.md), [Agent handoffs](../../docs/agent-handoffs.md), and [Spring Boot → K8s example](../../docs/examples/spring-boot-api.md). DevOps starts from a reviewed PR and immutable artifact, not an unapproved requirement.
