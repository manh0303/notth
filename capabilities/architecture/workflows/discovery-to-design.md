# Scope → solution design → implementation boundaries

Input: idea/reviewed BA documents or an existing project, actual source and Core context. Output:
reviewed solution decisions linked to requirements and OpenSpec; no mandatory full template set.
1. Read `.notth/core/workflows/solution-framing.md`; establish mode/depth and preserve prior answers.
2. Load harness-architecture-project-context. Verify the affected project map and existing decisions;
   use an overview for new/material changes, compact source notes for a small task.
3. Read reviewed MVP/AC or ask BA/PO about missing scope; use quality-attributes to identify testable
   NFRs with real target authority. Unknown load/SLA/cost stays explicit.
4. Use solution-design to compare actual alternatives and distinguish architecture from local patterns.
   Recommend a minimal fit and ask only consequential unresolved questions with A/B/C trade-offs.
5. Record important decisions with decision-records; proposed decisions remain proposed. Describe
   public modules/data/contracts and critical success/failure paths with verification/rollout needs.
6. Apply review. Hand approved scope/decisions and unresolved unaffected gaps to selected Product,
   Delivery, DevOps or Core/adapter workflows. Record requirement/NFR/ADR IDs in OpenSpec design/tasks.
7. Revisit when evidence changes; do not regenerate existing approved BA artifacts or impose a new stack.
