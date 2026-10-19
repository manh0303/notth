---
name: harness-end-user-testing
description: Exercise approved user journeys through the actual browser, device, CLI or API interface and record outcome evidence. Use when the user requests end-user testing or a change affects an externally observable flow; report unavailable tools/access as BLOCKED.
---

# Test as an end user

## Input
Approved AC/use cases and changed paths, app entry/start instructions, current revision/environment,
existing runner or actual host tools, test-role/account references, authorized isolated fixtures and
configured evidence destinations. Never ask for passwords in chat or record them in shared reports.

## Procedure
1. Load `.notth/core/workflows/end-user-acceptance.md` and reuse `harness-verification` for report
   validation. Inspect requirements and affected interfaces. Choose proportional journeys with stable
   AC IDs: happy path and applicable validation/error/empty/denied-role/state/persistence regressions.
   Avoid imposing a CRM CRUD/login suite on static tools, backend-only services or unrelated changes.
2. Verify that the running app, test accounts and tools are actually reachable. Reuse existing Playwright,
   Cypress, device or CLI/API tests and project commands. If a web runner is missing, propose Playwright
   or an authorized host browser tool and clarify only the consequential setup choice. A declared MCP
   alias does not prove access. Missing essentials block only affected journeys.
3. Exercise the real boundary: web browser navigation/click/fill/keyboard, device/simulator taps,
   terminal commands/output/file state or API-client actor workflows. For web, use accessible roles,
   labels and user-visible controls; avoid internal component state or calling JS handlers as a
   substitute for interaction. API setup can create isolated fixtures but cannot count as UI coverage.
4. Compare outcomes with reviewed AC. Check visible results and applicable persisted state after
   refresh/navigation/reopen, denied actions and negative input. Inspect affected console/network
   failures; they are diagnostic context, not a replacement for business assertions. Avoid fixed sleeps;
   use bounded waits/assertions and reviewed retry limits. Reproduce defects before scoped repairs.
5. Capture redacted machine observations, executed tool/command, timestamps/revision/environment,
   real vs mocked dependencies, role, steps, expected/observed outcomes and fixture cleanup. Keep
   screenshot/trace/video/report attachments separate from JSON assertion evidence and review them
   for sensitive data. Screenshots alone, HTTP 200 or a successful build do not establish a journey PASS.
6. Reuse schema-1 verification reports: user-facing requirements set verification_target to end-user and name the web/mobile/cli/api surface;
   scenarios record journey surface/actor/entrypoint/interaction/dependencies/attachments. Mocked
   or unknown dependency coverage can pass its scoped assertions but cannot verify full end-user AC.
   Run `aih verify --report <file>`; independently inspect raw evidence and current source revision.
7. Fix accepted defects through debugging/TDD/implementer, then rerun affected journeys and regression
   checks. Bound repair/retest rounds according to existing host/project limits. Report remaining
   FAILED/BLOCKED/NOT_RUN before handoff; do not weaken AC or ignore failing assertions to finish.

## Output
AC → actual interface steps → expected/observed/assertions → evidence/attachments → tested scope,
PASSED/FAILED/BLOCKED/NOT_RUN, cleanup receipts, defect reproductions and concrete remaining needs.

## Constraints
No dependency installation, production/shared fixtures, paid provider calls or remote writes beyond
existing authorization. Reuse host/runtime permission and source-write policies. No automatic merge,
release or business-owner UAT approval. Playwright mobile viewport emulation is web evidence, not a
native mobile device test. Test steps and receipts are producer-declared, not independent proof of agent
compliance; independent Harness/model evaluation is a separate use of harness-ai-evaluation.

## Handoff
Give Implementer/Reviewer exact failed AC, reproducible interaction, tested revision/fixture, scoped
result and evidence paths. Domain-owner acceptance remains separate from automated end-user checks.
