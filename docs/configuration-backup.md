# Lưu cấu hình, backup và chuyển dự án

Các lệnh dưới đây dùng `aih` khi đã cài global. Nếu dùng npx, thay `aih` bằng
`npx --yes @manhd_d/notth`. Với CLI cũ thiếu start/backup/restore, nâng CLI theo
[hướng dẫn cài đặt](getting-started.md) trước khi cập nhật snapshot project.

## Thông tin của bạn nằm ở đâu?

Ở **repo dự án áp dụng Harness**, phần cấu hình dùng chung nằm trong `.notth/`:

| File | Thông tin người dùng | Khi update |
| --- | --- | --- |
| `.notth/project.json` | Adapter/capability đã chọn | Giữ nguyên |
| `.notth/agents.json` | Agent → provider/model/reasoning, execution preferences | Giữ nguyên |
| `.notth/start.json` | Mục tiêu, task, ID change cần tiếp tục | Giữ nguyên |
| `.notth/artifacts.json` | Đường dẫn/link input, nơi ghi output, owner, revision, write policy | Giữ nguyên |
| `.notth/integrations.json` | Tên kết nối của host và phạm vi khai báo | Giữ nguyên |
| `.notth/environment.json` | Tool/lệnh test và tham chiếu biến môi trường | Giữ nguyên |
| `.notth/local.md` | Nghiệp vụ, convention và quyết định đã chốt | Giữ nguyên |
| `.notth/decisions.json` | Quyết định dùng chung: phạm vi, trạng thái, nguồn/lý do và lịch sử thay thế | Giữ nguyên; backup cùng dự án, không transfer |
| `openspec/config.yaml` | Cấu hình OpenSpec của dự án | Giữ nguyên |
| `.notth/machine.json` | Đường dẫn chỉ dùng trên máy này | Giữ nguyên, Git ignore; không vào backup cấu hình |
| `openspec/changes/<id>/` | Spec, tiến độ, context/checkpoint/history, capsules và evidence | Giữ nguyên; backup cùng repo |
| `.notth/sessions/` | Binding/receipt của native session, riêng workspace | Ignore; không nằm trong archive cấu hình, không transfer |

**Input/output thực tế nằm ở nơi `artifacts.json` chỉ định**, ví dụ `docs/requirements/`,
`docs/specs/`, Confluence hoặc Figma. Cấu hình lưu liên kết; không sao chép nội dung nguồn bên ngoài.
Các skill riêng và native config của AI tool cũng cần giữ cùng cơ chế backup phù hợp của bạn.

`.notth/core/`, `adapters/`, `capabilities/`, `templates/`, `integrations/` và `lock.json`
là snapshot do Harness quản lý. Không sửa các file này để tùy biến. Giữ toàn bộ repo trong Git
để rollback snapshot chính xác; bản backup cấu hình chỉ chứa các file được liệt kê bên dưới.
Không lưu API key/token/password trong cấu hình; host/secret manager quản lý chúng riêng.

## Backup trước update hoặc cài lại

```bash
aih backup
```

CLI trả đường dẫn `.notth/backups/config-<timestamp>-<id>.json`. **Copy file này ra nơi riêng
ngoài repo/máy**, ví dụ ổ backup hoặc kho riêng của bạn; file ở máy hiện tại chưa bảo vệ khỏi mất máy.
Muốn tên dễ nhớ:

```bash
aih backup --output backups/harness-config.json
```

Đường dẫn CLI tính từ project root; không dùng đường dẫn tuyệt đối. CLI từ chối ghi đè backup đã có.
Archive JSON giữ nguyên bytes UTF-8 của tối đa 9 file dùng chung ở bảng (nếu hiện có), kèm schema version,
CLI version và SHA-256 từng file. Digest phát hiện sửa nhầm, không xác thực nguồn backup.
Review file trước khi chia sẻ; bản backup là plain text và không tự dò/xóa mọi secret bạn có thể đã ghi nhầm.
Folder mặc định `.notth/backups/` được Git ignore; backup ở đường dẫn khác do bạn quản lý ignore.

**Không có trong archive:** machine.json, sessions/, biến môi trường/credentials, host login/native settings,
snapshot/lock, custom skills, code, nội dung docs/UI bên ngoài, OpenSpec changes/checkpoints/history/evidence.
Muốn phục hồi toàn bộ công việc, backup **repo + các nguồn/tài khoản ngoài repo** bằng cơ chế của bạn.

Update thông thường bảo toàn file dùng chung; không cần restore mỗi lần:

```bash
aih backup
aih update --dry-run
aih update
aih check
```

Trước đó hãy nâng CLI global lên phiên bản đã review nếu cần. CLI không tải bản mới khi chạy update.

## Phục hồi cùng dự án

Copy archive vào project root thành `harness-config.json`, rồi xem trước:

```bash
aih restore --from harness-config.json --dry-run
aih restore --from harness-config.json
```

File giống hệt được giữ nguyên, file thiếu được tạo. File khác nội dung **không bị ghi đè** nếu chưa
chọn `--replace`. Nếu muốn khôi phục bản cũ thay cho cấu hình hiện tại:

```bash
aih restore --from harness-config.json --dry-run --replace
aih restore --from harness-config.json --replace
```

Trước thay file, CLI tự tạo archive cấu hình hiện tại trong `.notth/backups/`; kết quả trả đường dẫn.
Không xóa file người dùng không có trong archive. Validation/schema/digest/path/conflict được kiểm tra
trước ghi; lỗi ghi thông thường rollback. Gián đoạn tiến trình/mất điện không phải transaction nhiều
file an toàn tuyệt đối: kiểm tra trạng thái và phục hồi từ backup/Git trước khi tiếp tục.

Với repo chưa có snapshot, **restore trước `init`** để bộ cài dùng đúng module và model đã lưu:

```bash
aih restore --from harness-config.json
aih init
aih check
aih doctor
aih start
```

Với repo đã cài, dùng `update --dry-run`, `update`, `check` sau restore nếu selection đổi.
Restore không sửa snapshot hỏng; phục hồi snapshot qua Git hoặc cài bundle đã review vào repo sạch.
Nếu goal đã lưu là resume, phục hồi OpenSpec changes/evidence trước khi chạy start/resume.
Schema archive/config chưa được hỗ trợ bị từ chối; không tự đổi schema hay hạ phiên bản. OpenSpec
config được giữ dạng text; correctness thuộc upstream OpenSpec validator.

## Mang sang dự án khác

Copy archive vào repo mới, dùng chế độ transfer:

```bash
aih restore --from harness-config.json --transfer --dry-run
aih restore --from harness-config.json --transfer
aih init
aih start
```

Transfer mang **project.json + agents.json**: adapter/capability và model/reasoning/execution preferences.
Quyết định dùng chung trong decisions.json thuộc dự án cũ và không được mang theo.
Khai báo autonomy và role extensions gắn repo cũ bị loại bỏ. Task, domain facts, nguồn input/output, connection aliases,
commands, OpenSpec config và state không được chuyển. `start` giúp khai báo lại theo dự án mới.
Nếu repo mới đã có cấu hình khác, review conflict và chỉ dùng --replace khi muốn thay chúng.
Model đã khai báo vẫn cần host hỗ trợ; restore không đăng nhập, cấp quyền hoặc gọi API/provider.
Muốn dùng lại nguồn tài liệu cũ, khai báo rõ nguồn/revision/quyền truy cập tại dự án mới sau review.

## Session cache

knowledge.json is a reproducible project-owned cache omitted from config archives; full repo backup
retains it. Reconcile with /harness-start after restore. Extensions/custom host files need repo backup;
transfer omits old repository extensions as well as autonomy. [Session onboarding](session-onboarding.md).

[Persistent input documents: originals, Markdown and recovery](document-sources.md).
