# Automatic source-linked session continuity

## Why
The owner reports that parallel sessions lose the current pain points and links to earlier work.
They authorized implementation of source-linked task context and optional Beads coordination, with
automatic host housekeeping so users do not maintain memory files or run extra commands daily.
This is a captured request summary from the current implementation conversation, not an imported
verbatim transcript or independently authenticated business approval.

## What changes
- Connect existing sources, shared decisions, OpenSpec task pointers and checkpoints through an
  optional guarded per-change context sidecar with original problem/outcome.
- Include context in start/chat/status/resume, detect stale source revisions and dependent links.
- Pin session scope rather than treating shared start.json as session identity.
- Add a host-owned optional Beads coordination contract; preserve dependency-free local behavior.

## Boundaries
No model/server, distributed lock, source crawler, new runtime dependency, automatic Beads install,
provider execution, auto-merge or publish. Host behavior remains instructions plus actual host tools;
offline CLI tests do not certify live agent compliance. Preserve existing canonical stores and user data.
