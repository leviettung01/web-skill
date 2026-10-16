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
  ('site_name', 'WebSkill AI'),
  ('site_tagline', 'Chatbot • Skill • App làm video AI'),
  ('hotline', '0915967790'),
  ('zalo', '0915967790'),
  ('email', 'support@webskill.ai'),
  ('facebook', 'https://facebook.com/webskillai'),
  ('bank_name', 'MB Bank'),
  ('bank_code', 'MB'),
  ('bank_account', '0987654321'),
  ('bank_owner', 'NGUYEN VAN A'),
  ('affiliate_percent', '20');

-- ---------- CATEGORIES ----------
INSERT INTO categories (id, slug, name, description, icon, color, sort_order) VALUES
  (1, 'khoa-hoc-video-ai', 'Khóa học Video AI', 'Lộ trình học làm video AI từ cơ bản đến nâng cao: Video Muse AI, Seedance 2.5 30s, Google Flow Veo', 'fa-graduation-cap', 'indigo', 1),
  (2, 'skill-video-ai', 'Skill Tạo Video AI', 'Skill đóng gói theo ngách: Video Thuỷ Sinh 30s, DIY Làm Vườn 30s, Affiliate Fitness — làm theo là ra video build page Reels', 'fa-wand-magic-sparkles', 'fuchsia', 2),
  (3, 'chatbot-ai', 'Chatbot AI', 'Chatbot viết kịch bản, sinh prompt tạo video theo ngành hàng', 'fa-robot', 'violet', 3),
  (4, 'app-video-ai', 'App Làm Video AI', 'Phần mềm render video hàng loạt, tự động ghép voice - phụ đề - nhạc nền', 'fa-mobile-screen-button', 'cyan', 4),
  (5, 'combo', 'Combo Trọn Bộ', 'Gói combo tiết kiệm tới 60% so với mua lẻ', 'fa-box-open', 'amber', 5);

-- ---------- USERS (password: 123456) ----------
INSERT INTO users (id, email, password_hash, full_name, phone, role, balance, affiliate_code, status) VALUES
  (1, 'admin@webskill.ai', 'SEED$123456', 'Quản Trị Viên', '0987654321', 'admin', 0, 'ADMIN01', 'active'),
  (2, 'demo@webskill.ai',  'SEED$123456', 'Nguyễn Văn Demo', '0912345678', 'user', 500000, 'DEMO01', 'active'),
  (3, 'minhduc@gmail.com','SEED$123456', 'Minh Đức', '0901111222', 'user', 0, 'MD2024', 'active'),
  (4, 'thuhang@gmail.com','SEED$123456', 'Thu Hằng', '0902222333', 'user', 0, 'TH2024', 'active'),
  (5, 'quocbao@gmail.com','SEED$123456', 'Quốc Bảo', '0903333444', 'user', 0, 'QB2024', 'active');

-- ---------- PRODUCTS ----------
INSERT INTO products (slug, name, category_id, short_desc, description, features, tech_stack, version, price, original_price, thumbnail, demo_video_url, demo_url, download_url, doc_url, file_size, product_type, is_featured, is_hot, is_new, sold_count, view_count, rating, rating_count) VALUES

('khoa-hoc-video-muse-ai', 'Khóa Học Video Muse AI — Từ Prompt Đến Video 10s Chuẩn Viral', 1,
 'Học làm video AI bằng Muse AI từ A-Z: viết prompt khóa nhân vật, render clip 10s có lip-sync tiếng Việt tự nhiên, ghép thành video hoàn chỉnh.',
 '<h3>Giới thiệu</h3><p>Khóa học cầm tay chỉ việc giúp bạn làm chủ <b>Muse AI</b> — công cụ tạo video AI đang hot nhất hiện nay. Học xong bạn tự sản xuất được video 10s có người nói tiếng Việt với khẩu hình khớp tự nhiên, đủ chất lượng đăng TikTok/Reels bán hàng ngay.</p><h3>Lộ trình học</h3><p><b>Phần 1:</b> Tổng quan Muse AI, cách truy cập và tối ưu credit.<br><b>Phần 2:</b> Viết prompt khóa nhân vật: trang phục, bối cảnh, góc máy.<br><b>Phần 3:</b> Render clip 10s có lip-sync tiếng Việt tự nhiên.<br><b>Phần 4:</b> Kỹ thuật giữ nhân vật đồng nhất qua nhiều cảnh.<br><b>Phần 5:</b> Ghép cảnh, thêm phụ đề, nhạc nền và xuất bản 9:16.<br><b>Phần 6:</b> Case study: video bán hàng affiliate thực tế.</p><h3>Phù hợp với ai?</h3><p>Người mới bắt đầu, chủ shop online, KOC/KOL muốn tự làm video bán hàng mà không cần thuê quay dựng.</p>',
 '["25+ video bài giảng HD, xem trọn đời","Bộ 120 prompt Muse AI đã test thực tế","Quy trình khóa nhân vật đồng nhất qua nhiều cảnh","Kỹ thuật render clip 10s lip-sync tiếng Việt tự nhiên","Bài tập thực hành + file mẫu kèm theo","Hỗ trợ 1-1 qua Zalo đến khi ra video đầu tiên"]',
 '["Muse AI","CapCut"]',
 'v1.0', 599000, 1299000, '/videos/posters/poster-khoa-hoc-muse-ai.jpg', '/videos/demo-khoa-hoc-muse-ai.mp4', '', 'https://drive.google.com/drive/folders/WEBSKILL-khoa-hoc-video-muse-ai', 'https://drive.google.com/drive/folders/WEBSKILL-khoa-hoc-video-muse-ai', '25+ video bài giảng', 'course', 1, 1, 1, 186, 12400, 4.9, 87),

('khoa-hoc-video-seedance-25-30s', 'Khóa Học Video Seedance 2.5 — One-Take 30s Build Page', 1,
 'Làm chủ Seedance 2.5: quay one-take 30 giây nhân vật giữ nguyên, âm thanh native — công thức build page Reels/TikTok lên nhanh.',
 '<h3>Giới thiệu</h3><p><b>Seedance 2.5</b> cho phép tạo video one-take dài tới 30 giây với nhân vật giữ nguyên và âm thanh native — vũ khí hoàn hảo để build page Reels/TikTok số lượng lớn. Khóa học này dạy bạn toàn bộ quy trình từ prompt đến lịch đăng.</p><h3>Lộ trình học</h3><p><b>Phần 1:</b> Seedance 2.5 là gì, điểm mạnh so với các model khác.<br><b>Phần 2:</b> Công thức one-take 30s: 1 prompt duy nhất, nhân vật không đổi.<br><b>Phần 3:</b> Kỹ thuật giữ màu sắc - ánh sáng đồng nhất giữa các video.<br><b>Phần 4:</b> Tận dụng âm thanh native cho video có người nói.<br><b>Phần 5:</b> Quy trình build page Reels từ 0: lịch đăng + checklist 30 ngày đầu.</p><h3>Phù hợp với ai?</h3><p>Người muốn build nhiều page/kênh TikTok, Reels bằng video AI với chi phí thấp nhất.</p>',
 '["20+ video bài giảng HD","Công thức one-take 30s giữ nhân vật tuyệt đối","Kỹ thuật giữ màu sắc - ánh sáng đồng nhất","Quy trình build page Reels từ con số 0","Lịch đăng + checklist 30 ngày đầu","Cập nhật miễn phí khi Seedance ra bản mới"]',
 '["Seedance 2.5","CapCut"]',
 'v1.0', 699000, 1399000, '/videos/posters/poster-khoa-hoc-seedance.jpg', '/videos/demo-khoa-hoc-seedance.mp4', '', 'https://drive.google.com/drive/folders/WEBSKILL-khoa-hoc-video-seedance-25', 'https://drive.google.com/drive/folders/WEBSKILL-khoa-hoc-video-seedance-25', '20+ video bài giảng', 'course', 1, 1, 0, 142, 9800, 4.8, 64),

('khoa-hoc-video-google-flow-veo', 'Khóa Học Video Google Flow Veo — Từ Newbie Đến Pro', 1,
 'Toàn tập Google Flow + Veo: dùng Ingredients khóa outfit/bối cảnh, sinh từng cảnh 10s dọc 9:16, QC và ghép video hoàn chỉnh.',
 '<h3>Giới thiệu</h3><p>Khóa học chuyên sâu về <b>Google Flow</b> kết hợp model <b>Veo</b> — bộ đôi mạnh nhất hiện nay để làm video AI nhiều cảnh có tính liên tục. Bạn học cách dùng Ingredients (ảnh nhân vật + sản phẩm) để khóa cứng outfit và bối cảnh, sinh từng cảnh 10s rồi ghép thành video quảng cáo hoàn chỉnh.</p><h3>Lộ trình học</h3><p><b>Phần 1:</b> Làm quen giao diện Google Flow, quản lý credit.<br><b>Phần 2:</b> Chuẩn bị Ingredients: ảnh nhân vật + ảnh sản phẩm chuẩn.<br><b>Phần 3:</b> Viết prompt khóa outfit, bối cảnh, phong cách.<br><b>Phần 4:</b> Sinh từng cảnh 10s dọc 9:16, kỹ thuật nối cảnh liền mạch.<br><b>Phần 5:</b> Checklist QC từng cảnh: nhân vật, sản phẩm, màu sắc.<br><b>Phần 6:</b> Ghép final, thêm voice/sub và xuất bản.</p><h3>Phù hợp với ai?</h3><p>Người làm video quảng cáo sản phẩm, agency, chủ shop cần video nhiều cảnh có tính liên tục cao.</p>',
 '["30+ video bài giảng HD","Kỹ thuật Ingredients khóa nhân vật & sản phẩm","Prompt khóa outfit/bối cảnh chuẩn","Quy trình sinh cảnh 10s nối tiếp liền mạch","Checklist QC từng cảnh trước khi ghép","Case study video bán hàng thực tế"]',
 '["Google Flow","Veo","CapCut"]',
 'v1.0', 799000, 1599000, '/videos/posters/thumb-khoa-hoc-flow-veo.jpg', '', '', 'https://drive.google.com/drive/folders/WEBSKILL-khoa-hoc-video-google-flow-veo', 'https://drive.google.com/drive/folders/WEBSKILL-khoa-hoc-video-google-flow-veo', '30+ video bài giảng', 'course', 1, 0, 1, 98, 7200, 4.9, 45),

('skill-video-thuy-sinh-30s', 'Skill Video Thuỷ Sinh 30s — Build Page Reels', 2,
 'Bộ skill làm video thuỷ sinh 30s: prompt, quy trình render và checklist đăng bài để build page Reels ngách thuỷ sinh.',
 '<h3>Giới thiệu</h3><p><b>Skill đóng gói sẵn</b> cho ngách <b>thuỷ sinh</b>: bạn nhận toàn bộ prompt tạo cảnh, quy trình render video 30s và checklist đăng bài để build page Reels/TikTok. Xem video demo ngay trên trang này — đó chính là output của skill.</p><h3>Skill bao gồm</h3><p><b>Bước 1:</b> Mở bộ prompt theo đúng thứ tự cảnh.<br><b>Bước 2:</b> Render từng cảnh 30s trên Seedance/Veo theo hướng dẫn.<br><b>Bước 3:</b> Ghép + thêm caption theo template có sẵn.<br><b>Bước 4:</b> Đăng theo lịch 3 video/ngày trong 30 ngày đầu.</p><h3>Phù hợp với ai?</h3><p>Người muốn build page thuỷ sinh/cá cảnh để bán hàng hoặc làm affiliate mà không cần tự quay.</p>',
 '["Bộ prompt tạo cảnh thuỷ sinh 30s đã test","Quy trình render từng bước có ảnh minh hoạ","File checklist đăng bài build page","Gợi ý caption + hashtag ngách thuỷ sinh","Video demo thực tế của skill","Update skill miễn phí trọn đời"]',
 '["Seedance 2.5","Veo 3"]',
 'v1.0', 399000, 799000, '/videos/posters/poster-skill-thuy-sinh.jpg', '/videos/demo-skill-thuy-sinh.mp4', '', 'https://drive.google.com/drive/folders/WEBSKILL-skill-video-thuy-sinh-30s', 'https://drive.google.com/drive/folders/WEBSKILL-skill-video-thuy-sinh-30s', 'Bộ file ZIP', 'skill', 1, 1, 1, 231, 15200, 4.9, 112),

('skill-video-diy-lam-vuon-30s', 'Skill Video DIY Làm Vườn 30s — Build Page Reels', 2,
 'Skill làm video DIY làm vườn 30s: công thức cảnh quay, prompt mẫu và lịch đăng để build page Reels ngách làm vườn.',
 '<h3>Giới thiệu</h3><p><b>Skill đóng gói sẵn</b> cho ngách <b>DIY làm vườn</b>: công thức cảnh quay 30s, prompt mẫu và lịch đăng bài để build page Reels/TikTok ngách làm vườn — một trong những ngách dễ lên view nhất nhờ tính thư giãn, chữa lành.</p><h3>Skill bao gồm</h3><p><b>Bước 1:</b> Chọn chủ đề theo bộ 30 ý tưởng có sẵn.<br><b>Bước 2:</b> Render video 30s theo prompt mẫu.<br><b>Bước 3:</b> Ghép + chèn text theo template.<br><b>Bước 4:</b> Đăng theo khung giờ vàng ngách làm vườn.</p><h3>Phù hợp với ai?</h3><p>Người build page làm vườn, bán hạt giống/dụng cụ làm vườn hoặc làm affiliate ngách home & garden.</p>',
 '["Bộ 30 ý tưởng video làm vườn","Prompt mẫu render 30s đã test","Template text + khung giờ đăng","Checklist build page 30 ngày","Video demo thực tế của skill","Update skill miễn phí trọn đời"]',
 '["Seedance 2.5","Veo 3"]',
 'v1.0', 399000, 799000, '/videos/posters/poster-skill-lam-vuon.jpg', '/videos/demo-skill-lam-vuon.mp4', '', 'https://drive.google.com/drive/folders/WEBSKILL-skill-video-diy-lam-vuon-30s', 'https://drive.google.com/drive/folders/WEBSKILL-skill-video-diy-lam-vuon-30s', 'Bộ file ZIP', 'skill', 0, 1, 1, 187, 11800, 4.8, 89),

('skill-video-affiliate-fitness', 'Skill Video Affiliate Fitness — Video 30s Chốt Đơn', 2,
 'Skill làm video fitness 30s bán hàng affiliate: kịch bản chuyển đổi cao, prompt và quy trình edit tay chi tiết.',
 '<h3>Giới thiệu</h3><p><b>Skill đóng gói sẵn</b> cho ngách <b>fitness affiliate</b>: kịch bản video 30s theo công thức Hook - Vấn đề - Giải pháp - CTA, prompt tạo cảnh và quy trình edit tay chi tiết để ra video chốt đơn TikTok Shop.</p><h3>Skill bao gồm</h3><p><b>Bước 1:</b> Chọn 1 trong 20 kịch bản mẫu theo sản phẩm.<br><b>Bước 2:</b> Render cảnh fitness theo prompt.<br><b>Bước 3:</b> Edit tay theo quy trình: cắt - sub - nhạc - CTA.<br><b>Bước 4:</b> Gắn link affiliate và đăng.</p><h3>Phù hợp với ai?</h3><p>Người làm affiliate fitness: whey, dụng cụ tập, quần áo gym... muốn có video đều mỗi ngày mà không cần tự quay.</p>',
 '["20 kịch bản mẫu chuyển đổi cao","Prompt tạo cảnh fitness đã test","Quy trình edit tay từng bước","Công thức Hook 3 giây giữ chân","Gợi ý sản phẩm affiliate hoa hồng cao","Update skill miễn phí trọn đời"]',
 '["Seedance 2.5","CapCut"]',
 'v1.0', 449000, 899000, '/videos/posters/poster-skill-fitness.jpg', '/videos/demo-skill-fitness.mp4', '', 'https://drive.google.com/drive/folders/WEBSKILL-skill-video-affiliate-fitness', 'https://drive.google.com/drive/folders/WEBSKILL-skill-video-affiliate-fitness', 'Bộ file ZIP', 'skill', 1, 0, 1, 164, 10600, 4.9, 78),

('chatbot-viet-kich-ban-video-ai', 'Chatbot Viết Kịch Bản Video AI Đa Ngành', 3,
 'Chatbot sinh kịch bản + prompt tạo video theo ngành hàng: nhập tên sản phẩm là có ngay 6 cảnh quay hoàn chỉnh.',
 '<h3>Giới thiệu</h3><p>Chatbot AI chuyên viết <b>kịch bản video bán hàng</b>: bạn chỉ cần nhập tên sản phẩm và ngành hàng, chatbot trả về kịch bản 6 cảnh kèm prompt tạo ảnh + prompt tạo video, sẵn sàng dán vào Muse AI / Seedance / Veo.</p><h3>Các bước sử dụng</h3><p><b>Bước 1:</b> Mở link chatbot trong mục "Sản phẩm của tôi".<br><b>Bước 2:</b> Bấm Start, nhập tên sản phẩm.<br><b>Bước 3:</b> Chọn ngành hàng và tone giọng.<br><b>Bước 4:</b> Nhận kịch bản 6 cảnh + prompt ảnh + prompt video.<br><b>Bước 5:</b> Render và ghép trong CapCut.</p>',
 '["Kịch bản 6 cảnh chuẩn công thức viral","Prompt ảnh + prompt video đi kèm","Đa ngành: gia dụng, mỹ phẩm, thời trang...","3 tone giọng: chuyên gia / bạn thân / hài hước","Cập nhật prompt miễn phí trọn đời"]',
 '["ChatGPT","Gemini","Muse AI","Seedance"]',
 'v1.0', 299000, 599000, '/videos/posters/thumb-chatbot-kich-ban.jpg', '', '', 'https://chatgpt.com/g/webskill-kich-ban-video-ai', '', '—', 'chatbot', 1, 1, 0, 342, 18900, 4.8, 156),

('app-lam-video-ai-hang-loat', 'App Làm Video AI Hàng Loạt — Render 100+ Video/Ngày', 4,
 'App render hàng loạt video từ kịch bản: tự động ghép ảnh - voice AI - phụ đề, xuất 9:16 sẵn đăng TikTok/Reels.',
 '<h3>Giới thiệu</h3><p>Phần mềm desktop giúp bạn <b>render hàng loạt video</b> từ file kịch bản: app tự động ghép ảnh, tạo voice AI tiếng Việt, chèn phụ đề động và xuất video dọc 9:16. Phù hợp team content cần số lượng lớn mỗi ngày.</p><h3>Cách dùng</h3><p><b>Bước 1:</b> Cài app, nhập file Excel kịch bản theo mẫu.<br><b>Bước 2:</b> Chọn voice AI và preset 9:16.<br><b>Bước 3:</b> Bấm Render All — app tự chạy hàng loạt.</p>',
 '["Render đa luồng, 100+ video/ngày","Voice AI tiếng Việt tự nhiên","Tự động chèn phụ đề động","Đọc kịch bản từ file Excel","Preset 9:16 / 16:9 / 1:1","Hỗ trợ cài đặt 1-1 qua Ultraview"]',
 '["Electron","FFmpeg","TTS AI"]',
 'v1.0', 899000, 1799000, '/videos/posters/thumb-app-video-ai.jpg', '', '', 'https://drive.google.com/drive/folders/WEBSKILL-app-lam-video-ai-hang-loat', 'https://drive.google.com/drive/folders/WEBSKILL-app-lam-video-ai-hang-loat', 'Windows + macOS', 'app', 0, 1, 0, 129, 8400, 4.7, 52),

('combo-video-ai-all-in-one', 'COMBO All-In-One: 3 Khóa Học + 3 Skill + Chatbot + App', 5,
 'Trọn bộ WebSkill AI trong 1 gói: 3 khóa học, 3 skill theo ngách, chatbot kịch bản và app render — tiết kiệm 55%.',
 '<h3>Giới thiệu</h3><p>Gói cao cấp nhất của WebSkill AI: sở hữu <b>toàn bộ</b> 3 khóa học (Muse AI, Seedance 2.5, Google Flow Veo), 3 skill theo ngách (Thuỷ Sinh, Làm Vườn, Affiliate Fitness), chatbot viết kịch bản và app render hàng loạt — với giá chỉ bằng một nửa mua lẻ.</p><h3>Quyền lợi</h3><p>Truy cập trọn đời, nhận mọi khóa học và skill mới ra mắt trong 12 tháng, hỗ trợ ưu tiên 1-1 qua Zalo.</p>',
 '["3 khóa học video AI trị giá 2.1 triệu","3 skill theo ngách trị giá 1.2 triệu","Chatbot kịch bản + app render","Tặng mọi sản phẩm mới trong 12 tháng","Truy cập trọn đời, update miễn phí","Hỗ trợ ưu tiên 1-1 qua Zalo"]',
 '["Muse AI","Seedance 2.5","Google Flow","Veo"]',
 'v1.0', 1999000, 4599000, '/videos/posters/thumb-combo-all-in-one.jpg', '', '', 'https://drive.google.com/drive/folders/WEBSKILL-combo-all-in-one', '', '—', 'combo', 1, 1, 0, 87, 14300, 5.0, 42);

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
  ((SELECT id FROM products WHERE slug='combo-video-ai-all-in-one'), 4, 5, 'Mua combo rẻ hơn một nửa so với mua lẻ. Giao link ngay sau khi chuyển khoản.');

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
