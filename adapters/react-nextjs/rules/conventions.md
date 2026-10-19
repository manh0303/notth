# React / Next.js coding conventions

First apply `.notth/core/rules/project-conventions.md`. Defaults fill gaps; retain the target module's
router, language, layout, state management, styling and package manager in maintenance work.

## New-project defaults
- Propose TypeScript with strict checking for a new typed app, after checking stack requirements.
  Keep framework-required route files in their required locations; organize feature code beside its
  use or under feature folders. Put only genuinely shared UI in shared components. No empty layers.
- Use PascalCase component/type names, lowerCamelCase functions/variables and `useX` for hooks.
  Keep file naming consistent with the chosen project style; framework route naming takes precedence.
- Keep components focused on rendering and interaction. Put reusable behavior in focused hooks or
  functions only when needed; do not wrap every operation. Prefer local state and derived values;
  introduce global state only for actual cross-feature needs. Do not duplicate server state in a
  second store without a consistency strategy.
- Use one agreed API client/data-access path, typed boundary contracts and runtime validation at
  untrusted boundaries. Type assertions do not validate external input. Reuse the selected data-fetching,
  form and validation approach rather than adding competing libraries.
- Reuse design tokens and semantic components. Handle loading, empty, error, success and disabled
  states; support keyboard/focus and labels. Avoid arbitrary inline styles when a token/component fits.
- Keep secrets and privileged operations server-side. For Next.js inspect the actual router/version
  before server/client decisions. Keep client boundaries narrow and preserve cache/user isolation.
- Centralize appropriate error translation; show useful recoverable feedback and redact sensitive
  logging. Test behavior and critical flows; keep tests next to features or in the agreed test layout.
- Agree formatter, lint and type-check commands from the actual setup. Do not invent script names,
  blanket-disable rules, or introduce `any`/suppression comments without a narrow documented reason.

## Maintenance reuse checklist
Find the design system, API client, auth flow, form fields, validation schemas, hooks, query keys,
state stores, error UI and test utilities before creating new ones. Keep feature-specific components
local until shared ownership is justified. Do not create a second HTTP client, theme, modal system,
state library or folder convention. Shared UI must not import feature internals.

## Verification
Run configured format/lint/type checks, relevant component/browser tests and production build. Check
SSR/hydration when affected. Respect existing import-boundary rules; report manual boundary review
where no check exists. Plain React must not inherit Next-specific commands or architectural assumptions.
