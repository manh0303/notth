# Walkthrough — Astro micro-tools, SEO, React Islands and future MFE

**Tình huống:** bạn muốn xây website gồm nhiều công cụ nhỏ như QR generator, JSON formatter, image compressor và có thể thêm các tool phức tạp hơn. Mục tiêu là deploy nhẹ, SEO tốt và có đường nâng cấp lên MFE *nếu thực sự cần*, không phải triển khai micro frontend từ ngày đầu.

## 1. Chuẩn bị Astro project

Cần Node.js 22+, Git, một repo Astro đã tạo hoặc đã checkout và `aih` CLI bản nguồn chứa Astro adapter. Nếu chưa có Astro repo, tạo bằng **Astro CLI chính thức** rồi chọn TypeScript theo nhu cầu; lệnh sau là ví dụ tương tác, phải kiểm tra phiên bản hướng dẫn hiện hành:

```bash
npm create astro@latest
cd /path/to/astro-project
# Nếu sử dụng React islands, cài @astrojs/react theo tài liệu Astro
# npx astro add react
```

Không cần React để viết đa số tool cơ bản. `aih` là bộ hướng dẫn AI, **không** tạo Astro source code và không cài các dependencies này.

## 2. Cài Harness vào repo

```bash
aih resolve --adapters astro --capabilities product,uiux
aih init --adapters astro --capabilities product,uiux --dry-run
aih init --adapters astro --capabilities product,uiux
aih check
aih skills
aih skill harness-astro-project-architecture
aih skill harness-astro-seo
```

`product,uiux` đều **tùy chọn**; dự án chỉ cần Core + Astro có thể dùng `aih init --adapters astro`. Trong repo *đã cài Harness*, chỉnh `.notth/project.json` để thêm `astro`, sau đó `aih update --dry-run`, `aih update`, `aih check`. Không chạy lại init với cấu hình khác khi có file snapshot.

Để thử detector an toàn:

```bash
aih detect
aih init --detect --dry-run
```

Detector chỉ đọc dependencies của `package.json` ngay trong thư mục hiện tại. `astro` được nhận diện từ dependency tên `astro`; `react-dom` do React islands **không tự động** khiến detector thêm `react-nextjs` nếu không có `next`. Nếu app dùng `next` thật hoặc muốn đồng thời cài cả hai adapter, có thể chọn thủ công.

## 3. Tổ chức tools kiểu static-first

```text
src/
  layouts/
    ToolLayout.astro
  pages/
    index.astro
    tools/
      qr-generator.astro
      json-formatter.astro
      image-compressor.astro
  components/
    ImageEditor.tsx      # chỉ khi có React thực sự cần thiết
  lib/
    qr/
      validation.ts
      encode.ts
    image/
      transform.ts
```

Một công cụ đơn giản nên chạy ngay trên trình duyệt, không gửi dữ liệu riêng tư lên server. Đặt validation và functions riêng, tránh tool này import trạng thái tool khác. Các API có quyền/secret mới cần Worker/server xử lý theo authorization rõ ràng.

Prompt ví dụ trong Codex/IDE/Work đã được cấp quyền repo:

> Đọc AGENTS.md và skill harness-astro-project-architecture + harness-astro-seo. Tôi muốn làm 3 tools: QR generator, JSON formatter và image compressor. Lập kế hoạch UI, route và ưu tiên xử lý dữ liệu ngay trên trình duyệt. Kiểm tra scripts/dependencies trước khi sửa, không tự cài backend, database, auth hay React. Tạo vertical slice cho QR generator với validation, trạng thái lỗi và accessible keyboard labels. Sau khi tôi duyệt spec, triển khai và chạy các test/build scripts thực có. Trả về diff và kết quả thực tế, không tự deploy.

## 4. Thêm React Islands khi cần

Chỉ hydrate React cho phần có tương tác đủ phức tạp. Nếu đã cài `@astrojs/react` phù hợp, ví dụ nhúng React component vào Astro page:

```astro
---
import ImageEditor from '../../components/ImageEditor.tsx';
---

<h1>Image Editor</h1>
<ImageEditor client:visible />
```

Chọn `client:load` nếu cần tương tác ngay ở phần đầu trang, `client:visible` khi tool nằm dưới fold; kiểm tra timing/hydration trong browser. Đừng nhúng React cho toàn bộ landing page chỉ để có một nút.

**Islands không phải MFE.** Hiện tại tất cả trang và island của Astro project vẫn build/deploy cùng nhau.

## 5. Cloudflare và deployment

- Với các tool hoàn toàn chạy trong browser: build Astro ra static files, phục vụ từ CDN/host hỗ trợ static; **không cần Cloudflare Workers** chỉ để chạy website.
- Nếu cần API dùng secrets, xử lý server hoặc điều phối dữ liệu được phép truy cập: đánh giá Cloudflare Workers và adapter/runtime theo **phiên bản Astro hiện dùng**. Với dự án mới, kiểm tra tài liệu Cloudflare Workers chính thức trước khi chọn thiết lập.
- Không để private keys trong `PUBLIC_*` biến môi trường hoặc phía frontend. Nếu tính năng fetch URL của người dùng, phải xét SSRF, redirect, private IP, quotas và quyền nội dung; không triển khai arbitrary URL proxy thiếu kiểm soát.
- `aih verify` chỉ đưa ra checklist, không chạy build. Chỉ chạy các lệnh **thực có trong package.json**, ví dụ `npm run build`, `npm run check` nếu có, cùng browser UX tests. Con người duyệt trước bất kỳ cloud deployment/DNS thay đổi nào.

## 6. Scale lên Micro Frontend khi cần

**Giai đoạn 1:** một Astro repository, các route/tool độc lập.

**Giai đoạn 2:** các React Islands hoặc shared UI packages được phép dùng, vẫn trong một build/deploy. Có thể dùng monorepo khi cần quản lý code dùng chung, nhưng chưa phải MFE.

**Giai đoạn 3:** khi một tool cần team, release cadence hoặc runtime riêng, tách **một route** (ví dụ `/tools/image-editor`) ra ứng dụng deploy riêng qua routing/proxy phù hợp. Kiểm tra domain, deep links, assets, CSP/cookies/auth, analytics, SEO/canonicals, lỗi và rollback trước cut-over. Không mặc định Module Federation.

Prompt ra quyết định:

> Dựa vào docs, ownership và deploy hiện tại, đánh giá tách image-editor thành MFE hay giữ Astro Island. So sánh khả năng deploy độc lập, SEO, routing, caching, cookie/auth, bundle và chi phí vận hành. Chỉ đề xuất kiến trúc sau khi có nhu cầu thực; ghi ADR/approval và migration steps, chưa tự triển khai.

## Optional: AdSense revenue model

Nếu mục tiêu website là quảng cáo, có thể cài capability `monetization` bên cạnh adapter Astro. Dự án đã cài hãy cập nhật `.notth/project.json` và dùng `aih update` sau khi review. Đọc [Astro + AdSense walkthrough](astro-adsense-microtools.md) để phân biệt build tool với publisher compliance, đặt quảng cáo tránh Generate/Download và đo Page RPM. `aih` không tự nhúng script, tạo ad account hay cam kết doanh thu.

## 7. Test và PR review

```bash
aih verify --scope all  # advisory, không thực thi test
aih eval --scope all    # dataset/review template, không gọi model
aih check
```

Dùng Core review/TDD và `harness-astro-performance` để ghi bằng chứng build/browser thực chạy, và SA/approved ADR khi có yêu cầu deployment độc lập. Hoàn tất spec → code → tests → human PR review. Harness không deploy/merge tự động.

## Tài liệu chính thức

- [Astro islands và framework components](https://docs.astro.build/en/guides/framework-components/)
- [Astro + Cloudflare deployment](https://docs.astro.build/en/guides/deploy/cloudflare/)
- [Astro sitemap integration](https://docs.astro.build/en/guides/integrations-guide/sitemap/)
- [Astro adapter](../../adapters/astro/README.md)
- [Full SDLC](../end-to-end-workflow.md)
