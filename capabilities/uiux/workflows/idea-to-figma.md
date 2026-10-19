# Idea to Figma — lightweight workflow

First use [design delivery](design-delivery.md) to scope sections and choose the authorized output. Use the Figma steps below only for a selected Figma deliverable; otherwise follow that workflow and relevant tool-neutral skills.

1. Record problem, target users, platforms, desired MVP and assumptions as a product brief.
2. Run the requirements-analysis skill on the brief; mark generated requirements as suggestions.
3. Run user-flow and screen-planning skills; collect decisions from the product owner.
4. Obtain approval for screen inventory and critical flows.
5. Define/reuse design tokens and component variants.
6. With an authorized Figma connector, create editable screens; otherwise provide design specifications and clearly mark Figma generation as pending.
7. Run design review; request final approval. Never auto-merge application code or change approved screens without permission.

For documented products prefer [docs-to-figma](docs-to-figma.md).

## Project artifact routing
Before planning/publishing UI, read `.notth/artifacts.json`, `.notth/integrations.json` and
`.notth/core/workflows/artifact-contract.md`. Reuse known Figma file/node destinations or ask
where UI/UX should be stored; never assume Figma is required. A connection alias does not connect
an account. Input docs remain canonical at their declared source; record UI output IDs/revisions and
source links, update impacted designs with existing scope authorization, and include review evidence.
