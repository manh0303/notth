# Verification and evidence

For the checked-out revision, run the required local gates from the NOTTH repository root:

```bash
npm test
npm run validate
npm run check:release
npm run test:package
npm run test:python
```

Use each command's actual output for test counts, registered modules and packaged files; these
change between releases. Source/package versions come from `package.json` and the matching lock.
[Harness CI](../.github/workflows/harness.yml) runs Node 22/24 on Ubuntu/Windows, npm package smoke
and Python 3.9/3.12 wheel/sdist smoke. Check the result for the exact PR/commit, not an older run.

| Verification layer | What passing establishes | What it does not establish |
| --- | --- | --- |
| Unit/CLI tests | Local contracts, preservation, conflicts, schemas and deterministic recovery | Native AI obedience or application correctness |
| Structure validation | Registered assets, links and declared workflow relationships | Semantic completeness of every document |
| npm/Python smoke | Actual package build/install, CLI and selected payload behavior | Publication to either registry |
| Example CLI replay | Allowlisted NOTTH commands in disposable consumers | Framework installs, application tests, deploy or live AI |
| Native host trials | Only the recorded host/version/model/scenario | Universal multi-host or post-compaction guarantees |

Legacy migration fixtures retain their original bytes/hashes. Synthetic evaluation/report fixtures
are contract tests, not model quality scores. `aih check` checks the consumer snapshot; `aih verify`
plans checks or validates supplied evidence and never runs application tests. The host runs those
separately and records actual revision, commands, results and BLOCKED/NOT_RUN checks.

Live behavior: use [conformance](conformance-runner.md), [session recovery](session-runtime.md) and
[behavioral evaluation](../evals/README.md) protocols. No host pass is inferred from local tests.
Publication: inspect both registry jobs in [the release workflow](npm-release.md); a GitHub Release
or green release-PR update is not proof that npm and PyPI packages both exist.
