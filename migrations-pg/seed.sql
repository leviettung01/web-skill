-- ============================================
-- WEBSKILL AI - SEED DATA
-- Website bán Chatbot, Skill, App & Khóa học làm video AI
-- Mật khẩu mặc định của tất cả tài khoản demo: 123456
-- hash = PBKDF2-SHA256, 100000 iter, salt cố định trong seed
-- LƯU Ý: các download_url / doc_url dạng WEBSKILL-* là placeholder,
-- admin cập nhật link thật tại /admin sau khi deploy.
-- ============================================

DELETE FROM combo_items;
DELETE FROM order_items;
DELETE FROM orders;
DELETE FROM licenses;
DELETE FROM reviews;
DELETE FROM cart_items;
DELETE FROM wishlists;
DELETE FROM products;
DELETE FROM categories;
DELETE FROM coupons;
DELETE FROM posts;
DELETE FROM users;
DELETE FROM settings;

-- ---------- SETTINGS ----------
INSERT INTO settings (key, value) VALUES
  ('site_name', 'KhoSkill AI'),
  ('site_tagline', 'Kho Skill AI tạo video chuyên nghiệp'),
  ('hotline', '0915967790'),
  ('zalo', '0915967790'),
  ('email', 'support@khoskill.site'),
  ('facebook', 'https://facebook.com/khoskillai'),
  ('bank_name', 'MB Bank'),
  ('bank_code', 'MB'),
  ('bank_account', '0987654321'),
  ('bank_owner', 'NGUYEN VAN A'),
  ('affiliate_percent', '20'),
  ('payment_provider', 'sepay'),
  ('auto_confirm_manual', '0'),
  ('payment_timeout_minutes', '60'),
  ('amount_tolerance', '0'),
  ('webhook_api_key', 'CHANGE_ME_SECRET');

-- ---------- CATEGORIES ----------
INSERT INTO categories (id, slug, name, description, icon, color, sort_order) VALUES
  (1, 'khoa-hoc-video-ai', 'Khóa học Video AI', 'Lộ trình học làm video AI từ cơ bản đến nâng cao (Chưa mở bán)', 'fa-graduation-cap', 'indigo', 3),
  (2, 'skill-video-ai', 'Skill Tạo Video AI', 'Bộ Skill đóng gói theo công cụ & ngách: Muse AI, Seedance 2.5, Thuỷ Sinh, Làm Vườn, Affiliate Fitness — tự tải về & làm theo', 'fa-wand-magic-sparkles', 'fuchsia', 1),
  (6, 'skill-ai-agent-mcp', 'Skill AI Agent (MCP)', 'Skill kết nối trực tiếp dạng MCP cho Claude, Codex, Antigravity — AI Agent tự gọi tool và tạo video theo Skill', 'fa-plug-circle-bolt', 'cyan', 2),
  (3, 'chatbot-ai', 'Chatbot AI', 'Chatbot viết kịch bản, sinh prompt tạo video theo ngành hàng (Chưa mở bán)', 'fa-robot', 'violet', 4),
  (4, 'app-video-ai', 'App Làm Video AI', 'Phần mềm render video hàng loạt, tự động ghép voice - phụ đề - nhạc nền (Chưa mở bán)', 'fa-mobile-screen-button', 'cyan', 5),
  (5, 'combo', 'Combo Trọn Bộ', 'Gói combo tiết kiệm tới 60% so với mua lẻ (Chưa mở bán)', 'fa-box-open', 'amber', 6);
SELECT setval(pg_get_serial_sequence('categories', 'id'), COALESCE((SELECT MAX(id) FROM categories), 1));

-- ---------- USERS ----------
INSERT INTO users (id, email, password_hash, full_name, phone, role, balance, affiliate_code, status) VALUES
  (1, 'leviettung01@gmail.com', 'pbkdf2$lMTfeF80hvxDrYW8/Ub68VubDaKT46BNVNWDtE92jo8=', 'Quản Trị Viên', '0987654321', 'admin', 0, 'ADMIN01', 'active'),
  (2, 'demo@webskill.ai',  'SEED$123456', 'Tài khoản Demo (Đã tắt)', '0912345678', 'user', 0, 'DEMO01', 'banned'),
  (3, 'minhduc@gmail.com','SEED$123456', 'Minh Đức', '0901111222', 'user', 0, 'MD2024', 'active'),
  (4, 'thuhang@gmail.com','SEED$123456', 'Thu Hằng', '0902222333', 'user', 0, 'TH2024', 'active'),
  (5, 'quocbao@gmail.com','SEED$123456', 'Quốc Bảo', '0903333444', 'user', 0, 'QB2024', 'active');

-- ---------- PRODUCTS ----------
INSERT INTO products (slug, name, category_id, short_desc, description, features, tech_stack, version, price, original_price, thumbnail, demo_video_url, demo_url, download_url, doc_url, file_size, product_type, is_featured, is_hot, is_new, sold_count, view_count, rating, rating_count) VALUES

('khoa-hoc-video-muse-ai', 'Skill Video Muse AI 10s — Bộ Prompt & Quy Trình Lip-Sync Viral', 2,
 'Bộ Skill làm video AI bằng Muse AI từ A-Z: bộ prompt khóa nhân vật, quy trình render clip 10s lip-sync tiếng Việt tự nhiên và file mẫu.',
 '<h3>Giới thiệu</h3><p><b>Bộ Skill đóng gói sẵn</b> giúp bạn làm chủ <b>Muse AI</b> — tạo ngay video 10s có người nói tiếng Việt với khẩu hình khớp tự nhiên, đủ chất lượng đăng TikTok/Reels bán hàng ngay.</p><h3>Skill bao gồm</h3><p><b>Bước 1:</b> Thiết lập Muse AI và tối ưu credit.<br><b>Bước 2:</b> Dùng bộ 120 prompt khóa nhân vật: trang phục, bối cảnh, góc máy.<br><b>Bước 3:</b> Render clip 10s có lip-sync tiếng Việt tự nhiên.<br><b>Bước 4:</b> Kỹ thuật giữ nhân vật đồng nhất qua nhiều cảnh.<br><b>Bước 5:</b> Ghép cảnh, thêm phụ đề, nhạc nền và xuất bản 9:16.</p><h3>Phù hợp với ai?</h3><p>Người mới bắt đầu, chủ shop online, KOC/KOL muốn tự làm video bán hàng bằng AI nhanh chóng.</p>',
 '["Bộ 120 prompt Muse AI đã test thực tế","Quy trình render & khóa nhân vật từng bước","Kỹ thuật render clip 10s lip-sync tiếng Việt tự nhiên","File mẫu thực hành + checklist kiểm tra","Video demo kết quả thực tế từ Skill","Update Skill miễn phí trọn đời"]',
 '["Muse AI","CapCut"]',
 'v1.0', 599000, 1299000, 'https://pub-f4217cb984184329a6951a68b9bd0b7c.r2.dev/videos/posters/poster-khoa-hoc-muse-ai.jpg', 'https://pub-f4217cb984184329a6951a68b9bd0b7c.r2.dev/videos/demo-khoa-hoc-muse-ai.mp4', '', 'https://drive.google.com/drive/folders/WEBSKILL-khoa-hoc-video-muse-ai', 'https://drive.google.com/drive/folders/WEBSKILL-khoa-hoc-video-muse-ai', 'Bộ Skill + Prompt', 'skill', 1, 1, 1, 186, 12400, 4.9, 87),

('khoa-hoc-video-seedance-25-30s', 'Skill Video Seedance 2.5 — One-Take 30s Build Page', 2,
 'Bộ Skill làm video Seedance 2.5: công thức one-take 30 giây nhân vật giữ nguyên, âm thanh native — build page Reels/TikTok cực nhanh.',
 '<h3>Giới thiệu</h3><p><b>Bộ Skill Seedance 2.5</b> đóng gói sẵn công thức tạo video one-take dài tới 30 giây với nhân vật giữ nguyên và âm thanh native — vũ khí hoàn hảo để build page Reels/TikTok số lượng lớn.</p><h3>Skill bao gồm</h3><p><b>Bước 1:</b> Cấu hình Seedance 2.5 chuẩn cho người mới.<br><b>Bước 2:</b> Bộ prompt one-take 30s: 1 prompt duy nhất, nhân vật không đổi.<br><b>Bước 3:</b> Công thức giữ màu sắc - ánh sáng đồng nhất giữa các video.<br><b>Bước 4:</b> Tận dụng âm thanh native cho video có người nói.<br><b>Bước 5:</b> Checklist 30 ngày build page Reels từ con số 0.</p><h3>Phù hợp với ai?</h3><p>Người muốn build nhiều page/kênh TikTok, Reels bằng video AI với chi phí thấp nhất.</p>',
 '["Bộ prompt one-take 30s giữ nhân vật tuyệt đối","Công thức giữ màu sắc - ánh sáng đồng nhất","Quy trình build page Reels từ con số 0","Lịch đăng + checklist 30 ngày đầu","Video demo thực tế của Skill","Cập nhật miễn phí khi Seedance ra bản mới"]',
 '["Seedance 2.5","CapCut"]',
 'v1.0', 699000, 1399000, 'https://pub-f4217cb984184329a6951a68b9bd0b7c.r2.dev/videos/posters/poster-khoa-hoc-seedance.jpg', 'https://pub-f4217cb984184329a6951a68b9bd0b7c.r2.dev/videos/demo-khoa-hoc-seedance.mp4', '', 'https://drive.google.com/drive/folders/WEBSKILL-khoa-hoc-video-seedance-25', 'https://drive.google.com/drive/folders/WEBSKILL-khoa-hoc-video-seedance-25', 'Bộ Skill + Prompt', 'skill', 1, 1, 0, 142, 9800, 4.8, 64),

('khoa-hoc-video-google-flow-veo', 'Khóa Học Video Google Flow Veo — Từ Newbie Đến Pro', 1,
 'Toàn tập Google Flow + Veo: dùng Ingredients khóa outfit/bối cảnh, sinh từng cảnh 10s dọc 9:16, QC và ghép video hoàn chỉnh.',
 '<h3>Giới thiệu</h3><p>Khóa học chuyên sâu về <b>Google Flow</b> kết hợp model <b>Veo</b> — bộ đôi mạnh nhất hiện nay để làm video AI nhiều cảnh có tính liên tục. Bạn học cách dùng Ingredients (ảnh nhân vật + sản phẩm) để khóa cứng outfit và bối cảnh, sinh từng cảnh 10s rồi ghép thành video quảng cáo hoàn chỉnh.</p><h3>Lộ trình học</h3><p><b>Phần 1:</b> Làm quen giao diện Google Flow, quản lý credit.<br><b>Phần 2:</b> Chuẩn bị Ingredients: ảnh nhân vật + ảnh sản phẩm chuẩn.<br><b>Phần 3:</b> Viết prompt khóa outfit, bối cảnh, phong cách.<br><b>Phần 4:</b> Sinh từng cảnh 10s dọc 9:16, kỹ thuật nối cảnh liền mạch.<br><b>Phần 5:</b> Checklist QC từng cảnh: nhân vật, sản phẩm, màu sắc.<br><b>Phần 6:</b> Ghép final, thêm voice/sub và xuất bản.</p><h3>Phù hợp với ai?</h3><p>Người làm video quảng cáo sản phẩm, agency, chủ shop cần video nhiều cảnh có tính liên tục cao.</p>',
 '["30+ video bài giảng HD","Kỹ thuật Ingredients khóa nhân vật & sản phẩm","Prompt khóa outfit/bối cảnh chuẩn","Quy trình sinh cảnh 10s nối tiếp liền mạch","Checklist QC từng cảnh trước khi ghép","Case study video bán hàng thực tế"]',
 '["Google Flow","Veo","CapCut"]',
 'v1.0', 799000, 1599000, 'https://pub-f4217cb984184329a6951a68b9bd0b7c.r2.dev/videos/posters/thumb-khoa-hoc-flow-veo.jpg', '', '', 'https://drive.google.com/drive/folders/WEBSKILL-khoa-hoc-video-google-flow-veo', 'https://drive.google.com/drive/folders/WEBSKILL-khoa-hoc-video-google-flow-veo', '30+ video bài giảng', 'course', 1, 0, 1, 98, 7200, 4.9, 45),

('skill-video-thuy-sinh-30s', 'Skill Video Thuỷ Sinh 30s — Build Page Reels', 2,
 'Bộ skill làm video thuỷ sinh 30s: prompt, quy trình render và checklist đăng bài để build page Reels ngách thuỷ sinh.',
 '<h3>Giới thiệu</h3><p><b>Skill đóng gói sẵn</b> cho ngách <b>thuỷ sinh</b>: bạn nhận toàn bộ prompt tạo cảnh, quy trình render video 30s và checklist đăng bài để build page Reels/TikTok. Xem video demo ngay trên trang này — đó chính là output của skill.</p><h3>Skill bao gồm</h3><p><b>Bước 1:</b> Mở bộ prompt theo đúng thứ tự cảnh.<br><b>Bước 2:</b> Render từng cảnh 30s trên Seedance/Veo theo hướng dẫn.<br><b>Bước 3:</b> Ghép + thêm caption theo template có sẵn.<br><b>Bước 4:</b> Đăng theo lịch 3 video/ngày trong 30 ngày đầu.</p><h3>Phù hợp với ai?</h3><p>Người muốn build page thuỷ sinh/cá cảnh để bán hàng hoặc làm affiliate mà không cần tự quay.</p>',
 '["Bộ prompt tạo cảnh thuỷ sinh 30s đã test","Quy trình render từng bước có ảnh minh hoạ","File checklist đăng bài build page","Gợi ý caption + hashtag ngách thuỷ sinh","Video demo thực tế của skill","Update skill miễn phí trọn đời"]',
 '["Seedance 2.5","Veo 3"]',
 'v1.0', 399000, 799000, 'https://pub-f4217cb984184329a6951a68b9bd0b7c.r2.dev/videos/posters/poster-skill-thuy-sinh.jpg', 'https://pub-f4217cb984184329a6951a68b9bd0b7c.r2.dev/videos/demo-skill-thuy-sinh.mp4', '', 'https://drive.google.com/drive/folders/WEBSKILL-skill-video-thuy-sinh-30s', 'https://drive.google.com/drive/folders/WEBSKILL-skill-video-thuy-sinh-30s', 'Bộ file ZIP', 'skill', 1, 1, 1, 231, 15200, 4.9, 112),

('skill-video-diy-lam-vuon-30s', 'Skill Video DIY Làm Vườn 30s — Build Page Reels', 2,
 'Skill làm video DIY làm vườn 30s: công thức cảnh quay, prompt mẫu và lịch đăng để build page Reels ngách làm vườn.',
 '<h3>Giới thiệu</h3><p><b>Skill đóng gói sẵn</b> cho ngách <b>DIY làm vườn</b>: công thức cảnh quay 30s, prompt mẫu và lịch đăng bài để build page Reels/TikTok ngách làm vườn — một trong những ngách dễ lên view nhất nhờ tính thư giãn, chữa lành.</p><h3>Skill bao gồm</h3><p><b>Bước 1:</b> Chọn chủ đề theo bộ 30 ý tưởng có sẵn.<br><b>Bước 2:</b> Render video 30s theo prompt mẫu.<br><b>Bước 3:</b> Ghép + chèn text theo template.<br><b>Bước 4:</b> Đăng theo khung giờ vàng ngách làm vườn.</p><h3>Phù hợp với ai?</h3><p>Người build page làm vườn, bán hạt giống/dụng cụ làm vườn hoặc làm affiliate ngách home & garden.</p>',
 '["Bộ 30 ý tưởng video làm vườn","Prompt mẫu render 30s đã test","Template text + khung giờ đăng","Checklist build page 30 ngày","Video demo thực tế của skill","Update skill miễn phí trọn đời"]',
 '["Seedance 2.5","Veo 3"]',
 'v1.0', 399000, 799000, 'https://pub-f4217cb984184329a6951a68b9bd0b7c.r2.dev/videos/posters/poster-skill-lam-vuon.jpg', 'https://pub-f4217cb984184329a6951a68b9bd0b7c.r2.dev/videos/demo-skill-lam-vuon.mp4', '', 'https://drive.google.com/drive/folders/WEBSKILL-skill-video-diy-lam-vuon-30s', 'https://drive.google.com/drive/folders/WEBSKILL-skill-video-diy-lam-vuon-30s', 'Bộ file ZIP', 'skill', 0, 1, 1, 187, 11800, 4.8, 89),

('skill-video-affiliate-fitness', 'Skill Video Affiliate Fitness — Video 30s Chốt Đơn', 2,
 'Skill làm video fitness 30s bán hàng affiliate: kịch bản chuyển đổi cao, prompt và quy trình edit tay chi tiết.',
 '<h3>Giới thiệu</h3><p><b>Skill đóng gói sẵn</b> cho ngách <b>fitness affiliate</b>: kịch bản video 30s theo công thức Hook - Vấn đề - Giải pháp - CTA, prompt tạo cảnh và quy trình edit tay chi tiết để ra video chốt đơn TikTok Shop.</p><h3>Skill bao gồm</h3><p><b>Bước 1:</b> Chọn 1 trong 20 kịch bản mẫu theo sản phẩm.<br><b>Bước 2:</b> Render cảnh fitness theo prompt.<br><b>Bước 3:</b> Edit tay theo quy trình: cắt - sub - nhạc - CTA.<br><b>Bước 4:</b> Gắn link affiliate và đăng.</p><h3>Phù hợp với ai?</h3><p>Người làm affiliate fitness: whey, dụng cụ tập, quần áo gym... muốn có video đều mỗi ngày mà không cần tự quay.</p>',
 '["20 kịch bản mẫu chuyển đổi cao","Prompt tạo cảnh fitness đã test","Quy trình edit tay từng bước","Công thức Hook 3 giây giữ chân","Gợi ý sản phẩm affiliate hoa hồng cao","Update skill miễn phí trọn đời"]',
 '["Seedance 2.5","CapCut"]',
 'v1.0', 449000, 899000, 'https://pub-f4217cb984184329a6951a68b9bd0b7c.r2.dev/videos/posters/poster-skill-fitness.jpg', 'https://pub-f4217cb984184329a6951a68b9bd0b7c.r2.dev/videos/demo-skill-fitness.mp4', '', 'https://drive.google.com/drive/folders/WEBSKILL-skill-video-affiliate-fitness', 'https://drive.google.com/drive/folders/WEBSKILL-skill-video-affiliate-fitness', 'Bộ file ZIP', 'skill', 1, 0, 1, 164, 10600, 4.9, 78),

('chatbot-viet-kich-ban-video-ai', 'Chatbot Viết Kịch Bản Video AI Đa Ngành', 3,
 'Chatbot sinh kịch bản + prompt tạo video theo ngành hàng: nhập tên sản phẩm là có ngay 6 cảnh quay hoàn chỉnh.',
 '<h3>Giới thiệu</h3><p>Chatbot AI chuyên viết <b>kịch bản video bán hàng</b>: bạn chỉ cần nhập tên sản phẩm và ngành hàng, chatbot trả về kịch bản 6 cảnh kèm prompt tạo ảnh + prompt tạo video, sẵn sàng dán vào Muse AI / Seedance / Veo.</p><h3>Các bước sử dụng</h3><p><b>Bước 1:</b> Mở link chatbot trong mục "Sản phẩm của tôi".<br><b>Bước 2:</b> Bấm Start, nhập tên sản phẩm.<br><b>Bước 3:</b> Chọn ngành hàng và tone giọng.<br><b>Bước 4:</b> Nhận kịch bản 6 cảnh + prompt ảnh + prompt video.<br><b>Bước 5:</b> Render và ghép trong CapCut.</p>',
 '["Kịch bản 6 cảnh chuẩn công thức viral","Prompt ảnh + prompt video đi kèm","Đa ngành: gia dụng, mỹ phẩm, thời trang...","3 tone giọng: chuyên gia / bạn thân / hài hước","Cập nhật prompt miễn phí trọn đời"]',
 '["ChatGPT","Gemini","Muse AI","Seedance"]',
 'v1.0', 299000, 599000, 'https://pub-f4217cb984184329a6951a68b9bd0b7c.r2.dev/videos/posters/thumb-chatbot-kich-ban.jpg', '', '', 'https://chatgpt.com/g/webskill-kich-ban-video-ai', '', '—', 'chatbot', 1, 1, 0, 342, 18900, 4.8, 156),

('app-lam-video-ai-hang-loat', 'App Làm Video AI Hàng Loạt — Render 100+ Video/Ngày', 4,
 'App render hàng loạt video từ kịch bản: tự động ghép ảnh - voice AI - phụ đề, xuất 9:16 sẵn đăng TikTok/Reels.',
 '<h3>Giới thiệu</h3><p>Phần mềm desktop giúp bạn <b>render hàng loạt video</b> từ file kịch bản: app tự động ghép ảnh, tạo voice AI tiếng Việt, chèn phụ đề động và xuất video dọc 9:16. Phù hợp team content cần số lượng lớn mỗi ngày.</p><h3>Cách dùng</h3><p><b>Bước 1:</b> Cài app, nhập file Excel kịch bản theo mẫu.<br><b>Bước 2:</b> Chọn voice AI và preset 9:16.<br><b>Bước 3:</b> Bấm Render All — app tự chạy hàng loạt.</p>',
 '["Render đa luồng, 100+ video/ngày","Voice AI tiếng Việt tự nhiên","Tự động chèn phụ đề động","Đọc kịch bản từ file Excel","Preset 9:16 / 16:9 / 1:1","Hỗ trợ cài đặt 1-1 qua Ultraview"]',
 '["Electron","FFmpeg","TTS AI"]',
 'v1.0', 899000, 1799000, 'https://pub-f4217cb984184329a6951a68b9bd0b7c.r2.dev/videos/posters/thumb-app-video-ai.jpg', '', '', 'https://drive.google.com/drive/folders/WEBSKILL-app-lam-video-ai-hang-loat', 'https://drive.google.com/drive/folders/WEBSKILL-app-lam-video-ai-hang-loat', 'Windows + macOS', 'app', 0, 1, 0, 129, 8400, 4.7, 52),

('combo-video-ai-all-in-one', 'COMBO All-In-One: Toàn Bộ Skill + Khóa Học + Chatbot + App', 5,
 'Trọn bộ KhoSkill AI trong 1 gói: 5 bộ Skill, Khóa học, Chatbot kịch bản và App render — đang chuẩn bị mở bán.',
 '<h3>Giới thiệu</h3><p>Gói cao cấp nhất của KhoSkill AI: sở hữu <b>toàn bộ</b> 5 bộ Skill Video AI, Khóa học chuyên sâu, Chatbot viết kịch bản và App render hàng loạt — với giá ưu đãi khi mở bán.</p><h3>Quyền lợi</h3><p>Truy cập trọn đời, nhận mọi Skill mới ra mắt trong 12 tháng, hỗ trợ ưu tiên 1-1 qua Zalo.</p>',
 '["5 bộ Skill Video AI thực chiến","Khóa học Video AI chuyên sâu","Chatbot kịch bản + app render","Tặng mọi sản phẩm mới trong 12 tháng","Truy cập trọn đời, update miễn phí","Hỗ trợ ưu tiên 1-1 qua Zalo"]',
 '["Muse AI","Seedance 2.5","Google Flow","Veo"]',
 'v1.0', 1999000, 4599000, 'https://pub-f4217cb984184329a6951a68b9bd0b7c.r2.dev/videos/posters/thumb-combo-all-in-one.jpg', '', '', 'https://drive.google.com/drive/folders/WEBSKILL-combo-all-in-one', '', '—', 'combo', 1, 1, 0, 87, 14300, 5.0, 42);

-- ---------- MCP AI AGENT SKILLS (Đang mở bán) ----------
INSERT INTO products (
  slug, name, category_id, short_desc, description, features, tech_stack, version,
  price, original_price, thumbnail, demo_video_url, demo_url, download_url, doc_url,
  file_size, product_type, is_featured, is_hot, is_new, status,
  sold_count, view_count, rating, rating_count,
  mcp_endpoint, mcp_server_name, mcp_clients, mcp_tools, mcp_skill_prompt, mcp_render_webhook
) VALUES
('mcp-skill-agent-video-viral-30s',
 'MCP Skill AI Agent — Tự Động Tạo Video Viral 30s (Claude / Codex / Antigravity)',
 6,
 'Skill MCP kết nối trực tiếp vào Claude, Codex, Antigravity: AI Agent tự gọi tool nạp quy trình Skill, sinh kịch bản khóa nhân vật và xuất lệnh tạo video 30s chuẩn viral ngay trong cuộc hội thoại.',
 '<h3>Điểm khác biệt so với Skill tự tải truyền thống</h3><p>Với <b>Skill tự tải</b>, bạn cần tải file ZIP/Drive về đọc hướng dẫn rồi tự copy-paste từng prompt sang công cụ tạo video. Với <b>MCP Skill AI Agent</b>, bạn chỉ cần dán cấu hình MCP 1 lần vào <b>Claude, Codex hoặc Antigravity</b> — từ đó AI Agent sẽ tự gọi trực tiếp về MCP Server bằng License Key của bạn để nạp blueprint, tách cảnh khóa nhân vật và tạo video 30s theo đúng chuẩn Skill.</p><h3>AI Agent của bạn sẽ làm được gì?</h3><ul><li><b>Tự động nạp Skill Blueprint:</b> Agent gọi <code>get_skill_blueprint</code> để lấy công thức Hook 3s, quy tắc khóa nhân vật/ánh sáng và cấu trúc 4 phân đoạn 30s.</li><li><b>Tự sinh Storyboard &amp; Prompt đa model:</b> Agent gọi <code>generate_video_storyboard</code> để tạo bộ prompt từng cảnh chuẩn Seedance 2.5, Muse AI hoặc Veo 3 kèm lời thoại tiếng Việt.</li><li><b>Tự kích hoạt pipeline tạo video:</b> Agent gọi <code>create_video_from_skill</code> để xuất gói render chuẩn 9:16 (hoặc đẩy thẳng sang render API/webhook nếu bạn kết nối) kèm phụ đề SRT &amp; caption đăng TikTok/Reels.</li><li><b>Luôn nhận bản Skill mới nhất:</b> Khi KhoSkill nâng cấp công thức prompt hoặc model mới, Agent tự động nhận bản mới qua MCP mà bạn không cần tải lại file.</li></ul><h3>Hỗ trợ đầy đủ AI Agent phổ biến</h3><p>Cung cấp sẵn đoạn cấu hình copy-paste trong mục <b>Sản phẩm của tôi</b> cho <b>Claude Code / Claude Desktop</b>, <b>OpenAI Codex</b> và <b>Antigravity</b>. Cài đặt xong trong chưa đầy 30 giây.</p>',
 '["Kết nối trực tiếp MCP vào Claude, Codex, Antigravity trong 30 giây","AI Agent tự gọi tool tạo kịch bản, prompt khóa nhân vật & pipeline video 30s","Không cần tải file thủ công hay copy-paste rời rạc từng bước","Xác thực bảo mật bằng License Key riêng — gọi không giới hạn","Hỗ trợ chuẩn Streamable HTTP MCP (JSON-RPC 2.0) mới nhất","Tự động đồng bộ bản nâng cấp Skill từ server trọn đời"]',
 '["MCP Protocol","Claude","Codex","Antigravity","Seedance 2.5","Veo 3","Muse AI"]',
 'v1.0 MCP', 990000, 1990000, '/static/mcp-skill-viral-cover.svg', 'https://pub-f4217cb984184329a6951a68b9bd0b7c.r2.dev/videos/demo-khoa-hoc-seedance.mp4', '', '', '', 'MCP Live API', 'mcp_skill', 1, 1, 1, 'published', 64, 4820, 5.0, 29,
 '', 'khoskill-video-viral', '["Claude","Codex","Antigravity"]',
 '[{"name":"list_licensed_skills","description":"Liệt kê toàn bộ Skill MCP đang hoạt động theo License Key của bạn"},{"name":"get_skill_blueprint","description":"Nạp toàn bộ quy trình, luật khóa nhân vật, công thức Hook-Body-CTA và template prompt của Skill"},{"name":"generate_video_storyboard","description":"Tự động tách chủ đề thành storyboard 30s (4 cảnh) kèm prompt tối ưu cho Seedance 2.5 / Muse AI / Veo 3"},{"name":"create_video_from_skill","description":"Chạy pipeline tạo video theo chuẩn Skill, trả về gói render job + SRT phụ đề hoặc gọi render webhook trực tiếp"}]',
 '# SKILL BLUEPRINT: AI AGENT VIDEO VIRAL 30S (MCP)

## 1. Mục tiêu đầu ra
- Tạo video ngắn 30 giây tỷ lệ 9:16 (TikTok / Facebook Reels / YouTube Shorts) có tỷ lệ giữ chân cao (>65% ở mốc 3s đầu).
- Duy trì tính đồng nhất tuyệt đối về **nhân vật, trang phục, ánh sáng, tông màu và không gian** xuyên suốt toàn bộ video.

## 2. Cấu trúc 4 phân đoạn chuẩn Viral 30s
1. **Cảnh 1 — Visual Hook (00:00 - 00:05)**: Mở đầu bằng chuyển động mạnh, kết quả gây tò mò hoặc câu hỏi đánh trúng nỗi đau.
2. **Cảnh 2 — Bối cảnh & Vấn đề (00:05 - 00:13)**: Minh hoạ vấn đề thực tế người xem gặp phải.
3. **Cảnh 3 — Giải pháp & Biến đổi (00:13 - 00:24)**: Phô diễn quy trình/sản phẩm tạo ra sự thay đổi rõ rệt (Before -> After).
4. **Cảnh 4 — Payoff & CTA (00:24 - 00:30)**: Khung hình thành quả đẹp nhất + lời kêu gọi hành động tự nhiên.

## 3. Quy tắc khóa nhân vật & phong cách
- Khóa Character Anchor cố định và lặp lại ở đầu mọi cảnh.
- Hỗ trợ Seedance 2.5 (one-take 30s), Muse AI (clip 10s lip-sync tiếng Việt), Veo 3 (cảnh điện ảnh + SFX).',
 ''),

('mcp-skill-agent-affiliate-tiktok',
 'MCP Skill AI Agent — Tự Động Sản Xuất Video Affiliate TikTok Shop',
 6,
 'Kết nối MCP vào Claude, Codex, Antigravity: chỉ cần đưa tên hoặc thông tin sản phẩm, AI Agent tự gọi Skill xuất trọn bộ kịch bản chốt đơn, prompt cảnh quay 9:16, voiceover & lệnh tạo video Affiliate.',
 '<h3>Tự động hoá dây chuyền làm video Affiliate bằng AI Agent</h3><p>Thay vì tải bộ prompt về máy rồi tự chỉnh sửa từng câu chữ cho mỗi sản phẩm mới, <b>MCP Skill Affiliate TikTok Shop</b> biến <b>Claude, Codex và Antigravity</b> thành trợ lý sản xuất video chốt đơn chuyên nghiệp qua kết nối MCP trực tiếp.</p><h3>Quy trình Agent chạy tự động qua MCP</h3><ul><li><b>Bước 1:</b> Nhập tên sản phẩm, điểm bán hàng (USP) và giá ưu đãi vào Claude / Codex / Antigravity.</li><li><b>Bước 2:</b> Agent tự động gọi MCP tool nạp bộ <b>25 công thức Hook chốt đơn</b> &amp; cấu trúc PAS/AIDA tối ưu cho TikTok Shop.</li><li><b>Bước 3:</b> Agent gọi <code>create_video_from_skill</code> xuất bộ prompt khóa sản phẩm/nhân vật, lời thoại lip-sync tiếng Việt, file phụ đề SRT và thông số render hàng loạt.</li><li><b>Bước 4:</b> Xuất sẵn nhiều biến thể Hook để bạn chạy test A/B tìm video win cực nhanh.</li></ul><h3>Phù hợp với ai?</h3><p>Chủ shop TikTok Shop, KOC/Affiliate creator, team media muốn scale 10–30 video bán hàng mỗi ngày ngay trong Claude, Codex hoặc Antigravity.</p>',
 '["Tích hợp trực tiếp vào Claude, Codex, Antigravity qua MCP","Đưa tên sản phẩm -> Agent tự xuất trọn gói kịch bản + prompt + lệnh render","Sẵn 25 khung Hook giữ chân 3 giây & CTA chuẩn TikTok Shop","Sinh nhanh 3 biến thể Hook để test A/B tìm clip ra đơn","Xuất kèm script voiceover tiếng Việt, phụ đề SRT và hashtag ngách","Cập nhật công thức chốt đơn mới trực tiếp từ MCP Server"]',
 '["MCP Protocol","Claude","Codex","Antigravity","Muse AI","Seedance 2.5","CapCut"]',
 'v1.0 MCP', 890000, 1790000, '/static/mcp-skill-affiliate-cover.svg', 'https://pub-f4217cb984184329a6951a68b9bd0b7c.r2.dev/videos/demo-skill-fitness.mp4', '', '', '', 'MCP Live API', 'mcp_skill', 1, 0, 1, 'published', 41, 3190, 4.9, 18,
 '', 'khoskill-affiliate-agent', '["Claude","Codex","Antigravity"]',
 '[{"name":"list_licensed_skills","description":"Kiểm tra danh sách MCP Skill đã kích hoạt"},{"name":"get_skill_blueprint","description":"Nạp công thức Hook 3s, cấu trúc bán hàng PAS/AIDA và luật khóa sản phẩm TikTok Shop"},{"name":"generate_video_storyboard","description":"Tạo storyboard 30s chốt đơn + 3 biến thể Hook theo tên sản phẩm và USP"},{"name":"create_video_from_skill","description":"Xuất gói render video Affiliate 9:16 hoàn chỉnh kèm voiceover, phụ đề SRT & CTA giỏ hàng"}]',
 '# SKILL BLUEPRINT: AI AGENT AFFILIATE TIKTOK SHOP (MCP)

## 1. Công thức chuyển đổi 30s
- **00:00 - 00:04 (Hook Chặn Cuộn)**: Gọi thẳng tệp khách hàng + cận cảnh sản phẩm hoạt động.
- **00:04 - 00:10 (Nỗi đau thực tế)**: 1 vấn đề cụ thể gây khó chịu hằng ngày.
- **00:10 - 00:21 (Demo USP sản phẩm)**: Tập trung 2 lợi ích mạnh nhất bằng góc quay cận.
- **00:21 - 00:26 (Bằng chứng & Xử lý từ chối)**: So sánh chi phí/độ bền.
- **00:26 - 00:30 (CTA Giỏ Hàng)**: Chỉ giỏ hàng góc trái tự nhiên.

## 2. A/B Test 3 biến thể Hook
- Luôn xuất kèm 3 biến thể Hook đầu 3 giây để test nhanh clip win.',
 '');

-- Đặt 4 dịch vụ chưa mở bán sang trạng thái coming_soon (mở bán Skill tự tải + Skill AI Agent MCP)
UPDATE products SET status='coming_soon' WHERE slug IN (
  'khoa-hoc-video-google-flow-veo',
  'chatbot-viet-kich-ban-video-ai',
  'app-lam-video-ai-hang-loat',
  'combo-video-ai-all-in-one'
);

-- Gán sản phẩm con cho combo (tất cả sản phẩm trừ chính combo)
INSERT INTO combo_items (combo_id, product_id)
SELECT (SELECT id FROM products WHERE slug='combo-video-ai-all-in-one'), id FROM products WHERE slug != 'combo-video-ai-all-in-one';

-- ---------- REVIEWS ----------
INSERT INTO reviews (product_id, user_id, rating, comment) VALUES
  ((SELECT id FROM products WHERE slug='khoa-hoc-video-muse-ai'), 3, 5, 'Học xong làm được video ngay trong ngày đầu. Prompt mẫu rất chuẩn, không phải mò mẫm.'),
  ((SELECT id FROM products WHERE slug='khoa-hoc-video-muse-ai'), 4, 5, 'Phần khóa nhân vật đồng nhất đáng tiền nhất. Mình làm series 10 video mà mặt không đổi.'),
  ((SELECT id FROM products WHERE slug='skill-video-thuy-sinh-30s'), 5, 5, 'Video demo chính là thứ mình làm ra được sau 2 tiếng. Page lên 10k follow sau 3 tuần.'),
  ((SELECT id FROM products WHERE slug='skill-video-thuy-sinh-30s'), 3, 5, 'Skill đóng gói gọn, làm theo từng bước là ra. Đáng hơn tự mày mò cả tháng.'),
  ((SELECT id FROM products WHERE slug='skill-video-affiliate-fitness'), 4, 5, 'Kịch bản chốt đơn thật sự hiệu quả, video đầu tiên đã có đơn affiliate.'),
  ((SELECT id FROM products WHERE slug='chatbot-viet-kich-ban-video-ai'), 5, 4, 'Tiết kiệm cả tiếng nghĩ kịch bản mỗi ngày. Chỉ mong thêm nhiều ngành hàng nữa.'),
  ((SELECT id FROM products WHERE slug='khoa-hoc-video-seedance-25-30s'), 3, 5, 'One-take 30s đúng như quảng cáo, build 3 page Reels cùng lúc khỏe re.'),
  ((SELECT id FROM products WHERE slug='combo-video-ai-all-in-one'), 4, 5, 'Mua combo rẻ hơn một nửa so với mua lẻ. Giao link ngay sau khi chuyển khoản.'),
  ((SELECT id FROM products WHERE slug='mcp-skill-agent-video-viral-30s'), 3, 5, 'Cắm thẳng MCP vào Antigravity & Claude Code mất đúng 30 giây, ra lệnh phát là Agent tự gọi Skill xuất trọn bộ storyboard + prompt khóa nhân vật cực mượt!'),
  ((SELECT id FROM products WHERE slug='mcp-skill-agent-affiliate-tiktok'), 5, 5, 'Quá khác biệt so với tải file về làm tay. Đưa tên sản phẩm vào Codex là Agent tự gọi MCP nhả ra kịch bản + 3 hook A/B + SRT chuẩn TikTok Shop.');

-- ---------- COUPONS ----------
INSERT INTO coupons (code, type, value, min_order, max_uses, expires_at, status) VALUES
  ('WELCOME10', 'percent', 10, 100000, 1000, '2027-12-31', 'active'),
  ('SALE20',    'percent', 20, 500000, 500,  '2027-12-31', 'active'),
  ('GIAM100K',  'fixed',   100000, 1000000, 200, '2027-12-31', 'active'),
  ('COMBO30',   'percent', 30, 2000000, 100, '2027-12-31', 'active');

-- ---------- BLOG ----------
INSERT INTO posts (slug, title, excerpt, content, tags) VALUES
  ('huong-dan-lam-video-muse-ai-cho-nguoi-moi', 'Hướng dẫn làm video Muse AI cho người mới từ A-Z',
   'Từng bước tạo video AI đầu tiên bằng Muse AI: viết prompt, khóa nhân vật và render clip 10s có lip-sync.',
   '<h2>1. Muse AI là gì?</h2><p>Muse AI là công cụ tạo video AI cho phép render clip khoảng 10 giây từ văn bản hoặc ảnh tham chiếu, đặc biệt mạnh ở khả năng lip-sync tiếng Việt tự nhiên.</p><h2>2. Chuẩn bị</h2><p>Bạn cần tài khoản Muse AI, một ảnh nhân vật tham chiếu rõ mặt và bộ prompt tốt.</p><h2>3. Quy trình 5 bước</h2><p>Bước 1: Viết prompt khóa nhân vật (trang phục, bối cảnh, góc máy). Bước 2: Upload ảnh tham chiếu. Bước 3: Nhập lời thoại tiếng Việt. Bước 4: Render clip 10s. Bước 5: Ghép nhiều clip trong CapCut, thêm phụ đề và nhạc nền.</p><h2>4. Mẹo giữ nhân vật đồng nhất</h2><p>Luôn dùng cùng một ảnh tham chiếu và giữ nguyên đoạn mô tả ngoại hình trong mọi prompt.</p>',
   'muse-ai,huong-dan,ai-video'),
  ('seedance-2-5-one-take-30s-la-gi', 'Seedance 2.5 one-take 30s là gì? Vì sao dân build page mê mẩn',
   'Giải thích công nghệ one-take 30s của Seedance 2.5 và cách tận dụng để build page Reels/TikTok số lượng lớn.',
   '<h2>1. One-take 30s nghĩa là gì?</h2><p>Seedance 2.5 có thể tạo một video dài 30 giây chỉ từ một prompt duy nhất, nhân vật và bối cảnh giữ nguyên suốt video, kèm âm thanh native.</p><h2>2. Vì sao phù hợp build page?</h2><p>Một prompt = một video hoàn chỉnh, không cần ghép nhiều cảnh. Bạn có thể sản xuất 10-20 video/ngày cho nhiều page cùng lúc.</p><h2>3. Ngách nào hiệu quả nhất?</h2><p>Thuỷ sinh, làm vườn, decor, fitness — những ngách có tính thư giãn, lặp lại và dễ gây nghiện khi xem.</p><h2>4. Lưu ý quan trọng</h2><p>Dù là one-take, bạn vẫn cần prompt mô tả rõ chuyển động camera để video không bị đơn điệu.</p>',
   'seedance,build-page,reels'),
  ('cach-build-page-reels-bang-skill-video-ai', 'Cách build page Reels từ 0 bằng skill video AI (checklist 30 ngày)',
   'Lộ trình 30 ngày build page Reels bằng video AI: chọn ngách, sản xuất hàng loạt và lịch đăng chuẩn.',
   '<h2>Tuần 1: Chuẩn bị</h2><p>Chọn 1 ngách duy nhất (thuỷ sinh, làm vườn, fitness...), mua skill tương ứng, chuẩn bị 30 ý tưởng video.</p><h2>Tuần 2-3: Sản xuất hàng loạt</h2><p>Render 3 video/ngày theo skill, đăng đều vào khung giờ vàng 11h - 13h và 20h - 22h.</p><h2>Tuần 4: Tối ưu</h2><p>Xem video nào lên view, làm thêm 5 biến thể của nó. Bỏ những format không ai xem.</p><h2>Checklist mỗi ngày</h2><p>Render xong 3 video, đăng đủ 3 khung giờ, trả lời comment trong 1 giờ đầu, lưu lại số liệu view/follow.</p>',
   'build-page,reels,skill-ai'),
  ('kiem-tien-affiliate-bang-video-ai-fitness', 'Kiếm tiền affiliate bằng video AI ngách fitness (mô hình thực tế)',
   'Chia sẻ mô hình dùng video AI 30s để bán hàng affiliate fitness: chọn sản phẩm, làm video và chốt đơn.',
   '<h2>Mô hình hoạt động</h2><p>Chọn sản phẩm fitness hoa hồng cao (whey, dụng cụ tập, đồ gym), dùng skill tạo video 30s theo công thức Hook - Vấn đề - Giải pháp - CTA, gắn link affiliate và đăng đều.</p><h2>Chọn sản phẩm</h2><p>Ưu tiên sản phẩm giá 200k - 800k, có sẵn video review thật để tham khảo kịch bản, hoa hồng từ 10% trở lên.</p><h2>Tần suất đăng</h2><p>Tối thiểu 2-3 video/ngày trong 30 ngày đầu. Video nào ra đơn thì làm thêm 5 biến thể.</p><h2>Kết quả tham khảo</h2><p>Nhiều người đạt 5-15 triệu/tháng hoa hồng sau 60 ngày làm đều với 1-2 ngách.</p>',
   'affiliate,fitness,kiem-tien');
