# Experience and evaluation design

## Reuse decisions

Reuse existing change directory, shared verification-report assertions, source manifests and
checkpoint revision digest. New experience.json stores only reusable solution content, not another
progress/decision store. memory.js derives procedural pointers via a bounded catalog over active and
one-level archived changes. No separate index database; malformed/ambiguous/oversized catalogs are
reported and cannot silently promote knowledge. Source/evidence edits invalidate eligibility; preserved
sources pin the canonical manifest so identical bytes at newer captures also invalidate reuse.

Lifecycle is candidate/verified/rejected/superseded/invalidated. Conditional revision/hash replacement
preserves history and creation time. Verified saves need current baseline/conditions plus actual report
consistency. Eligibility checks category/tags/local revisions only; host checks prose applicability,
external freshness and independently verifies every new task. Supersession needs a current verified
replacement. No private data leaves project or becomes a global rule without separate governance.

Extend the existing comparison helper instead of another scoring engine: legacy 18-slot schema remains,
adaptive suite has 42 slots, matching controls, raw local hashes, explicit NOT_RUN and nullable metrics.
A deterministic lost-update fixture makes failure reproducible. Existing hypothetical Read-only driver
explicitly cannot prove A–G behavior. No actual host run or productivity measurement is invented.

## Impact matrix

| Area | Status | Evidence / reason |
| --- | --- | --- |
| core | done | experience-learning; continuity/project-knowledge/adaptive workflow links; Core behavioral evals |
| adapter | not-applicable | No technology/domain rules, manifests or detection changes |
| capability-skill | done | Existing debugging skill discovers original project experience workflow; no new personal/global skills |
| cli-config | done | experience.js/main.js/memory.js; optional template; existing cli/evals package allowlists |
| workflow | done | Selective Remember/retrieve/applicability/verify flow, no automatic global promotion |
| documentation | done | adaptive-core, CLI, architecture, versioning, eval protocol and comparison/conformance guides |
| verification | done | 375 tests + validate/npm/python/release checks; actual logs and live NOT_RUN in verification.md |
| release-migration | done | CHANGELOG; optional independent schema; config backup unchanged; rollback and release ownership documented |

Declaration → existing package/bundle allowlists → continuity/debugging/memory discovery → selective
experience workflow → lifecycle/freshness/report tests and raw-evidence comparison validation → guides.
Adapters and multilingual README remain intact. Supporting CLI required; no eager migration. Complete
project backup includes task/experience history; config archive intentionally does not.

## Remaining limitations

Metadata ranking is deterministic, not semantic retrieval. Eligibility and scope hashes do not prove
semantic applicability, exhaustive dependency inclusion or evidence authenticity. No host runtime can
be manufactured by instruction. Global promotion intentionally absent. A–G live host trials remain
NOT_RUN until actual controlled execution with matched settings and independent review.
