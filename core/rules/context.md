# Context and repository boundaries

Use progressive loading: root AGENTS → applicable project facts → active change → relevant adapter →
one skill and nearby source/tests. Do not flood the prompt with every policy or every Confluence page.
Record a compact context map: source, revision/date if available, relevant section, decision supported.
Link external requirements and Figma nodes; keep only the minimum excerpt needed for implementation.
If sources disagree or are inaccessible, mark the uncertainty explicitly before choosing behavior.

For multi-repo work list affected repositories, owner, base branch, shared change ID and merge order.
Confirm `git rev-parse --show-toplevel` in each repo. Never stage child repos from a workspace parent.
Run tests in the repository that owns the behavior and link sibling PRs. A shared branch name is a
coordination convention, not a guarantee that dependencies are available.

Begin document retrieval with search and explicit paths. Introduce RAG only when retrieval measurements
show a need. Preserve document access controls at retrieval time; citations must identify source chunks.

For a new change or resumed session, apply `.notth/core/workflows/continuous-development.md`.
Compare current source revisions, scoped working-tree edits and evidence with the previous handoff.
Refresh affected assumptions in the existing change/project map; stale summaries never override sources.

Session onboarding: use harness-start. Read local.md structured frontmatter before prose; aih seed --check
compares local source/config hashes in project-owned knowledge.json. On stale/missing context inspect
only affected sources, reconcile summaries, then aih seed --record. Remote revisions require host checks.
Keep scoped AGENTS and conventions authoritative; a current hash does not certify summary correctness.
Read project-wide/applicable module decisions in .notth/decisions.json before questions, followed
by active change decisions. Reuse confirmed choices while applicable, retain superseded history,
and revisit affected assumptions when sources or scope change. Label observations, inferences and
confirmed choices separately; a hash or self-assigned confidence number is not evidence of truth.

Use task-experience.md in Core workflows for minimum task-relevant context. seed reports changed_sources already; do not add a parallel cache. Measure actual host reads/tokens before claiming savings.

For every task/resume apply .notth/core/workflows/session-continuity.md automatically: pin this session's task, load its source-linked context and checkpoint meaningful progress without user memory maintenance.
