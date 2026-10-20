# Cấu hình từng project và từng máy

| File | Nội dung | Git |
| --- | --- | --- |
| `.notth/start.json` | Mục tiêu/task và ID change/proposal hoặc checkpoint khi có | Commit |
| `.notth/project.json` | Adapter/capability | Commit |
| `.notth/agents.json` | Provider/model/reasoning theo role, execution preferences và host mappings | Commit |
| `.notth/artifacts.json` | Input/output/storage, canonical ownership và source-write policy | Commit |
| `.notth/integrations.json` | Dynamic host connection aliases và scope; không chứa credentials | Commit |
| `.notth/local.md` | Nghiệp vụ, kiến trúc, nguồn và quyết định chung | Commit |
| `.notth/environment.json` | Công cụ, lệnh, file cần có | Commit |
| `.notth/machine.json` | Đường dẫn riêng của máy, tùy chọn | Ignore |
| `.notth/sessions/` | Binding/receipt của native session, gắn với workspace hiện tại | Ignore |

Init/update tạo environment rỗng nếu chưa có và thêm `/backups/`, `/machine.json` và `/sessions/` vào cuối
`.notth/.gitignore`. File đã được Git track vẫn được track: ignore không xóa khỏi index/history.
CLI không tạo file machine và không đọc nội dung Maven settings. Không ghi mật khẩu/token vào các
file Harness; credentials thuộc cơ chế quản lý riêng của công cụ.

[Agent configuration](agent-configuration.md) mô tả preset và cấu hình model. `aih setup --host codex`
chỉ đưa ra kế hoạch khai báo; update bảo toàn `agents.json`. Chọn host có thể bổ sung bridge quản lý; command hooks Codex/Claude
chỉ được merge khi bật `--session-hooks`, giữ các setting khác. [Chi tiết](session-runtime.md).

## Ví dụ Maven nội bộ

Cấu hình chung:

```json
{
  "schema_version": 1,
  "tools": {
    "maven": { "executable": "mvn", "required": true }
  },
  "files": {
    "maven-settings": { "path": "${PROJECT_MAVEN_SETTINGS}", "required": true }
  },
  "commands": {
    "test": { "tool": "maven", "args": ["-s", "${files.maven-settings}", "verify"] }
  }
}
```

Máy Windows của bạn có thể đặt `.notth/machine.json`:

```json
{
  "schema_version": 1,
  "tools": {
    "maven": { "executable": "D:\\tools\\apache-maven\\bin\\mvn.cmd" }
  },
  "files": {
    "maven-settings": { "path": "C:\\Users\\YourName\\.m2\\settings-company.xml" }
  }
}
```

Đặt biến môi trường trong terminal của AI host, ví dụ PowerShell:

```powershell
$env:PROJECT_MAVEN_SETTINGS = "C:\Users\YourName\.m2\settings-company.xml"
aih doctor
```

`doctor` báo trạng thái như `present`, `missing-env`, `missing` hoặc `platform-mismatch`; không in
đường dẫn/giá trị biến/arguments. Với công cụ bắt buộc bị thiếu, exit code là 1. PATH hints chung
không thay thế executable đã cấu hình. Thiếu công cụ `required: false` chỉ là chẩn đoán.

AI host đọc command và sử dụng cách quoting đúng terminal; ví dụ PowerShell dùng toán tử `&` cho
executable có khoảng trắng. Không nối arguments thành shell text một cách mù quáng. Harness không
tự chạy lệnh, đổi JAVA_HOME, sửa settings.xml hay tải dependency.

## Quy tắc cấu hình

- Schema 1 yêu cầu các map `tools`, `files`, `commands` (có thể rỗng); ID dùng lowercase-hyphen.
- Tool: `executable` và `required` tùy chọn, mặc định true. File: `path` và `required` tương tự.
- Command: `tool` phải trỏ tới tool đã khai báo, `args` là mảng string.
- Machine chỉ có `schema_version`, `tools`/`files` tùy chọn; chỉ override `executable`/`path` của
  ID đã có. Không đổi commands, required flags hay policy.
- Đường dẫn machine ưu tiên đường dẫn project; project ưu tiên gợi ý adapter. Không fallback khi
  đường dẫn được chọn không dùng được. Paths tương đối tính từ project root; executable không
  chứa separator được tìm trên PATH. Paths tuyệt đối phải phù hợp OS của host.
- `${ENV_NAME}` tham chiếu biến môi trường. Command args còn hỗ trợ `${files.<id>}` trỏ file đã
  khai báo: ưu tiên machine override, sau đó project path, rồi mở rộng biến môi trường trong path.
  Ví dụ `${files.maven-settings}` tránh lặp đường dẫn riêng máy. Tham chiếu thiếu/sai báo lỗi trong
  doctor; không mở rộng lồng file-reference. Không đọc .env, mở rộng `~` hay shell substitution.
  Đây là kiểm tra tham chiếu; host phải resolve cùng quy tắc khi thực thi, CLI không chạy lệnh.
- `files` dành cho file (settings, config), không phải thư mục JDK. Dùng biến JAVA_HOME của host
  hoặc khai báo executable Java trực tiếp. Doctor không xác nhận Java/Maven version.
- `aih check` kiểm tra snapshot; `aih doctor` kiểm tra thêm environment. Dự án cũ chưa có
  environment vẫn dùng được; không bắt buộc migrate chỉ để chạy check.

## Hỏi trước, lưu lại

Chạy `aih setup` rồi nhờ AI đọc workflow `project-setup`. Host đọc repo và câu trả lời cũ trước khi
hỏi 1–3 câu A/B/C có đề xuất dựa trên bằng chứng. Các gợi ý JSON của CLI có thể được bỏ qua nếu
local.md đã trả lời. Setup không phải wizard nhập liệu và không tự ghi lựa chọn.

## Input/output và integrations
Xem [Artifact contract](artifact-contract.md). `aih artifacts` báo khai báo; `aih setup` gợi ý hỏi
nơi lưu docs/UI nếu chưa biết. Các file này project-owned và được bảo toàn khi update; chúng không
kết nối MCP, cấp quyền hay chạy tool. Credentials và native host config nằm ngoài Git.

## Backup và dùng lại

Chạy `aih start` để lưu intake. File được bảo toàn khi update. Chạy `aih backup`, copy archive ngoài
repo; `aih restore --from <file> --dry-run` xem trước phục hồi. Dùng --transfer ở repo mới để chỉ
chuyển module/model, tránh nguồn/tiến độ cũ. [Hướng dẫn đầy đủ](configuration-backup.md) mô tả các
file được lưu, những gì không có trong backup, conflict/backup-before-replace và cách cài lại.

## Structured context and skill prerequisites

New local.md uses optional schema-1 YAML frontmatter; legacy prose stays valid and preserved.
See [session onboarding](session-onboarding.md) for sources, seed and doctor --skill requirements.
Maven settings remain files.maven-settings.path with a machine override, not tools.maven.settings.
