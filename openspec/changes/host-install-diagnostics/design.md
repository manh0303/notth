# Design and impact

Render the existing doctor and activation report as opt-in human text. Retain JSON output, exit
codes, project ownership and session identity rules. Init/update human output includes registration
status and an explicit unverified live-host/persistence statement. Never infer host identity.

| Area | Status | Evidence or reason |
| --- | --- | --- |
| core | not-applicable | No core runtime or instructions change. |
| adapter | not-applicable | No stack-specific assets change. |
| capability-skill | not-applicable | No skill or capability change. |
| cli-config | done | cli/main.js and cli/presentation.js; default JSON and existing exit codes preserved. |
| workflow | not-applicable | No agent workflow changed. |
| documentation | done | README, CLI and host activation guidance. |
| verification | done | 394 offline tests, validate and package smoke pass; native clients remain NOT_RUN. |
| release-migration | done | Changelog; no managed payload or version change; rollback by reverting CLI release. |

Declaration to consumer: main option -> CLI presentation -> package includes cli/*.js -> installed
user invokes doctor -> tests/activation.test.js verifies eight selections -> README and host guide.
The opt-in hooks and host version compatibility remain unchanged.
