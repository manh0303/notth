# React / Next.js engineering depth

Read actual React/Next versions, routing mode, state libraries and existing components. Version-matched
official documentation wins over generic optimization advice. Core owns TDD/debug/review.

Keep state at its true owner; distinguish server data, navigation/URL state and transient UI state.
Do not copy derivable data into effects/state without a reason. Reuse component APIs; avoid boolean-prop
explosion, premature generic wrappers and global state for a local interaction.
For Next.js inspect server/client boundaries and serialization; never expose secrets in client bundles.
Authorize server mutations at the server, not only in hidden buttons. Establish data freshness, cache
scope/invalidation and user/tenant separation; do not assume cache defaults across Next.js versions.
Start independent async work together where safe, avoid sequential data waterfalls, and scope loading/
error boundaries. Keep mutation errors and optimistic rollback visible and accessible.
Measure the actual bottleneck before adding memoization, dynamic imports or virtualization. Check
bundle impact, repeated renders and request traces; compiler features change optimization trade-offs.
Use a single coherent design master; preserve stable keys, semantic controls, focus and keyboard
behavior. Test loading/empty/error/success, navigation/back/deep links and narrow/zoom/long text.
Read .notth/integrations/engineering-sources.md only for optional reviewed Vercel skill knowledge;
no deployment skill or new hosting/provider is selected. Record functional/performance/browser
evidence separately, including real/mocked dependency scope and NOT_RUN measurements.
