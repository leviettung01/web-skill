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

  const samplePrompt = `Hãy kết nối MCP "${serverName}", gọi tool get_skill_blueprint rồi gọi create_video_from_skill để tạo video 30s 9:16 theo đúng chuẩn Skill cho chủ đề/sản phẩm: [nhập tên sản phẩm hoặc ý tưởng của bạn].`

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
            p.features, p.tech_stack, p.product_type,
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

  // Load all active MCP Skills owned by this user (so 1 connection can discover all owned MCP skills,
  // or filter strictly to targetSlug when connecting to /api/mcp/:slug)
  const allRes = await db.prepare(
    `SELECT l.id AS license_id, l.license_key, l.user_id,
            u.email AS user_email, u.full_name AS user_name,
            p.id AS product_id, p.slug, p.name, p.version, p.short_desc, p.description,
            p.features, p.tech_stack,
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
    '## Công nghệ / Model tương thích',
    tech.length ? tech.map(t => `- ${t}`).join('\n') : '- Seedance 2.5, Muse AI, Veo 3, CapCut',
    '',
    '## Thành phần cốt lõi của Skill',
    features.length ? features.map(f => `- ${f}`).join('\n') : '- Hook 3s + Khóa nhân vật + Kịch bản 30s + CTA',
    '',
    '## Mô tả quy trình',
    stripHtml(skill.description || '', 2000)
  ]
  return lines.join('\n')
}

function generateStoryboardPayload(skill: LicensedMcpSkillRow, args: Record<string, any>) {
  const topic = String(args.topic || args.product_name || 'Sản phẩm / chủ đề video AI').trim()
  const productName = String(args.product_name || topic).trim()
  const audience = String(args.target_audience || 'Khách hàng trẻ 20-35 tuổi trên TikTok / Facebook Reels').trim()
  const durationSec = Math.min(60, Math.max(10, Number(args.duration_sec) || 30))
  const aspectRatio = String(args.aspect_ratio || '9:16')
  const platform = String(args.platform || 'TikTok / Reels')
  const model = String(args.model || 'Seedance 2.5')
  const tone = String(args.tone || 'Tự nhiên, chân thực, tốc độ nhanh, giữ chân 3 giây đầu')
  const usp = String(args.usp || 'Giải quyết vấn đề nhanh gọn, tiết kiệm thời gian & chi phí').trim()

  const s1 = Math.max(3, Math.round(durationSec * 0.16))
  const s2 = Math.max(5, Math.round(durationSec * 0.27))
  const s3 = Math.max(6, Math.round(durationSec * 0.37))
  const s4 = Math.max(4, durationSec - s1 - s2 - s3)

  const charAnchor = `Consistent Vietnamese creator (25yo, clean casual outfit, warm natural daylight, authentic home/studio setting, sharp focus, ${aspectRatio} vertical cinematic realism, no text artifacts)`
  const isAffiliate = skill.slug.includes('affiliate') || skill.name.toLowerCase().includes('affiliate')

  const hookVariants = isAffiliate
    ? [
        `Đừng mua ${productName} trước khi xem hết 30 giây test thực tế này!`,
        `Tại sao ai dùng ${productName} rồi cũng bảo đáng tiền hơn gấp 3 lần?`,
        `Thử ${productName} trong đúng 5 giây và đây là kết quả khiến mình bất ngờ...`
      ]
    : [
        `3 giây đầu tiên sẽ thay đổi hoàn toàn cách bạn nhìn về ${topic}!`,
        `90% mọi người làm sai bước này khi tiếp cận ${topic} — xem ngay cách chuẩn:`,
        `Từ con số 0 đến kết quả cực đã mắt với ${topic} chỉ trong ${durationSec} giây.`
      ]

  const scenes = [
    {
      scene: 1,
      role: 'Visual Hook (Chặn cuộn 3 giây đầu)',
      time_range: `00:00 - 00:${String(s1).padStart(2, '0')}`,
      duration_sec: s1,
      camera: 'Fast push-in close-up, dynamic hand motion, eye-level',
      voiceover_vi: hookVariants[0],
      visual_prompt: `${charAnchor}. Dynamic opening close-up showcasing "${topic}" in action, dramatic eye-catching first frame, brisk push-in camera movement, vibrant crisp textures, high retention hook framing, natural ambient SFX.`
    },
    {
      scene: 2,
      role: 'Vấn đề thực tế (Agitate)',
      time_range: `00:${String(s1).padStart(2, '0')} - 00:${String(s1 + s2).padStart(2, '0')}`,
      duration_sec: s2,
      camera: 'Medium shot, slight handheld authenticity',
      voiceover_vi: `Trước đây mình cũng mất rất nhiều thời gian loay hoay vì vấn đề quen thuộc khi làm về ${topic}.`,
      visual_prompt: `${charAnchor}. Medium shot showing relatable everyday frustration related to "${topic}", realistic indoor lighting, expressive natural body language, smooth camera pan, consistent wardrobe and background.`
    },
    {
      scene: 3,
      role: 'Giải pháp & Demo USP (Payoff)',
      time_range: `00:${String(s1 + s2).padStart(2, '0')} - 00:${String(s1 + s2 + s3).padStart(2, '0')}`,
      duration_sec: s3,
      camera: 'Macro detail + smooth orbit transition (Before -> After)',
      voiceover_vi: `Cho đến khi áp dụng đúng điểm ăn tiền của ${productName}: ${usp}. Nhìn kết quả thực tế khác hẳn ngay lập tức!`,
      visual_prompt: `${charAnchor}. Crisp macro and medium-close shots demonstrating "${productName}" delivering "${usp}", clean before-and-after transformation, smooth gimbal motion, studio-grade highlights, zero distortion.`
    },
    {
      scene: 4,
      role: 'Kết quả đẹp nhất & CTA',
      time_range: `00:${String(s1 + s2 + s3).padStart(2, '0')} - 00:${String(durationSec).padStart(2, '0')}`,
      duration_sec: s4,
      camera: 'Clean hero shot, gentle zoom-out + smile to camera',
      voiceover_vi: isAffiliate
        ? `Mình gắn sẵn ${productName} ở giỏ hàng góc trái màn hình, bấm xem ưu đãi hôm nay trước khi hết deal nhé!`
        : `Lưu ngay video này để áp dụng cho kênh của bạn và bình luận chủ đề bạn muốn mình làm tiếp theo nhé!`,
      visual_prompt: `${charAnchor}. Polished final hero shot displaying the completed result of "${topic}", creator smiling confidently toward camera, warm rim lighting, clean negative space at bottom-left for CTA overlay.`
    }
  ]

  const srt = scenes.map((sc, idx) => {
    const startSec = scenes.slice(0, idx).reduce((a, x) => a + x.duration_sec, 0)
    const endSec = startSec + sc.duration_sec
    const fmt = (t: number) => `00:00:${String(t).padStart(2, '0')},000`
    return `${idx + 1}\n${fmt(startSec)} --> ${fmt(endSec)}\n${sc.voiceover_vi}`
  }).join('\n\n')

  return {
    skill: {
      slug: skill.slug,
      name: skill.name,
      version: skill.version
    },
    brief: {
      topic,
      product_name: productName,
      target_audience: audience,
      duration_sec: durationSec,
      aspect_ratio: aspectRatio,
      platform,
      target_model: model,
      tone,
      usp
    },
    character_lock: charAnchor,
    ab_hook_variants: hookVariants,
    scenes,
    subtitles_srt: srt,
    social_meta: {
      caption: `${hookVariants[0]} ✨ #${skill.slug.replace(/[^a-z0-9]/gi, '')} #VideoAI #KhoSkillAI #ReelsVN #TikTokShop`,
      posting_windows_vn: ['11:30 - 12:30', '19:30 - 21:30']
    }
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
      description: 'Liệt kê tất cả Skill AI Agent (MCP) đang được kích hoạt bởi License Key của người dùng trên KhoSkill AI.',
      inputSchema: {
        type: 'object',
        properties: {},
        additionalProperties: false
      }
    },
    {
      name: 'get_skill_blueprint',
      description: `Nạp toàn bộ quy trình, công thức Hook-Body-CTA, luật khóa nhân vật và chỉ dẫn thực thi của Skill AI. ${slugNote}`,
      inputSchema: {
        type: 'object',
        properties: {
          skill_slug: { type: 'string', description: slugNote }
        }
      }
    },
    {
      name: 'generate_video_storyboard',
      description: `Áp dụng Skill để tự động tạo storyboard chi tiết, khóa nhân vật, prompt từng cảnh chuẩn Seedance 2.5 / Muse AI / Veo 3, 3 biến thể Hook A/B và phụ đề SRT. ${slugNote}`,
      inputSchema: {
        type: 'object',
        properties: {
          skill_slug: { type: 'string', description: slugNote },
          topic: { type: 'string', description: 'Chủ đề video hoặc ý tưởng chính (bắt buộc)' },
          product_name: { type: 'string', description: 'Tên sản phẩm / dịch vụ (nếu làm video bán hàng / affiliate)' },
          usp: { type: 'string', description: 'Điểm nổi bật chính (USP) muốn nhấn mạnh trong video' },
          target_audience: { type: 'string', description: 'Khách hàng mục tiêu' },
          duration_sec: { type: 'number', description: 'Thời lượng video mong muốn (giây), mặc định 30' },
          aspect_ratio: { type: 'string', enum: ['9:16', '16:9', '1:1'], description: 'Tỷ lệ khung hình, mặc định 9:16' },
          platform: { type: 'string', description: 'Nền tảng đăng tải: TikTok, Facebook Reels, YouTube Shorts...' },
          model: { type: 'string', description: 'Model AI tạo video mục tiêu: Seedance 2.5, Muse AI, Veo 3, Google Flow...' },
          tone: { type: 'string', description: 'Giọng điệu / phong cách thể hiện' }
        },
        required: ['topic']
      }
    },
    {
      name: 'create_video_from_skill',
      description: `Thực thi trọn vẹn Skill để tạo gói sản xuất video hoàn chỉnh (hoặc gọi render pipeline tự động nếu Skill có gắn render API/webhook). Trả về job_id, blueprint áp dụng, storyboard từng cảnh, prompt render, voiceover, SRT và hướng dẫn lắp ráp cuối. ${slugNote}`,
      inputSchema: {
        type: 'object',
        properties: {
          skill_slug: { type: 'string', description: slugNote },
          topic: { type: 'string', description: 'Chủ đề hoặc tên sản phẩm cần tạo video (bắt buộc)' },
          product_name: { type: 'string', description: 'Tên sản phẩm cụ thể (tuỳ chọn)' },
          usp: { type: 'string', description: 'Lợi ích / điểm mạnh cốt lõi cần nhấn mạnh' },
          target_audience: { type: 'string', description: 'Tệp người xem mục tiêu' },
          duration_sec: { type: 'number', description: 'Thời lượng giây, mặc định 30' },
          aspect_ratio: { type: 'string', enum: ['9:16', '16:9', '1:1'], description: 'Tỷ lệ khung hình, mặc định 9:16' },
          platform: { type: 'string', description: 'TikTok, Facebook Reels, Instagram Reels hoặc YouTube Shorts' },
          model: { type: 'string', description: 'Seedance 2.5, Muse AI, Veo 3 hoặc Google Flow' },
          reference_image_url: { type: 'string', description: 'URL ảnh nhân vật hoặc ảnh sản phẩm để khóa ngoại hình (tuỳ chọn)' },
          voice_script: { type: 'string', description: 'Lời thoại tuỳ chỉnh nếu bạn đã có sẵn (tuỳ chọn)' }
        },
        required: ['topic']
      }
    }
  ]

  // Include any custom admin-defined tools that aren't already in baseTools
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
          version: auth.primary.version || '1.0.0'
        },
        instructions: `Bạn đã kết nối thành công với KhoSkill AI MCP Server (${auth.skills.length} Skill AI Agent đang kích hoạt). Hãy gọi tool "get_skill_blueprint" để nạp quy trình chuẩn và gọi "create_video_from_skill" hoặc "generate_video_storyboard" để tự động sản xuất video theo đúng Skill.`
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
      description: `Chạy toàn bộ quy trình "${s.name}" để tạo video tự động theo chuẩn Skill`,
      arguments: [
        { name: 'topic', description: 'Chủ đề hoặc tên sản phẩm muốn tạo video', required: true },
        { name: 'model', description: 'Model video AI mục tiêu (Seedance 2.5, Muse AI, Veo 3...)', required: false }
      ]
    }))
    return { status: 200, body: rpcResult(id, { prompts }) }
  }

  if (method === 'prompts/get') {
    const pName = String(params?.name || '')
    const matched = auth.skills.find(s => `skill_${s.slug.replace(/[^a-z0-9_]/gi, '_')}` === pName) || auth.primary
    const topic = String(params?.arguments?.topic || '[chủ đề của người dùng]')
    const model = String(params?.arguments?.model || 'Seedance 2.5')
    const blueprint = (matched.mcp_skill_prompt || '').trim() || buildFallbackBlueprint(matched)
    return {
      status: 200,
      body: rpcResult(id, {
        description: matched.short_desc || matched.name,
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Hãy thực thi Skill "${matched.name}" cho chủ đề "${topic}" trên model "${model}".\n\nDưới đây là Skill Blueprint chính thức từ KhoSkill MCP:\n\n${blueprint}\n\nSau khi nắm rõ blueprint, hãy gọi tool "create_video_from_skill" với topic="${topic}" và model="${model}" để xuất gói sản xuất video hoàn chỉnh.`
            }
          }
        ]
      })
    }
  }

  if (method === 'resources/list') {
    const resources = auth.skills.map(s => ({
      uri: `khoskill://skills/${s.slug}/blueprint.md`,
      name: `${s.name} — Skill Blueprint`,
      description: s.short_desc || 'Tài liệu quy trình & công thức Skill chuẩn cho AI Agent',
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

    // Track MCP usage on the license record (best-effort, non-blocking error)
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

    if (toolName === 'get_skill_blueprint') {
      const blueprint = (targetSkill.mcp_skill_prompt || '').trim() || buildFallbackBlueprint(targetSkill)
      return {
        status: 200,
        body: rpcResult(id, {
          content: [
            {
              type: 'text',
              text: `${blueprint}\n\n---\nSkill Slug: ${targetSkill.slug} | Version: ${targetSkill.version} | Licensed to: ${targetSkill.user_email}`
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
      const jobId = `KSJOB-${Date.now().toString(36).toUpperCase()}`
      const webhookUrl = (targetSkill.mcp_render_webhook || '').trim()

      // If Admin configured a live external video rendering API/webhook, invoke it directly!
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
                    mode: 'fallback_production_package',
                    webhook_error: String(err?.message || err),
                    note: 'Render webhook tạm không phản hồi — trả về trọn bộ gói sản xuất chuẩn Skill để AI Agent tiếp tục xử lý.',
                    storyboard,
                    blueprint
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
        mode: 'skill_orchestration_package',
        skill_used: {
          slug: targetSkill.slug,
          name: targetSkill.name,
          version: targetSkill.version
        },
        reference_image_url: args.reference_image_url || null,
        custom_voice_script: args.voice_script || null,
        storyboard,
        agent_execution_steps: [
          '1. Kiểm tra lại Character Anchor và 4 cảnh trong storyboard để đảm bảo đồng nhất nhân vật & sản phẩm.',
          `2. Dùng từng visual_prompt gửi tới ${storyboard.brief.target_model} (tỷ lệ ${storyboard.brief.aspect_ratio}) để render clip từng cảnh.`,
          '3. Ghép clip theo đúng mốc thời gian, chèn voiceover tiếng Việt và file subtitles_srt.',
          '4. Xuất video MP4 1080x1920 30fps, áp dụng caption & khung giờ đăng trong social_meta.'
        ],
        blueprint_excerpt: blueprint.slice(0, 1500)
      }

      return {
        status: 200,
        body: rpcResult(id, {
          content: [{ type: 'text', text: JSON.stringify(productionPackage, null, 2) }]
        })
      }
    }

    // Custom admin-defined tool fallback: run skill blueprint + params cleanly
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
