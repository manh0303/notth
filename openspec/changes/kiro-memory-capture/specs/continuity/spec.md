# Kiro capture boundaries

### Requirement: Capture without user memory commands
The default Kiro bridge MUST request task persistence at PromptSubmit and source persistence at
PostToolUse for MCP results. The host MUST preserve authorized relevant input before dependent work
using existing canonical storage, verify actual files and report denied/unavailable writes honestly.

#### Scenario: Jira task with a Confluence input
WHEN the user gives a project task and its MCP read returns a relevant authorized source
THEN the agent saves task intent and the source snapshot with observed provenance before relying
on it, links that source into the task, and saves meaningful progress without user memory commands.

#### Scenario: Unsupported storage or unchanged results
WHEN writes are denied, retrieved scope is partial, or a capture is already preserved
THEN the agent records only available authorized content, reports actual blockers and limitations,
and avoids duplicate imports, fabricated success, unnecessary remote calls or repeated side effects.

### Requirement: Compatible managed bridge upgrade
Updates MUST retain existing user task/source files and preserve drift and dry-run protections.

#### Scenario: Existing Kiro bridge
WHEN an unmodified SessionStart-only managed bridge is updated with the reviewed CLI
THEN the new capture prompts are added without selecting Kiro again or enabling command hooks,
and unrelated user hooks, source bytes and task notes remain unchanged.
