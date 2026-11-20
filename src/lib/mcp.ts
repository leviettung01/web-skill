/**
 * KhoSkill AI — Built-in Model Context Protocol (MCP) Streamable HTTP Server
 * & Client Config Generators for Claude, Codex, and Antigravity.
 *
 * Implements JSON-RPC 2.0 over Streamable HTTP (MCP 2025-03-26 / 2024-11-05):
 *  - initialize / notifications/initialized / ping
 *  - tools/list & tools/call
 *  - prompts/list & prompts/get
 *  - resources/list & resources/read
 *
 * Authentication:
 *  - Authorization: Bearer <LICENSE_KEY>
 *  - X-License-Key: <LICENSE_KEY>
 *  - ?key=<LICENSE_KEY>
 */

import { parseJSON, parseMcpClients, parseMcpTools, stripHtml } from './utils'

export interface McpClientConfigs {
  endpointUrl: string
  serverName: string
  claudeCli: string
  claudeJson: string
  codexToml: string
  codexCli: string
  antigravityJson: string
  samplePrompt: string
}

export interface SkillEngineProfile {
  folderName: string
  defaultAspect: '9:16' | '16:9'
  defaultDurationSec: number
  resolution: string
  engineSummary: string
  prerequisites: string[]
  verifyCommand: string
  phaseCommands: string[]
}

const SKILL_ENGINE_PROFILES: Record<string, SkillEngineProfile> = {
  'travel-video-editing': {
    folderName: 'Travel-Video-Editing',
    defaultAspect: '9:16',
    defaultDurationSec: 45,
    resolution: '1080x1920 @ 30fps (-14.0 LUFS)',
    engineSummary: 'HyperFrames + GSAP Typography + Multi-Threaded Vbee/Edge-TTS + Parallel 4K yt-dlp B-roll + 47 SFX stems + FFmpeg Studio Travel Color Grading',
    prerequisites: [
      'Node.js >= 22 + HyperFrames CLI (`npm install -g hyperframes`)',
      'FFmpeg >= 7 (libx264, loudnorm, selectivecolor, cas, drawtext)',
      'Python 3.10+ (`pip install -r Travel-Video-Editing/requirements.txt`: Pillow, yt-dlp, requests, edge-tts)',
      'Giọng đọc: mặc định dùng Edge-TTS miễn phí; tuỳ chọn VBEE_APP_ID & VBEE_TOKEN cho giọng Vbee Studio'
    ],
    verifyCommand: 'python "$SKILL_DIR/scripts/doctor.py"',
    phaseCommands: [
      'Phase 0 — Preflight & Init: `python "$SKILL_DIR/scripts/doctor.py"` && `python "$SKILL_DIR/scripts/init_project.py" --out "./projects/tour-<slug>"`',
      'Phase 1 — Brief & Archetype: lập `$PROJ/FACTS.md`, chọn 1 trong 5 archetype (`royal-blue`, `festive-red`, `autumn-gold`, `modern-cyan`, `tropical-bold`)',
      'Phase 2 — Voiceover TTS: `python "$SKILL_DIR/scripts/vbee_tts.py" --beats-json "$PROJ/beats.json" --workers 6 --rate 1.02 --out "$PROJ/assets/audio/voice.wav"` (auto fallback edge-tts)',
      'Phase 3 — 4K B-Roll & Hook Scan: `python "$SKILL_DIR/scripts/research_broll.py" --yt-search "<keywords 4K>" --check-4k --out "$PROJ/assets/broll"` -> `--scan-hooks` -> `--prepare-json "$PROJ/broll_plan.json"` + kiểm tra `_broll_verify.jpg`',
      'Phase 4 — Timeline & Snapshot QA: viết `$PROJ/assets/edit.js` (`window.TOUR_EDIT`), chạy `fetch_bgm.py`, `node "$PROJ/tools/build_edit.cjs"` và `hyperframes snapshot --at "1.0,5.5,14.0,26.0,36.0" -o snaps`',
      'Phase 5 — Render & -14 LUFS Master: `python "$SKILL_DIR/scripts/build_tour_video.py" --proj "$PROJ"` -> kiểm tra `out/final.qa.jpg` & xuất `out/final.mp4`'
    ]
  },
  'viral-talking-head-video-edit': {
    folderName: 'field-motion-walking',
    defaultAspect: '9:16',
    defaultDurationSec: 50,
    resolution: '1080x1920 @ 30fps (-14.0 LUFS)',
    engineSummary: 'Field Motion v2 — HyperFrames + GSAP + ONNX U2-Net 3-Plane Depth Alpha Subject Cutouts (VP9 WebM) + 3D Floor Text + KPI Sparklines + FFmpeg -14 LUFS',
    prerequisites: [
      'Node.js >= 22 + HyperFrames CLI (`npm install -g hyperframes`)',
      'FFmpeg >= 7 (libx264, libvpx-vp9 cho alpha WebM cutouts, loudnorm, sidechaincompress)',
      'Python 3.10+: `pip install onnxruntime opencv-python-headless numpy pillow faster-whisper`',
      'Model `u2net.onnx` (~176 MB) tự tải ở lần chạy đầu của `scripts/cutout_subject.py`'
    ],
    verifyCommand: 'python -c "import onnxruntime, cv2, numpy, PIL; print(\'CUTOUT_DEPS_OK\')" && npx hyperframes --version',
    phaseCommands: [
      'Phase 0 — Copy Template: copy `$SKILL_DIR/template` sang `$PROJ` (tạo thư mục `probe`, `snaps`, `out`, `assets/icons`)',
      'Phase 1 — Footage Audit: `python "$SKILL_DIR/scripts/analyze_walking.py" "<raw.mp4>" --out-dir "$PROJ/probe" --lang auto --model medium` -> đọc `face_grid.jpg`, `timeline_grid.jpg`, `transcript.json` và bake `assets/a-roll.mp4`',
      'Phase 2 — 3-Plane Depth Cutout: `python "$SKILL_DIR/scripts/cutout_subject.py" "$PROJ/assets/a-roll.mp4" --out-dir "$PROJ/assets" --range "0.0:6.5"` (xuất `fg_01.webm` trong suốt đặt chữ khổng lồ sau lưng người nói)',
      'Phase 3 — Choreography & Assets: chạy `fetch_assets.py` lấy icon SVG + viết `$PROJ/assets/edit.js` (depthHeadline, brollStrip, dualCompareCards, KPI sparkline, kinetic captions)',
      'Phase 4 — Check & Snapshot QA: `node tools/build_edit.cjs` -> `npx hyperframes check --json` -> `npx hyperframes snapshot` -> duyệt `snaps/contact-sheet.jpg`',
      'Phase 5-6 — Render & Master: chạy `sfx_planner_fm.py` -> `npx hyperframes render --fps 30 --quality delivery -o out/video_silent.mp4` -> `audio_master.py` (-14 LUFS) -> `extract_qa_sheet.py`'
    ]
  },
  'skill-edit-bds': {
    folderName: 'Skill-Edit-BDS',
    defaultAspect: '9:16',
    defaultDurationSec: 55,
    resolution: '1080x1920 @ 30fps (-14.0 LUFS)',
    engineSummary: 'GeoLayers 9:16 Pure-Cinema Real Estate Director — OSM GeoJSON + MapLibre Satellite Camera Baker + Blender 5.x ENU 3D GLBs + WebGL2 B-roll FX + 45° Frosted POI Callouts + HyperFrames',
    prerequisites: [
      'Node.js >= 22 + HyperFrames CLI (`npm install -g hyperframes`) + `playwright-core`',
      'FFmpeg >= 7 + Python 3.10+ (`pip install requests pillow yt-dlp edge-tts`)',
      'Blender 5.x (miễn phí tại blender.org) nếu muốn tự dựng mô hình 3D kiến trúc ENU GLB theo từng dự án; đã đóng gói sẵn 4 GLB cơ bản + 42 font + 22 WAV SFX/BGM',
      'Giọng đọc: file thu âm sẵn, Edge-TTS miễn phí, hoặc Vbee TTS (`VBEE_APP_ID` / `VBEE_TOKEN`)'
    ],
    verifyCommand: 'python "$SKILL_DIR/scripts/bootstrap_project.py" --check-only',
    phaseCommands: [
      'Phase 0 — Bootstrap 1 lệnh: `python "$SKILL_DIR/scripts/bootstrap_project.py" --dest "$PROJ" --brand "<TEN_DU_AN>"`',
      'Phase 1 — Geolocation & FACTS.md: xác minh số liệu thật, viết `geo_query.json`, chạy `python "$SKILL_DIR/scripts/fetch_geolayers_geo.py" --spec "$PROJ/geo_query.json" --out "$PROJ/assets/geo/geo_data.json"` (auto tính ha & km)',
      'Phase 2 — Voice-First Timing: `vbee_tts.py` hoặc `edge-tts` + `analyze_voice.py` tạo `voice.wav` & `voice_cues.json`',
      'Phase 3 — B-Roll Verification: `fetch_broll.py --search` / `--probe-video` -> `--download-json "$PROJ/broll_plan.json"` -> duyệt `_broll_verify.jpg`',
      'Phase 4 — Satellite Camera Bake: `node "$SKILL_DIR/scripts/bake_geolayers_camera.mjs" --plan "$PROJ/camera_plan.json" --geo "$PROJ/assets/geo/geo_data.json" --out "$PROJ/assets/maps"`',
      'Phase 5 — Blender 3D ENU Models: chạy `blender --background --python "$PROJ/build_project_3d.py"` tạo GLB khớp toạ độ lô đất & kiểm tra `.preview.png`',
      'Phase 6-8 — Compose, Render & QA (>= 8.5/10): cấu hình `reel_config.json` + `sfx_plan.json` -> `npx hyperframes check --json` -> `npx hyperframes render` -> `audio_master.py` (-14 LUFS) -> `extract_qa_sheet.py`'
    ]
  },
  'video-talking-head': {
    folderName: 'viral-talking-head',
    defaultAspect: '9:16',
    defaultDurationSec: 55,
    resolution: '1080x1920 @ 30fps (-14.0 LUFS)',
    engineSummary: 'Viral Talking Head Studio Engine v6 — 3 Themes (Apple Sky, Sunlit Botanical, Editorial Warm) + Whisper Word Sync + Headroom Glass Motion UI + PiP/B-roll + FFmpeg -14 LUFS',
    prerequisites: [
      'Node.js >= 22 + HyperFrames CLI (`npm install -g hyperframes`)',
      'FFmpeg >= 7 (hqdn3d, afftdn, acompressor, loudnorm, libx264)',
      'Python 3.10+: `pip install faster-whisper pillow requests yt-dlp numpy`',
      'Đã đóng gói sẵn `template/` Engine v6 đầy đủ SFX, nhạc nền và component catalog'
    ],
    verifyCommand: 'python -c "import faster_whisper, PIL; print(\'TALKING_HEAD_DEPS_OK\')" && npx hyperframes --version',
    phaseCommands: [
      'Phase 0 — Scaffold: copy `$SKILL_DIR/template` sang `$PROJ`',
      'Phase 1 — Raw Audit & Framing Lock: `python "$SKILL_DIR/scripts/analyze_raw.py" "<raw.mp4>" --out-dir "$PROJ/probe" --lang auto --model medium` -> chọn theme (`apple-sky` / `sunlit-botanical` / `editorial-warm`) & khoá `face`, `capY`, headroom',
      'Phase 2 — Denoise, Trim & Skin-Safe Grade: bake `assets/a-roll.mp4` 1080x1920 30fps, tách `assets/voice_clean.wav`, chạy lại `analyze_raw.py` khoá timing từng từ',
      'Phase 3 — Asset Research: `python "$SKILL_DIR/scripts/fetch_assets.py" --mixkit-video "<keywords>" --out "$PROJ/assets"` + duyệt `_broll_verify.jpg`',
      'Phase 4-5 — Direct `assets/edit.js` & Snapshot QA: tạo Hook 10s camera in-out, luân phiên headroom UI / `storyBroll` / `browserPip` / `frostTitle` / `splitGlassCompare` -> `node tools/build_edit.cjs` -> `npx hyperframes check --json` -> `npx hyperframes snapshot`',
      'Phase 6 — Render & Master: `sfx_planner.py` -> `npx hyperframes render --fps 30 --quality delivery` -> `audio_master.py` (-14 LUFS) -> `extract_qa_sheet.py`'
    ]
  },
  'phan-tich-style-video-lich-su': {
    folderName: 'Phan-Tich-Style-Video-Lich-Su',
    defaultAspect: '16:9',
    defaultDurationSec: 180,
    resolution: '1920x1080 @ 30fps (-14.0 LUFS)',
    engineSummary: 'Historical Archival Documentary Engine — Official 63-Province Vietnam & Hoàng Sa/Trường Sa GeoJSON Atlas + 3D Bastion Maps + Archival Grain/Scanlines + Playwright DOM Auditor + HyperFrames',
    prerequisites: [
      'Node.js >= 22 + HyperFrames CLI (`npx --yes hyperframes@0.9.41`)',
      'FFmpeg >= 7 + Python 3.10+ (`pip install edge-tts requests pillow playwright` và `playwright install chromium`)',
      'Đã đóng gói sẵn GeoJSON bản đồ Việt Nam (kèm Q.đ. Hoàng Sa & Q.đ. Trường Sa), SFX tư liệu và `starter/` 4 cảnh 1920x1080',
      'Giọng đọc: Edge-TTS tiếng Việt miễn phí (`scripts/tts_edge_vi.py`) hoặc `ELEVENLABS_API_KEY` cho giọng tài liệu điện ảnh'
    ],
    verifyCommand: 'python "$SKILL_DIR/scripts/build_vietnam_atlas.py" --help && npx --yes hyperframes@0.9.41 --version',
    phaseCommands: [
      'Phase 1 — Fact-Grounding: copy `$SKILL_DIR/starter/` sang `$PROJ`, nghiên cứu nguồn chính thống ghi `FACTS.md` & sưu tầm ảnh tư liệu (1.8x-2.2x số cảnh)',
      'Phase 2 — 6-Act Script: viết `SCRIPT.md` & `audio_chunks.json` theo cấu trúc 6 hồi lịch sử',
      'Phase 3 — Compile Vietnam GeoJSON Atlas: `python "$SKILL_DIR/scripts/build_vietnam_atlas.py" --out "$PROJ/assets/maps/doc_map_data.js" --global-var DOC_MAP_DATA`',
      'Phase 4 — Voice Synthesis: `python "$SKILL_DIR/scripts/tts_edge_vi.py" --chunks audio_chunks.json --voice vi-male --rate="-4%" --output-dir assets/audio` (hoặc `tts_elevenlabs_doc.py`) -> tạo `voice_timings.json`',
      'Phase 5-6 — Clean B-Roll & -14 LUFS Soundtrack: `slice_broll_clean.py --manifest broll_plan.json` -> `audio_soundtrack_and_master.py` tạo `assets/audio/master.wav`',
      'Phase 7-8 — Compose, Audit & Render: dựng `index.html` (GSAP + bản đồ chiến dịch) -> `audit_doc_composition.py --require-browser` -> `npx --yes hyperframes@0.9.41 check --json` -> `render` -> `qa_rendered_mp4.py out/final.mp4`'
    ]
  },
  'fitness-video-editing': {
    folderName: 'Fitness-Video-Editing',
    defaultAspect: '16:9',
    defaultDurationSec: 300,
    resolution: '1920x1080 @ 30fps (-14.0 LUFS, hỗ trợ cả 9:16)',
    engineSummary: 'Fitness Manga-Anatomical Motion-Graphics Director (chuẩn 健身大书 / XXL健身) — 21 GSAP Archetypes + 52 Locked RGBA Poses + 5-Lock AI Cel Pipeline + 43 Foley SFX + Parallel Chapter Renderer',
    prerequisites: [
      'Node.js >= 22 + HyperFrames CLI (`npm install -g hyperframes`)',
      'FFmpeg >= 7 + Python 3.10+ (`pip install opencv-python-headless numpy pillow edge-tts requests faster-whisper`)',
      'Đã đóng gói sẵn `starter/` kèm 52 tư thế nhân vật Manga RGBA, 43 SFX Foley, 5 nhạc nền BGM không bản quyền, 7 ảnh tư liệu & font tiếng Việt cục bộ',
      'Tạo tư thế mới (tuỳ chọn): dùng tool sinh ảnh sẵn có của AI Agent hoặc cấu hình `GEMINI_API_KEY` / `OPENAI_API_KEY` / `CLIPROXY` / `SD_WEBUI_URL`'
    ],
    verifyCommand: 'python "$SKILL_DIR/scripts/ai_image_hub.py" --check && npx hyperframes --version',
    phaseCommands: [
      'Phase 0-1 — Check & Scaffold: `python "$SKILL_DIR/scripts/ai_image_hub.py" --check` -> copy `$SKILL_DIR/starter/` sang `$PROJ`, chọn `lang: "vi"` hoặc `"en"`',
      'Phase 2 — 6-Beat Coaching Script & Voice: viết `paragraphs.json` -> `python "$SKILL_DIR/scripts/build_paragraph_voice.py" --paragraphs "$PROJ/paragraphs.json" --out-dir "$PROJ/assets/audio" --lang vi` (Vbee hoặc Edge-TTS + Whisper clause alignment)',
      'Phase 3 — Character Poses, 5-Lock Cels & Doc Photos: tái sử dụng 52 tư thế sẵn có hoặc tạo chuỗi cel với `build_pose_guides.py` + `register_and_lock_cels.py` (0.00px bar flicker) + `fetch_doc_photos.py`',
      'Phase 4-5 — Scene Plan & Precheck: viết `assets/fitness-plan.js` (4.5-7s/scene, 100% Face-Safe outer callouts) -> `node "$PROJ/tools/build_fitness.cjs"` -> `npx hyperframes check --json` + `snapshot`',
      'Phase 6 — Parallel Chapter Render & Seamless Looped Audio: `render_chapters_parallel.py` -> `sfx_planner_fitness.py` -> `audio_master_loop.py --target-lufs -14.0`',
      'Phase 7 — Final QA Gate: `python "$SKILL_DIR/scripts/qa_rendered_mp4.py" "$PROJ/out/final.mp4" --cols 6 --rows 6` -> duyệt `final.qa.jpg`'
    ]
  }
}

export function getSkillEngineProfile(slug: string): SkillEngineProfile | null {
  return SKILL_ENGINE_PROFILES[slug] || null
}

export function resolveMcpEndpoint(origin: string, product: { slug: string; mcp_endpoint?: string | null }): string {
  const custom = (product.mcp_endpoint || '').trim()
  if (custom && (custom.startsWith('https://') || custom.startsWith('http://'))) {
    return custom
  }
  const cleanOrigin = origin.replace(/\/+$/, '')
  return `${cleanOrigin}/api/mcp/${product.slug}`
}

export function resolveMcpServerName(product: { slug: string; mcp_server_name?: string | null }): string {
  const raw = (product.mcp_server_name || '').trim()
  if (raw) {
    const clean = raw.toLowerCase().replace(/[^a-z0-9_-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
    if (clean) return clean
  }
  return `khoskill-${product.slug.slice(0, 28).replace(/[^a-z0-9-]/g, '-')}`
}

export function buildMcpConfigs(opts: {
  origin: string
  slug: string
  productName: string
  licenseKey: string
  mcpEndpoint?: string | null
  mcpServerName?: string | null
}): McpClientConfigs {
  const endpointUrl = resolveMcpEndpoint(opts.origin, { slug: opts.slug, mcp_endpoint: opts.mcpEndpoint })
  const serverName = resolveMcpServerName({ slug: opts.slug, mcp_server_name: opts.mcpServerName })
  const key = opts.licenseKey
  const profile = getSkillEngineProfile(opts.slug)

  const claudeCli = `claude mcp add --transport http ${serverName} "${endpointUrl}" --header "Authorization: Bearer ${key}"`

  const claudeJson = JSON.stringify({
    mcpServers: {
      [serverName]: {
        type: 'http',
        url: endpointUrl,
        headers: {
          Authorization: `Bearer ${key}`
        }
      }
    }
  }, null, 2)

  const codexToml = `[mcp_servers.${serverName}]\nurl = "${endpointUrl}"\nhttp_headers = { Authorization = "Bearer ${key}" }`

  const codexCli = `codex mcp add ${serverName} --url "${endpointUrl}"`

  const antigravityJson = JSON.stringify({
    mcpServers: {
      [serverName]: {
        serverUrl: endpointUrl,
        headers: {
          Authorization: `Bearer ${key}`
        }
      }
    }
  }, null, 2)

  const samplePrompt = profile
    ? `Hãy kết nối MCP "${serverName}", gọi tool get_skill_blueprint và get_skill_assets_and_setup để kiểm tra bộ Skill Kit (${profile.folderName}) trên máy tôi, sau đó gọi create_video_from_skill để lập kế hoạch và dựng video ${profile.defaultAspect} hoàn chỉnh xuất ra out/final.mp4 cho chủ đề: [nhập brief hoặc đường dẫn video thô của bạn].`
    : `Hãy kết nối MCP "${serverName}", gọi tool get_skill_blueprint rồi gọi create_video_from_skill để dựng video theo đúng chuẩn Skill cho chủ đề/sản phẩm: [nhập tên sản phẩm hoặc ý tưởng của bạn].`

  return {
    endpointUrl,
    serverName,
    claudeCli,
    claudeJson,
    codexToml,
    codexCli,
    antigravityJson,
    samplePrompt
  }
}

export interface LicensedMcpSkillRow {
  license_id: number
  license_key: string
  user_id: number
  user_email: string
  user_name: string
  product_id: number
  slug: string
  name: string
  version: string
  short_desc: string
  description: string
  features: string
  tech_stack: string
  download_url: string | null
  doc_url: string | null
  mcp_endpoint: string | null
  mcp_server_name: string | null
  mcp_clients: string | null
  mcp_tools: string | null
  mcp_skill_prompt: string | null
  mcp_render_webhook: string | null
}

export function extractLicenseKey(req: Request, queryKey?: string | null): string {
  const auth = req.headers.get('authorization') || ''
  if (/^Bearer\s+/i.test(auth)) {
    const token = auth.replace(/^Bearer\s+/i, '').trim()
    if (token) return token
  }
  const xKey = (req.headers.get('x-license-key') || req.headers.get('x-api-key') || '').trim()
  if (xKey) return xKey
  return (queryKey || '').trim()
}

export async function authenticateMcpLicense(
  db: D1Database,
  licenseKey: string,
  targetSlug?: string | null
): Promise<{ ok: true; primary: LicensedMcpSkillRow; skills: LicensedMcpSkillRow[] } | { ok: false; status: number; error: string }> {
  if (!licenseKey || licenseKey.length < 8) {
    return {
      ok: false,
      status: 401,
      error: 'Thiếu License Key. Truyền header "Authorization: Bearer <LICENSE_KEY>" hoặc "X-License-Key: <LICENSE_KEY>".'
    }
  }

  const primary = await db.prepare(
    `SELECT l.id AS license_id, l.license_key, l.user_id,
            u.email AS user_email, u.full_name AS user_name, u.status AS user_status,
            p.id AS product_id, p.slug, p.name, p.version, p.short_desc, p.description,
            p.features, p.tech_stack, p.product_type, p.download_url, p.doc_url,
            p.mcp_endpoint, p.mcp_server_name, p.mcp_clients, p.mcp_tools,
            p.mcp_skill_prompt, p.mcp_render_webhook
     FROM licenses l
     JOIN users u ON u.id = l.user_id
     JOIN products p ON p.id = l.product_id
     WHERE l.license_key = ?`
  ).bind(licenseKey).first<any>()

  if (!primary) {
    return { ok: false, status: 401, error: 'License Key không hợp lệ hoặc đã bị thu hồi.' }
  }
  if (primary.user_status !== 'active') {
    return { ok: false, status: 403, error: 'Tài khoản sở hữu License Key hiện đang bị khoá.' }
  }
  if (primary.product_type !== 'mcp_skill') {
    return {
      ok: false,
      status: 403,
      error: 'License Key này thuộc dòng Skill tự tải (không phải Skill AI Agent MCP). Vui lòng dùng License Key của sản phẩm Skill AI Agent (MCP).'
    }
  }

  const allRes = await db.prepare(
    `SELECT l.id AS license_id, l.license_key, l.user_id,
            u.email AS user_email, u.full_name AS user_name,
            p.id AS product_id, p.slug, p.name, p.version, p.short_desc, p.description,
            p.features, p.tech_stack, p.download_url, p.doc_url,
            p.mcp_endpoint, p.mcp_server_name, p.mcp_clients, p.mcp_tools,
            p.mcp_skill_prompt, p.mcp_render_webhook
     FROM licenses l
     JOIN users u ON u.id = l.user_id
     JOIN products p ON p.id = l.product_id
     WHERE l.user_id = ? AND p.product_type = 'mcp_skill'
     ORDER BY (CASE WHEN l.id = ? THEN 0 ELSE 1 END), l.id DESC`
  ).bind(primary.user_id, primary.license_id).all()

  const ownedSkills = (allRes.results || []) as LicensedMcpSkillRow[]

  if (targetSlug) {
    const matched = ownedSkills.find(s => s.slug === targetSlug)
    if (!matched) {
      return {
        ok: false,
        status: 403,
        error: `License Key của bạn chưa kích hoạt Skill MCP "${targetSlug}".`
      }
    }
    return { ok: true, primary: matched, skills: [matched] }
  }

  return { ok: true, primary, skills: ownedSkills.length > 0 ? ownedSkills : [primary] }
}

function buildFallbackBlueprint(skill: LicensedMcpSkillRow): string {
  const features = parseJSON<string[]>(skill.features, [])
  const tech = parseJSON<string[]>(skill.tech_stack, [])
  const lines = [
    `# SKILL BLUEPRINT: ${skill.name} (${skill.version})`,
    '',
    skill.short_desc || '',
    '',
    '## Công nghệ / Engine tương thích',
    tech.length ? tech.map(t => `- ${t}`).join('\n') : '- HyperFrames, GSAP, FFmpeg (-14 LUFS), Python, Node.js 22+',
    '',
    '## Thành phần cốt lõi của Skill',
    features.length ? features.map(f => `- ${f}`).join('\n') : '- Starter template, scripts tự động, SFX/BGM và quy trình QA',
    '',
    '## Mô tả quy trình',
    stripHtml(skill.description || '', 2000)
  ]
  return lines.join('\n')
}

function buildSetupAndAssetsPayload(skill: LicensedMcpSkillRow) {
  const profile = getSkillEngineProfile(skill.slug)
  const folderName = profile?.folderName || skill.slug
  const driveUrl = (skill.download_url || '').trim() || null
  const guideUrl = (skill.doc_url || '').trim() || driveUrl

  return {
    skill_slug: skill.slug,
    skill_name: skill.name,
    version: skill.version,
    licensed_to: skill.user_email,
    google_drive_skill_kit_url: driveUrl,
    quick_guide_url: guideUrl,
    local_skill_folder_name: folderName,
    install_paths: {
      antigravity: `<workspace>/.agents/skills/${folderName}/ (hoặc ~/.gemini/antigravity/skills/${folderName}/)`,
      claude_code: `~/.claude/skills/${folderName}/ (hoặc <workspace>/.claude/skills/${folderName}/)`,
      openai_codex: `~/.codex/skills/${folderName}/`
    },
    engine: profile ? {
      summary: profile.engineSummary,
      output_spec: profile.resolution,
      default_aspect: profile.defaultAspect,
      prerequisites: profile.prerequisites,
      verify_command: profile.verifyCommand
    } : {
      summary: 'AI Agent Video Production Engine (HyperFrames + GSAP + FFmpeg)',
      output_spec: '1080x1920 hoặc 1920x1080 @ 30fps (-14.0 LUFS)',
      default_aspect: '9:16',
      prerequisites: ['Node.js >= 22', 'FFmpeg >= 7', 'Python 3.10+', 'HyperFrames CLI'],
      verify_command: 'node --version && ffmpeg -version && npx hyperframes --version'
    },
    how_agent_should_assist_user: [
      `1. Kiểm tra xem thư mục "${folderName}" đã tồn tại trong workspace hoặc thư mục skills của người dùng chưa.`,
      driveUrl
        ? `2. Nếu chưa có, hướng dẫn người dùng tải file "${folderName}-Core-Kit.zip" tại ${driveUrl} và giải nén vào thư mục skills.`
        : '2. Nếu chưa có bộ Skill Kit cục bộ, nhắc người dùng tải trong mục Sản phẩm của tôi trên khoskill.site.',
      '3. Chạy lệnh kiểm tra môi trường (`verify_command`) và chủ động hỗ trợ cài đặt các gói còn thiếu nếu người dùng đồng ý.',
      '4. Gọi `get_skill_blueprint` để đọc toàn bộ SKILL.md và `create_video_from_skill` để chạy từng pha dựng video xuất file MP4 chuẩn -14 LUFS.'
    ]
  }
}

function generateStoryboardPayload(skill: LicensedMcpSkillRow, args: Record<string, any>) {
  const profile = getSkillEngineProfile(skill.slug)
  const topic = String(args.topic || args.product_name || 'Video dựng bằng AI Agent').trim()
  const productName = String(args.product_name || topic).trim()
  const audience = String(args.target_audience || 'Khán giả TikTok / Reels / YouTube Việt Nam').trim()
  const defaultDur = profile?.defaultDurationSec || 45
  const durationSec = Math.min(600, Math.max(15, Number(args.duration_sec) || defaultDur))
  const aspectRatio = String(args.aspect_ratio || profile?.defaultAspect || '9:16')
  const platform = String(args.platform || (aspectRatio === '16:9' ? 'YouTube 16:9' : 'TikTok / Reels / Shorts 9:16'))
  const model = String(args.model || (profile ? 'HyperFrames + GSAP + FFmpeg (-14 LUFS)' : 'HyperFrames / AI Video Engine'))
  const tone = String(args.tone || 'Tự nhiên, nhịp dựng dứt khoát, hình ảnh sắc nét chuẩn studio')
  const usp = String(args.usp || 'Thông tin xác thực, bố cục chuyển động mượt mà, âm thanh chuẩn -14 LUFS').trim()

  const s1 = Math.max(4, Math.round(durationSec * 0.14))
  const s2 = Math.max(8, Math.round(durationSec * 0.26))
  const s3 = Math.max(10, Math.round(durationSec * 0.42))
  const s4 = Math.max(5, durationSec - s1 - s2 - s3)

  const hookVariants = [
    `3 giây đầu tiên mở khóa toàn bộ câu chuyện về ${topic}!`,
    `Đừng bỏ qua chi tiết quan trọng nhất khi làm về ${topic} — xem ngay:`,
    `${productName}: ${usp} — tóm gọn rõ ràng trong ${durationSec} giây.`
  ]

  const fmtSrtTime = (totalSec: number) => {
    const h = Math.floor(totalSec / 3600)
    const m = Math.floor((totalSec % 3600) / 60)
    const s = Math.floor(totalSec % 60)
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},000`
  }

  const scenes = [
    {
      scene: 1,
      role: 'Hook Mở Màn & Visual Anchor (0–6s)',
      time_range: `${fmtSrtTime(0).slice(0, 8)} - ${fmtSrtTime(s1).slice(0, 8)}`,
      duration_sec: s1,
      visual_layer: profile
        ? `Áp dụng opening chuẩn ${profile.folderName} (${aspectRatio}): chuyển động mạnh 3s đầu, typography sắc nét, không đen khung.`
        : `Visual Hook 3s đầu tỷ lệ ${aspectRatio}, bố cục thoáng & tương phản cao.`,
      voiceover_vi: hookVariants[0]
    },
    {
      scene: 2,
      role: 'Bối Cảnh & Dữ Liệu Xác Thực (Context / FACTS)',
      time_range: `${fmtSrtTime(s1).slice(0, 8)} - ${fmtSrtTime(s1 + s2).slice(0, 8)}`,
      duration_sec: s2,
      visual_layer: `Đưa bối cảnh, số liệu/bản đồ/B-roll đã kiểm định khớp 1:1 lời thoại về "${topic}".`,
      voiceover_vi: `Trước hết hãy nhìn vào điểm mấu chốt ít người để ý về ${topic}.`
    },
    {
      scene: 3,
      role: 'Phân Tích / Demo Chuyên Sâu (Core Value)',
      time_range: `${fmtSrtTime(s1 + s2).slice(0, 8)} - ${fmtSrtTime(s1 + s2 + s3).slice(0, 8)}`,
      duration_sec: s3,
      visual_layer: `Luân phiên cảnh 2–5s/nhịp (motion graphics GSAP, B-roll sạch, biểu đồ/callout/tư thế minh hoạ không che mặt), kèm SFX pre-lap -0.08s.`,
      voiceover_vi: `Điểm tạo nên sự khác biệt thực sự của ${productName} nằm ở ${usp}.`
    },
    {
      scene: 4,
      role: 'Tổng Kết & Kêu Gọi Hành Động (Outro & CTA)',
      time_range: `${fmtSrtTime(s1 + s2 + s3).slice(0, 8)} - ${fmtSrtTime(durationSec).slice(0, 8)}`,
      duration_sec: s4,
      visual_layer: `Khung hình kết mạnh + thông tin thương hiệu/CTA gọn gàng, giữ khoảng thở an toàn cuối câu tránh cắt âm.`,
      voiceover_vi: `Lưu lại video này ngay và bình luận chủ đề tiếp theo bạn muốn xem chi tiết hơn nhé!`
    }
  ]

  const srt = scenes.map((sc, idx) => {
    const startSec = scenes.slice(0, idx).reduce((a, x) => a + x.duration_sec, 0)
    const endSec = startSec + sc.duration_sec
    return `${idx + 1}\n${fmtSrtTime(startSec)} --> ${fmtSrtTime(endSec)}\n${sc.voiceover_vi}`
  }).join('\n\n')

  return {
    skill: {
      slug: skill.slug,
      name: skill.name,
      version: skill.version,
      engine: profile?.engineSummary || 'KhoSkill AI Agent Video Engine'
    },
    brief: {
      topic,
      product_name: productName,
      target_audience: audience,
      duration_sec: durationSec,
      aspect_ratio: aspectRatio,
      resolution: profile?.resolution || (aspectRatio === '16:9' ? '1920x1080 @ 30fps' : '1080x1920 @ 30fps'),
      platform,
      render_engine: model,
      tone,
      usp
    },
    ab_hook_variants: hookVariants,
    scenes,
    subtitles_srt: srt,
    audio_master_standard: {
      target_lufs: -14.0,
      max_true_peak_dbtp: -1.0,
      bgm_ducking: 'sidechaincompress (-17.5 to -19 dB under voice)',
      sfx_rules: 'Non-repeating transition stems, pre-lapped -0.08s before cuts'
    },
    qa_release_gates: [
      '0 unintended black frames (`black_segments: []`)',
      '0 clipped text / diacritics / face overlap',
      'Integrated loudness within -14.0 ± 0.5 LUFS, true peak <= -1.0 dBTP',
      'Visual contact sheet (.qa.jpg) inspected before final delivery'
    ]
  }
}

export function buildToolsManifest(skills: LicensedMcpSkillRow[]) {
  const slugEnum = skills.map(s => s.slug)
  const slugNote = slugEnum.length === 1
    ? `Mặc định dùng "${slugEnum[0]}".`
    : `Chọn 1 trong các skill đã kích hoạt: ${slugEnum.join(', ')} (để trống sẽ dùng "${slugEnum[0]}").`

  const baseTools = [
    {
      name: 'list_licensed_skills',
      description: 'Liệt kê tất cả Skill AI Agent (MCP) đang được kích hoạt bởi License Key của người dùng trên KhoSkill AI kèm link tải Google Drive.',
      inputSchema: {
        type: 'object',
        properties: {},
        additionalProperties: false
      }
    },
    {
      name: 'get_skill_blueprint',
      description: `Nạp toàn bộ tài liệu SKILL.md chuẩn mới nhất, quy trình từng pha, thông số kỹ thuật và cổng QA bắt buộc của Skill AI Agent. ${slugNote}`,
      inputSchema: {
        type: 'object',
        properties: {
          skill_slug: { type: 'string', description: slugNote }
        }
      }
    },
    {
      name: 'get_skill_assets_and_setup',
      description: `Lấy link Google Drive tải bộ Skill Kit (starter template, scripts Python/Node, SFX, fonts, demo 1080p), đường dẫn thư mục cài đặt cho Claude/Codex/Antigravity và lệnh kiểm tra môi trường. ${slugNote}`,
      inputSchema: {
        type: 'object',
        properties: {
          skill_slug: { type: 'string', description: slugNote }
        }
      }
    },
    {
      name: 'generate_video_storyboard',
      description: `Áp dụng Skill để phân tích brief, chia beat kịch bản, cấu trúc từng phân đoạn hình ảnh, 3 biến thể Hook A/B, phụ đề SRT và chuẩn âm thanh -14 LUFS. ${slugNote}`,
      inputSchema: {
        type: 'object',
        properties: {
          skill_slug: { type: 'string', description: slugNote },
          topic: { type: 'string', description: 'Chủ đề video, tên tour, tên dự án BĐS, sự kiện lịch sử hoặc bài tập gym (bắt buộc)' },
          product_name: { type: 'string', description: 'Tên dự án / thương hiệu / sản phẩm cụ thể' },
          usp: { type: 'string', description: 'Điểm nổi bật, giá, khuyến mãi hoặc thông điệp chính cần nhấn mạnh' },
          target_audience: { type: 'string', description: 'Khách hàng / khán giả mục tiêu' },
          duration_sec: { type: 'number', description: 'Thời lượng video mong muốn (giây)' },
          aspect_ratio: { type: 'string', enum: ['9:16', '16:9', '1:1'], description: 'Tỷ lệ khung hình (9:16 dọc hoặc 16:9 ngang)' },
          platform: { type: 'string', description: 'TikTok, Facebook Reels, YouTube Shorts hoặc YouTube 16:9' },
          tone: { type: 'string', description: 'Giọng điệu / phong cách dựng' }
        },
        required: ['topic']
      }
    },
    {
      name: 'create_video_from_skill',
      description: `Lập trọn bộ gói thực thi dựng video theo đúng kiến trúc Skill (bao gồm storyboard, chuỗi lệnh script từng pha của HyperFrames/GSAP/FFmpeg -14 LUFS, link bộ tài nguyên Google Drive và các cổng QA bắt buộc để AI Agent tự chạy dựng ra file final.mp4 trên máy người dùng). ${slugNote}`,
      inputSchema: {
        type: 'object',
        properties: {
          skill_slug: { type: 'string', description: slugNote },
          topic: { type: 'string', description: 'Chủ đề / brief video cần dựng (bắt buộc)' },
          product_name: { type: 'string', description: 'Tên dự án / thương hiệu (tuỳ chọn)' },
          usp: { type: 'string', description: 'Điểm nhấn chính (giá, địa điểm, lợi ích, thông điệp)' },
          target_audience: { type: 'string', description: 'Tệp người xem mục tiêu' },
          duration_sec: { type: 'number', description: 'Thời lượng giây mong muốn' },
          aspect_ratio: { type: 'string', enum: ['9:16', '16:9', '1:1'], description: 'Tỷ lệ khung hình' },
          platform: { type: 'string', description: 'Nền tảng phát hành' },
          raw_video_path: { type: 'string', description: 'Đường dẫn file video thô trên máy (nếu dùng skill Talking Head)' },
          voice_script: { type: 'string', description: 'Lời thoại tuỳ chỉnh nếu đã có sẵn (tuỳ chọn)' }
        },
        required: ['topic']
      }
    }
  ]

  const knownNames = new Set(baseTools.map(t => t.name))
  for (const sk of skills) {
    for (const custom of parseMcpTools(sk.mcp_tools)) {
      if (!knownNames.has(custom.name)) {
        knownNames.add(custom.name)
        baseTools.push({
          name: custom.name,
          description: `${custom.description || 'Tool chuyên biệt theo Skill'} (Skill: ${sk.name})`,
          inputSchema: {
            type: 'object',
            properties: {
              topic: { type: 'string', description: 'Chủ đề / yêu cầu đầu vào cho Skill' },
              params: { type: 'object', description: 'Tham số mở rộng tuỳ chọn' }
            }
          } as any
        })
      }
    }
  }

  return baseTools
}

function rpcResult(id: any, result: any) {
  return { jsonrpc: '2.0', id, result }
}

function rpcError(id: any, code: number, message: string, data?: any) {
  return { jsonrpc: '2.0', id, error: { code, message, ...(data !== undefined ? { data } : {}) } }
}

export async function handleMcpJsonRpc(opts: {
  db: D1Database
  auth: { primary: LicensedMcpSkillRow; skills: LicensedMcpSkillRow[] }
  payload: any
  origin: string
}): Promise<{ status: number; body: any | null }> {
  const { db, auth, payload, origin } = opts

  if (!payload || typeof payload !== 'object' || payload.jsonrpc !== '2.0' || typeof payload.method !== 'string') {
    return { status: 400, body: rpcError(payload?.id ?? null, -32600, 'Invalid JSON-RPC 2.0 request') }
  }

  const { id, method, params = {} } = payload
  const isNotification = id === undefined || id === null

  if (method === 'notifications/initialized' || method.startsWith('notifications/')) {
    return { status: 202, body: null }
  }

  if (method === 'ping') {
    return { status: 200, body: rpcResult(id, {}) }
  }

  if (method === 'initialize') {
    const clientVer = typeof params?.protocolVersion === 'string' ? params.protocolVersion : '2025-03-26'
    const supported = ['2025-06-18', '2025-03-26', '2024-11-05']
    const negotiated = supported.includes(clientVer) ? clientVer : '2025-03-26'
    const serverName = resolveMcpServerName(auth.primary)
    return {
      status: 200,
      body: rpcResult(id, {
        protocolVersion: negotiated,
        capabilities: {
          tools: { listChanged: false },
          prompts: { listChanged: false },
          resources: { subscribe: false, listChanged: false }
        },
        serverInfo: {
          name: serverName,
          version: auth.primary.version || '2.0.0'
        },
        instructions: `Bạn đã kết nối thành công với KhoSkill AI MCP Server (${auth.skills.length} Skill AI Agent dựng video đang kích hoạt). Bước 1: gọi "get_skill_assets_and_setup" để kiểm tra bộ Skill Kit cục bộ (hoặc lấy link Google Drive tải về) và kiểm tra môi trường. Bước 2: gọi "get_skill_blueprint" để nạp toàn bộ SKILL.md mới nhất. Bước 3: gọi "create_video_from_skill" để lập pipeline dựng video chuẩn studio và thực thi các lệnh dựng ra file MP4 -14 LUFS.`
      })
    }
  }

  if (method === 'tools/list') {
    return {
      status: 200,
      body: rpcResult(id, { tools: buildToolsManifest(auth.skills) })
    }
  }

  if (method === 'prompts/list') {
    const prompts = auth.skills.map(s => ({
      name: `skill_${s.slug.replace(/[^a-z0-9_]/gi, '_')}`,
      description: `Chạy trọn bộ quy trình "${s.name}" để dựng video chuẩn studio bằng AI Agent`,
      arguments: [
        { name: 'topic', description: 'Chủ đề, brief hoặc đường dẫn video thô muốn dựng', required: true }
      ]
    }))
    return { status: 200, body: rpcResult(id, { prompts }) }
  }

  if (method === 'prompts/get') {
    const pName = String(params?.name || '')
    const matched = auth.skills.find(s => `skill_${s.slug.replace(/[^a-z0-9_]/gi, '_')}` === pName) || auth.primary
    const topic = String(params?.arguments?.topic || '[chủ đề của người dùng]')
    const blueprint = (matched.mcp_skill_prompt || '').trim() || buildFallbackBlueprint(matched)
    const driveNote = matched.download_url ? `\nLink Google Drive tải bộ Skill Kit (templates/scripts/SFX): ${matched.download_url}\n` : ''
    return {
      status: 200,
      body: rpcResult(id, {
        description: matched.short_desc || matched.name,
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Hãy thực thi Skill "${matched.name}" cho yêu cầu: "${topic}".${driveNote}\nDưới đây là SKILL.md chính thức từ KhoSkill MCP:\n\n${blueprint}\n\nHãy gọi tool "get_skill_assets_and_setup" để kiểm tra máy và "create_video_from_skill" với topic="${topic}" để triển khai dựng video hoàn chỉnh.`
            }
          }
        ]
      })
    }
  }

  if (method === 'resources/list') {
    const resources = auth.skills.map(s => ({
      uri: `khoskill://skills/${s.slug}/blueprint.md`,
      name: `${s.name} — SKILL.md Blueprint`,
      description: s.short_desc || 'Tài liệu SKILL.md chính thức cho AI Agent',
      mimeType: 'text/markdown'
    }))
    return { status: 200, body: rpcResult(id, { resources }) }
  }

  if (method === 'resources/read') {
    const uri = String(params?.uri || '')
    const m = uri.match(/^khoskill:\/\/skills\/([^/]+)\/blueprint\.md$/)
    const matched = (m && auth.skills.find(s => s.slug === m[1])) || auth.primary
    const blueprint = (matched.mcp_skill_prompt || '').trim() || buildFallbackBlueprint(matched)
    return {
      status: 200,
      body: rpcResult(id, {
        contents: [
          {
            uri: `khoskill://skills/${matched.slug}/blueprint.md`,
            mimeType: 'text/markdown',
            text: blueprint
          }
        ]
      })
    }
  }

  if (method === 'tools/call') {
    const toolName = String(params?.name || '').trim()
    const args = (params?.arguments && typeof params.arguments === 'object') ? params.arguments : {}
    const requestedSlug = String(args.skill_slug || '').trim()
    const targetSkill = (requestedSlug && auth.skills.find(s => s.slug === requestedSlug)) || auth.primary

    await db.prepare(
      `UPDATE licenses SET mcp_call_count = COALESCE(mcp_call_count, 0) + 1, last_mcp_call_at = ? WHERE id = ?`
    ).bind(new Date().toISOString(), targetSkill.license_id).run().catch(() => null)

    if (toolName === 'list_licensed_skills') {
      const summary = auth.skills.map(s => ({
        slug: s.slug,
        name: s.name,
        version: s.version,
        short_desc: s.short_desc,
        server_name: resolveMcpServerName(s),
        endpoint: resolveMcpEndpoint(origin, s),
        google_drive_kit_url: s.download_url || null,
        supported_clients: parseMcpClients(s.mcp_clients),
        tech_stack: parseJSON<string[]>(s.tech_stack, []),
        render_webhook_connected: Boolean((s.mcp_render_webhook || '').trim())
      }))
      return {
        status: 200,
        body: rpcResult(id, {
          content: [{ type: 'text', text: JSON.stringify({ owner: auth.primary.user_email, active_skills: summary }, null, 2) }]
        })
      }
    }

    if (toolName === 'get_skill_assets_and_setup') {
      const setupInfo = buildSetupAndAssetsPayload(targetSkill)
      return {
        status: 200,
        body: rpcResult(id, {
          content: [{ type: 'text', text: JSON.stringify(setupInfo, null, 2) }]
        })
      }
    }

    if (toolName === 'get_skill_blueprint') {
      const blueprint = (targetSkill.mcp_skill_prompt || '').trim() || buildFallbackBlueprint(targetSkill)
      const driveFooter = targetSkill.download_url
        ? `\nGoogle Drive Skill Kit (templates/scripts/SFX/demo): ${targetSkill.download_url}`
        : ''
      return {
        status: 200,
        body: rpcResult(id, {
          content: [
            {
              type: 'text',
              text: `${blueprint}\n\n---\nSkill Slug: ${targetSkill.slug} | Version: ${targetSkill.version} | Licensed to: ${targetSkill.user_email}${driveFooter}`
            }
          ]
        })
      }
    }

    if (toolName === 'generate_video_storyboard') {
      const storyboard = generateStoryboardPayload(targetSkill, args)
      return {
        status: 200,
        body: rpcResult(id, {
          content: [{ type: 'text', text: JSON.stringify(storyboard, null, 2) }]
        })
      }
    }

    if (toolName === 'create_video_from_skill') {
      const blueprint = (targetSkill.mcp_skill_prompt || '').trim() || buildFallbackBlueprint(targetSkill)
      const storyboard = generateStoryboardPayload(targetSkill, args)
      const setupInfo = buildSetupAndAssetsPayload(targetSkill)
      const profile = getSkillEngineProfile(targetSkill.slug)
      const jobId = `KSJOB-${Date.now().toString(36).toUpperCase()}`
      const webhookUrl = (targetSkill.mcp_render_webhook || '').trim()

      if (webhookUrl && (webhookUrl.startsWith('https://') || webhookUrl.startsWith('http://'))) {
        try {
          const resp = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-KhoSkill-License': targetSkill.license_key,
              'X-KhoSkill-Slug': targetSkill.slug
            },
            body: JSON.stringify({
              job_id: jobId,
              skill_slug: targetSkill.slug,
              skill_name: targetSkill.name,
              user_email: targetSkill.user_email,
              arguments: args,
              storyboard,
              blueprint
            })
          })
          const respText = await resp.text()
          let parsed: any = null
          try { parsed = JSON.parse(respText) } catch { parsed = { raw: respText } }
          return {
            status: 200,
            body: rpcResult(id, {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({
                    job_id: jobId,
                    mode: 'remote_render_webhook',
                    webhook_status: resp.status,
                    render_response: parsed,
                    storyboard
                  }, null, 2)
                }
              ],
              isError: !resp.ok
            })
          }
        } catch (err: any) {
          return {
            status: 200,
            body: rpcResult(id, {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({
                    job_id: jobId,
                    mode: 'local_agent_execution_package',
                    webhook_error: String(err?.message || err),
                    setup: setupInfo,
                    storyboard,
                    phase_commands: profile?.phaseCommands || [],
                    blueprint_excerpt: blueprint.slice(0, 2200)
                  }, null, 2)
                }
              ]
            })
          }
        }
      }

      const productionPackage = {
        job_id: jobId,
        status: 'ready_for_agent_execution',
        mode: 'local_agent_video_pipeline',
        skill_used: {
          slug: targetSkill.slug,
          name: targetSkill.name,
          version: targetSkill.version,
          local_folder: setupInfo.local_skill_folder_name,
          google_drive_kit_url: setupInfo.google_drive_skill_kit_url
        },
        raw_video_path: args.raw_video_path || null,
        custom_voice_script: args.voice_script || null,
        storyboard,
        agent_execution_pipeline: profile ? profile.phaseCommands : [
          '1. Đảm bảo bộ Skill Kit đã được giải nén từ Google Drive vào thư mục skills của AI Agent.',
          '2. Chạy script khởi tạo dự án và kiểm tra môi trường (Node 22, FFmpeg, Python, HyperFrames).',
          '3. Dựng kịch bản, voiceover/timing, B-roll và cấu hình timeline theo SKILL.md.',
          '4. Chạy `hyperframes check`, duyệt snapshot, render MP4, master âm thanh -14.0 LUFS và duyệt ảnh QA cuối.'
        ],
        verify_environment_command: setupInfo.engine.verify_command,
        prerequisites: setupInfo.engine.prerequisites,
        blueprint_excerpt: blueprint.slice(0, 2500)
      }

      return {
        status: 200,
        body: rpcResult(id, {
          content: [{ type: 'text', text: JSON.stringify(productionPackage, null, 2) }]
        })
      }
    }

    const customTool = parseMcpTools(targetSkill.mcp_tools).find(t => t.name === toolName)
    if (customTool) {
      const storyboard = generateStoryboardPayload(targetSkill, args)
      const blueprint = (targetSkill.mcp_skill_prompt || '').trim() || buildFallbackBlueprint(targetSkill)
      return {
        status: 200,
        body: rpcResult(id, {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                tool: customTool.name,
                description: customTool.description,
                skill: targetSkill.name,
                google_drive_kit_url: targetSkill.download_url || null,
                input: args,
                storyboard,
                blueprint
              }, null, 2)
            }
          ]
        })
      }
    }

    return {
      status: 200,
      body: rpcError(id, -32602, `Tool không tồn tại: "${toolName}". Gọi tools/list để xem danh sách tool khả dụng.`)
    }
  }

  if (isNotification) {
    return { status: 202, body: null }
  }
  return { status: 200, body: rpcError(id, -32601, `Method không hỗ trợ: ${method}`) }
}
