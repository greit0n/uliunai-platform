# KF1 AI Texture Upscale — HD Texture Pack Tools

## Overview

Tools to extract, AI-upscale, and repack Killing Floor 1 textures for an HD texture mod. The pipeline pulls original textures from `.utx` packages using UE Viewer (umodel), upscales them with Real-ESRGAN or other AI super-resolution models, generates before/after comparison galleries, and prepares the results for repacking into game-ready `.utx` files.

**Proof of concept targets:** Shotgun (weapon), Clot (monster), BioticsLab (map).

## Quick Start

```bash
1. python setup_check.py              # Verify tools are installed
2. python extract_textures.py --poc    # Extract PoC textures
3. python upscale_textures.py --input original --output upscaled
4. python compare_textures.py          # Generate comparison gallery
5. Open comparisons/gallery.html       # Review results
```

## Prerequisites

| Requirement | Install |
|-------------|---------|
| Python 3.8+ | https://www.python.org/downloads/ |
| Pillow | `pip install Pillow` |
| UE Viewer (umodel) | https://www.gildor.org/en/projects/umodel |
| Real-ESRGAN | `pip install realesrgan` or https://github.com/xinntao/Real-ESRGAN |

**Optional (alternative upscale backends):**

- **ESRGAN** with custom community models (e.g., 4x_FatalPixels)
- **Topaz Gigapixel AI** — commercial, best quality, no scripting integration
- **Stable Diffusion** img2img — experimental, good for artistic reinterpretation

## Tools

### `setup_check.py`

Verifies that all required tools and dependencies are installed. Reports status with clear pass/fail indicators. No external dependencies — stdlib only.

```bash
python setup_check.py                          # Default check
python setup_check.py --kf-path "D:/Games/KF"  # Custom KF1 install path
python setup_check.py --umodel-path "D:/Tools/umodel.exe"  # Custom umodel path
```

### `extract_textures.py`

Extracts textures from KF1 `.utx` packages using UE Viewer (umodel). Organizes outputs into category subdirectories.

```bash
python extract_textures.py --poc               # Extract only PoC targets (Shotgun, Clot, BioticsLab)
python extract_textures.py --all               # Extract all textures
python extract_textures.py --package KFX.utx   # Extract a specific package
python extract_textures.py --list              # List available packages without extracting
python extract_textures.py --kf-path "D:/KF"   # Custom KF1 install path
python extract_textures.py --output original    # Output directory (default: original/)
```

### `upscale_textures.py`

Runs AI upscaling on extracted textures. Supports multiple backends and models.

```bash
python upscale_textures.py --input original --output upscaled
python upscale_textures.py --input original --output upscaled --model RealESRGAN_x4plus
python upscale_textures.py --input original --output upscaled --scale 4
python upscale_textures.py --input original --output upscaled --tile    # Enable 3x3 tiling for seamless textures
python upscale_textures.py --input original --output upscaled --category weapons  # Only upscale weapons
python upscale_textures.py --input original --output upscaled --force   # Re-upscale existing files
```

### `compare_textures.py`

Generates side-by-side comparison images and an HTML gallery for reviewing upscale quality.

```bash
python compare_textures.py                                    # Default: original/ vs upscaled/
python compare_textures.py --original original --upscaled upscaled
python compare_textures.py --output comparisons               # Output directory
python compare_textures.py --no-html                          # Skip HTML gallery generation
```

## Directory Structure

```
texture-upscale/
├── original/              # Extracted original textures
│   ├── weapons/           #   Shotgun, crossbow, etc.
│   ├── monsters/          #   Clot, crawler, scrake, etc.
│   ├── maps/              #   BioticsLab, Farm, Manor, etc.
│   └── world/             #   Shared world textures (brick, metal, etc.)
├── upscaled/              # AI-upscaled textures (mirrors original/ structure)
├── materials/             # Generated PBR maps — normal, roughness, AO (future)
├── comparisons/           # Comparison images + HTML gallery
│   ├── gallery.html       #   Interactive before/after viewer
│   └── *.png              #   Side-by-side comparison images
├── output/                # Final .utx packages ready for game installation
├── extract_textures.py
├── upscale_textures.py
├── compare_textures.py
├── setup_check.py
├── requirements.txt
└── README.md
```

## Upscale Model Recommendations

| Model | Scale | Best For | Notes |
|-------|-------|----------|-------|
| `RealESRGAN_x4plus` | 4x | General purpose | Default model. Good balance of detail and artifact removal. Works well on most KF1 textures. |
| `RealESRNet_x4plus` | 4x | Noisy/compressed textures | More conservative — preserves original feel, fewer hallucinated details. Good fallback. |
| `4x_FatalPixels` | 4x | Pixel art / low-res game textures | Community ESRGAN model tuned for game textures. Excellent at preserving hard edges and pixel-level detail. |
| `4x_Fatality` | 4x | Realistic textures | Community model biased toward photorealism. Best for organic surfaces (skin, wood, stone). May over-smooth stylized textures. |

For PoC evaluation, run `RealESRGAN_x4plus` first. If results look too smooth on weapon textures, try `4x_FatalPixels`. For monster skin, `4x_Fatality` often produces better organic detail.

## Tiling Method for Seamless Textures

Many KF1 textures tile seamlessly (floors, walls, metal panels). Naive upscaling breaks the tiling — seams appear where edges no longer match.

The **3x3 tiling method** solves this:

1. Tile the original texture in a 3x3 grid (9 copies arranged in a square)
2. Upscale the entire 3x3 composite image
3. Crop out only the center tile from the upscaled result

Because the AI sees neighboring context on all sides, the center tile's edges blend naturally with itself. The result tiles seamlessly at the upscaled resolution.

Use `--tile` with `upscale_textures.py` to enable this automatically. The script detects likely tiling textures by category (maps, world) and applies the method. You can also force it with `--tile-all`.

## Repacking Textures into .utx

Repacking upscaled textures into `.utx` packages that KF1 can load requires **UnrealEd** (the Unreal Editor that ships with KF1).

**Key constraint:** The internal texture names, group names, and package names must match the originals exactly. KF1 materials reference textures by `Package.Group.TextureName` — if any part differs, the game falls back to the original texture or shows a missing texture placeholder.

**Workflow:**

1. Open UnrealEd (`D:/SteamLibrary/steamapps/common/KillingFloor/System/UnrealEd.exe`)
2. Import the upscaled PNG into the correct package and group
3. Ensure the texture name matches the original
4. Set compression (DXT1 for opaque, DXT5 for alpha) — match the original format
5. Save the package to `output/`
6. Players install the `.utx` into their `Textures/` directory

Automating this step with a batch import script is a future goal.

## Phase 6: PBR Material Maps (Future)

Generating PBR material maps (normal maps, roughness maps, ambient occlusion) from upscaled diffuse textures is planned for Phase 6. This requires the custom DX12 renderer project to actually use the PBR data at runtime — without it, KF1's fixed-function pipeline can only display diffuse textures.

Tools like Materialize, DeepBump, or Stable Diffusion ControlNet can generate PBR maps from a single diffuse texture. The `materials/` directory is reserved for this output.
