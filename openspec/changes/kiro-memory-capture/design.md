# Design and impact

Base: main 5cef4a47c9d94f0a451338c6d4db77ab1f73e369. User evidence: Kiro did not save
ongoing work; exact installed client, hook activation and permissions remain unknown.

The managed Kiro bridge retains SessionStart and adds PromptSubmit plus PostToolUse with `@mcp`.
Agent prompts invoke the existing continuity/source-intake workflow. Quick tasks reuse a project
note; only a missing note needs a policy-permitted docs/tasks entry. Standard changes retain the
existing context/checkpoint contracts. The command runtime remains opt-in and unchanged.

A hook requests a write; it cannot prove agent compliance. Verify files after writes, avoid
self-triggered persistence loops by matching only MCP and ignoring bookkeeping, and skip unchanged
captures. A legitimate new retrieval/revision still follows source-intake's provenance contract.
Read-only/prohibited storage, partial/failed responses and missing tools remain explicit limitations.
Never fetch again solely for the hook, auto-install packages, publish remotely, invent revisions,
or treat a tool result as authorization. General questions create no task. Agent hooks can use quota.

Official references checked 2026-10-21: https://kiro.dev/docs/hooks/types/ and
https://kiro.dev/docs/hooks/actions/. Native Kiro execution is NOT_RUN; this change does not diagnose
a disabled hook, unsupported client or denied writes on the owner's machine.

| Area | Status | Evidence / reason |
| --- | --- | --- |
| core | done | session-continuity capture contract; core/evals/cases.json scenario |
| adapter | not-applicable | No stack-specific behavior or adapter assets change |
| capability-skill | not-applicable | Existing workflow and source-intake are reused; no new skill/module |
| cli-config | done | cli/kiro.js managed bridge; default install and previous-bridge update fixture |
| workflow | done | PromptSubmit intent, immediate source intake, verified handoff; canonical storage reused |
| documentation | done | Kiro setup and session runtime distinguish agent capture from command recovery |
| verification | done | verification.md: focused/full tests, validate and offline package smoke PASS; native Kiro NOT_RUN |
| release-migration | done | Unreleased changelog and versioning; schemas/version/optional runtime unchanged |

Link chain: cli/kiro.js -> installCurrent lock-managed Kiro payload -> native PromptSubmit and
MCP PostToolUse -> installed session-continuity/source-intake -> existing import/context/checkpoint
contracts -> install/update fixtures and unscored native protocol -> Kiro setup guide.
Package allowlists already include cli/*.js and core/workflows; harness.yaml schemas/modules unchanged.
Updated bridge remains managed: edited user bytes block update, dry-run is read-only, rollback restores
matching snapshot/lock/CLI while retaining project notes and sources. No auto-merge or publication.
