# React Native coding conventions

First apply `.notth/core/rules/project-conventions.md`. These defaults do not authorize an Expo/bare,
navigation, native architecture, state-library or toolchain migration.

## New-project defaults
- Resolve Expo versus bare, supported platforms and native-module needs from requirements before
  scaffolding. Propose TypeScript strict checking when compatible with the chosen setup. Organize
  by feature with screens, focused state/hooks and device adapters as needed; no speculative layers.
- Use PascalCase components/screens/types, lowerCamelCase functions/variables and `useX` hooks.
  Follow router-required file names and one agreed convention elsewhere. Keep navigation parameters
  typed and validate external deep links at runtime.
- Keep screens focused on UI and navigation. Access network, storage and device APIs through the
  agreed integration boundary; avoid direct native calls scattered across unrelated screens.
- Reuse theme tokens and platform-aware UI. Handle safe areas, keyboard, accessibility, loading,
  errors, offline state and app background/foreground transitions. Bound and virtualize large lists.
- Start with local state; add shared state only for concrete cross-screen needs. Distinguish remote
  state, persisted state and transient UI state. Specify retries/conflicts before adding offline queues.
- Separate secure credentials from ordinary preferences/cache. Use the platform secure store for
  credentials, request minimal permissions and model denial/revocation. Never log tokens or sensitive
  payloads. Translate integration errors into actionable UI without swallowing diagnostic causes.
- Agree formatter/lint/type checks and test layout. Use behavior-oriented component/navigation tests;
  include platform evidence when navigation, permissions, native integration or lifecycle changes.

## Maintenance reuse checklist
Find existing navigation routes, API client, secure storage, theme, permission services, lifecycle
hooks, offline queue, state store and test helpers. Reuse supported interfaces; preserve platform
differences. Do not add another navigation container, storage wrapper, state library or permission
manager without a real gap and rationale. Common UI must not depend on feature internals.

## Verification
Use existing JS and native build commands for the affected platforms. Record missing simulator/device
or iOS/Android build access explicitly. A JS test pass is not evidence of native compatibility, and
these conventions do not authorize signing, OTA publishing or store deployment.
