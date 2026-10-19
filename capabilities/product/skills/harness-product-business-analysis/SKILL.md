---
name: harness-product-business-analysis
description: Elicit actors, existing versus future processes, business rules, requirements and non-functional constraints.
---

# harness-product-business-analysis

## Input
- Evidence-backed source register and business context.
- Stakeholder decisions, goals and scope boundaries.

## Procedure
1. Identify actors, triggers, business events, permissions and upstream/downstream systems.
2. Describe AS-IS and TO-BE processes, entry/exit conditions, exceptions and alternatives; use text or Mermaid flow charts where helpful.
3. When relevant, maintain glossary/data dictionary, domain entities/relationships, business state transitions and decision tables. Keep business invariants distinct from SA implementation choices.
4. Assign stable IDs `BR-###`, `FR-###`, `NFR-###`, linked to their sources. Record proposed identifiers without reusing withdrawn IDs.
5. For each requirement specify objective, actor, rule, preconditions, outcomes, measurable validation and impact. Distinguish system constraints from user preferences.
6. Flag conflicts, compliance assumptions, data sensitivity, cross-service impact and unanswered stakeholder questions.
7. Request stakeholder review before treating inferred flows or rules as authoritative.

## Output
- `business-rules.md`, AS-IS/TO-BE flows and requirement inventory.
- Decision requests and stakeholder review checklist.

## Constraints
- No unapproved product scope expansion; no fabricated regulation or SLA.
- Do not reveal internal source material or imply stakeholder acceptance without a decision record.

## Template
Read `.notth/capabilities/product/templates/business-rules.md`; `aih new-doc business-rules` creates only a missing
draft. Apply the shared document contract for authority, preservation and review.

## Example
Synthetic illustration: BR-001 requires organization-scoped search; AS-IS behavior and proposed TO-BE duplicate handling remain distinct.

## Quality checklist
- Business rules and AS-IS/TO-BE preserve source authority.

## Handoff
Read the shared installed contract `.notth/capabilities/product/common/document-contract.md`; pass only affected scope and relevant perspectives.

## Continuous changes
Use Core `continuous-development.md`. Compare approved vs proposed rule/use-case/AC deltas at actual
source revisions; retain IDs and withdrawn history. Trace changed rules into API/data/event contracts
and regression expectations. Record docs–code disagreement and its decision owner before propagation.
