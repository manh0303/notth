---
name: harness-product-techspec
description: Maintain a selective technical specification from requirements, scoped code, contracts and honest verification evidence.
---

# TechSpec

## Input
Approved/provisional requirements, code revision, applicable contracts, existing canonical docs, artifact/source-write policy and runtime evidence.

## Procedure
1. Use existing artifacts.json/integrations.json. Reuse known storage answers; for idea-only input ask where canonical docs should live before writing. External tools need actual host capability, not just a configured alias.
2. Inspect existing documentation and affected code/contracts. Identify facts, proposals and unknowns; do not derive runtime success from static inspection.
3. Include only relevant overview, architecture, business rules, API/error contracts, data/auth, UI flows, dependencies, compatibility, security and operations sections. Do not force a CRM template, database or API onto every project.
4. Link requirement IDs to scenario status and raw evidence. Use Core harness-verification; keep static statements UNVERIFIED until checked. Record BLOCKED/NOT_RUN and measured usage honestly.
5. For existing documents, propose affected section changes and retain unaffected user edits. Compare observed source revision and before/after contracts; record artifact-impact. Source read-only means no write; propose means reviewable patch; write still requires actual host authorization and concurrency checks.
6. Route a new draft with `aih new-doc techspec`, optionally `--report verification/report.json`. The CLI refuses overwrite and hands external destinations to the host; it does not publish or automatically update sources.

## Engineering depth
For consequential features read the expanded template sections selectively: API/error/auth contract,
schema/constraint/index/migration, success/failure sequence, transaction/concurrency invariant,
external timeout/retry/idempotency, diagnostic signals, compatibility and rollout/recovery. Explain
why each included section matters; mark unknown choices proposed. No database section for a static
calculator. Link architecture/ADR sources instead of duplicating accepted decisions.
Derive vertical implementation slices with test boundary and done conditions, then pass scoped code
to Core/adapter skills. The spec documents business invariants, not an invented architecture.

## Output
Selective draft TechSpec, traceability, evidence and affected-section maintenance proposal.

## Constraints
No invented requirements, universal test suite, credentials, blanket regeneration or automatic merge/deployment. Existing BA source is writable only under its declared policy plus actual host permission.

## Template
Use `.notth/capabilities/product/templates/techspec.md` and existing canonical documents.

## Example
Idea: a static calculator needs UX/formula/build/accessibility evidence, no API section. Existing document: an approval transition needs role/state assertions and a proposed affected-section patch.

## Quality checklist
Source revisions, requirement IDs, contracts, actual execution evidence and limits are distinguishable. Partial updates preserve approved text.

## Handoff
Read the shared installed contract `.notth/capabilities/product/common/document-contract.md`; pass only affected scope and relevant perspectives.

## Incremental verification and recovery
For multi-step checks follow `.notth/core/workflows/recoverable-verification.md`: start a draft early, update only affected sections after each observed group, include applicable related-flow tests and persist checkpoint/evidence references. Resume reconciles code/config/fixtures/external revisions and uncertain operations before trusting prior PASS results. Process tools and startup commands come from the actual host/project; no specific IDE, service topology or database mutation is implied.
