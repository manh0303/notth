---
name: harness-react-native-screen-delivery
description: Implement React Native or Expo screens with existing navigation, forms, API/state and platform conventions. Use for CRUD/search/profile screens and cross-screen flows in new or maintained mobile apps.
---

# Mobile screen delivery

## Input
Approved SA/ADR decisions for the affected scope, existing project conventions and actual stack versions. This skill implements accepted design; it does not select infrastructure, dependencies or architecture.
Task/AC and screen/flow notes, API contract, actual Expo/bare setup and router/version, supported
platforms, and existing navigation/theme/client/storage/test paths.

## Procedure
Read `.notth/adapters/react-native/rules/engineering.md` for navigation, list rendering, keyboard/
safe-area/permission and interrupted-request concerns; do not infer native success from JS tests.
1. Apply `.notth/core/rules/project-conventions.md` and selected adapter rules. Inspect a comparable
   screen and public navigation/UI/client/state APIs. Preserve Expo/bare, native architecture and
   existing router; ask only consequential unresolved platform or business choices with recommendations.
2. Plan one route → screen → data operation slice. Use the existing typed navigation contract and
   validate external parameters. Preserve auth transitions/back behavior; hiding a screen is not backend
   authorization. Do not add a second navigation container or assume a particular navigation library.
3. Reuse form/input and API/query boundaries. Distinguish transient, remote and persisted state; avoid
   copying remote data into another store. Handle loading, empty, validation, failed/pending/success writes,
   token expiry and stale responses after navigation or account switching.
4. Use theme tokens and appropriate platform behavior: safe areas, keyboard/input visibility, accessible
   labels/focus, back/cancel and long-list rendering. Handle focus/background/foreground requests with
   the existing lifecycle abstraction; prevent old-account responses from restoring cleared data.
5. Load `.agents/skills/harness-react-native-offline-sync/SKILL.md` only for persistence/replay/conflicts;
   use `.agents/skills/harness-react-native-device-permissions/SKILL.md` when permissions/deep links change.
   Keep credentials in the existing secure store and ordinary cache under the approved data policy.
6. Use Core TDD/review and `.agents/skills/harness-react-native-behavior-testing/SKILL.md`. Record
   JS/build/device evidence per affected platform and missing toolchain/device access.

## Output
Screen diff, AC → navigation/UI → API/state → tests mapping, reused public APIs and new-code rationale;
platform-specific evidence and unresolved business/native decisions.

## Example
For profile editing in a bare app, reuse its navigator, FormField, client/query and theme. Handle pending
save, server validation, expiry and back/cancel; do not convert to Expo or add an offline queue.
An illustrative handoff reports JS tests actually run and missing iOS device access separately.

## Quality checklist
- Preserve navigation/auth/account boundaries and guard stale asynchronous results.
- Verify keyboard/safe-area/accessibility and affected lifecycle states on supported platforms.
- Reuse existing storage/client/state APIs; explain new abstractions and data retention.
- Report iOS/Android/JS results separately with blocked checks and next owner.

## Constraints
Do not assume new native modules, permissions, offline behavior or signing are needed. A task does not
authorize a toolchain/router migration, OTA publication or store deployment. Do not claim native success
from JavaScript tests or bypass backend validation/authorization.

## Handoff
Pass AC IDs, source/public APIs, route/state decisions, actual platform evidence and remaining checks
to Reviewer/Test Engineer. Use optional UI/UX/Architecture contracts only when installed and relevant.
