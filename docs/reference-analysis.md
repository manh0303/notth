# Reference workspace analysis

An authorized reference workspace was inspected for design patterns, not imported as source history.
Reviewed entry points included AGENTS.md, README.md, docs/standards/ai-workflow.md,
docs/standards/backend-conventions.md, docs/standards/testing.md, openspec/config.yaml,
ci/ai-config-check.yml, and the TDD/debugging skill documents.

| Reference pattern | Generalized in this framework |
| --- | --- |
| Shared AGENTS and tool-specific entry points | One managed AGENTS block plus portable skill files |
| OpenSpec propose/apply/review/archive | Tool-neutral workflow and compatible draft templates |
| TDD at observable interfaces | Original harness-tdd procedure and CLI behavioral tests |
| Review against standards and spec | harness-review plus security-reviewer contract |
| Independent service repositories | Scoped repository context and explicit merge order |
| Shared Java conventions | Optional java-spring adapter plus project-owned overrides |
| Basic config-presence CI | Hash-based drift checks, safe installer tests and structural validation |

Project identities, endpoints, private network addresses, service rosters, database schemas, credentials,
repository history and client-specific business rules are intentionally not distributed.
Legacy conventions remain the responsibility of the consumer project; they are not universal defaults.
The framework's skills are newly written concise procedures; third-party skill source from the ZIP is
not vendored. This repository does not claim ownership of upstream tools or redistribute their packages.
