# Dùng Notth hằng ngày với mọi project và AI tool

**Chọn một tool, đưa task cho AI.** Core dùng chung; stack adapter và native bridge chỉ bổ sung
phần thực sự cần. Không mặc định nghiệp vụ, hệ điều hành, service topology hay database.
Những lệnh dưới cần CLI/source đã review chứa tính năng; feature PR chưa phải release npm/PyPI.

Bản hướng dẫn ngắn offline nằm ở `.notth/templates/QUICKSTART.md`.

## Task và change

```bash
aih status
aih changes
aih start --goal change --change add-order --task "Implement accepted requirements"
aih start --clear
```

Status đọc task/modules/checkpoint; changes đọc tối đa 100 change và checkbox ngoài code fences.
Checkbox chỉ là khai báo. CLI không tự chọn task, archive, merge hay kết luận đã verify.
Clear tạo config backup rồi bỏ start.json, giữ nguyên change/evidence/docs; lặp lại không gây thêm việc.
Resume với `start --goal resume --change <id> --task <text>` cần checkpoint và evidence thực tế.
Không cần OpenSpec cho một task nhỏ: `start --goal change --task <text>` vẫn dùng được.

## Knowledge tùy chọn

Project nhỏ giữ local.md ngắn và tận dụng docs sẵn có. Nếu nhiều module/nguồn, AI theo Core
project-knowledge.md để tạo một index từ `.notth/templates/knowledge-index.md` tại canonical
storage đã chọn. Chỉ thêm phần có ích: module map, flows, glossary/rules/ADRs, source catalog và
"muốn làm X → đọc gì". Không tạo sẵn cả cây thư mục hoặc chép cùng facts vào nhiều tài liệu.

Index dẫn tới nguồn, revision, owner/status và phần chưa rõ; artifacts.json/integrations.json vẫn
quản lý khai báo nguồn/quyền. Knowledge docs thuộc project; knowledge.json là hash cache riêng.
Khái niệm/code-pattern lấy từ project thực tế, không kế thừa quy ước domain của project tham khảo.

## Test và TechSpec có lưu tiến độ

Core [Recoverable verification](../core/workflows/recoverable-verification.md) áp dụng khi cần nhiều
nhóm test hoặc service sống lâu. Host chọn background process/session hoặc orchestration sẵn có;
thiếu khả năng thì ghi BLOCKED. Không gắn vào control_pwsh_process, Spring, Docker hay một IDE.

Mỗi nhóm: lưu observations thực tế → cập nhật evidence/draft section → lưu checkpoint nếu cần.
Dùng contract checkpoint hiện có, ghi baseline, evidence hashes, pending và side effects chưa xác minh.
Không ghi tokens/credentials. Resume kiểm tra lại code/config/fixtures/nguồn và process ownership;
chỉ giữ PASS còn hiệu lực, chạy lại nhóm/flow bị ảnh hưởng. Không kill theo port, không tự sửa quyền
ở DB dùng chung. Full flow chọn theo yêu cầu: UI, mobile, CLI, API, batch hay library đều có thể phù hợp.

Product TechSpec giữ mẫu dùng chung và ghi từng phần; adapter bổ sung chi tiết stack. Không có
Product thì evidence/handoff nằm trong docs hoặc change hiện có. Public docs chỉ được cập nhật theo
source-write policy và actual authorization; thông báo người khác cần user yêu cầu riêng.

## Cấu hình theo máy

Trong args dùng `${files.<id>}` trỏ file đã khai báo; machine.json override path theo máy, không
lặp path cứng trong commands. `${ENV_NAME}` vẫn được hỗ trợ. doctor kiểm tra tham chiếu, không
in giá trị hoặc chạy lệnh. Host resolve cùng thứ tự và truyền argument riêng khi thực thi.
Xem [Project configuration](project-configuration.md) cho schema và ví dụ Maven tùy chọn.

## Kiểm chứng và giới hạn

CLI tests kiểm tra đọc/ghi/backup/validation/install; tests không chứng minh AI tuân thủ hay hook
nạp đúng trên mọi client. Theo [live protocol](../evals/host-portability.md) và đánh giá các case
recoverable/knowledge trong `aih eval --scope all` bằng host thực tế; hiện NOT_RUN.

[Short task prompts and human-readable orientation](simple-use.md): chat is the primary path across hosts; terminal interview remains optional and backward compatible.

[Context liên phiên tự động](session-continuity.md): AI ghim task theo session, nạp intent/nguồn,
đối chiếu khi nguồn đổi và lưu checkpoint; không yêu cầu người dùng quản lý memory.
