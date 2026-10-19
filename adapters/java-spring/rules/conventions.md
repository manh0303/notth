# Java / Spring coding conventions

First apply `.notth/core/rules/project-conventions.md`. These are defaults for new code when the
project has no applicable convention, not a migration mandate.

## New-project defaults
- Start with a single deployable application and feature-oriented packages. Keep transport DTOs,
  application use cases/transactions and persistence responsibilities distinct inside each feature;
  create layers only when used. Do not introduce microservices, CQRS or a generic repository framework
  without a requirement. A service does not need an interface solely to have an `Impl` class.
- Use lowercase package names, PascalCase types, lowerCamelCase methods/fields and UPPER_SNAKE_CASE
  constants. Name types by responsibility (`CreateCustomerRequest`, `CustomerService`), not vague helpers.
- Use constructor injection and explicit dependencies. Keep controllers focused on HTTP mapping,
  boundary validation and delegation. Authorize resource access on the server; transaction boundaries
  belong to the application operation, not HTTP serialization.
- Keep request/response DTOs distinct from persistence entities. Choose manual mapping for simple cases;
  introduce a mapper library only for a demonstrated need and project agreement. Do not add Lombok or
  another dependency merely to enforce these defaults.
- Agree one API error contract and central exception mapping. Keep domain errors meaningful, preserve
  causes internally and avoid swallowed exceptions or HTTP 200 for all failures. Never expose secrets
  in responses or logs. Use parameterized logging with appropriate level/context; avoid logging the
  same exception at every layer and never dump request bodies by default.
- Use explicit null/absence semantics, validated inputs, bounded pagination, managed resources and
  existing rules for money/time/concurrency. Avoid unbounded collections or new generic utility bags.
- Agree and configure one formatter and relevant static checks using the actual build/JDK; do not
  assume a plugin exists. Keep test packages aligned with production responsibilities. Test observable
  behavior with the existing JUnit stack; use integration checks for DB, authorization and transactions.

## Maintenance reuse checklist
Find existing response/error types, exception advice, validators, mappers, pagination, security helpers,
repositories, transaction conventions, logging context and test fixtures. Use their supported APIs.
Follow the target module's package layout even if it is layer-oriented. Do not introduce a parallel
`ApiResponse`, `BusinessException`, base service or mapper system. Shared code must not depend on a
feature's internals. Record a reason when an existing abstraction is unsuitable or unsafe.

## Verification
Use the declared Maven/Gradle commands and existing formatter, Checkstyle/Spotless or equivalent only
when configured. Run existing ArchUnit/Modulith boundary checks if present; otherwise review affected
dependencies manually and state the limit. Neither this guide nor `aih verify` executes those checks.
