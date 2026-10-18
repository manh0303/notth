# AI Harness → Notth

GitHub: `manh0303/notth`. npm: `@manhd_d/notth`. CLI: `aih`.
The npm name is a new package, not an automatic redirect. Old published versions remain available.
The new name is usable only after its first reviewed publication; a feature PR is not a release.

## Existing projects

Commit current consumer state and run `aih backup` before switching packages. Keep the backup
outside the repository when it is needed for recovery. With a global installation, after the new
package is published:

```bash
npm uninstall -g @manhd_d/ai-harness
npm install -g @manhd_d/notth@latest
aih --version
aih update --dry-run
aih update
aih check
```

For a local installation, remove the old dependency (`npm uninstall @manhd_d/ai-harness`) and
install `@manhd_d/notth` in the same dependency category, for example
`npm install --save-dev @manhd_d/notth` for a development tool. Commit package.json/package-lock.json
with the reviewed snapshot update. For one-off use, run
`npx --yes @manhd_d/notth update --dry-run`, then `update` and `check` with the same package.
Do not invoke the old npx name and expect a renamed release.

`aih`, `.harness/`, `.agents/skills/harness-*`, `harness-start`, AGENTS/Claude ownership markers,
config/lock schemas and `ai-harness-user-config` backup kind remain unchanged. Existing user-owned
settings and OpenSpec work are preserved. Do not rename the markers or directories by hand.
Managed drift must be resolved through the usual review, not by editing lock hashes.
Rollback: restore the prior committed consumer snapshot/config and reinstall the matching old CLI
version recorded before migration. Reinstalling an old CLI alone does not revert a newer snapshot.

Local clones can update their remote:

```bash
git remote set-url origin https://github.com/manh0303/notth.git
```

## First npm publication

1. Merge the reviewed rename feature PR, then review the Release Please PR. Do not reset the version
   or edit the release manifest to restart at 0.1.0; the existing version sequence continues.
2. A maintainer must bootstrap the new npm package using an authenticated npm session if a Trusted
   Publisher cannot be configured before the package exists. From a clean checkout of the **reviewed
   release tag** whose package name is `@manhd_d/notth`, run the commands below. Replace `vX.Y.Z`
   with that actual release tag, not the old v0.15.0 tag.

```bash
git switch --detach vX.Y.Z
npm ci --ignore-scripts --offline --no-audit --no-fund
npm login
npm publish --access public
npm view @manhd_d/notth version
```

`npm publish` runs the package prepublish checks; complete the owner's login/2FA when prompted.
Do not publish a feature branch or an unreviewed version. The automatic first release may fail npm
OIDC until the new package exists and its binding is configured. If already manually published, do
not rerun a job that would republish that same version. Configure automation for subsequent releases.
If npm does not accept the new name, resolve ownership/name availability before publishing; an
unauthenticated 404 alone does not reserve it.

3. On the new npm package, configure Trusted Publisher with owner `manh0303`, repository `notth`,
   workflow `npm-publish.yml`, no environment, and permission **Allow npm publish**. The old package's
   publisher does not apply to the new name. Review [release setup](npm-release.md).
4. Verify the new version via npm and a clean installation before deprecating the old name:

```bash
npm deprecate @manhd_d/ai-harness "Renamed to @manhd_d/notth. See https://github.com/manh0303/notth/blob/main/docs/notth-migration.md"
```

Deprecation requires owner credentials, is a separate registry action, and is not run by this feature
or CI. Keep old versions available; do not unpublish them to accomplish a rename.

## Python / PyPI

The Python distribution is `notth`, with module `ai_harness` and command `aih`.
It bundles the renamed npm metadata/CLI, uses the same release version and still needs Node 22+.
Configure the `notth` project's pending/normal PyPI Trusted Publisher with owner `manh0303`, repository `notth`, workflow
`npm-publish.yml`, environment `pypi`. An existing `ai-harness` repository binding must be replaced.
First Python publication remains dependent on that external setup; see [pip/offline guide](python-installation.md).

Earlier source builds used the distribution name `manhd-ai-harness`. For an existing offline install,
record the old wheel/version and back up the consumer, then run `python -m pip uninstall manhd-ai-harness`
before `python -m pip install notth` (or install the reviewed `notth` wheel offline). Both distributions
own the same import and executable, so installing them together can overwrite each other's files.
Run `aih --version`, then review `aih update --dry-run`, `aih update` and `aih check` per project.
Rollback: uninstall `notth`, reinstall the recorded old wheel and restore the matching consumer snapshot.
Package names and publisher bindings do not redirect automatically; no registry name reservation is claimed.
