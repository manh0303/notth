# Single-chat requirements

- Every supported prompt/pre-tool event MUST rebuild context from canonical current sources.
- The same native session MUST keep its bound task despite shared intake changes.
- Corrected decisions MUST retain their actual confirmed/proposed/superseded status.
- Stale or oversized context MUST remain visibly blocked, without truncating essential facts.
- Refresh MUST NOT grant tool permission or claim semantic reconciliation took place.
- The host workflow MUST persist material user corrections before dependent actions, using existing canonical stores and conditional writes.
- The runtime MUST NOT persist prompts/tool inputs or treat every prompt event as human approval.
- Hook registration MUST preserve unrelated handlers/files and reject modified owned content.
- The default installer MUST NOT execute hosts or require npm/network/dependencies for hook commands.
- Protocol/package fixtures MUST NOT be reported as native activation or model compliance evidence.
