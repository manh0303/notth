---
name: harness-product-traceability
description: Maintain bidirectional links from document sources through BRD/PRD/stories to UI/UX and OpenSpec.
---

# harness-product-traceability

## Input
- Source register, approved requirements, stories, acceptance criteria, design and engineering IDs if present.

## Procedure
1. Construct a traceability matrix keyed by stable requirement IDs, with references to sources and derived artifacts.
2. Verify referential integrity: no duplicate IDs, orphan stories, orphan AC, or nonexistent source anchors.
3. Mark not-yet-created artifacts as `pending`; never manufacture Figma node IDs or repository commits.
4. Compute coverage (e.g. requirements with story, AC and review status) and explicitly state excluded or deferred items.
5. On source change, compare source version/content, create an impact report for BRD/PRD/stories/UX/OpenSpec and resolve only missing consequential owner decisions before propagation; reuse existing scoped authorization.

## Output
- `docs/product/traceability.md` and `change-impact.md` when requested.
- Missing-link report and impacted artifacts by requirement.

## Constraints
- Links are evidence pointers, not authorization to modify external systems.
- Never rewrite approved artifacts automatically based on Confluence updates.

## Template
Read `.notth/capabilities/product/templates/traceability.md`; `aih new-doc traceability` creates only a missing
draft. Apply the shared document contract for authority, preservation and review.

## Example
Synthetic illustration: SRC-001 → FR-001 → US-001 → AC-US-001-01 → ADR-001/OpenSpec task/test links form a checkable chain.

## Quality checklist
- Stable IDs, source versions and downstream gaps are maintained.

## Handoff
Read the shared installed contract `.notth/capabilities/product/common/document-contract.md`; pass only affected scope and relevant perspectives.

## Continuous changes
Extend the same matrix through scoped code/contracts and tests/raw evidence with their revisions.
On resume, revalidate touched links and invalidate stale coverage; missing artifacts remain pending.
Preserve stable IDs and unrelated rows. Use Core `continuous-development.md` for source authority,
section-level proposals and unchanged reasons rather than generating another trace registry.
