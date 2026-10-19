---
name: harness-spec
description: Turn requirements into scoped OpenSpec change artifacts.
---

# spec

## Input
User request, authoritative source links, existing specs and repository boundaries.
## Procedure
1. Read source context and identify missing or conflicting business decisions. Follow the installed
   clarification workflow: ask 1–3 consequential questions with A/B/C trade-offs, a grounded
   recommendation and free text. Reuse established answers and authorization.
2. Use aih new-change <id> for Harness drafts. If an external OpenSpec propose flow created the change,
   run aih change-sidecars <id> to add missing metadata/decisions/verification/artifact-impact templates
   without overwriting existing files. Draft proposal, design, tasks and capability delta specs there.
3. Use ADDED/MODIFIED/REMOVED requirement sections and WHEN/THEN acceptance scenarios.
4. Include affected repositories, non-goals, security impact, migration and rollback.
5. Plan vertical tasks with public test boundaries and trace them to requirements.
6. Record reviewed decisions, answers and source references in decisions.json. Resolve consequential
   uncertainties before the affected implementation; run aih ready <id> --stage implement.
7. Validate with the project's pinned OpenSpec CLI; structural readiness does not replace it.
## Output
Reviewable change artifacts and an explicit list of remaining decisions.
## Constraints
Do not mark tasks complete before evidence. Do not archive until associated changes are merged.
Draft creation does not grant permission to modify another repo or access a service.

## Continuous changes
Apply `.harness/core/workflows/continuous-development.md` first: compare actual baseline to handoff,
reuse the active change and stable IDs, and record affected-section impact plus unchanged reasons.
Do not silently resolve spec–code drift; record authoritative owner/source decisions. For a small
compatible fix, an existing issue/PR note can replace a full OpenSpec pack with a scope rationale.

## Preserved input documents
When files, URLs, MCP/API inputs or prior source snapshots are relevant, follow
`.harness/core/workflows/source-intake.md` before deriving requirements. Reuse the source index,
preserve originals and register conversions; pending extraction and approval are separate states.
