# Adaptive Core memory and host contract

## Why
Project memory already exists but new hosts must assemble separate context/source/checkpoint contracts.
Provide one derived access layer without copying authoritative content into a second store.

## What changes
Read-only bounded memory retrieval and host-neutral handoff over existing canonical artifacts.
No provider execution, approval changes, data migration or release. PR 1 of 3; base main c378465.
