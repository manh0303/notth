# Idea-driven entry point — idea → discussion → research → approved requirements

Use this when the developer starts with an idea, including a solo project. Product is optional for coding-only projects; when selected, this workflow guides AI in an authorized host, not the CLI itself.

Before authoring, apply `.notth/core/workflows/artifact-contract.md`: reuse storage/canonical
ownership decisions or ask only what is missing, then record input/output routes and write policy.
Respect configured destinations; docs below are the legacy Git defaults, not permission to copy
an external source into a second master. Maintain impacted artifacts through the OpenSpec change.

1. **Capture:** preserve original words in `docs/discovery/idea.md`; record owner and status, assumptions, constraints, non-goals and open questions. Use `harness-product-idea-discovery`.
2. **Discuss:** challenge the problem framing, user personas, alternatives and MVP. Ask a small set of high-impact questions iteratively, record each human decision in `docs/product/decision-log.md`; never treat an unanswered suggestion as approved.
3. **Research:** use `harness-product-product-research` only when external search/document access is authorized. Log citations, retrieval times and FACT/INFERENCE/FORECAST/UNKNOWN in `docs/discovery/research.md` and `docs/product/source-register.md`.
4. **Document at appropriate depth:** for a small product, start from `aih new-doc prd-lite`; for complex or enterprise work, use BRD → PRD → SRS, user stories, use cases and AC as appropriate. `aih new-doc` creates *blank templates only*. Reuse stable FR/NFR/US/AC IDs.
5. **Review gates:** human developer/product owner approves direction and required scope. Record owner/date/version externally or in decision log. AI draft is never automatically approved.
6. **Handoff:** approved scope, requirements and IDs feed optional UI/UX and `aih new-change <id>` OpenSpec draft, then Core/technology adapters. No mandatory code work if the idea is still exploratory.
7. **Changes:** when the idea changes, perform impact analysis and propose minimal document diffs; never silently overwrite approved requirements.

Deliverables are **consumer-owned** `docs/discovery/`, `docs/product/` and `openspec/` files. For Confluence publishing, preserve URLs/page versions and use existing explicit write authorization or request missing scope approval; the Harness CLI does not connect or publish to Confluence.

For new/material journeys, continue with `product-to-solution.md` after resolving the relevant scope.
Use reviewed MVP/outcomes and optional Architecture/Delivery to assess solution/dependencies before
OpenSpec implementation. Existing approved sources remain canonical; small clear changes stay compact.

For implementation documentation and affected-section evidence updates, follow `techspec-maintenance.md` with `harness-product-techspec`.
