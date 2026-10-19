---
name: harness-product-product-research
description: Research comparable products, user needs and implementation feasibility with verifiable sources and explicit uncertainty.
---

# harness-product-product-research

## Input
- Idea/problem statement, research questions and geographic/market scope.
- Authorized search tools or documents and any time-sensitive constraints.

## Procedure
1. Define specific hypotheses or decisions the research should inform; choose appropriate sources and dates.
2. When web/search tools are available, examine credible primary references and independent comparisons; distinguish observed features from marketing claims and user opinions.
3. Record source URL, title, publisher, published/observed date, accessed date, relevant claim and access restrictions.
4. Compare alternatives by user value, cost, complexity, risks and evidence confidence; avoid invented numerical market estimates or claims of current pricing.
5. Mark FACT, INFERENCE, FORECAST and UNKNOWN separately. Flag conflicting or stale sources.
6. Summarize implications for MVP, with decisions proposed to the human owner. If retrieval is unavailable, document the research gap rather than presenting assumptions as findings.

## Output
- `docs/discovery/research.md` with research questions, evidence table, comparisons and product implications.
- Source references for `docs/product/source-register.md` and unresolved validation tasks.

## Constraints
- Do not scrape inaccessible services, bypass document permissions or claim browsing occurred when it did not.
- No fabricated references, metrics, reviews or user interviews.
- Research is advisory, not an approval or an instruction to change the codebase.

## Template
Read `.notth/capabilities/product/templates/research.md`; `aih new-doc research` creates only a missing
draft. Apply the shared document contract for authority, preservation and review.

## Example
Synthetic illustration: With no browsing access, competitor claims are UNKNOWN and research questions are proposed rather than citations invented.

## Quality checklist
- Retrieved facts, inferences and forecasts have provenance.

## Handoff
Read the shared installed contract `.notth/capabilities/product/common/document-contract.md`; pass only affected scope and relevant perspectives.
