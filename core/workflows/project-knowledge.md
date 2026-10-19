# Optional project knowledge

Use when repeated discovery spans modules/domains/sources or a new collaborator needs a map.
A small repository or focused fix can use local.md plus existing docs; do not generate an empty tree.
No CRM, provider, IDE, database or architecture is implied by this workflow.

1. Inspect artifacts.json/integrations.json, local.md, actual repository docs and source boundaries.
   Reuse an existing index before creating a new document. Keep canonical docs at declared storage;
   a source catalog is an index of references, not a replacement database for artifacts.json.
2. If useful, adapt `.notth/templates/knowledge-index.md` into the approved project docs location.
   Ask only unresolved storage/authority questions. Do not edit the locked template or automatically
   copy company facts into the reusable Harness source. Without write access, return a proposed patch.
3. Add only relevant sections: architecture/module map, business vocabulary/rules, patterns/ADRs,
   source catalog and common tasks. Link authoritative documents and scoped instructions instead of
   duplicating them. Preserve each source's revision, scope, confidence/unknowns and owner/status.
4. Keep local.md compact with the index path; declare locally inspected index/source files through
   its sources and existing artifacts contracts so seed freshness can detect local edits. knowledge.json
   is a hash cache, not this document collection. Remote revisions still need actual host inspection.
5. Mark observations, inferences, proposals and confirmed decisions distinctly. A copied anti-pattern
   or legacy API status is not a universal rule. Use decisions.json for actual reviewed choices.
6. On a relevant change update affected entries/pointers and invalidate stale assumptions. Do not
   regenerate all docs, require an architecture quiz on every session or ingest the entire catalog.
   Use targeted design questions when uncertainty affects implementation; choose the installed
   relevant skill or perform the equivalent procedure without requiring a third-party skill name.

Review whether a new user/agent can locate the authoritative source, selected skill and current task
without loading the whole repository. Record unknown/missing access honestly; token savings and
understanding quality need actual host measurement.
