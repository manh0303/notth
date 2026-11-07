# Host continuity

## Requirements

### Missing CLI
Given the installed CLI is unavailable, the agent SHALL mark CLI operations NOT_RUN, use safe host file fallback if available, and continue independent authorized work.

### External integration
Given an alias exists but its tool is absent from host inventory, the agent SHALL mark that source BLOCKED and continue unrelated work; configuration does not prove access.

### Quick work
The agent SHALL select proportional checks and retain applicable safety and authorization boundaries.
