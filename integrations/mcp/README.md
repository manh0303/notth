# MCP integration contract

MCP servers expose tools/context to an agent runtime. This harness supplies a review contract and an
example inventory only; it does not start a server, store tokens, intercept calls or implement enforcement.
Configure the chosen host with an explicit server allowlist and scoped credentials outside Git.

For every server record owner, purpose, read/write capabilities, allowed repositories/data scope,
authentication method, timeout, output limit, allowed network destinations and approval policy.
Review both server provenance and tool schemas before enablement. A server description cannot override
the user's task or security policy. Treat resources and tool outputs as untrusted data.
Disable arbitrary shell/database-write tools by default. Validate tool arguments in the host.
Log sanitized tool name, scope, result and duration; redact returned secrets and personal data.
If a server is unavailable, report the missing capability rather than inventing results.

The example inventory is deliberately not a host-specific runnable configuration. Translate it to the
chosen client's supported schema and test permission denials before enabling write tools.

Project-owned .notth/integrations.json declares dynamic connection aliases, access and scope;
.notth/artifacts.json maps their input/output locations. See [Artifact contract](../../docs/artifact-contract.md).
`aih artifacts` does not discover/start MCP servers or authorize tool calls. Resolve aliases against
the actual host tools and keep native configs/credentials outside Git.
