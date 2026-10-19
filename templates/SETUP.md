# Fresh project setup

Run the reviewed CLI in the new project root: `aih init --host <tool>`.
Choose only the AI tool you use. Select this project's adapters/capabilities; do not copy another project's lock or entire .notth.
First session: invoke harness-start, or read `.agents/skills/harness-start/SKILL.md`.

- Keep installed Core/adapters/templates/bridges managed by the installer; customize `.notth/local.md`.
- `.notth/templates/local.md` is a blank context example; populate only inspected project facts.
- Leave `.notth/start.json` absent until a real task is saved. An empty object is not a valid reset.
- Do not reuse another project's decisions, knowledge hashes or checkpoints.
- Configure this project's environment, sources/outputs and integrations; keep machine paths local.
- Transfer only approved reusable custom skills with supporting files. Never transfer company settings blindly.
- `aih backup` / `restore --transfer` carry allowlisted module/model preferences, not context/tasks/custom skills.
- Run `aih check`, then verify instruction/skill loading inside the actual host.

Kiro/Claude wrappers reference canonical `.agents/skills`. Copilot/Gemini use native entry bridges.
Codex/Cursor/OpenCode/Windsurf read AGENTS.md without a duplicate rules file. Native settings and
third-party commands remain project-owned. See the distribution's docs/tool-portability.md.
