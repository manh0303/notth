---
name: harness-architecture-solution-design
description: Compare architectures and local design patterns against MVP, NFRs and existing project boundaries.
---

# harness-architecture-solution-design

## Input
Reviewed scope, NFR scenarios, context/module map, approved ADRs, team/toolchain constraints and comparable code.

## Procedure
1. Identify the decision level: deployment/application style, module boundary or local algorithm/object creation; Factory is not an alternative to Ports and Adapters.
2. For genuinely open architecture decisions compare 2–3 viable options by complexity, testability, integration, operations, cost and reversibility.
3. Recommend the smallest fit and cite drivers. Layered feature modules, modular monolith and selective Ports and Adapters can combine; do not default to microservices.
4. For a feature, identify actual variation/coupling. Consider Strategy for interchangeable behavior, Factory for complex construction, Adapter for interface translation, State for meaningful state transitions; a direct function/class remains valid.
5. Record module responsibilities, public dependencies, data ownership, API/event boundaries and important success/failure sequences.
6. Define retries/timeouts/idempotency, transaction/consistency policy and observability where needed; record consequential choices in ADRs and agree them before affected code.
7. Hand vertical implementation slices and verification boundaries to Delivery/Core and stack-specific adapters.

## Engineering depth
For an architecture overview, use the compact coverage in templates/overview.md: goals/constraints,
context, responsibilities, runtime success/failure sequences, deployment, crosscutting policies,
quality drivers, decisions and risks. This is an original arc42-informed outline, not a claim of full
arc42 conformance. Select affected views; omit irrelevant sections with a reason instead of filling
unknowns with invented systems. Reconcile diagrams, code boundaries and actual deployment declarations.

## Output
docs/architecture/solution-design.md, linked ADRs and OpenSpec design/tasks, with explicit alternatives and accepted scope.

## Template
Read `.notth/capabilities/architecture/templates/solution-design.md` from the installed snapshot.
Use `aih new-doc solution-design --capability architecture` only for a missing draft;
reuse existing authoritative docs or a compact task note when appropriate. Never overwrite approved content.

## Example
A CRUD MVP may use feature packages and direct services. If two payment providers differ, introduce a small provider port/adapter only there. Strategy is justified for distinct pricing algorithms, not for a single unchanged calculation.

## Quality checklist
- Each pattern solves a concrete requirement and its extra complexity is justified
- MVP, NFRs, contracts and public dependency direction align
- Failure scenarios and rollout constraints included where relevant

## Handoff
State source revisions, requirement/decision IDs, approval status, unresolved questions, output paths,
actual checks and next role. Use the module workflow; role names are not human authorization.

## Constraints
Follow Core permissions, clarification and project-conventions. Ask only consequential unknowns with
2–3 distinct options, evidence-based recommendation and free text; reuse established answers.
No invented source, measured result, target, estimate or approval. No external messaging/publishing,
paid tool use or production changes beyond the user's explicit authorization.
