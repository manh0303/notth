# Tra cứu Notth

Mới bắt đầu: [Cài đặt và giao task đầu tiên](getting-started.md).
Chỉ đọc phần phù hợp với công việc đang làm.

## Sử dụng

[Coding, TechSpec, kiến trúc và xuất tài liệu](engineering-quality.md): sáu nhóm năng lực, dùng theo task.

| Cần làm gì? | Đọc ở đâu? |
| --- | --- |
| Tra lệnh, chọn module, xử lý conflict | [CLI](cli.md) · [Adapters](adapters.md) |
| Kết nối công cụ AI | [Codex, Claude Code, Cursor, Copilot, Gemini CLI, Kiro, OpenCode, Windsurf](tool-setup/README.md) |
| Task/status, knowledge và test có lưu tiến độ | [Reusable workflows](reusable-workflows.md) |
| Đổi tool hoặc chuyển sang dự án mới | [Tool portability](tool-portability.md) |
| Chọn model và cách chạy agent | [Agent configuration](agent-configuration.md) |
| Khai báo build/test, Maven/JDK riêng | [Project configuration](project-configuration.md) |
| Áp dụng coding conventions | [Project conventions](project-conventions.md) |
| Phân tích ý tưởng và tài liệu yêu cầu | [Documentation workflows](documentation-workflows.md) · [Confluence](../integrations/confluence/README.md) |
| Đi từ yêu cầu đến vận hành | [Full SDLC](end-to-end-workflow.md) · [BA/PO/SA/PM](solution-workflow.md) |
| Spec trước code / review | [Change readiness](change-readiness.md) · [OpenSpec](openspec.md) |
| Tra skill và bàn giao agent | [Skill matrix](skill-matrix.md) · [Agent handoffs](agent-handoffs.md) |
| Thiết kế UI, giảm rập khuôn, dùng Stitch/Pro Max tùy chọn | [UI design](ui-design.md) |
| Kiểm tra code và đánh giá kết quả AI | [Verification](verification.md) · [Behavioral evaluations](../evals/README.md) |

[Code React/Next.js & React Native/Expo](frontend-mobile.md) · [Monetization capability](../capabilities/monetization/README.md).

[Input/output, storage & integrations](artifact-contract.md).

## Ví dụ

| Loại project | Hướng dẫn |
| --- | --- |
| Spring Boot API | [Backend](examples/spring-boot-api.md) |
| Spring + Next.js | [Full-stack](examples/fullstack-web.md) |
| React Native | [Mobile](examples/react-native-app.md) |
| Python AI/RAG | [AI service](examples/ai-rag-service.md) |
| Astro tool nhỏ | [Micro-tools](examples/astro-micro-tools.md) · [Adapter](../adapters/astro/README.md) |
| Website có quảng cáo | [Astro + AdSense](examples/astro-adsense-microtools.md) · [Monetization](monetization.md) |
| Bắt đầu từ ý tưởng | [Idea-driven](examples/idea-driven-project.md) |
| Đã có tài liệu yêu cầu | [Document-driven](examples/document-driven-project.md) |

## Đóng góp và phát hành

[Contributing](../CONTRIBUTING.md) · [Bảo trì & ma trận ảnh hưởng](harness-maintenance.md) · [Kiến trúc](architecture.md) · [Thêm adapter](adapters.md).
[Release policy](release-policy.md) · [Phát hành npm](npm-release.md) · [Versioning & migration](versioning.md) · [Changelog](../CHANGELOG.md).

See [Adaptive verification and TechSpec](adaptive-verification.md) for read-only discovery, evidence reports and selective technical documentation.

[Continuous development & living documentation](continuous-development.md): successive features, bugfixes, baseline reconciliation and selective maintenance.

- [Agent-first delivery and 0.12 migration](agent-first.md): proportional roles, selective Product profiles, retired recipes, brownfield/Claude/Maven and checkpoint recovery.

- [Start theo input hiện có](start.md)
- [Lưu cấu hình, backup, cài lại và chuyển dự án](configuration-backup.md)

- [Kiểm thử như người dùng thật: browser/device/CLI/API](end-user-testing.md)

- [Session onboarding, seed, prerequisites và role extensions](session-onboarding.md)

- [pip/offline installation](python-installation.md)
- [Workflow contracts and approval records](workflow-contract.md)
- [Opt-in conformance runner](conformance-runner.md)

[Short task prompts and human-readable orientation](simple-use.md): chat is the primary path across hosts; terminal interview remains optional and backward compatible.

[Persistent input documents: originals, Markdown and recovery](document-sources.md).

[Adaptive Core: canonical memory and host-neutral handoff](adaptive-core.md).
