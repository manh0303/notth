# Context tự động giữa các session

Bạn chỉ mô tả task hoặc nói “tiếp tục”. Khi host đã nạp AGENTS/harness-start, AI tự đọc context
liên quan, đối chiếu nguồn, lưu tiến độ sau từng mốc và kiểm tra lại trước bàn giao. Không cần
tự sửa memory, chọn backend hay chạy thêm lệnh mỗi phiên. Có trong source/package chứa `context`;
merge feature PR chưa đồng nghĩa đã phát hành npm/PyPI.

## Những gì được nối

`Nguồn + phiên bản + vị trí → pain point → yêu cầu/quyết định → task → evidence`.

- local.md và decisions.json tiếp tục giữ facts/quyết định chung; không tạo thêm kho quyết định.
- Mỗi OpenSpec change có context.json tùy chọn, chứa problem/outcome và chỉ mục liên kết đến
  nguồn chính thức. Tasks/checkpoint giữ tiến độ, blocker và bước tiếp; context không sao chép trạng thái.
- Quick task dùng issue/PR/task note sẵn có, không bắt tạo bộ spec hoặc thêm cấu hình.
- start/chat tự trả task_context của task đã lưu dưới dạng **gợi ý**. Session ghim change ID theo
  yêu cầu hiện tại; một session lưu start.json không được đổi phạm vi session khác.

## Kiểm tra tự động trong CLI

CLI kiểm tra cấu trúc schema 1, ID/tham chiếu, đồ thị phụ thuộc không chu kỳ, đường dẫn an toàn,
file mất/thay đổi và hash. Nguồn lưu trong docs/sources phải có source_id; nếu manifest chuyển sang
bản mới, bản cũ bị đánh dấu superseded dù bytes cũ vẫn nguyên. Báo affected_links lan truyền qua
depends_on để host biết phần nào cần xem lại; không tự sửa yêu cầu hay duyệt quyết định.

Ghi đè context cần digest và revision đã đọc; ghi từ bản cũ bị từ chối. Các lần ghi dùng guard/atomic
write hiện có, giữ context-history. Đây là chống xung đột local và phục hồi lỗi ghi thông thường,
không phải transaction chống mất điện hoặc khóa phân tán trên nhiều checkout.

## Lệnh dành cho host và chẩn đoán

```bash
aih context --change add-export
aih context --change add-export --report context-report.json
aih context --change add-export --report context-report.json --expected <observed-context-sha256>
```

Report theo [template](../templates/task-context.json); thay placeholder bằng dữ liệu đã đọc.
Lần đầu revision 0; thay thế dùng revision hiện tại, CLI tăng revision. Mỗi source có id, path,
sha256, locator và source_id khi trỏ bản nhập; mỗi link có id, kind, source_refs và depends_on.
Không sửa context.json trực tiếp. Context/report tối đa 256 KiB; tối đa 64 source, 128 link;
mỗi file nguồn tối đa 64 MiB. Locator là chỉ dẫn do host ghi, chưa được CLI xác minh về nghĩa.

`aih resume <id>` tự trả context và yêu cầu revalidate nếu nguồn liên quan đã cũ. `aih context`
không có --change dùng saved task làm gợi ý; nếu chưa có task thì trả hướng dẫn, không tự chọn.
Context blocked trả exit 1; host xử lý nguồn bị ảnh hưởng thay vì bỏ qua lỗi hoặc đổi hash cho qua.

## Cập nhật, backup và giới hạn

Update bằng bundle đã review theo [versioning](versioning.md), giữ context/history trong OpenSpec.
Backup toàn bộ change và docs/sources bằng Git hoặc kho được phép; `aih backup` chỉ chứa cấu hình,
không chứa context/checkpoint/tài liệu. Khôi phục nguyên các phần này trước khi resume.
Rollback snapshot/CLI cùng phiên bản; context optional không buộc thay đổi project/lock schema.

Local hash không biết Jira/Confluence vừa đổi nếu host chưa truy cập lại; giữ provider ID/URL/revision
trong bản nguồn hoặc source catalog và xác minh revision qua connector được phép. Hash không chứng minh
nguồn đúng, diễn giải đúng hoặc phê duyệt hợp lệ. Context là dữ liệu, không phải quyền thực thi.

NOTTH phân phối instructions và CLI, không chạy agent nền: tự động hóa chỉ hoạt động khi host nạp
instructions và thực hiện công cụ. Các máy/checkout độc lập cần Git sync hoặc backend chung; cùng
tên task chưa tạo đồng bộ thời gian thực. Không tự đọc các chat không được host cung cấp.
Offline tests kiểm chứng CLI/recovery/conflict; [live protocol](../evals/session-continuity.md)
kiểm tra AI thật riêng, hiện NOT_RUN. Không suy ra độ tuân thủ của mọi IDE từ kết quả unit tests.

External source metadata integration: when the manifest has a capture_sha256, include that exact
capture_sha256 in the context source. Identical snapshot bytes can represent a newer provider revision;
a changed capture invalidates the older context. External freshness observations are exposed with
provenance; changed/unavailable/unknown/not-checked observations require dependent reconciliation.
An unchanged-at-check receipt remains time-qualified and requires host rechecking for current work.
Context can retain an unavailable source as memory, without certifying it usable for execution.

Project context lives under `.notth/`. After an upgrade the host uses namespace-migration.json to
reconcile relevant old namespace pointers; [migration](notth-migration.md) retains original evidence.
Retired optional backend declarations in older context files are ignored and dropped on the next
guarded context save; there is no external task-backend discovery or installation.

## Optional executable lifecycle integration

[Session runtime](session-runtime.md) adds opt-in Codex/Claude native command hooks, bounded immutable
capsules, per-native-session binding and an independent interruption test driver. This supplements
the instruction workflow. Real native-host recovery and automatic compaction remain unverified
in the current environment; deterministic local fixture passes do not establish model compliance.
