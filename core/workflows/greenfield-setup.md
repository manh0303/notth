# Build context for a new project

Enter from harness-start/project-setup when no relevant implementation exists. `setup --greenfield`
selects this guidance; it does not establish project facts or install an adapter. Read current ideas,
authorized docs, local.md and confirmed decisions before asking. A new module in an existing repo
also needs the relevant existing-module seed and scoped conventions.

1. Purpose: clarify only missing user outcomes, acceptance behavior and material constraints. Reuse
   an existing BRD/PRD or the current conversation. Do not force stack choices before understanding
   the requested product, or require every document template for a small tool.
2. Design: when implementation needs it, propose the smallest stack/architecture satisfying known
   constraints. Ask only consequential unresolved choices (data, integrations, deployment/network).
   A framework choice does not imply microservices, corporate tooling or infrastructure.
3. Conventions: adopt the relevant installed defaults unless an applicable approved project rule
   overrides them. Record source/reason/scope for confirmed exceptions. Proposed conventions are
   not user approval. Resolve API/error/data/test choices only when they affect the accepted scope.
4. Tooling: discover the actual host, build/test commands and available integrations as needed.
   Save shared commands/references separately from machine-only paths; never ask for credentials.
   Defer irrelevant CI/MCP/IDE details rather than blocking useful requirements or implementation.

Ask at most 1–3 questions per turn with options, trade-offs and an evidence-based recommendation.
Save each established answer incrementally in existing configs and .notth/decisions.json; reuse
confirmed answers while their scope/sources apply. Mark unknowns/proposals explicitly, preserve
superseded decisions, and reopen only material affected choices when new evidence warrants it.
Before seed --record, create/link actual inspected project sources (such as accepted requirements);
no codebase or source means no claim of a reconciled source cache. Resume from partial saved answers.
Start authorized work once relevant minimum context exists; additional planning follows task depth.
