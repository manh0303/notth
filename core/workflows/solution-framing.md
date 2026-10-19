# Project overview, MVP and architecture fit

Apply before new-project implementation or consequential feature/architecture changes, and during
impact review. Size the work to the request; an existing clear bugfix needs a short source/reuse note,
not a fresh BRD, architecture pack or planning interview.

1. Read the user request, local facts, authoritative docs/ADRs and affected source/tests. Establish
   new/maintain/mixed scope, actual revision and relevant modules/integrations/trust/data boundaries.
   Reuse approved decisions and inspect only the context needed; do not fabricate an unseen project map.
2. For a product/new journey, establish actor/problem, complete user outcome, in/out MVP scope, AC and
   minimum safety/data quality. Prototype and MVP are distinct goals. Missing scope/behavior questions
   go to the actual owner; explicit existing authorization still covers routine implementation choices.
3. Establish consequential quality constraints and testable NFR scenarios. Unknown traffic, latency,
   recovery, budget or capacity stays explicit until confirmed. Avoid unsupported numeric targets.
4. Compare 2–3 viable architecture options only when a real decision is open; evaluate complexity,
   operations, testability, costs and reversibility against requirements/team context. Recommend a
   grounded minimal fit. For maintenance preserve existing boundaries unless the agreed change requires more.
5. Separate application/deployment architecture from feature patterns. Ports and Adapters defines
   boundaries; Factory addresses creation. Strategy/Adapter/State require actual variation or state
   needs. Direct code is valid; do not add interfaces, engines or layers for hypothetical future scale.
6. Describe affected public module/data/API/event ownership and important success/failure flows, reuse,
   dependency direction and rollout/rollback constraints. Record significant decisions with alternatives,
   owner/status and reconsideration trigger; compact notes suffice for reversible details.
7. Keep a source-linked overview/map or pointers in local.md. On a later change inspect touched entries
   for drift, update only verified/decided context and preserve superseded decisions. Do not flood context.
8. Use installed Product product-to-solution, Architecture discovery-to-design/change-review and
   Delivery planning/execution-change workflows when selected. Absent modules, apply the compact
   equivalent in existing OpenSpec design/tasks; do not auto-install optional modules.
9. Handoff source revisions, requirement/AC/NFR/ADR IDs, decisions/status, code/public boundaries,
   dependencies, verification and risks to Core/selected adapters, UIUX and DevOps where relevant.
   Return gaps to the owning role; role documents do not launch agents or self-approve decisions.
10. Review implementation against accepted scope/design and actual tests. Model behavior evaluations,
    manual review and application checks are separate evidence. Structural ready is not approval.

When consequential uncertainty remains, stress-test assumptions with targeted counterexamples and failure scenarios before accepting design. Use relevant installed skills when available; do not require external grilling/domain-modeling skills or a quiz for clear small fixes. Capture vocabulary and source-linked decisions in existing docs, following `.notth/core/workflows/project-knowledge.md` when a reusable map is useful.
