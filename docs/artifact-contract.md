# Project artifacts and integrations

Define **Input → Output → Storage → Ownership → Maintenance** once per project.
The AI host executes tools; Harness validates declarations and provides workflows.

| Project-owned file | Purpose |
| --- | --- |
| .harness/artifacts.json | Input/output locations, source revisions, canonical ownership, write policy and dependencies |
| .harness/integrations.json | Dynamic connection IDs, host bindings, purpose, intended access and scope |
| .harness/environment.json | Existing executable/file/build/test contract; unchanged |

Init/update seed empty contracts if absent and preserve existing bytes. No secrets, native MCP
server configuration or account credentials belong in these files.

## Quick setup

Ask the AI:
> Read AGENTS.md and inspect existing sources. If unknown, ask where docs and UI/UX should be
> stored and maintained. Record only the outputs this project needs, their canonical owner and
> source-write scope. Reuse established decisions and authorization.

`aih setup` suggests missing storage choices; `aih artifacts` reports the declarations.
Neither interviews the user, writes answers, connects accounts, retrieves docs nor discovers MCP.
An empty/unconfigured contract keeps old projects usable without forcing a new documentation phase.

For idea-driven work, select Product when its templates help; a small app can use PRD-lite + spec/tasks.
For existing docs, preserve approved sources and create only needed derived technical outputs.

## Repository example

.harness/artifacts.json:
```json
{
  "schema_version": 1,
  "mode": "idea-driven",
  "inputs": {
    "idea": {
      "kind": "idea",
      "location": { "path": "docs/discovery/idea.md" },
      "owner": "project-owner",
      "write_policy": "propose"
    }
  },
  "outputs": {
    "product": {
      "kind": "docs",
      "capability": "product",
      "location": { "path": "docs/requirements" },
      "owner": "project-owner",
      "canonical": true,
      "sources": ["idea"],
      "write_policy": "propose"
    },
    "spec": {
      "kind": "spec",
      "location": { "path": "openspec" },
      "canonical": true,
      "depends_on": ["product"],
      "write_policy": "propose"
    }
  }
}
```

After installing Product, `aih new-doc prd-lite` now creates
`docs/requirements/prd-lite.md` and refuses overwrite. A configured contract must declare a docs
destination for the requested capability. For unconfigured/legacy contracts, the original
docs/discovery and docs/product (or other capability) defaults remain.

## External sources and arbitrary tools

Example .harness/integrations.json:
```json
{
  "schema_version": 1,
  "connections": {
    "requirements-tool": {
      "via": "connector",
      "binding": "atlassian",
      "purpose": "Read project requirements and issues",
      "access": "read-only",
      "scope": ["space/APP", "project/APP"]
    },
    "design-tool": {
      "via": "mcp",
      "binding": "figma",
      "purpose": "Review project UI",
      "access": "read-only",
      "scope": ["approved-file-id"]
    },
    "test-db": {
      "via": "mcp",
      "binding": "postgres",
      "purpose": "Inspect test schema",
      "access": "read-only",
      "scope": ["test-database"]
    }
  }
}
```

Connection IDs/bindings are aliases, not a fixed Figma/Jira/Confluence/DB registry. Map them to actual
authorized host tools; manual access can use via: manual. Runtime credentials and host configuration
stay outside Git. All reported availability is unverified until the host checks it.

An external input or output uses a location such as:
```json
{
  "kind": "docs",
  "capability": "product",
  "location": {
    "url": "https://example.atlassian.net/wiki/pages/123",
    "connection": "requirements-tool"
  },
  "owner": "product-owner",
  "revision": "17",
  "canonical": true,
  "write_policy": "read-only"
}
```

Use it under inputs for an existing source. An output uses its chosen target and usually propose;
do not mark a derived output canonical for the same kind/capability as its canonical input.
`aih new-doc` with an external output returns status planned, the actual locked template and
destination metadata, with executed false. It creates no local copy and performs no remote write.
The host prepares/reviews the draft or publishes only within existing explicit scope authorization.

## Schema and defaults

- Schema 1 has mode (unconfigured / idea-driven / document-driven), inputs and outputs maps.
  Unconfigured maps are empty. IDs and kinds are lowercase hyphenated slugs.
- Each artifact has kind and exactly one location path or HTTPS URL. Local inputs can name files
  or directories; local output paths are directories. Paths stay inside the project, without
  symlinks, traversal or managed/private output folders (.git/.harness/.agents/node_modules/AGENTS.md).
- Optional owner/revision are recorded facts; status is draft/approved/superseded. Defaults are draft,
  not business approval. canonical defaults false; at most one canonical artifact per kind/capability.
  Use different kinds for distinct authoritative artifacts or a collection input for a source set.
- Outputs may name input IDs in sources and output IDs in depends_on. Unknown refs, self/cyclic
  dependencies, conflicting canonical owners and duplicate docs routes are rejected.
- docs output capability defaults product; only one docs route per capability. spec output must
  point to repository openspec; OpenSpec CLI readiness/archive remains local. External specs can
  be input or host-managed exports.
- write_policy is read-only/propose/write. Git defaults propose; external inputs default read-only;
  outputs default propose. Propose is a reviewable patch/PR/handoff, not permission to mutate an
  external canonical page. Read-only sources remain unchanged.
- Connection fields: via (mcp/connector/manual), binding alias, purpose, optional access and scope.
  Access defaults read-only. Write requires nonempty scope. External write artifacts also require
  a write connection and observed revision/snapshot reference. URL credentials and credential
  query parameters are rejected. Config validation cannot detect every secret; never place secrets here.
- Declarations do not grant permissions or enforce connector calls. Verify host tools, user authorization,
  current revisions and optimistic concurrency before a write. A changed/unavailable revision must
  be reconciled; do not overwrite or infer successful publication.

## Spec-driven maintenance

`aih new-change <id>` adds artifact-impact.json with its other draft templates:
```json
{
  "schema_version": 1,
  "reviewed": true,
  "items": [
    {
      "artifact": "output:product",
      "action": "update",
      "status": "pending",
      "reason": "Add acceptance criteria for this feature"
    },
    {
      "artifact": "output:spec",
      "action": "create",
      "status": "pending",
      "reason": "Specify the new behavior"
    }
  ]
}
```

Replace reasons with actual impact; use input:<id> for affected sources. Cover every configured output;
use unchanged with a reason when unaffected. Before implement, reviewed impact must not be blocked
or request changes to read-only artifacts. Before review, every item is done and changed artifacts
have concrete evidence (diff/PR/page/node/source revision/test log). Record remote publication evidence
and sync direction; pending/blocked required maintenance is not completion.

`aih ready` activates this gate only for configured contracts with outputs. It validates structure
and declared completion, not semantic correctness, actual permissions or truthful evidence.
The host reviews requirements → spec → UI/code → verification and updates affected artifacts in
the same change. Reuse prior approval within scope. Sync accepted specs/archive only after merge.

## Update and rollback

Update seeds missing contracts without rewriting configured artifacts, agents.json, local docs or
external sources. Old changes without artifact-impact.json remain usable when no outputs are configured;
when opting in, copy the installed impact template and review actual change coverage. Project/lock
schemas remain 1. Review update --dry-run, then update/check and application tests; rollback via Git.

[Project configuration](project-configuration.md) · [Change readiness](change-readiness.md) ·
[Documentation workflows](documentation-workflows.md) · [MCP contract](../integrations/mcp/README.md).

[Persistent input documents: originals, Markdown and recovery](document-sources.md).
