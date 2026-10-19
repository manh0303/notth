# UI/UX capability (v1)

Reusable, **non-executable** skill and workflow bundle for scoped requirements → visual direction → canonical design decisions → preview → review. Supports code previews and authorized Figma, Penpot or Stitch output.

- Install selectively with `aih init --capabilities uiux`; combine with any technology adapter.
- Discover names and one-line descriptions with `aih skills`, then read one skill using `aih skill harness-uiux-figma-design`.
- Start from `workflows/design-delivery.md`; existing Figma workflows remain compatible.
- Project-owned source configuration, approved requirements and Figma IDs stay in the consumer, not the framework repository.
- Confluence and Figma connectivity must be configured separately in the AI host. The CLI does **not** implement a connector, invoke AI or create Figma frames by itself.
- Human approval is required before Figma writes and before marking designs ready to build. No implicit overwrites or merges.

Content is disclosed progressively: `aih skills` returns just metadata; the agent loads only the relevant `SKILL.md`. Installed files are snapshots pinned in `.notth/lock.json`.

When Product capability is installed, UI/UX consumes approved BRD/PRD, stories/AC
and preserves their IDs rather than regenerating competing requirements.
Without Product, UI/UX retains its own provisional evidence-extraction process.


## Full SDLC handoff

See [Full SDLC](../../docs/end-to-end-workflow.md), [Skill matrix](../../docs/skill-matrix.md) and [Full-stack web walkthrough](../../docs/examples/fullstack-web.md). UI/UX hands off reviewed screen specs/design tokens and optional Figma node IDs. Figma writes still need explicit approval and a configured host connector.

For tool-neutral scope/output selection, read `.notth/capabilities/uiux/workflows/design-delivery.md`. Verify actual output type and required/omitted sections; never equate a preview with an editable design.

## Design quality

Describe the outcome naturally: “Keep our existing design system; add the user list and show a preview.”
The host follows direction → design-system → implementation → design-review, loading only needed bodies.
External knowledge/service routing uses harness-uiux-external-design. NOTTH ships its own local guidance,
not the third-party libraries. [Reviewed sources](integrations/design-skills.md) pin optional UI UX Pro Max
and Google Stitch Skills with prerequisites and limitations. No network/Python is needed for NOTTH's
instruction fallback; rendering still needs actual host tooling. See [short guide](../../docs/ui-design.md).
