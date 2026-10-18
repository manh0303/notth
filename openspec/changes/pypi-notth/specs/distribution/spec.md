# Python distribution

## MODIFIED Requirements

### Requirement: Python package identity
Python distribution metadata, artifact filenames and the current release destination SHALL use `notth`.
The import SHALL remain `ai_harness`, the executable `aih`, and the version derived from package.json.

#### Scenario: Offline installation and rebuild
- WHEN a reviewed notth wheel is installed into a project .venv without registry access
- THEN pip metadata identifies notth, aih init/check/update work with existing Node 22+, user notes survive reinstall,
  and its sdist rebuilds the identical wheel.

#### Scenario: Earlier source build marker
- WHEN the shared CLI reads an earlier manhd-ai-harness bundle under the allowed .venv site-packages path
- THEN the legacy marker remains accepted and unrelated source/target overlaps remain rejected.
