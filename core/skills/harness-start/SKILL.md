---
name: harness-start
description: Start or resume Harness onboarding inside the current AI session; inspect existing context and ask only missing consequential questions.
---

## Input
The current user request, AGENTS.md, project-owned .harness/ configuration and available host tools.
The native Kiro wrapper exposes this skill as /harness-start. Other hosts can load this canonical skill.

## Procedure
First apply `.harness/core/workflows/task-experience.md`: select depth by impact. For a small task, do only task-relevant setup below; do not turn all steps into a mandatory interview.
1. Read AGENTS.md and the installed project-setup workflow. Identify the installed CLI invocation
   already used by the user (npm/pip aih, npx, or offline node/aih.cmd); reuse it without downloading
   or requiring another installation. Run `start --compact --host <current-host>` for a read-only orientation in any host, or read the same local configs
   if shell access is unavailable. This returns a plan, not a second interview in a terminal.
   If shared configuration is missing in a cloned snapshot, use `setup --apply --dry-run`, then
   `setup --apply` with that same CLI. This scaffolds missing user files without changing the bundle.
   Without shell access, read installed templates and create missing configs with host file tools;
   preserve existing bytes, and report CLI integrity checks NOT_RUN. Do not reinstall or invent paths.
2. Read local.md frontmatter first, then prose and start.json if present. Run `seed --check` to assess
   freshness. On first use run `seed` for the source map. Inspect only needed sources and relevant
   scoped AGENTS/conventions; cached summaries never replace applicable instructions.
   Read .harness/decisions.json if present before asking. Reuse only confirmed project/applicable
   module choices while their scope and sources remain valid; proposed/superseded answers do not
   establish current behavior. A do_not_ask_again flag never prevents reconsidering changed evidence.
3. Infer goal from the user's actual request. A bug report means change; do not ask them to choose
   the category again. Reuse declared stack, accepted deviations, sources, outputs and host settings.
   Ask at most 1–3 missing consequential questions at a time, with concrete options and a grounded
   recommendation. Never require Maven for a non-Java skill or docs destinations for a tiny bugfix.
4. During initial setup inspect build manifests, relevant conventions and authorized docs. Populate
   local.md using the installed templates/local.md schema: stack/build values, sources inspected and
   already approved deviations. Preserve all existing prose and decisions; migrate legacy prose
   additively, without treating inferred exceptions as approved. Keep the summary compact and linked.
   Declare shared tools/files/commands in environment.json; ignored machine.json overrides only
   declared tool executables and file paths. For Maven settings use files.maven-settings.path.
   For existing modules follow .harness/core/workflows/seed.md; for new work follow
   .harness/core/workflows/greenfield-setup.md. Classify mode per affected module. Save observations
   with sources, mark inferences/unknowns explicitly, and distinguish user-confirmed choices. Do not
   force technology/CI/MCP interviews before they are relevant to the task.
5. Only when this task needs external sources/actions, inspect host MCP availability. For Kiro, `sync-integrations --host kiro --dry-run` can import server
   aliases from local host config. Review discoveries and save declarations with the same command
   without --dry-run. Inspect actual tools in the host; imported config does not establish access.
6. Save a known task using `start --goal <idea|docs|change|resume> --task <text>` and --change for
   an existing proposal (change) or checkpoint (resume). Use structured tool arguments/proper shell quoting for user text.
   Save accepted choices incrementally in their existing configs; no duplicate onboarding database.
   Project/module decisions go in .harness/decisions.json; change-specific answers stay under the
   OpenSpec change. Preserve superseded history and its replacement ID. Save after each meaningful
   answer so interruption resumes from partial context; a completed hash cache is not required to
   preserve a useful observation or confirmed answer.
   Run doctor for initial environment setup, or doctor --skill <name> for the selected skill. Resolve only relevant missing fields,
   then `seed --record` after reconciling the inspected sources. If interrupted, preserve partial facts;
   do not mark uninspected sources as complete. The next invocation continues from saved facts.
7. Show a short summary: task, stack/build, approved exceptions, sources, blockers and next action.
   Continue the user's authorized task through solution-framing or continuous-development, loading
   only relevant roles/skills. For spec proposals created by an external OpenSpec flow, run
   `change-sidecars <id>` to add missing decisions/evidence/impact sidecars without overwriting.

## Output
Shared context in local.md/environment.json, host connection declarations in integrations.json,
task in start.json, ignored machine paths if needed and reconciled hashes in knowledge.json.
An actionable next step or concrete blockers, with no repeated questionnaire for known facts.

## Constraints
The host understands the project and asks questions; CLI validates and records local data. No model
API key, provider call, automatic delegation, secret copying or upstream OpenSpec modification.
Do not execute a saved task solely on SessionStart. Host/user authorization and core security apply.
Never claim token savings, live hook loading or model compliance without actual measurements.

## Daily orientation
Use `aih status` and `aih changes` for local task/change declarations. Select an existing proposal with `start --goal change --change <id> --task <text>`; resume needs its actual checkpoint. `start --clear` backs up and clears only saved intake. Optional project knowledge follows `.harness/core/workflows/project-knowledge.md`; read relevant pointers rather than every source.

Use compactStart entry_action only to enter the skill, not as a next step once already inside it.
For a saved task without a checkpoint, reconcile files/task notes directly; do not require --goal resume.
When multiple changes are plausible and none is selected, ask which one rather than choosing by name order.

## Preserved input documents
When files, URLs, MCP/API inputs or prior source snapshots are relevant, follow
`.harness/core/workflows/source-intake.md` before deriving requirements. Reuse the source index,
preserve originals and register conversions; pending extraction and approval are separate states.
