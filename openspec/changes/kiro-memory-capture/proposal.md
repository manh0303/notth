# Kiro task and source capture

The owner reports that project work is not saved during real Kiro use. The existing default
bridge runs only at SessionStart; optional command hooks recover existing canonical files but
never extract new task/source state. Add default agent capture prompts at request and MCP-result
boundaries, using existing source intake, task notes, context and checkpoints. Do not introduce
another memory store, remote writer, dependency or claim of deterministic semantic capture.
