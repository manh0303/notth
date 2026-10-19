---
name: harness-react-nextjs-behavior-testing
description: Verify React and Next.js features with user-facing component, integration and browser tests. Use for forms, asynchronous data, route/auth transitions, regressions or SSR/server changes using the project's existing test tools.
---

# Web behavior testing

## Input
Approved SA/ADR decisions for the affected scope, existing project conventions and actual stack versions. This skill implements accepted design; it does not select infrastructure, dependencies or architecture.
Changed feature/AC, confirmed package scripts and test configuration, framework/router/version,
available browser/build access, and the existing fixtures/providers/API test boundary.

## Procedure
1. Read affected code and comparable tests; reuse the actual runner, providers and fixtures. Select
   the smallest checks that demonstrate the behavior and risk; avoid mirroring implementation details.
2. Use Core TDD for regressions. Assert visible text, semantic roles, labels and user interactions;
   cover validation, loading/empty/error/success, pending writes and latest-response behavior when touched.
   Control time/network at the agreed boundary and isolate account/query state between tests.
3. Keep real feature modules connected in integration tests; mock external services rather than every
   hook. Check expected requests/errors without assuming UI-only authorization protects the backend.
4. Use an available browser flow for routing, focus, session transitions and affected hydration/server
   behavior. For Next.js async Server Components verify current runner support; use a real server/browser
   check where component runners cannot exercise that boundary. A mocked render is not server evidence.
5. Run configured relevant tests and affected lint/type/build checks. Record command, result and scope;
   report unavailable browser/server checks explicitly instead of labeling them passed.

## Output
AC → component/integration/browser evidence, meaningful regression tests, actual check results and
blocked verification with an owner. Identify simulated network/auth behavior separately from real flows.

## Example
For a search race, arrange two controllable responses, send queries A then B, resolve B then A and
assert that results B remain visible. For an async Next.js route, report browser/server verification
as blocked if only a component runner is available; do not manufacture an E2E pass.

## Quality checklist
- Test user-observable outcomes and failure paths with deterministic fixtures.
- Keep checks independent and avoid assertions solely on snapshots, hooks or internal state.
- Separate mocked API/component coverage from browser, server authorization and production build evidence.
- Explain skipped checks; use actual package scripts rather than invented commands.

## Constraints
Do not add a competing test framework or approve release based on coverage percentage alone. Do not
call production services or claim browser/SSR/security verification from unit tests. Keep Core review gates.

## Handoff
Pass observed failures/results, AC IDs, relevant test/source paths and blocked environment needs to
Implementer/Reviewer. Use `.agents/skills/harness-react-nextjs-server-boundaries/SKILL.md` for direct
authorization/cache verification when relevant; the CLI does not run these tests.

## End-user acceptance

When affected AC requires the public UI/device journey, load Core harness-end-user-testing and
`.notth/core/workflows/end-user-acceptance.md`. Run actual controls in the existing browser/device
runner, assert visible and persisted outcomes, and capture redacted evidence. Use schema-1 reports
with verification_target=end-user and the expected surface; mocks/unknown dependencies do not verify
full acceptance. Missing browser/device/account/environment is BLOCKED. Reuse the existing framework;
Playwright is a web option, not a forced dependency or native-device proof.
