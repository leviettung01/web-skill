-- ============================================
-- Migration 0005: Replace 2 placeholder MCP products with the 6 real AI Agent Video Editing Skills
-- Leaves all existing downloadable skills (product_type='skill') and admin products untouched.
-- ============================================

SELECT setval(pg_get_serial_sequence('products', 'id'), COALESCE((SELECT MAX(id) FROM products), 1), (SELECT COUNT(*) > 0 FROM products));

DELETE FROM combo_items WHERE product_id IN (SELECT id FROM products WHERE slug='mcp-skill-agent-video-viral-30s');
DELETE FROM cart_items WHERE product_id IN (SELECT id FROM products WHERE slug='mcp-skill-agent-video-viral-30s');
DELETE FROM wishlists WHERE product_id IN (SELECT id FROM products WHERE slug='mcp-skill-agent-video-viral-30s');
DELETE FROM products WHERE slug='mcp-skill-agent-video-viral-30s' AND id NOT IN (SELECT product_id FROM order_items) AND id NOT IN (SELECT product_id FROM licenses);
UPDATE products SET status='draft' WHERE slug='mcp-skill-agent-video-viral-30s';
DELETE FROM combo_items WHERE product_id IN (SELECT id FROM products WHERE slug='mcp-skill-agent-affiliate-tiktok');
DELETE FROM cart_items WHERE product_id IN (SELECT id FROM products WHERE slug='mcp-skill-agent-affiliate-tiktok');
DELETE FROM wishlists WHERE product_id IN (SELECT id FROM products WHERE slug='mcp-skill-agent-affiliate-tiktok');
DELETE FROM products WHERE slug='mcp-skill-agent-affiliate-tiktok' AND id NOT IN (SELECT product_id FROM order_items) AND id NOT IN (SELECT product_id FROM licenses);
UPDATE products SET status='draft' WHERE slug='mcp-skill-agent-affiliate-tiktok';

INSERT INTO products (slug, name, category_id, short_desc, description, features, tech_stack, version, price, original_price, thumbnail, demo_video_url, demo_url, download_url, doc_url, file_size, product_type, is_featured, is_hot, is_new, status, sold_count, view_count, rating, rating_count, mcp_endpoint, mcp_server_name, mcp_clients, mcp_tools, mcp_skill_prompt, mcp_render_webhook) VALUES ('travel-video-editing', 'Travel-Video-Editing — Skill AI Agent Dựng Video Quảng Cáo Du Lịch 9:16', (SELECT id FROM categories WHERE slug='skill-ai-agent-mcp' LIMIT 1), 'Skill AI Agent dựng trọn gói video quảng cáo tour du lịch 9:16 (1080×1920, 30fps, -14 LUFS): tự nghiên cứu B-roll 4K, ghép giọng Vbee/Edge-TTS, chỉnh màu travel cinema, typography GSAP, 47 SFX & render tự động.', '<h3>AI Agent tự động sản xuất video quảng cáo Tour Du Lịch chuẩn Studio 9:16</h3><p><b>Travel-Video-Editing</b> là bộ Skill AI Agent tự đóng gói hoàn chỉnh (<b>HyperFrames + GSAP + Python + FFmpeg</b>) dành cho <b>Claude Code, OpenAI Codex và Antigravity</b>. Chỉ cần đưa thông tin tour (điểm đến, lịch trình, giá, hotline), AI Agent sẽ tự viết kịch bản, đọc voiceover, tìm &amp; lọc B-roll 4K không dính watermark, chấm màu chuẩn điện ảnh du lịch, chèn typography tiêu đề nổi bật và xuất thẳng file <code>final.mp4</code> 1080×1920 chuẩn <b>-14.0 LUFS</b>.</p><h3>Bộ Skill bao gồm những gì?</h3><ul><li><b>5 phong cách dựng tour thực chiến:</b> <code>royal-blue</code> (cổ trấn/Châu Âu), <code>festive-red</code> (lễ Tết), <code>autumn-gold</code> (mùa lá đỏ Nhật/Hàn), <code>modern-cyan</code> (tour ngắn ngày) và <code>tropical-bold</code> (flash sale).</li><li><b>9 script tự động hoá toàn phần:</b> <code>doctor.py</code> kiểm tra máy, <code>init_project.py</code> tạo dự án 1 lệnh, <code>vbee_tts.py</code> đọc giọng đa luồng (tự fallback <b>Edge-TTS miễn phí</b>), <code>research_broll.py</code> săn &amp; quét Hook B-roll 4K, <code>build_tour_video.py</code> render đa luồng + master âm thanh sidechain ducking.</li><li><b>Kho tài nguyên có sẵn:</b> Starter template HTML/GSAP hoàn chỉnh, <b>47 file SFX</b> chuyển cảnh, 3 bản nhạc nền fallback không bản quyền và trọn bộ cấu hình 2 video mẫu (Nhật Bản Mùa Lá Đỏ &amp; Phượng Hoàng Cổ Trấn).</li><li><b>Giao hàng kép:</b> Nhận ngay <b>Link Google Drive tải trọn bộ Core-Kit ZIP + Video Demo 1080p gốc</b> qua Gmail &amp; Tài khoản, đồng thời kết nối trực tiếp <b>MCP Server</b> bằng License Key để AI Agent luôn gọi được bản <code>SKILL.md</code> mới nhất.</li></ul><h3>Yêu cầu môi trường</h3><p>Node.js &gt;= 22, FFmpeg &gt;= 7, Python 3.10+ và HyperFrames CLI (có sẵn hướng dẫn tiếng Việt + prompt để AI Agent tự kiểm tra và cài đặt giúp bạn trên máy).</p>', '["AI Agent tự dựng trọn gói video quảng cáo tour 9:16 (1080×1920, 30fps, -14 LUFS)", "Tích hợp sẵn 5 theme du lịch + 47 âm thanh SFX + nhạc nền fallback + 9 script Python", "Tự tìm & kiểm duyệt B-roll 4K, chấm màu travel cinema, không watermark", "Hỗ trợ đọc giọng Edge-TTS miễn phí 100% hoặc Vbee TTS chuẩn studio", "Dùng được 2 cách: Kết nối MCP (Claude / Codex / Antigravity) + Tải ZIP Google Drive", "Tặng kèm Video Demo 1080p gốc & hướng dẫn cài nhanh tiếng Việt gửi thẳng qua Gmail"]', '["MCP Protocol", "Claude", "Codex", "Antigravity", "HyperFrames", "GSAP", "FFmpeg", "Python"]', 'v2.1 MCP', 599000, 1199000, '/static/demos/poster-travel-video-editing.jpg', '/static/demos/demo-travel-video-editing.mp4', '', 'https://drive.google.com/drive/folders/1UMsb-xeokIk9Ibqn0dYeGQMgpuV1k19V', 'https://drive.google.com/file/d/1fVLA5xlGcBT7Us6prHf6_k2tHNSsPU8_/view?usp=sharing', '19.1 MB Kit + MCP', 'mcp_skill', 1, 1, 1, 'published', 48, 3650, 5.0, 21, '', 'khoskill-travel-video', '["Claude", "Codex", "Antigravity"]', '[{"name": "list_licensed_skills", "description": "Liệt kê toàn bộ Skill AI Agent (MCP) đang kích hoạt kèm link tải Google Drive"}, {"name": "get_skill_blueprint", "description": "Nạp toàn bộ SKILL.md chính thức mới nhất, quy trình từng pha & tiêu chuẩn QA của Skill"}, {"name": "get_skill_assets_and_setup", "description": "Lấy link Google Drive bộ Skill Kit (starter template, scripts, SFX, fonts) và lệnh cài môi trường"}, {"name": "generate_video_storyboard", "description": "Tạo kịch bản, chia beat thời gian, 3 biến thể Hook A/B và phụ đề SRT chuẩn Skill"}, {"name": "create_video_from_skill", "description": "Xuất gói thực thi từng pha (chuỗi lệnh Python/Node/HyperFrames/FFmpeg -14 LUFS) cho AI Agent dựng ra final.mp4"}]', '---
name: Travel-Video-Editing
description: >
  Autonomous, self-contained end-to-end Travel Tour Advertisement Director (9:16 Reels/TikTok/Shorts, 1080x1920 30fps, -14 LUFS).
  Includes multi-threaded Vbee TTS (+ edge-tts fallback), parallel 4K B-roll search/probe/hook-motion scanning (`yt-dlp`), FFmpeg studio travel
  color grading (`travel-poetic` / `travel-vivid` / `travel-night`), HyperFrames + GSAP typography engine, 47 bundled SFX stems, offline fallback BGM,
  full starter templates, and complete rendered demo reels + recipes. Use whenever asked to create, script, remix, or edit travel tour promotional videos.
---

# Ads Travel Tour Director (Self-Contained Studio Engine v2.1)

Create broadcast-grade **9:16 (`1080×1920`, `30fps`)** travel tour advertisement videos modeled on the 5 studio reference reels bundled in [`demo/studio-reference-samples/`](demo/studio-reference-samples/).

Read before authoring scripts or timelines:
1. [`references/style-analysis.md`](references/style-analysis.md) — 5 tour archetypes, verbatim Vietnamese script patterns, loudness (`-14.1 LUFS`), cutting cadence.
2. [`references/component-catalog.md`](references/component-catalog.md) — `window.TOUR_EDIT` (`assets/edit.js`) schema, themes, hooks, `framed16x9`, `collage3`, captions, gift-boxes.
3. [`references/hook-color-grading.md`](references/hook-color-grading.md) — `1215px` 4K vertical crop rule, `0–6s` Hook motion rules, FFmpeg color grades.
4. [`demo/README.md`](demo/README.md) — Inspect two complete worked projects + rendered `final.mp4` demos ([Japan Autumn](demo/nhat-ban-mua-la-do/) & [China Heritage](demo/phuong-hoang-truong-gia-gioi/)).

Let `$SKILL_DIR` denote the folder containing this `SKILL.md` (`<repo>/.agents/skills/ads-travel-tour` or your agent''s installed skills directory).

---

## Phase 0 — Environment Preflight & Cross-Platform Project Init

1. **Verify Runtime & Bundled Assets Once per Machine**:
   ```bash
   python "$SKILL_DIR/scripts/doctor.py"
   ```
   If anything is missing, install Python deps with `pip install -r "$SKILL_DIR/requirements.txt"`, ensure **Node.js `>= 22`** + **FFmpeg `>= 7`** (`libx264`, `loudnorm`, `selectivecolor`, `cas`, `drawtext`) are on `PATH`, and install `hyperframes` (`npm install -g hyperframes` or `npm install --prefix "$SKILL_DIR"`).

2. **Initialize a Fresh Project Directory (`$PROJ`)**:
   ```bash
   python "$SKILL_DIR/scripts/init_project.py" --out "./projects/tour-<slug>"
   ```
   *(Optional: pass `--from-demo nhat-ban-mua-la-do` or `--from-demo phuong-hoang-truong-gia-gioi` to start from a verified demo recipe, plus `--theme`, `--brand-html`, `--hotline`.)*

   Never edit `assets/starter-template/` directly; build every tour inside `$PROJ`.

---

## Phase 1 — Brief Audit, Destination Facts & Archetype Selection

1. **Parse Tour Brief** (fill studio defaults only where omitted):
   - Tour title, duration, route stops, departure dates (`KH: ...`), price (`TỪ 8.990.000Đ` / `129.900K`), airlines, hotel standard (`3–4★` / `4–5★`), perks.
   - Default branding if omitted: `Hoàng Việt Open` / `Hoàng Việt Travel` (`dulichvietnam`), Hotline `0888 762 958`, `93 Hồng Hà, Ba Đình, Hà Nội`.
2. **Verify Itinerary & Bilingual Keywords → `$PROJ/FACTS.md`**:
   - Research exact landmark names in both **Vietnamese/English** and **local language** (Chinese `凤凰古城 航拍 4K`, Japanese/Korean/Thai) so `research_broll.py` retrieves clean 4K native aerials.
3. **Select One Visual Archetype**:
   - `royal-blue`: Ancient towns, mountains, Europe/China cultural heritage.
   - `festive-red`: Holidays, Christmas/Tet, multi-departure comparisons (`priceGiftBox`, `framed16x9`, `collage3`).
   - `autumn-gold`: Seasonal FOMO & multi-route tours (`CUNG ĐƯỜNG VÀNG` pills + fiery double-stroked gradient titles + `emphasizeLast`).
   - `modern-cyan`: 4–6 day comfort/culinary tours with `promoBadge` + word-pop `captions[]`.
   - `tropical-bold`: Flash-sale beat-driven montages with optional music-only mode + 2-line inclusions footer.

---

## Phase 2 — Evocative Script & Parallel TTS Voiceover

1. **Author `$PROJ/narration.txt` (1 Spoken Beat per Line)** or structured `$PROJ/beats.json`:
   - Follow the **Complementary Visual–Voice Rule**: Voice paints vivid emotion & storytelling (*~115–165 words* for `38–58s`, or *~210–250 words* for `80–95s`); on-screen graphics show concise scannable facts (destination, pill, price, hotline).
   - Expand numeric symbols in speech text (`4-5*` → `bốn đến năm sao`, `8.990.000đ` → `tám triệu chín trăm chín mươi nghìn đồng`).

2. **Synthesize Voiceover (Multi-Threaded Vbee TTS + Automatic `edge-tts` Fallback)**:
   Configured by default with `n_hanoi_female_hongyenclonevoice_zero_shot_news_vc` (override via `--voice`, `--app-id`, `--token` or env vars `VBEE_VOICE`, `VBEE_APP_ID`, `VBEE_TOKEN`):
   ```bash
   python "$SKILL_DIR/scripts/vbee_tts.py" \
     --beats-json "$PROJ/beats.json" --workers 6 \
     --rate 1.02 --lead-in 0.35 --pause 0.30 --tail-pad 0.90 \
     --out "$PROJ/assets/audio/voice.wav"
   ```
   *(Or pass `--text-file "$PROJ/narration.txt"`. Automatically appends the zero-shot anti-clipping sentinel `. , , Chấm.` and trims sentinel tails accurately.)*

3. **Audio Check**: Inspect `$PROJ/assets/audio/voice_cues.json` and listen to `$PROJ/assets/audio/voice.wav` to verify natural pacing and zero clipped final syllables.

---

## Phase 3 — Parallel 4K B-Roll Discovery, Hook Scan & Color Grading

Target **16–38 clean clips** (`1.7s – 3.1s` each) mapped 1:1 to every beat in `voice_cues.json`. Never allow TikTok/Douyin/CapCut logos, competitor hotlines, still photos, or intro title text in clips.

**Parallel Wave Execution Tip**: Run Phase 2 TTS (`vbee_tts.py`), BGM fetch (`fetch_bgm.py`), and YouTube 4K search (`research_broll.py --yt-search --check-4k`) concurrently!

1. **Search 4K SDR Sources + Inspect User Media**:
   ```bash
   python "$SKILL_DIR/scripts/research_broll.py" \
     --yt-search "Mount Fuji autumn 4K drone;Shirakawago autumn 4K;Osaka castle autumn 4K" \
     --limit 4 --check-4k --out "$PROJ/assets/broll"
   ```
   Also supported: `--bili-search` (Bilibili 4K China scenic drones), `--probe-urls "u1;u2;u3;u4"` (4 concurrent downloads with `yt-dlp -N 8` + 8-thread timestamped `.probe.jpg` contact sheets), `--spaiauto-batch` / browser delegation via `https://tools.spaiauto.com/batch-downloader` (Douyin/TikTok no-watermark), `--mixkit`, `--wikimedia`, and `--inspect-folder`.

2. **Rank Dynamic Poetic Hooks Across 4K Cache (`--scan-hooks`)**:
   ```bash
   python "$SKILL_DIR/scripts/research_broll.py" \
     --scan-hooks "$PROJ/assets/broll/_cache" --workers 12 \
     --out "$PROJ/assets/broll/_hook_lab"
   ```
   Inspect every `.probe.jpg` and `_hook_candidates.jpg` visually before committing timestamps to `$PROJ/broll_plan.json` (see `references/hook-color-grading.md` for `1215px` width, `motion >= 5.0`, and `travel-poetic` / `travel-vivid` / `travel-heritage` / `travel-night` grades).

3. **Encode Parallel 1080×1920 Graded Clips & Verify**:
   ```bash
   python "$SKILL_DIR/scripts/research_broll.py" \
     --prepare-json "$PROJ/broll_plan.json" --workers 8 \
     --out "$PROJ/assets/broll"
   ```
   **MANDATORY VISUAL GATE**: Inspect `$PROJ/assets/broll/_broll_verify.jpg`. Confirm `low_res_warnings: []` (every vertical clip shows `>= 1000px` native width, typically `1215px`), vibrant destination colors, and zero burned-in titles/watermarks. Fix any bad `ss` timestamp and re-run `--prepare-json` before rendering.

---

## Phase 4 — Compose Timeline (`assets/edit.js`), BGM & Snapshot QA

1. **Author `$PROJ/assets/edit.js` (`window.TOUR_EDIT`)** using [`references/component-catalog.md`](references/component-catalog.md):
   - Set `duration` to match `voice_cues.json` `total_duration`.
   - Cover `[0, duration]` seamlessly with `clips[]` (`end` of clip `i` == `t` of clip `i+1`).
   - Lock `hook`, `overlays[]`, `captions[]`, and `outro` timestamps directly to `voice_cues.json` cues.
2. **Fetch Destination-Matched BGM** (automatically falls back to bundled `assets/bgm-fallback/*.mp3` if offline):
   ```bash
   python "$SKILL_DIR/scripts/fetch_bgm.py" --tour "<Tour Name>" --out "$PROJ/assets/audio/bgm.mp3"
   ```
3. **Compile Tracks & Run Pre-Render Snapshots**:
   ```bash
   node "$PROJ/tools/build_edit.cjs"
   cd "$PROJ"
   hyperframes snapshot --at "1.0,5.5,14.0,26.0,36.0" --no-end -o snaps
   ```
   **MANDATORY**: Inspect `$PROJ/snaps/contact-sheet.jpg` to verify crisp Vietnamese diacritics, single-line destination labels (`white-space: nowrap`), and zero element overlap before launching the full render.

---

## Phase 5 — Multi-Worker Render, `-14 LUFS` Master & Final QA

1. **Execute Full Automated Build** (`build_edit` → parallel `hyperframes check --json` + `sfx_planner.py` → multi-worker `hyperframes render -q delivery -w <auto up to 16>` → `-14 LUFS` sidechain audio master → `extract_qa_sheet.py`):
   ```bash
   python "$SKILL_DIR/scripts/build_tour_video.py" --proj "$PROJ"
   ```
   *(Pass `--workers N` if tuning Chrome worker concurrency or `--bgm-db -16.5` to adjust music level.)*

2. **Mandatory Final Quality Gate Before Handover**:
   - Visually inspect `$PROJ/out/final.qa.jpg`: verify `black_segments: []`, vivid colors across all 16 frames, legible hooks/badges/hotline, and zero overlaps.
   - Check `$PROJ/out/final.mastered.wav` & `audio_master` JSON output: confirm integrated loudness `≈ -14.0 LUFS` (`true peak <= -1.0 dBTP`), clear voiceover above ducked BGM, and subtle non-cluttering SFX.
   - Verify deliverables exist: `$PROJ/out/final.mp4` and `$PROJ/out/final.qa.jpg`.', '') ON CONFLICT (slug) DO UPDATE SET name=EXCLUDED.name, category_id=EXCLUDED.category_id, short_desc=EXCLUDED.short_desc, description=EXCLUDED.description, features=EXCLUDED.features, tech_stack=EXCLUDED.tech_stack, version=EXCLUDED.version, price=EXCLUDED.price, original_price=EXCLUDED.original_price, thumbnail=EXCLUDED.thumbnail, demo_video_url=EXCLUDED.demo_video_url, download_url=EXCLUDED.download_url, doc_url=EXCLUDED.doc_url, file_size=EXCLUDED.file_size, product_type='mcp_skill', status='published', mcp_server_name=EXCLUDED.mcp_server_name, mcp_clients=EXCLUDED.mcp_clients, mcp_tools=EXCLUDED.mcp_tools, mcp_skill_prompt=EXCLUDED.mcp_skill_prompt;

INSERT INTO products (slug, name, category_id, short_desc, description, features, tech_stack, version, price, original_price, thumbnail, demo_video_url, demo_url, download_url, doc_url, file_size, product_type, is_featured, is_hot, is_new, status, sold_count, view_count, rating, rating_count, mcp_endpoint, mcp_server_name, mcp_clients, mcp_tools, mcp_skill_prompt, mcp_render_webhook) VALUES ('viral-talking-head-video-edit', 'Viral-Talking-Head-Video-Edit — Skill AI Agent Walking 3-Plane Depth 9:16', (SELECT id FROM categories WHERE slug='skill-ai-agent-mcp' LIMIT 1), 'Skill AI Agent dựng video Walking & Spatial Talking Head (Field Motion v2): tự tách nền AI U2-Net đặt chữ khổng lồ phía sau người nói, text 3D mặt đất, KPI sparkline, B-roll strip & phụ đề động khớp từng từ.', '<h3>Hiệu ứng chữ khổng lồ sau lưng người nói (3-Plane AI Depth) hoàn toàn tự động</h3><p><b>Viral-Talking-Head-Video-Edit</b> (<b>Field Motion v2</b>) biến <b>Claude Code, Codex hoặc Antigravity</b> thành một editor dựng video Talking Head ngoài trời / đi bộ đẳng cấp agency. Đưa vào 1 file <code>raw.mp4</code>, AI Agent tự phân tích khuôn mặt, nhận diện lời nói từng từ bằng Whisper, tự tách nền chủ thể thành video VP9 trong suốt (<b>ONNX U2-Net</b>) để đặt typography khổng lồ &amp; lưới kiến trúc <b>nằm phía sau người nói</b>.</p><h3>Điểm nổi bật trong bộ Skill</h3><ul><li><b>Tách lớp 3-Plane AI Depth thật:</b> Script <code>cutout_subject.py</code> tự xuất WebM alpha kênh trong suốt, khoá đồng bộ chuyển động camera giữa nền, lớp chữ khổng lồ phía sau và chủ thể phía trước.</li><li><b>14 component chuyển động modular:</b> Chữ sau lưng người nói (<code>depthHeadline</code>), thẻ KPI biểu đồ đường, dải ảnh B-roll đa khung (<code>brollStrip</code>), thẻ so sánh đôi, bảng thông số góc trời và phụ đề kinetic đa kiểu chữ.</li><li><b>Tự phát hiện nhạc nền có sẵn:</b> Tránh chồng 2 lớp nhạc gây rối tiếng, tự lọc nhiễu giọng nói, gắn SFX tinh tế và master chuẩn <b>-14.0 LUFS</b>.</li><li><b>Giao hàng kép:</b> Tải ngay <b>Core-Kit ZIP + Video Demo 1080p gốc trên Google Drive</b> (gửi ngay qua Gmail) và kết nối trực tiếp <b>MCP Server</b> bằng License Key.</li></ul><h3>Phù hợp với ai?</h3><p>Creator quay vlog ngoài trời, môi giới BĐS đi thực tế dự án, chủ doanh nghiệp/chuyên gia xây kênh Reels, TikTok, Shorts cần hiệu ứng dựng cao cấp mà không phải ngồi keyframe hàng giờ trong After Effects.</p>', '["Tự tách chủ thể AI (ONNX U2-Net VP9 Alpha) đặt chữ khổng lồ phía sau người nói", "14 component hiện đại: KPI sparkline, B-roll multi-card, so sánh đôi, kinetic caption", "Tự bóc băng Whisper khớp timing từng từ + phát hiện nhạc nền sẵn trong clip thô", "Cổng QA tự động trích 20 khung hình kiểm tra không che mặt, không khung đen", "Dùng song song MCP (Claude / Codex / Antigravity) & bộ Skill Kit tải từ Google Drive", "Tặng kèm Video Demo 1080p gốc + file INSTALL.md & hướng dẫn tiếng Việt"]', '["MCP Protocol", "Claude", "Codex", "Antigravity", "HyperFrames", "GSAP", "ONNX U2-Net", "FFmpeg"]', 'v2.0 MCP', 599000, 1199000, '/static/demos/poster-viral-talking-head-video-edit.jpg', '/static/demos/demo-viral-talking-head-video-edit.mp4', '', 'https://drive.google.com/drive/folders/1xQ8z5OZ2HbYx3EId5j9KuEf2C0SP68uN', 'https://drive.google.com/file/d/1xVZDRhleuhiHtcBmaHMKY13UKZlV2hPb/view?usp=sharing', '12.2 MB Kit + MCP', 'mcp_skill', 1, 1, 1, 'published', 53, 4120, 5.0, 24, '', 'khoskill-viral-talking-head', '["Claude", "Codex", "Antigravity"]', '[{"name": "list_licensed_skills", "description": "Liệt kê toàn bộ Skill AI Agent (MCP) đang kích hoạt kèm link tải Google Drive"}, {"name": "get_skill_blueprint", "description": "Nạp toàn bộ SKILL.md chính thức mới nhất, quy trình từng pha & tiêu chuẩn QA của Skill"}, {"name": "get_skill_assets_and_setup", "description": "Lấy link Google Drive bộ Skill Kit (starter template, scripts, SFX, fonts) và lệnh cài môi trường"}, {"name": "generate_video_storyboard", "description": "Tạo kịch bản, chia beat thời gian, 3 biến thể Hook A/B và phụ đề SRT chuẩn Skill"}, {"name": "create_video_from_skill", "description": "Xuất gói thực thi từng pha (chuỗi lệnh Python/Node/HyperFrames/FFmpeg -14 LUFS) cho AI Agent dựng ra final.mp4"}]', '---
name: Viral-Talking-Head-Video-Edit
description: Self-contained script-driven production skill for Walking & Spatial Talking Head videos (9:16 Reels/TikTok/Shorts). Synthesizes 3-plane AI depth masking (VP9 alpha subject cutouts in front of giant typography & blueprint grids), 3D perspective floor text, sky vector HUDs, dark sleek KPI sparkline cards, multi-card B-roll strips, dual comparison cards, and mixed-weight kinetic captions. Includes full template, self-contained scripts, creative playbook, and approved demo video.
---

# Field Motion v2 — Spatial Walking Talking Head Director

Produce dynamic, **script-driven** Walking & Spatial Talking Head videos (`1080×1920`, `30fps`) using **HyperFrames + GSAP + ONNX U2-Net Subject Cutouts + FFmpeg**. Text and graphics integrate directly into the filmed environment—**behind** the walking speaker (`#behind-stage` + VP9 alpha cutouts), tilted onto ground/horizon planes, or anchored cleanly in sky & edge HUDs—never repeating cookie-cutter frosted-glass boxes across every video.

**Read these bundled guides before designing `assets/edit.js`:**
- [`references/creative-playbook.md`](references/creative-playbook.md) — Script-to-visual reasoning loop, 5 distinct blueprints, and verified QA guardrails
- [`references/style-archetypes.md`](references/style-archetypes.md) — Themes (`Architect`, `Street Hustle`, `Organic Depth`, `Studio Authority`), caption dialects, and scene-aware rules
- [`references/component-catalog.md`](references/component-catalog.md) — Full schema for all 14 modular components + caption markup
- [`examples/demo-real-estate-walking/README.md`](examples/demo-real-estate-walking/README.md) — Full approved demo (`out/final.mp4`, `assets/edit.js`, `out/final.qa.jpg`)

For fresh environment setup on another machine, see [`INSTALL.md`](INSTALL.md).

---

## Phase 0 — Locate Skill Root, Activate Runtime & Copy Template

Set `$SKILL_DIR` to the folder containing this `SKILL.md` (in `d:\Skill Edit`, that is `d:\Skill Edit\.agents\skills\field-motion-walking`):

```powershell
# In d:\Skill Edit workspace, activate Node 22 + Python tools:
if (Test-Path "d:\Skill Edit\scripts\activate-env.ps1") { . "d:\Skill Edit\scripts\activate-env.ps1" }

$SKILL_DIR = "<path-to-field-motion-walking>"
$SCRIPTS   = "$SKILL_DIR\scripts"
$PROJ      = "<output-project-dir>"   # e.g. d:\Skill Edit\projects\<slug>

Copy-Item "$SKILL_DIR\template" $PROJ -Recurse -Force
New-Item -ItemType Directory -Path "$PROJ\probe","$PROJ\snaps","$PROJ\out","$PROJ\assets\icons" -Force | Out-Null
```

Never edit `$SKILL_DIR\template\` per project; always customize inside `$PROJ`.

---

## Phase 1 — Footage Audit, Scene Cuts & Embedded BGM Check

Run the bundled analyzer on the raw footage:

```powershell
python "$SCRIPTS\analyze_walking.py" "<raw_video.mp4>" --out-dir "$PROJ\probe" --lang auto --model medium
```

1. **Inspect BOTH `$PROJ\probe\face_grid.jpg` AND `$PROJ\probe\timeline_grid.jpg` via `read_file`:**
   - Map every shot type along `scene_cuts` (talking/walking on camera vs tour/B-roll vs drone aerial).
   - Spot any **burned-in labels or watermarks** in raw footage so your overlays steer cleanly around them.
   - Check `headTop` and wardrobe/background luminance to pick high-contrast `depthHeadline` colors.
2. **Check `$PROJ\probe\raw_analysis.json`:**
   - Note `audio.has_embedded_bgm`: if `true`, the raw video already has music in non-speech gaps — do **NOT** stack a second competing BGM track in Phase 5!
   - Read `$PROJ\probe\transcript.json` for word-level timestamps (`@time`).
3. **Bake a crisp, airy outdoor grade into `$PROJ\assets\a-roll.mp4` (`1080×1920`, `30fps`, `-g 10`):**
   ```powershell
   ffmpeg -y -v error -i "<raw_video.mp4>" `
     -vf "fps=30,scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,hqdn3d=1.0:1.0:3:3,eq=contrast=1.06:saturation=1.07:brightness=0.02:gamma=1.01,unsharp=5:5:0.45:5:5:0.0" `
     -c:v libx264 -preset fast -crf 18 -g 10 -movflags +faststart -c:a aac -ar 48000 -ac 2 "$PROJ\assets\a-roll.mp4"
   ```

---

## Phase 2 — Real Alpha Subject Cutouts (3-Plane Depth)

Identify every talking/walking-head interval where `depthHeadline` typography or translucent zoning/calendar grids should sit **behind** the speaker, then run the bundled `cutout_subject.py` (uses `onnxruntime` + `cv2` + `u2net.onnx`):

```powershell
# Use a Python interpreter with onnxruntime + cv2 + numpy installed (e.g. C:\voice_pro_installer\env\python.exe)
python "$SCRIPTS\cutout_subject.py" "$PROJ\assets\a-roll.mp4" `
  --out-dir "$PROJ\assets" --range "0.0:6.967" --range "32.033:35.000"
```

This outputs VP9 transparent WebMs (`assets/fg_01.webm`, `assets/fg_02.webm`, ... with `yuva420p` and `alpha_mode=1`). Declare them in `EDIT.cutouts` inside `assets/edit.js` (`engine.js` locks `EDIT.cam` onto both `#cam` and `#fg-cam` simultaneously!).

---

## Phase 3 — Script-Driven Creative Choreography & Assets

Follow [`references/creative-playbook.md`](references/creative-playbook.md) to craft a unique `assets/edit.js` driven by **the script''s meaning + visual shots** (never duplicate a previous project''s exact sequence):
- **Icons / B-Roll / SFX:** Use bundled `fetch_assets.py` or extract clean stills directly from `assets/a-roll.mp4` (`st_*.jpg` for `brollStrip` / `dualCompareCards`):
  ```powershell
  python "$SCRIPTS\fetch_assets.py" --iconify "home,compass,trending-up,check-circle" --icon-color "#ffffff" --out "$PROJ\assets"
  ```
- **Caption Design:** Mix `*accent` (gold highlight), `^cyan`, `#pill` (dark ink on bright pill), `[darkpill]`, `~serif` (`Playfair`), `{outline}`, and `sm / !HERO` or `-minimal` sentence lines synced word-by-word via `@time`. Always strip clutter and place captions cleanly (`y: 1410..1460` or dynamic per beat).

---

## Phase 4 — Compile, Pre-Flight Check & Snapshot QA

```powershell
Set-Location $PROJ
node tools\build_edit.cjs
npx.cmd hyperframes check --json
npx.cmd hyperframes snapshot --at "1.2,5.4,8.8,15.2,22.5,29.6,33.8,36.1,38.8,42.2,45.8,48.6" --no-end -o snaps
```

**Mandatory:** Inspect `snaps\contact-sheet*.jpg` via `read_file` BEFORE full render! Verify:
- Subject cutouts isolate the speaker cleanly over `depthHeadline`
- Zero overlap with faces, eyes, or burned-in source labels
- All UI labels are `>= 28px` and crisp on bright/dark backgrounds

---

## Phase 5 — Render & Audio Master (`-14 LUFS`)

```powershell
Set-Location $PROJ
ffmpeg -y -v error -i "assets\a-roll.mp4" -vn -af "highpass=f=70,acompressor=threshold=-20dB:ratio=2.2:attack=10:release=120:makeup=1.2" -ac 2 -ar 48000 "assets\voice_clean.wav"
python "$SCRIPTS\sfx_planner_fm.py" "assets\edit.js" --sfx-dir "assets\sfx-lib" --out "assets\sfx_plan.json"
npx.cmd hyperframes render --fps 30 --quality delivery --low-memory-mode -o "out\video_silent.mp4"

# If audio.has_embedded_bgm == false, add `--bgm "assets\music\chill-lofi.mp3" --bgm-db -19`
python "$SCRIPTS\audio_master.py" --voice "assets\voice_clean.wav" --sfx "assets\sfx_plan.json" --mux-video "out\video_silent.mp4" --out "out\final.mp4"
```

---

## Phase 6 — Final Visual & Audio QA

```powershell
python "$SCRIPTS\extract_qa_sheet.py" "$PROJ\out\final.mp4" --cols 5 --rows 4
```

Inspect `out\final.qa.jpg` via `read_file` and confirm:
- `black_segments: []` (zero unintended black frames)
- `measured_lufs` within `±0.5 LU` of `-14.0 LUFS` and `measured_true_peak_dbtp <= -1.0`
- Bright, natural skin tones and sharp typography across every beat', '') ON CONFLICT (slug) DO UPDATE SET name=EXCLUDED.name, category_id=EXCLUDED.category_id, short_desc=EXCLUDED.short_desc, description=EXCLUDED.description, features=EXCLUDED.features, tech_stack=EXCLUDED.tech_stack, version=EXCLUDED.version, price=EXCLUDED.price, original_price=EXCLUDED.original_price, thumbnail=EXCLUDED.thumbnail, demo_video_url=EXCLUDED.demo_video_url, download_url=EXCLUDED.download_url, doc_url=EXCLUDED.doc_url, file_size=EXCLUDED.file_size, product_type='mcp_skill', status='published', mcp_server_name=EXCLUDED.mcp_server_name, mcp_clients=EXCLUDED.mcp_clients, mcp_tools=EXCLUDED.mcp_tools, mcp_skill_prompt=EXCLUDED.mcp_skill_prompt;

INSERT INTO products (slug, name, category_id, short_desc, description, features, tech_stack, version, price, original_price, thumbnail, demo_video_url, demo_url, download_url, doc_url, file_size, product_type, is_featured, is_hot, is_new, status, sold_count, view_count, rating, rating_count, mcp_endpoint, mcp_server_name, mcp_clients, mcp_tools, mcp_skill_prompt, mcp_render_webhook) VALUES ('skill-edit-bds', 'Skill-Edit-BDS — Skill AI Agent Dựng Video BĐS Bản Đồ GeoLayers & 3D Blender 9:16', (SELECT id FROM categories WHERE slug='skill-ai-agent-mcp' LIMIT 1), 'Siêu Skill AI Agent dựng video review Bất Động Sản 9:16 chuẩn Pure Cinema: tự lấy bản đồ vệ tinh & ranh giới OSM thật, tính diện tích/khoảng cách, dựng mô hình 3D kiến trúc bằng Blender, callout tiện ích 45° & WebGL2 B-roll.', '<h3>Biến AI Agent thành Đạo diễn Video Bất Động Sản GeoLayers 3D đẳng cấp</h3><p><b>Skill-Edit-BDS</b> là gói Skill cao cấp nhất dành riêng cho ngành <b>Bất Động Sản, Quy hoạch &amp; Review Dự án</b>. Thay vì phải thuê đội dựng After Effects + GeoLayers 3 + Blender tốn hàng triệu đồng mỗi clip, AI Agent (<b>Claude Code, Codex, Antigravity</b>) tự chạy trọn bộ quy trình 8 pha để tạo ra video dọc <code>1080×1920</code> 30fps sắc nét như phim điện ảnh.</p><h3>Quy trình 8 pha tự động hoàn chỉnh bên trong Skill</h3><ul><li><b>Bản đồ vệ tinh &amp; dữ liệu địa lý thật (OpenStreetMap + MapLibre):</b> Script <code>fetch_geolayers_geo.py</code> tự lấy ranh giới lô đất, trục đường huyết mạch, tự tính chính xác diện tích <code>ha</code> (Shoelace) và khoảng cách tiện ích <code>km</code> (Haversine) — không bịa số liệu.</li><li><b>Mô hình 3D kiến trúc đặt khớp từng mét trên lô đất (Blender 5.x ENU GLB):</b> Thư viện <code>architectural_3d_lib.py</code> dựng shophouse, biệt thự, toà tháp PBR nổi lên theo 4 giai đoạn (<code>Stage_01..04</code>) kèm ảnh preview kiểm duyệt.</li><li><b>Hiệu ứng điện ảnh Pure Cinema:</b> Mây mở màn FBM, camera zoom xuyên mây vào dự án, thẻ callout tiện ích kính mờ góc 45° (Vincom, bệnh viện, trường học), chuyển cảnh WebGL2 (whip-blur, flash, gold/ice grade) và typography không khung hộp sang trọng.</li><li><b>Trọn gói tài nguyên đóng gói sẵn:</b> 42 font chữ, Three.js + GSAP, 4 mô hình 3D GLB gốc, 22 file âm thanh SFX/BGM WAV, 10 script tự động và trọn bộ dự án mẫu <b>KĐT Hà Mỹ Hưng</b>.</li></ul><h3>Giao hàng ngay lập tức</h3><p>Thanh toán xong nhận ngay <b>Link Google Drive bộ Skill Kit + Demo 1080p gốc</b> qua Gmail &amp; Tài khoản, kèm <b>License Key kết nối MCP</b> vào Claude, Codex, Antigravity.</p>', '["Dựng video BĐS bản đồ vệ tinh GeoLayers 9:16 + zoom xuyên mây FBM chuẩn điện ảnh", "Tự lấy ranh giới OSM thật, tự tính diện tích (ha) & khoảng cách tiện ích (km) chuẩn xác", "Tích hợp thư viện Blender 5.x dựng mô hình 3D kiến trúc (shophouse, biệt thự) đặt khớp lô đất", "Thẻ POI kính mờ 45°, chuyển cảnh WebGL2 B-roll FX, 42 font & 22 file SFX/BGM WAV", "Hỗ trợ giọng thu âm sẵn, Edge-TTS miễn phí hoặc Vbee TTS + master -14.0 LUFS", "Dùng kết hợp MCP (Claude / Codex / Antigravity) + trọn bộ Core-Kit ZIP trên Google Drive"]', '["MCP Protocol", "Claude", "Codex", "Antigravity", "GeoLayers / MapLibre", "Blender 3D", "Three.js", "HyperFrames"]', 'v2.0 Pro MCP', 1500000, 2990000, '/static/demos/poster-skill-edit-bds.jpg', '/static/demos/demo-skill-edit-bds.mp4', '', 'https://drive.google.com/drive/folders/1HNySHC1dYMGKTHrPah0LeVIetGG0yLm5', 'https://drive.google.com/file/d/1lA9mXo5PPc0WbdPnFoZGR9eWT61HMjv3/view?usp=sharing', '15.2 MB Kit + MCP', 'mcp_skill', 1, 1, 1, 'published', 37, 5240, 5.0, 19, '', 'khoskill-edit-bds', '["Claude", "Codex", "Antigravity"]', '[{"name": "list_licensed_skills", "description": "Liệt kê toàn bộ Skill AI Agent (MCP) đang kích hoạt kèm link tải Google Drive"}, {"name": "get_skill_blueprint", "description": "Nạp toàn bộ SKILL.md chính thức mới nhất, quy trình từng pha & tiêu chuẩn QA của Skill"}, {"name": "get_skill_assets_and_setup", "description": "Lấy link Google Drive bộ Skill Kit (starter template, scripts, SFX, fonts) và lệnh cài môi trường"}, {"name": "generate_video_storyboard", "description": "Tạo kịch bản, chia beat thời gian, 3 biến thể Hook A/B và phụ đề SRT chuẩn Skill"}, {"name": "create_video_from_skill", "description": "Xuất gói thực thi từng pha (chuỗi lệnh Python/Node/HyperFrames/FFmpeg -14 LUFS) cho AI Agent dựng ra final.mp4"}]', '---
name: Skill-Edit-BDS
description: Autonomous Real Estate & GeoLayers 9:16 (1080x1920) vertical map explainer director in HyperFrames. Includes full creative & scriptwriting direction (FACTS.md verification, 4 hook archetypes, multi-genre adaptation, Less-Text visual hierarchy), dynamic WebGL2 B-roll transitions (whip-blur, snap ease, flash, UV pan, grade), official yt-dlp probe/crop workflows, Voice-First sync (user audio or Vbee/edge-tts), baked satellite maps with FBM opening clouds + radial whip-zoom + OSM arteries, custom PBR Blender GLBs with progressive Stage_01..04 reveals, frosted-glass map callouts with 45-degree leaders, sidechain-ducked SFX (-14 LUFS), and strict >=8.5/10 visual QA.
---

# GeoLayers 9:16 Vertical Map Reel Director

Turnkey **all-inclusive** creative + multi-layer technical pipeline for `1080×1920` (30fps) Pure-Cinema map & real-estate reels.
**Mandatory first reads before starting any new project**:
1. Inspect the bundled reference showcase in `demo/` ([demo/README.md](demo/README.md), `demo/demo_qa_sheet.jpg` via `read_file`, `demo/FACTS.md`, `demo/reel_config.json`, and `demo/demo_final.mp4`) so you understand the exact quality bar (`>= 8.5/10`).
2. Read `references/creative-direction.md` so you design the story, hook, B-roll FX, 3D models, typography hierarchy, and audio emotion specifically for your script instead of cloning one rigid formula.

---

## Phase 0 — Environment Activation & 1-Command Project Bootstrap

1. Activate runtime (`node >= 22`, `hyperframes`, `ffmpeg`, `ffprobe`, `blender`, `playwright-core`, `yt-dlp`, Python venv). If working inside `D:\Skill Edit`:
```powershell
. "d:\Skill Edit\scripts\activate-env.ps1"
```
2. Set `$SKILL_DIR` (this skill folder) and initialize your fresh project in **one command** using the bundled `assets/starter-template/` (includes Pure Cinema engine JS/CSS, 42 fonts, Three.js + GSAP, 4 base 3D GLBs, and all 22 WAV BGM/SFX audio stems):
```powershell
$SKILL_DIR = "D:\Skill Edit\.agents\skills\geolayers-map-reel"   # Or path where this skill resides
$SCRIPTS   = "$SKILL_DIR\scripts"
$PROJ      = "D:\Skill Edit\projects\<slug>"
python "$SCRIPTS\bootstrap_project.py" --dest "$PROJ" --brand "<PROJECT_NAME>"
```
Run `python "$SCRIPTS\bootstrap_project.py" --check-only` anytime to diagnose dependencies. Do **not** edit `assets/starter-template/` directly; edit inside `$PROJ`.

---

## Phase 1 — Authentic Geolocation & `FACTS.md` Research

Before scripting a single sentence, populate `$PROJ\FACTS.md` cleanly per `references/creative-direction.md`:
1. Run `search_web` on official portals (provincial resolutions/administrative mergers, CafeLand, developer docs) to lock **verified hard numbers**: developer, ward/city address (old & merged post-2025 names), scale (`ha`), unit breakdown, flagship arterial roads, nearby schools/hospitals/plazas/parks, handover stage, and pricing (`triệu/m²`).
2. Author `geo_query.json` in `$PROJ` using verified coordinates (`lng`, `lat`) for `project_center`, key `points` (surrounding landmarks), precise site `ring` polygon verified against satellite tiles, administrative `polygons`, and `roads_center`.
3. Fetch authentic OpenStreetMap geometry (**use exact `--spec` and `--out` flags**). `fetch_geolayers_geo.py` automatically calculates Shoelace `area_ha` per polygon and Haversine `distances_from_origin_km` from your first point so you never invent distances or areas:
```powershell
python "$SCRIPTS\fetch_geolayers_geo.py" --spec "$PROJ\geo_query.json" --out "$PROJ\assets\geo\geo_data.json"
```
Inspect the JSON summary to confirm every polygon & landmark resolved cleanly (`area_ha` and `distances_from_origin_km` go straight into `$PROJ\FACTS.md`).

---

## Phase 2 — Creative Scripting & Voice-First Audio Timing

Design the narration script (`$PROJ\narration.txt`) using the hook formulas, multi-genre structure, and `0.25–0.40s` breathing pauses defined in `references/creative-direction.md` (`6–9 words/line`, ~`135–165` words total for `50–60s`). Avoid bureaucratic phrasing; write natural spoken Vietnamese.

### Option A — User-Provided Voice Recording
```powershell
python "$SCRIPTS\analyze_voice.py" --audio "<user_voice.mp3>" --transcript "$PROJ\narration.txt" --out "$PROJ\assets\audio\voice_cues.json"
```

### Option B — Vbee TTS (Recommended Production Standard)
Always pass `--lead-in 0.8` (clean cloud dive opening before voice enters) and `--safe-tail` (prevents `*_zero_shot_*` voices from dropping the final syllable at buffer end):
```powershell
python "$SCRIPTS\vbee_tts.py" --text-file "$PROJ\narration.txt" `
  --voice <VBEE_VOICE_CODE> --app-id $env:VBEE_APP_ID --token $env:VBEE_TOKEN `
  --rate 1.0 --lead-in 0.8 --safe-tail --out "$PROJ\assets\audio\voice.wav"
```
Outputs synced `voice.wav`, `voice_cues.json`, and `voice.srt`.

### Option C — Offline Fallback (`edge-tts`)
Run `edge-tts --voice vi-VN-NamMinhNeural -f "$PROJ\narration.txt" --write-media "$PROJ\assets\audio\voice.mp3"` followed by `analyze_voice.py`.

**Mandatory Speech Verification**: Inspect `$PROJ\assets\audio\voice_cues.json` AND listen to a trimmed ending preview slice if using a zero-shot voice to confirm zero clipped words before building video timings.

---

## Phase 3 — Official & Royalty-Free B-Roll Preparation

Every B-roll clip **must** be verified visually before compositing and compiled to 0-indexed frames (`f00000.jpg`...`f{N-1}.jpg`):

1. Prefer verified official developer renders/flycams (`search_web` + `yt-dlp`) and supplement with Mixkit (`--search`):
```powershell
python "$SCRIPTS\fetch_broll.py" --search "modern architecture aerial,luxury villa,city night lights" --out "$PROJ\assets\broll"
```
2. For any YouTube/official 16:9 flycam or review video, probe it first with `--probe-video` (downloads 1080p cache via `yt-dlp` and emits a timestamped `*.probe.jpg` sheet):
```powershell
python "$SCRIPTS\fetch_broll.py" --probe-video "https://www.youtube.com/watch?v=..." --out "$PROJ\assets\broll"
```
Inspect `*.probe.jpg` via `read_file`, discard split-screens/watermarks/hotlines, and put the clean `"yt_url"`, `"ss"`, `"dur"`, and vertical `"crop"` (e.g. `"608:1080:656:0"`) in `$PROJ\broll_plan.json`.
3. Download/crop/extract 30fps sequences & visual montage sheet (**use `--download-json` and `--out` flags**):
```powershell
python "$SCRIPTS\fetch_broll.py" --download-json "$PROJ\broll_plan.json" --out "$PROJ\assets\broll"
```
4. **Visually inspect `$PROJ\assets\broll\_broll_verify.jpg` via `read_file`** to ensure zero upside-down crops, zero split screens, zero overlaid third-party logos, and confirm `assets\broll\broll_frames.json` was generated cleanly.

---

## Phase 4 — Satellite Camera Choreography & Bake

Author `$PROJ\camera_plan.json` aligned strictly to `voice_cues.json` beat windows (`references/grammar-and-keyframes.md`). Then bake deterministic satellite tiles + 2D screen projections from your fetched `$PROJ\assets\geo\geo_data.json`:
```powershell
node "$SCRIPTS\bake_geolayers_camera.mjs" --plan "$PROJ\camera_plan.json" `
  --geo "$PROJ\assets\geo\geo_data.json" --out "$PROJ\assets\maps"
```

---

## Phase 5 — Blender 5.3 ENU Architectural 3D Models

Create bespoke project 3D models (not generic floating cubes!) aligned 1:1 to parcel coordinates (`references/3d-construction-pipeline.md`; inspect `demo/build_demo_3d.py` as a complete complex example):
1. Write `$PROJ\build_project_3d.py` importing `architectural_3d_lib.py` via `$SCRIPTS` (`os.path.join(SKILL_DIR, "scripts")` added to `sys.path`), compute real parcel `ring_bounds_enu(...)`, lay out `Stage_01..Stage_04` shophouses/villas/towers/monuments inside `75%–80%` parcel bounds, export GLB + `render_eevee_preview()`.
2. Execute via headless Blender 5.3:
```powershell
& "C:\Program Files\Blender Foundation\Blender 5.3\blender.exe" --background --python "$PROJ\build_project_3d.py"
```
3. **Visually inspect the `.preview.png` render via `read_file`** before moving on, and list every ENU GLB under `meta.preloadModels` with `"geo": true`.

---

## Phase 6 — Compose Pure Cinema `reel_config.json` & `sfx_plan.json`

1. Wire `segments[]`, `overlays[]`, `poiMarkers[]`, `geoModels[]`, and `routes[]` in `$PROJ\reel_config.json` following `references/creative-direction.md` and `references/template-library.md`:
   - `showCaptions: false`, `showHud: false`, `showAttribution: false`
   - Lock every segment transition and overlay entrance cleanly to `voice_cues.json` (`cue.start - 0.12s`)
   - Enrich B-roll segments with WebGL2 motion FX (`ease: "snap"`, `whipIn`, `whipOut`, `flashIn`, `panFrom/panTo`, `grade: "gold" | "ice"`) suited to scene energy
   - Use only boxless Cinema typography templates (`editorial_title`, `brand_flicker.cinema`, `kinetic_pop.cinema`, `utility_dock`, `blueprint_spec`, `stat_ticker`, `price_spotlight`, `ground_3d.cinema`, `facade_outro` with `style: "monogram"`)
   - Treat on-screen copy as `<= 40%` visual anchors (`<= 14 words` max per beat, `1 Beat = 1 Focus`).
2. Author `$PROJ\assets\audio\sfx_plan.json` using **pre-lapped** cues (`time = cut - 0.08s` for whooshes/whips) across stems in `assets/audio/` at `-20.5` to `-23.0 dB` (`max_dur: 0.35–1.3s`), leaving silent breath before key financial/legal punchlines.

---

## Phase 7 — HyperFrames Render & `-14 LUFS` Mastering

1. Run HyperFrames static & timeline preflight from `$PROJ`:
```powershell
Set-Location $PROJ
npx hyperframes check --json
```
Fix any 404 frame/asset warning before rendering!
2. Render clean 1080×1920 silent video + master voice/ducked-BGM/SFX audio to `-14.0 LUFS`:
```powershell
npx hyperframes render --output "$PROJ\out\raw.mp4"
python "$SCRIPTS\audio_master.py" --voice "$PROJ\assets\audio\voice.wav" `
  --bgm "$PROJ\assets\audio\bgm_pad.wav" --bgm-db -19.0 `
  --sfx "$PROJ\assets\audio\sfx_plan.json" --target-lufs -14.0 `
  --mux-video "$PROJ\out\raw.mp4" --out "$PROJ\out\final_reel.mp4"
```

---

## Phase 8 — Mandatory Multimodal Visual + Audio QA (`>= 8.5/10` Gate)

Never declare completion without running & inspecting BOTH visual and audio diagnostics:
1. Extract 16-tile contact sheet + `blackdetect` verification:
```powershell
python "$SCRIPTS\extract_qa_sheet.py" "$PROJ\out\final_reel.mp4" --cols 4 --rows 4
```
2. Inspect `$PROJ\out\final_reel.qa.jpg` via `read_file` AND inspect opening/mid/ending audio slices (`0–6s`, mid, last `8s`) rendered from `final_reel.mp4` via `read_file`.
3. Grade strictly (`>= 8.5/10` required; fix & re-render if lower):
   - Zero `black_segments` and zero `404` missing frames
   - Accurate geographic borders, inside-parcel 3D scale, non-overlapping 45° POI callouts
   - Voice-First sync (narration aligns with visuals cleanly from start to end; zero clipped final syllable)
   - Balanced `-14.0 LUFS` audio where SFX accents cuts lightly (`-20.5..-23 dB`) without masking speech
   - Pure Cinema clean boxless text over dynamic imagery.', '') ON CONFLICT (slug) DO UPDATE SET name=EXCLUDED.name, category_id=EXCLUDED.category_id, short_desc=EXCLUDED.short_desc, description=EXCLUDED.description, features=EXCLUDED.features, tech_stack=EXCLUDED.tech_stack, version=EXCLUDED.version, price=EXCLUDED.price, original_price=EXCLUDED.original_price, thumbnail=EXCLUDED.thumbnail, demo_video_url=EXCLUDED.demo_video_url, download_url=EXCLUDED.download_url, doc_url=EXCLUDED.doc_url, file_size=EXCLUDED.file_size, product_type='mcp_skill', status='published', mcp_server_name=EXCLUDED.mcp_server_name, mcp_clients=EXCLUDED.mcp_clients, mcp_tools=EXCLUDED.mcp_tools, mcp_skill_prompt=EXCLUDED.mcp_skill_prompt;

INSERT INTO products (slug, name, category_id, short_desc, description, features, tech_stack, version, price, original_price, thumbnail, demo_video_url, demo_url, download_url, doc_url, file_size, product_type, is_featured, is_hot, is_new, status, sold_count, view_count, rating, rating_count, mcp_endpoint, mcp_server_name, mcp_clients, mcp_tools, mcp_skill_prompt, mcp_render_webhook) VALUES ('video-talking-head', 'Video-Talking-Head — Skill AI Agent Edit Talking Head Viral Engine v6 (9:16)', (SELECT id FROM categories WHERE slug='skill-ai-agent-mcp' LIMIT 1), 'Skill AI Agent dựng video Talking Head phong cách Apple Sky / Sunlit Botanical / Editorial Warm: tự cắt khoảng lặng không lệch khẩu hình, chỉnh màu da sáng đẹp, headroom motion UI kính mờ, PiP & phụ đề khớp từng từ.', '<h3>Dựng video Talking Head phong cách Creator triệu view chỉ từ 1 file quay thô</h3><p><b>Video-Talking-Head (Engine v6)</b> đóng gói toàn bộ tư duy đạo diễn và bộ khung kỹ thuật giúp <b>Claude Code, Codex, Antigravity</b> biến video người nói chuyện thô (<code>raw.mp4</code>) thành video Reels/TikTok/Shorts mượt mà, giàu cảm xúc và giữ chân người xem xuyên suốt.</p><h3>Những điểm đắt giá bên trong Engine v6</h3><ul><li><b>3 bộ theme thẩm mỹ chuẩn studio:</b> <code>apple-sky</code> (công nghệ/phân tích hiện đại), <code>sunlit-botanical</code> (câu chuyện cá nhân/du lịch/truyền cảm hứng), <code>editorial-warm</code> (chia sẻ gần gũi/podcast).</li><li><b>Khoá khung hình thông minh &amp; vùng an toàn TikTok/Reels:</b> Tự đo toạ độ đầu, mắt, cằm và tay từ <code>face_grid.jpg</code> để đặt Motion UI phía trên trán và đặt phụ đề đúng vùng an toàn không bị thanh công cụ TikTok che khuất.</li><li><b>Cắt khoảng lặng &amp; lỗi vấp mượt mà:</b> Cắt chính xác theo từng khung hình <code>1/30s</code> tránh trượt lip-sync, khử nhiễu, nâng nét &amp; chỉnh màu da tự nhiên trước khi gắn phụ đề Whisper khớp từng từ <code>0.01s</code>.</li><li><b>Hệ thống UI chuyển động phong phú:</b> <code>heroHook</code> đẩy camera 10s đầu, <code>browserPip</code>, <code>storyBroll</code>, <code>splitGlassCompare</code>, <code>frostTitle</code> kính mờ, <code>paradoxChart</code>, <code>empathyPulseCard</code>, SFX không lặp và master <b>-14 LUFS</b>.</li></ul><h3>Giao hàng trọn gói</h3><p>Nhận ngay <b>Link Google Drive bộ Skill Kit (template + scripts + nhạc/SFX + Demo 1080p)</b> qua Gmail và kích hoạt <b>MCP Server</b> dùng ngay trong Claude, Codex, Antigravity.</p>', '["3 theme thiết kế sẵn: Apple Sky, Sunlit Botanical và Editorial Warm chuẩn creator hiện đại", "Tự đo khuôn mặt khoá vùng an toàn headroom & phụ đề không bị UI TikTok/Reels che", "Tự cắt khoảng lặng/nói vấp chuẩn từng frame 1/30s không lệch khẩu hình + lọc nhiễu giọng", "Bóc băng Whisper khớp từng từ 0.01s + bộ chuyển cảnh kính mờ, PiP, B-roll & biểu đồ", "Kết hợp linh hoạt MCP (Claude / Codex / Antigravity) & tải bộ Skill Kit từ Google Drive", "Đóng gói sẵn thư viện nhạc nền, SFX, template Engine v6 & hướng dẫn cài nhanh tiếng Việt"]', '["MCP Protocol", "Claude", "Codex", "Antigravity", "HyperFrames", "GSAP", "Whisper", "FFmpeg"]', 'v6.0 MCP', 599000, 1199000, '/static/demos/poster-video-talking-head.jpg', '/static/demos/demo-video-talking-head.mp4', '', 'https://drive.google.com/drive/folders/16sEz_KfepuNM_RxWbCJsVd9pKtJsBh4I', 'https://drive.google.com/file/d/1lxzE8l4urPkRSc_0nTTIYDIFRfgFqTAL/view?usp=sharing', '16.2 MB Kit + MCP', 'mcp_skill', 1, 0, 1, 'published', 44, 3180, 4.9, 17, '', 'khoskill-video-talking-head', '["Claude", "Codex", "Antigravity"]', '[{"name": "list_licensed_skills", "description": "Liệt kê toàn bộ Skill AI Agent (MCP) đang kích hoạt kèm link tải Google Drive"}, {"name": "get_skill_blueprint", "description": "Nạp toàn bộ SKILL.md chính thức mới nhất, quy trình từng pha & tiêu chuẩn QA của Skill"}, {"name": "get_skill_assets_and_setup", "description": "Lấy link Google Drive bộ Skill Kit (starter template, scripts, SFX, fonts) và lệnh cài môi trường"}, {"name": "generate_video_storyboard", "description": "Tạo kịch bản, chia beat thời gian, 3 biến thể Hook A/B và phụ đề SRT chuẩn Skill"}, {"name": "create_video_from_skill", "description": "Xuất gói thực thi từng pha (chuỗi lệnh Python/Node/HyperFrames/FFmpeg -14 LUFS) cho AI Agent dựng ra final.mp4"}]', '---
name: Video-Talking-Head
description: Complete end-to-end Viral Talking Head video editor for AI Agents (9:16 Reels/TikTok/Shorts or 16:9). Turns raw talking-head footage into studio-polished viral MP4s with custom visual themes (Apple Sky-Blue Studio, Sunlit Botanical Travel & Positive Story, Editorial Warm), tailored color grades, tighter silence/stumble trims without lip-sync drift, 1:1 semantic B-roll & AI art, pure-visual headroom motion UI, Vietnamese/English typography, non-repeating SFX, -14 LUFS mastering, and strict visual QA. Use whenever asked to edit raw talking-head, creator story, podcast, founder, travel/tech explainer, or challenge footage into a final viral MP4.
---

# Viral Talking Head Studio — End-to-End AI Agent Playbook (Engine v6)

This skill packages everything required for an AI Agent to go from **raw footage (`raw.mp4`)** + optional user assets to a **studio-grade viral MP4 (`final.mp4`)** matching modern creator benchmarks (`jJwfodKvvj8` retention/motion craft + `9fafd4d9` frosted glass clarity + semantic storytelling B-roll).

Read all three reference guides before writing your edit plan:
1. [`references/creative-playbook.md`](references/creative-playbook.md) — Creative mindset ("tư duy dựng"), hook rhythm, B-roll matching, and exact production pitfall prevention.
2. [`references/style-archetypes.md`](references/style-archetypes.md) — Visual themes (`apple-sky`, `sunlit-botanical`, `editorial-warm`), skin-safe FFmpeg color grades, BGM pairing, and caption rules.
3. [`references/component-catalog.md`](references/component-catalog.md) — Exact JSON schemas & placement geometry for all `EDIT.fx` components, caption tokens, and camera curves.

---

## Phase 0 — Environment Activation & Project Scaffold

Let `$SKILL_DIR` point to this skill folder (`Video-Talking-Head`). Always copy `$SKILL_DIR\template` into a fresh project folder (never edit `template\` originals directly):

```powershell
if (Test-Path "d:\Skill Edit\scripts\activate-env.ps1") { . "d:\Skill Edit\scripts\activate-env.ps1" }
$SKILL_DIR = "<path-to-Video-Talking-Head>"
$SCRIPTS   = "$SKILL_DIR\scripts"
$PROJ      = "<output-project-dir>"   # e.g. ./projects/<slug>
Copy-Item "$SKILL_DIR\template" $PROJ -Recurse -Force
```

---

## Phase 1 — Story Analysis, Raw Audit & Framing Lock

1. **Run raw footage analysis first:**
   ```powershell
   python "$SCRIPTS\analyze_raw.py" "<raw.mp4>" --out-dir "$PROJ\probe" --lang auto --model medium
   ```
2. **Choose the Theme Archetype (`EDIT.theme`) from Story & Environment:**
   - Analytical critique / tech / SaaS / indoor minimal -> `"apple-sky"` (`chill-lofi.mp3`)
   - Positive personal journey / outdoor / travel / inspiration -> `"sunlit-botanical"` (`acoustic-uplift.mp3` or `uplifting-indie.mp3`)
   - Cozy indoor craft / personal coffee talk -> `"editorial-warm"` (`acoustic-uplift.mp3`)
   Never blindly force cold SaaS blue onto a warm positive personal story (or vice versa).
3. **Inspect `$PROJ\probe\face_grid.jpg` via `read_file`:**
   - Measure exact **`headTop`**, **`eyesCenterY`**, **`chinY`**, and **`handsTopY`**.
   - Set `EDIT.face: [540, eyesCenterY]` so rounded PiP frames always keep the speaker centered!
   - Lock **Headroom Zone (`y = 115 .. min(380, headTop - 30)`)** for floating UI cards. If `headTop < 360px`, apply baseline `EDIT.cam` zoom `>= 1.09, y: +55` to create headroom without exposing top black edges.
   - Lock **Caption Safe Zone (`EDIT.capY`)** cleanly **below `chinY + 60px`** and **above `min(handsTopY - 40, 1500px)`** (`y = 1540` is TikTok/Reels bottom UI collision!).
4. **Audio Envelope Check (`volumedetect` per `0.15s` window) for Clean Trims:**
   - Trim dead pre-roll silence (`-26 dB` air) leaving ~`0.25–0.32s` smile before word 1.
   - Cut clear verbal stumbles/restarts ONLY on frame-exact `1/30s` intervals using `concat=n=2:v=1:a=1` with `0.02s` `afade` micro-dips (avoiding `acrossfade` time shifts!) AND mask any visual jump-cut under a `frostTitle` or `storyBroll` beat!

---

## Phase 2 — Bake Denoise / Upscale / Skin-Safe Color Grade (`assets/a-roll.mp4`)

Always bake color grading + denoise/upscale directly into `assets/a-roll.mp4` (`1080×1920`, `fps=30`, `-g 10`, `-movflags +faststart`) and set `grade: "none"` in `edit.js`:
- Extract a 480p -> 1080p clean upscale using `hqdn3d` **before** `scale=1080:1920:flags=lanczos`, then color curves + gentle `unsharp` (see exact recipes in `references/style-archetypes.md`).
- **Mandatory check:** Extract 1–2 JPG frames of `assets/a-roll.mp4` (`graded_sample_1.jpg`) and inspect via `read_file`. Reject any orange/yellow mud cast or crushed darks.
- Extract `assets/voice_clean.wav` (`highpass=f=85, afftdn=nf=-22:tn=1, acompressor=...`) and **re-run `analyze_raw.py` on the final trimmed `assets/a-roll.mp4`** so every `@time` word timestamp in `edit.js` matches the final cut to `0.01s`.
- **Proofread Vietnamese/technical Whisper typos manually** (e.g., `dấu kín` → `giấu kín`, `Gen Tour` → `Zen Tour`, `làm dầu` → `làm giàu`, `thọt tim` → `thót tim`, `không dành` → `không rành`, `vụn về` → `vụng về`, `giữa trừng` → `giữa chừng`, `vị xí` → `vị trí`).

---

## Phase 3 — Autonomous Asset Research (User First -> Mixkit -> Iconify -> AI Art)

1. **Inspect user-provided folders first** (if supplied):
   ```powershell
   python "$SCRIPTS\fetch_assets.py" --inspect-folder "<user_dir>" --out "$PROJ\assets"
   ```
2. **Fetch matched B-Roll, SVG Icons, Music & SFX (`fetch_assets.py`):**
   - Pass crisp domain keywords (`--mixkit-video "airplane,travel,laptop,city,notebook,nature,vacation,adventure"` + `--icon-color "#2563eb"` or `"#047857"`).
   - **Visually inspect `$PROJ\assets\broll\_broll_verify.jpg` via `read_file`** and drop any dark, irrelevant, or ugly clips before building `edit.js`.
3. **Generate Bespoke 3D Editorial Artwork (`image-generator` subagent):**
   - Request 2–3 landscape `3:2` Apple-style minimalist 3D renders tinted to match your chosen `EDIT.theme` (`#eef4ff` for `apple-sky` or `#faf6ee / #e6f4ee` for `sunlit-botanical`).
   - **Strictly instruct ZERO text/words inside generated images** (captions & chrome are rendered crisply by HTML/CSS). Copy outputs to `$PROJ\assets\ai_gen\` and verify with `read_file`.

---

## Phase 4 — Director Plan & `assets/edit.js` Authoring

Follow these non-negotiable editorial standards (`references/creative-playbook.md`):
- **First 10 Seconds (`jJwfodKvvj8` Hook Camera In-Out):** Open with `heroHook` + brisk `0.65–0.90s` camera push/pull keys synchronized to stressed words using strictly `*.inOut` eases (`power2.inOut`, `power3.inOut`, `back.inOut`, `sine.inOut`).
- **Alternating Visual Cadence Every `1.5–3.5s`:** Rotate smoothly across A-Roll + pure-visual headroom UI (`bioCard`, `statMilestones`, `paradoxChart`, `polishMeterCard`, `empathyPulseCard`, `strikeIcons`, `visualFlowCard`, `heartBalance`, `dayCounter`, `commentPrompt`), full-bleed B-roll (`storyBroll` with optional `pip: true`), `recapStrip`, `splitGlassCompare`, `browserPip`, and `frostTitle` blurred glass interludes. **Never use dark/black void cutaways.**
- **Zero Redundant Text Clutter:** Bottom captions already deliver the spoken script—keep top headroom UI crisp and visual (icons, curves, numbers, 1–3 word labels, never repeating full sentences!).
- **Strict Transition Hygiene (`browserPip` -> `storyBroll`):** Always add `{ type: "lightLeak", t }` and `snapStage: true` on `storyBroll` when immediately following a PiP component so the speaker window never sweeps diagonally mid-screen.
- **Keep Captions Clean:** Never place `!` or `^` mid-line (`parseLines` only parses them at the start of `/` segments); keep `[pill]` and `#pill` badges compact (`1–2` words); set `y: 1435, darkInk: true` inside `browserPip` so captions sit above TikTok''s `y = 1540` bottom bar.

---

## Phase 5 — Build, Check & Snapshot QA BEFORE Full Render

1. Sync `index.html` static declarations & inspect automated layout/contrast/craft gates:
   ```powershell
   Set-Location $PROJ
   node tools\build_edit.cjs
   npx.cmd hyperframes check --json
   ```
   Confirm `lint`, `layout`, `motion`, `contrast`, `craft`, `audio` are all `ok=True` with `0` GSAP warnings.
2. **MANDATORY Multi-Beat Snapshot Inspection:**
   ```powershell
   npx.cmd hyperframes snapshot --at "1.5,6.5,12.5,18.0,22.5,34.5,42.5,48.6,56.5,66.8,73.5,83.0" --no-end -o snaps --json
   ```
   Read all `snaps\contact-sheet*.jpg` via `read_file`. Fix ANY clipped text, pill mid-pop collisions, low contrast, card wrapping, face occlusion, or PiP sweeps immediately before spending time rendering.

---

## Phase 6 — Render, Master Audio (`-14 LUFS`) & Final QA Gate

```powershell
python "$SCRIPTS\sfx_planner.py" "$PROJ\assets\edit.js" `
  --sfx-dir "$PROJ\assets\sfx-lib" `
  --out "$PROJ\assets\sfx_plan.json"

npx.cmd hyperframes render --fps 30 --quality delivery --low-memory-mode -o "$PROJ\out\video_silent.mp4"

python "$SCRIPTS\audio_master.py" `
  --voice "$PROJ\assets\voice_clean.wav" `
  --bgm "$PROJ\assets\music\acoustic-uplift.mp3" --bgm-db -18 `
  --sfx "$PROJ\assets\sfx_plan.json" `
  --mux-video "$PROJ\out\video_silent.mp4" `
  --out "$PROJ\out\final.mp4"

python "$SCRIPTS\extract_qa_sheet.py" "$PROJ\out\final.mp4" --cols 5 --rows 4
```

**Final Visual Sign-off:** Inspect `$PROJ\out\final.qa.jpg` via `read_file` across all 20 frames. Only hand over the final MP4 after confirming `black_segments: []`, `-14 ± 0.5 LUFS` audio master, crisp lip-synced captions, clean PiP geometry, and zero overlapping UI elements.', '') ON CONFLICT (slug) DO UPDATE SET name=EXCLUDED.name, category_id=EXCLUDED.category_id, short_desc=EXCLUDED.short_desc, description=EXCLUDED.description, features=EXCLUDED.features, tech_stack=EXCLUDED.tech_stack, version=EXCLUDED.version, price=EXCLUDED.price, original_price=EXCLUDED.original_price, thumbnail=EXCLUDED.thumbnail, demo_video_url=EXCLUDED.demo_video_url, download_url=EXCLUDED.download_url, doc_url=EXCLUDED.doc_url, file_size=EXCLUDED.file_size, product_type='mcp_skill', status='published', mcp_server_name=EXCLUDED.mcp_server_name, mcp_clients=EXCLUDED.mcp_clients, mcp_tools=EXCLUDED.mcp_tools, mcp_skill_prompt=EXCLUDED.mcp_skill_prompt;

INSERT INTO products (slug, name, category_id, short_desc, description, features, tech_stack, version, price, original_price, thumbnail, demo_video_url, demo_url, download_url, doc_url, file_size, product_type, is_featured, is_hot, is_new, status, sold_count, view_count, rating, rating_count, mcp_endpoint, mcp_server_name, mcp_clients, mcp_tools, mcp_skill_prompt, mcp_render_webhook) VALUES ('phan-tich-style-video-lich-su', 'Phan-Tich-Style-Video-Lich-Su — Skill AI Agent Phim Tài Liệu & Bản Đồ Lịch Sử 16:9', (SELECT id FROM categories WHERE slug='skill-ai-agent-mcp' LIMIT 1), 'Skill AI Agent dựng phim tài liệu lịch sử 16:9 (1920×1080, 30fps) chuẩn tư liệu: tích hợp sẵn GeoJSON bản đồ Việt Nam 63 tỉnh + Hoàng Sa & Trường Sa, bản đồ chiến dịch 3D, hiệu ứng phim nhựa, Playwright DOM QA & -14 LUFS.', '<h3>Xây kênh YouTube Phim Tài Liệu Lịch Sử &amp; Địa Chính Trị 16:9 hoàn toàn bằng AI Agent</h3><p><b>Phan-Tich-Style-Video-Lich-Su</b> được xây dựng chuẩn theo dự án mẫu 5 phút <b>Chiến dịch Điện Biên Phủ 1954</b>. Bộ Skill trao cho <b>Claude Code, Codex, Antigravity</b> toàn bộ công cụ để nghiên cứu sự kiện, viết kịch bản 6 hồi chặt chẽ, biên dịch bản đồ GeoJSON chính xác và dựng video tài liệu Full HD <code>1920×1080</code> đậm chất điện ảnh tư liệu.</p><h3>Tài nguyên &amp; công nghệ tích hợp sẵn</h3><ul><li><b>Bản đồ Việt Nam GeoJSON chuẩn chủ quyền:</b> Đóng gói sẵn <code>vn_provinces_pre2025.geojson</code> &amp; <code>ne_50m_countries.geojson</code> hiển thị chính xác 63 tỉnh thành cùng <b>Quần đảo Hoàng Sa (Việt Nam)</b> và <b>Quần đảo Trường Sa (Việt Nam)</b>, zoom mượt từ bản đồ quốc gia xuống mặt trận chiến dịch.</li><li><b>Hiệu ứng chiến dịch &amp; tư liệu điện ảnh:</b> Mũi tên tiến công động, mô hình cứ điểm/lô cốt 3D, hạt phim nhựa film-grain, vệt scanline cổ điển, khung ảnh chân dung nổi trên nền mờ và phụ đề 2 dòng không bao giờ bị gãy chữ.</li><li><b>7 công cụ Python CLI độc lập:</b> <code>build_vietnam_atlas.py</code>, <code>tts_edge_vi.py</code> (giọng đọc tiếng Việt miễn phí), <code>tts_elevenlabs_doc.py</code> (ElevenLabs điện ảnh), <code>slice_broll_clean.py</code> (cắt sạch logo truyền hình), <code>audio_soundtrack_and_master.py</code> (-14 LUFS), <code>audit_doc_composition.py</code> (kiểm tra DOM bằng trình duyệt thật) và <code>qa_rendered_mp4.py</code>.</li><li><b>Giao hàng trọn bộ:</b> Link Google Drive tải ngay <b>Core-Kit ZIP + Video Demo 5 phút Điện Biên Phủ 1954 Full HD</b> qua Gmail, kèm <b>License Key MCP</b> kết nối trực tiếp AI Agent.</li></ul>', '["Dựng phim tài liệu lịch sử 16:9 (1920×1080, 30fps) theo cấu trúc kịch bản 6 hồi chuẩn YouTube", "Tích hợp sẵn GeoJSON bản đồ Việt Nam 63 tỉnh + Quần đảo Hoàng Sa & Trường Sa chuẩn xác", "Hiệu ứng bản đồ chiến dịch, mũi tên tiến công, phim nhựa archival grain & phụ đề không gãy dòng", "7 script tự động + Playwright DOM Auditor kiểm duyệt bố cục trước khi render", "Hỗ trợ Edge-TTS tiếng Việt miễn phí hoặc ElevenLabs + tự hòa âm nhạc nền chuẩn -14 LUFS", "Tặng kèm Demo Full HD 5 phút Điện Biên Phủ 1954 trên Google Drive + kết nối MCP trực tiếp"]', '["MCP Protocol", "Claude", "Codex", "Antigravity", "HyperFrames", "GeoJSON SVG", "GSAP", "Playwright QA"]', 'v2.0 MCP', 599000, 1199000, '/static/demos/poster-phan-tich-style-video-lich-su.jpg', '/static/demos/demo-phan-tich-style-video-lich-su.mp4', '', 'https://drive.google.com/drive/folders/10voSUQhmKQ2I7Di1ExkS4q2hUgph7vE5', 'https://drive.google.com/file/d/1EwWVcR7pReM4kv5KXqD2TIbhb-FBCzvk/view?usp=sharing', '24.0 MB Kit + MCP', 'mcp_skill', 1, 0, 1, 'published', 39, 2940, 4.9, 16, '', 'khoskill-video-lich-su', '["Claude", "Codex", "Antigravity"]', '[{"name": "list_licensed_skills", "description": "Liệt kê toàn bộ Skill AI Agent (MCP) đang kích hoạt kèm link tải Google Drive"}, {"name": "get_skill_blueprint", "description": "Nạp toàn bộ SKILL.md chính thức mới nhất, quy trình từng pha & tiêu chuẩn QA của Skill"}, {"name": "get_skill_assets_and_setup", "description": "Lấy link Google Drive bộ Skill Kit (starter template, scripts, SFX, fonts) và lệnh cài môi trường"}, {"name": "generate_video_storyboard", "description": "Tạo kịch bản, chia beat thời gian, 3 biến thể Hook A/B và phụ đề SRT chuẩn Skill"}, {"name": "create_video_from_skill", "description": "Xuất gói thực thi từng pha (chuỗi lệnh Python/Node/HyperFrames/FFmpeg -14 LUFS) cho AI Agent dựng ra final.mp4"}]', '---
name: Phan-Tich-Style-Video-Lich-Su
description: End-to-end self-contained production kit and QA director for serious historical documentary videos (16:9, 1920x1080 @ 30fps) matching the studio archival style (Dien Bien Phu 1954 reference). Includes bundled official Vietnam/world GeoJSON borders with Hoàng Sa & Trường Sa, studio transition SFX, 7 standalone Python CLI tools, clean 4-scene starter composition, complete 5-minute rendered demo package, and strict Playwright + FFmpeg -14 LUFS QA gates. Use whenever asked to create, research, script, edit, audit, or render historical documentaries, timelines, biographies, or archival map explainers.
---

# Historical Archival Documentary Skill (`style-doc-history`)

Complete, workspace-agnostic production kit for **16:9 (`1920x1080`, `30fps`)** archival documentaries modeled on `examples/dien-bien-phu-1954/dien_bien_phu_1954_5m_v5.mp4`. Everything needed — map geometry, SFX, scripts, HTML/CSS/GSAP starter, Playwright DOM auditor, FFmpeg `-14 LUFS` mastering, and the full 5-minute demo project — is self-contained inside this skill directory.

---

## Packaged Resources Inventory

| Folder | Contents | Purpose |
| :--- | :--- | :--- |
| `starter/` | `index.html`, `package.json`, `hyperframes.json`, `meta.json`, sample plates, `assets/maps/doc_map_data.js`, `assets/audio/master.wav` | Clean 24s 4-scene turnkey project to copy when starting any new documentary |
| `examples/dien-bien-phu-1954/` | **`dien_bien_phu_1954_5m_v5.mp4`**, `.qa.jpg`, `FACTS.md`, `SCRIPT_5M.md`, `index.html`, `51` curated stills, `11` B-roll clips, `master_5m.wav`, scrubbed helper scripts | Complete 5-minute reference project showing target visual, sound, and pacing bar |
| `assets/maps/` | `vn_provinces_pre2025.geojson`, `ne_50m_countries.geojson` | Official 63-province mainland + regional GeoJSON geometry |
| `assets/sfx/` | `sfx_impact_warm.wav`, `sfx_shutter.wav`, `sfx_switch.wav`, `sfx_whoosh_air.wav`, `sfx_whoosh_deep.wav` | Non-repeating transition & reveal sound effects |
| `scripts/` | `build_vietnam_atlas.py`, `tts_elevenlabs_doc.py`, `tts_edge_vi.py`, `audio_soundtrack_and_master.py`, `slice_broll_clean.py`, `audit_doc_composition.py`, `qa_rendered_mp4.py` | 7 standalone CLI helpers replacing brittle ad-hoc glue |
| `references/` | `style-guide.md`, `qa-fix-workflows.md`, `component-catalog.md`, `script-and-source-guide.md` | Visual rules, component HTML/JS specs, scriptwriting checklists, QA playbooks |

---

## End-to-End 8-Phase Director Workflow

Before running HyperFrames or Python tools in this workspace, activate the runtime:

```powershell
. "scripts/activate-env.ps1"
```

### Phase 1 — Research & Fact-Grounding (`FACTS.md`)
1. Copy `starter/` to `projects/<slug>/` (also mirrored at `templates/hyperframes-doc-history/`).
2. Read `references/script-and-source-guide.md`. Research primary historical sources (Báo Nhân Dân, TTXVN, National Archives, military museums) and record verified dates, troop counts, direct quotes, and named artifacts in `FACTS.md`.
3. Collect at least **1.8x–2.2x unique historical photos as scenes** (no repeated still in adjacent scenes; include genuine portraits of named people and photos of specifically narrated items such as letters, vehicles, weapons).

### Phase 2 — 6-Act Script & Narration Blocks (`SCRIPT.md` + `audio_chunks.json`)
Write a 6-act narrative script matched to an explicit scene breakdown table, then create `audio_chunks.json` with one object per scene containing `id`, `act`, `text_v3` (with subtle tags like `[somber]`, `[measured]`, `[calm]`), plain `text_v2` fallback, `pause_before_s`, and `pause_after_s`.

### Phase 3 — Official GeoJSON Map Compilation
Generate crisp equirectangular SVG geometry (with provincial borders AND both **`Q.đ. Hoàng Sa (Việt Nam)`** & **`Q.đ. Trường Sa (Việt Nam)`** plotted accurately):

```powershell
python "<SKILL_DIR>/scripts/build_vietnam_atlas.py" --out assets/maps/doc_map_data.js --global-var DOC_MAP_DATA
```
*(Pass `--config custom_map_config.json` to add custom operational theater paths/anchors from OSM Overpass JSON or custom GeoJSON.)*

### Phase 4 — Voice Synthesis & Timings Alignment (`voice_master_raw.wav` + `voice_timings.json`)
- **Studio Narration (ElevenLabs, recommended when `ELEVENLABS_API_KEY` is available):**
  ```powershell
  $env:ELEVENLABS_API_KEY = "<your-key>"
  python "<SKILL_DIR>/scripts/tts_elevenlabs_doc.py" --voice-id <voice_id> --chunks audio_chunks.json --mode v4 --lang vi --output-dir assets/audio
  ```
- **Free Offline-Style Edge Neural TTS Fallback:**
  ```powershell
  python "<SKILL_DIR>/scripts/tts_edge_vi.py" --chunks audio_chunks.json --voice vi-male --rate="-4%" --output-dir assets/audio
  ```
*(Note: pass negative `--rate` using `--rate="-4%"` syntax so CLI arg parsing never mistakes `-4%` for a flag.)*

Lock every GSAP reveal, blast flash, and HUD transition window directly to the measured timestamps in `assets/audio/voice_timings.json`.

### Phase 5 — Archive B-Roll Slicing & Watermark Cleanup
Crop out broadcast tickers/watermarks, strip original audio (`-an`), normalize cadence to `30fps`, and apply `-movflags +faststart` so Chromium seeks deterministically:

```powershell
python "<SKILL_DIR>/scripts/slice_broll_clean.py" --manifest broll_plan.json
```

### Phase 6 — Soundtrack Synthesis & `-14.0 LUFS` Mastering
Generate the restrained historical minor-to-major score, synthesize foley effects, mix sidechain-ducked SFX cues under speech, and normalize to broadcast `-14.0 LUFS / <= -1.0 dBTP`:

```powershell
python "<SKILL_DIR>/scripts/audio_soundtrack_and_master.py" --voice assets/audio/voice_master_raw.wav --sfx-plan assets/audio/sfx_plan.json --out assets/audio/master.wav
```

### Phase 7 — Author HTML/GSAP Composition (`index.html`)
Read `references/style-guide.md` and `references/component-catalog.md`, then populate `index.html`:
- Root `#root[data-composition-id="main"][data-width="1920"][data-height="1080"][data-duration="<exact_sec>"][data-fps="30"]`.
- Global `#film-fx-canvas` driven deterministically via `mulberry32` `prng(seed)` + `#tv-scanlines` (`z: 825`) + `#global-vignette` (`z: 820`) seated **under** `#global-hud` (`z: 870`).
- **Two-line centered non-wrapping card captions** inside `.photo-card .card-caption`: `.cap-role` (`#f6ce56`, `white-space: nowrap`) + `.cap-sub` (`#e8e0cf`, `white-space: nowrap`). Scale text slightly smaller or tighten copy on narrow cards (`<= 500px`) rather than allowing orphan word wrapping.
- **Portraits over atmospheric backdrops:** Float `.photo-card` portrait frames above a blurred, darkened full-bleed period photo instead of blank void.
- **Macro -> Micro Maps & 3D Bastion Collapse:** Dive smoothly from national map into theater sector; strike enemy 3D watchtowers (`appendIsoMonumentCrest`) with `animateDynamicArrow` and trigger `collapseTowerToFlag` (`svgOrigin: "0 4"` inside local group transforms!) showing a white surrender pennant (`#f2efe6`) beside rubble and the crisp 5-pointed gold star `#c81e24` flag (`appendVietnamVictoryFlag`).
- **Word-Synced Transitions:** Never place `data-start` on nested tags; place `<video class="clip">` top-level siblings cleanly; trigger blast flashes / cable shakes right at exact spoken beat seconds from `voice_timings.json`.

### Phase 8 — Mandatory Audit, Render & Visual QA Gate
Before handing any rendered video to the user, run **all three gates** cleanly:

```powershell
# 1. Asset integrity, consecutive-image check, secret hygiene & live Chrome DOM caption-wrap check
python "<SKILL_DIR>/scripts/audit_doc_composition.py" --project . --timings assets/audio/voice_timings.json --require-browser

# 2. HyperFrames structural/runtime/layout/contrast check + visual frame snapshots
npx --yes hyperframes@0.9.41 check --json
npx --yes hyperframes@0.9.41 snapshot --at 1,15,45,90

# 3. Render final 1920x1080 30fps MP4 & verify -14 LUFS + zero black gaps + contact sheet
npx --yes hyperframes@0.9.41 render
python "<SKILL_DIR>/scripts/qa_rendered_mp4.py" out/final.mp4
```

Inspect snapshots and `.qa.jpg` visually via `read_file` to catch layout drift, mid-fade overlaps, map label clashes, or caption wrapping before finishing. See `references/qa-fix-workflows.md` for step-by-step surgical remediation checklists.

---

## Reference Library

- Visual rules, color grades & CRT limits: `references/style-guide.md`
- HTML/CSS/SVG/GSAP component API: `references/component-catalog.md`
- Fact verification, 6-act structure & B-roll checklist: `references/script-and-source-guide.md`
- Targeted QA symptom-to-fix workflows: `references/qa-fix-workflows.md`', '') ON CONFLICT (slug) DO UPDATE SET name=EXCLUDED.name, category_id=EXCLUDED.category_id, short_desc=EXCLUDED.short_desc, description=EXCLUDED.description, features=EXCLUDED.features, tech_stack=EXCLUDED.tech_stack, version=EXCLUDED.version, price=EXCLUDED.price, original_price=EXCLUDED.original_price, thumbnail=EXCLUDED.thumbnail, demo_video_url=EXCLUDED.demo_video_url, download_url=EXCLUDED.download_url, doc_url=EXCLUDED.doc_url, file_size=EXCLUDED.file_size, product_type='mcp_skill', status='published', mcp_server_name=EXCLUDED.mcp_server_name, mcp_clients=EXCLUDED.mcp_clients, mcp_tools=EXCLUDED.mcp_tools, mcp_skill_prompt=EXCLUDED.mcp_skill_prompt;

INSERT INTO products (slug, name, category_id, short_desc, description, features, tech_stack, version, price, original_price, thumbnail, demo_video_url, demo_url, download_url, doc_url, file_size, product_type, is_featured, is_hot, is_new, status, sold_count, view_count, rating, rating_count, mcp_endpoint, mcp_server_name, mcp_clients, mcp_tools, mcp_skill_prompt, mcp_render_webhook) VALUES ('fitness-video-editing', 'Fitness-Video-Editing — Skill AI Agent Video Gym & Calisthenics Manga 16:9', (SELECT id FROM categories WHERE slug='skill-ai-agent-mcp' LIMIT 1), 'Siêu Skill AI Agent dựng video khoa học tập luyện Gym/Calisthenics phong cách Manga giải phẫu (chuẩn 健身大书 / XXL健身): sẵn 52 tư thế nhân vật RGBA, 21 archetype GSAP, cơ bắp đỏ nổi bật, 43 SFX Foley & render song song nhiều chương.', '<h3>Hệ thống sản xuất Video Khoa Học Gym &amp; Calisthenics phong cách Manga triệu view</h3><p><b>Fitness-Video-Editing</b> tái hiện 1:1 phong cách dựng đình đám của các kênh tỷ view như <b>健身大书 / XXL健身</b> — hỗ trợ song ngữ <b>Tiếng Việt &amp; Tiếng Anh</b>, xuất chuẩn <code>1920×1080</code> (YouTube dài 5–15 phút) hoặc <code>1080×1920</code> (Reels/TikTok/Shorts) hoàn toàn tự động bằng <b>Claude Code, Codex và Antigravity</b>.</p><h3>Sức mạnh kỹ thuật đẳng cấp bên trong gói Pro</h3><ul><li><b>Kho tài sản nhân vật đóng gói sẵn cực lớn:</b> <b>52 tư thế &amp; frame chuyển động nhân vật Manga RGBA đã khoá nền</b> (kéo xà, treo chủ động, khép bả vai, gập bụng, ghế tựa, sửa lỗi sai...) cùng thẻ định danh <code>ref_identity_card.jpg</code>.</li><li><b>Giao thức 5-Lock Chained Cel độc quyền (0.00px rung giật):</b> <code>build_pose_guides.py</code> + <code>register_and_lock_cels.py</code> căn chỉnh điểm nắm xà ở mức sub-pixel, tạo chuỗi chuyển động tập luyện mượt mà không bao giờ bị nhảy thanh xà hay biến dạng nhân vật.</li><li><b>Đa nguồn sinh ảnh AI linh hoạt (<code>ai_image_hub.py</code>):</b> Tận dụng ngay tool tạo ảnh tích hợp của AI Agent (Antigravity / Claude MCP) hoặc kết nối Gemini API, OpenAI, CLIProxy, Stable Diffusion Forge/ComfyUI.</li><li><b>21 Archetype chuyển động &amp; 100% Face-Safe:</b> Callout giải phẫu đặt ngoài đường viền cơ thể không bao giờ che mặt/tay, thẻ nghiên cứu khoa học kèm ảnh tư liệu Wikimedia thật, bộ đếm rep/timer, <b>43 SFX Foley</b>, 5 nhạc nền loop mượt không gián đoạn và <code>render_chapters_parallel.py</code> render đa chương siêu tốc.</li></ul><h3>Giao hàng đầy đủ ngay sau thanh toán</h3><p>Nhận ngay <b>Link Google Drive trọn bộ Core-Kit (52.3 MB) + Video Demo Master 10 phút 41 giây Full HD</b> qua Gmail &amp; Tài khoản, kèm <b>License Key kết nối MCP</b> trọn đời.</p>', '["Phong cách Manga giải phẫu cơ bắp chuẩn 健身大书 / XXL健身 — hỗ trợ cả Tiếng Việt & Tiếng Anh", "Đóng gói sẵn 52 tư thế nhân vật Manga RGBA, 21 archetype GSAP, 43 SFX Foley & 5 nhạc nền BGM", "Công nghệ 5-Lock AI Cel căn chỉnh điểm nắm sub-pixel (0.00px rung giật) + 100% Face-Safe callouts", "Hỗ trợ đa nguồn sinh ảnh AI (Native Agent, Gemini, OpenAI, CLIProxy, SD-WebUI/ComfyUI)", "Render song song nhiều chương siêu tốc + tự loop BGM mượt + master giọng chuẩn -14.0 LUFS", "Tặng kèm Video Demo Master 10m41s Full HD trên Google Drive + kết nối MCP trực tiếp"]', '["MCP Protocol", "Claude", "Codex", "Antigravity", "HyperFrames", "GSAP", "AI Cel 5-Lock", "FFmpeg"]', 'v2.0 Pro MCP', 1500000, 2990000, '/static/demos/poster-fitness-video-editing.jpg', '/static/demos/demo-fitness-video-editing.mp4', '', 'https://drive.google.com/drive/folders/1UtzYMeEjN6QiQyBLZNf7ieAPrQtDzMPp', 'https://drive.google.com/file/d/1hb8qu7BlB4-qhEZYlgOtRLTqVsn_lPMp/view?usp=sharing', '52.3 MB Kit + MCP', 'mcp_skill', 1, 1, 1, 'published', 33, 4890, 5.0, 18, '', 'khoskill-fitness-video', '["Claude", "Codex", "Antigravity"]', '[{"name": "list_licensed_skills", "description": "Liệt kê toàn bộ Skill AI Agent (MCP) đang kích hoạt kèm link tải Google Drive"}, {"name": "get_skill_blueprint", "description": "Nạp toàn bộ SKILL.md chính thức mới nhất, quy trình từng pha & tiêu chuẩn QA của Skill"}, {"name": "get_skill_assets_and_setup", "description": "Lấy link Google Drive bộ Skill Kit (starter template, scripts, SFX, fonts) và lệnh cài môi trường"}, {"name": "generate_video_storyboard", "description": "Tạo kịch bản, chia beat thời gian, 3 biến thể Hook A/B và phụ đề SRT chuẩn Skill"}, {"name": "create_video_from_skill", "description": "Xuất gói thực thi từng pha (chuỗi lệnh Python/Node/HyperFrames/FFmpeg -14 LUFS) cho AI Agent dựng ra final.mp4"}]', '---
name: Fitness-Video-Editing
description: Self-contained, portable End-to-End Bilingual (Vietnamese & English) Fitness, Calisthenics & Gym Science Manga-Anatomical Motion-Graphics Director (16:9 YouTube Long-Form or 9:16 Reels/TikTok/Shorts), modeled 1:1 on `健身大书` and `XXL健身`. Includes complete `starter/` composition (21 deterministic GSAP archetypes, 0.00px multi-worker jitter, 100% Face-Safe outer-silhouette callouts, 52 locked RGBA poses & consecutive AI cel frames, local `.ttf` fonts, 43 Foley SFX stems, 5 royalty-free BGM tracks, 7 archival documentary photos), universal AI image & chained-cel scripts (`ai_image_hub.py` supporting Native Agent tools, CLIProxy, Gemini/OpenAI APIs, ComfyUI/SD-WebUI open-source, plus user setup alerts), paragraph-flow Vbee/Edge-TTS + `faster-whisper` clause alignment, seamless crossfade-looped BGM `-14 LUFS` mastering, parallel chapter rendering, 4 deep Director Playbooks (`references/`), and the full 10m41s rendered flagship demo project (`examples/keo-xa-full-master/`). Use whenever asked to create, script, direct, animate, or edit fitness, calisthenics, workout progression, biomechanics, or fat-loss/muscle-building explainer videos.
---

# Fitness Manga-Anatomical Motion-Graphics Director (`fitness-manga-explainer`)

Autonomous, 100% self-contained production system enabling **any AI Agent** to direct, illustrate, voice, animate, and master studio-grade bilingual (`lang: "vi" | "en"`) Fitness & Calisthenics Science Explainer videos matching **`健身大书`** and **`XXL健身`**.

---

## Package Directory Map (100% Self-Contained Inside This Skill Folder)

Let `$SKILL` denote the folder containing this `SKILL.md`:

- **`$SKILL/starter/`**: Ready-to-copy project template (`index.html`, `hyperframes.json`, `package.json`, `tools/build_fitness.cjs`, `assets/engine.js` with 21 archetypes, `assets/styles.css` with zero-jitter local `.ttf` fonts, `assets/character/` with `ref_identity_card.jpg` + 52 locked RGBA poses & `cel_*` frames, `assets/photos/` archival documentary photos, `assets/sfx-lib/` 43 Foley stems, `assets/music/` looped BGM tracks).
- **`$SKILL/scripts/`**: Standalone Python CLI toolchain:
  - `ai_image_hub.py` — Universal 3-Tier AI Image Provider Detector & Chained Generator (Native Agent tool / CLIProxy / Gemini API / OpenAI / Local SD-WebUI Forge / Custom Open-Source CLI hook + clear user setup prompt when unconfigured).
  - `build_pose_guides.py` — Deterministic spatial body-lift + locked bar/grip guide generator (`guide_01..guide_0N.jpg`) for consecutive AI cel sequences.
  - `prepare_character_pose.py` — Single-pose `#161D29` RGBA isolator & `bar_y` detector.
  - `register_and_lock_cels.py` — Sub-pixel `cv2.matchTemplate` grip/prop registration, enclosed-window RGBA cutout, outer bar-end fade trimming, and exposed steel bar pixel-locking (`0.00px` bar flicker).
  - `vbee_tts_fitness.py` & `build_paragraph_voice.py` — Paragraph-flow natural coaching voice synthesis (Vbee TTS + Edge-TTS fallback for `vi`/`en`) + `faster-whisper` word-completeness check & millisecond clause alignment (`voice.wav`, `voice_cues.json`, `voice.srt`).
  - `fetch_doc_photos.py` — Wikimedia Commons royalty-free archival documentary photo searcher & downloader for `photoDocCard`.
  - `sfx_planner_fitness.py` — Non-repeating pre-baked Foley SFX timeline generator (`sfx_plan_baked.wav` & `sfx_plan.json`).
  - `audio_master_loop.py` — Auto-trimmed seamless `acrossfade` BGM looper + Vocal-Pocket EQ + smooth sidechain ducking (`--bgm-db -17.5`) + `-14.0 LUFS` loudness master + lossless MP4 mux.
  - `render_chapters_parallel.py` — Frame-snapped modular chapter splitter + parallel multi-worker HyperFrames renderer + lossless FFmpeg concatenation.
  - `qa_rendered_mp4.py` — Timestamped `6x6` `.qa.jpg` contact sheet + black-frame + `-14 LUFS` verifier.
- **`$SKILL/references/`** *(Read before authoring!)*:
  1. `references/script-and-pedagogy.md` — **Scriptwriting & Voice Director** (6-Beat retention arc, natural spoken paragraph punctuation rules, Whisper alignment, dual-layer text discipline).
  2. `references/camera-and-pacing-director.md` — **Camera, Visual Pacing & Face-Safe Layout Director** (`4.5–7s` pacing rule, static anatomy vs. cel rep choreography, `camKeyframes`, 100% Face-Safe outer-silhouette callouts, real documentary photo staging).
  3. `references/character-nano-banana.md` — **Multi-Provider AI Image & 5-Lock Chained Cel Director** (Native Agent vs. CLIProxy/API/Open-Source setup, Character + Prop + Position + Grip Registration + Bar-End Trim locks).
  4. `references/motion-components-catalog.md` — **Complete Schema & Recipes for all 21 Scene Archetypes** in `window.FITNESS_PLAN`.
- **`$SKILL/examples/keo-xa-full-master/`**: Complete rendered 10m41s flagship reference project (`out/keo_xa_6_buoc_full_master.mp4`, `106` scenes, `145` Whisper-aligned clauses, `generate_chapters.py`, `.qa.jpg` sheets).

---

## Mandatory Step-by-Step Production Workflow (For Any AI Agent)

### Phase 0 — Environment Activation & AI Image Capability Pre-Flight Check

1. Ensure **Node.js >= 22**, **FFmpeg**, **HyperFrames** (`npx hyperframes --version`), and **Python 3.10+** (`opencv-python`, `numpy`, `edge-tts`; optional `faster-whisper`) are available. (In the `d:\Skill Edit` workspace, run `. "d:\Skill Edit\scripts\activate-env.ps1"`).
2. **Check AI Image Generation Availability BEFORE Planning New Custom Poses**:
   - **Case A — Your AI Agent has a Built-In Image Generation Tool** (e.g. Antigravity `image-generator` subagent, Claude/Cursor MCP image tool, or native multimodal image tool): Use **your own built-in model** directly in Phase 3, passing the exact locked prompt & reference image chain produced by `python "$SKILL/scripts/ai_image_hub.py" --print-agent-prompt ...`!
   - **Case B — Your AI Agent does NOT have a Built-In Image Tool**: Run:
     ```bash
     python "$SKILL/scripts/ai_image_hub.py" --check
     ```
     - If `"has_external_provider": true` (`gemini`, `cliproxy`, `openai`, `sdwebui`, or `custom`), generate images via `ai_image_hub.py --backend auto`.
     - If `"has_external_provider": false` AND the topic requires poses not already covered by the 52 bundled poses in `$SKILL/starter/assets/character/poses/`: **STOP and notify the user clearly** using `user_setup_message_vi` (or `user_setup_message_en`) from `ai_image_hub.py --check` so the user can connect an Image Plugin/MCP, **CLIProxy** (`CLIPROXY_BASE_URL=http://127.0.0.1:8317/v1` + `CLIPROXY_API_KEY` + `CLIPROXY_IMAGE_MODEL`), `GEMINI_API_KEY`, or a local open-source server (**SD-WebUI Forge `--api`** on `SD_WEBUI_URL`, **ComfyUI**, or `AI_IMAGE_CMD`). Never substitute crude stick-figure SVGs for manga character art!

---

### Phase 1 — Scaffold New Project From `$SKILL/starter/`

Copy `$SKILL/starter/` into a clean project folder `$PROJ` (e.g. `projects/<slug>/`), never editing `$SKILL/starter/` or `$SKILL/examples/` in place:

```powershell
Copy-Item -Path "$SKILL\starter" -Destination "$PROJ" -Recurse
```

Choose `lang: "vi"` (Vietnamese) or `lang: "en"` (English) in `$PROJ/assets/fitness-plan.js`.

---

### Phase 2 — Scriptwriting Direction & Natural Paragraph-Flow Voiceover (`40%` of Video Quality!)

Read `references/script-and-pedagogy.md` first.

1. **Structure the script in 6 high-retention beats**:
   - Beat 1: Empathy Hook + Myth Reframe (`0 CÁI` -> `KHÔNG HỀ YẾU!`, Relative Strength vs. Absolute Strength, Roadmap reveal).
   - Beat 2: Interactive 10-second Self-Test + Zero-Equipment Home Reassurance.
   - Beat 3: Real Peer-Reviewed Scientific Studies paired with Real Documentary Photos.
   - Beat 4: Step-by-Step Unlock Loop (`Unlock Padlock -> Static Anatomy Breakdown -> Consecutive AI Cel Rep Demo -> Mistake vs. Clean Fix -> Regression Option & Pass Standard`).
   - Beat 5: Joint Safety (`Muscle Burn ✓` vs `Sharp Joint Pain ✕`), Viewer FAQ, and Home Physics Substitute (`leverPhysics`).
   - Beat 6: Weekly `3x/Week` Split + Self-Test Diagnostic Router + `SCREENSHOT THIS` Blueprint Summary.
2. **Write Complete, Naturally-Punctuated Coaching Paragraphs (`paragraphs.json`)**:
   - Group `2–4` related clauses (`10–18s`) into full paragraphs with natural `,`, `?`, `!`, `.` punctuation so the voice breathes naturally (never synthesize isolated 5-word fragments!).
   - Spell out spoken symbols clearly in `spoken` (`"ba mươi hai phần trăm"`, `"năm nhân năm giây"`) while keeping concise numerals in `display` (`"32%"`, `"5 × 5 giây"`), with each `display` subtitle fitting cleanly on **1 single line (`<= 58` chars)**.
3. **Synthesize Voiceover & Millisecond Clause Timings (`build_paragraph_voice.py`)**:
   ```bash
   python "$SKILL/scripts/build_paragraph_voice.py" \
     --paragraphs "$PROJ/paragraphs.json" \
     --out-dir "$PROJ/assets/audio" \
     --lang vi \
     --voice n_hanoi_male_trietlygiongnam_zero_shot_book_vc \
     --rate 1.02
   ```
   Outputs `$PROJ/assets/audio/voice.wav`, `voice_cues.json` (`b001..bNNN` exact start/end seconds verified by `faster-whisper`), and `voice.srt`.

---

### Phase 3 — Direct AI Character Art, 5-Lock Consecutive Cels & Real Documentary Photos

Read `references/character-nano-banana.md` first.

1. **Reuse or Extend Character Poses (`assets/character/poses/`)**:
   - Inspect `$PROJ/assets/character/poses/poses_manifest.json` (52 pull-up, scapular, hang, chair, table-row, core, and mistake poses/cels already bundled).
2. **For Any New Single Pose (Prop-Included + Crimson Muscle Shading)**:
   - Always pass `$PROJ/assets/character/ref_identity_card.jpg` (1:1 single-character card — NEVER pass the 3-figure sheet!).
   - Draw physical props (bar, chair, table, dumbbells, ab wheel) with natural finger/foot contact AND crimson-red (`#EF4444`) target muscle fibers **directly inside the AI image** on a flat `#161D29` charcoal-slate background with ZERO text/arrows.
   - Isolate RGBA & register `bar_y` with `prepare_character_pose.py`:
     ```bash
     python "$SKILL/scripts/prepare_character_pose.py" raw_pose.jpg \
       -o "$PROJ/assets/character/poses/<pose_id>.png" --bg-tol 20 --target-height 860
     ```
3. **For Any New Consecutive Movement Sequence (`cel_01 .. cel_07`) — Mandatory 5-Lock Protocol**:
   - **Step 3a**: Generate Frame 1 (`raw/cel_01.jpg`, `3:4` on `#161D29`) with the horizontal bar at `Y = 247px` (`~21.5%` from top, leaving headroom for the head at top of pull!).
   - **Step 3b**: Generate locked spatial body-lift guides (`guide_01..07.jpg`):
     ```bash
     python "$SKILL/scripts/build_pose_guides.py" \
       --base-frame "$PROJ/raw/cel_01.jpg" \
       --out-dir "$PROJ/guides" --num-cels 7 --bar-y 247 --total-lift-px 216
     ```
   - **Step 3c**: Generate Frames `2..7` sequentially (`Frame K-1` -> `Frame K`), passing `[ref_identity_card.jpg, raw/cel_{K-1}.jpg, guides/guide_0K.jpg]` + the locked prompt from `ai_image_hub.py --print-agent-prompt` (for Native Agent tools) or `ai_image_hub.py --backend auto`.
   - **Step 3d**: Sub-pixel grip registration + RGBA cutout + **Outer Bar-End Trim & Steel Pixel-Lock** (`0.00px` bar flicker!):
     ```bash
     python "$SKILL/scripts/register_and_lock_cels.py" \
       --poses-dir "$PROJ/assets/character/poses" \
       --master-guide "$PROJ/guides/guide_01.jpg" \
       --register cel_01=raw/cel_01.jpg cel_02=raw/cel_02.jpg ... \
       --master-bar-cel cel_01 \
       --trim-lock-bars cel_01 cel_02 cel_03 cel_04 cel_05 cel_06 cel_07 \
       --qa-out "$PROJ/out/qa_cels.jpg"
     ```
     Inspect `$PROJ/out/qa_cels.jpg` visually via `read_file` and confirm `max_left_bar_diff_px: 0, max_right_bar_diff_px: 0`!
4. **Fetch Real Archival Documentary Photos for Scientific / Real-World Studies (`fetch_doc_photos.py`)**:
   - Whenever mentioning military fitness tests, lab trials, or gym comparisons, pair them with authentic documentary photos in `$PROJ/assets/photos/`:
     ```bash
     python "$SKILL/scripts/fetch_doc_photos.py" --search "military pull ups fitness test"
     python "$SKILL/scripts/fetch_doc_photos.py" --download "File:..." --out "$PROJ/assets/photos/study_photo.jpg"
     ```

---

### Phase 4 — Camera, Pacing & Face-Safe Scene Authoring (`assets/fitness-plan.js`)

Read `references/camera-and-pacing-director.md` and `references/motion-components-catalog.md` (see `$SKILL/examples/keo-xa-full-master/generate_chapters.py` for a complete 106-scene reference script).

1. **Enforce High-Retention Visual Pacing (`4.5s – 7.0s` avg/scene)**:
   - **NEVER** hold a single static screen or chart `> 10s`! Split 15–25s study/FAQ explanations into `4–6s` visual stages mixing `photoDocCard` (`study`, `dualPhoto`, `heroPhoto`), staged charts (`barsOnly` -> `tangledOnly` -> `morph`), `xraySlate`, and `faqSpectrum`.
   - **NEVER** delay child items (`tiers`, `cards`, `bullets`, `steps`) by `> 0.3s` after `sc.t` (zero empty title screens!).
2. **Enforce 100% Face-Safe & Outer-Silhouette Callouts**:
   - **ZERO** circles, badges, or lines over the character''s face (`x = 842..1078, y = 130..360`), chest, hands, or feet (`x = 875..1045`).
   - Place `.body-point-card` boxes in outer left (`boxX: 70..110`) and right (`boxX: 1320..1390`) margins with pointer endpoints outside the silhouette (`x <= 840..875` left, `x >= 1045..1080` right).
3. **Balance Static Anatomical Breakdowns & Consecutive AI Cel Reps**:
   - Use static `pose` + `bodyPoints` / `guideLines` / `focusBox` + `camKeyframes` (`scale: 1.28, y: 115`) when teaching joint mechanics; use `frameSequence` (`crossfade: 0`) + `timer` / `repCounter` when demonstrating timed reps.
4. **Sync `index.html`**:
   ```bash
   node "$PROJ/tools/build_fitness.cjs"
   ```

---

### Phase 5 — Pre-Render `hyperframes check` & Snapshot Inspection

```bash
cd "$PROJ"
npx hyperframes check --json
npx hyperframes snapshot --at "2.0,15.0,42.5" --no-end -o "$PROJ/out/snaps_precheck"
```

Verify `0` lint/runtime/layout errors and visually inspect snapshots via `read_file` to confirm zero clipped text and 100% Face-Safe callouts before full render.

---

### Phase 6 — Fast Parallel Chapter Render + Foley SFX + Seamless Looped BGM (`-14.0 LUFS`)

1. **Render Silent Video (Parallel Chapters for Long-Form!)**:
   ```bash
   python "$SKILL/scripts/render_chapters_parallel.py" \
     --project "$PROJ" \
     --target-chapter-sec 95 \
     --parallel-chapters 3 \
     --workers-per-chapter 5 \
     --out "$PROJ/out/video_silent.mp4"
   ```
2. **Pre-Bake Non-Repeating Foley SFX**:
   ```bash
   python "$SKILL/scripts/sfx_planner_fitness.py" \
     "$PROJ/assets/fitness-plan.js" \
     --sfx-dir "$PROJ/assets/sfx-lib" \
     --out "$PROJ/assets/sfx_plan.json"
   ```
3. **Master Voice + Seamlessly Looped BGM + Foley SFX to `-14.0 LUFS` & Losslessly Mux**:
   - Uses `melodic-fitness-uplift.mp3` (or `workout-deep-urban.mp3` / user-provided BGM), automatically trimming silence tails and crossfade-looping (`acrossfade=2.2s`) when the song ends, with Vocal-Pocket EQ + `--bgm-db -17.5` smooth sidechain ducking so the music stays energetic yet never overpowers the voiceover:
   ```bash
   python "$SKILL/scripts/audio_master_loop.py" \
     --voice "$PROJ/assets/audio/voice.wav" \
     --bgm "$PROJ/assets/music/melodic-fitness-uplift.mp3" \
     --bgm-db -17.5 \
     --sfx "$PROJ/assets/sfx_plan.json" \
     --target-lufs -14.0 \
     --mux-video "$PROJ/out/video_silent.mp4" \
     --out "$PROJ/out/final.mp4"
   ```

---

### Phase 7 — Mandatory Final Visual & Loudness QA Gate

```bash
python "$SKILL/scripts/qa_rendered_mp4.py" "$PROJ/out/final.mp4" --cols 6 --rows 6
```

1. **Visually read `$PROJ/out/final.qa.jpg`** via `read_file`!
2. Confirm all 5 release gates before delivering `$PROJ/out/final.mp4`:
   - `unintended_long_black_segments: []`
   - `measured_lufs` within `-14.0 ± 0.5 LUFS` and `measured_true_peak_dbtp <= -0.9 dBTP`
   - **100% Face-Safe**: zero callout badges or lines touching the character''s face, hands, or feet
   - **Zero text clipping, wrapping glitches, or empty delayed title screens**
   - **Crisp consecutive cel motion** (`0px` bar flicker) and rich visual variety (`photoDocCard` archival photos + diagrams + dynamic motion UI).', '') ON CONFLICT (slug) DO UPDATE SET name=EXCLUDED.name, category_id=EXCLUDED.category_id, short_desc=EXCLUDED.short_desc, description=EXCLUDED.description, features=EXCLUDED.features, tech_stack=EXCLUDED.tech_stack, version=EXCLUDED.version, price=EXCLUDED.price, original_price=EXCLUDED.original_price, thumbnail=EXCLUDED.thumbnail, demo_video_url=EXCLUDED.demo_video_url, download_url=EXCLUDED.download_url, doc_url=EXCLUDED.doc_url, file_size=EXCLUDED.file_size, product_type='mcp_skill', status='published', mcp_server_name=EXCLUDED.mcp_server_name, mcp_clients=EXCLUDED.mcp_clients, mcp_tools=EXCLUDED.mcp_tools, mcp_skill_prompt=EXCLUDED.mcp_skill_prompt;

INSERT INTO settings (key, value) VALUES ('mcp_migration_0005_done', '1') ON CONFLICT (key) DO UPDATE SET value='1';
