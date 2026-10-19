---
name: harness-react-native-behavior-testing
description: Verify React Native and Expo screens using existing JavaScript, navigation and device tests. Use for forms, auth/account transitions, lifecycle, permissions/offline regressions or changes requiring separate iOS and Android evidence.
---

# Mobile behavior testing

## Input
Approved SA/ADR decisions for the affected scope, existing project conventions and actual stack versions. This skill implements accepted design; it does not select infrastructure, dependencies or architecture.
Changed screen/AC, actual test scripts/runner and navigation setup, affected platforms, native/device
access, and existing API/storage/permission fixtures.

## Procedure
1. Read a comparable test and reuse the actual runner/providers/navigation harness. Map risks to pure
   logic, component/navigation integration, native build and simulator/device checks.
2. Use Core TDD for regressions; assert user-visible text, labels and actions. Cover relevant form errors,
   pending/success/failure, expiry and stale requests. Control external API/storage/native dependencies;
   state exactly which behavior is simulated rather than actually run on a device.
3. Keep screen modules and navigation connected where practical. Exercise back/cancel, auth transitions,
   logout/account changes and absence of previous-account data. For offline/permission changes test
   reconnect/retry/conflict or denial/revocation using the selected specialized skill and approved contract.
4. Check affected iOS/Android builds and critical simulator/device flows when access exists: keyboard,
   safe area, accessibility, background/resume and cold/warm links as applicable. Reuse an existing E2E
   runner rather than installing one by default. A JS mock cannot establish native-module correctness.
5. Run confirmed targeted tests and configured lint/type checks. Record platform/runtime, command,
   result and mocked boundaries; label missing native builds/devices blocked with follow-up owner.

## Output
AC → JS/navigation/native/device evidence matrix, meaningful regression tests, actual results,
mock scope and explicit blocked checks. Keep UI smoke, build and real device evidence distinct.

## Example
For logout during an in-flight profile request, complete the old request after logout and assert that
the next account never sees previous-account data. If only JS tests can run, report those results;
Android/iOS build and device checks remain blocked, not implicitly passed.

## Quality checklist
- Test observable screen/navigation outcomes, not only snapshots or internal props/state.
- Isolate credentials/cache/time/network fixtures and cover relevant failure/lifecycle paths.
- Distinguish mocks, simulator/device behavior and per-platform build results.
- Give every blocked native check a concrete follow-up; do not invent scripts or passing output.

## Constraints
Do not call production APIs, change signing, publish OTA/store artifacts or infer native compatibility
from Node.js component tests. Keep existing tooling and Core permission/review gates.

## Handoff
Pass AC/test/source paths, actual failures/results, device/toolchain needs and affected platforms to
Implementer/Reviewer. The Harness emits instructions/checklists; the authorized host runs actual tests.

## End-user acceptance

When affected AC requires the public UI/device journey, load Core harness-end-user-testing and
`.notth/core/workflows/end-user-acceptance.md`. Run actual controls in the existing browser/device
runner, assert visible and persisted outcomes, and capture redacted evidence. Use schema-1 reports
with verification_target=end-user and the expected surface; mocks/unknown dependencies do not verify
full acceptance. Missing browser/device/account/environment is BLOCKED. Reuse the existing framework;
Playwright is a web option, not a forced dependency or native-device proof.
