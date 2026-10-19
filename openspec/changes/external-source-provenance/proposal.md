# External source provenance

## Why
Persistent local files do not identify Jira/MCP/API origin, scope, completeness or externally observed
freshness. Matching local hashes cannot establish that remote requirements are current.

## Scope
Extend the existing source store with common host-supplied capture metadata and observation evidence.
Support file, URL, MCP, connector and API transports without provider-specific code. Preserve all
local data and connect Core intake/resume to canonical external ownership. User authorized this
follow-up in the current session after the persistent-source PR was merged.

## Non-goals
No network/provider calls in CLI, connector installation, credential storage, continuous sync, RAG,
semantic certification, remote writes, auto-merge or package publication.
