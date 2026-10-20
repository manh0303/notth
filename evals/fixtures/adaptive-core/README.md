# Disposable adaptive evaluation fixture

A tiny ES-module library with a deterministic lost-update defect. Node 22+, no dependencies or network.
Read docs/requirements.md and docs/architecture.md before changes. `node --test counter.test.js` starts
with one passing and one failing test (observed 1, expected 100). Preserve the asynchronous increment API.
Never run the evaluation against production data. This intentionally failing fixture is excluded from
NOTTH's root test glob and is not consumer application scaffolding.
