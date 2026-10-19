---
name: harness-product-product-outcomes
description: Define product success measures and experiments without inventing baselines or analytics evidence.
---

# harness-product-product-outcomes

## Input
Reviewed problem/MVP, personas, source evidence, available instrumentation and authorized research.

## Procedure
1. Identify user value and one primary outcome; keep activity/output measures separate from actual success.
2. List assumptions, known baselines, evidence strength and measurement access; unknown values stay unknown.
3. Propose metrics, definitions, event/source, owner and evaluation period; numeric targets need stakeholder evidence or approval.
4. Choose a bounded experiment or feedback loop; account for privacy, cost and negative outcomes.
5. Connect results to continue/pivot/stop proposals and backlog updates; only the owner decides scope changes.

## Output
Project-owned docs/product/outcomes.md linked to MVP and PRD.

## Template
Read `.notth/capabilities/product/templates/outcomes.md` from the installed snapshot.
Use `aih new-doc outcomes` only for a missing draft;
reuse existing authoritative docs or a compact task note when appropriate. Never overwrite approved content.

## Example
For customer lookup, propose task completion and observed latency as measures. Without real telemetry, label both baseline and target pending instead of claiming a 30% improvement.

## Quality checklist
- Metric has definition/source/owner and review period
- Hypothesis and actual measurement are distinct
- Experiment does not silently expand collection or release scope

## Handoff
Read the shared installed contract `.notth/capabilities/product/common/document-contract.md`; pass only affected scope and relevant perspectives.

## Constraints
Follow Core permissions, clarification and project-conventions. Ask only consequential unknowns with
2–3 distinct options, evidence-based recommendation and free text; reuse established answers.
No invented source, measured result, target, estimate or approval. No external messaging/publishing,
paid tool use or production changes beyond the user's explicit authorization.
