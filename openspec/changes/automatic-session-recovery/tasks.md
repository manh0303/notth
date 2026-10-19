# Tasks and evidence

- [x] Inspect current context, provenance and checkpoint recovery boundaries.
- [x] Implement bounded immutable durable-state capsules and deterministic session selection.
- [x] Register optional Codex/Claude lifecycle commands preserving native settings.
- [x] Add independent native interruption runner and protocol-fixture tests.
- [x] Local validation: `npm test` 368/368; `npm run validate` PASS; `npm run test:package` PASS (includes installed CommonJS hook fixture); `npm run test:python` PASS.
- [ ] Run actual Codex, Claude Code and Kiro session recovery trials (BLOCKED: executables unavailable; Kiro command bridge unverified).
- [ ] Verify actual host automatic context compaction and post-compaction injection (BLOCKED: native hosts unavailable).

Probe evidence: native-probe.json was produced by the separate runner on 2026-10-19; all three
executables are unavailable on PATH. Native recovery and real automatic compaction remain unscored.
Protocol fixtures validate deterministic runtime behavior only.
