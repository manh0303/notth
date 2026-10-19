---
name: harness-uiux-design-review
description: Review actual design or code previews against canonical decisions, usability and visual quality, then fix and recheck with evidence.
---

# harness-uiux-design-review

## Input
- Approved requirements, canonical design path/revision, screen specifications, tokens and actual
  code preview or authorized Figma/Penpot/Stitch evidence.

## Procedure
1. Compare each screen and state with the approved requirement inventory.
2. Check information hierarchy, navigation, text contrast, tap targets and keyboard behavior.
3. Review consistency, component reuse, responsive variants and edge cases.
4. Classify findings with severity, supporting evidence and recommended resolution.
5. Request human acceptance before marking design ready for implementation.
6. Inspect actual rendered output at relevant narrow and wide viewports, recording viewport sizes,
   revision, screen references and observations. Check real content, hierarchy, spacing rhythm,
   density, brand fit, unnecessary cards/decoration, clipping, long labels and missing states.
   Do not equate a polished screenshot with working controls: exercise navigation, forms, focus,
   keyboard, zoom and reduced motion where relevant using actual available host tools.
7. Fix in-scope findings, render again and compare affected screens with canonical decisions and
   previous evidence. Record remaining issues and recheck results; do not run an endless polish loop.
   If fixes need a new product/brand decision, checkpoint and ask. Unavailable render/device checks
   are NOT_RUN/BLOCKED; source inspection, build success and generated tokens cannot replace them.

## Output
- Review findings with links to source requirements, canonical design revision and actual artifacts.
- Approval or rework recommendation with explicit evidence.

## Constraints
- Do not invent test results, accessibility measurements or reviewer approvals.
- Do not infer UX quality solely from screenshot aesthetics.

For tool-neutral scope/output selection, read `.notth/capabilities/uiux/workflows/design-delivery.md`. Verify actual output type and required/omitted sections; never equate a preview with an editable design.
