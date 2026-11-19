-- ============================================================
-- Migration 0004 (PostgreSQL): Skill AI Agent (MCP) product type
-- Hỗ trợ kết nối trực tiếp MCP cho Claude, Codex, Antigravity
-- ============================================================

-- Bổ sung metadata MCP cho bảng products
ALTER TABLE products ADD COLUMN IF NOT EXISTS mcp_endpoint TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS mcp_server_name TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS mcp_clients TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS mcp_tools TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS mcp_skill_prompt TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS mcp_render_webhook TEXT;

-- Theo dõi số lần AI Agent gọi MCP qua License Key
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS mcp_call_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS last_mcp_call_at TIMESTAMPTZ;

-- Sắp xếp ưu tiên 2 danh mục đang mở bán lên đầu
UPDATE categories SET sort_order = 1 WHERE slug = 'skill-video-ai';
UPDATE categories SET sort_order = 3 WHERE slug = 'khoa-hoc-video-ai';
UPDATE categories SET sort_order = 4 WHERE slug = 'chatbot-ai';
UPDATE categories SET sort_order = 5 WHERE slug = 'app-video-ai';
UPDATE categories SET sort_order = 6 WHERE slug = 'combo';

-- Đồng bộ sequence (tránh lỗi duplicate id khi DB đã seed bằng id cố định)
SELECT setval(pg_get_serial_sequence('categories', 'id'), COALESCE((SELECT MAX(id) FROM categories), 1), (SELECT COUNT(*) > 0 FROM categories));
SELECT setval(pg_get_serial_sequence('products', 'id'), COALESCE((SELECT MAX(id) FROM products), 1), (SELECT COUNT(*) > 0 FROM products));

-- Thêm danh mục mới: Skill AI Agent (MCP)
INSERT INTO categories (slug, name, description, icon, color, sort_order) VALUES
  ('skill-ai-agent-mcp',
   'Skill AI Agent (MCP)',
   'Skill kết nối trực tiếp dạng MCP cho Claude, Codex, Antigravity — AI Agent tự gọi tool và tạo video theo Skill, không cần tải về làm thủ công',
   'fa-plug-circle-bolt',
   'cyan',
   2)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  color = EXCLUDED.color,
  sort_order = EXCLUDED.sort_order;

-- Thêm 2 sản phẩm mẫu Skill AI Agent (MCP) đang mở bán
INSERT INTO products (
  slug, name, category_id, short_desc, description, features, tech_stack, version,
  price, original_price, thumbnail, demo_video_url, demo_url, download_url, doc_url,
  file_size, product_type, is_featured, is_hot, is_new, status,
  sold_count, view_count, rating, rating_count,
  mcp_endpoint, mcp_server_name, mcp_clients, mcp_tools, mcp_skill_prompt, mcp_render_webhook
) VALUES (
  'mcp-skill-agent-video-viral-30s',
  'MCP Skill AI Agent — Tự Động Tạo Video Viral 30s (Claude / Codex / Antigravity)',
  (SELECT id FROM categories WHERE slug = 'skill-ai-agent-mcp'),
  'Skill MCP kết nối trực tiếp vào Claude, Codex, Antigravity: AI Agent tự gọi tool nạp quy trình Skill, sinh kịch bản khóa nhân vật và xuất lệnh tạo video 30s chuẩn viral ngay trong cuộc hội thoại.',
  '<h3>Điểm khác biệt so với Skill tự tải truyền thống</h3><p>Với <b>Skill tự tải</b>, bạn cần tải file ZIP/Drive về đọc hướng dẫn rồi tự copy-paste từng prompt sang công cụ tạo video. Với <b>MCP Skill AI Agent</b>, bạn chỉ cần dán cấu hình MCP 1 lần vào <b>Claude, Codex hoặc Antigravity</b> — từ đó AI Agent sẽ tự gọi trực tiếp về MCP Server bằng License Key của bạn để nạp blueprint, tách cảnh khóa nhân vật và tạo video 30s theo đúng chuẩn Skill.</p><h3>AI Agent của bạn sẽ làm được gì?</h3><ul><li><b>Tự động nạp Skill Blueprint:</b> Agent gọi <code>get_skill_blueprint</code> để lấy công thức Hook 3s, quy tắc khóa nhân vật/ánh sáng và cấu trúc 4 phân đoạn 30s.</li><li><b>Tự sinh Storyboard &amp; Prompt đa model:</b> Agent gọi <code>generate_video_storyboard</code> để tạo bộ prompt từng cảnh chuẩn Seedance 2.5, Muse AI hoặc Veo 3 kèm lời thoại tiếng Việt.</li><li><b>Tự kích hoạt pipeline tạo video:</b> Agent gọi <code>create_video_from_skill</code> để xuất gói render chuẩn 9:16 (hoặc đẩy thẳng sang render API/webhook nếu bạn kết nối) kèm phụ đề SRT &amp; caption đăng TikTok/Reels.</li><li><b>Luôn nhận bản Skill mới nhất:</b> Khi KhoSkill nâng cấp công thức prompt hoặc model mới, Agent tự động nhận bản mới qua MCP mà bạn không cần tải lại file.</li></ul><h3>Hỗ trợ đầy đủ AI Agent phổ biến</h3><p>Cung cấp sẵn đoạn cấu hình copy-paste trong mục <b>Sản phẩm của tôi</b> cho <b>Claude Code / Claude Desktop</b>, <b>OpenAI Codex</b> và <b>Antigravity</b>. Cài đặt xong trong chưa đầy 30 giây.</p>',
  '["Kết nối trực tiếp MCP vào Claude, Codex, Antigravity trong 30 giây","AI Agent tự gọi tool tạo kịch bản, prompt khóa nhân vật & pipeline video 30s","Không cần tải file thủ công hay copy-paste rời rạc từng bước","Xác thực bảo mật bằng License Key riêng — gọi không giới hạn","Hỗ trợ chuẩn Streamable HTTP MCP (JSON-RPC 2.0) mới nhất","Tự động đồng bộ bản nâng cấp Skill từ server trọn đời"]',
  '["MCP Protocol","Claude","Codex","Antigravity","Seedance 2.5","Veo 3","Muse AI"]',
  'v1.0 MCP',
  990000,
  1990000,
  '/static/mcp-skill-viral-cover.svg',
  'https://pub-f4217cb984184329a6951a68b9bd0b7c.r2.dev/videos/demo-khoa-hoc-seedance.mp4',
  '',
  '',
  '',
  'MCP Live API',
  'mcp_skill',
  1,
  1,
  1,
  'published',
  64,
  4820,
  5.0,
  29,
  '',
  'khoskill-video-viral',
  '["Claude","Codex","Antigravity"]',
  '[{"name":"list_licensed_skills","description":"Liệt kê toàn bộ Skill MCP đang hoạt động theo License Key của bạn"},{"name":"get_skill_blueprint","description":"Nạp toàn bộ quy trình, luật khóa nhân vật, công thức Hook-Body-CTA và template prompt của Skill"},{"name":"generate_video_storyboard","description":"Tự động tách chủ đề thành storyboard 30s (4 cảnh) kèm prompt tối ưu cho Seedance 2.5 / Muse AI / Veo 3"},{"name":"create_video_from_skill","description":"Chạy pipeline tạo video theo chuẩn Skill, trả về gói render job + SRT phụ đề hoặc gọi render webhook trực tiếp"}]',
  '# SKILL BLUEPRINT: AI AGENT VIDEO VIRAL 30S (MCP)

## 1. Mục tiêu đầu ra
- Tạo video ngắn 30 giây tỷ lệ 9:16 (TikTok / Facebook Reels / YouTube Shorts) có tỷ lệ giữ chân cao (>65% ở mốc 3s đầu).
- Duy trì tính đồng nhất tuyệt đối về **nhân vật, trang phục, ánh sáng, tông màu và không gian** xuyên suốt toàn bộ video.

## 2. Cấu trúc 4 phân đoạn chuẩn Viral 30s
1. **Cảnh 1 — Visual Hook (00:00 - 00:05)**: Mở đầu bằng chuyển động mạnh, kết quả gây tò mò hoặc câu hỏi đánh trúng nỗi đau. Camera đẩy nhanh (fast push-in / whip pan).
2. **Cảnh 2 — Bối cảnh & Vấn đề (00:05 - 00:13)**: Minh hoạ vấn đề thực tế người xem gặp phải. Ánh sáng tương phản vừa phải, góc máy medium shot.
3. **Cảnh 3 — Giải pháp & Biến đổi (00:13 - 00:24)**: Phô diễn quy trình/sản phẩm tạo ra sự thay đổi rõ rệt (Before -> After). Góc máy close-up sắc nét, chi tiết chân thực.
4. **Cảnh 4 — Payoff & CTA (00:24 - 00:30)**: Khung hình thành quả đẹp nhất + lời kêu gọi hành động tự nhiên (bình luận / lưu clip / bấm giỏ hàng).

## 3. Quy tắc khóa nhân vật & phong cách (Character & Style Lock)
- Luôn định nghĩa 1 **Character Anchor** cố định (độ tuổi, kiểu tóc, trang phục, phụ kiện, bối cảnh nền) và lặp lại nguyên văn ở đầu prompt mọi cảnh.
- Khóa thông số máy quay: `9:16 vertical, 24fps cinematic realism, natural Vietnamese daylight, soft rim lighting, consistent color grading, no text artifacts, no extra fingers`.
- Với **Seedance 2.5**: ưu tiên prompt one-take liên mạch 15-30s kèm âm thanh native môi trường.
- Với **Muse AI**: tách từng clip 10s, viết lời thoại tiếng Việt ngắn (18-24 từ/10s) để lip-sync khớp khẩu hình tự nhiên.
- Với **Veo 3**: mô tả rõ chuyển động camera + âm thanh SFX môi trường ở cuối mỗi prompt.

## 4. Quy trình thực thi bắt buộc cho AI Agent
1. Thu thập chủ đề, sản phẩm/ngách, đối tượng xem và model mục tiêu từ người dùng.
2. Gọi `generate_video_storyboard` để tạo đủ 4 cảnh có khóa nhân vật, lời thoại và phụ đề.
3. Gọi `create_video_from_skill` để đóng gói render pipeline (hoặc gửi lệnh render tự động qua webhook/API nếu có).
4. Kiểm tra QC trước khi bàn giao: đủ hook 3s, khớp thời lượng 30s, prompt tiếng Anh chuẩn kỹ thuật + voiceover tiếng Việt tự nhiên + caption & 5 hashtag ngách.',
  ''
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO products (
  slug, name, category_id, short_desc, description, features, tech_stack, version,
  price, original_price, thumbnail, demo_video_url, demo_url, download_url, doc_url,
  file_size, product_type, is_featured, is_hot, is_new, status,
  sold_count, view_count, rating, rating_count,
  mcp_endpoint, mcp_server_name, mcp_clients, mcp_tools, mcp_skill_prompt, mcp_render_webhook
) VALUES (
  'mcp-skill-agent-affiliate-tiktok',
  'MCP Skill AI Agent — Tự Động Sản Xuất Video Affiliate TikTok Shop',
  (SELECT id FROM categories WHERE slug = 'skill-ai-agent-mcp'),
  'Kết nối MCP vào Claude, Codex, Antigravity: chỉ cần đưa tên hoặc thông tin sản phẩm, AI Agent tự gọi Skill xuất trọn bộ kịch bản chốt đơn, prompt cảnh quay 9:16, voiceover & lệnh tạo video Affiliate.',
  '<h3>Tự động hoá dây chuyền làm video Affiliate bằng AI Agent</h3><p>Thay vì tải bộ prompt về máy rồi tự chỉnh sửa từng câu chữ cho mỗi sản phẩm mới, <b>MCP Skill Affiliate TikTok Shop</b> biến <b>Claude, Codex và Antigravity</b> thành trợ lý sản xuất video chốt đơn chuyên nghiệp qua kết nối MCP trực tiếp.</p><h3>Quy trình Agent chạy tự động qua MCP</h3><ul><li><b>Bước 1:</b> Nhập tên sản phẩm, điểm bán hàng (USP) và giá ưu đãi vào Claude / Codex / Antigravity.</li><li><b>Bước 2:</b> Agent tự động gọi MCP tool nạp bộ <b>25 công thức Hook chốt đơn</b> &amp; cấu trúc PAS/AIDA tối ưu cho TikTok Shop.</li><li><b>Bước 3:</b> Agent gọi <code>create_video_from_skill</code> xuất bộ prompt khóa sản phẩm/nhân vật, lời thoại lip-sync tiếng Việt, file phụ đề SRT và thông số render hàng loạt.</li><li><b>Bước 4:</b> Xuất sẵn nhiều biến thể Hook để bạn chạy test A/B tìm video win cực nhanh.</li></ul><h3>Phù hợp với ai?</h3><p>Chủ shop TikTok Shop, KOC/Affiliate creator, team media muốn scale 10–30 video bán hàng mỗi ngày ngay trong Claude, Codex hoặc Antigravity.</p>',
  '["Tích hợp trực tiếp vào Claude, Codex, Antigravity qua MCP","Đưa tên sản phẩm -> Agent tự xuất trọn gói kịch bản + prompt + lệnh render","Sẵn 25 khung Hook giữ chân 3 giây & CTA chuẩn TikTok Shop","Sinh nhanh 3 biến thể Hook để test A/B tìm clip ra đơn","Xuất kèm script voiceover tiếng Việt, phụ đề SRT và hashtag ngách","Cập nhật công thức chốt đơn mới trực tiếp từ MCP Server"]',
  '["MCP Protocol","Claude","Codex","Antigravity","Muse AI","Seedance 2.5","CapCut"]',
  'v1.0 MCP',
  890000,
  1790000,
  '/static/mcp-skill-affiliate-cover.svg',
  'https://pub-f4217cb984184329a6951a68b9bd0b7c.r2.dev/videos/demo-skill-fitness.mp4',
  '',
  '',
  '',
  'MCP Live API',
  'mcp_skill',
  1,
  0,
  1,
  'published',
  41,
  3190,
  4.9,
  18,
  '',
  'khoskill-affiliate-agent',
  '["Claude","Codex","Antigravity"]',
  '[{"name":"list_licensed_skills","description":"Kiểm tra danh sách MCP Skill đã kích hoạt"},{"name":"get_skill_blueprint","description":"Nạp công thức Hook 3s, cấu trúc bán hàng PAS/AIDA và luật khóa sản phẩm TikTok Shop"},{"name":"generate_video_storyboard","description":"Tạo storyboard 30s chốt đơn + 3 biến thể Hook theo tên sản phẩm và USP"},{"name":"create_video_from_skill","description":"Xuất gói render video Affiliate 9:16 hoàn chỉnh kèm voiceover, phụ đề SRT & CTA giỏ hàng"}]',
  '# SKILL BLUEPRINT: AI AGENT AFFILIATE TIKTOK SHOP (MCP)

## 1. Công thức chuyển đổi 30s (Hook - Agitate - Demo - Social Proof - CTA)
- **00:00 - 00:04 (Hook Chặn Cuộn)**: Gọi thẳng tệp khách hàng + cảnh cận sản phẩm đang hoạt động thực tế. Tránh mở bài chung chung.
- **00:04 - 00:10 (Nỗi đau thực tế)**: Nêu 1 vấn đề cụ thể gây khó chịu hằng ngày (tốn thời gian, dễ hỏng, không hiệu quả).
- **00:10 - 00:21 (Demo USP sản phẩm)**: Tập trung 2 lợi ích mạnh nhất bằng góc quay cận (macro / close-up) chứng minh trực quan.
- **00:21 - 00:26 (Bằng chứng & Xử lý từ chối)**: So sánh giá trị/chi phí hoặc độ bền thực tế.
- **00:26 - 00:30 (CTA Giỏ Hàng)**: Chỉ rõ giỏ hàng góc trái màn hình + ưu đãi giới hạn tự nhiên, không vi phạm chính sách TikTok.

## 2. Quy tắc giữ sản phẩm & KOC đồng nhất
- Khóa ngoại hình KOC (nhân vật review người Việt trẻ trung, ánh sáng phòng sáng sạch, góc quay handheld chân thực kiểu UGC).
- Khóa mô tả sản phẩm (màu sắc, hình dáng, chất liệu) ở mọi cảnh để AI không biến dạng bao bì.
- Giọng đọc nhanh vừa (150-165 từ/phút), câu ngắn dưới 12 từ, ngắt nhịp rõ để dễ cắt phụ đề nổ chữ.

## 3. Chiến lược A/B Test Hook
- Mỗi lần chạy Skill luôn đề xuất kèm **3 biến thể Hook đầu 3 giây** (1: Đánh vào nỗi đau, 2: Review bất ngờ/so sánh, 3: Kết quả trước - sau) để người dùng nhân bản nhanh 3 video từ cùng 1 phần thân.',
  ''
)
ON CONFLICT (slug) DO NOTHING;
