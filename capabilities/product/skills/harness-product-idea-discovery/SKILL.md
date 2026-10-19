---
name: harness-product-idea-discovery
description: Collaboratively refine a developer's rough software idea into an evidence-tagged, reviewable product brief before drafting requirements.
---

# harness-product-idea-discovery

## Input
- Developer's original idea, intended users and constraints (even if incomplete).
- Prior recorded decisions, optional market/technical findings and project status.

## Procedure
1. Preserve the original idea verbatim or as an explicitly labeled summary in `docs/discovery/idea.md`; do not replace it with an AI interpretation.
2. Identify the user problem, actors, current alternatives, success criteria, risks and boundaries. Separate user statements (FACT about intent), external FACT with citations, AI INFERENCE, DECISION and UNKNOWN.
3. Discuss high-impact uncertainty conversationally; ask only the questions whose answers affect the next decision. Suggest options and trade-offs, not an exhaustive questionnaire.
4. Research competitor patterns or technical feasibility only when an authorized search/retrieval tool exists; record URL, publication/access date, credibility and limitations. Without access, mark research pending.
5. Propose MVP and non-goals; log accepted/rejected ideas, rationale, decision owner and date. Never treat a suggestion or silence as approval.
6. Ask the developer to approve the product direction before generating authoritative BRD/PRD; allow incremental drafts while decisions remain open.

## Output
- `docs/discovery/idea.md` (original idea, clarified problem, options, decisions and open questions).
- A handoff to Product for BRD/PRD or PRD-lite creation; optional links to `docs/discovery/research.md`.

## Constraints
- A solo developer may be the approval owner; never invent other stakeholders.
- No fabricated user interviews, market sizes, competitor prices, dates, sources, or approvals.
- An idea can remain a draft indefinitely; do not force implementation.

## Template
Read `.notth/capabilities/product/templates/idea.md`; `aih new-doc idea` creates only a missing
draft. Apply the shared document contract for authority, preservation and review.

## Example
Synthetic illustration: Original idea is preserved; clarify prototype versus usable MVP and choose the smallest end-to-end journey with the user.

## Quality checklist
- Original words, assumptions, actual answers and non-goals stay visible.

## Handoff
Read the shared installed contract `.notth/capabilities/product/common/document-contract.md`; pass only affected scope and relevant perspectives.
