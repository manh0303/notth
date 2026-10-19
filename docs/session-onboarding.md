# Session onboarding và context đã lưu

[Kiro quick start](tool-setup/kiro.md): `init --host kiro` → session đầu tiên → `/harness-start`.
Core harness-start cũng dùng được khi host khác đọc canonical skill. Host hiểu dự án/hỏi/điền
cấu hình; CLI không gọi model. `start --host kiro` luôn trả plan, không interview cả khi có TTY.
Terminal intake cho các host khác tiếp tục được giữ.

## Structured local.md

YAML frontmatter subset hoặc JSON-compatible YAML schema 1; prose giữ bên dưới:

```yaml
---
schema_version: 1
stack:
  language: java
  version: "21"
  framework: spring-boot
  framework_version: "3.5.11"
build:
  tool: maven
approved_deviations:
  - id: approved-error-contract
    rule: "Preserve the approved error contract"
    reason: "Existing approved convention"
    source: docs/backend-conventions.md
sources:
  - pom.xml
  - docs/backend-conventions.md
---
```

Phiên bản chỉ là ví dụ; host đọc dependency thực tế. stack/build là map string; quote versions.
Mỗi deviation có id/rule/reason, source tùy chọn. sources là file local tương đối đã đọc, không
`.env`, machine.json, Git nội bộ hoặc credentials. Không tự coi inferred deviation là approved.
Parser hỗ trợ mapping, sequence, scalar, inline JSON; không anchors/aliases/tags, block scalar
(`|`, `>`), implicit dates hay YAML phức tạp. Duplicate/unsupported/schema errors bị từ chối.
Legacy prose vẫn hợp lệ, init/update giữ nguyên; host thêm frontmatter khi seed và bảo toàn prose.
Cấu trúc này không bảo đảm hai model suy luận giống nhau.

Đường dẫn máy ở ignored machine.json. Dùng `tools.maven.executable`, `files.maven-settings.path`
và command ID như `commands.get-token`; không thêm `tools.maven.settings` hay underscore ID vào
schema hiện có. [Maven example](project-configuration.md).

## Seed và freshness

```bash
aih seed
aih seed --record
aih seed --check
```

seed read-only liệt kê nguồn cho host inspect. record yêu cầu structured local.md có ít nhất một
nguồn đã đọc và tồn tại; ghi hash sau reconciliation. check không ghi, exit 1 khi missing/stale,
exit 0 khi current. CLI không tự tạo tri thức hoặc xác nhận summary đúng.

Theo dõi build manifests, AGENTS/README/OVERVIEW/conventions/testing/workflow files tối đa 4 tầng,
cộng local.md.sources cho nguồn sâu hơn/tên riêng. Bỏ Git/vendor/build/cache và thư mục Harness/host.
Giới hạn: 10000 entries, 256 auto sources, 128 explicit sources, 1 MiB/file; symlink không làm nguồn.
Hash bao gồm source/context digests và bundle digest. Thêm/xóa/sửa nguồn báo stale; code thông thường
không ép re-seed, trừ khi được khai báo làm nguồn. Refresh đúng assumptions bị ảnh hưởng rồi record lại.
Remote revisions cần host kiểm tra; scoped AGENTS vẫn phải đọc dù hash current.

knowledge.json project-owned, nằm ngoài managed lock, không có source text hoặc hash machine.json.
Setup gián đoạn giữ partial facts; chỉ record cache sau khi đã đối chiếu. Hash phát hiện drift,
không chứng minh factual correctness hay độ tin cậy của nguồn.

## Skill prerequisites

Skill frontmatter có requires tùy chọn:

```yaml
requires:
  machine:
    - tools.maven.executable
  environment:
    - files.maven-settings.path
    - commands.get-token
  mcp:
    - project-db
```

`aih skills` xuất metadata này. `aih doctor --skill <name>` kiểm tra local references/presence,
báo missing không in giá trị. Tìm explicit custom skill ở `.agents/skills/<name>/SKILL.md`,
`.kiro/skills/<name>/SKILL.md` hoặc `plugins/<name>/SKILL.md`.
Machine requirement cần override đã khai báo; dùng environment requirement nếu PATH/wrapper được
chấp nhận. Không ép Maven cho skill không cần nó. MCP declaration vẫn unverified, host kiểm tra
actual tools/quyền. Passing doctor không chứng minh build thành công.

## Role extensions

Trong map agents của agents.json:

```json
"core:security-reviewer": {
  "model": "@balanced",
  "reasoning": "high",
  "extensions": ["plugins/project/agents/security-reviewer.md"]
}
```

aih agents trả contract_load_order: canonical contract trước, extensions theo thứ tự. Host đọc
và áp dụng chúng; CLI không ghép prose hay tạo agent. Extension bổ sung domain/conventions,
không cấp quyền hoặc làm yếu core security. Missing file chặn role; contradictory facts cần đối chiếu
nguồn/owner. Tối đa 16 project-owned Markdown, 64 KiB/file, không traversal/symlink.
Transfer bỏ extension paths gắn repo cũ. Field delegate không thuộc schema; nếu đã dùng workaround
đó, chuyển đường dẫn Markdown sang extensions và bỏ delegate trước update. CLI không tự đoán migration.

## MCP alias discovery

```bash
aih sync-integrations --host kiro --dry-run
aih sync-integrations --host kiro
```

Đọc user `~/.kiro/settings/mcp.json` rồi project `.kiro/settings/mcp.json`; project disabled override
loại server khỏi discoveries. `--from <file>` đọc một config riêng, hỗ trợ absolute path.
Chỉ thêm enabled server names vào integrations.json, read-only declaration. Không credentials,
endpoint, command/env, autoApprove; không xóa/ghi đè declarations cũ. Alias collisions thêm suffix.
Config không có actual tool inventory: host phải discovery tools/quyền và lưu evidence riêng.
Read-only declaration không cưỡng chế permission; CLI không kết nối hoặc chạy server.

## Propose sidecars

aih new-change đã tạo sidecars từ locked templates. Với Kiro/upstream propose bên ngoài,
`aih change-sidecars <id>` thêm `.openspec.yaml`, decisions.json, verification.json và
artifact-impact.json còn thiếu, giữ file cũ. Workflow Harness dùng helper; không patch upstream CLI.

## Backup / migration

Shared context/config tiếp tục vào config backup. knowledge.json là cache tái tạo, không ở archive
allowlist; full repo backup giữ nó. Machine/credentials không export. Extensions và custom host
files backup cùng repo. Transfer giữ module/model preferences, bỏ repo autonomy và extensions.
Update giữ configs/prose/cache; edited locked wrappers/hook chặn update. Rollback snapshot qua Git,
rồi reconcile cache. Các lệnh này cần reviewed source/release; feature PR không tự bump/publish npm.
Live Kiro/model loading và token savings chưa đo; local tests không thay phiên thực tế.

## Clone repo và setup còn thiếu

Giữ luồng chính `init --host kiro` → chat → `/harness-start`. Thành viên mới reuse tri thức dùng
chung trong repo, chỉ bổ sung machine.json và thông tin còn thiếu. `aih setup` vẫn read-only:

```bash
aih setup --apply --dry-run
aih setup --apply
aih setup --greenfield
aih start --compact --host kiro
```

`--apply` chỉ tạo shared config thiếu từ snapshot/templates đã cài, giữ bundle/lock/config cũ.
Không điền đường dẫn máy, task hay knowledge cache. Nếu project.json thiếu, dựng lại selection từ
lock; selection hiện có khác lock thì phải update. Schema/path/drift errors chặn trước ghi;
ordinary write errors rollback. --dry-run cần --apply và không ghi target. Không recovery được
câu trả lời tùy chỉnh đã mất: dùng Git/backup. `--greenfield` chọn guidance, không chốt kiến trúc.
Không có CLI trong host: đọc templates để tạo file thiếu, báo CLI checks NOT_RUN. “Không cần tự
gõ terminal” phụ thuộc host có quyền file/shell; clone không tự cài CLI hoặc đăng nhập host.
Compact trả JSON task/stack/module để định hướng, bỏ source scan/interview; freshness là unchecked.

## Quyết định dùng chung và phạm vi

`.notth/decisions.json` dùng schema 1; không thay decisions.json của từng OpenSpec change:

```json
{
  "schema_version": 1,
  "decisions": [{
    "id": "D-001",
    "scope": "module:billing",
    "status": "confirmed",
    "question": "Which error contract applies?",
    "answer": "Preserve the accepted module contract",
    "reason": "Compatibility with existing consumers",
    "source": "docs/billing-contract.md"
  }]
}
```

Scope là `project` hoặc `module:<slug>` (cho phép phân cấp như module:services/billing).
Status proposed chỉ là đề xuất; confirmed cần answer/reason/source; superseded giữ các trường đó
và superseded_by trỏ tới quyết định cùng scope đã confirmed hoặc superseded. Không duplicate ID,
self-reference, cycle, missing/cross-scope/proposed replacement. Tối đa 256 quyết định; ID 64 ký tự,
text 4096 ký tự, single-line. File không có trên snapshot cũ vẫn hợp lệ. CLI kiểm tra cấu trúc,
không tự xác nhận nguồn có thực sự được phê duyệt; host/owner chịu trách nhiệm đối chiếu.

`aih decisions --scope module:billing` trả project choices cộng đúng scope được chọn; không tự
inherit các module cha/con. Host chọn thêm scope liên quan khi cần và xử lý mâu thuẫn, không tự
cho module override project/security. Trước khi hỏi đọc các quyết định applicable rồi change-local
decisions. Reuse confirmed khi nguồn/phạm vi còn hiệu lực; đổi nguồn/phạm vi có thể cần hỏi lại.
do_not_ask_again boolean tùy chọn không khóa quyết định vĩnh viễn và không cấp quyền merge/deploy.
Save từng câu trả lời/quan sát để resume; chỉ seed --record sau đối chiếu. Hash đổi khi decisions
đổi; hash không chứng minh facts đúng. Legacy choices trong prose vẫn đọc được, không tự chuyển
inference thành confirmed. Backup cùng dự án giữ file này; transfer sang dự án khác loại bỏ nó.

## Kiểm chứng bằng host thật

Local tests/package smoke kiểm tra CLI và file; chưa chứng minh model tuân thủ hoặc skill menu/hook
đã hoạt động trên Kiro. Chạy trên workspace thử, ghi source commit, CLI/snapshot/host version, OS,
model và invocation. Không dùng dữ liệu khách hàng hay credentials trong evidence.

| Scenario | Quan sát bắt buộc |
| --- | --- |
| Dự án mới | /harness-start đọc idea/docs, chỉ hỏi thiếu; không ép stack/CI khi chưa cần |
| Existing repo | Đọc scoped instructions và code mẫu; source-linked facts, machine paths riêng |
| Clone thành viên mới | Reuse facts/quyết định chung, tạo file thiếu không đổi bundle/lock |
| Đổi convention | seed báo stale, AI đọc nguồn đổi và cập nhật assumptions bị ảnh hưởng |
| Ngắt giữa interview | Session sau reuse answers đã lưu; chưa ghi cache hoàn thành giả |
| Quyết định được thay thế | Không áp dụng đáp án superseded/proposed; hỏi lại chỉ phần material |
| Thiếu CLI/MCP/VPN | Nêu đúng blocker; không khẳng định access hoặc test đã pass |
| Update/restore | Custom config giữ nguyên; backup/restore giữ history, transfer bỏ domain choices |

Lưu raw transcript/command output và diff trước/sau (redacted), outcome PASS/FAIL/BLOCKED/NOT_RUN.
Đo riêng số câu hỏi lặp, files/tool calls đã đọc, thời gian setup và token do host báo. Trường hợp
host không cung cấp usage ghi unknown; không ước lượng thành số đo. So sánh cold start và session
sau trên cùng fixture/model/host, ghi số lần chạy và biến động; chưa có baseline thì không công bố
“18K → 2K” hoặc “45 phút → 5 phút”. Core eval scenarios tiếp tục unscored cho tới khi chạy thật.

[Short task prompts and human-readable orientation](simple-use.md): chat is the primary path across hosts; terminal interview remains optional and backward compatible.
