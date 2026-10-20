# Adapter capabilities

Maintainer entry point: [Harness maintenance and impact matrix](harness-maintenance.md).

An adapter is a versioned instruction bundle, not an executable plugin. Core owns TDD, debugging,
review and the general workflow. Adapter skills address technology-specific decisions and reuse Core.

| Adapter | Skills |
| --- | --- |
| java-spring | Spring API, database migration and Java/Spring implementation/review guidance |
| react-nextjs | Feature slices, behavior testing, accessible UI, server/client authorization and caching |
| astro | Static-first micro-tools, islands, SEO, performance, Cloudflare and optional MFE migration |
| react-native | Screen/navigation slices, behavior/platform testing, offline synchronization, permissions and deep links |
| ai-python | RAG access filtering, model tool safety |
| kubernetes | Workload review, Helm release and safe rollout planning |

## Source contract
For setup, skill choice and examples see [Frontend/mobile coding](frontend-mobile.md).

adapter.yaml uses **JSON-compatible YAML 1.2**, parsed with JSON.parse. Arbitrary YAML syntax is not supported.
The CLI rejects unknown fields and unsupported schemas rather than guessing. Required fields:

| Field | Contract |
| --- | --- |
| schema_version | 2 |
| id | Directory ID, lowercase hyphenated slug registered in harness.yaml |
| description | Nonempty text |
| detection | Nonempty array of {file, kind, values}; kind is contains or dependencies |
| rules | Unique rules/<topic>.md paths with nonempty text |
| skills | Unique harness-<adapter-id>-<skill> names; each has skills/<name>/SKILL.md |
| verification | checks/verification.yaml |
| evaluation | evals/cases.json |

Skill files have name/description frontmatter and Input, Procedure, Output, Constraints sections.
Installer copies declared SKILL.md files to .agents/skills and retains the whole adapter snapshot under
.notth/adapters. Each exposed skill must be self-contained or refer to installed .notth paths;
relative source-only sibling assets are not automatically exposed. AGENTS points to selected adapters.
The assistant host determines skill discovery; the CLI does not start agents or configure personal plugins.

## Detection
`aih detect` returns adapter IDs and matched files/tokens without writing or executing code. Dependencies
inspect package.json dependency, devDependency, peerDependency and optionalDependency keys. `contains`
performs literal case-sensitive matching in Maven/Gradle or Python configuration; it is heuristic and can
match comments. No-match is not proof the stack is absent. Generic Java/Python projects are not automatically
classified as Spring/AI. React alone does not imply web; next/react-dom identify web and react-native/expo
identify mobile. Multi-target projects may match multiple adapters. Versions are not inferred.

Use `aih init --detect --dry-run` to review installation; --detect opts into selection. Prefer explicit
--adapters when evidence is incomplete. Maven detection follows declared modules only (depth 2, up to 64 POMs / 4 MiB total).
For other monorepos choose a module via --target or provide explicit selection; there is no arbitrary
recursive scan or automatic application topology mapping. Update uses project.json and never silently changes the stack.

## Verification plans
`aih verify` reads the installed checks, validates drift and returns a plan with executed:false. Schema 1
verification files contain a checks array. Each check declares id, title, command (argument array),
when_file (relative path or null), evidence (nonempty strings), execution (advisory or manual).
Manual entries have no command. Presence of when_file only suggests applicability; it does not verify
scripts, tool versions or permissions. `<package-manager>` must be replaced after inspecting the lockfile.
Maven/Gradle wrappers shown in the plan use POSIX names; on Windows select the project's .cmd/.bat wrapper.
Review all commands before executing in the authorized development environment. No eval, install, detect
or verify command starts subprocesses, runs builds, installs dependencies or sends provider requests.

## Agent evaluation with evidence
`aih eval` combines the selected adapters' installed scenarios and emits two objects:
- dataset: prompts, required criteria and critical flags, with namespaced IDs.
- report: metadata and results template; scores start null and evidence is empty.

Run scenarios with the intended agent in a separate authorized test workspace using synthetic data.
Preserve the transcript and changed files. A reviewer records actual evidence and a boolean for every
criterion. Copy **only the report object** into report.json; fill model, harness_commit (reviewed source
commit), reviewer, run_id and parameters. Keep generated dataset_sha256 and bundle_sha256 unchanged.
Then run `aih eval --report report.json`. The command returns pass/fail from the submitted scores and
exits nonzero if any criterion fails. It rejects incomplete reports and hashes from another dataset/bundle.

This validates report completeness and aggregates human judgments. It does not independently inspect
transcripts, prove agent compliance, authenticate the reviewer, or run a live LLM. Hashes detect accidental
mismatch, not forgery. Report actual behavior, not expected behavior. Do not treat synthetic unit-test
reports as evidence of model quality. Review the Core evaluation scenarios separately using evals/README.md.

## Astro lightweight websites

See [Astro micro-tool walkthrough](examples/astro-micro-tools.md), [Astro adapter README](../adapters/astro/README.md) and the six Astro skills. Static-first, no backend by default; selective React islands do not equal independently deployable MFE. Cloudflare deployment requires a compatible Astro runtime and explicit approval. `aih` does not deploy or install Astro dependencies.

## Adding a capability
Add rules and a concrete technology skill with testable inputs/outputs; avoid duplicating Core procedures.
Declare metadata/checks/cases and register new adapter IDs. Include detection positive/negative fixtures,
install/removal/drift cases, and report validation tests. Run npm test, npm run validate and npm run
test:package. Version changes and review installed snapshots before release.

## Project coding conventions

Core owns new/maintain/mixed mode, precedence, discovery/reuse and diff-review rules for every adapter. Java/Spring, React/Next.js and React Native declare `rules/conventions.md` for stack defaults; existing project decisions take precedence. See [Project conventions](project-conventions.md). Checks remain advisory/manual and do not enforce application architecture.
