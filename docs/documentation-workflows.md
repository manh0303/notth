# Documentation workflows — ideas or existing requirements documents

Notth intentionally supports **two entry points feeding one engineering pipeline**. The Product capability supplies role contracts, skills and drafts to an authorized AI host; the `aih` CLI never performs conversations, web research, ingestion, writes to Confluence or automatic approval.

## Bắt đầu nhanh — ví dụ đầy đủ

- [Walkthrough A: Từ ý tưởng developer đến spec và PR](examples/idea-driven-project.md): lệnh CLI, prompt thảo luận/research, cách review và chuyển sang OpenSpec.
- [Walkthrough B: Dự án đã có tài liệu yêu cầu (BRD/PRD/SRS)](examples/document-driven-project.md): đọc đúng nguồn, kiểm tra gap, tránh viết lại tài liệu chính thức và tạo OpenSpec theo approved AC.

Để thử tài liệu chưa merge, cài CLI từ **branch PR #10 đã review** thay vì mặc định `main` (xem [Getting started](getting-started.md)).

## Mode A — Idea-driven (developer → BA/PM/PO)

1. Install with `aih init --capabilities product` (add optional UI/UX/adapters only if needed).
2. Use `aih skill harness-product-idea-discovery` to instruct the AI host to preserve the original idea, clarify user problem and discuss MVP options iteratively.
3. Use `aih skill harness-product-product-research` and permitted search tools to support market/competitive/feasibility decisions. Record citations and dates; mark unavailable research as pending.
4. Draft the **minimum necessary** documentation:
   - Solo developer/small scope: `aih new-doc idea`, `aih new-doc research` (optional), `aih new-doc prd-lite`.
   - Larger/product or enterprise scope: `aih new-doc brd`, `aih new-doc prd`, `aih new-doc srs`, `aih new-doc use-cases`, backlog, AC and traceability as needed.
5. AI proposes and reviews; **developer or explicitly authorized owner** records accepted decisions and approval. Continue discussion when important UNKNOWNs affect scope.
6. Feed approved requirement IDs and acceptance criteria into `aih new-change <id>` plus the appropriate adapter; a human reviews specs and PRs.

This is not an automatic document-writing command: each `new-doc` simply copies a pinned template into the **consumer** repository. An AI assistant with filesystem permissions must populate the draft; the human reviews.

## Mode B — Document-driven (existing requirements sources → engineering)

1. Register official BRD, PRD, SRS, Confluence page URLs/revisions, owners and permission scopes in `docs/product/source-register.md`.
2. Use the `document-driven` workflow in the installed Product capability to inspect authorized input and build requirements / AC traceability. If an official SRS already exists, do **not** generate a competing one by default.
3. Create only missing artifacts or project-specific derived docs; identify contradictions/staleness and obtain explicit owner decisions.
4. Approved source-linked requirements → UI/UX if applicable → OpenSpec change → implementation/testing/PR review. Carry source/version and FR/US/AC IDs through each handoff.
5. When upstream requirements documents change, run change-impact analysis and propose diffs; do not rewrite approved requirements sources or code without review.

## Storage and ownership

| Artifact | Canonical location | Notes |
| --- | --- | --- |
| Harness roles, skills, workflows, templates | `notth/capabilities/product/` | Versioned framework source; not real customer requirements |
| Original developer idea and evidence summary | Consumer `docs/discovery/` | Project-owned, Git versioned; `idea.md`, `research.md` |
| Project product artifacts | Consumer `docs/product/` | BRD/PRD/PRD-lite/SRS/UC/backlog/AC/traceability |
| Enterprise requirements documents (BRD/PRD/SRS, including Confluence pages) | Existing authorized external system | Canonical source; keep URLs/revisions and permission scope, avoid copying confidential content |
| Technical change specifications | Consumer `openspec/` | OpenSpec design/tasks/delta specs linked to approved requirement IDs |
| UI designs | Figma or approved system of record | Store screen-to-URL/node ID mapping, not copies of entire design |
| Large binary documentation | Authorized object storage | Store references rather than large sensitive binaries in Git |

A product spanning many services should ideally have a single product-owned documentation home, with service-local OpenSpec/architecture and links back to approved requirements. If multiple repositories are used, explicitly designate the system of record and prevent parallel editing of copies.

## Metadata and quality

Every derived artifact should identify owner, status (`draft`, `pending-review`, `approved`), version/source revision, review history and stable IDs. Facts from external sources require anchors; AI inferences, proposals and unverified assumptions are labeled separately. Unavailable evidence or approvals remain UNKNOWN/pending; do not invent them.

Review checks: source freshness and access authorization; conflicting statements; missing FR/NFR to story/AC mapping; unsupported quantitative NFR; duplicate IDs; orphaned stories/screens/OpenSpec; missing review decisions; no claims of unexecuted validation. The current `aih verify` emits advisory checks, not executed document verification.

## Confluence export/publishing contract (future host integration)

Confluence is a **publication platform**, not a file type interchangeable with SRS/PRD. For Confluence imports, record space/page ID, URL, version, access class and section links, and reconcile against local derived docs. For exports, prepare Markdown/Confluence-friendly pages and a mapping from stable document ID → Confluence page ID/version. Require explicit target-page selection, write permission, diff preview and human approval before creating/updating pages. Use version checks and refuse unknown concurrent changes; avoid duplicate pages and unapproved overwrites. The CLI does not integrate with Atlassian APIs.

Future permission-scoped indexing/RAG may improve retrieval for very large corpora, but Git/Confluence remains canonical. Do not require an embeddings database to use either mode.

## Example handoff

```text
Mode: idea-driven (or document-driven)
Source: IDEA-001 (or SRC-001 revision 5)
Status: pending-review (until human approval)
Requirements: FR-001, NFR-001, US-001, AC-US-001-01
Artifacts: docs/product/prd.md; docs/product/srs.md (if applicable)
Proposed OpenSpec change: add-expense-categorization
Risks/unknowns: threshold and privacy requirements pending decision
Permissions: read/write authorized project branch only; no external publish or merge
Human reviewer: developer or named BA/PO
```

## Product → solution → delivery

For new/material journeys, reuse existing requirements documents and continue with [Solution workflow](solution-workflow.md).
PO defines a usable MVP and evidence-backed outcomes, SA evaluates quality/architecture/contracts,
PM sequences dependent value slices. Accepted decisions and requirement IDs feed OpenSpec and adapters.
Depth scales to the task; no mandatory full document set for small fixes. Use [tool setup](tool-setup/README.md).

## Input/output storage and source maintenance
Use [Artifact contract](artifact-contract.md) before authoring: reuse known locations or ask where
docs/UI should be maintained, record canonical owner and source revisions, then use proportional
templates. Existing sources are read-only/propose/write as declared; host authorization still applies.
Update affected docs/spec/UI with the change and record artifact-impact evidence. new-doc respects
local output folders or returns a host handoff for external targets, without publishing itself.

See [Adaptive verification and TechSpec](adaptive-verification.md) for read-only discovery, evidence reports and selective technical documentation.

For ongoing changes and feedback, use [Continuous development](continuous-development.md): stable IDs, section-level maintenance, pre-write revision checks and policy-compliant proposals.
