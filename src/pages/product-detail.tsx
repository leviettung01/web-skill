import type { FC } from 'hono/jsx'
import { Layout, type LayoutProps } from '../components/Layout'
import { Breadcrumb, ProductCard, Stars, SectionTitle } from '../components/ui'
import { formatVND, discountPercent, parseJSON, gradientFor, PRODUCT_TYPE_LABEL, PRODUCT_TYPE_ICON, formatDate, isDirectVideoUrl, toEmbedVideoUrl, isMcpSkill, parseMcpClients, parseMcpTools } from '../lib/utils'
import { buildMcpConfigs } from '../lib/mcp'
import type { Product } from '../lib/types'

interface Props extends LayoutProps {
  product: Product
  related: Product[]
  comboItems: Product[]
  reviews: any[]
  owned: boolean
  inWishlist: boolean
  canReview: boolean
  ratingBreakdown: Record<number, number>
  origin?: string
}

export const ProductDetailPage: FC<Props> = (props) => {
  const { product: p, related, comboItems, reviews, owned, inWishlist, canReview, ratingBreakdown, user, settings, origin = 'https://khoskill.site' } = props
  const off = discountPercent(p.price, p.original_price)
  const features = parseJSON<string[]>(p.features, [])
  const tech = parseJSON<string[]>(p.tech_stack, [])
  const gallery = parseJSON<string[]>(p.gallery, [])
  const save = (p.original_price || 0) - p.price

  const isMp4 = isDirectVideoUrl(p.demo_video_url) || !!p.demo_video_url?.includes('/videos/')
  const embedVideoUrl = isMp4 ? p.demo_video_url : toEmbedVideoUrl(p.demo_video_url)
  const replacedPoster = isMp4 ? p.demo_video_url!.replace(/(\/videos)?\/demo-([^/?]+)\.mp4(\?.*)?$/i, '/videos/posters/poster-$2.jpg') : undefined
  const demoPoster = p.thumbnail || (replacedPoster && replacedPoster !== p.demo_video_url ? replacedPoster : undefined)
  const hasBeforeAfter = Boolean(p.raw_video_url && p.demo_video_url && isDirectVideoUrl(p.raw_video_url) && isMp4)
  const rawPoster = hasBeforeAfter
    ? p.raw_video_url!.replace(/\/raw-([^/?]+)\.mp4(\?.*)?$/i, '/poster-raw-$1.jpg')
    : undefined
  const isWalkingDepth = p.slug === 'viral-talking-head-video-edit'
  const comingSoon = p.status === 'coming_soon'
  const mcp = isMcpSkill(p.product_type)
  const mcpClients = mcp ? parseMcpClients(p.mcp_clients) : []
  const mcpTools = mcp ? parseMcpTools(p.mcp_tools) : []
  const mcpPreview = mcp ? buildMcpConfigs({
    origin,
    slug: p.slug,
    productName: p.name,
    licenseKey: 'KS-XXXX-XXXX-XXXX',
    mcpEndpoint: p.mcp_endpoint,
    mcpServerName: p.mcp_server_name
  }) : null

  return (
    <Layout {...props} active="products" title={p.name} description={p.short_desc} ogImage={p.thumbnail || undefined}
      bodyClass={!owned && !comingSoon ? 'has-sticky-buy-bar' : ''}>
      <div class="bg-[#0f0e24] border-b border-[#221e54]">
        <div class="max-w-7xl mx-auto px-4 pt-6 pb-8">
          <Breadcrumb items={[
            { label: 'Sản phẩm', href: '/san-pham' },
            ...(p.category_slug ? [{ label: p.category_name!, href: `/danh-muc/${p.category_slug}` }] : []),
            { label: p.name }
          ]} />

          <div class={`grid ${hasBeforeAfter ? 'lg:grid-cols-[minmax(0,540px)_1fr]' : 'lg:grid-cols-[minmax(0,520px)_1fr]'} gap-8 mt-4 items-start`}>
            {/* COLUMN 1: Before/After Synced Comparison Player (for Talking Head) OR Adaptive Video Player */}
            <div>
              {hasBeforeAfter ? (
                <div class="ba-compare-card rounded-2xl border-2 border-cyan-500/40 bg-[#070614] shadow-2xl shadow-cyan-950/30 overflow-hidden mb-4"
                  data-ba-player data-mode="split">
                  {/* Top Bar: Title & Mode Switcher */}
                  <div class="px-3.5 py-2.5 bg-gradient-to-r from-[#0d1129] via-[#101233] to-[#0a1c2e] border-b border-[#221e54] flex flex-wrap items-center justify-between gap-2">
                    <div class="flex items-center gap-2 min-w-0">
                      <span class="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shrink-0" aria-hidden="true"></span>
                      <span class="text-[11px] font-extrabold uppercase tracking-wider text-cyan-200 truncate">
                        So sánh Raw gốc vs Sau AI Edit
                      </span>
                    </div>
                    <div class="inline-flex items-center p-0.5 rounded-lg bg-[#070614] border border-[#2a2559]" role="tablist" aria-label="Chế độ xem so sánh video">
                      <button type="button" role="tab" aria-selected="true" data-ba-mode-btn="split"
                        class="ba-mode-btn active h-7 px-2.5 rounded-md text-[11px] font-bold transition cursor-pointer inline-flex items-center gap-1.5">
                        <i class="fas fa-columns text-[10px]" aria-hidden="true"></i>Song song
                      </button>
                      <button type="button" role="tab" aria-selected="false" data-ba-mode-btn="wipe"
                        class="ba-mode-btn h-7 px-2.5 rounded-md text-[11px] font-bold transition cursor-pointer inline-flex items-center gap-1.5">
                        <i class="fas fa-sliders text-[10px]" aria-hidden="true"></i>Kéo gạt
                      </button>
                    </div>
                  </div>

                  {/* Interactive Stage (Uses 2 synced <video> tags shared across both Split & Wipe modes) */}
                  <div class="ba-stage-wrap relative p-3 sm:p-3.5 bg-[#060511]">
                    <div class="ba-stage" data-ba-stage style="--ba-pos: 50%;">
                      {/* RAW (Before) Pane */}
                      <div class="ba-pane ba-pane-raw">
                        <video class="ba-video ba-vid-raw" src={p.raw_video_url!} poster={rawPoster}
                          playsinline preload="metadata" muted></video>
                        <div class="ba-badge ba-badge-raw">
                          <span class="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                          <span>RAW GỐC</span>
                        </div>
                        <span class="ba-audio-pill ba-audio-pill-raw hidden">
                          <i class="fas fa-volume-high text-[9px]" aria-hidden="true"></i>Đang nghe Raw
                        </span>
                      </div>

                      {/* Center Transformation Arrow (visible in Split mode) */}
                      <div class="ba-split-arrow" aria-hidden="true">
                        <i class="fas fa-arrow-right text-[11px]"></i>
                      </div>

                      {/* EDITED (After) Pane */}
                      <div class="ba-pane ba-pane-edited">
                        <video class="ba-video ba-vid-edited" src={p.demo_video_url!} poster={demoPoster}
                          playsinline preload="metadata"></video>
                        <div class="ba-badge ba-badge-edited">
                          <i class="fas fa-wand-magic-sparkles text-[9px]" aria-hidden="true"></i>
                          <span>SAU AI EDIT</span>
                        </div>
                        <span class="ba-audio-pill ba-audio-pill-edited">
                          <i class="fas fa-volume-high text-[9px]" aria-hidden="true"></i>-14 LUFS
                        </span>
                      </div>

                      {/* Wipe Divider & Draggable Knob (visible in Wipe mode) */}
                      <div class="ba-wipe-divider" data-ba-handle role="slider" tabindex={0}
                        aria-label="Kéo trái phải để so sánh Raw và Sau Edit" aria-valuemin={0} aria-valuemax={100} aria-valuenow={50}>
                        <div class="ba-wipe-line"></div>
                        <div class="ba-wipe-knob">
                          <i class="fas fa-arrows-left-right text-xs" aria-hidden="true"></i>
                        </div>
                      </div>

                      {/* Big Center Play Trigger (shown when paused) */}
                      <button type="button" class="ba-big-play" data-ba-bigplay aria-label="Phát đồng bộ Raw và Sau Edit">
                        <span class="ba-big-play-ring">
                          <i class="fas fa-play ml-0.5 text-lg" aria-hidden="true"></i>
                        </span>
                        <span class="ba-big-play-label">Phát đồng bộ Raw → Sau Edit</span>
                      </button>
                    </div>
                  </div>

                  {/* Unified Synced Control Dock */}
                  <div class="ba-controls px-3.5 py-3 bg-[#0c0b20] border-t border-[#221e54] space-y-2.5">
                    <div class="flex items-center gap-2.5">
                      <button type="button" class="ba-btn-play w-9 h-9 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:opacity-95 text-white grid place-items-center shrink-0 shadow-md shadow-cyan-500/20 transition cursor-pointer"
                        data-ba-play aria-label="Phát hoặc tạm dừng cả 2 video">
                        <i class="fas fa-play text-xs ml-0.5" aria-hidden="true"></i>
                      </button>

                      <div class="flex-1 min-w-0 flex items-center gap-2.5">
                        <div class="ba-seek-track flex-1 h-2 rounded-full bg-[#1b1844] relative cursor-pointer group" data-ba-seek
                          role="slider" tabindex={0} aria-label="Tua tiến độ cả 2 video" aria-valuemin={0} aria-valuemax={100} aria-valuenow={0}>
                          <div class="ba-seek-fill h-full rounded-full bg-gradient-to-r from-cyan-400 to-indigo-500 w-0 pointer-events-none"></div>
                          <div class="ba-seek-thumb absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-white shadow-md border-2 border-cyan-400 pointer-events-none" style="left:0%"></div>
                        </div>
                        <span class="ba-time text-[11px] font-mono text-[#c2c0e0] tabular-nums shrink-0" data-ba-time>00:00 / 00:00</span>
                      </div>
                    </div>

                    <div class="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                      {/* Audio source selector: Edited vs Raw vs Mute */}
                      <div class="flex items-center gap-1.5">
                        <span class="text-[10px] font-bold text-[#9492b8] uppercase tracking-wider mr-0.5">Âm thanh:</span>
                        <button type="button" data-ba-audio="edited"
                          class="ba-audio-btn active h-7 px-2.5 rounded-lg border text-[11px] font-bold transition cursor-pointer">
                          <i class="fas fa-sparkles mr-1 text-[9px]" aria-hidden="true"></i>Sau Edit
                        </button>
                        <button type="button" data-ba-audio="raw"
                          class="ba-audio-btn h-7 px-2.5 rounded-lg border text-[11px] font-bold transition cursor-pointer">
                          <i class="fas fa-microphone mr-1 text-[9px]" aria-hidden="true"></i>Raw gốc
                        </button>
                        <button type="button" data-ba-audio="mute" aria-label="Tắt tiếng"
                          class="ba-audio-btn h-7 w-7 rounded-lg border text-[11px] grid place-items-center transition cursor-pointer">
                          <i class="fas fa-volume-xmark" aria-hidden="true"></i>
                        </button>
                      </div>

                      {/* Expand Fullscreen triggers */}
                      <div class="flex items-center gap-1.5">
                        <button type="button" data-video={p.raw_video_url!} data-poster={rawPoster || ''} data-title={`${p.name} — Video Raw gốc`} data-aspect="vertical"
                          class="h-7 px-2.5 rounded-lg bg-[#161436] hover:bg-[#221e54] border border-[#2a2559] text-[#b8b6d9] hover:text-white text-[11px] font-semibold transition cursor-pointer">
                          <i class="fas fa-expand mr-1 text-[9px]" aria-hidden="true"></i>Raw lớn
                        </button>
                        <button type="button" data-video={p.demo_video_url!} data-poster={demoPoster || ''} data-title={`${p.name} — Video Sau Edit`} data-aspect="vertical"
                          class="h-7 px-2.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-200 hover:text-white text-[11px] font-bold transition cursor-pointer">
                          <i class="fas fa-expand mr-1 text-[9px]" aria-hidden="true"></i>Sau Edit lớn
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Quick Diff Highlights Strip */}
                  <div class="px-3.5 py-2.5 bg-[#09081b] border-t border-[#1e1a4a] grid grid-cols-3 gap-2 text-center">
                    {(isWalkingDepth ? [
                      ['fa-layer-group', 'Tách nền 3-Plane', 'Chữ sau lưng speaker'],
                      ['fa-chart-line', 'KPI & B-Roll Strip', '14 component GSAP'],
                      ['fa-waveform-lines', 'Audio -14 LUFS', 'Lọc giọng + SFX']
                    ] : [
                      ['fa-scissors', 'Cắt lặng & Màu da', 'Chuẩn 1/30s + Denoise'],
                      ['fa-window-restore', 'Headroom UI & PiP', 'B-roll khớp ngữ cảnh'],
                      ['fa-closed-captioning', 'Phụ đề Whisper', 'Khớp từng từ 0.01s']
                    ]).map(([ic, title, sub]) => (
                      <div class="p-2 rounded-xl bg-[#0f0e26] border border-[#221e54]">
                        <div class="text-[11px] font-bold text-cyan-300 truncate"><i class={`fas ${ic} mr-1 text-[10px]`} aria-hidden="true"></i>{title}</div>
                        <div class="text-[10px] text-[#9492b8] truncate mt-0.5">{sub}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : p.demo_video_url ? (
                <div class="adaptive-player-wrapper mx-auto mb-4 rounded-2xl overflow-hidden border-2 border-[#221e54] bg-[#070614] shadow-2xl relative aspect-video w-full"
                  data-poster={demoPoster || p.thumbnail || ''}
                  data-url={p.demo_video_url}>
                  <div class="video-ambient-bg" style={demoPoster || p.thumbnail ? `background-image:url('${demoPoster || p.thumbnail}')` : ''}></div>
                  <div class="relative z-[2] w-full h-full flex items-center justify-center">
                    {isMp4 ? (
                      <video src={p.demo_video_url} poster={demoPoster || p.thumbnail || undefined}
                        class="adaptive-demo-video w-full h-full object-contain bg-transparent" controls playsinline preload="metadata"></video>
                    ) : (
                      <iframe src={embedVideoUrl} title={`Demo ${p.name}`} class="w-full h-full border-none" allow="autoplay; encrypted-media" allowfullscreen></iframe>
                    )}
                  </div>
                  <div class="absolute top-2.5 left-2.5 z-10 pointer-events-none flex items-center gap-1.5">
                    <span class="text-[10px] font-bold text-white tracking-wider bg-black/70 backdrop-blur px-2.5 py-1 rounded-md border border-white/15">VIDEO DEMO</span>
                    <button type="button" data-video={p.demo_video_url} data-poster={demoPoster || p.thumbnail || ''} data-title={p.name} data-aspect="auto"
                      class="pointer-events-auto text-[10px] font-bold text-indigo-200 hover:text-white bg-black/70 hover:bg-indigo-600 backdrop-blur px-2.5 py-1 rounded-md border border-white/15 transition cursor-pointer" title="Mở trình phát lớn" aria-label={`Phóng to video demo ${p.name}`}>
                      <i class="fas fa-expand mr-1" aria-hidden="true"></i>Phóng to
                    </button>
                  </div>
                </div>
              ) : p.thumbnail ? (
                <div class="adaptive-thumb-wrapper mx-auto rounded-2xl overflow-hidden border border-[#221e54] bg-[#070614] aspect-video relative shadow-lg">
                  <div class="video-ambient-bg" style={`background-image:url('${p.thumbnail}')`}></div>
                  <img src={p.thumbnail} alt={p.name} class="relative z-[2] w-full h-full object-contain" />
                </div>
              ) : (
                <div class="rounded-2xl overflow-hidden border border-[#221e54] bg-[#070614] aspect-video grid place-items-center text-white/95 relative shadow-lg"
                  style={`background:${gradientFor(p.id)}`}>
                  <div class="text-center p-4">
                    <i class={`fas ${PRODUCT_TYPE_ICON[p.product_type] || 'fa-cube'} text-6xl mb-3 opacity-90`} aria-hidden="true"></i>
                    <div class="text-sm font-bold uppercase tracking-[0.2em] opacity-80">{PRODUCT_TYPE_LABEL[p.product_type]}</div>
                  </div>
                </div>
              )}

              {gallery.length > 0 && (
                <div class="grid grid-cols-4 gap-2.5 mt-3">
                  {gallery.slice(0, 8).map((g, i) => (
                    <button type="button" data-image-preview={g} data-title={`${p.name} — Ảnh ${i + 1}`}
                      aria-label={`Xem lớn ảnh ${i + 1} của ${p.name}`}
                      class="aspect-video rounded-lg border border-[#221e54] bg-[#070614] overflow-hidden cursor-pointer hover:border-indigo-400 transition">
                      <img src={g} alt={`${p.name} ảnh ${i + 1}`} loading="lazy" class="w-full h-full object-contain" />
                    </button>
                  ))}
                </div>
              )}

              {/* Specs Grid boards */}
              {mcp ? (
                <div class="grid grid-cols-2 gap-3 mt-5">
                  <div class="p-3.5 rounded-xl bg-gradient-to-br from-[#0f0e24] to-[#0b1f33] border border-cyan-500/30 flex items-center gap-3">
                    <div class="w-9 h-9 rounded-lg bg-cyan-500/15 text-cyan-300 grid place-items-center text-sm shrink-0"><i class="fas fa-plug-circle-bolt" aria-hidden="true"></i></div>
                    <div>
                      <div class="text-[10px] text-[#9492b8] uppercase font-bold tracking-wider">Giao thức</div>
                      <div class="text-xs font-bold text-white">MCP Streamable HTTP</div>
                    </div>
                  </div>
                  <div class="p-3.5 rounded-xl bg-gradient-to-br from-[#0f0e24] to-[#161436] border border-[#221e54] flex items-center gap-3">
                    <div class="w-9 h-9 rounded-lg bg-indigo-500/15 text-indigo-300 grid place-items-center text-sm shrink-0"><i class="fas fa-terminal" aria-hidden="true"></i></div>
                    <div>
                      <div class="text-[10px] text-[#9492b8] uppercase font-bold tracking-wider">AI Agent hỗ trợ</div>
                      <div class="text-xs font-bold text-white">{mcpClients.join(' · ')}</div>
                    </div>
                  </div>
                  <div class="p-3.5 rounded-xl bg-gradient-to-br from-[#0f0e24] to-[#161436] border border-[#221e54] flex items-center gap-3">
                    <div class="w-9 h-9 rounded-lg bg-emerald-500/15 text-emerald-400 grid place-items-center text-sm shrink-0"><i class="fab fa-google-drive" aria-hidden="true"></i></div>
                    <div>
                      <div class="text-[10px] text-[#9492b8] uppercase font-bold tracking-wider">Giao hàng kép</div>
                      <div class="text-xs font-bold text-white">Link Drive + Gmail + MCP Key</div>
                    </div>
                  </div>
                  <div class="p-3.5 rounded-xl bg-gradient-to-br from-[#0f0e24] to-[#161436] border border-[#221e54] flex items-center gap-3">
                    <div class="w-9 h-9 rounded-lg bg-fuchsia-500/15 text-fuchsia-300 grid place-items-center text-sm shrink-0"><i class="fas fa-arrows-rotate" aria-hidden="true"></i></div>
                    <div>
                      <div class="text-[10px] text-[#9492b8] uppercase font-bold tracking-wider">Bản quyền</div>
                      <div class="text-xs font-bold text-white">Trọn đời + Update miễn phí</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div class="grid grid-cols-2 gap-3 mt-5">
                  <div class="p-3.5 rounded-xl bg-gradient-to-br from-[#0f0e24] to-[#161436] border border-[#221e54] flex items-center gap-3">
                    <div class="w-9 h-9 rounded-lg bg-indigo-500/15 text-indigo-400 grid place-items-center text-sm shrink-0"><i class="fas fa-bolt" aria-hidden="true"></i></div>
                    <div>
                      <div class="text-[10px] text-[#9492b8] uppercase font-bold tracking-wider">Giao hàng</div>
                      <div class="text-xs font-bold text-white">Tự động 24/7</div>
                    </div>
                  </div>
                  <div class="p-3.5 rounded-xl bg-gradient-to-br from-[#0f0e24] to-[#161436] border border-[#221e54] flex items-center gap-3">
                    <div class="w-9 h-9 rounded-lg bg-emerald-500/15 text-emerald-400 grid place-items-center text-sm shrink-0"><i class="fas fa-cubes" aria-hidden="true"></i></div>
                    <div>
                      <div class="text-[10px] text-[#9492b8] uppercase font-bold tracking-wider">Nội dung</div>
                      <div class="text-xs font-bold text-white">Full tài liệu + HDSD</div>
                    </div>
                  </div>
                  <div class="p-3.5 rounded-xl bg-gradient-to-br from-[#0f0e24] to-[#161436] border border-[#221e54] flex items-center gap-3">
                    <div class="w-9 h-9 rounded-lg bg-amber-500/15 text-amber-400 grid place-items-center text-sm shrink-0"><i class="fas fa-infinity" aria-hidden="true"></i></div>
                    <div>
                      <div class="text-[10px] text-[#9492b8] uppercase font-bold tracking-wider">Truy cập</div>
                      <div class="text-xs font-bold text-white">Trọn đời + update free</div>
                    </div>
                  </div>
                  <div class="p-3.5 rounded-xl bg-gradient-to-br from-[#0f0e24] to-[#161436] border border-[#221e54] flex items-center gap-3">
                    <div class="w-9 h-9 rounded-lg bg-rose-500/15 text-rose-400 grid place-items-center text-sm shrink-0"><i class="fas fa-headset" aria-hidden="true"></i></div>
                    <div>
                      <div class="text-[10px] text-[#9492b8] uppercase font-bold tracking-wider">Hỗ trợ</div>
                      <div class="text-xs font-bold text-white">1-1 qua Zalo</div>
                    </div>
                  </div>
                </div>
              )}

              {/* MCP Quick Architecture Preview Card under video/specs */}
              {mcp && mcpPreview && (
                <div class="mt-4 p-4 rounded-2xl bg-gradient-to-br from-cyan-950/45 via-[#0f0e24] to-[#130f33] border border-cyan-500/35">
                  <div class="flex items-center justify-between gap-2 mb-2.5">
                    <div class="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                      <i class="fas fa-plug-circle-bolt" aria-hidden="true"></i>Cách hoạt động của Skill AI Agent (MCP)
                    </div>
                    <span class="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-200 text-[10px] font-mono font-bold">JSON-RPC 2.0</span>
                  </div>
                  <p class="text-xs text-[#c2c0e0] leading-relaxed mb-3">
                    Khác với Skill tự tải về đọc và làm tay: sau khi mua, bạn chỉ cần dán config MCP kèm <b>License Key</b> vào <b>{mcpClients.join(', ')}</b>. AI Agent sẽ tự gọi <b>{mcpTools.length} MCP Tools</b> dưới đây để dựng video theo đúng chuẩn Skill:
                  </p>
                  <div class="space-y-1.5">
                    {mcpTools.map(t => (
                      <div class="p-2 rounded-lg bg-[#070614]/75 border border-white/10 text-[11px] flex items-start gap-2">
                        <code class="font-mono font-bold text-cyan-300 shrink-0">{t.name}</code>
                        <span class="text-[#b8b6d9] leading-snug">— {t.description}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* COLUMN 2: Product info & Call to Action */}
            <div class="flex flex-col justify-start">
              <div class="flex flex-wrap items-center gap-2 mb-3">
                {mcp ? (
                  <span class="px-2.5 py-1 rounded bg-cyan-500/20 border border-cyan-400/40 text-cyan-200 text-xs font-bold inline-flex items-center gap-1.5">
                    <i class="fas fa-plug-circle-bolt text-[11px]" aria-hidden="true"></i>{PRODUCT_TYPE_LABEL[p.product_type]}
                  </span>
                ) : (
                  <span class="px-2.5 py-1 rounded bg-indigo-500/15 text-indigo-300 text-xs font-bold">{PRODUCT_TYPE_LABEL[p.product_type]}</span>
                )}
                {p.category_name && <a href={`/danh-muc/${p.category_slug}`} class="px-2.5 py-1 rounded bg-[#161436] border border-[#221e54] text-[#c2c0e0] text-xs font-medium hover:text-white hover:border-indigo-500/40 transition">{p.category_name}</a>}
                {comingSoon ? (
                  <span class="px-2.5 py-1 rounded bg-amber-500/20 border border-amber-500/35 text-amber-300 text-xs font-bold"><i class="fas fa-clock mr-1" aria-hidden="true"></i>CHƯA MỞ BÁN</span>
                ) : (
                  <>
                    {p.is_hot === 1 && <span class="px-2.5 py-1 rounded bg-orange-500/15 text-orange-300 text-xs font-bold"><i class="fas fa-fire mr-1" aria-hidden="true"></i>HOT</span>}
                    {p.is_new === 1 && <span class="px-2.5 py-1 rounded bg-emerald-500/15 text-emerald-300 text-xs font-bold">MỚI</span>}
                  </>
                )}
              </div>

              <h1 class="text-2xl md:text-3xl font-extrabold text-white leading-tight tracking-tight mb-3">{p.name}</h1>

              <div class="flex flex-wrap items-center gap-4 text-xs mb-4 tabular-nums">
                <a href="#reviews" class="flex items-center gap-1.5">
                  <Stars rating={p.rating} size="text-xs" />
                  <b class="text-white text-sm">{p.rating.toFixed(1)}</b>
                  <span class="text-[#b8b6d9]">({p.rating_count} đánh giá)</span>
                </a>
                <span class="text-[#2a2559]" aria-hidden="true">|</span>
                <span class="text-[#b8b6d9]"><i class="fas fa-cart-shopping mr-1 text-[#9492b8]" aria-hidden="true"></i>{p.sold_count} đã bán</span>
                <span class="text-[#2a2559]" aria-hidden="true">|</span>
                <span class="text-[#b8b6d9]"><i class="fas fa-eye mr-1 text-[#9492b8]" aria-hidden="true"></i>{p.view_count} xem</span>
              </div>

              <p class="text-[#c2c0e0] text-sm leading-relaxed mb-5">{p.short_desc}</p>

              {/* Pricing Box */}
              <div class="rounded-2xl border border-indigo-500/35 bg-gradient-to-br from-[#0f0e24] via-[#1a184c]/55 to-[#070614] p-5 mb-4 glow-brand relative overflow-hidden">
                <div class="flex items-end flex-wrap gap-3 mb-1.5 tabular-nums">
                  <span class="text-3xl md:text-4xl font-extrabold text-rose-400 leading-none">{formatVND(p.price)}</span>
                  {p.original_price && p.original_price > p.price && (
                    <>
                      <span class="text-base text-[#9492b8] line-through leading-none">{formatVND(p.original_price)}</span>
                      <span class="px-2 py-0.5 rounded bg-rose-600 text-white text-[11px] font-bold">-{off}%</span>
                    </>
                  )}
                </div>
                {save > 0 && <div class="text-xs text-emerald-400 font-bold flex items-center gap-1 tabular-nums"><i class="fas fa-piggy-bank text-sm" aria-hidden="true"></i>Tiết kiệm {formatVND(save)}</div>}
                <div class="mt-4 pt-3 border-t border-indigo-500/25 text-xs text-[#b8b6d9] flex flex-wrap gap-x-4 gap-y-1.5">
                  <span><i class="fas fa-infinity text-indigo-400 mr-1" aria-hidden="true"></i>Sở hữu trọn đời</span>
                  <span><i class="fas fa-bolt text-indigo-400 mr-1" aria-hidden="true"></i>Giao tự động</span>
                  <span><i class="fas fa-rotate-left text-indigo-400 mr-1" aria-hidden="true"></i>Hoàn tiền 7 ngày</span>
                </div>
              </div>

              {comingSoon ? (
                <div class="mb-5 bg-amber-500/10 border border-amber-500/35 p-4 rounded-xl">
                  <div class="text-sm font-bold text-amber-300 flex items-center gap-2 mb-1">
                    <i class="fas fa-clock" aria-hidden="true"></i>Sản phẩm hiện đang ở trạng thái Chưa mở bán
                  </div>
                  <p class="text-xs text-amber-200/85 leading-relaxed">
                    Hiện tại hệ thống đang ưu tiên mở bán dòng Skill AI (tự tải) &amp; Skill AI Agent (MCP). Hãy nhắn Zalo hoặc quay lại sau để cập nhật ngày phát hành chính thức.
                  </p>
                </div>
              ) : mcp ? (
                <div class="mb-5 bg-cyan-500/10 border border-cyan-400/30 p-4 rounded-xl flex items-center justify-between gap-3">
                  <div class="text-xs text-cyan-100 flex items-center gap-2.5">
                    <i class="fas fa-plug-circle-bolt text-cyan-300 shrink-0" aria-hidden="true"></i>
                    <span>Thanh toán VietQR tự động 24/7 — nhận ngay <b>MCP Endpoint + License Key + Config copy</b> cho <b>{mcpClients.join(', ')}</b>.</span>
                  </div>
                  <span class="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-[11px] font-bold shrink-0">MCP Live</span>
                </div>
              ) : (
                <div class="mb-5 bg-indigo-500/10 border border-indigo-500/25 p-4 rounded-xl flex items-center justify-between gap-3">
                  <div class="text-xs text-indigo-200 flex items-center gap-2">
                    <i class="fas fa-bolt text-emerald-400" aria-hidden="true"></i>
                    <span>Thanh toán VietQR tự động 24/7 — nhận link tải Skill ngay lập tức.</span>
                  </div>
                  <span class="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[11px] font-bold shrink-0">Còn hàng</span>
                </div>
              )}

              {owned ? (
                <div class="rounded-2xl bg-emerald-500/10 border border-emerald-500/25 p-5 mb-4">
                  <div class="flex items-center gap-2.5 text-emerald-400 font-bold mb-2">
                    <i class="fas fa-circle-check text-lg" aria-hidden="true"></i>Bạn đã sở hữu sản phẩm này
                  </div>
                  <p class="text-xs text-emerald-200/85 mb-3.5 leading-relaxed">
                    {mcp
                      ? 'Mở khu vực tài khoản để copy cấu hình MCP cho Claude, Codex, Antigravity cùng License Key riêng và kiểm tra kết nối trực tiếp.'
                      : 'Truy cập link tải sản phẩm và tài liệu hướng dẫn trong khu vực tài khoản của bạn.'}
                  </p>
                  <a href="/tai-khoan/san-pham" class="inline-flex items-center gap-2 h-11 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition">
                    <i class={`fas ${mcp ? 'fa-plug-circle-bolt' : 'fa-download'}`} aria-hidden="true"></i>{mcp ? 'Lấy cấu hình MCP & License Key' : 'Truy cập sản phẩm'}
                  </a>
                </div>
              ) : comingSoon ? (
                <div class="flex flex-col gap-2.5 mb-4">
                  <button type="button" disabled class="w-full h-12 rounded-xl bg-[#161436] border border-[#2a2559] text-amber-300 font-bold text-sm cursor-not-allowed">
                    <i class="fas fa-clock mr-1.5" aria-hidden="true"></i>Tạm thời chưa mở bán
                  </button>
                  <div class="grid sm:grid-cols-2 gap-2.5">
                    <a href={`https://zalo.me/${settings?.zalo || ''}`} target="_blank" rel="noopener"
                      class="flex items-center justify-center gap-2 h-11 rounded-xl bg-[#0068ff] hover:bg-blue-600 text-white font-bold text-xs transition">
                      <i class="fas fa-bell" aria-hidden="true"></i>Nhắn Zalo nhận lịch mở bán
                    </a>
                    <a href="/san-pham"
                      class="flex items-center justify-center gap-2 h-11 rounded-xl border border-indigo-500/35 bg-indigo-500/15 text-indigo-200 hover:bg-indigo-500/25 font-bold text-xs transition">
                      <i class="fas fa-wand-magic-sparkles" aria-hidden="true"></i>Xem Skill đang mở bán
                    </a>
                  </div>
                </div>
              ) : (
                <div class="flex flex-col gap-2.5 mb-4">
                  <div class="flex flex-wrap gap-2.5">
                    <button type="button" class="btn-buy-now flex-1 min-w-[150px] h-12 rounded-xl bg-gradient-to-r from-rose-500 to-orange-500 text-white font-bold hover:opacity-95 transition shadow-lg shadow-rose-500/15 cursor-pointer" data-id={p.id}>
                      <i class="fas fa-bolt mr-1.5" aria-hidden="true"></i>Mua ngay
                    </button>
                    <button type="button" class="btn-add-cart flex-1 min-w-[150px] h-12 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition shadow-md shadow-indigo-600/20 cursor-pointer" data-id={p.id} data-name={p.name}>
                      <i class="fas fa-cart-plus mr-1.5" aria-hidden="true"></i>Thêm vào giỏ
                    </button>
                    <button type="button" aria-label={inWishlist ? 'Bỏ khỏi yêu thích' : 'Thêm vào yêu thích'}
                      class={`btn-wishlist w-12 h-12 rounded-xl border border-[#221e54] hover:border-rose-400 transition flex items-center justify-center cursor-pointer ${inWishlist ? 'text-rose-400 bg-rose-500/15' : 'text-[#c2c0e0] bg-white/5'}`}
                      data-id={p.id} title="Yêu thích">
                      <i class={`${inWishlist ? 'fas' : 'far'} fa-heart`} aria-hidden="true"></i>
                    </button>
                  </div>

                  {/* Zalo Consultant CTA Button */}
                  <a href={`https://zalo.me/${settings?.zalo}`} target="_blank" rel="noopener"
                    class="flex items-center justify-center gap-2 w-full h-12 rounded-xl border border-indigo-500/35 bg-indigo-500/15 text-indigo-200 font-bold text-xs hover:bg-indigo-500/25 hover:text-white transition duration-200">
                    <i class="fas fa-comment-dots text-sm" aria-hidden="true"></i>Liên hệ tư vấn Zalo nhận khuyến mãi thêm
                  </a>
                </div>
              )}

              {p.demo_url && (
                <a href={p.demo_url} target="_blank" rel="noopener"
                  class="flex items-center justify-center gap-2 w-full h-11 rounded-xl border border-[#221e54] hover:border-indigo-400 text-indigo-300 hover:text-white hover:bg-[#161436] font-semibold text-xs transition mb-5">
                  <i class="fas fa-arrow-up-right-from-square" aria-hidden="true"></i>Xem demo trực tiếp
                </a>
              )}

              {features.length > 0 && (
                <div class="bg-[#0f0e24] rounded-2xl border border-[#221e54] p-5 mb-4">
                  <h3 class="font-bold text-white mb-3 text-xs uppercase tracking-wider">Bạn nhận được</h3>
                  <ul class="space-y-2">
                    {features.map(f => (
                      <li class="flex gap-2.5 text-xs text-[#d6d4ee]">
                        <i class="fas fa-circle-check text-emerald-400 mt-0.5 shrink-0" aria-hidden="true"></i><span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {tech.length > 0 && (
                <div class="bg-[#0f0e24] rounded-2xl border border-[#221e54] p-5">
                  <h3 class="font-bold text-white mb-3 text-xs uppercase tracking-wider">Công nghệ sử dụng</h3>
                  <div class="flex flex-wrap gap-1.5">
                    {tech.map(t => <span class="px-2.5 py-1 rounded-lg bg-[#161436] text-[#f4f4fc] text-[11px] font-bold border border-[#2a2559]">{t}</span>)}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Combo contents */}
      {comboItems.length > 0 && (
        <section class="max-w-7xl mx-auto px-4 py-10">
          <SectionTitle title="Combo này bao gồm" subtitle={`${comboItems.length} sản phẩm — mua lẻ tốn ${formatVND(comboItems.reduce((s, i) => s + i.price, 0))}`} />
          <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {comboItems.map(i => <ProductCard p={i} compact />)}
          </div>
        </section>
      )}

      {/* Description + Reviews */}
      <div class="max-w-7xl mx-auto px-4 py-10">
        <div class="grid lg:grid-cols-[1fr_320px] gap-8">
          <div>
            <div role="tablist" aria-label="Thông tin chi tiết sản phẩm" class="flex items-center gap-1.5 border-b border-[#221e54] mb-6 overflow-x-auto pb-2">
              <button type="button" role="tab" aria-selected="true" aria-controls="panel-desc" id="tab-desc"
                class="tab-btn active px-4 py-2.5 rounded-xl border border-transparent text-sm font-bold text-[#c2c0e0] whitespace-nowrap cursor-pointer" data-tab="desc" data-group="pd">
                <i class="fas fa-file-lines mr-1.5" aria-hidden="true"></i>Mô tả chi tiết
              </button>
              {mcp && (
                <button type="button" role="tab" aria-selected="false" aria-controls="panel-mcp" id="tab-mcp"
                  class="tab-btn px-4 py-2.5 rounded-xl border border-transparent text-sm font-bold text-cyan-300 whitespace-nowrap cursor-pointer" data-tab="mcp" data-group="pd">
                  <i class="fas fa-plug-circle-bolt mr-1.5" aria-hidden="true"></i>Kết nối MCP (Claude / Codex / Antigravity)
                </button>
              )}
              <button type="button" role="tab" aria-selected="false" aria-controls="panel-rev" id="tab-rev"
                class="tab-btn px-4 py-2.5 rounded-xl border border-transparent text-sm font-bold text-[#c2c0e0] whitespace-nowrap cursor-pointer" data-tab="rev" data-group="pd">
                <i class="fas fa-star mr-1.5" aria-hidden="true"></i>Đánh giá ({p.rating_count})
              </button>
              <button type="button" role="tab" aria-selected="false" aria-controls="panel-policy" id="tab-policy"
                class="tab-btn px-4 py-2.5 rounded-xl border border-transparent text-sm font-bold text-[#c2c0e0] whitespace-nowrap cursor-pointer" data-tab="policy" data-group="pd">
                <i class="fas fa-shield-halved mr-1.5" aria-hidden="true"></i>Chính sách
              </button>
            </div>

            <div role="tabpanel" id="panel-desc" aria-labelledby="tab-desc" class="tab-panel bg-[#0f0e24] rounded-2xl border border-[#221e54] p-6 md:p-8" data-tab="desc" data-group="pd">
              <div class="prose-vn max-w-none" dangerouslySetInnerHTML={{ __html: p.description || '<p>Đang cập nhật mô tả.</p>' }}></div>
            </div>

            {mcp && mcpPreview && (
              <div role="tabpanel" id="panel-mcp" aria-labelledby="tab-mcp" class="tab-panel hidden bg-[#0f0e24] rounded-2xl border border-cyan-500/35 p-6 md:p-8 space-y-5" data-tab="mcp" data-group="pd">
                <div>
                  <h3 class="text-lg font-extrabold text-white mb-2 flex items-center gap-2">
                    <i class="fas fa-plug-circle-bolt text-cyan-400" aria-hidden="true"></i>Xem trước cấu hình kết nối MCP
                  </h3>
                  <p class="text-sm text-[#c2c0e0] leading-relaxed">
                    Ngay sau khi thanh toán, hệ thống tự động gửi về <b>Gmail của bạn</b> và mở trong mục <a href="/tai-khoan/san-pham" class="text-cyan-300 underline font-semibold">Sản phẩm của tôi</a> cả <b>2 kênh sử dụng</b>: (1) <b>Link Google Drive tải trọn bộ Skill Kit</b> (starter template, scripts Python/Node, SFX, fonts &amp; video demo 1080p gốc) để giải nén vào thư mục skills của AI Agent; (2) <b>License Key + cấu hình MCP copy-paste 1 click</b> cho Claude, Codex, Antigravity.
                  </p>
                </div>

                <div class="p-3.5 rounded-xl bg-[#070614] border border-[#221e54] text-xs flex flex-wrap items-center justify-between gap-2">
                  <span class="text-[#9492b8] font-semibold">MCP Server Endpoint:</span>
                  <code class="font-mono text-cyan-300 break-all">{mcpPreview.endpointUrl}</code>
                </div>

                <div class="grid md:grid-cols-3 gap-4">
                  <div class="p-4 rounded-xl bg-[#09081b] border border-[#242054]">
                    <div class="font-bold text-white text-xs mb-2 flex items-center gap-1.5">
                      <span class="w-2 h-2 rounded-full bg-orange-400"></span>Claude Code / Desktop
                    </div>
                    <pre class="text-[11px] font-mono text-[#c2c0e0] overflow-x-auto leading-relaxed whitespace-pre-wrap break-all">{mcpPreview.claudeJson}</pre>
                  </div>
                  <div class="p-4 rounded-xl bg-[#09081b] border border-[#242054]">
                    <div class="font-bold text-white text-xs mb-2 flex items-center gap-1.5">
                      <span class="w-2 h-2 rounded-full bg-emerald-400"></span>OpenAI Codex
                    </div>
                    <pre class="text-[11px] font-mono text-[#c2c0e0] overflow-x-auto leading-relaxed whitespace-pre-wrap break-all">{mcpPreview.codexToml}</pre>
                  </div>
                  <div class="p-4 rounded-xl bg-[#09081b] border border-[#242054]">
                    <div class="font-bold text-white text-xs mb-2 flex items-center gap-1.5">
                      <span class="w-2 h-2 rounded-full bg-violet-400"></span>Antigravity
                    </div>
                    <pre class="text-[11px] font-mono text-[#c2c0e0] overflow-x-auto leading-relaxed whitespace-pre-wrap break-all">{mcpPreview.antigravityJson}</pre>
                  </div>
                </div>

                <div class="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-xs text-cyan-100 leading-relaxed">
                  <i class="fas fa-sparkles text-cyan-300 mr-1.5" aria-hidden="true"></i>
                  <b>Câu lệnh gọi mẫu trong AI Agent:</b> <span class="font-mono text-white">"{mcpPreview.samplePrompt}"</span>
                </div>
              </div>
            )}

            <div role="tabpanel" id="panel-rev" aria-labelledby="tab-rev" class="tab-panel hidden" data-tab="rev" data-group="pd">
              <div id="reviews" class="bg-[#0f0e24] rounded-2xl border border-[#221e54] p-6 mb-5">
                <div class="grid sm:grid-cols-[180px_1fr] gap-7 items-center">
                  <div class="text-center">
                    <div class="text-5xl font-extrabold text-white tabular-nums">{p.rating.toFixed(1)}</div>
                    <div class="my-2"><Stars rating={p.rating} size="text-base" /></div>
                    <div class="text-xs text-[#9492b8] tabular-nums">{p.rating_count} đánh giá</div>
                  </div>
                  <div class="space-y-1.5">
                    {[5, 4, 3, 2, 1].map(star => {
                      const cnt = ratingBreakdown[star] || 0
                      const totalR = Object.values(ratingBreakdown).reduce((a, b) => a + b, 0) || 1
                      const pct = Math.round((cnt / totalR) * 100)
                      return (
                        <div class="flex items-center gap-2.5 text-xs tabular-nums">
                          <span class="w-10 text-[#b8b6d9] shrink-0">{star} <i class="fas fa-star text-amber-400" aria-hidden="true"></i></span>
                          <div class="flex-1 h-2 rounded-full bg-[#161436] overflow-hidden">
                            <div class="h-full bg-amber-400 rounded-full" style={`width:${pct}%`}></div>
                          </div>
                          <span class="w-8 text-right text-[#b8b6d9]">{cnt}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              {canReview && (
                <form action="/api/reviews" method="post" data-ajax data-reload="true" class="bg-[#0f0e24] rounded-2xl border border-[#221e54] p-6 mb-5">
                  <h3 class="font-bold text-white mb-4">Viết đánh giá của bạn</h3>
                  <input type="hidden" name="product_id" value={p.id} />
                  <div class="mb-4">
                    <label for="review-rating" class="block text-xs font-semibold text-[#c2c0e0] mb-2">Số sao</label>
                    <select id="review-rating" name="rating" class="h-10 px-3 rounded-lg border border-[#2a2559] bg-[#161436] text-white outline-none focus:border-indigo-500 text-xs">
                      {[5, 4, 3, 2, 1].map(s => <option value={s}>{s} sao</option>)}
                    </select>
                  </div>
                  <div class="mb-4">
                    <label for="review-comment" class="block text-xs font-semibold text-[#c2c0e0] mb-2">Nhận xét</label>
                    <textarea id="review-comment" name="comment" rows={4} required placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm này..."
                      class="w-full p-3 rounded-lg border border-[#2a2559] bg-[#161436] text-white outline-none focus:border-indigo-500 text-xs resize-y"></textarea>
                  </div>
                  <div class="form-error hidden text-xs text-rose-400 mb-3" role="alert"></div>
                  <button type="submit" class="h-10 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition shadow-md shadow-indigo-600/15 cursor-pointer">Gửi đánh giá</button>
                </form>
              )}
              {!user && (
                <div class="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5 mb-5 text-xs text-amber-200">
                  <i class="fas fa-circle-info mr-1.5" aria-hidden="true"></i>
                  <a href="/dang-nhap" class="font-bold underline">Đăng nhập</a> và mua sản phẩm để viết đánh giá.
                </div>
              )}

              <div class="space-y-3">
                {reviews.length === 0 && <div class="bg-[#0f0e24] rounded-2xl border border-[#221e54] p-10 text-center text-[#9492b8] text-xs">Chưa có đánh giá nào. Hãy là người đầu tiên!</div>}
                {reviews.map(r => (
                  <div class="bg-[#0f0e24] rounded-2xl border border-[#221e54] p-5">
                    <div class="flex items-start gap-3">
                      <div class="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white grid place-items-center font-bold text-xs shrink-0">
                        {(r.full_name || 'K').charAt(0).toUpperCase()}
                      </div>
                      <div class="flex-1 min-w-0">
                        <div class="flex flex-wrap items-center gap-2 mb-1">
                          <b class="text-xs text-white">{r.full_name}</b>
                          <span class="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">Đã mua</span>
                          <span class="text-[11px] text-[#9492b8] ml-auto">{formatDate(r.created_at)}</span>
                        </div>
                        <Stars rating={r.rating} />
                        <p class="text-xs text-[#c2c0e0] mt-2 leading-relaxed">{r.comment}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div role="tabpanel" id="panel-policy" aria-labelledby="tab-policy" class="tab-panel hidden bg-[#0f0e24] rounded-2xl border border-[#221e54] p-6 md:p-8" data-tab="policy" data-group="pd">
              <div class="prose-vn max-w-none">
                <h3>Chính sách giao hàng</h3>
                <p>Sản phẩm số được giao <b>tự động 100%</b>. Ngay sau khi đơn hàng chuyển sang trạng thái "Đã thanh toán", link tải sản phẩm và tài liệu hướng dẫn sẽ xuất hiện trong mục <b>Tài khoản → Sản phẩm của tôi</b>.</p>
                <h3>Chính sách bảo hành</h3>
                <ul>
                  <li>Hỗ trợ kỹ thuật miễn phí 6-12 tháng tuỳ sản phẩm</li>
                  <li>Nhận bản cập nhật miễn phí trọn đời</li>
                  <li>Hỗ trợ cài đặt qua Zalo/Ultraview khi cần</li>
                </ul>
                <h3>Chính sách hoàn tiền</h3>
                <p>Hoàn tiền <b>100%</b> trong vòng <b>7 ngày</b> nếu sản phẩm không đúng như mô tả hoặc không thể cài đặt được do lỗi từ phía chúng tôi.</p>
                <h3>Bản quyền sử dụng</h3>
                <ul>
                  <li>Được dùng cho kênh cá nhân và kênh bán hàng của bạn không giới hạn</li>
                  <li>Được tuỳ biến prompt, kịch bản và quy trình theo ngách riêng</li>
                  <li>Không được chia sẻ công khai hoặc bán lại nguyên bản bộ Skill cho bên thứ ba</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Sticky sidebar */}
          <aside class="space-y-4 lg:sticky-side">
            <div class="bg-[#0f0e24] rounded-2xl border border-[#221e54] p-5">
              <h3 class="font-bold text-white mb-3.5 text-xs uppercase tracking-wider">Cam kết của chúng tôi</h3>
              <ul class="space-y-3 text-xs">
                {[
                  ['fa-bolt', 'Giao hàng tự động 24/7'],
                  ['fa-infinity', 'Sở hữu trọn đời, update free'],
                  ['fa-headset', 'Hỗ trợ kỹ thuật 1-1 qua Zalo'],
                  ['fa-shield-halved', 'Hoàn tiền 100% trong 7 ngày'],
                  ['fa-lock', 'Thanh toán an toàn qua VietQR']
                ].map(([ic, t]) => (
                  <li class="flex gap-2.5 text-[#c2c0e0]">
                    <i class={`fas ${ic} text-indigo-400 mt-0.5 w-4`} aria-hidden="true"></i><span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div class="bg-[#0f0e24] rounded-2xl p-5 text-white border border-[#221e54]">
              <h3 class="font-bold mb-1.5 text-xs uppercase tracking-wider text-white">Cần tư vấn thêm?</h3>
              <p class="text-xs text-[#9492b8] mb-4 leading-relaxed">Đội ngũ hỗ trợ sẵn sàng giải đáp mọi thắc mắc của bạn 24/7.</p>
              <a href={`https://zalo.me/${settings?.zalo}`} target="_blank" rel="noopener"
                class="flex items-center justify-center gap-2 w-full h-10 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-xs transition mb-2">
                Chat Zalo ngay
              </a>
              <a href={`tel:${(settings?.hotline || '').replace(/\s/g, '')}`}
                class="flex items-center justify-center gap-2 w-full h-10 rounded-xl bg-[#161436] border border-[#2a2559] text-white font-bold text-xs hover:bg-white/10 transition tabular-nums">
                <i class="fas fa-phone" aria-hidden="true"></i>{settings?.hotline}
              </a>
            </div>
          </aside>
        </div>
      </div>

      {related.length > 0 && (
        <section class="max-w-7xl mx-auto px-4 py-10">
          <SectionTitle title="Sản phẩm liên quan" subtitle="Có thể bạn cũng quan tâm" />
          <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {related.map(r => <ProductCard p={r} />)}
          </div>
        </section>
      )}

      {/* Mobile Sticky Bottom Purchase Bar */}
      {!owned && !comingSoon && (
        <div class="lg:hidden fixed inset-x-0 bottom-0 z-40 bg-[#0f0e24]/95 backdrop-blur-md border-t border-indigo-500/30 px-4 py-2.5 flex items-center justify-between gap-3 shadow-2xl">
          <div class="min-w-0">
            <div class="text-[11px] text-[#9492b8] truncate">{p.name}</div>
            <div class="flex items-baseline gap-2 tabular-nums">
              <span class="text-base font-extrabold text-rose-400">{formatVND(p.price)}</span>
              {p.original_price && p.original_price > p.price && (
                <span class="text-[11px] text-[#9492b8] line-through">{formatVND(p.original_price)}</span>
              )}
            </div>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <button type="button" class="btn-add-cart w-11 h-11 rounded-xl bg-[#161436] border border-[#2a2559] text-indigo-300 grid place-items-center cursor-pointer"
              data-id={p.id} data-name={p.name} aria-label="Thêm vào giỏ hàng">
              <i class="fas fa-cart-plus" aria-hidden="true"></i>
            </button>
            <button type="button" class="btn-buy-now h-11 px-4 rounded-xl bg-gradient-to-r from-rose-500 to-orange-500 text-white font-bold text-xs shadow-lg cursor-pointer" data-id={p.id}>
              <i class="fas fa-bolt mr-1" aria-hidden="true"></i>Mua ngay
            </button>
          </div>
        </div>
      )}
    </Layout>
  )
}
