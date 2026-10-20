# Adaptive verification and TechSpec

The CLI supplies a read-only metadata plan and evidence consistency checks. Your AI host inspects scoped code/contracts and runs authorized application tests. The CLI does not install missing frameworks or execute shell/network/model calls.

```sh
aih init --capabilities product
aih verify --adaptive
aih verify --report verification/report.json
aih new-doc techspec --report verification/report.json
```

Plain `aih verify` and `--scope all` retain their advisory checklist behavior. `--adaptive` and report validation require an intact snapshot; metadata discovery uses the installed CLI's registered detector. Update a reviewed bundle first. `--report` is project-relative; evidence paths are also relative to the project root, not the report directory. Existing TechSpec files are never overwritten. New drafts follow existing artifacts.json routes, including external host handoffs. No new config is needed.

## Discovery and scope

Read requirements, scoped source, architecture, framework manifests, project commands, auth/routes, API contracts, data/services, docs and actual host tools. CLI heuristics read root manifests and contract presence only; they cannot infer arbitrary business rules, monorepo subprojects, credentials, reachable databases or running services. Missing facts remain unknown. Existing frameworks take precedence; select methods proportionally rather than requiring every suite.

| Project | Applicable examples | Environment-dependent limits |
| --- | --- | --- |
| Java backend | JUnit, existing integration/API/contracts, role/state assertions | Testcontainers/database/service access |
| Next.js fullstack | Existing unit/component, API, browser journeys | Browser runner and isolated backend |
| Static calculator | Formula tests, build, accessibility | No invented API/DB suite |
| Existing requirements documents (BRD/PRD/SRS) | Requirement traceability, affected section changes | Source revision/write policy |
| State workflow | Allowed/denied transitions, state invariants, cleanup | Role fixtures and authorized service |
| Mobile / AI | Existing device E2E / versioned RAG dataset | Device or model provider/budget |

Idea-only intake first establishes canonical storage using existing setup answers or a necessary clarification. Existing requirements documents (BRD/PRD/SRS) use declared read-only/propose/write policy; write additionally needs actual host authorization and observed revision. Figma, Confluence, Jira, MCP/database and custom tools reuse dynamic integrations.json aliases. Availability stays unverified until exercised by the host.

## Machine report contract (schema 1)

Top-level fields: `schema_version`, `metadata`, nonempty `requirements` and `scenarios`. Metadata requires `run_id`, `feature`, `source_revision`, `environment`, `producer` and timezone ISO `timestamp`. Optional `usage` requires measured `source`; optional numeric `tokens`/`cost` must be nonnegative and cost needs `currency`. Omit unknown usage.

Each requirement needs unique `id`, `description`, `source`. Each scenario needs unique `id`, `status`, boolean `executed`, known requirement `references`, `method`, nonempty `preconditions`/`steps`, `fixture`, `expected`, `observed`, ISO `timestamp`, boolean `mutates`, `cleanup: {strategy,status}`, `evidence` and `assertions`. Unexecuted scenarios use BLOCKED/NOT_RUN plus `reason` and empty assertions. Executed scenarios require `execution: {tool,command,exit_code,timeout_ms,attempts,max_attempts}` and digest-checked evidence. Optional duration is nonnegative.

Evidence is `{path,sha256}` with a real local regular file, maximum 1 MiB. Assertion values are read from digest-checked JSON using RFC 6901 pointers:

```json
{"id":"approved-state","basis":"AC-1","layer":"state","operator":"equal","expected":"approved","actual":{"evidence":"verification/response.json","pointer":"/state"}}
```

Supported operators: equal, not-equal, contains, type. Layers: transport, schema, business, state, authorization, result. Assertion basis must reference the scenario's requirement. Optional typed observed must match raw JSON. Expected values come from reviewed AC/contracts, never copied from observations just to pass.

PASSED requires successful execution receipt, nonempty matching assertions, allowed error semantics and successful mutation cleanup. API/backend-e2e/business-workflow/authorization/security/browser-e2e/mobile-e2e/cli-e2e also require a nontransport assertion. `error: {kind,message}` distinguishes timeout/network/http/application/assertion/environment. `expected_error` can only name http/application and still needs assertions; arbitrary catch is never success. Contradictory status is rejected. FAILED dominates the overall result, then BLOCKED, then NOT_RUN or missing coverage. A requirement is VERIFIED only if all its linked scenarios pass; otherwise UNVERIFIED. Empty coverage cannot pass.

Digests detect evidence drift. Execution receipts and semantic layer labels are producer-declared: validation does not authenticate that a command ran, a requirement is correct, cleanup truly occurred or the recorded revision matches source. Independently inspect raw logs/source and business assertions. Redact secrets before reports; automatic credential screening is limited and does not replace review. Paths/symlinks and oversized evidence fail safely.

## Documentation and safety

TechSpec combines requirements, code, applicable contracts and actual evidence; static analysis remains UNVERIFIED. Include only relevant architecture, business rules, interface/error, data/auth, UI, dependencies, compatibility and operational sections. Partial updates preserve unaffected user edits and approved intent; record before/after source revisions and artifact impact. CLI scaffolding is create-only; affected-section edits are reviewable host work.

Use test-owned UUIDs and isolated fixtures, bounded retries/timeouts and cleanup receipts. Never kill processes by port, write fixture roles to production/shared databases, use MAX(ID)+1 or embed credentials. Host/runtime enforces permissions. Missing access yields BLOCKED, not PASS. No automatic source writes, merge or deployment.

## Verification of this update

`tests/verification.test.js` covers seven project discovery fixtures and malicious/inconsistent reports. A real Node loopback HTTP fixture executes create, denied approval, authorized approval, read and owned cleanup assertions. It is an isolated test service, not evidence of Spring/Playwright/mobile execution or agent compliance. Existing test/package gates remain deterministic, with no paid model calls.

Live agent evaluation is BLOCKED until an intended host/model and authorized budget are available. Reuse Core/Product cases via `aih eval --scope all` and the existing eval rubric; run the same requirement/code fixtures with baseline and candidate, record versions and raw evidence, compare success, denied effects, gaps, measured latency/tokens/cost. Unscored cases remain unscored. See [evaluation guide](../evals/README.md).

Reference review reused generic lifecycle, role/state/error and selective-maintenance patterns. Hardcoded project ports/accounts, database mutation snippets, kill-by-port, false expected-error success and CRM-specific contracts were deliberately excluded.

## End-user verification target

For user-facing acceptance, use [End-user testing](end-user-testing.md). Adaptive discovery now exports
end_user_acceptance hints and a host handoff. Requirement verification_target=end-user requires a
web/mobile/cli/api surface; a matching passing journey using actual interface interaction and
real/not-applicable dependencies must exist. Mock/unknown or another interface cannot satisfy it.
Existing behavior-only schema-1 reports remain valid. Optional journey attachments use separate
bounded binary digests rather than JSON assertion evidence; the guide defines limits and semantics.
