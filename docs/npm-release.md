# npm and PyPI publishing — automated releases

The public distribution is `@manhd_d/notth` (CLI command `aih`). The GitHub repository is `manh0303/notth`. The previous npm name was `@manhd_d/ai-harness`; the rename does not move its published versions. See [Notth migration](notth-migration.md) for the first publication and consumer update.

## One-time npm Trusted Publisher setup

Configure this on the **new package**, after its first authenticated publication. The old package's binding does not grant access to `@manhd_d/notth`. Use repository `notth`; a binding referencing
`ai-harness` must be recreated. See the [first-publication procedure](notth-migration.md#first-npm-publication).

In [npm package settings](https://www.npmjs.com/package/@manhd_d/notth) → Trusted Publisher select **GitHub Actions** with:

| Field | Value |
| --- | --- |
| Organization or user | `manh0303` |
| Repository | `notth` |
| Workflow filename | `npm-publish.yml` |
| Environment | Leave empty |
| Allowed actions | **Allow npm publish** (required) |

Use **npm CLI >= 11.5.1** and Node 22.14+ for OIDC; this workflow runs Node 24 and installs npm 11. No `NPM_TOKEN` or OTP is required in GitHub Actions. Keep npm 2FA on for account security. The workflow currently disables provenance while retaining OIDC; this also supports private source repositories.

**Repository setting required:** GitHub → `manh0303/notth` → Settings → Actions → General → Workflow permissions → ensure **Allow GitHub Actions to create and approve pull requests** is enabled. This grants Release Please permission to open Release PRs (which are still reviewed by a human). GitHub does not validate the npm Trusted Publisher mapping when it is saved; the first OIDC release run proves it works.

## End-to-end workflow

1. Feature/fix PRs use Conventional Commits or squash titles: `feat: ...` (minor), `fix: ...` (patch), `feat!: ...` / `BREAKING CHANGE` (breaking). Do **not** bump `package.json`, `package-lock.json`, `harness.yaml` or the Release Please manifest on feature branches.
2. CI runs tests; **you review and merge** the feature PR into `main`.
3. `.github/workflows/npm-publish.yml` runs CI on `main` then Release Please. It opens/updates a separate **Release PR**, proposing version/changelog changes. It also explicitly dispatches `harness.yml` for the generated Release PR branch; the `GITHUB_TOKEN` does not trigger arbitrary downstream workflows.
4. **You review and merge the Release PR** once satisfied. That `main` push triggers the same workflow. After tests pass, Release Please creates a `vX.Y.Z` Git tag and GitHub Release.
5. The **same** `npm-publish.yml` run checks out that tag, checks ancestry on `main`, verifies scope/manifest/changelog, runs tests and an actual npm tarball smoke test, then executes `npm publish --access public` with GitHub OIDC.
6. The tested Python wheel/sdist artifact passes to `publish-pypi`, which publishes via PyPI Trusted Publishing after npm succeeds. Configure owner `manh0303`, repository `notth`, workflow `npm-publish.yml`, environment `pypi` on PyPI separately; the npm binding is not reused.
7. Confirm the new version with `npm view @manhd_d/notth version`. npm processing can take a few minutes. Consumers run `npm install -g @manhd_d/notth@latest`, then `aih update --dry-run`, `aih update` and `aih check` inside each project.

**Why one workflow?** Release Please uses `GITHUB_TOKEN`. GitHub usually suppresses new workflow runs in response to events created by `GITHUB_TOKEN`, including its `release.published` event. Publishing in the same `push main` workflow avoids silently skipping npm publication. For a **manually published** GitHub Release, the same file also supports `release.published` as a fallback, with matching version and main-ancestry guards. Do not create a manual GitHub Release for a version already present on npm; npm versions cannot be overwritten.

## Historical bootstrap: manually published v0.6.0

The release manifest initially started at `{".":"0.6.0"}`; its current version follows reviewed releases.
`release-please-config.json` originally pinned `bootstrap-sha` to the main commit from which v0.6.0 was published. This prevents replaying all historical changes or treating an older branch's releases as new. For the root npm package Release Please uses:

- `release-type: node` to update `package.json`, `package-lock.json`, and `CHANGELOG.md`.
- `include-v-in-tag: true` and `include-component-in-tag: false` to create tags like `v0.6.1`.
- **`extra-files` type `json` for `harness.yaml`**, because despite its .yaml name, this file must stay valid JSON and is parsed with `JSON.parse`; a YAML updater would break the CLI.

`scripts/check-release.js` blocks mismatched versions across the three distribution metadata files and Release Please manifest, and accepts old and Release Please-generated changelog version headings. Feature PRs should not edit `bootstrap-sha`; it becomes irrelevant after the first automated release.

## Security and recovery

A green workflow may have run only `release-please`: inspect job results. Successful npm publication
is the `publish` job; Python publication is `publish-pypi`. If PyPI reports `invalid-publisher`, compare
its registered repository/workflow/environment with the claims in that job. After correcting the
binding, rerun **only publish-pypi** using the original artifact. Do not rerun successful npm publish.
If artifacts expired, rebuild/test from the exact release tag before publishing the missing channel.
See [Python publishing and recovery](python-installation.md#build-và-phát-hành).

No workflow automatically merges a PR. The release job uses only `contents: read` and `id-token: write`; the Release Please job has separately scoped permissions to open PRs/create releases. GitHub-hosted runners are required for npm OIDC. If a Release PR appears without CI checks, use the explicitly dispatched CI run linked from Actions. Never merge an unreviewed release PR.

If the Release Please job fails to create a PR, check repository Actions workflow permissions and the workflow logs. If npm returns E403, check Trusted Publisher's **workflow filename exactly `npm-publish.yml`**, allowed action `npm publish`, and that the connection is active. Do not add bypass-2FA tokens as a workaround. An expired/unverified publisher binding may require recreating it in npm settings.

If GitHub Release exists but npm publish failed, **do not bump the version blindly or create another GitHub Release for the same tag**. Diagnose the failed job. Re-running the workflow is appropriate only when npm still has no published version and the error is resolved. A documented manual recovery is possible after verifying the tag and credentials.

If the failure is in code/tests stored in the release tag, fixing `main` does not fix that immutable
tag. Do not move or overwrite it. Merge the repair, let Release Please prepare a new patch Release PR,
verify CI on its exact head, then review/merge it. Re-running the old tag will reproduce the old defect.
For example, v0.6.1 failed before publication because two migration tests expected 0.6.0.
Main now compares against the source version; the regression suite also exercises the next patch
version. Publish the reviewed follow-up release rather than changing v0.6.1.

Official docs: [Release Please](https://github.com/googleapis/release-please-action), [npm Trusted Publishing](https://docs.npmjs.com/trusted-publishers/), [GitHub Actions event triggering](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/trigger-a-workflow).
