# Design and evidence

Reuse recoverSession and existing canonical context/decision/checkpoint sources. Never infer human
approval from a prompt event: some hosts also emit prompts for background/system work. Do not retain
raw prompts/tool input, read transcripts, call a model, or duplicate a semantic store. The runtime
refreshes facts and warning status; it cannot prove that the model interpreted or saved new facts.

Codex/Claude keep the exact existing bootstrap and gain UserPromptSubmit/PreToolUse on opt-in update.
Kiro uses a separate project-owned file with documented SessionStart/PromptSubmit/PreToolUse/AgentStop
triggers and plain stdout context. The existing managed agent-prompt bridge remains compatible.
Unrelated files/settings survive, conflicting hook files refuse overwrite, and dry-run is write-free.
Pre-tool hooks inject context, never an allow/deny approval. This avoids preventing repair reads or
claiming machine enforcement of natural language. Overflow/source uncertainty stays visibly blocked.
Per-prompt/tool receipts overwrite their latest metadata; lifecycle snapshots occur only at Stop or
PreCompact. Receipt presence is not authenticated native execution or semantic reconciliation proof.

Native binaries kiro/codex/claude are absent here: actual activation, context-window compaction and
model behavior are NOT_RUN. Offline subprocess fixtures and packaged commands are separate evidence.
The existing recovery driver deliberately retains its Kiro BLOCKED status until a native driver is
verified. A new behavioral scenario in core/evals/cases.json remains unscored.

## Impact matrix

| Area | Status | Evidence / reason |
| --- | --- | --- |
| core | done | Runtime fresh recovery; continuity workflow; single-chat-correction eval |
| adapter | not-applicable | No technology adapter or module contract changes |
| capability-skill | not-applicable | Reuse existing skills and entry point to continuity workflow |
| cli-config | done | session-hooks.js, CLI help, managed runtime; project-owned Kiro hook and migration preflight |
| workflow | done | Each-turn reconciliation and pre-action preservation in session-continuity.md |
| documentation | done | README, CLI/runtime/Kiro guides describe native and semantic limits |
| verification | done | tests/session-runtime.test.js and real-tarball smoke; native trials explicitly NOT_RUN |
| release-migration | done | CHANGELOG and versioning opt-in upgrade/rollback; no version/schema/dependency change |

Declaration → consumer chain: sessionHookChanges → installed native settings / Kiro v1 file →
host invokes vendored hook.js → recoverSession reads canonical sources → event-specific context →
continuity workflow reconciles → unit/subprocess/package checks and separate unscored live eval.
The last semantic step is not certified by the preceding mechanical steps.

## Verification results

2026-10-20: npm test PASS (374/374); npm run validate PASS (no errors);
npm run test:package PASS (real offline tarball including Codex prompt/tool and Kiro prompt commands);
npm run test:python PASS (offline wheel/sdist installation and byte parity);
npm run check:release PASS (distribution remains 0.19.0). git diff --check PASS.
Native host activation, same-chat model compliance and native compaction remain NOT_RUN;
see native-evaluation.md. This PR is draft pending that evidence, not a zero-forgetting guarantee.
