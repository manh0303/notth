---
name: harness-product-brd-generation
description: Produce a Business Requirements Document with actors, business rules, scope and traceability.
---

# harness-product-brd-generation

## Input
- Source register and business-analysis outputs with approved/unknown status.
- Existing BRD template and organizational conventions.

## Procedure
1. Populate the BRD template: problem, business objectives and measurable success, stakeholders and scope/exclusions.
2. Document AS-IS/TO-BE, actors, terminology, business rules, functional and non-functional requirements.
3. Link every substantive requirement to one or more source anchors; denote unsupported hypotheses as proposed.
4. Capture decisions, assumptions, dependencies, risks, conflicts and unresolved questions.
5. Run document-review for completeness/consistency and leave approval as pending until actual authorized review.

## Output
- Versioned `docs/product/brd.md` and linked `business-rules.md`.
- Coverage list mapping source IDs → business requirement IDs.

## Constraints
- Never self-approve a BRD or invent evidence.
- Avoid treating template placeholders as finished decisions.

## Template
Read `.notth/capabilities/product/templates/brd.md`; `aih new-doc brd` creates only a missing
draft. Apply the shared document contract for authority, preservation and review.

## Example
Synthetic illustration: BRD links the customer-search goal to BR-001; cost/benefit values remain unknown without financial evidence.

## Quality checklist
- Business outcomes and stakeholder decisions are traceable.

## Handoff
Read the shared installed contract `.notth/capabilities/product/common/document-contract.md`; pass only affected scope and relevant perspectives.
