# NOTTH

Lệnh npm cần package đã phát hành có hỗ trợ host bạn chọn. Nếu gặp E404, dùng [source/offline](../getting-started.md#cài-từ-source-khi-registry-chưa-có-package).

[English](../../README.md) · **Tiếng Việt** · [简体中文](README.zh-CN.md) · [Español](README.es.md)

Agent workflows tái sử dụng cho phát triển phần mềm: **Requirements → Design → Code → Test → Review.**

Đưa ý tưởng, docs có sẵn hoặc change request cho AI coding tool. NOTTH giúp AI đọc project, làm rõ quyết định, triển khai scope đã chấp nhận và maintain spec/docs liên quan. Chỉ dùng roles và skills cần cho task.

Core dùng được với mọi project; stack adapter là tùy chọn.

Cần **Node.js 22+**. Chạy trong project root:

```bash
npx --yes @manhd_d/notth init --host codex
```

Chọn host: codex, claude-code, cursor, copilot, gemini-cli, kiro, opencode hoặc windsurf.
Session AI đầu tiên: gọi **harness-start** nếu host nhận diện; hoặc gửi:

> Đọc .agents/skills/harness-start/SKILL.md và thực hiện cho project này. Task: [yêu cầu].

AI khảo sát project, hỏi phần còn thiếu, lưu context rồi thực hiện task. Bạn review thay đổi và kết quả test.
Phiên sau giao task trực tiếp hoặc yêu cầu tiếp tục việc đã lưu; không cần chạy interview terminal.

Kiro có `/harness-start`; discovery tùy client. [Setup đa IDE](../tool-setup/README.md).

**pip/offline**: lệnh dưới cần package đã có trên PyPI; nếu chưa có, dùng wheel offline đã review:

```bash
python -m pip install notth
aih init --host codex
```

Cần thêm Python 3.9+, vẫn cần Node 22+; cùng CLI/assets, không gọi npm/npx.
Offline: `python -m pip install --no-index --no-deps /path/to/package.whl`.
[pip và cập nhật](../python-installation.md) · [Backup và chuyển dự án](../configuration-backup.md).
`npx` không tạo global aih; dùng `npx --yes @manhd_d/notth check` kiểm integrity.

| AI tool | Setup |
| --- | --- |
| **Codex** | [Hướng dẫn](../tool-setup/codex.md) |
| **Claude Code** | [Hướng dẫn](../tool-setup/claude-code.md) |
| **Cursor** | [Hướng dẫn](../tool-setup/cursor.md) |
| **GitHub Copilot** | [Hướng dẫn](../tool-setup/copilot.md) |
| **Gemini CLI** | [Hướng dẫn](../tool-setup/gemini-cli.md) |
| **Kiro** | [Hướng dẫn](../tool-setup/kiro.md) |
| **OpenCode** | [Hướng dẫn](../tool-setup/opencode.md) |
| **Windsurf** | [Hướng dẫn](../tool-setup/windsurf.md) |

[Docs & examples](../README.md) · [Getting started](../getting-started.md) · [Input/output](../artifact-contract.md) · [Agent configuration](../agent-configuration.md) · [Continuous development](../continuous-development.md) · [MIT](../../LICENSE)

Chọn tool hoặc chuyển project: [Hướng dẫn](../tool-portability.md).

## Dùng hằng ngày

Sau khi AI đã đọc điểm vào, chỉ cần nói “Sửa lỗi này”, “Thêm tính năng này” hoặc “Tiếp tục việc đã lưu”. AI chọn độ sâu Quick/Standard/Full theo ảnh hưởng; bạn không phải chọn role hay gate. Báo cáo phải có phần đã xong, blocker và bước tiếp theo.

[Bắt đầu, prompt ngắn và xử lý lỗi](../simple-use.md). Với source/release có hỗ trợ: `aih start --chat --format human` để định hướng trong chat, `aih status --format human` để xem tiến độ. JSON vẫn là mặc định. Các flag mới chưa được coi là đã phát hành chỉ vì có trên main.

[Persistent input documents: originals, Markdown and recovery](../document-sources.md).
