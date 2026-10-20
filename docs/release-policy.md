# Release discipline and module versioning

Distribution version is `harness.yaml` + `package.json` + `package-lock.json`. Optional `module_version` belongs to each adapter/capability, allowing independent contracts inside a single npm package.

## Prevent concurrent version conflicts
1. Feature PRs **do not bump** distribution version, tag or publish. Describe changes in the Unreleased changelog.
2. Each module maintainer changes `module_version` only for real contract changes, describing compatibility impact in the PR.
3. One **release PR** assigns the next distribution version, updates all three metadata files, and moves Unreleased notes into a version heading.
4. Check CI on Linux/Windows and Node 22/24; run behavioral agent evaluations when instructions change, not just synthetic unit tests.
5. A human reviews/merges the feature PR, then reviews/merges the auto-generated Release Please PR. The second approval authorizes the workflow to tag/release and publish npm through OIDC and then PyPI through its separately configured Trusted Publisher, after tests.
   Both channels use the same immutable release tag. npm success does not imply PyPI success; rerun only
   the failed PyPI job after fixing its configuration, without republishing the npm version. No publishing from feature PRs, and no publish-on-tag alone.

## Compatibility
- Existing schema-1 config and locks remain valid. Optional module contract fields are additive.
- `aih verify` / `aih eval` default to adapter-only. `--scope all` includes Core, capabilities and matching cross-module cases.
- New installs and reviewed updates validate required module dependencies. `aih resolve` never silently installs recommendations.
- Reports are bundle/dataset bound; human-scored reports do not prove AI behavior or tool execution.
- No module may bypass Core permission rules, and the CLI grants no runtime privilege.
