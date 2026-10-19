# Bắt đầu một nhiệm vụ

**Mọi tool: init --host <tool> → mở chat trong cùng project → harness-start.**
[Cài đặt lần đầu](getting-started.md) · [Chọn tool](tool-setup/README.md).

Gọi skill nếu client nhận diện (Kiro: `/harness-start`), hoặc gửi:

> Đọc .agents/skills/harness-start/SKILL.md và thực hiện cho project này. Task: [yêu cầu].

AI khảo sát project, hỏi phần quan trọng còn thiếu, lưu context và tiếp tục task đã được giao.
Session sau giao task trực tiếp; khi tiếp tục việc cũ, AI đối chiếu trạng thái và evidence trước.
Không cần chạy thêm interview trong terminal.

## Tùy chọn: chọn task bằng terminal

Dùng khi bạn muốn lưu yêu cầu trước khi mở chat. `npx` không tạo lệnh global `aih`;
trong các ví dụ bên dưới, thay `aih` bằng `npx --yes @manhd_d/notth` nếu cài qua npx,
hoặc dùng đúng lệnh offline/pip hiện có.

```bash
npx --yes @manhd_d/notth start
```

Terminal tương tác hỏi mục tiêu và task, input còn thiếu, nơi lưu draft docs khi cần.
Có cấu hình input/output thì không hỏi lại. Có task đã lưu thì chọn tiếp tục hoặc nhiệm vụ mới;
model/agent giữ mặc định của host trừ khi bạn muốn cấu hình khác. Lựa chọn được lưu trong
`.notth/start.json` và `.notth/artifacts.json`; thay cấu hình hiện có tạo backup trước.

Không có TTY (CI/pipe), `start` chỉ xuất JSON plan và không chờ stdin hoặc tự ghi lựa chọn.
Có thể lưu lựa chọn bằng flags:

```bash
aih start --goal docs --task "Implement approved requirements" --input docs/requirements --output docs/specs
aih start --goal change --task "Fix pagination"
aih start --goal change --change add-order --task "Implement accepted scope"
aih start --goal resume --task "Continue the reviewed task" --change add-order
```

Goal: `idea`, `docs`, `change`, `resume`. Resume cần checkpoint/evidence đã có, kiểm tra freshness và
side effects trước tiếp tục. --input nhận đường dẫn tương đối hoặc HTTPS URL không chứa credentials;
--output chỉ nhận folder docs tương đối. Flags input/output chỉ seed khi chưa có khai báo; muốn sửa
nguồn cũ, review artifacts.json trực tiếp. Start không tự đọc tài liệu ngoài repo, không phê duyệt
nghiệp vụ hay thực thi command/model. Metadata discovery không chứng minh nội dung nguồn đúng.

Copy `host_prompt` từ kết quả vào AI tool đang mở cùng project. Host đọc task, cấu hình, nguồn và code;
hỏi tối đa 1–3 quyết định còn thiếu mỗi lượt với phương án và đề xuất có lý do. Dùng workflow/agent/skill
phù hợp đã cài; module thiếu phải được đề xuất rõ trước thay selection. Tiếp tục thực hiện khi scope và
quyền đã đủ. Root-file probes không thay thế khảo sát monorepo hoặc đọc tài liệu trong host.

Nếu bạn có nguồn/link/mô tả tự do hoặc cần output bên ngoài, đưa cho AI trong cuộc thảo luận và lưu
quyết định vào artifacts.json/integrations.json/local.md. Terminal hỏi đáp ngắn; phần BA/thiết kế nằm
trong AI tool. Core skill harness-start là điểm vào onboarding; menu slash native phụ thuộc host.

[File cấu hình, backup, cài lại và chuyển dự án](configuration-backup.md) · [AI tool setup](tool-setup/README.md).

## Daily status and change selection

`aih status` reports saved task, change, declared checkbox counts and checkpoint recovery guidance.
`aih changes` lists at most 100 local changes (archive excluded); neither executes a task or infers
merge/release/approval from checked boxes. The first unchecked item is a candidate, not dependency order.

`start --goal change --change <id> --task <text>` selects an existing proposal without a checkpoint.
`start --goal resume --change <id> --task <text>` validates an existing checkpoint and evidence.
No manual JSON editing is needed for selection. `aih start --clear` saves a config backup and removes
only start.json; change/docs/evidence survive. Restore from the returned backup for recovery.
Clear is idempotent and cannot be combined with other intake flags. It never archives or kills processes.
See [Reusable workflows](reusable-workflows.md) for optional knowledge and grouped verification.

[Short task prompts and human-readable orientation](simple-use.md): chat is the primary path across hosts; terminal interview remains optional and backward compatible.
