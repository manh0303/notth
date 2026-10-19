# Verification

Environment: Linux, Node v24.19.0. Base d3a79360bb499aa6e87904cadfa4a3c02df1696a.

- `npm test`: PASS, 340 tests, zero failures/skips.
- `npm run validate`: PASS; 6 adapters / 8 capabilities / no errors.
- `npm run test:package`: PASS; 412 package files. Installed CLI imports external metadata and
  records an evidence-bound observation; new validator and both templates are packaged.
- `git diff --check`: PASS.

Nine provenance tests plus the ten existing source tests exercise:
- legacy read/no rewrite, dry-run/no schema migration, explicit schema-2 import preserving files;
- common file/URL/MCP/connector/API envelope, partial/missing content, idempotent reimports;
- same-byte revision changes, new bytes, explicit remote revert, canonical identity/scope conflicts;
- changed/unchanged-at-check/unknown/unavailable; contradictory revision/hash and stale capture rejection;
- URL credentials/query/fragment, exact snapshot digest, future/invalid dates, malformed JSON without echo;
- evidence hash/tamper/order, ordinary write failure rollback and complete-folder recovery through update;
- actual CLI import/check route and argument checks.

Manual review traced templates → managed bundle → Core start/spec/artifact/source intake → host capture
and observation → CLI record → traceability check and user guide. Package/registry changes are covered by
existing allowlists, with no new module/version or runtime dependency.

NOT_RUN: live Jira/Confluence/MCP/API calls or real-host instruction compliance, provider pagination and
revision guarantees, conversion quality, Windows/macOS/Node 22 execution here, upstream OpenSpec CLI.
Fixtures validate the storage/report boundary, not provider access or truthfulness of host declarations.
No live synchronization, RAG, source publication, merge or registry release was performed.
