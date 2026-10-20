# Chọn AI tool cho Notth

**Notth hỗ trợ nhiều loại tool; người dùng chọn một tool đang dùng.** Dùng CLI đã review chứa tính năng này;
feature PR chưa đồng nghĩa npm đã phát hành.

```bash
aih init --host kiro
```

Project đã cài: commit hiện trạng rồi chạy:

```bash
aih backup
aih update --host kiro --dry-run
aih update --host kiro
aih check
```

Thay `kiro` bằng `claude-code`, `codex`, `cursor`, `copilot`, `gemini-cli`, `opencode` hoặc `windsurf`.
Mỗi lệnh chỉ nhận một host. Cài mới chỉ sinh bridge của tool đã chọn. Khi đổi tool sau này,
dùng `update --host <tool>`; bridge đã quản lý được giữ để không tự xóa cấu hình cũ. Nếu không có global `aih`, dùng
`npx --yes @manhd_d/notth@<reviewed-version>` hoặc `node /path/to/notth/bin/aih.js` thay thế.

## Nguồn chung và bridge

| Tool | Rules/context | Skills / bridge Notth |
| --- | --- | --- |
| Kiro | `AGENTS.md` | `.kiro/skills/harness-*` trỏ `.agents/skills`; SessionStart agent hook |
| Claude Code | `CLAUDE.md` import `@AGENTS.md` | `.claude/skills/harness-*` trỏ `.agents/skills` |
| Codex | `AGENTS.md` | `.agents/skills` |
| Cursor | Root/scoped `AGENTS.md` | `.agents/skills`; không cần sinh thêm `.mdc` |
| Copilot | Managed block trong `.github/copilot-instructions.md` yêu cầu đọc `AGENTS.md` | `.agents/skills` ở client hỗ trợ; kiểm tra client thực tế |
| Gemini CLI | `GEMINI.md` import `@./AGENTS.md` | `.agents/skills` theo native discovery |
| OpenCode | `AGENTS.md` | Native `.agents/skills`; giữ commands/config riêng |
| Windsurf / Cascade | Root/scoped `AGENTS.md` | Đọc canonical skill theo đường dẫn khi cần; không giả định native discovery |

Claude Code hỗ trợ trực tiếp `AGENTS.md` từ v2.1.277 nhưng có điều kiện shadowing/settings;
import dùng cho tương thích. Cursor/Windsurf hiện hỗ trợ `AGENTS.md`, nên không cần thêm rules
chỉ để lặp nội dung. Copilot bridge là lời yêu cầu đọc file, không phải content import bắt buộc.
Nguồn chính thức và cách kiểm tra ở [host guides](tool-setup/README.md).

Không copy toàn bộ rules/skills vào prompt. Chỉ đọc entry point, context và skill liên quan.
Bridge không cấp MCP, model, quyền chạy lệnh hoặc khả năng multi-agent của tool khác.
Khi đổi host, giữ quyết định/task và xác minh model/provider/quyền trong host mới; agents.json cũ
không bị đổi tự động. Cài mới dùng default phù hợp host đã chọn.

## Di chuyển các thư mục đang có

- Giữ custom skills đầy đủ gồm `SKILL.md`, scripts, references, templates và metadata; Notth chỉ
  quản lý namespace `harness-*`. Không nhập skill công ty vào repository Notth công khai.
- Một file chỉ chứa `../../.agents/skills/<name>` không phải thư mục skill hợp lệ. Trên Windows,
  đó có thể là symlink bị chuyển thành text khi clone/ZIP. Kiểm tra target trước khi thay: dùng thư mục
  với `SKILL.md` wrapper hoặc bản copy đầy đủ, giữ bản gốc để đối chiếu; không tự xóa cả thư mục.
- Skills OpenSpec ở `.agents`, `.claude`, `.opencode` có thể khác nội dung do generator theo host.
  So sánh từng bản và xác định chủ sở hữu/version trước khi hợp nhất. Commands `/opsx:*` hay
  `/opsx-*` vẫn là giao diện riêng theo tool; Notth không di chuyển hay cập nhật chúng.
- Giữ nguyên `.claude/settings.json`, `.kiro/steering`, MCP, plugin marketplace và native commands.
  Các cấu hình nội bộ không phải template dùng chung cho dự án mới.
- Bridge Kiro dùng action `agent`, đường dẫn project-relative; không gọi PowerShell/git,
  không chứa ổ đĩa máy. Hook cũ do project sở hữu cần được review riêng trước khi tắt/sửa;
  nếu cùng tên file managed mà khác nội dung, installer báo conflict trước khi ghi.
- Codex/Claude có command hooks tùy chọn qua `--session-hooks`; host gọi runtime Node vendored.
  Không bật cho Kiro. Xem [session runtime](session-runtime.md) về giới hạn và rollback.

## Sang project mới

Khởi tạo snapshot bằng `aih init --host <tool>` thay vì copy toàn bộ `.notth` từ project cũ.
Khi muốn mang lựa chọn module/model sang, xem [backup transfer](configuration-backup.md): restore
với `--transfer` trước init. Transfer không sao chép custom skills, task hay project facts.

| Dữ liệu | Cách xử lý |
| --- | --- |
| Core/adapters/templates/lock | Để installer sinh snapshot đúng selection và hash |
| `local.md` | Khảo sát project mới, điền facts/commands/nguồn mới qua harness-start |
| `start.json` | Project mới để vắng file; tạo khi có task thật. `{}` không hợp lệ |
| `decisions.json`, `knowledge.json`, checkpoints | Không mang quyết định/cache/trạng thái project cũ sang |
| `environment.json`, `machine.json` | Kiểm tra tool/đường dẫn mới; machine paths là dữ liệu riêng máy |
| `artifacts.json`, `integrations.json` | Khai báo nguồn/output/kết nối thực tế; không copy credentials |
| Custom skills | Chỉ mang skill được phép tái sử dụng, đủ supporting files và không gắn domain cũ |

Snapshot cài `.notth/templates/SETUP.md` và `.notth/templates/local.md` để tham khảo offline.
Không chỉnh lock bằng tay hoặc tạo start.json giả để biểu thị trạng thái rỗng.

## Kiểm chứng

Chạy `aih check` và mở session mới. Gọi harness-start nếu host expose, hoặc gửi:

> Đọc AGENTS.md và .agents/skills/harness-start/SKILL.md. Báo adapter/capability và task hiện tại
> từ file thực tế; giữ quyết định đã xác nhận và chỉ hỏi phần thiếu.

So sánh với project.json/start.json thực tế. Claude: `/context`; Gemini: `/memory reload`, `/memory show`;
Kiro: Agent Steering & Skills. Tests/package smoke kiểm tra file, ownership, drift, rollback và
đường đọc; chưa chứng minh native discovery, hook activation hay model tuân thủ trên host thật.

[Short task prompts and human-readable orientation](simple-use.md): chat is the primary path across hosts; terminal interview remains optional and backward compatible.
