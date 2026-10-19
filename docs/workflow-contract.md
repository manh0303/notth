# Workflow contract schema 1

Harness sở hữu **contract** (stage, gate, role, artifact) và **evidence format**. Host/driver sở hữu
execution, tools, permissions, identity và orchestration. `core:orchestrator` là vai trò, không phải
engine. Temporal hoặc engine khác có thể đọc contract; hiện chưa có Temporal driver.

Hai contract đầu tiên:

| ID | Contract | Lựa chọn cần thiết |
| --- | --- | --- |
| spec-to-code | [JSON](../core/workflows/spec-to-code.workflow.json) + [diễn giải](../core/workflows/spec-to-code.md) | Core |
| idea-to-prd | [JSON](../capabilities/product/workflows/idea-to-prd.workflow.json) + [diễn giải](../capabilities/product/workflows/idea-to-prd.md) | Product |

`aih workflow validate` đọc **snapshot đã lock**, kiểm shape, unique stage IDs, owner có trong agent
registry, human roles đã khai báo, check names, transition targets và approval sources. Loại bỏ các cạnh
`on_reject`/`on_fail` rồi kiểm DAG: cycle qua `next` bị từ chối. Validation không chạy workflow.
[JSON Schema chuẩn](../core/workflows/workflow.schema.json) cho editor/tool khác; graph/registry là
semantic extension do validator kiểm. Test/validate bắt bảng stage Markdown khớp thứ tự JSON.

`next` là đường forward; `on_reject`/`on_fail` là feedback. `entry_gate` là điều kiện **vào stage**,
không chứng nhận stage hoàn thành. `outputs` là declaration; `outputs-present` chỉ kiểm file local
không rỗng. Nó không kiểm nghĩa, bản external hay approval của nội dung. spec-to-code outputs dùng
đường tương đối trong change; idea-to-prd outputs dùng đường từ project root. Routing external cần
driver riêng, không coi file local là bằng chứng external publication.

## Readiness và approval

```bash
aih ready add-order --stage implement
aih ready add-order --stage review
aih ready add-order --workflow spec-to-code --stage review-spec
aih ready add-order --workflow spec-to-code --stage implement
aih ready product-v1 --workflow idea-to-prd --stage prd
```

Hai lệnh implement/review **không có --workflow** giữ hành vi structural cũ, không yêu cầu approval
mới. Với snapshot mới, chúng validate contract rồi dùng compatibility gates; snapshot cũ thiếu JSON
vẫn hoạt động. Chọn `--workflow` áp dụng đầy đủ gates trong JSON. Các stage khác mặc định lấy
spec-to-code. Tên stage không tồn tại bị từ chối; không suy đoán thứ tự từ prose.

Ghi review thực tế vào `openspec/changes/<id>/approvals.json`, project-owned và không managed:

```json
{
  "schema_version": 1,
  "workflow": "spec-to-code",
  "approvals": [{
    "stage": "review-spec",
    "role": "spec-owner",
    "by": "Named reviewer",
    "at": "2026-10-14T07:00:00Z",
    "source_ref": "review-ticket:123"
  }]
}
```

Copy installed `.notth/templates/openspec/approvals.json` khi opt in; không tự ghi approval giả.
`approval_from` kiểm bản ghi đúng workflow/stage/role; malformed/duplicate schema bị từ chối.
`approval` trên stage là yêu cầu khi **hoàn thành** stage do driver/human xử lý; ready chỉ kiểm entry.
Human role IDs: spec-owner, product-owner, reviewer; chúng không phải model agents.

**Giới hạn:** ready chỉ biết bản ghi có tồn tại. Nó không xác thực danh tính, quyền duyệt, nội dung,
chữ ký hoặc freshness sau sửa spec; driver/human phải đối chiếu review với revision thật và làm mới
approval khi scope thay đổi. Ready không cấp quyền merge/deploy, không chứng minh task/test đã chạy,
không kiểm PR đã merge để archive. Các ràng buộc semantic trong Markdown vẫn phải được host thực hiện.
Approval và pass rate không thay thế business sign-off/CI. Project/lock schema vẫn là 1.
