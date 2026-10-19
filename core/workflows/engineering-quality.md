# Engineering quality — proportional routing

This extends spec-to-code, not a second lifecycle. Users describe outcomes; read only the relevant
skill/section. Existing decisions and repository conventions outrank optional external suggestions.

| Task | Read / apply | Minimum evidence |
| --- | --- | --- |
| Defect | harness-debugging → harness-tdd → harness-review | Reproduction, supported cause, regression and adjacent checks |
| New behavior | harness-spec + planner → harness-tdd | Vertical slice, independent expected result, actual checks |
| Refactor | harness-tdd Refactoring section | Preserved behavior, characterization tests, bounded changes |
| Architecture decision | Installed architecture solution-design / decision-records | Context, alternatives, drivers, actual decision |
| Technical document | Installed product techspec / document-review | Selective contracts and requirement → evidence links |
| Document file export | Installed product workflows/document-export.md | Source revision, actual render QA or BLOCKED |

Before coding record affected entry points, comparable code, reused APIs, convention sources and test
boundary in the existing task note. Do not require another document for a tiny fix. Break substantial
work into observable vertical slices: behavior, intended files, prerequisites, verification and done
condition. Prefer an exact verification command over invented duration estimates.

For every relevant risk select at least one distinguishing scenario: wrong actor/tenant, boundary input,
duplicate request, concurrent update, dependency timeout, partial failure, stale cache or incompatible
old client. Do not assume a database/broker/cache exists. Use project stack guidance only when selected.
Keep API/DTO/database/event/schema changes consistent with actual consumers; preserve public contracts
unless an authorized change and migration justify breaking them.

Verification uses harness-verification and existing recoverable-verification. One passing test cannot
prove the whole feature; map accepted requirement IDs to scenarios, expected/observed outcomes, revision,
real/mocked dependency scope and evidence. Missing infrastructure is BLOCKED, skipped is NOT_RUN, an
assertion mismatch is FAILED. Timeout is never success. An old PASS is stale when affected code/config,
fixtures or dependencies change. Persist checkpoints after meaningful groups, not every keystroke.

Review has two perspectives, not mandatory extra agents: requirement compliance and engineering risk.
Use actual diff and evidence, verify actionable findings and recheck fixes. State unknowns and residual
risk; no runtime security guarantee or business approval follows from a review.

Optional upstream reference inventory: .notth/integrations/engineering-sources.md.
No upstream library is automatically installed, no subagent is required, and no installer executes tests.
