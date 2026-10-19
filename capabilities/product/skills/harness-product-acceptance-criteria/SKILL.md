---
name: harness-product-acceptance-criteria
description: Write verifiable acceptance criteria in Given/When/Then for each story, including negative cases.
---

# harness-product-acceptance-criteria

## Input
- User stories and business rules with source IDs.
- Permissions, validation rules, API/domain constraints and known quality expectations.

## Procedure
1. Create unique `AC-<story-id>-NN` criteria or the team's approved scheme.
2. Cover happy path, validation errors, permission denied, empty/loading/retry/offline when relevant, data integrity and concurrency as needed.
3. Express acceptance scenarios with Given/When/Then; make outcomes observable and independently testable.
4. Trace each criterion to story/requirement and identify test level where useful (UX/API/integration).
5. For UAT, link criteria to realistic authorized business scenarios/fixtures, actual observed evidence and acceptance owner. Technical test PASS does not invent business acceptance. Triage feedback as defect or new scope.
6. Flag untestable ambiguity and request decision rather than inventing thresholds.

## Output
- `docs/product/acceptance-criteria.md` with criteria, linkage and unanswered cases.
- Candidate test-scenario checklist for QA and OpenSpec.

## Constraints
- Never claim that acceptance tests have run; these are specifications, not execution evidence.
- Avoid arbitrary time, availability and performance thresholds.

## Template
Read `.notth/capabilities/product/templates/acceptance-criteria.md`; `aih new-doc acceptance-criteria` creates only a missing
draft. Apply the shared document contract for authority, preservation and review.

## Example
Synthetic illustration: Given an employee outside the organization, when searching its customer, then access is denied without leaking existence.

## Quality checklist
- Happy, negative and boundary cases are observable.

## Handoff
Read the shared installed contract `.notth/capabilities/product/common/document-contract.md`; pass only affected scope and relevant perspectives.
