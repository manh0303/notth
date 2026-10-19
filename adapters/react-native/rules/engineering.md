# React Native engineering depth

Check actual React Native/Expo versions, navigation and native build setup. Core owns test/debug/review.
Reuse existing screen/component/data boundaries. Define route params, deep-link/back behavior, state
ownership and stale async response/cancellation handling; do not update an unmounted/obsolete flow.
For lists use stable keys, bounded rendering and measured optimization; no mandatory FlashList,
Reanimated or state-library migration. Measure on relevant devices/build modes, not only a simulator.
Exercise keyboard avoidance, safe areas, long/localized text, font scaling, orientation and touch/
screen-reader interactions. Preserve focus and critical content behind overlays/system bars.
Cover permission denied/revoked, background/foreground, interrupted network and offline recovery when
affected. Mocked JS tests cannot prove OS permissions, native navigation or real-device performance.
Keep secrets out of bundles/logs. Use platform-appropriate secure storage only through approved project
patterns. Record iOS/Android coverage separately; lacking a device/toolchain means NOT_RUN/BLOCKED.
Optional external React Native guidance comes from .notth/integrations/engineering-sources.md;
inspect compatibility and dependencies before adopting advice, never auto-install a new native library.
