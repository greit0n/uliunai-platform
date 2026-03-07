# KF1 AI Texture Upscale — HD Texture Pack Plan

## Goal

Use AI to upscale and enhance every texture in Killing Floor 1 — weapons, monsters, maps, everything — creating a 4K Ultra HD texture rework. Deliver as a drop-in texture pack mod.

## What You Get (DX9 vs DX12)

The HD texture pack works on the **stock DX9 renderer** — no custom renderer needed.
Upscaled diffuse textures are just higher-resolution images; the engine loads them the same way.

| Improvement | Stock DX9 | Custom DX12 Renderer |
|-------------|-----------|---------------------|
| 4x sharper weapon skins (scratches, grain, detail) | YES | YES |
| 4x sharper monster skins (veins, pores, decay) | YES | YES |
| 4x sharper map textures (cracks, mortar, wear) | YES | YES |
| Detailed gore/effects | YES | YES |
| Physical depth on surfaces (parallax — bricks pop out) | no | YES (needs height maps) |
| Realistic light response (shiny metal vs matte wood) | no | YES (needs roughness maps) |
| Surface self-shadowing in crevices | no | YES (needs AO maps) |
| Detailed bump/surface geometry | basic only | YES (needs normal maps) |

**In short:** Phases 1-5 of this plan give you a massive visual upgrade on stock KF1 right now.
Phase 6 (PBR material maps) is a bonus that only kicks in once the DX12 renderer exists.
The upscaling work is done once and benefits both.

## Strategy: Proof of Concept First

Before bulk-processing thousands of textures, prove the full pipeline works end-to-end with:
- **1 weapon:** Shotgun (iconic KF1 weapon, visible up close, easy to evaluate)
- **1 monster:** Clot (most common enemy, players see it constantly)
- **1 map:** KF-BioticsLab (small, stock map, everyone knows it)

If these three look good in-game, scale to everything.

---

## Phase 0: Setup & Tooling

### 0.1 — Install Required Tools

**Texture Extraction:**
- **UE Viewer (umodel)** by Gildor — https://www.gildor.org/en/projects/umodel
  - The standard tool for extracting assets from UE1/2/3/4 packages
  - Exports textures to PNG/TGA, meshes to glTF/PSK
  - Supports batch export of entire packages
  - Works with KF1's .u, .utx, .ukx, .usx, .rom files

**AI Upscaling:**
- **Real-ESRGAN** — https://github.com/xinntao/Real-ESRGAN
  - `pip install realesrgan`
  - Pre-trained models: `RealESRGAN_x4plus` (general), `RealESRNet_x4plus` (less artifact)
  - Game-specific models available from community (search "ESRGAN game texture model")
- **ESRGAN with custom models** — https://github.com/joeyballentine/ESRGAN
  - Supports loading community-trained .pth models
  - Models specifically trained on game textures produce best results
  - Good models: `4x_FatalPixels`, `4x_Fatality`, `4xGameTextures` (search upscale.wiki)
- **Topaz Gigapixel AI** (commercial alternative, $99, very easy to use)

**AI Material Generation (optional but recommended):**
- **DeepBump** — https://github.com/HugoTini/DeepBump
  - Generates normal maps from diffuse textures using neural network
  - Free, runs locally
- **Materialize** — http://www.boundingboxsoftware.com/materialize/
  - Generates height, normal, metallic, roughness, AO maps from a single diffuse
  - GUI-based, free
- **Stable Diffusion + ControlNet** (for creative rework of organic textures)

**Texture Repacking:**
- **UE Explorer** or **UTPT** — repack textures into .utx packages
- **UnrealEd (KF1's editor)** — can import textures into packages natively
  - Comes with KF1 (launch from Steam Tools)
  - Most reliable way to create .utx packages KF1 will load

### 0.2 — Locate KF1 Asset Packages

KF1 install path (typical): `D:\SteamLibrary\steamapps\common\KillingFloor\`

```
Key packages for the proof of concept:

Weapons (in System/ or Animations/):
├── KFMod.u                    — Weapon code + some textures
├── KF_Weapons_Trip.utx        — Weapon textures (shotgun, etc.)
├── KF_Weapons2_Trip.utx       — More weapon textures
└── KF_Weapons3rd_Trip.utx     — Third-person weapon models/textures

Monsters (in System/ or Textures/):
├── KFCharacters.utx           — Monster textures (Clot, Gorefast, etc.)
├── KFMod.u                    — Monster code + some embedded textures
└── KF_Specimens_Trip.utx      — Specimen/monster textures

Maps:
├── Maps/KF-BioticsLab.rom     — Map + embedded textures
├── Textures/*.utx             — Shared world textures
├── KF_generic_textures.utx    — Common wall/floor/ceiling textures
├── KF_gore_Trip.utx           — Blood/gore textures
└── Various .utx files         — Material-specific texture packages
```

**NOTE:** Exact file names may vary by KF1 version. Use umodel to browse and identify the right packages.

### 0.3 — Understand Texture Characteristics

Before upscaling, catalog what you're working with:

| Category | Typical Resolution | Format | Notes |
|----------|-------------------|--------|-------|
| Weapon diffuse | 256x256 – 512x512 | DXT1/DXT5 | View model (1st person), most detail needed |
| Weapon 3rd person | 128x128 – 256x256 | DXT1 | Seen at distance, lower priority |
| Monster body | 256x256 – 512x512 | DXT1/DXT5 | Multiple body parts, need consistency |
| Monster face | 256x256 | DXT1 | Critical for recognition |
| Map walls/floors | 128x128 – 512x512 | DXT1 | Must tile seamlessly |
| Map props | 128x128 – 256x256 | DXT1/DXT5 | Objects, furniture, etc. |
| Decals/effects | 64x64 – 256x256 | DXT5 | Blood splatters, bullet holes |
| Skybox | 512x512 – 1024x1024 | DXT1 | 6 faces of cubemap |

---

## Phase 1: Extract — Proof of Concept Assets

### 1.1 — Extract Shotgun Textures

```bash
# Use umodel to browse the weapon packages and find shotgun textures
umodel.exe -path="D:/SteamLibrary/steamapps/common/KillingFloor" -game=kf KF_Weapons_Trip.utx

# In umodel GUI:
# 1. Browse to find Shotgun-related textures (diffuse, normal if any, spec)
# 2. Export selected textures as PNG
# Alternative: batch export entire package
umodel.exe -export -png -path="D:/SteamLibrary/steamapps/common/KillingFloor" KF_Weapons_Trip.utx
```

Expected output: Several PNG files for the shotgun — diffuse texture, possibly a simple specular or detail texture.

**Organize extracted files:**
```
kf1/tools/texture-upscale/
├── original/
│   ├── weapons/
│   │   └── shotgun/           — extracted PNGs
│   ├── monsters/
│   │   └── clot/              — extracted PNGs
│   └── maps/
│       └── bioticslab/        — extracted PNGs
├── upscaled/
│   ├── weapons/
│   ├── monsters/
│   └── maps/
├── materials/                 — generated normal/height/roughness maps
└── output/                    — final .utx packages for game
```

### 1.2 — Extract Clot Textures

```bash
# Browse monster texture packages
umodel.exe -path="D:/SteamLibrary/steamapps/common/KillingFloor" -game=kf KFCharacters.utx

# Look for Clot-related textures:
# - Body diffuse (greenish skin)
# - Face/head texture
# - Possibly shared textures with other specimens
```

**Important:** Monsters often share texture atlases. The Clot's body texture might be on the same sheet as other specimens. If so, you must upscale the entire atlas to avoid misaligned UV mapping.

### 1.3 — Extract BioticsLab Map Textures

```bash
# Export all textures embedded in the map
umodel.exe -export -png -path="D:/SteamLibrary/steamapps/common/KillingFloor" KF-BioticsLab.rom

# Also export shared texture packages the map references
umodel.exe -export -png -path="D:/SteamLibrary/steamapps/common/KillingFloor" KF_generic_textures.utx
```

**Tiling textures (walls, floors):** These are designed to tile seamlessly. After upscaling, you MUST verify they still tile. AI upscalers can break tiling at edges.

---

## Phase 2: Upscale — AI Processing

### 2.1 — AI Upscale Diffuse Textures (4x)

**Target resolutions:**
| Original | Upscaled (4x) | Use case |
|----------|---------------|----------|
| 128x128 | 512x512 | Small props, 3rd person models |
| 256x256 | 1024x1024 | Standard textures |
| 512x512 | 2048x2048 | Weapon viewmodels, hero textures |
| 1024x1024 | 4096x4096 | Skyboxes, large surfaces |

**Using Real-ESRGAN (batch):**
```bash
# Upscale all textures in a folder 4x
python -m realesrgan -i original/weapons/shotgun/ -o upscaled/weapons/shotgun/ -n RealESRGAN_x4plus -s 4

# For game textures, the "net" model sometimes preserves detail better:
python -m realesrgan -i original/ -o upscaled/ -n RealESRNet_x4plus -s 4
```

**Using ESRGAN with game-specific models (recommended):**
```bash
# Download a game texture model (e.g., 4x_FatalPixels.pth)
# Place in ESRGAN/models/
python test.py --model models/4x_FatalPixels.pth --input original/weapons/shotgun/ --output upscaled/weapons/shotgun/
```

**Compare models:** Run the same texture through 2-3 different models and compare. Different models handle different content better:
- `RealESRGAN_x4plus` — good all-rounder, can over-smooth
- `4x_FatalPixels` — trained on game textures, preserves pixel art feel
- `4x_Fatality` — good detail generation, slightly noisy
- `RealESRNet_x4plus` — less hallucination, more faithful

### 2.2 — Fix Tiling After Upscale (Map Textures)

AI upscalers break seamless tiling. Fix approaches:

**Option A — Tile before upscaling:**
```python
# Tile the texture 3x3, upscale the tiled version, then crop center tile
from PIL import Image

img = Image.open("floor_tile.png")
w, h = img.size
tiled = Image.new("RGB", (w * 3, h * 3))
for x in range(3):
    for y in range(3):
        tiled.paste(img, (x * w, y * h))
tiled.save("floor_tile_tiled.png")

# After upscaling the tiled version:
upscaled = Image.open("floor_tile_tiled_upscaled.png")
uw, uh = upscaled.size
center = upscaled.crop((uw // 3, uh // 3, 2 * uw // 3, 2 * uh // 3))
center.save("floor_tile_final.png")
```

**Option B — Use a seamless-aware upscaler:**
- Some ESRGAN forks have `--seamless` flags
- Or use Photoshop/GIMP to manually fix tile edges after upscaling

### 2.3 — Fallback: Stable Diffusion img2img

If ESRGAN results look too smooth, plastic, or lack detail for certain textures, use **Stable Diffusion img2img** as a fallback. SD doesn't just upscale — it can reimagine and add plausible detail that ESRGAN can't.

**Best for:** Organic textures (monster skin, flora, grass, dirt, wood, gore), surfaces where you want the AI to invent detail rather than just sharpen pixels.

**Setup:**
- Install AUTOMATIC1111 WebUI: https://github.com/AUTOMATIC1111/stable-diffusion-webui
- Or ComfyUI: https://github.com/comfyanonymous/ComfyUI
- Use a realistic model (e.g., Juggernaut XL, RealVisXL, or SDXL base)

**Workflow:**
```
1. Load the ESRGAN-upscaled texture (or original) into img2img
2. Set denoising strength:
   - 0.2-0.35 = subtle enhancement (preserves original closely)
   - 0.35-0.50 = moderate rework (adds detail, keeps structure)
   - 0.50-0.70 = significant rework (new detail, may drift from original)
3. Use ControlNet (Canny or Depth) to lock the structure
4. Prompt for the texture type
```

**Example prompts:**
```
# Monster skin (Clot)
"detailed zombie skin texture, veins, decay, bruises, subcutaneous detail, horror, game texture, 4k, seamless"

# Stone wall
"detailed stone wall texture, cracks, moss, weathered mortar, game texture, seamless, 4k"

# Metal/industrial
"worn industrial metal texture, scratches, rust spots, rivets, game texture, seamless, 4k"

# Flora
"detailed grass and weeds, overgrown, dead leaves, horror atmosphere, game texture, 4k"

# Wood
"old wooden planks texture, grain detail, splinters, dark stain, horror, game texture, seamless, 4k"
```

**Warning:** Stable Diffusion can change the style too much. Always compare with the original and keep denoising strength low at first. KF1 has a specific gritty aesthetic — don't make it look like a different game. Use ControlNet to anchor the structure.

### 2.4 — Fallback: Magnific AI

If both ESRGAN and Stable Diffusion don't give good results for specific textures, try **Magnific AI** (https://magnific.ai) as a last resort.

**What makes it different:** Magnific has a "creativity" slider that controls how much detail the AI hallucinates. At low creativity it's a clean upscaler; at high creativity it invents plausible micro-detail (scratches, pores, grain, fiber) that wasn't in the original.

**Best for:** Textures where ESRGAN is too smooth and SD is too unpredictable — things like leather, fabric, concrete, skin close-ups.

**Tradeoff:** Magnific is a paid cloud service (subscription), not local. Use it selectively for problem textures, not for bulk processing.

**Recommended approach across all three tools:**
```
For each texture:
1. Try ESRGAN first (fast, free, batch-friendly)
2. If result looks plastic/smooth → try SD img2img with low denoising
3. If SD result drifts too far from original → try Magnific with medium creativity
4. Pick the best result per texture — mixing tools is fine
```

### 2.5 — Generate Material Maps (ONLY After DX12 Renderer Works)

> **PREREQUISITE:** This step only matters if the custom DX12 renderer from
> `2026-03-07-kf1-modern-renderer-plan.md` is working. The stock KF1 DX9
> renderer can only use diffuse textures + basic DOT3 bump mapping. Full PBR
> materials (normal, height, roughness, AO) require the custom renderer's
> shader pipeline.
>
> **Do the DX12 renderer first. Then come back here.**

Once the DX12 renderer supports PBR materials, generate additional maps from each upscaled diffuse texture:

```
For each upscaled diffuse texture:

1. Normal Map (surface detail — bumps, grooves, scratches)
   Tool: DeepBump or Materialize
   Output: RGB normal map at same resolution as diffuse

2. Height Map (for parallax occlusion mapping — surfaces appear 3D)
   Tool: Materialize (Height from Diffuse)
   Output: Grayscale height map

3. Roughness Map (shiny vs matte — metal is smooth, concrete is rough)
   Tool: Materialize (Roughness from Diffuse)
   Output: Grayscale roughness map

4. Ambient Occlusion Map (crevice shadows)
   Tool: Materialize (AO from Normal + Height)
   Output: Grayscale AO map
```

**PBR texture set per surface:**
```
textures/
├── shotgun_diffuse.png       ← from Phase 2.1 (ESRGAN/SD/Magnific)
├── shotgun_normal.png        ← DeepBump or Materialize
├── shotgun_height.png        ← Materialize
├── shotgun_roughness.png     ← Materialize
└── shotgun_ao.png            ← Materialize
```

The DX12 renderer's pixel shader would sample all five maps to produce proper PBR lighting — specular highlights on metal, rough matte on wood, parallax depth on brick walls, etc. This is what transforms KF1 from "upscaled textures" to "genuinely modern-looking materials."

---

## Phase 3: Repack — Create UE2 Texture Packages

### 3.1 — Using UnrealEd (Most Reliable)

KF1 ships with UnrealEd. It's the most reliable way to create compatible .utx packages.

```
Steps:
1. Launch UnrealEd from KF1's System/ directory
2. File → New → Create a new package (e.g., "KF_HD_Weapons")
3. Import textures:
   - Right-click in Texture Browser → Import
   - Select your upscaled PNG files
   - CRITICAL: Use the EXACT SAME internal name as the original texture
   - Set the package name to match your HD package
   - Set compression to DXT1 (opaque) or DXT5 (with alpha)
4. Save the package as .utx
```

### 3.2 — Texture Replacement Method

UE2 supports texture replacement through package loading. Two approaches:

**Approach A — MyLevel Override (simplest for testing):**
- Create a mutator that forces texture replacement at runtime
- Most flexible but requires server-side code

**Approach B — Package Name Matching (recommended for distribution):**
- Create .utx packages with the SAME name as originals but in a load-priority directory
- KF1 can be configured to load replacement packages
- Cleanest approach for a texture pack mod

**Approach C — Direct Replacement (quick and dirty for testing):**
- Back up original .utx files
- Replace them with your HD versions (same file name, same internal texture names)
- Fastest for testing but destructive

**For the proof of concept, use Approach C** — just back up originals and replace directly.

### 3.3 — Maintain Texture Properties

When repacking, preserve:
- **Internal texture name** — must match exactly or UV mapping breaks
- **Texture group** — World, Skin, WeaponSkin, etc.
- **Flags** — masked, translucent, two-sided
- **Alpha channel** — if original had alpha (masked textures, decals)
- **Mip maps** — generate full mip chain for the upscaled texture
- **Format** — use DXT1 for opaque, DXT5 for textures with alpha

---

## Phase 4: Test In-Game

### 4.1 — Shotgun Test

```
Test checklist:
□ First-person view model looks correct (no UV stretching)
□ Textures are noticeably sharper than original
□ No color shift or artifacts from upscaling
□ Third-person model also looks correct (if you upscaled those too)
□ Reload animation doesn't reveal any texture seams
□ Performance is acceptable (higher-res textures use more VRAM)
□ Screenshot comparison: original vs HD side by side
```

### 4.2 — Clot Test

```
Test checklist:
□ All body parts render correctly (head, torso, limbs)
□ No misaligned textures (especially if texture atlas was shared)
□ Skin detail is visibly improved
□ Death/gore textures still work (blood, dismemberment)
□ Multiple Clots on screen don't tank FPS (VRAM usage)
□ Animation doesn't reveal seams
□ LOD transitions look correct at different distances
□ Compare: is the Clot recognizable? AI shouldn't change the character design
```

### 4.3 — BioticsLab Map Test

```
Test checklist:
□ All wall/floor/ceiling textures render correctly
□ Tiling textures still tile seamlessly (no visible edges)
□ Props and details look correct
□ Lightmaps still apply correctly over HD textures
□ No texture flickering or z-fighting
□ Decals (blood, bullet holes) still work
□ Skybox looks correct
□ Performance: measure FPS with original vs HD textures
□ Walk through entire map checking every room
```

### 4.4 — VRAM Budget Check

Higher-res textures use significantly more VRAM:

| Resolution | DXT1 Size | DXT5 Size | RGBA8 Size |
|-----------|-----------|-----------|------------|
| 256x256 | 32 KB | 64 KB | 256 KB |
| 512x512 | 128 KB | 256 KB | 1 MB |
| 1024x1024 | 512 KB | 1 MB | 4 MB |
| 2048x2048 | 2 MB | 4 MB | 16 MB |
| 4096x4096 | 8 MB | 16 MB | 64 MB |

A full KF1 map might have 200-500 textures. At 2048x2048 DXT1, that's 400 MB – 1 GB of VRAM just for world textures. Most modern GPUs have 8-12+ GB so this is fine, but worth monitoring.

---

## Phase 5: Scale to Everything

Once the proof of concept works, automate and scale.

### 5.1 — Batch Extraction Script

```python
# Python script to batch-extract all textures from KF1
# Wraps umodel CLI commands
# Organizes output by category (weapons, monsters, maps, effects, UI)

import subprocess
import os

KF_PATH = "D:/SteamLibrary/steamapps/common/KillingFloor"
OUTPUT = "kf1/tools/texture-upscale/original"

PACKAGES = {
    "weapons": [
        "KF_Weapons_Trip.utx",
        "KF_Weapons2_Trip.utx",
        "KF_Weapons3rd_Trip.utx",
    ],
    "monsters": [
        "KFCharacters.utx",
        "KF_Specimens_Trip.utx",
    ],
    "world": [
        "KF_generic_textures.utx",
        "KF_gore_Trip.utx",
        # ... all texture packages
    ],
    "maps": [
        # All .rom files in Maps/
    ],
}

for category, packages in PACKAGES.items():
    for pkg in packages:
        out_dir = os.path.join(OUTPUT, category)
        subprocess.run([
            "umodel.exe",
            "-export", "-png",
            f"-path={KF_PATH}",
            "-game=kf",
            f"-out={out_dir}",
            pkg
        ])
```

### 5.2 — Batch Upscale Pipeline

```python
# Upscale all extracted textures
# Handle tiling textures specially (tile 3x3 → upscale → crop center)

import subprocess
from pathlib import Path

INPUT = "kf1/tools/texture-upscale/original"
OUTPUT = "kf1/tools/texture-upscale/upscaled"

# Textures known to be tiling (walls, floors, ceilings)
TILING_DIRS = ["world", "maps"]

for category_dir in Path(INPUT).iterdir():
    if not category_dir.is_dir():
        continue

    out_dir = Path(OUTPUT) / category_dir.name
    out_dir.mkdir(parents=True, exist_ok=True)

    if category_dir.name in TILING_DIRS:
        # Pre-tile, upscale, crop for seamless tiling
        for tex in category_dir.glob("*.png"):
            tile_and_upscale(tex, out_dir / tex.name)
    else:
        # Direct upscale
        subprocess.run([
            "python", "-m", "realesrgan",
            "-i", str(category_dir),
            "-o", str(out_dir),
            "-n", "RealESRGAN_x4plus",
            "-s", "4"
        ])
```

### 5.3 — Batch Repack Script

Automate the repacking into .utx packages. This is the trickiest part — the internal texture names must match exactly.

```python
# Generate an UnrealEd import script (.uc or batch commands)
# that imports all upscaled textures with correct names

# For each original texture:
# 1. Record: package name, texture name, group, format, flags
# 2. Generate import command with upscaled file path
# 3. Execute via UnrealEd command line or script
```

### 5.4 — Priority Order for Full Conversion

| Priority | Category | Count (est.) | Impact |
|----------|----------|-------------|--------|
| 1 | Weapon viewmodels (1st person) | ~30 weapons × 2-4 textures | Highest — always visible |
| 2 | Monster skins (specimens) | ~15 types × 2-4 textures | High — what you're shooting at |
| 3 | Player hands/arms | ~5 textures per perk | High — always visible |
| 4 | Map textures (stock maps) | ~200-500 per map × 19 maps | High — the world |
| 5 | Props and static meshes | ~100-200 textures | Medium |
| 6 | Effects (blood, particles) | ~50-100 textures | Medium |
| 7 | UI/HUD elements | ~30-50 textures | Low — you're replacing these with custom HUD |
| 8 | Skyboxes | ~6 per map | Low — rarely noticed |

---

## Texture Quality Comparison Workflow

For community presentation and documentation:

```
For each texture:
1. Take in-game screenshot with original texture
2. Take in-game screenshot with HD texture (same position/angle/lighting)
3. Create side-by-side comparison image
4. Create 4x zoom crop comparison for detail

Tools:
- NVIDIA Ansel (if supported) or F12 Steam screenshot
- ImageMagick for batch comparison image generation:
  montage original.png upscaled.png -geometry +2+2 comparison.png
```

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Upscaled textures look "AI-smooth" / plastic | Medium | High | Fallback chain: ESRGAN → SD img2img → Magnific AI. Mix tools per texture |
| Tiling breaks on wall/floor textures | High | High | Pre-tile 3x3 method, manual edge fixing |
| UV mapping breaks after repack | Medium | Critical | Preserve exact internal names, test each texture |
| VRAM usage too high for some GPUs | Low | Medium | Offer 2x and 4x versions, use DXT compression |
| Texture atlases (shared sheets) cause issues | Medium | High | Identify shared atlases first, upscale whole atlas |
| Color/style inconsistency between AI-processed textures | Medium | Medium | Batch process with same model and settings |
| KF1 engine limits on texture resolution | Low | High | Test max supported resolution early (likely 4096x4096) |
| UnrealEd crashes during import | Medium | Low | Save frequently, import in small batches |

---

## Deliverables

### Proof of Concept (Phase 1-4)
- [ ] Upscaled shotgun textures (viewmodel + 3rd person)
- [ ] Upscaled Clot textures (all body parts)
- [ ] Upscaled BioticsLab textures (walls, floors, props)
- [ ] Replacement .utx packages that work in-game
- [ ] Before/after comparison screenshots
- [ ] Performance benchmark (FPS + VRAM original vs HD)

### Full Texture Pack (Phase 5)
- [ ] All weapon textures upscaled (4x)
- [ ] All monster textures upscaled (4x)
- [ ] All stock map textures upscaled (4x)
- [ ] All effect/decal textures upscaled (4x)
- [ ] Installer or drop-in package for easy installation
- [ ] README with installation instructions
- [ ] Comparison gallery

### Phase 6: PBR Material Maps (BLOCKED — requires DX12 renderer first)

Only start this after the custom DX12 renderer from `2026-03-07-kf1-modern-renderer-plan.md`
is working with PBR shader support. The stock DX9 renderer cannot use these maps.

- [ ] DX12 renderer loads and renders KF1 correctly (Phase 1 of renderer plan)
- [ ] DX12 renderer supports PBR material pipeline (Phase 2 of renderer plan)
- [ ] Generate normal maps for all upscaled textures (DeepBump)
- [ ] Generate height maps for parallax occlusion mapping (Materialize)
- [ ] Generate roughness maps for PBR specular (Materialize)
- [ ] Generate AO maps for ambient occlusion (Materialize)
- [ ] Bundle as PBR texture pack (diffuse + normal + height + roughness + AO per texture)
- [ ] Test in DX12 renderer — verify PBR lighting looks correct

---

## Tools Quick Reference

| Tool | Purpose | URL |
|------|---------|-----|
| UE Viewer (umodel) | Extract textures from UE2 packages | https://www.gildor.org/en/projects/umodel |
| Real-ESRGAN | AI texture upscaling (4x/8x) | https://github.com/xinntao/Real-ESRGAN |
| ESRGAN | AI upscaling with custom models | https://github.com/joeyballentine/ESRGAN |
| Upscale Wiki | Community ESRGAN model database | https://upscale.wiki/wiki/Model_Database |
| DeepBump | AI normal map generation | https://github.com/HugoTini/DeepBump |
| Materialize | PBR material map generation | http://www.boundingboxsoftware.com/materialize/ |
| Stable Diffusion | Creative texture rework (img2img) | https://github.com/AUTOMATIC1111/stable-diffusion-webui |
| UnrealEd | Import textures into .utx packages | Ships with KF1 |
| UTPT | UE package editing | https://www.acordero.org/projects/unreal-tournament-package-tool/ |
| Pillow (Python) | Image manipulation for tiling fix | `pip install Pillow` |
