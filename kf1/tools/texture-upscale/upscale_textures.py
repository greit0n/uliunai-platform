"""
Batch upscale extracted KF1 textures using AI upscaling (Real-ESRGAN / ESRGAN).

Walks the input directory tree, upscales each image file 2x or 4x, and writes
the results to a mirrored output tree.  For tiling textures (walls, floors) it
applies the tile-before-upscale method: paste the image into a 3x3 grid, upscale
the grid, then crop the center tile so seamless tiling is preserved.

Requirements:
    pip install Pillow

    Plus one of the following upscale backends (detected automatically):
      - Real-ESRGAN:  pip install realesrgan
      - ESRGAN fork:  https://github.com/joeyballentine/ESRGAN (clone + models/)

Usage:
    # Upscale everything in ./original at 4x using the default model:
    python upscale_textures.py

    # Upscale only the weapons category at 2x:
    python upscale_textures.py --scale 2 --category weapons

    # Use a community game-texture model:
    python upscale_textures.py --model 4x_FatalPixels

    # Preview what would happen without doing anything:
    python upscale_textures.py --dry-run

    # Force re-upscale everything (overwrite existing outputs):
    python upscale_textures.py --force

After upscaling, generate side-by-side comparisons:
    python upscale_textures.py --compare
    # (sets a flag — actual comparison images are made by a separate script)

Notes:
    - Subdirectories listed in --tiling-dirs get the 3x3 tile treatment.
      By default that is "world" and "maps".
    - The script recurses into subdirectories, so weapons/shotgun/diffuse.png
      is a valid input path and will produce upscaled/weapons/shotgun/diffuse.png.
    - VRAM budget estimates are printed at the end so you can gauge whether
      the upscaled pack will fit in GPU memory.
"""
import argparse
import os
import shutil
import subprocess
import sys
import tempfile
import time
from pathlib import Path

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

SCRIPT_DIR = Path(__file__).resolve().parent
DEFAULT_INPUT = SCRIPT_DIR / "original"
DEFAULT_OUTPUT = SCRIPT_DIR / "upscaled"

IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".tga", ".bmp", ".tif", ".tiff"}

KNOWN_MODELS = [
    "RealESRGAN_x4plus",
    "RealESRNet_x4plus",
    "4x_FatalPixels",
]

# DXT1 compressed sizes used for VRAM budget estimates.
# At DXT1 (0.5 bytes/pixel) these are the per-texture sizes.
VRAM_ESTIMATES_DXT1 = {
    (256, 1024):   512,         # 256->1024:  ~512 KB
    (512, 2048):   2 * 1024,    # 512->2048:  ~2 MB  (in KB)
    (1024, 4096):  8 * 1024,    # 1024->4096: ~8 MB  (in KB)
}


# ---------------------------------------------------------------------------
# Backend detection
# ---------------------------------------------------------------------------

def _run_silent(cmd: list[str]) -> bool:
    """Return True if *cmd* exits 0 (or prints a help banner)."""
    try:
        subprocess.run(
            cmd,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            timeout=15,
        )
        return True
    except (FileNotFoundError, subprocess.TimeoutExpired, OSError):
        return False


def detect_backend() -> str | None:
    """Auto-detect which upscale backend is available.

    Returns
    -------
    "realesrgan"  – the ``python -m realesrgan`` CLI is installed
    "esrgan"      – the joeyballentine ESRGAN fork (test.py) is available
    None          – nothing found
    """
    # 1. Try Real-ESRGAN (pip package)
    if _run_silent([sys.executable, "-m", "realesrgan", "-h"]):
        return "realesrgan"

    # 2. Try ESRGAN fork — look for test.py in a sibling or well-known dir
    esrgan_script = _find_esrgan_test_py()
    if esrgan_script is not None:
        return "esrgan"

    return None


def _find_esrgan_test_py() -> Path | None:
    """Locate the ESRGAN fork's ``test.py`` in common places."""
    candidates = [
        SCRIPT_DIR / "ESRGAN" / "test.py",
        SCRIPT_DIR.parent / "ESRGAN" / "test.py",
        Path.home() / "ESRGAN" / "test.py",
    ]
    for p in candidates:
        if p.is_file():
            return p
    return None


# ---------------------------------------------------------------------------
# Tiling helper (Pillow)
# ---------------------------------------------------------------------------

def tile_3x3(input_path: Path, temp_dir: Path) -> Path:
    """Create a 3x3 tiled version of the image for seamless upscaling.

    Returns the path to the temporary tiled image.
    """
    from PIL import Image

    img = Image.open(input_path)
    w, h = img.size
    tiled = Image.new(img.mode, (w * 3, h * 3))
    for col in range(3):
        for row in range(3):
            tiled.paste(img, (col * w, row * h))

    tiled_path = temp_dir / f"tiled_{input_path.name}"
    tiled.save(str(tiled_path))
    return tiled_path


def crop_center_tile(upscaled_tiled_path: Path, output_path: Path) -> None:
    """Crop the centre tile from a 3x3 upscaled image and save it."""
    from PIL import Image

    img = Image.open(upscaled_tiled_path)
    uw, uh = img.size
    tile_w, tile_h = uw // 3, uh // 3
    center = img.crop((tile_w, tile_h, 2 * tile_w, 2 * tile_h))
    center.save(str(output_path))


# ---------------------------------------------------------------------------
# Upscale wrappers
# ---------------------------------------------------------------------------

def upscale_realesrgan(
    input_path: Path,
    output_path: Path,
    model: str,
    scale: int,
) -> bool:
    """Upscale a single file via ``python -m realesrgan``."""
    cmd = [
        sys.executable, "-m", "realesrgan",
        "-i", str(input_path),
        "-o", str(output_path),
        "-n", model,
        "-s", str(scale),
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    return result.returncode == 0


def upscale_esrgan(
    input_path: Path,
    output_path: Path,
    model: str,
    scale: int,
) -> bool:
    """Upscale a single file via the ESRGAN fork's ``test.py``."""
    test_py = _find_esrgan_test_py()
    if test_py is None:
        return False

    # Determine model path — if it looks like a bare name, look inside models/
    if os.sep not in model and "/" not in model and not model.endswith(".pth"):
        model_path = test_py.parent / "models" / f"{model}.pth"
    else:
        model_path = Path(model)

    cmd = [
        sys.executable, str(test_py),
        "--model", str(model_path),
        "--input", str(input_path),
        "--output", str(output_path),
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    return result.returncode == 0


def upscale_file(
    input_path: Path,
    output_path: Path,
    backend: str,
    model: str,
    scale: int,
) -> bool:
    """Dispatch to the appropriate backend."""
    if backend == "realesrgan":
        return upscale_realesrgan(input_path, output_path, model, scale)
    elif backend == "esrgan":
        return upscale_esrgan(input_path, output_path, model, scale)
    else:
        print(f"  ERROR: Unknown backend '{backend}'")
        return False


# ---------------------------------------------------------------------------
# Core processing
# ---------------------------------------------------------------------------

def collect_files(
    input_dir: Path,
    category: str | None,
) -> list[Path]:
    """Recursively collect image files under *input_dir*.

    If *category* is set, only files under that immediate subdirectory are
    returned (e.g. ``--category weapons`` limits to ``input_dir/weapons/``).
    """
    if category:
        root = input_dir / category
        if not root.is_dir():
            print(f"Category directory not found: {root}")
            sys.exit(1)
    else:
        root = input_dir

    files: list[Path] = []
    for dirpath, _dirnames, filenames in os.walk(root):
        for fname in sorted(filenames):
            if Path(fname).suffix.lower() in IMAGE_EXTENSIONS:
                files.append(Path(dirpath) / fname)
    return files


def is_tiling(file_path: Path, input_dir: Path, tiling_dirs: set[str]) -> bool:
    """Return True if *file_path* sits under one of the tiling directories."""
    try:
        rel = file_path.relative_to(input_dir)
    except ValueError:
        return False
    # The first component of the relative path is the category subdirectory.
    parts = rel.parts
    if parts:
        return parts[0].lower() in tiling_dirs
    return False


def get_output_path(file_path: Path, input_dir: Path, output_dir: Path) -> Path:
    """Mirror the input directory structure under output_dir."""
    rel = file_path.relative_to(input_dir)
    return output_dir / rel


def get_image_dimensions(file_path: Path) -> tuple[int, int] | None:
    """Return (width, height) of an image without loading full pixel data."""
    try:
        from PIL import Image
        with Image.open(file_path) as img:
            return img.size
    except Exception:
        return None


# ---------------------------------------------------------------------------
# VRAM budget
# ---------------------------------------------------------------------------

def estimate_vram(output_files: list[Path], scale: int) -> None:
    """Print estimated VRAM usage based on output resolutions (DXT1)."""
    if not output_files:
        return

    buckets: dict[str, int] = {}  # "256->1024" -> count
    total_kb = 0

    for fpath in output_files:
        dims = get_image_dimensions(fpath)
        if dims is None:
            continue

        w, h = dims
        orig_w = w // scale
        # DXT1: 0.5 bytes per pixel (8 bytes per 4x4 block = 0.5 B/px)
        size_kb = (w * h) // 2 // 1024  # approx KB
        total_kb += size_kb

        label = f"{orig_w}->{w}"
        buckets[label] = buckets.get(label, 0) + 1

    print("\n--- VRAM Budget Estimate (DXT1 compressed) ---")
    print("Resolution estimates:")
    print(f"  - 256->1024: ~512KB per texture (DXT1)")
    print(f"  - 512->2048: ~2MB per texture (DXT1)")
    print(f"  - 1024->4096: ~8MB per texture (DXT1)")

    if buckets:
        print("\nYour output breakdown:")
        for label, count in sorted(buckets.items()):
            print(f"  {label}: {count} texture(s)")

    total_mb = total_kb / 1024
    print(f"\nTotal estimated VRAM: ~{total_mb:.0f} MB for {len(output_files)} texture(s)")
    print("(Actual usage depends on engine format; DXT5 is 2x, RGBA8 is 8x larger)")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> None:
    parser = argparse.ArgumentParser(
        description="Batch upscale KF1 textures using AI (Real-ESRGAN / ESRGAN).",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Upscale everything at 4x with the default model:
  python upscale_textures.py

  # Only upscale weapons at 2x:
  python upscale_textures.py --scale 2 --category weapons

  # Use a game-texture-specific ESRGAN model:
  python upscale_textures.py --model 4x_FatalPixels

  # Preview what would be processed:
  python upscale_textures.py --dry-run

  # Force overwrite existing upscaled files:
  python upscale_textures.py --force
""",
    )
    parser.add_argument(
        "--input", type=Path, default=DEFAULT_INPUT,
        help="Input directory with original textures (default: ./original)",
    )
    parser.add_argument(
        "--output", type=Path, default=DEFAULT_OUTPUT,
        help="Output directory for upscaled textures (default: ./upscaled)",
    )
    parser.add_argument(
        "--scale", type=int, choices=[2, 4], default=4,
        help="Upscale factor: 2 or 4 (default: 4)",
    )
    parser.add_argument(
        "--model", type=str, default="RealESRGAN_x4plus",
        help=(
            "Model name or path to a custom .pth file. "
            f"Built-in choices: {', '.join(KNOWN_MODELS)} "
            "(default: RealESRGAN_x4plus)"
        ),
    )
    parser.add_argument(
        "--tiling-dirs", type=str, default="world,maps",
        help=(
            "Comma-separated subdirectory names containing tiling textures. "
            "These get the 3x3 tile-before-upscale treatment to preserve "
            "seamless tiling (default: world,maps)"
        ),
    )
    parser.add_argument(
        "--category", type=str, default=None,
        help="Only process a specific category subdirectory (e.g. weapons, monsters)",
    )
    parser.add_argument(
        "--force", action="store_true",
        help="Overwrite existing upscaled files",
    )
    parser.add_argument(
        "--dry-run", action="store_true",
        help="Show what would be processed without actually upscaling",
    )
    parser.add_argument(
        "--compare", action="store_true",
        help="After upscaling, flag that comparison images should be generated",
    )

    args = parser.parse_args()

    input_dir: Path = args.input.resolve()
    output_dir: Path = args.output.resolve()
    scale: int = args.scale
    model: str = args.model
    tiling_dirs: set[str] = {d.strip().lower() for d in args.tiling_dirs.split(",")}
    category: str | None = args.category
    force: bool = args.force
    dry_run: bool = args.dry_run
    compare: bool = args.compare

    # ---- Validate input directory ----
    if not input_dir.is_dir():
        print(f"Input directory not found: {input_dir}")
        sys.exit(1)

    # ---- Detect backend (unless dry-run) ----
    backend: str | None = None
    if not dry_run:
        backend = detect_backend()
        if backend is None:
            print("ERROR: No upscale backend found.")
            print()
            print("Install one of the following:")
            print("  1. Real-ESRGAN:  pip install realesrgan")
            print("  2. ESRGAN fork:  git clone https://github.com/joeyballentine/ESRGAN")
            print("                   and place it at: kf1/tools/texture-upscale/ESRGAN/")
            sys.exit(1)
        print(f"Backend: {backend}")
    else:
        print("DRY RUN — no files will be modified\n")

    print(f"Input:   {input_dir}")
    print(f"Output:  {output_dir}")
    print(f"Scale:   {scale}x")
    print(f"Model:   {model}")
    print(f"Tiling:  subdirs {tiling_dirs}")
    if category:
        print(f"Category: {category}")
    print()

    # ---- Collect files ----
    files = collect_files(input_dir, category)
    if not files:
        print("No image files found to process.")
        sys.exit(0)

    total = len(files)
    print(f"Found {total} image(s) to process.\n")

    # ---- Process ----
    processed = 0
    skipped = 0
    failed = 0
    failed_files: list[str] = []
    output_files: list[Path] = []

    start_time = time.time()

    for idx, fpath in enumerate(files, start=1):
        out_path = get_output_path(fpath, input_dir, output_dir)
        rel_display = fpath.relative_to(input_dir)
        tiling = is_tiling(fpath, input_dir, tiling_dirs)
        tile_tag = " [tiling]" if tiling else ""

        # Skip existing?
        if out_path.exists() and not force:
            print(f"[{idx}/{total}] SKIP (exists) {rel_display}{tile_tag}")
            skipped += 1
            output_files.append(out_path)
            continue

        print(f"[{idx}/{total}] Upscaling {rel_display}...{tile_tag}")

        if dry_run:
            processed += 1
            continue

        # Ensure output directory exists
        out_path.parent.mkdir(parents=True, exist_ok=True)

        success = False

        if tiling:
            # ---- Tile-before-upscale method ----
            tmp_dir = Path(tempfile.mkdtemp(prefix="kf1_tile_"))
            try:
                # 1. Create 3x3 tiled version
                tiled_path = tile_3x3(fpath, tmp_dir)

                # 2. Upscale the tiled version
                upscaled_tiled_path = tmp_dir / f"upscaled_tiled_{fpath.name}"
                ok = upscale_file(tiled_path, upscaled_tiled_path, backend, model, scale)

                if ok and upscaled_tiled_path.exists():
                    # 3. Crop center tile
                    crop_center_tile(upscaled_tiled_path, out_path)
                    success = out_path.exists()
                else:
                    print(f"  ERROR: Upscale of tiled image failed")
            except Exception as e:
                print(f"  ERROR: {e}")
            finally:
                # 4. Clean up temp files
                shutil.rmtree(tmp_dir, ignore_errors=True)
        else:
            # ---- Direct upscale ----
            try:
                success = upscale_file(fpath, out_path, backend, model, scale)
            except Exception as e:
                print(f"  ERROR: {e}")

        if success:
            processed += 1
            output_files.append(out_path)
        else:
            failed += 1
            failed_files.append(str(rel_display))

    elapsed = time.time() - start_time

    # ---- Summary ----
    print()
    print("=" * 60)
    print("SUMMARY")
    print("=" * 60)
    print(f"  Total files:  {total}")
    print(f"  Processed:    {processed}")
    print(f"  Skipped:      {skipped}")
    print(f"  Failed:       {failed}")
    if not dry_run:
        print(f"  Time:         {elapsed:.1f}s")

    if failed_files:
        print()
        print("Failed files:")
        for f in failed_files:
            print(f"  - {f}")

    # ---- VRAM estimate ----
    if not dry_run and output_files:
        estimate_vram(output_files, scale)

    # ---- Compare flag ----
    if compare:
        compare_flag = output_dir / ".compare_requested"
        if not dry_run:
            compare_flag.write_text(
                f"Comparison requested at {time.strftime('%Y-%m-%d %H:%M:%S')}\n"
                f"Input:  {input_dir}\n"
                f"Output: {output_dir}\n"
                f"Scale:  {scale}x\n"
                f"Model:  {model}\n"
            )
            print(f"\nComparison flag written to {compare_flag}")
            print("Run your comparison script to generate side-by-side images.")
        else:
            print("\n[dry-run] Would write comparison flag to", compare_flag)

    print()


if __name__ == "__main__":
    main()
