# Persistent document sources

## Why
Input attachments and converted text must remain usable after chat loss or Harness reinstallation.
Existing artifacts.json records locations/ownership; configuration backup deliberately omits content.

## What changes
Add local source import/index with original bytes, versioned Markdown and hash provenance. Route Core
intake/resume through this store, with host conversion for binary formats and explicit review limits.
User authorized implementation in the current session. No publish, automatic merge, external uploads,
converter dependencies, source-as-approved-spec shortcut or change to config backup scope.
