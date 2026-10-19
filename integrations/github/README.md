# GitHub integration

This directory provides review/CI templates, not a GitHub API client. Installation copies templates into
.notth/integrations; it never creates remote repositories, pushes code or overwrites existing CI.
Copy/adapt pull_request_template.md to .github/pull_request_template.md after review.

For a consumer pipeline, make a trusted pinned harness checkout available, then run:
`node /path/to/notth/bin/aih.js check --target "$GITHUB_WORKSPACE"` with Node.js 22+.
If the reviewed package is already installed, use `aih check --target "$GITHUB_WORKSPACE"`.
The check compares installed payload against its recorded lock, not against a trusted remote release.
For independent provenance, review lock changes and compare them with a pinned source commit.

Recommended repository settings: private visibility, main as the default branch, PR-only changes,
required checks, human review and no automatic merge. Configure these in GitHub; this harness does not
enforce branch protection. Availability of protection features depends on repository/account settings.
Use minimum token permissions. Do not run untrusted PR code with write tokens or production secrets.
The framework's own CI is in .github/workflows/harness.yml, with read-only contents permission.
