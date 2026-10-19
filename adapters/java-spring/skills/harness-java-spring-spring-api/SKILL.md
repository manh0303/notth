---
name: harness-java-spring-spring-api
description: Implement a Spring API with resource-scoped authorization and stable contracts.
---

# spring-api

## Input
Approved SA/ADR decisions for the affected scope, existing project conventions and actual stack versions. This skill implements accepted design; it does not select infrastructure, dependencies or architecture.
Approved endpoint contract, actual Spring version, existing controller/service patterns and access policy.

## Procedure
Read `.notth/adapters/java-spring/rules/engineering.md` for relevant API, transaction/concurrency,
query/migration and integration risks before selecting tests. Keep vendor-specific evidence explicit.
1. Map request, validation, success and error contracts to the spec.
2. Implement authorization for both action and resource ownership; keep transaction boundaries in the application layer.
3. Cover valid, invalid, unauthenticated, forbidden and cross-tenant requests using the existing JUnit stack.
4. Run the reviewed wrapper checks and report exact evidence plus blocked checks.

Use core TDD, debugging and review procedures for the common development lifecycle.

## Output
Endpoint changes, contract tests and requirement-to-test evidence.

## Constraints
Do not introduce framework upgrades, weaken authorization or invent domain validation rules.
