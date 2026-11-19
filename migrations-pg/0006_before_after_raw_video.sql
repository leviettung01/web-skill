-- ============================================
-- Migration 0006: Add raw_video_url for Before/After (Raw vs Edited) Talking Head comparison UI
-- ============================================
ALTER TABLE products ADD COLUMN IF NOT EXISTS raw_video_url TEXT;

UPDATE products SET raw_video_url='/static/demos/raw-video-talking-head.mp4', file_size='16.7 MB Kit + MCP', mcp_skill_prompt='---
name: viral-talking-head
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

Let `$SKILL_DIR` point to this skill folder (`viral-talking-head`). Always copy `$SKILL_DIR\template` into a new project folder (never edit `template\` originals directly):

```powershell
$SKILL_DIR = "<path-to-viral-talking-head>"
$SCRIPTS   = "$SKILL_DIR\scripts"
$PROJ      = "./projects/<slug>"
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

**Final Visual Sign-off:** Inspect `$PROJ\out\final.qa.jpg` via `read_file` across all 20 frames. Only hand over the final MP4 after confirming `black_segments: []`, `-14 ± 0.5 LUFS` audio master, crisp lip-synced captions, clean PiP geometry, and zero overlapping UI elements.' WHERE slug='video-talking-head';
UPDATE products SET raw_video_url='/static/demos/raw-viral-talking-head-video-edit.mp4' WHERE slug='viral-talking-head-video-edit';

INSERT INTO settings (key, value) VALUES ('mcp_migration_0006_done', '1') ON CONFLICT (key) DO UPDATE SET value='1';
