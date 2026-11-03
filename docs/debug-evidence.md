# Debug evidence trong task fix bug

`debug-evidence` là Core skill dùng chung mọi stack để đóng gói bằng chứng tái hiện, điều tra và
kiểm chứng sau sửa. Không cần copy convention dài vào từng `local.md`. Skill phối hợp debugging,
TDD, end-user testing và verification hiện có; host thực hiện việc chạy test và ghi file.

## Dùng hằng ngày

Cài mới như bình thường với `aih init --host <host>`; project đã cài dùng CLI chứa nâng cấp này rồi
`aih update --host <host> --dry-run`, review diff và chạy lại không có `--dry-run`. ZIP offline dùng
`node /path/to/notth/bin/aih.js` thay cho `aih`; ZIP cũ không tự có skill mới.

Giao task như thường: “Sửa bug API tạo trùng, kiểm tra request lặp và phân quyền, lưu evidence”.
Workflow bugfix hướng agent đọc `debug-evidence` khi cần pack hoặc bug ảnh hưởng API/auth/data/
integration/concurrency. Bug nhỏ có regression test đầy đủ chỉ cần lệnh, kết quả, revision và lý do
không tạo pack. Diagnosis-only vẫn giữ phạm vi điều tra. Đường dự phòng khi host không tự chọn:

> Đọc .agents/skills/debug-evidence/SKILL.md và áp dụng cho bug hiện tại.

`aih skills`, `aih skill debug-evidence` và `aih doctor --skill debug-evidence` đọc/kiểm tra skill;
chúng không thực thi runner. Claude/Kiro có wrapper cùng tên khi đã chọn bridge tương ứng. Hành vi
chọn skill và tuân thủ trên model/host thật vẫn cần đánh giá thực tế.

## Cấu hình portable

Trong `.notth/artifacts.json`, dùng output kind `evidence` theo schema hiện có. Ví dụ project mới
idea-driven (project đang có cấu hình phải giữ mode và các input/output khác):

```json
{
  "schema_version": 1,
  "mode": "idea-driven",
  "inputs": {},
  "outputs": {
    "debug-evidence": {
      "kind": "evidence",
      "location": { "path": "verification/debug" },
      "write_policy": "write",
      "canonical": true
    }
  }
}
```

Tùy chọn `bug_evidence` trong `.notth/environment.json`; template mặc định là `null`, file cũ không
có key vẫn hợp lệ. Ví dụ tối thiểu:

```json
{
  "schema_version": 1,
  "tools": {},
  "files": {},
  "commands": {},
  "bug_evidence": {
    "artifact": "debug-evidence",
    "folder_pattern": "{date}/{prefix}-{id}",
    "prefix": "debug",
    "runner": "project",
    "base_url_env": "TEST_GATEWAY_BASE_URL"
  }
}
```

| Field | Ý nghĩa |
| --- | --- |
| artifact | ID output kind evidence đã khai báo; root chỉ có một nguồn trong artifacts.json |
| folder_pattern | Relative pattern chứa date và id; prefix là tùy chọn trong pattern; không có traversal hoặc placeholder khác |
| prefix | Slug theo project, không gắn CRM hay ticket system cụ thể |
| runner | Slug mô tả runner như project, python-requests, newman, bash-curl, jest; không cài hay chạy dependency |
| base_url_env | Tùy chọn: tên biến môi trường do host cung cấp; không chứa URL/token/mật khẩu |

Giữ `tools/files/commands` hiện có; nếu cần, khai báo executable/command theo [project configuration](project-configuration.md).
Config chỉ được validate, không tự tạo pack hoặc cấp quyền gọi API. Test users là alias; credentials
ở host, không nằm trong shared config hoặc log. Không có route thì theo quy tắc fallback có phạm vi
của [artifact contract](artifact-contract.md); external canonical output bị chặn không được tạo bản
local khác để né. Root, prefix và runner là lựa chọn riêng của project.

## Pack và từng lần chạy

Mặc định pack ở `<root>/<date>/debug-<id>/`; ghi timezone, dùng ID an toàn. README ghi task/AC,
expected/observed, cause có bằng chứng hoặc UNKNOWN, patch revision, tested deployed build, data/actor
alias, bảng ca kiểm thử và liên kết từng run. Dùng runner hiện có hoặc runner của project mới viết.
Mỗi attempt có `runs/<unique-run-id>/run_output.txt`, stderr nếu có và metadata trong README; giữ
nguyên cả baseline lỗi lẫn rerun. Chỉ tạo output sau khi chạy thật. Seed/load/probe có output riêng
và scope/cleanup riêng; không tự chạy load chỉ vì tạo evidence.

Lấy mẫu từ [golden reference](../core/skills/debug-evidence/references/golden-sample.md), một ví dụ
tổng hợp NOT_RUN, không giả là dữ liệu ticket thực. [Pack template](../core/skills/debug-evidence/assets/evidence-pack.md)
được đóng gói cùng skill ở cả `.notth/core/skills/debug-evidence/` và `.agents/skills/debug-evidence/`.
Nếu dùng mẫu project, chọn run hoàn tất mới nhất bằng ngày/metadata hợp lệ, không hardcode ngày cũ.

PASS đòi actual assertions và required cases hoàn tất; HTTP 200, exit 0 hay `=== SUMMARY` riêng lẻ
không đủ. Runner mới dùng timestamp, `[OK]/[X]/[!]`, summary passed/executed/planned và exit 0 khi
thành công hoàn tất, 2 khi thất bại/thiếu ca bắt buộc. Runner sẵn có giữ convention riêng. Baseline
không chạy được ghi NOT_RUN/BLOCKED và lý do. Terminal lỗi cần kiểm tra process/side effects trước
retry để không seed trùng. Bug transaction/concurrency kiểm tra invariant/final state.

Tái sử dụng report schema và `aih verify --report` hiện có khi cần machine-readable verification.
Không thêm bộ đánh giá PASS khác chỉ cho pack. Xem [adaptive verification](adaptive-verification.md).

## Migration và rollback

Update giữ cấu hình project-owned. Migrate convention dài từ local.md thành policy trên sau khi
kiểm tra giá trị hiện hành; giữ domain facts và liên kết, không xóa đoạn người dùng chưa review.
Skill tên `debug-evidence` là ngoại lệ Core chính xác; không đổi tên skill cũ hoặc quản lý mọi custom
skill không có prefix. Collision với skill project có sẵn phải được giải quyết ownership trước.
CLI cũ không hiểu tên/key mới; rollback matching CLI/snapshot/config qua Git và backup, giữ pack
project-owned. Test offline/package không chứng minh host/model tự động chọn và thực hiện đúng.
