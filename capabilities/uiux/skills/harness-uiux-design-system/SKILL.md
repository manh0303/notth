---
name: harness-uiux-design-system
description: Define semantic design tokens and reusable components before generating visual layouts.
---

# harness-uiux-design-system

## Input
- Approved screen inventory and existing brand or component library.
- Platform accessibility requirements and supported themes.

## Procedure
0. Use `harness-uiux-design-direction` when the visual direction is open. Locate the canonical
   DESIGN.md or existing brand/token master first; inspect its revision and actual components.
   Do not create a parallel master. For a new system only, use the outline in
   `.notth/capabilities/uiux/templates/design-system.md` as project-owned data; the installer
   never creates or overwrites the project's DESIGN.md. Small fixes need only an affected-section note.
1. Inspect existing components and tokens before creating new ones.
2. Define foundations: type scale, semantic colors, spacing, radius, elevation and motion.
3. Define component variants and accessible interactive states.
4. Resolve responsive breakpoints and platform-specific behavior.
5. Document token-to-component mappings and request approval for brand changes.
6. Update the canonical document selectively with accepted decisions, sources, exclusions, responsive
   and interaction states. Label assumptions/proposals. Pass its path/revision to implementation and
   design review; resolve code/design drift rather than declaring generated documentation authoritative.

## Output
- Theme/token decisions, component inventory and reuse guidance.

## Constraints
- Prefer existing tokens and components; do not hardcode styles unnecessarily.
- Distinguish design recommendations from approved brand standards.
