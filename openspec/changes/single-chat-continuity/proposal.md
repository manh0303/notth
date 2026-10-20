# Continuity within one chat

## Why
A long continuous chat can lose constraints before the session ends. Startup-only recovery does not
refresh corrected decisions or source freshness between tool calls.

## What changes
Rebuild current canonical context on every prompt and before native tool invocation for opted-in
Codex/Claude hooks. Add Kiro IDE 1.x / CLI V3 command hooks using the documented v1 schema.
Require agent reconciliation of material corrections before dependent work, without user memory chores.
Keep native activation and semantic behavior explicitly unverified until live trials.
