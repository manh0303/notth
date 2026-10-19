# Design

Base: d3a79360bb499aa6e87904cadfa4a3c02df1696a, merged persistent sources.

The host fetches authorized resources and stores raw exports, converts Markdown, then supplies an
independent schema-1 metadata envelope. Exact snapshot SHA, canonical locator or binding/resource ID,
observed revision, timestamp, stable scope and explicit completeness bind the snapshot to its origin.
Unknown revisions are omitted. URL credentials/query/fragment are rejected; credentials in free text
or raw payload still require host redaction, not a claimed complete secret scanner.

Opt into source-manifest schema 2 only on --metadata import; schema-1 reads/local imports do not
rewrite stores. Captures retain same-bytes/different-revision events, select newest captured_at, and
permit explicit remote reverts without erasing history. Older local revisions remain, without inferred
remote provenance. Stable permalink+scope identifies a remote resource across transport changes;
without a permalink, connection+resource ID+scope is the identity.

source-check accepts a structured host observation and actual raw evidence file bound by hash. The
report targets both snapshot/capture digests, rejects stale targets/future or unordered observations,
and retains all checks. Read-time status compares revision/hash only where comparable. Disagreement
is changed; incomparable is unknown; failed access is unavailable. Matches are unchanged-at-check,
not current forever. Partial completeness is independent. A new capture has no applicable prior check.

Reuse installer guard/transaction and bounded reads. Evidence files are content-addressed under
observations and verified with snapshots on reads. Host declarations/evidence are not provider-signed
attestations. Same ordinary-failure rollback and power-loss limitations apply. Source folder backup
includes the manifest, originals, normalized and observations; configuration backup stays unchanged.

## Impact matrix
| Area | Status | Evidence / reason |
| --- | --- | --- |
| core | done | source-intake + start/spec + traceability checks and external-source-freshness eval |
| adapter | not-applicable | source transport independent of application stack |
| capability-skill | done | existing Core entry points extended; no new skill/capability IDs |
| cli-config | done | sources/source-provenance/main; optional metadata and source-check; templates |
| workflow | done | host fetching/partial intake, evidence-backed observation, source impact handoff |
| documentation | done | document-sources/CLI/artifact/architecture/versioning; actual limits explicit |
| verification | done | 340 tests + validate + package smoke pass; see verification.md; live MCP/API NOT_RUN |
| release-migration | done | changelog + schema-2 opt-in/rollback guidance; distribution remains release-owned |

## Declaration-to-consumer chain
Metadata/observation templates → existing templates bundle/lock → source-intake (start/spec entry)
→ host capture → CLI validation/preservation → Core traceability review → user source guide.
CLI glob allowlist includes source-provenance.js; no harness.yaml module registration/version change.
Package smoke checks templates/CLI and executes the new routes. No claim of live host compliance.
