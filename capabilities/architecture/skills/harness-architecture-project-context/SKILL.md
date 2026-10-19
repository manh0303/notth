---
name: harness-architecture-project-context
description: Map verified system context, module ownership and source-linked architecture for new or existing projects.
---

# harness-architecture-project-context

## Input
Idea/approved BA sources, repository revision, scope/mode, deployments, existing ADRs, integrations and access constraints.

## Procedure
1. Read local facts, authoritative requirements and touched source; select small/new/maintain depth and preserve approved existing architecture.
2. Map actors, system boundary, external systems, deployment units and trust boundaries; mark inaccessible parts explicitly.
3. Inventory modules, public APIs, data owners, reusable common components and allowed dependency direction using actual paths.
4. Record revision/date and canonical doc/code links in a living project map; verify touched entries rather than scanning every file.
5. List gaps, assumptions, constraints and technical debt with owner; route value/scope to PO, quality gaps to NFR and release gaps to DevOps.
6. When source differs from docs, show the specific mismatch and refresh only the affected reviewed context.

## Output
docs/architecture/overview.md and linked project-map.md; compact notes suffice for a small fix.

## Template
Read `.notth/capabilities/architecture/templates/overview.md` from the installed snapshot.
Use `aih new-doc overview --capability architecture` only for a missing draft;
reuse existing authoritative docs or a compact task note when appropriate. Never overwrite approved content.

## Example
Maintain customer service: controller → customer use case → repository; organization authorization comes from a supported shared API. An unreachable billing integration is recorded as unknown, not inferred from its name.

## Quality checklist
- Each component/ownership assertion has a source path or explicitly marked hypothesis
- Actual public boundaries and source revision recorded
- No automatic migration or full-document regeneration

## Handoff
State source revisions, requirement/decision IDs, approval status, unresolved questions, output paths,
actual checks and next role. Use the module workflow; role names are not human authorization.

## Constraints
Follow Core permissions, clarification and project-conventions. Ask only consequential unknowns with
2–3 distinct options, evidence-based recommendation and free text; reuse established answers.
No invented source, measured result, target, estimate or approval. No external messaging/publishing,
paid tool use or production changes beyond the user's explicit authorization.
