# Spec → Code → Test → Review

Apply [engineering quality](engineering-quality.md) for deeper planning, debugging, safe refactoring,
risk-based verification and selective technical documentation. It extends this lifecycle, not another one.

| Stage | Input | Output and gate |
| --- | --- | --- |
| `discover` | Request, repository, linked sources | Scope/mode, affected repos and risks, convention sources, comparable code and reuse candidates; clarify consequential unknowns |
| `specify` | Agreed behavior | proposal, design, delta specs and vertical tasks |
| `review-spec` | Acceptance scenarios and design | Owner agreement for consequential choices; explicit task authorization may already cover routine choices |
| `implement` | One task with a public test boundary and reuse plan | Failing meaningful test, minimal implementation, green test; established boundaries and rationale for new components |
| `verify` | Changed behavior | Relevant automated checks and honest skipped-check list |
| `review` | Diff plus spec and convention sources | Findings on correctness, security, compatibility, reuse, placement and unnecessary abstraction |
| `deliver` | Reviewed branch | PR with change ID, evidence, residual risks and rollback plan |
| `archive` | All associated PRs merged | Sync accepted specs and archive via OpenSpec in a separate reviewed change if needed |

Apply `artifact-contract.md` for declared inputs/outputs, canonical ownership and connections.
Maintain affected docs/spec/UI in the same change; record artifact-impact.json when outputs are
configured, including unchanged reasons and actual evidence. No source write beyond declared policy
and existing host/user authorization.

For new projects or consequential features, follow `solution-framing.md`: source-linked overview,
MVP/NFR, justified architecture/pattern choices and delivery dependencies feed OpenSpec design/tasks.
For first use, read `project-setup.md` in this workflow directory. Before implementing consequential
unknowns, follow `clarification.md`: inspect existing answers, ask 1–3 A/B/C questions with grounded
recommendations, and record answers/source in the change's decisions.json. Do not ask again once
scope and authorization are already clear. Run `aih ready <id> --stage implement` after drafting;
record actual checks in verification.json and use `--stage review` before handoff. These commands
check structure, not business approval or the truth of test evidence.

Apply `.notth/core/rules/project-conventions.md` even when a full spec is unnecessary. Before adding
code, record inspected paths, reused public APIs, intended placement and reasons for new components
in the task note or existing change. Preserve each module's conventions in mixed repositories. Review
the diff against those facts and run configured lint/type/build/tests and available boundary checks;
report manual review where automated architecture coverage is absent.

Use harness-spec to draft, harness-tdd to implement and harness-review for the review stage. Use harness-debugging when diagnosing
an observed defect. Agents are roles, not automatically spawned workers; a single assistant can perform
them sequentially. Respect the host's delegation rules.
Small documentation edits or obvious low-risk fixes may skip a full spec with a rationale in the PR.
Security-sensitive or externally visible behavior changes need explicit acceptance scenarios.
Never archive an unmerged proposal as implemented. CI remains authoritative for actual check results.

For proportional checks and evidence integrity, use `.notth/core/workflows/adaptive-verification.md` and `harness-verification`.

For successive changes and resumed sessions, enter through `continuous-development.md` for baseline
reconciliation, selective artifact maintenance, feedback triage and evidence-linked handoff.

For changed public journeys or an explicit end-user testing request, apply
`.notth/core/workflows/end-user-acceptance.md` and `harness-end-user-testing`: exercise the actual
interface, distinguish real/mocked dependencies, and include user-facing outcome evidence or concrete
BLOCKED/NOT_RUN reasons before completion. API/unit/build success cannot replace required browser/device flows.

When an external OpenSpec propose flow creates a change, run aih change-sidecars <id> before the
clarification/readiness stages to create missing metadata, decisions, verification and artifact-impact
sidecars. Existing files remain unchanged; Harness does not patch the upstream OpenSpec CLI.

Machine contract: spec-to-code.workflow.json. Use explicit `aih ready <id> --workflow spec-to-code --stage implement` to require a recorded review-spec approval; legacy implement/review calls retain their structural behavior. Approval records declare an external review, not authenticated identity or permission.

Use [task experience](task-experience.md) for the canonical Quick/Standard/Full decision table, minimum context, scoped approvals and concise next-action handoff.
