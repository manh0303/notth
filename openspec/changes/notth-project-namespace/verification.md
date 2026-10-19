# Verification evidence

Environment: Linux, Node.js 24.19.0, npm 11.9.0. Executed against this feature worktree, 2026-10-19.

| Check | Result | Actual observation |
| --- | --- | --- |
| npm test | PASSED | 359 tests, 359 pass, zero failures/skips; 27618.05 ms final run |
| npm run validate | PASSED | status ok, 364 managed files with all adapters/capabilities, errors [] |
| npm run check:release | PASSED | status ok, distribution 0.18.0, 14 modules; no tag/publish |
| npm run test:package | PASSED | status ok, 418 packaged files; actual installed CLI fresh init and legacy namespace migration preview/update/check/backup |
| npm run test:python | PASSED | Offline wheel/sdist install, .venv overlap, byte parity, reinstall/update preservation, missing Node; no registry/build dependencies |
| git diff --check | PASSED | No whitespace errors |
| Windows / Node 22 | NOT_RUN locally | Existing GitHub Actions matrix remains authoritative |
| Live AI host interpretation | NOT_RUN | No model-compliance or automatic remote synchronization claim |

## Coverage
Original unchanged Python 0.1, npm 0.2 and compressed npm 0.12 fixtures migrate through the normal
installer. tests/namespace-migration.test.js covers fresh .notth/host output, absence of an external
backend, no-write preview, arbitrary/private bytes and rollback copy, mixed namespaces, original
managed drift, new native skill collisions, ordinary write rollback plus retry, lock tampering,
both cooperative installer markers, symlink rejection, original-digest legacy archive restore and
conflicting archive paths. It also checks retirement of the formerly managed backend guide.

Task-context tests verify that old backend declarations grant no behavior and disappear on the next
guarded save. Existing source revision/freshness, context CAS/history, source import and checkpoint
tests pass with the new namespace. Immutable fixture content and historical records were not rewritten.

The package smoke executes the installed npm CLI against an original legacy fixture, confirms the
preview does not create .notth, applies migration and checks the resulting installation and original
rollback lock. No runtime dependency, downloader, provider process or shell execution enters cli/.

## Limitations and handoff
Migration preserves project-owned prose/commands/checkpoint bytes; the host must inspect and
reconcile relevant old namespace references and reverify evidence. Local guards are not distributed
locks or crash-safe multi-file transactions. Original namespace backups may contain private machine
settings and remain in the ignored backup directory. Human reviews/merges this feature; registry
publication remains owned by the subsequent release PR.
