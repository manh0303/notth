---
name: harness-product-srs-generation
description: Produce a testable Software Requirements Specification linked to approved product requirements and source evidence.
---

# harness-product-srs-generation

## Input
- Approved or explicitly provisional PRD, BRD, user stories, business rules, acceptance criteria and constraints.
- Source register and decision log; existing architecture/API contracts if available.

## Procedure
1. Confirm scope and approval status; do not silently upgrade draft PRD requirements to approved.
2. Enumerate actors, system context, assumptions, out-of-scope boundaries and external interfaces.
3. Link each requirement to stable `FR-###`, `NFR-###`, `US-###` and/or `AC-US-###-##` identifiers; document source anchors and approval.
4. Specify functional behavior with preconditions, normal/alternate/error flows, data validations, permissions, failure behavior and observable acceptance criteria.
5. Describe measurable NFRs (security, privacy, accessibility, performance, reliability, observability); leave proposed values pending if unsupported.
6. Record dependencies, ambiguous decisions and conflict analysis. Produce an independent review checklist and traceability handoff.
7. After human approval, link SRS requirement IDs to OpenSpec change IDs and tests; OpenSpec describes implementable deltas, not a second contradictory master SRS.

## Output
- `docs/product/srs.md` and corresponding updates proposed for `docs/product/traceability.md`.
- Gap/decision list and approved requirement handoff to Core `harness-spec`.

## Constraints
- Do not invent protocol guarantees, SLAs, security requirements or existing integrations.
- Keep product intent separate from chosen technical implementation.
- Never change code or claim stakeholder approval solely because a document was generated.

## Template
Read `.notth/capabilities/product/templates/srs.md`; `aih new-doc srs` creates only a missing
draft. Apply the shared document contract for authority, preservation and review.

## Example
Synthetic illustration: FR-001 defines search behavior; NFR-001 target is pending until agreed and is passed to Architecture for a scenario/test plan.

## Quality checklist
- FR/NFR contracts, exception paths and trace IDs remain consistent.

## Handoff
Read the shared installed contract `.notth/capabilities/product/common/document-contract.md`; pass only affected scope and relevant perspectives.
