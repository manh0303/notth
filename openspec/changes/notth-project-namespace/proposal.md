# NOTTH project namespace

## Why
The owner requests removing the optional Beads integration, branding the generated project directory
as .notth instead of .harness, and removing the old AI Harness introduction from all primary READMEs.
Preserve source-linked context/checkpoints and safe upgrades for existing users.

## What changes
- New snapshots, CLI/config paths and active instructions consistently use .notth.
- Update preflights and migrates validated old snapshots, retaining original-byte rollback backup.
- New configuration archive kind is notth-user-config; verified legacy envelopes restore into .notth.
- Remove the optional external-backend guide, detection and runtime report behavior.
- Keep technical skill IDs, ownership markers and package release ownership compatible.

No model/server, remote coordination backend, dependency, publish or merge is added.
