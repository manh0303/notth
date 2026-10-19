---
name: harness-react-nextjs-feature-delivery
description: Implement React or Next.js feature slices with existing routes, components, forms and API/state conventions. Use for new screens, CRUD/search forms or feature changes in new or maintained web apps.
---

# Web feature delivery

## Input
Approved SA/ADR decisions for the affected scope, existing project conventions and actual stack versions. This skill implements accepted design; it does not select infrastructure, dependencies or architecture.
Task/acceptance IDs, approved screen or compact UX notes, API contract, actual framework/router/version,
and existing convention/component/client/state paths. Read only relevant source and skills.

## Procedure
Read `.notth/adapters/react-nextjs/rules/engineering.md` for state ownership, server/cache boundaries,
waterfalls, composition and measured optimization; use only version-compatible advice.
1. Apply `.notth/core/rules/project-conventions.md` and selected adapter rules. Inspect a comparable
   feature, public components, API client, form validation, query keys, auth and tests. Establish new,
   maintain or mixed scope per module; preserve established libraries and architecture.
2. Plan one usable route → interaction → data operation slice. Separate UI state, form state and server
   state; derive values instead of synchronizing duplicate stores. State the ownership of each boundary.
   Ask at most 1–3 consequential A/B/C questions with a recommendation when requirements remain unclear.
3. Reuse the agreed client/query/form APIs. Type boundary contracts and validate untrusted inputs;
   handle loading, empty, validation, denied, error, success and pending-submit states. Prevent stale
   responses from replacing newer results; define mutation success/cache refresh and safe retry behavior.
4. For Next.js inspect the actual router/version and use
   `.agents/skills/harness-react-nextjs-server-boundaries/SKILL.md` only when server behavior is touched.
   Keep credentials/server dependencies out of browser imports; server authorization is independent
   of client guards. Plain React must retain its actual router and backend contract.
5. Reuse design tokens and public UI through
   `.agents/skills/harness-react-nextjs-accessible-ui/SKILL.md` when interactions need it. Preserve keyboard,
   focus and responsive behavior; avoid extracting common abstractions before shared usage is established.
6. Use Core TDD/review plus `.agents/skills/harness-react-nextjs-behavior-testing/SKILL.md` for affected
   acceptance paths. Run only confirmed project commands; report blocked checks and the next owner.

## Output
Feature diff and compact AC → route/component → API/state → test mapping; reused public symbols,
new-code/dependency rationale, actual command results and unresolved decisions.

## Example
For “add customer search” in a plain React app with an existing client/query hook and FormField,
deliver the route using those APIs, stale-result and empty/error handling, and behavior tests.
An illustrative handoff names `apiClient`, the existing query-key family and changed feature files;
it does not add Next.js, another HTTP client or invented passing test output.

## Quality checklist
- Trace each changed interaction to AC and an appropriate behavior check.
- Keep one source of truth for remote data and record cache ownership.
- Review form validation, recoverable errors, focus and authorization boundaries.
- Explain every new shared abstraction/dependency and report actual verification limits.

## Constraints
Do not install libraries, migrate routers/state or scaffold an application merely because a skill is
selected. Follow task authorization. Do not infer Figma approval, force ports/adapters/factories on simple
features, or treat TypeScript/client guards as runtime validation/server authorization.

## Handoff
Give Implementer/Reviewer/Test Engineer the AC IDs, changed source paths, boundary decisions and actual
checks. Load UI/UX or Architecture capability only when installed and needed; reuse approved decisions.
