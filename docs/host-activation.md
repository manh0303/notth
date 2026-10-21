# Kích hoạt ghi nhớ theo host

NOTTH phân biệt **đã cấu hình → đã quan sát sự kiện trong phiên → đã kiểm tra file được lưu**.
Không coi cài thành công, AI nói đã đọc rules hoặc một biên nhận hook là bằng chứng đã lưu task.

## Bật một lần

Dùng CLI/bundle mới đã review trong project:

```bash
aih update --host codex --session-hooks --dry-run
aih update --host codex --session-hooks
```

Thay `codex` bằng host đang dùng; cài mới dùng `init`. Với ZIP offline, thay `aih` bằng
`node "D:\\notth-reviewed\\bin\\aih.js"`; không cần npm. Sau đó reload host và review/trust hooks
nếu host yêu cầu. Plain init/update chỉ cài instructions, không tự bật command hooks.
CLI cũ hoặc ZIP 0.19.0 cũ không tự có thay đổi chưa phát hành. Không bỏ qua host permissions.

AI tự kiểm tra activation, lưu task/nguồn và tiến độ theo workflow đã cài; người dùng không chạy
lệnh bộ nhớ cho từng task. Việc bật hook không cấp quyền tải nguồn hoặc sửa dữ liệu bên ngoài.

| Host | Cấu hình project khi bật | Cách nhắc lưu |
| --- | --- | --- |
| Codex | `.codex/hooks.json` | Context ở đầu phiên, mỗi prompt, trước/sau tool |
| Claude Code | `.claude/settings.local.json` | Context ở đầu phiên, mỗi prompt, trước/sau tool |
| Kiro IDE 1.x / CLI V3 | `.kiro/hooks/notth-continuity.json` và bridge agent | Context theo sự kiện; bridge agent yêu cầu lưu task/MCP |
| Cursor Agent | `.cursor/hooks.json` | Context ở sessionStart và postToolUse; instructions cho prompt/pre-tool |
| Gemini CLI | `.gemini/settings.json` | Context ở SessionStart, BeforeAgent và AfterTool |
| Copilot CLI/cloud | `.github/hooks/notth-continuity.json` | Context ở sessionStart/postToolUse; prompt hook command không chèn context |
| OpenCode v1 plugin API | `.opencode/plugins/notth-continuity.js` | System context và phần bổ sung sau kết quả tool; không cần SDK dependency |
| Windsurf/Cascade | `.windsurf/hooks.json`, hoặc `.devin/hooks.json` đã có hooks | Quan sát sự kiện; lưu theo AGENTS/workflow. Không khẳng định stdout là context AI |

Phạm vi API/client/version quan trọng: IDE khác của Copilot và OpenCode API khác không được suy ra
là tương thích. Copilot cloud cần cấu hình trên default branch; Cursor cloud có thể chưa chạy hook
ở lượt read-only. Global settings/trust có thể chặn hook của project. Native trials vẫn NOT_RUN ở đây.
Windsurf có biên nhận vẫn báo enforcement ở mức instructions; không quảng cáo bảo đảm native capture.

## AI kiểm tra điều gì

`aih activation --host <host> --session <native-id>` là diagnostic read-only do host tự gọi.
`aih check`/`aih doctor` nhận cùng hai tham số khi cần kiểm tra activation cùng installation.
Không dùng session ID giả, PID, task của phiên khác hoặc quét receipt cũ để chọn phiên.

- `not-configured` / `configuration-blocked`: thiếu handler, disabled, modified hoặc schema không hợp lệ.
- `session-required`: đã có registration nhưng chưa biết ID native hiện tại.
- `unverified`: chưa có đủ prompt/pre-tool/post-tool receipts mới trong cùng phiên/workspace/bundle.
- `observed-local`: có metadata phù hợp trong 15 phút, các event tool được đăng ký sau prompt gần nhất. Cursor chỉ cần prompt/post-tool; không cài permission preToolUse. Chưa chứng minh
  host thật gọi hook hoặc AI lưu đúng nội dung; fixtures/manual calls cũng tạo được receipt.

Diagnostic không lưu raw prompt, tool arguments, tool result hay transcript. Hook chỉ đọc payload
có giới hạn 8 MiB, không đọc transcript_path. Receipt prompt/pre/post được ghi đè theo event;
nguồn được giữ theo chính sách source-intake, không tự dump toàn bộ MCP response vào nhật ký.

Thiếu activation không đồng nghĩa thiếu nơi lưu. AI vẫn thực hiện workflow với file/CLI tools có sẵn,
báo giới hạn cụ thể, không báo đã bảo đảm tự động. Sau khi ghi, phải đọc lại task/source/checkpoint.
Muốn thử native: [protocol](../evals/session-continuity.md), gồm task Jira, Confluence MCP, ngắt/tiếp tục,
đổi task, denied writes và disabled hooks; lưu bằng chứng thực tế riêng với kết quả test offline.

## Update và rollback

Opt-in settings được merge, backup trước ghi và không nằm trong managed lock. Thay đổi handlers do
người dùng chặn bật lại; `update --session-hooks` mới thêm sự kiện, update thường không tự thêm.
Reconcile setting khác biệt trước khi bật; giữ hooks/user settings không liên quan. Rollback matching
CLI/runtime/lock, bỏ đúng handler/plugin NOTTH mới rồi reload host; giữ task/source data.

## Nguồn chính thức

Đối chiếu 2026-10-21, không phải kết quả chạy host thật:

- [Codex hooks](https://developers.openai.com/codex/hooks/)
- [Claude Code hooks](https://code.claude.com/docs/en/hooks)
- [Kiro triggers](https://kiro.dev/docs/hooks/types/) và [actions](https://kiro.dev/docs/hooks/actions/)
- [Cursor hooks](https://cursor.com/docs/hooks)
- [Gemini hooks reference](https://geminicli.com/docs/hooks/reference/)
- [Copilot hooks reference](https://docs.github.com/en/copilot/reference/hooks-reference)
- [OpenCode plugins](https://opencode.ai/docs/plugins/)
- [Cascade hooks](https://docs.windsurf.com/windsurf/cascade/hooks)
