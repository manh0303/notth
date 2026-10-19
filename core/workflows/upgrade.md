# Harness upgrade workflow

Read CHANGELOG and docs/versioning.md in the trusted source checkout. Pin a commit or released tag.
Create a consumer branch and ensure its installation is committed. Run update with --dry-run first.
If a managed file differs, move intentional project overrides to .notth/local.md and restore that
managed file from the prior install commit. Never hand-edit hashes to hide a conflict.
Apply the update, inspect the complete Git diff, run harness check and project quality gates.
For a major version read the migration guide and explicitly pass --allow-major.
Open a PR; include old/new version and source commit, adapter changes and test evidence.
Rollback by reverting the consumer's installation commit. The CLI intentionally refuses downgrades.
