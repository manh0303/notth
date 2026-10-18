# PyPI identity and impact

Base: b2ca8072398abf45c79e94a825d46a77d0be606a. Owner requested PyPI name `notth`.
This supersedes the Python-name retention decision in notth-rename and workflow-contract;
those records and versioning history remain historical evidence.

Declaration (`pyproject.toml`, `harness.yaml`) → backend wheel/sdist and `_python_distribution.json`
→ pip metadata/discovery → `ai_harness.launcher` → shared CLI `assertSeparate` for .venv installs
→ offline install/reinstall/update and sdist parity smoke → pip guides and release workflow.
AI-specific reading/behavior is not changed; package installation exposes the same existing assets.
Accept the old marker as well as `notth` for source-build compatibility, without broadening allowed paths.
Never install the two distributions together: they own identical Python/console-script paths.

| Area | Status | Evidence / reason |
| --- | --- | --- |
| core | not-applicable | No rule, policy or AI procedure change |
| adapter | not-applicable | No stack asset, registry selection or adapter contract change |
| capability-skill | not-applicable | No capability or skill contract change |
| cli-config | done | cli/files.js permits new and legacy marker at the existing constrained .venv path; schemas and ownership preserved |
| workflow | done | npm-publish.yml PyPI destination changes to notth; reviewed-tag and OIDC gates retained |
| documentation | done | pip guide, translated README commands, simple-use and migration guide agree on notth |
| verification | done | npm test: 321 pass; validate/check:release and real npm package smoke pass; Python wheel/sdist offline smoke pass; results in tasks.md |
| release-migration | done | CHANGELOG, manifest and versioning/migration cover rename, uninstall-first switch and rollback; version stays release-owned |

External gap: a public 404 does not reserve the PyPI name. Maintainer must configure project `notth`
with owner manh0303, repository notth, workflow npm-publish.yml, environment pypi before publication.
No account setup, name ownership or live-host compliance is claimed.
