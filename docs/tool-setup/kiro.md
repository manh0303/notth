# Kiro: bắt đầu bằng /harness-start

**Cài trong project → mở session Kiro đầu tiên → chọn `/harness-start`.**
Kiro đọc project trước, chỉ hỏi phần còn thiếu và lưu context cho session sau.
Cần reviewed source/release chứa tính năng này; không mặc định npm 0.14.0 đã có.

## Cài mới và session đầu tiên

Cần Node.js 22+ và Kiro đã đăng nhập. Chạy tại project root:

```bash
npx --yes @manhd_d/notth init --host kiro
```

Thêm `--adapters java-spring` cho Spring, `--adapters react-nextjs` cho React/Next.js
hoặc `--detect` khi muốn nhận diện stack hỗ trợ. Chỉ thêm `--capabilities product`
khi cần tài liệu yêu cầu (BRD/PRD/SRS). [common setup](README.md) dành cho các host khác.

Mở cùng project trong Kiro IDE, tạo **session chat đầu tiên**, gõ `/` và chọn:

```text
/harness-start
```

Đưa task ngay trong lần gọi skill, ví dụ: “Fix bug phân quyền ở API cập nhật user”.
Kiro suy ra mục tiêu, kiểm tra build/conventions/nguồn và hỏi tối đa 1–3 phần còn thiếu mỗi lượt.
Không cần khai báo lại stack/Maven/quyết định đã có bằng chứng. Với client CLI sử dụng tên
lệnh này, chạy `kiro-cli chat` tại project root rồi chọn skill trong chat.

## Dự án đã cài / bộ offline

Lấy CLI/package hoặc checkout **mới đã review**. Commit hiện trạng và backup, rồi chạy:

```bash
aih backup
aih update --host kiro --dry-run
aih update --host kiro
aih check
```

Nếu dùng npx, thay `aih` bằng `npx --yes @manhd_d/notth@<reviewed-version>`.
`update` dùng bundle của CLI đang chạy, không tự tải bản mới. Thêm bridge vào snapshot
đã cài bằng `update --host kiro`, không chạy lại init với selection mới.

Offline Windows: thay đường dẫn bằng bundle mới chứa tính năng này:

```powershell
& 'D:\notth-reviewed\aih.cmd' update --host kiro --dry-run
& 'D:\notth-reviewed\aih.cmd' update --host kiro
& 'D:\notth-reviewed\aih.cmd' check
```

Checkout không có shim: gọi `node 'D:\notth-reviewed\bin\aih.js'` rồi thêm subcommand.
Cho Kiro biết cách gọi CLI offline này; không cần global `aih` hoặc API key riêng.

## Thông tin được lưu

Thành viên mới clone repo có snapshot dùng chung: mở project và gọi `/harness-start`, reuse context
đã có. Chỉ bổ sung đường dẫn theo máy và những thông tin liên quan còn thiếu. Nếu shared config bị
thiếu, dùng cùng CLI đã cài: `aih setup --apply --dry-run` rồi `aih setup --apply`; không cài lại bundle.
Người dùng không phải tự gõ lệnh nếu host có quyền chạy CLI/file tools. Clone không tự cài Node/CLI,
đăng nhập host hoặc cấp quyền; thiếu CLI thì host dùng templates và báo integrity checks chưa chạy.

| File | Nội dung |
| --- | --- |
| `.notth/local.md` | YAML stack/build, approved deviations, nguồn đã đọc; prose giải thích |
| `.notth/environment.json` | Tool/file/command dùng chung |
| `.notth/machine.json` | Override đường dẫn theo máy; Git ignore, không chứa credentials |
| `.notth/integrations.json` | Alias kết nối; tools/quyền thực tế vẫn do Kiro xác minh |
| `.notth/start.json` | Task/mục tiêu hoặc checkpoint ID |
| `.notth/decisions.json` | Quyết định project/module có trạng thái, nguồn/lý do và lịch sử thay thế |
| `.notth/knowledge.json` | Hash nguồn/context đã đối chiếu, không lưu nội dung nguồn |

CLI `seed` tạo kế hoạch đọc; **Kiro** hiểu code/tài liệu và điền context. Kiro lưu câu trả lời
qua từng bước, chạy `seed --record` khi đã đối chiếu. Nếu ngắt, gọi lại `/harness-start`
để hoàn thành phần còn thiếu. Summary không thay thế hướng dẫn scoped của module đang sửa.

## Session tiếp theo

SessionStart đọc summary/task và kiểm tra freshness; gợi ý `/harness-start` khi cần.
Bạn có thể giao task tiếp theo trực tiếp hoặc gọi lại skill để tiếp tục setup.
Hook không tự interview hoặc tự chạy task cũ chỉ vì session mới mở.
`aih seed --check` phát hiện nguồn local đã đổi; Kiro refresh đúng phần bị ảnh hưởng.
Remote revisions cần host kiểm tra. [Schema và seed](../session-onboarding.md).

## File native và compatibility

`--host kiro` tạo `.kiro/skills/harness-*/SKILL.md` trỏ tới canonical `.agents/skills/`,
ví dụ `.kiro/skills/harness-review/SKILL.md` → `.agents/skills/harness-review/SKILL.md`.
Harness does not assume native discovery of `.agents/skills` trong Kiro.
`aih check` kiểm tra wrappers và `.kiro/hooks/harness-session.json` qua lock; file sửa tay
hoặc file người dùng trùng tên khác nội dung chặn update. Steering/hooks/skills khác được giữ.
Update sau tự giữ bridge, không cần lặp `--host kiro`.

Hook v1 dành cho **Kiro IDE 1.x / CLI V3** theo tài liệu chính thức. Client cũ cần nâng cấp
hoặc bridge phù hợp riêng. Web không chạy SessionStart; dùng skill/prompt bằng tay và xác minh
workspace access. CLI không auto-detect phiên bản hoặc chép cấu hình đăng nhập.

Nếu chưa thấy `/harness-start`, mở session mới, kiểm tra **Agent Steering & Skills** và
`.kiro/skills/harness-start/SKILL.md`. Prompt dự phòng:

> Đọc AGENTS.md và .agents/skills/harness-start/SKILL.md, thực hiện onboarding trong session này.
> Tự khảo sát project, giữ quyết định đã có và chỉ hỏi phần còn thiếu.

Dùng [read-only loading check](README.md#3-start-the-first-session) khi cần.
Khi dùng Kiro Specs, khai báo canonical documents và write scope trong
[Artifact contracts](../artifact-contract.md). Với propose ngoài Harness, dùng
`aih change-sidecars <id>` để thêm sidecar còn thiếu, giữ nguyên file cũ.

## Official references

Checked 2026-10-14; no logged-in Kiro IDE/CLI/Web or live-agent smoke was run.
Tests xác minh file/schema/ownership và package; live hook/skill loading và giảm token chưa đo.

- [Installation](https://kiro.dev/docs/getting-started/installation/)
- [Skills and slash invocation](https://kiro.dev/docs/skills/)
- [Hooks v1 schema](https://kiro.dev/docs/hooks/)
- [SessionStart and surfaces](https://kiro.dev/docs/hooks/types/)
- [Steering](https://kiro.dev/docs/steering/)

## Common first-session onboarding

npm and pip/offline use the same `aih init --host kiro` bundle and canonical harness-start.
Invoke the native skill when available (Kiro: `/harness-start`), or send:

> Read .agents/skills/harness-start/SKILL.md and follow it for this project. My task: [task].

Reuse saved answers; do not start a second terminal interview. Client-specific imports/discovery above
still apply. [pip/offline prerequisites and updates](../python-installation.md).

For the shared task-first flow, see [simple use](../simple-use.md). On a supporting CLI, `start --chat --host <your-host> --format human` never opens a terminal interview. Native discovery still requires a real client check.
