# Tasks

- [x] Align Python declaration, metadata, filenames, marker and release identity.
- [x] Update current guides and record superseded decision, migration and impact.
- [x] Run npm test, validate, check:release, test:package and Python smoke.

## Validation (2026-10-18)

- `npm test`: 321 passed, zero failed.
- `npm run validate`: status ok, zero errors.
- `npm run check:release`: metadata/version consistency ok (distribution remains 0.17.0).
- `npm run test:package`: real npm tarball, global/local install and ownership smoke ok (406 files).
- `py -3 scripts/smoke-python.py`: notth artifact names, pip metadata, new marker, offline .venv install,
  check/update/reinstall preservation, missing Node and exact sdist wheel rebuild pass.
- `node --test tests/python-distribution.test.js`: new/legacy markers accepted only at existing constrained path;
  unrelated marker and unrelated overlap rejected.
- `git diff --check`: clean. Public PyPI notth lookup returned 404; this does not establish ownership.
- No live model behavior changes/evaluation required; registry publication and publisher setup not performed.

## External release work

- [ ] Owner configures PyPI project notth / Trusted Publisher and reviews the feature/release PRs.
- [ ] Publish and verify the immutable reviewed release through the existing workflow.
