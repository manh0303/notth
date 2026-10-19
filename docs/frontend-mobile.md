# Code React/Next.js và React Native

Adapter có rules/conventions và skills cho implementation, kiểm thử cùng các rủi ro chuyên biệt.
Không cần thêm bộ skills ngoài để bắt đầu. Chỉ cài module phù hợp; AI đọc một skill khi task cần nó.

## Init và bắt đầu

Trong repository ứng dụng đã tạo, chọn **một** lệnh theo stack:

```bash
# React web hoặc Next.js
aih init --adapters react-nextjs
# React Native hoặc Expo
aih init --adapters react-native
```

Sau đó chạy `aih check`, `aih setup --host codex` (đổi host theo công cụ thực tế), mở AI tool và giao:

> Đọc AGENTS.md và workflow project-setup. Khảo sát router, versions, common components, API client,
> form/state/navigation và test setup. Dự án này cần [tính năng]. Hỏi phần còn thiếu, đề xuất slice/MVP
> và kiến trúc phù hợp, sau đó implement theo conventions hiện có và báo cáo checks thực chạy.

Core đã có TDD/debug/review. Nếu cần thiết kế UX/Figma, thêm `--capabilities uiux` khi init mới.
Nếu cần khám phá ý tưởng/MVP/kiến trúc/kế hoạch, thêm `product,architecture,delivery`; không bắt task nhỏ
tạo đủ tài liệu. Dự án đã cài đổi `.notth/project.json` rồi review update, không re-init với lựa chọn khác.
Harness không tạo app/framework, cài libraries hoặc cấu hình Figma/native AI host.

## Chọn skill theo việc

| Việc | React/Next.js | React Native/Expo |
| --- | --- | --- |
| Route/screen, form, CRUD/search, API và state | `harness-react-nextjs-feature-delivery` | `harness-react-native-screen-delivery` |
| Test hành vi và luồng | `harness-react-nextjs-behavior-testing` | `harness-react-native-behavior-testing` |
| Rủi ro chuyên biệt | `harness-react-nextjs-accessible-ui`, `harness-react-nextjs-server-boundaries` khi có Next server | `harness-react-native-offline-sync`, `harness-react-native-device-permissions` khi cần |

`aih skills` liệt kê metadata; `aih skill <id>` đọc một body. AI có thể chọn skill qua description và
đọc `.agents/skills/<id>/SKILL.md`, không cần bạn gọi từng role. Xem [Skill matrix](skill-matrix.md).
Skill IDs dưới namespace react-nextjs cũng dùng cho React web; plain React không bị ép chuyển Next.js.

## Dự án mới và maintain

Với maintain, đọc feature tương tự trước: reuse UI public APIs, theme, form schema, client/query keys,
auth/state/router và test helpers. Không tạo thêm HTTP client, store, navigation container hay wrappers
khi common hiện tại đáp ứng. Với dự án mới, đề xuất cấu trúc feature và state/data boundaries vừa đủ;
so sánh các lựa chọn quan trọng trước khi chốt. Ports/adapters, factory hay global state cần vấn đề cụ thể,
không áp như checklist. Xem [Project conventions](project-conventions.md) và [Solution workflow](solution-workflow.md).

Web: xác định router/version; tách state UI/form/server, xử lý stale responses và pending mutations.
Next server phải validate/authorize mỗi operation, giữ credentials và private caches đúng boundary.
Mobile: xác định Expo/bare và platforms; giữ navigation/auth/account boundaries, keyboard/safe areas,
lifecycle và secure storage. Offline queue/permissions chỉ thêm khi yêu cầu thực tế cần chúng.

## Ví dụ đầu ra

- Web search: route dùng client/query/FormField hiện có; loading/empty/error/latest-result; tests gắn AC,
  keyboard/focus và build/browser evidence thực có. Không thêm Next.js vào React SPA.
- Mobile profile: screen dùng navigator/theme/client đã có; validation/save/expiry/back/account changes;
  JS/native/device matrix phân biệt Android và iOS, ghi rõ checks bị chặn.

Đây là output minh họa, không phải kết quả đã chạy. [Full-stack example](examples/fullstack-web.md) và
[React Native example](examples/react-native-app.md) liên kết skills vào luồng spec → code → review.

## Kiểm chứng và nguồn

Chạy lint/type/test/build theo scripts thực của ứng dụng. Browser checks phải có browser/server thật;
mocked component test không chứng minh SSR/authorization. Với native, JS tests không xác minh iOS/Android;
ghi simulator/device/build result riêng. `aih verify/eval` chỉ xuất checklist/dataset và không chạy chúng.
Không có trial ứng dụng/browser/native hoặc live-model benchmark trong nâng cấp Harness này.

Đối chiếu official docs theo version dự án (tham khảo ngày 2026-10-12):
- [React state structure](https://react.dev/learn/choosing-the-state-structure): tránh duplicate/derived state lưu dư.
- [Next.js testing](https://nextjs.org/docs/app/guides/testing): chọn đúng unit/component/E2E boundary;
  kiểm tra runner support cho async Server Components.
- [React Native testing](https://reactnative.dev/docs/testing-overview): tách JS component và native/device evidence.
- [React Navigation auth flow](https://reactnavigation.org/docs/auth-flow/): chỉ áp dụng khi app đang dùng
  React Navigation; giữ version-specific auth/back behavior, không mặc định cài router đó.

## End-user journeys

React/Next.js and React Native module 1.4.0 connect Core harness-end-user-testing to applicable
browser/device acceptance, existing runners and optional binary evidence.
[End-user guide](end-user-testing.md) distinguishes native devices from browser viewport emulation,
real/mocked dependencies and BLOCKED access; unit/build/API checks cannot replace required UI flows.
