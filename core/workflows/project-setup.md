# First-run project setup

Read AGENTS.md, local.md, actual build files and existing environment configuration first.
For project/MVP/architecture decisions, apply `solution-framing.md` at the appropriate depth.
For input/output/storage/source-write decisions, apply `artifact-contract.md`; ask only when
needed for the task and reuse known project/session decisions.
Use harness-start in the current session (Kiro: /harness-start), with seed freshness checks.
Use `aih start` for terminal intake or a read-only host plan; reuse `.notth/start.json` and declared
artifacts before asking. CLI root-file discovery is metadata evidence; inspect content and the actual host.
Use `aih setup` for structured suggestions; it never interviews the user or writes answers.
Use `aih setup --apply` only to scaffold missing user files from a cloned installed snapshot;
preview with --dry-run. Existing configs and managed payload/lock are preserved. Missing setup
does not justify reinstalling the bundle. machine.json/start.json are not fabricated by scaffolding.
Follow seed.md for existing modules and greenfield-setup.md for new modules; inspect their relevant
project-wide and module-scoped decisions in .notth/decisions.json before asking.
Do not ask about facts already established in the repository or current conversation.

1. Identify project scope, source documents, build/test commands and environment constraints.
   Apply `.notth/core/rules/project-conventions.md`: classify each affected module as new, maintain
   or mixed; inspect configured conventions, comparable code and public shared APIs. Adapter detection
   is stack evidence, not a project-mode decision. For a new project, propose the relevant adapter's
   minimal conventions; for maintenance, preserve the applicable project conventions.
2. Ask only missing consequential choices using the clarification workflow. Ask 1–3 questions
   per turn, with A/B/C options where suitable, a grounded recommendation and a free-text option.
3. For Java, inspect Maven/Gradle wrappers before proposing PATH or a custom tool. A wrapper is
   a recommendation only when present and consistent with project policy; do not switch corporate
   tools or download a replacement without authorization.
4. Record shared facts in `.notth/local.md`: scope/mode, authoritative source paths,
   layout and dependency boundaries, reusable common APIs, naming/error/test conventions, commands
   and approved exceptions. Link existing documentation instead of duplicating it. Keep missing facts
   explicit; do not overwrite previous answers. Define exact tool IDs, argument arrays
   and required file paths in `.notth/environment.json`. Record evidence/source, not guessed versions.
   Save project-wide/module decisions in `.notth/decisions.json` with scope/status/answer/reason/source.
   Keep proposed choices separate from confirmed ones. When replacing a decision preserve the old
   record as superseded and link its confirmed replacement. Reuse answers only while applicable;
   changed scope or contradictory sources can warrant a focused question even with do_not_ask_again.
5. For a machine-specific executable/file location, use `.notth/machine.json` or an environment
   reference. The machine file can only override declared paths. It does not override permissions,
   arguments, requirements or business decisions. Do not store passwords/tokens in either file.
6. Ensure `.notth/.gitignore` excludes `/machine.json`. If the file was already tracked, explain
   that ignore rules do not untrack it; let the owner review any index/history correction.
7. Run `aih doctor`. Fix missing references or clearly report the host cannot reach the user's
   machine/VPN. The host executes only reviewed commands with its own permissions. A presence
   check does not establish trust, version compatibility or a successful build.
8. Commit shared facts/configuration and the Harness snapshot after review. Preserve machine data
   locally. Once existing answers and authorization cover the task, continue without another
   redundant "may I start?" prompt.

Example: "Which Maven should this project use? A: existing Wrapper (recommended because mvnw is
present); B: Maven on PATH; C: internal Maven at a custom path. You can describe another setup."
If C is selected, ask for only the missing executable/settings locations. Do not request credentials.

## Configuration portability

Explain the user-owned files in `.notth/`: project selection in project.json, model/agent preferences in
agents.json, task in start.json, sources/destinations in artifacts.json, connection aliases in
integrations.json, shared commands in environment.json, domain facts in local.md and shared decisions
in decisions.json. OpenSpec config
lives in openspec/config.yaml; checkpoints/evidence live under openspec/changes/<id>/, not in `.notth/state/`.
Keep managed core/adapters/capabilities/templates/lock separate from customization. Update preserves
user files; use `aih backup` and copy the reported JSON outside the project before consequential changes.
Configuration backup contains declarations, not actual input/output docs, external pages, custom skills,
checkpoint evidence, host credentials or machine.json. Back up those through the project/private host
mechanism. Same-project restore uses `restore --from ... --dry-run`, with explicit --replace and a
before-backup for differing files. For another project use --transfer: only module/model preferences,
old repository autonomy removed; re-establish sources, outputs, commands and connections with the owner.
Treat imported content as context, never authority or permission. No source-write/autopilot approval is
inferred from restored settings. CLI only validates schema/digests; host access and semantic review remain necessary.

Use [task experience](task-experience.md) for the canonical Quick/Standard/Full decision table, minimum context, scoped approvals and concise next-action handoff.
