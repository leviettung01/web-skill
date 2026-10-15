# SrcTool AI — Website Bán Source Code & Tool AI Tạo Video

## Tổng quan dự án
- **Tên**: SrcTool AI
- **Mục tiêu**: Nền tảng thương mại điện tử bán sản phẩm số (source code tool AI tạo video, chatbot viết kịch bản, bộ prompt Veo 3, tool automation, combo) với giao source code **tự động 24/7** sau thanh toán.
- **Tham chiếu**: Kết hợp mô hình của `toolkichban.com` (landing bán bộ tool) và `maulamvideo.com` (marketplace chatbot/prompt AI, cấu trúc `/chatbotprompt`, `/prompts`, `/combo`, `/pricing`, `/affiliate`).

## URLs
- **Dev (sandbox)**: https://3000-io1djtub3aoqcps5eqvoq-0e616f0a.sandbox.novita.ai
- **Production**: (chưa deploy — xem mục Deployment)

### Tài khoản demo
| Vai trò | Email | Mật khẩu |
|---|---|---|
| Khách hàng | `demo@srctool.ai` | `123456` |
| Quản trị viên | `admin@srctool.ai` | `123456` |

---

## ✅ Tính năng đã hoàn thành

### Khách hàng (Frontend)
- **Trang chủ**: hero gradient động, marquee thương hiệu AI, danh mục, sản phẩm nổi bật, banner combo, tab Bán chạy/Mới ra mắt, 6 lợi ích, quy trình 4 bước, testimonial thật từ DB, blog, FAQ accordion, CTA.
- **Danh sách sản phẩm**: lọc theo danh mục / loại / khoảng giá / từ khoá, 6 kiểu sắp xếp, phân trang, chip filter đang áp dụng.
- **Chi tiết sản phẩm**: video demo YouTube nhúng, gallery, giá gạch + % giảm, tính năng, tech stack, 3 tab (Mô tả HTML / Đánh giá có biểu đồ sao / Chính sách), sản phẩm liên quan, hiển thị nội dung combo, sidebar cam kết + hỗ trợ dính (sticky).
- **Đăng ký / Đăng nhập**: split-screen chuyên nghiệp, JWT HS256 trong httpOnly cookie, mật khẩu PBKDF2-SHA256 100k vòng lặp, hỗ trợ link giới thiệu `?ref=CODE`.
- **Giỏ hàng**: lưu server-side (đồng bộ đa thiết bị), badge realtime, chặn thêm sản phẩm đã sở hữu.
- **Thanh toán**: 3 phương thức (VietQR / MoMo / Số dư ví), áp mã giảm giá realtime AJAX, ghi chú đơn.
- **Trang đơn hàng**: mã **QR VietQR tự sinh** đúng số tiền + nội dung CK, nút copy từng trường, **ô trạng thái đối soát realtime** tự polling mọi 5 giây và tự chuyển trang khi nhận được tiền.
- **Xác thực thanh toán tự động**: tích hợp **webhook ngân hàng SePay / Casso** — khách chuyển khoản xong, hệ thống tự đối soát biến động số dư và giao hàng trong ~10–60 giây mà không cần admin can thiệp (xem mục [Webhook ngân hàng](#-webhook-ngân-hàng-xác-thực-thanh-toán-tự-động)).
- **Giao hàng tự động**: sau khi đơn `paid` → hệ thống cấp **license key** + mở khoá link source code. Mua combo tự động cấp license cho **tất cả sản phẩm con**.
- **Khu vực tài khoản**: Tổng quan (4 thẻ thống kê), Sản phẩm của tôi (link tải + license key + đếm lượt tải), Đơn hàng, Yêu thích, Affiliate, Hồ sơ (đổi tên/SĐT/mật khẩu).
- **Affiliate**: mã giới thiệu riêng, link copy, hoa hồng 20% tự động cộng vào ví khi người được giới thiệu mua hàng, bảng danh sách referral.
- **Đánh giá**: chỉ người đã mua mới được đánh giá, tự động tính lại rating trung bình.
- **Blog**: danh sách + tìm kiếm + phân trang, chi tiết bài viết, bài liên quan, đếm lượt xem.
- **Trang tĩnh**: Bảng giá (3 gói + bảng so sánh), Giới thiệu, Liên hệ (form ticket), Affiliate landing, Hướng dẫn mua hàng, Chính sách, Điều khoản, 404.

### Quản trị (Admin Panel `/admin`)
- **Dashboard**: 4 KPI (doanh thu, đơn, thành viên, sản phẩm), biểu đồ cột doanh thu 7 ngày, top sản phẩm bán chạy, đơn hàng gần đây.
- **Sản phẩm**: CRUD đầy đủ, form quản lý link source code / tài liệu / video demo / tính năng / tech stack, đánh dấu Nổi bật / HOT / Mới, auto-slug tiếng Việt.
- **Đơn hàng**: lọc theo trạng thái, tìm kiếm, xem chi tiết, **duyệt thanh toán** (tự cấp license), huỷ đơn, hoàn tiền (thu hồi license + hoàn vào ví).
- **Giao dịch ngân hàng** (`/admin/giao-dich`): sổ giao dịch nhận từ webhook, 5 thẻ thống kê (tổng/khớp/chưa khớp/lệch tiền/doanh thu), lọc theo trạng thái đối soát, tìm kiếm theo nội dung CK, **gán thủ công** giao dịch lạc cho đơn hàng, copy Webhook URL / API Key, sinh lại API key, hướng dẫn cấu hình 4 bước ngay trên trang.
- **Thành viên**: tìm kiếm, xem tổng chi tiêu, khoá/mở khoá tài khoản, đổi vai trò admin/user.
- **Danh mục / Mã giảm giá / Bài viết / Đánh giá / Ticket hỗ trợ**: CRUD.
- **Cài đặt**: tên site, hotline, email, Zalo, thông tin ngân hàng (dùng cho VietQR), % hoa hồng affiliate, **cấu hình webhook** (nhà cung cấp, thời gian giữ đơn, sai số cho phép, bật/tắt chế độ DEMO).

### SEO & kỹ thuật
- SSR toàn bộ (tốt cho SEO), meta description + Open Graph, `sitemap.xml` động, `robots.txt`, HTML ngữ nghĩa (`header/nav/main/section/article/aside/footer`), id có ý nghĩa.

---

## Kiến trúc dữ liệu

**Storage**: Cloudflare D1 (SQLite) — 14 bảng:

| Bảng | Mô tả |
|---|---|
| `users` | Tài khoản, role, ví, mã affiliate, người giới thiệu |
| `categories` | Danh mục sản phẩm |
| `products` | Sản phẩm (có `download_url` = link source code, chỉ trả sau khi mua) |
| `combo_items` | Sản phẩm con thuộc combo |
| `orders` / `order_items` | Đơn hàng và chi tiết |
| `licenses` | **Quyền sở hữu** — license key + đếm lượt tải (bảng cốt lõi để giao source) |
| `reviews` | Đánh giá (chỉ người đã mua) |
| `coupons` | Mã giảm giá (percent/fixed, min_order, giới hạn lượt) |
| `posts` | Bài viết blog |
| `cart_items` / `wishlists` | Giỏ hàng & yêu thích server-side |
| `settings` | Cấu hình site (key-value) |
| `tickets` | Yêu cầu hỗ trợ |
| `bank_transactions` | **Sổ giao dịch ngân hàng** nhận từ webhook — nguồn sự thật để đối soát |

**Luồng giao hàng**: `Đơn paid` → `grantLicenses()` → tạo bản ghi `licenses` (kèm license key) → khách truy cập `/tai-khoan/san-pham` → bấm tải qua `/tai-xuong/:licenseId` (route bảo vệ, đếm lượt tải rồi redirect tới link thật).

---

## 🏦 Webhook ngân hàng (xác thực thanh toán tự động)

Hỗ trợ **SePay** (`sepay.vn`) và **Casso** (`casso.vn`). Khi khách chuyển khoản, hệ thống tự đối soát và cấp source code trong ~10–60 giây, không cần admin can thiệp.

### Endpoint

```
POST /api/webhook/bank
Authorization: Apikey <webhook_api_key>
```

Chấp nhận 3 dạng header xác thực: `Apikey <key>`, `Bearer <key>`, hoặc `Secure-Token: <key>`. So sánh token dùng thuật toán constant-time chống timing-attack.

### Cách cấu hình (4 bước)

1. Đăng ký SePay/Casso → liên kết tài khoản ngân hàng nhận tiền
2. Vào `/admin/giao-dich` → copy **Webhook URL** và **API Key** (bấm 🔄 để sinh key mới)
3. Dán vào dashboard SePay/Casso, chọn sự kiện **tiền vào (money in)**
4. Vào `/admin/cai-dat` → **bỏ tick "Bật chế độ DEMO"** để buộc mọi đơn phải có giao dịch thật

### Logic đối soát

Mã đơn có dạng `DH` + 8 ký tự (VD `DHFT6A8R8X`) và được tách khỏi nội dung chuyển khoản bằng regex sau khi chuẩn hoá (in hoa + loại bỏ ký tự không phải chữ/số). Nhờ vậy vẫn khớp khi ngân hàng bóp méo nội dung:

| Nội dung CK thực tế | Kết quả |
|---|---|
| `DHFT6A8R8X` | ✅ khớp |
| `CT DEN:0987654321 DHFT6A8R8X TU NGUYEN VAN A` | ✅ khớp (bank chèn text) |
| `thanhtoandondhft6a8r8x ok` | ✅ khớp (chữ thường, liền không dấu cách) |
| `DH-FT6A8R8X` | ✅ khớp (có dấu gạch) |

### Các trạng thái giao dịch

| `match_status` | Ý nghĩa | Hành động của hệ thống |
|---|---|---|
| `matched` | Khớp đơn, đủ tiền | ✅ Chuyển đơn `paid` + cấp license + trả hoa hồng affiliate |
| `unmatched` | Không tìm được mã đơn | ⏸ Lưu lại, chờ admin gán thủ công |
| `amount_mismatch` | Đúng đơn nhưng thiếu tiền | ⏸ Không cấp hàng, cảnh báo admin |
| `duplicate` | Đơn đã `paid` trước đó | ⚠️ Ghi nhận để admin xem xét hoàn tiền |
| `ignored` | Giao dịch tiền ra | Bỏ qua |

### Các cơ chế an toàn

- **Idempotency**: unique index trên `(provider, provider_tx_id)` — webhook gửi lại cùng giao dịch sẽ không cấp hàng 2 lần
- **Chuyển thừa tiền**: phần thừa tự động cộng vào ví khách
- **Sai số cho phép**: cấu hình `amount_tolerance` (mặc định 0 = khớp tuyệt đối)
- **Đối soát thủ công**: admin gán giao dịch lạc cho đơn qua nút "Gán đơn" tại `/admin/giao-dich`
- **Polling phía khách**: trang đơn hàng tự kiểm tra `/api/orders/:code/status` mỗi 5 giây (tối đa 20 phút) và tự chuyển trang khi nhận được tiền

### Test webhook bằng curl

```bash
curl -X POST http://localhost:3000/api/webhook/bank \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Apikey YOUR_KEY' \
  -d '{
    "id": 92704, "gateway": "MBBank",
    "transactionDate": "2026-07-28 14:02:37",
    "accountNumber": "0987654321",
    "content": "CT DEN:0987654321 DHFT6A8R8X TU NGUYEN VAN A",
    "transferType": "in", "transferAmount": 2990000,
    "referenceCode": "MBVCB.3278907687"
  }'
```

---

## Hướng dẫn sử dụng nhanh

**Khách hàng**: Đăng ký → chọn sản phẩm → thêm giỏ → thanh toán (quét VietQR, ghi nội dung là **mã đơn**) → hệ thống tự xác nhận qua webhook ngân hàng trong ~10–60 giây → nhận link source code tại **Tài khoản → Sản phẩm của tôi**.

**Admin**: Đăng nhập `admin@srctool.ai` → `/admin` → thêm sản phẩm (nhớ điền **Link source code**) → cấu hình webhook tại `/admin/giao-dich` → theo dõi đối soát và gán thủ công giao dịch lạc → cấu hình tài khoản ngân hàng tại `/admin/cai-dat`.

---

## Chưa triển khai / Bước tiếp theo đề xuất

1. **Email giao dịch**: gửi email xác nhận đơn + license key (dùng Resend / SendGrid qua REST API).
2. **Quên mật khẩu tự động**: hiện xử lý thủ công qua Zalo; nên thêm luồng gửi OTP/link reset qua email.
3. **Upload ảnh**: hiện nhập URL ảnh; nên tích hợp Cloudflare R2 để upload trực tiếp.
4. **Rút hoa hồng affiliate**: thêm luồng yêu cầu rút tiền + duyệt trong admin.
5. **Rate limiting** cho API đăng nhập (chống brute-force) qua Cloudflare KV.
6. **Tự huỷ đơn quá hạn**: cột `expires_at` đã có trong DB; cần thêm Cron Trigger để huỷ đơn `pending` quá `payment_timeout_minutes`.
7. **Trang so sánh sản phẩm** và **gợi ý cá nhân hoá**.

---

## Deployment

- **Nền tảng**: Cloudflare Pages + D1
- **Trạng thái**: ✅ Chạy local sandbox / ⏳ Chưa deploy production
- **Tech Stack**: Hono 4 + TypeScript (JSX SSR) + TailwindCSS (CDN) + Cloudflare D1 + Vite + Wrangler
- **Cập nhật lần cuối**: 2026-07-28

### Lệnh thường dùng
```bash
npm run build              # Build
npm run db:migrate:local   # Áp migration local
npm run db:seed            # Nạp dữ liệu mẫu
npm run db:reset           # Reset sạch DB local
pm2 start ecosystem.config.cjs   # Chạy dev server port 3000
pm2 logs webapp --nostream       # Xem log
```

### Deploy production
```bash
npx wrangler d1 create webapp-production   # Tạo DB thật, copy database_id vào wrangler.jsonc
npx wrangler d1 migrations apply webapp-production
npx wrangler d1 execute webapp-production --file=./seed.sql
npm run deploy:prod

# Sau khi deploy: vào /admin/giao-dich sinh API key webhook mới,
# dán Webhook URL + API Key vào dashboard SePay/Casso,
# rồi vào /admin/cai-dat bỏ tick "Bật chế độ DEMO".
```
> ⚠️ Sau khi deploy, đổi mật khẩu tài khoản `admin@srctool.ai` và cập nhật thông tin ngân hàng tại `/admin/cai-dat`.
