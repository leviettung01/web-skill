/**
 * Safe, one-time, idempotent runtime bootstrap for Migration 0004 (Skill AI Agent MCP).
 * Works identically on both PostgreSQL (Vercel/Neon) and SQLite (Cloudflare D1).
 *
 * Runs at most once per database: after inserting the new columns, category, and
 * 2 starter MCP Skill products, persists `settings.mcp_migration_0004_done = '1'`
 * so admin edits/deletions afterward are never overwritten.
 */

import { invalidateCache } from './cache'

let _done = false
let _inflight: Promise<void> | null = null

const STARTER_MCP_PRODUCTS = [
  {
    slug: 'mcp-skill-agent-video-viral-30s',
    name: 'MCP Skill AI Agent — Tự Động Tạo Video Viral 30s (Claude / Codex / Antigravity)',
    short_desc:
      'Skill MCP kết nối trực tiếp vào Claude, Codex, Antigravity: AI Agent tự gọi tool nạp quy trình Skill, sinh kịch bản khóa nhân vật và xuất lệnh tạo video 30s chuẩn viral ngay trong cuộc hội thoại.',
    description:
      '<h3>Điểm khác biệt so với Skill tự tải truyền thống</h3><p>Với <b>Skill tự tải</b>, bạn cần tải file ZIP/Drive về đọc hướng dẫn rồi tự copy-paste từng prompt sang công cụ tạo video. Với <b>MCP Skill AI Agent</b>, bạn chỉ cần dán cấu hình MCP 1 lần vào <b>Claude, Codex hoặc Antigravity</b> — từ đó AI Agent sẽ tự gọi trực tiếp về MCP Server bằng License Key của bạn để nạp blueprint, tách cảnh khóa nhân vật và tạo video 30s theo đúng chuẩn Skill.</p><h3>AI Agent của bạn sẽ làm được gì?</h3><ul><li><b>Tự động nạp Skill Blueprint:</b> Agent gọi <code>get_skill_blueprint</code> để lấy công thức Hook 3s, quy tắc khóa nhân vật/ánh sáng và cấu trúc 4 phân đoạn 30s.</li><li><b>Tự sinh Storyboard &amp; Prompt đa model:</b> Agent gọi <code>generate_video_storyboard</code> để tạo bộ prompt từng cảnh chuẩn Seedance 2.5, Muse AI hoặc Veo 3 kèm lời thoại tiếng Việt.</li><li><b>Tự kích hoạt pipeline tạo video:</b> Agent gọi <code>create_video_from_skill</code> để xuất gói render chuẩn 9:16 (hoặc đẩy thẳng sang render API/webhook nếu bạn kết nối) kèm phụ đề SRT &amp; caption đăng TikTok/Reels.</li><li><b>Luôn nhận bản Skill mới nhất:</b> Khi KhoSkill nâng cấp công thức prompt hoặc model mới, Agent tự động nhận bản mới qua MCP mà bạn không cần tải lại file.</li></ul><h3>Hỗ trợ đầy đủ AI Agent phổ biến</h3><p>Cung cấp sẵn đoạn cấu hình copy-paste trong mục <b>Sản phẩm của tôi</b> cho <b>Claude Code / Claude Desktop</b>, <b>OpenAI Codex</b> và <b>Antigravity</b>. Cài đặt xong trong chưa đầy 30 giây.</p>',
    features: JSON.stringify([
      'Kết nối trực tiếp MCP vào Claude, Codex, Antigravity trong 30 giây',
      'AI Agent tự gọi tool tạo kịch bản, prompt khóa nhân vật & pipeline video 30s',
      'Không cần tải file thủ công hay copy-paste rời rạc từng bước',
      'Xác thực bảo mật bằng License Key riêng — gọi không giới hạn',
      'Hỗ trợ chuẩn Streamable HTTP MCP (JSON-RPC 2.0) mới nhất',
      'Tự động đồng bộ bản nâng cấp Skill từ server trọn đời'
    ]),
    tech_stack: JSON.stringify(['MCP Protocol', 'Claude', 'Codex', 'Antigravity', 'Seedance 2.5', 'Veo 3', 'Muse AI']),
    version: 'v1.0 MCP',
    price: 990000,
    original_price: 1990000,
    thumbnail: '/static/mcp-skill-viral-cover.svg',
    demo_video_url: 'https://pub-f4217cb984184329a6951a68b9bd0b7c.r2.dev/videos/demo-khoa-hoc-seedance.mp4',
    file_size: 'MCP Live API',
    is_featured: 1,
    is_hot: 1,
    is_new: 1,
    sold_count: 64,
    view_count: 4820,
    rating: 5.0,
    rating_count: 29,
    mcp_server_name: 'khoskill-video-viral',
    mcp_clients: JSON.stringify(['Claude', 'Codex', 'Antigravity']),
    mcp_tools: JSON.stringify([
      { name: 'list_licensed_skills', description: 'Liệt kê toàn bộ Skill MCP đang hoạt động theo License Key của bạn' },
      { name: 'get_skill_blueprint', description: 'Nạp toàn bộ quy trình, luật khóa nhân vật, công thức Hook-Body-CTA và template prompt của Skill' },
      { name: 'generate_video_storyboard', description: 'Tự động tách chủ đề thành storyboard 30s (4 cảnh) kèm prompt tối ưu cho Seedance 2.5 / Muse AI / Veo 3' },
      { name: 'create_video_from_skill', description: 'Chạy pipeline tạo video theo chuẩn Skill, trả về gói render job + SRT phụ đề hoặc gọi render webhook trực tiếp' }
    ]),
    mcp_skill_prompt: `# SKILL BLUEPRINT: AI AGENT VIDEO VIRAL 30S (MCP)

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
- Hỗ trợ Seedance 2.5 (one-take 30s), Muse AI (clip 10s lip-sync tiếng Việt), Veo 3 (cảnh điện ảnh + SFX).

## 4. Quy trình thực thi bắt buộc cho AI Agent
1. Thu thập chủ đề, sản phẩm/ngách, đối tượng xem và model mục tiêu từ người dùng.
2. Gọi \`generate_video_storyboard\` để tạo đủ 4 cảnh có khóa nhân vật, lời thoại và phụ đề.
3. Gọi \`create_video_from_skill\` để đóng gói render pipeline (hoặc gửi lệnh render tự động qua webhook/API nếu có).`
  },
  {
    slug: 'mcp-skill-agent-affiliate-tiktok',
    name: 'MCP Skill AI Agent — Tự Động Sản Xuất Video Affiliate TikTok Shop',
    short_desc:
      'Kết nối MCP vào Claude, Codex, Antigravity: chỉ cần đưa tên hoặc thông tin sản phẩm, AI Agent tự gọi Skill xuất trọn bộ kịch bản chốt đơn, prompt cảnh quay 9:16, voiceover & lệnh tạo video Affiliate.',
    description:
      '<h3>Tự động hoá dây chuyền làm video Affiliate bằng AI Agent</h3><p>Thay vì tải bộ prompt về máy rồi tự chỉnh sửa từng câu chữ cho mỗi sản phẩm mới, <b>MCP Skill Affiliate TikTok Shop</b> biến <b>Claude, Codex và Antigravity</b> thành trợ lý sản xuất video chốt đơn chuyên nghiệp qua kết nối MCP trực tiếp.</p><h3>Quy trình Agent chạy tự động qua MCP</h3><ul><li><b>Bước 1:</b> Nhập tên sản phẩm, điểm bán hàng (USP) và giá ưu đãi vào Claude / Codex / Antigravity.</li><li><b>Bước 2:</b> Agent tự động gọi MCP tool nạp bộ <b>25 công thức Hook chốt đơn</b> &amp; cấu trúc PAS/AIDA tối ưu cho TikTok Shop.</li><li><b>Bước 3:</b> Agent gọi <code>create_video_from_skill</code> xuất bộ prompt khóa sản phẩm/nhân vật, lời thoại lip-sync tiếng Việt, file phụ đề SRT và thông số render hàng loạt.</li><li><b>Bước 4:</b> Xuất sẵn nhiều biến thể Hook để bạn chạy test A/B tìm video win cực nhanh.</li></ul><h3>Phù hợp với ai?</h3><p>Chủ shop TikTok Shop, KOC/Affiliate creator, team media muốn scale 10–30 video bán hàng mỗi ngày ngay trong Claude, Codex hoặc Antigravity.</p>',
    features: JSON.stringify([
      'Tích hợp trực tiếp vào Claude, Codex, Antigravity qua MCP',
      'Đưa tên sản phẩm -> Agent tự xuất trọn gói kịch bản + prompt + lệnh render',
      'Sẵn 25 khung Hook giữ chân 3 giây & CTA chuẩn TikTok Shop',
      'Sinh nhanh 3 biến thể Hook để test A/B tìm clip ra đơn',
      'Xuất kèm script voiceover tiếng Việt, phụ đề SRT và hashtag ngách',
      'Cập nhật công thức chốt đơn mới trực tiếp từ MCP Server'
    ]),
    tech_stack: JSON.stringify(['MCP Protocol', 'Claude', 'Codex', 'Antigravity', 'Muse AI', 'Seedance 2.5', 'CapCut']),
    version: 'v1.0 MCP',
    price: 890000,
    original_price: 1790000,
    thumbnail: '/static/mcp-skill-affiliate-cover.svg',
    demo_video_url: 'https://pub-f4217cb984184329a6951a68b9bd0b7c.r2.dev/videos/demo-skill-fitness.mp4',
    file_size: 'MCP Live API',
    is_featured: 1,
    is_hot: 0,
    is_new: 1,
    sold_count: 41,
    view_count: 3190,
    rating: 4.9,
    rating_count: 18,
    mcp_server_name: 'khoskill-affiliate-agent',
    mcp_clients: JSON.stringify(['Claude', 'Codex', 'Antigravity']),
    mcp_tools: JSON.stringify([
      { name: 'list_licensed_skills', description: 'Kiểm tra danh sách MCP Skill đã kích hoạt' },
      { name: 'get_skill_blueprint', description: 'Nạp công thức Hook 3s, cấu trúc bán hàng PAS/AIDA và luật khóa sản phẩm TikTok Shop' },
      { name: 'generate_video_storyboard', description: 'Tạo storyboard 30s chốt đơn + 3 biến thể Hook theo tên sản phẩm và USP' },
      { name: 'create_video_from_skill', description: 'Xuất gói render video Affiliate 9:16 hoàn chỉnh kèm voiceover, phụ đề SRT & CTA giỏ hàng' }
    ]),
    mcp_skill_prompt: `# SKILL BLUEPRINT: AI AGENT AFFILIATE TIKTOK SHOP (MCP)

## 1. Công thức chuyển đổi 30s (Hook - Agitate - Demo - Social Proof - CTA)
- **00:00 - 00:04 (Hook Chặn Cuộn)**: Gọi thẳng tệp khách hàng + cận cảnh sản phẩm đang hoạt động thực tế.
- **00:04 - 00:10 (Nỗi đau thực tế)**: Nêu 1 vấn đề cụ thể gây khó chịu hằng ngày.
- **00:10 - 00:21 (Demo USP sản phẩm)**: Tập trung 2 lợi ích mạnh nhất bằng góc quay cận (macro / close-up).
- **00:21 - 00:26 (Bằng chứng & Xử lý từ chối)**: So sánh giá trị/chi phí hoặc độ bền thực tế.
- **00:26 - 00:30 (CTA Giỏ Hàng)**: Chỉ giỏ hàng góc trái tự nhiên.

## 2. A/B Test 3 biến thể Hook
- Mỗi lần chạy Skill luôn xuất kèm **3 biến thể Hook đầu 3 giây** để test nhanh tìm video win.`
  }
]

async function runOnce(db: D1Database): Promise<void> {
  try {
    const flag = await db.prepare(`SELECT value FROM settings WHERE key='mcp_migration_0004_done'`).first<any>().catch(() => null)
    if (flag?.value === '1') {
      _done = true
      return
    }

    // 1. Ensure schema columns exist (safe on both PostgreSQL & SQLite/D1)
    const alters = [
      'ALTER TABLE products ADD COLUMN mcp_endpoint TEXT',
      'ALTER TABLE products ADD COLUMN mcp_server_name TEXT',
      'ALTER TABLE products ADD COLUMN mcp_clients TEXT',
      'ALTER TABLE products ADD COLUMN mcp_tools TEXT',
      'ALTER TABLE products ADD COLUMN mcp_skill_prompt TEXT',
      'ALTER TABLE products ADD COLUMN mcp_render_webhook TEXT',
      'ALTER TABLE licenses ADD COLUMN mcp_call_count INTEGER NOT NULL DEFAULT 0',
      'ALTER TABLE licenses ADD COLUMN last_mcp_call_at TIMESTAMP'
    ]
    for (const sql of alters) {
      await db.prepare(sql).run().catch(() => null)
    }

    // 2. Sync Postgres identity sequences if needed (no-op on SQLite)
    await db.prepare(
      `SELECT setval(pg_get_serial_sequence('categories', 'id'), COALESCE((SELECT MAX(id) FROM categories), 1), (SELECT COUNT(*) > 0 FROM categories))`
    ).first().catch(() => null)
    await db.prepare(
      `SELECT setval(pg_get_serial_sequence('products', 'id'), COALESCE((SELECT MAX(id) FROM products), 1), (SELECT COUNT(*) > 0 FROM products))`
    ).first().catch(() => null)

    // 3. Reorder categories so both active Skill lines sit first
    const orders: [string, number][] = [
      ['skill-video-ai', 1],
      ['khoa-hoc-video-ai', 3],
      ['chatbot-ai', 4],
      ['app-video-ai', 5],
      ['combo', 6]
    ]
    for (const [slug, ord] of orders) {
      await db.prepare('UPDATE categories SET sort_order=? WHERE slug=?').bind(ord, slug).run().catch(() => null)
    }

    // 4. Ensure category `skill-ai-agent-mcp` exists
    let catRow = await db.prepare(`SELECT id FROM categories WHERE slug='skill-ai-agent-mcp'`).first<any>().catch(() => null)
    if (!catRow) {
      const ins = await db.prepare(
        `INSERT INTO categories (slug, name, description, icon, color, sort_order) VALUES (?,?,?,?,?,?)`
      ).bind(
        'skill-ai-agent-mcp',
        'Skill AI Agent (MCP)',
        'Skill kết nối trực tiếp dạng MCP cho Claude, Codex, Antigravity — AI Agent tự gọi tool và tạo video theo Skill, không cần tải về làm thủ công',
        'fa-plug-circle-bolt',
        'cyan',
        2
      ).run()
      catRow = { id: ins.meta.last_row_id }
    }
    if (!catRow?.id) {
      catRow = await db.prepare(`SELECT id FROM categories WHERE slug='skill-ai-agent-mcp'`).first<any>().catch(() => null)
    }
    const catId = catRow?.id || null

    // 5. Seed starter MCP Skill products only if they do not exist yet
    for (const p of STARTER_MCP_PRODUCTS) {
      const exists = await db.prepare('SELECT id FROM products WHERE slug=?').bind(p.slug).first<any>().catch(() => null)
      if (!exists) {
        await db.prepare(
          `INSERT INTO products (
            slug, name, category_id, short_desc, description, features, tech_stack, version,
            price, original_price, thumbnail, demo_video_url, demo_url, download_url, doc_url,
            file_size, product_type, is_featured, is_hot, is_new, status,
            sold_count, view_count, rating, rating_count,
            mcp_endpoint, mcp_server_name, mcp_clients, mcp_tools, mcp_skill_prompt, mcp_render_webhook
          ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
        ).bind(
          p.slug, p.name, catId, p.short_desc, p.description, p.features, p.tech_stack, p.version,
          p.price, p.original_price, p.thumbnail, p.demo_video_url, '', '', '',
          p.file_size, 'mcp_skill', p.is_featured, p.is_hot, p.is_new, 'published',
          p.sold_count, p.view_count, p.rating, p.rating_count,
          '', p.mcp_server_name, p.mcp_clients, p.mcp_tools, p.mcp_skill_prompt, ''
        ).run()
      }
    }

    // 6. Mark migration complete so it never re-runs or restores deleted items
    await db.prepare(
      `INSERT INTO settings (key, value) VALUES ('mcp_migration_0004_done', '1') ON CONFLICT(key) DO UPDATE SET value='1'`
    ).run()
    invalidateCache()
    _done = true
  } catch (err) {
    console.error('[MCP_BOOTSTRAP]', err)
  }
}

export async function ensureMcpMigration(db?: D1Database | null): Promise<void> {
  if (_done || !db) return
  if (!_inflight) {
    _inflight = runOnce(db).finally(() => {
      _inflight = null
    })
  }
  await _inflight
}
