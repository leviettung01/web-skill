# HƯỚNG DẪN DEPLOY WEBSKILL AI LÊN CLOUDFLARE PAGES (MIỄN PHÍ)

Làm trên **máy tính thật** của bạn (Windows/Mac đều được). Cần cài sẵn **Node.js 20 LTS**: https://nodejs.org

## Bước 1 — Giải nén source
Giải nén file `webskill-ai-source.zip` ra một thư mục, ví dụ `webskill-ai`.

## Bước 2 — Cài đặt thư viện
Mở Terminal (Mac) hoặc PowerShell (Windows), cd vào thư mục vừa giải nén:

```
cd webskill-ai
npm install --legacy-peer-deps
```

## Bước 3 — Đăng nhập Cloudflare
```
npx wrangler login
```
Trình duyệt sẽ tự mở trang Cloudflare → đăng nhập (hoặc tạo tài khoản miễn phí) → bấm **Allow**.

## Bước 4 — Tạo database D1
```
npx wrangler d1 create webapp-production
```
Lệnh in ra một `database_id` — cứ để đó, không cần làm gì thêm.

## Bước 5 — Nạp dữ liệu mẫu (sản phẩm, danh mục, tài khoản demo)
Chạy lần lượt 3 lệnh (mỗi lệnh chờ báo thành công rồi chạy tiếp):

```
npx wrangler d1 execute webapp-production --remote --file=migrations/0001_initial_schema.sql
npx wrangler d1 execute webapp-production --remote --file=migrations/0002_bank_webhook.sql
npx wrangler d1 execute webapp-production --remote --file=seed.sql
```

## Bước 6 — Deploy web
```
npm run build
npx wrangler pages deploy dist --project-name=webskill-ai
```
Cuối lệnh sẽ in ra link dạng `https://webskill-ai-xxx.pages.dev` — đó là web của bạn.

## Bước 7 — Gắn database vào web (làm 1 lần duy nhất)
1. Vào https://dash.cloudflare.com → **Workers & Pages** → bấm vào project **webskill-ai**
2. Vào **Settings** → **Bindings** (hoặc **Functions** → **D1 database bindings**)
3. Bấm **Add binding** → Variable name điền đúng: `DB` → chọn D1 database **webapp-production** → Save/Deploy
4. Mở lại link web — đăng nhập thử tài khoản demo: `demo@webskill.ai` / `123456`

## Cập nhật web sau này
Mỗi lần sửa code xong, chỉ cần chạy lại từ thư mục project:
```
npm run build
npx wrangler pages deploy dist --project-name=webskill-ai
```

## Lưu ý
- Tài khoản admin: `admin@webskill.ai` / `123456` (đổi mật khẩu sau khi đăng nhập)
- Vào `/admin` để dán **link tải thật** cho từng sản phẩm và cập nhật **thông tin ngân hàng** ở Cài đặt
- Gói miễn phí Cloudflare: 100.000 request/ngày, D1 5GB — thoải mái cho shop mới
