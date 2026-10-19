---
name: harness-product-prd-generation
description: Produce a Product Requirements Document with user value, measurable outcomes and release scope.
---

# harness-product-prd-generation

## Input
- Approved or provisionally reviewed business requirements, product idea and constraints.
- Target personas, platform and any market/product research evidence.

## Procedure
1. Establish problem, user segments, desired outcomes and clear non-goals.
2. Define MVP boundary, prioritized features and user journeys, linking `PRD-###` to `BR-###` / `FR-###` and original sources.
3. Specify success metrics with baseline/target if known, instrumentation assumptions and operational/security quality expectations.
4. Record tradeoffs, external dependencies, risks and release assumptions separately from requirements.
5. Confirm acceptance criteria and rollout constraints are measurable or identify owners for missing information.
6. Request Product Manager/Product Owner sign-off at the PRD gate.

## Output
- `docs/product/prd.md` with release scope, outcomes, measures and linked requirement IDs.
- Pending decisions, responsible owner and review notes.

## Constraints
- Estimates, success targets and roadmap dates are proposals until stakeholders approve them.
- Do not silently change BRD scope or promise unverified capabilities.

## Template
Read `.notth/capabilities/product/templates/prd.md`; `aih new-doc prd` creates only a missing
draft. Apply the shared document contract for authority, preservation and review.

## Example
Synthetic illustration: PRD includes authorized create/search and defers import; it links MVP/AC and leaves numeric adoption targets pending.

## Quality checklist
- MVP journey, exclusions and minimum quality are explicit.

## Handoff
Read the shared installed contract `.notth/capabilities/product/common/document-contract.md`; pass only affected scope and relevant perspectives.
