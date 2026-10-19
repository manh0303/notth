# Optional document export and visual QA

Enter only when the user requests DOCX, PDF or slides. Do not generate all formats for every task.
Use the current canonical Markdown/external source, its approved/proposed status and revision; exporting
does not approve content. Read harness-product-document-review before formatting.

1. Confirm requested format, audience, existing template, output destination and whether an editable
   file is required. Preserve source links, statuses, diagrams, tables and requirement/ADR IDs.
2. Inspect actual host tools and existing format-specific skills, their versions, dependencies and
   per-skill licenses. See .notth/integrations/engineering-sources.md. No exporter is bundled.
   Prefer available reviewed tooling; do not auto-install packages or upload private content.
3. Export only the requested deliverable to an authorized project-owned destination. Do not replace
   canonical sources, overwrite user files or silently substitute PDF for editable DOCX/slides.
   For slides summarize deliberately and retain references; do not invent claims to fill pages.
4. Render every page/slide when tooling permits, then inspect headings, page breaks, clipped tables,
   font substitution/diacritics, diagram labels, links and headers/footers. Fix and render again.
   Extract text to compare substantive content and status with canonical revision; extraction alone
   does not prove layout. Re-export when source changes; mark old exports stale.
5. Record source revision, exporter/tool, actual render evidence, inspected page count, remaining
   findings and output file reference. Without rendering report visual QA NOT_RUN. Without exporter
   report BLOCKED and offer an accepted source draft, not a fake DOCX/PDF renamed from Markdown.

Host manages execution, dependencies, permissions and file persistence. NOTTH CLI never invokes office
tools, model providers or network services. Export is separate from publication/sharing and requires
no extra runtime/agent in Core. Reviewer acceptance is an external decision, not inferred from a file.
