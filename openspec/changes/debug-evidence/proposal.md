# Portable debug evidence packs

Daily fixes currently repeat project-local conventions for reproducing API bugs and storing their
verification output. Add a Core skill named exactly `debug-evidence`, as requested, that packages
source-linked baseline/after-fix evidence using existing debugging, end-user testing and verification.
Keep small isolated fixes lightweight and keep project paths, runners, gateway and actor details out
of Core. Existing named skills retain their IDs.

Scope: skill/resources, proportional routing, optional portable environment policy referencing an
artifact output, exact-name distribution/bridge support, docs, eval scenarios and offline tests.
No new executor, runner dependency, model runtime, production data or fabricated completed sample.
