# NOTTH migration

GitHub: `manh0303/notth`. npm: `@manhd_d/notth`. CLI: `aih`.
The npm name is a new package, not an automatic redirect. Old published versions remain available.
The new name is usable only after its first reviewed publication; a feature PR is not a release.


## Project folder: `.harness/` → `.notth/`

Use a reviewed CLI/package containing namespace migration, in the consumer project root:

```bash
aih update --dry-run
aih update
aih check
```

The first command previews without target writes. Update validates the original lock, managed files,
configuration, selected host bridges and destination collisions in a temporary workspace, then applies
one rollback-protected change set. It moves all legacy project-owned bytes, custom files, machine
settings and existing backups into `.notth/`; refreshes managed paths/host instructions; and removes
empty old directories. Documents in docs/sources and OpenSpec work are not moved or rewritten.

A complete original namespace and owned host files are retained under
`.notth/backups/namespace-<legacy-lock-sha256>/`. These may include private machine settings; new files
are mode 0600 where supported. The receipt `.notth/namespace-migration.json` records the backup and
old/new roots. Never publish this backup by accident; the existing `.notth/.gitignore` excludes backups.

Both namespaces already present, edited managed files, malformed config, symlinks or excessive input
size stop migration before target writes. The migration is bounded to 20,000 legacy files / 512 MiB;
individual external instruction files are bounded to 4 MiB. No overwriting one namespace with another.
Ordinary write failures roll back; process kill/power loss retains the installer's existing partial-write
limits. Keep a full project backup/commit and inspect the receipt/markers after interruption.

Project-owned prose, commands and evidence keep their exact bytes. AI uses the migration receipt to
reconcile relevant old path references and reverify affected evidence; it must not replace hashes just
to make a checkpoint pass. Config backup export now uses notth-user-config; restore accepts original
legacy archives after digest/path validation and maps their envelope paths into `.notth/`.

Rollback requires the matching prior CLI plus original namespace/owned-host files from the recorded
backup or prior project commit. Restore on a reviewed branch; do not run an old CLI against the new
layout and expect it to understand the new paths. No release is published by this feature change.

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

`aih`, `.agents/skills/harness-*`, `harness-start`, AGENTS/Claude ownership markers and
config/lock schemas remain compatible. New installs use `.notth/` and `notth-user-config` backups;
legacy backup paths/kinds are accepted only for migration. Existing user-owned
settings and OpenSpec work are preserved. Use the namespace migration below instead of manually renaming managed paths.
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
