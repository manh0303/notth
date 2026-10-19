# Understand an existing project

Enter from harness-start/project-setup when affected modules already exist. CLI `seed` discovers
paths/hashes; the host reads and understands them. Reuse current context and applicable confirmed
project/module decisions; do not repeat a full repository scan each session.

1. Topology: read root/scoped AGENTS, build manifests and declared convention/source guides.
   Identify module boundaries and the affected stack. Do not infer architecture from adapter names.
2. Architecture: inspect one or two representative modules relevant to the task, aiming at no more
   than eight source files initially. Expand only to resolve a concrete boundary/behavior uncertainty.
   Record source-linked observations; label inferences separately. Existing code is not approval for
   an exception, especially when it conflicts with instructions or security.
3. Tooling: discover only relevant skills/roles, current changes, declared commands and host tools.
   MCP config names indicate declarations; confirm actual availability and scope in the host.
4. Machine: reuse shared environment declarations. Ask only missing local executable/file locations
   and save overrides in ignored machine.json. PATH/wrappers/custom settings are project choices;
   do not universally require Maven or a settings flag.

Keep local.md compact with evidence paths and unresolved facts. Save confirmed project-wide/module
choices in .notth/decisions.json and change-specific choices under the active OpenSpec change.
Keep superseded answers traceable. Source changes invalidate affected assumptions; inspect the
changed source and any relevant scoped instructions, update only affected context, then seed --record.
Save partial observations after each useful step; do not fabricate completion or a confidence score.
Continue the authorized task when its relevant facts are sufficient; do not make exhaustive discovery
a gate for a small fix. Semantic understanding and token/time savings require actual host measurement.

For repeated multi-module/domain discovery, use `.notth/core/workflows/project-knowledge.md` to maintain optional source-linked context at existing canonical docs destinations; no mandatory knowledge tree or full-repository interview.
