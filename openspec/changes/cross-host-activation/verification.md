# Cross-host candidate verification

Parent: PR #76 commit 100b25d50c043bb14c9ce9b3fb980fde24340bbe.
Branch: fix/kiro-memory-capture. Distribution version remains release-owned.

- Focused activation/onboarding/runtime tests: PASS, 33 tests before final Cursor contract refinement.
- Focused final activation/agent-routing tests: PASS, 22 tests.
- Final npm test: PASS, 386 tests, zero failures/skips.
- Final npm run validate: PASS, no structural errors.
- Final npm run test:package: PASS, real offline tarball install; packaged Codex post-tool and
  activation CLI execution, registration for Cursor/Gemini/Copilot/OpenCode/Windsurf plus Kiro fixture.
- git diff --check: PASS.

Native host execution: NOT_RUN for all eight hosts. Commands were invoked with controlled native
payload fixtures and the OpenCode v1 plugin callbacks were called locally. No authenticated host/model
was run. All receipts are producer-declared; even a matching current-session diagnostic is not proof
of a real native callback or semantically correct memory. The diagnostic leaves persistence and
live-host execution unverified. Owner's original Kiro failure is reported, not reproduced here.

Coverage includes settings merge/idempotence, disabled settings, dry-run and rollback, current vs wrong
session/workspace/bundle, old-turn and aged receipts, large MCP payload discarded after metadata use,
no raw prompt/input/result persistence, no SDK/network requirement in plugin callbacks, modern Cascade
workspace precedence and no transcript-capture registration. Cursor avoids a permission preToolUse
handler and checks prompt/post-tool events instead. The final full suite contains those refinements.

A legacy CLI test expected check --host to be rejected; it now verifies the intentional blocked
activation report. An initial OpenCode fixture caught template newline escaping; String.raw fixes it.
These were corrected before the final passing runs above. Native trust, schema/version loading and
host behavior still require the documented trial. No merge, publication or remote-source write.

Tested source digests:
- cli/activation.js: `027e7760a4882d31acfb48d773236082ce2b37b6cb486750243d3515cdcd49cb`
- cli/session-hooks.js: `f9c6e7c1c38ac60ba3c12c32c2a6cdc4212ba0d4ddb2990c52fc3a4f026897db`
- cli/main.js: `c1255c8d49867e81dfa5833fc6e5a0f01f6da9049944d65cfa8131e79aac7abf`
- core/runtime/hook.js: `365d50b1b52f8d70d0bfadc16b5719b65be8b7229b431d56825a2bcaa6ee1f30`
- core/runtime/session.js: `d708c11fa806f191b6cc99daae4a40b6d5bb1a7b20b1e2bc75d2c9b418b34728`
- core/workflows/session-continuity.md: `637504f3c7a891927d8036336ff37323c9d10c786902e5cd1557b4d247e48b4a`
- templates/AGENTS.md: `dbe93f23eeebe1fe522b4795af323a386d97330b7636a0d31a115a0a446c95f0`
- tests/activation.test.js: `15d8eff4e6386c8bc685fd2c0f097bc015d9bce417c2953fbf706b67d33ff5de`
- tests/session-runtime.test.js: `87252bfcd0293a3ac5ee9aea2d747736a599b31e420c5ba6ab887c72128b7bc3`
- scripts/smoke-package.js: `965794bacdfdc590b5fd5ed077207f621ed25f653c2e4288395e0eaff03093f1`
