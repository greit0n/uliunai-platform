"""
Generate visual comparison images and an HTML gallery for original vs AI-upscaled
KF1 textures.

Creates side-by-side and detail-crop comparisons for each texture pair found in
the original/ and upscaled/ directories, organized by category (weapons, monsters,
maps, world). Produces a self-contained HTML gallery with statistics.

Requirements:
    pip install Pillow

Usage:
    # Compare all textures using default directories:
    python compare_textures.py

    # Compare only weapon textures:
    python compare_textures.py --category weapons

    # Custom directories and zoom:
    python compare_textures.py --original ./orig --upscaled ./up --output ./out --zoom 6

    # Skip HTML gallery:
    python compare_textures.py --no-html

    # Output as JPEG:
    python compare_textures.py --format jpg
"""
import argparse
import os
import sys
import logging
from pathlib import Path
from datetime import datetime

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    print("Error: Pillow is required. Install it with: pip install Pillow")
    sys.exit(1)

logger = logging.getLogger(__name__)

SUPPORTED_EXTENSIONS = {'.png', '.jpg', '.jpeg', '.bmp', '.tga', '.tiff', '.webp'}
CATEGORIES = ['weapons', 'monsters', 'maps', 'world']
LABEL_HEIGHT = 36
LABEL_BG = (20, 20, 20, 255)
LABEL_COLOR = (224, 224, 224)
DIVIDER_WIDTH = 4
DIVIDER_COLOR = (139, 0, 0)  # blood-red #8B0000


def find_font(size: int):
    """Try to load a clean sans-serif font, fall back to Pillow default."""
    font_candidates = [
        "arial.ttf",
        "Arial.ttf",
        "DejaVuSans.ttf",
        "LiberationSans-Regular.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "C:/Windows/Fonts/arial.ttf",
        "C:/Windows/Fonts/segoeui.ttf",
    ]
    for name in font_candidates:
        try:
            return ImageFont.truetype(name, size)
        except (OSError, IOError):
            continue
    return ImageFont.load_default()


def collect_texture_pairs(original_dir: Path, upscaled_dir: Path, category: str = None):
    """Find matching texture pairs across original and upscaled directories.

    Returns a list of dicts with keys: category, name, original_path, upscaled_path.
    Logs warnings for unmatched files.
    """
    pairs = []
    categories_to_scan = [category] if category else CATEGORIES

    for cat in categories_to_scan:
        orig_cat = original_dir / cat
        up_cat = upscaled_dir / cat

        if not orig_cat.is_dir() and not up_cat.is_dir():
            continue

        orig_files = {}
        up_files = {}

        if orig_cat.is_dir():
            for f in orig_cat.iterdir():
                if f.is_file() and f.suffix.lower() in SUPPORTED_EXTENSIONS:
                    orig_files[f.stem.lower()] = f

        if up_cat.is_dir():
            for f in up_cat.iterdir():
                if f.is_file() and f.suffix.lower() in SUPPORTED_EXTENSIONS:
                    up_files[f.stem.lower()] = f

        all_stems = set(orig_files.keys()) | set(up_files.keys())

        for stem in sorted(all_stems):
            if stem in orig_files and stem in up_files:
                pairs.append({
                    'category': cat,
                    'name': orig_files[stem].stem,
                    'original_path': orig_files[stem],
                    'upscaled_path': up_files[stem],
                })
            elif stem in orig_files:
                logger.warning(
                    "No upscaled version for %s/%s — skipping",
                    cat, orig_files[stem].name
                )
            else:
                logger.warning(
                    "No original version for %s/%s — skipping",
                    cat, up_files[stem].name
                )

    # Also handle files at the root level (no category subdir)
    if category is None:
        orig_root_files = {}
        up_root_files = {}
        for f in original_dir.iterdir():
            if f.is_file() and f.suffix.lower() in SUPPORTED_EXTENSIONS:
                orig_root_files[f.stem.lower()] = f
        for f in upscaled_dir.iterdir():
            if f.is_file() and f.suffix.lower() in SUPPORTED_EXTENSIONS:
                up_root_files[f.stem.lower()] = f

        all_root = set(orig_root_files.keys()) | set(up_root_files.keys())
        for stem in sorted(all_root):
            if stem in orig_root_files and stem in up_root_files:
                pairs.append({
                    'category': 'uncategorized',
                    'name': orig_root_files[stem].stem,
                    'original_path': orig_root_files[stem],
                    'upscaled_path': up_root_files[stem],
                })
            elif stem in orig_root_files:
                logger.warning(
                    "No upscaled version for (root)/%s — skipping",
                    orig_root_files[stem].name
                )
            else:
                logger.warning(
                    "No original version for (root)/%s — skipping",
                    up_root_files[stem].name
                )

    return pairs


def create_sidebyside(original: Image.Image, upscaled: Image.Image,
                       texture_name: str, out_format: str) -> Image.Image:
    """Create a labeled side-by-side comparison image.

    The original is scaled up to match the upscaled dimensions using
    nearest-neighbor interpolation to preserve the pixelated look.
    """
    up_w, up_h = upscaled.size
    orig_w, orig_h = original.size
    scale_factor = up_w // orig_w if orig_w > 0 else 1

    # Resize original to match upscaled dimensions (nearest neighbor)
    orig_resized = original.resize((up_w, up_h), Image.NEAREST)

    total_w = up_w * 2 + DIVIDER_WIDTH
    total_h = up_h + LABEL_HEIGHT

    canvas = Image.new('RGBA', (total_w, total_h), LABEL_BG)
    draw = ImageDraw.Draw(canvas)

    font = find_font(18)
    small_font = find_font(13)

    # Draw labels
    left_label = f"ORIGINAL ({orig_w}x{orig_h})"
    right_label = f"UPSCALED {scale_factor}x ({up_w}x{up_h})"

    draw.text((up_w // 2, LABEL_HEIGHT // 2), left_label,
              fill=LABEL_COLOR, font=font, anchor="mm")
    draw.text((up_w + DIVIDER_WIDTH + up_w // 2, LABEL_HEIGHT // 2), right_label,
              fill=(220, 38, 38), font=font, anchor="mm")

    # Draw texture name subtitle
    draw.text((total_w // 2, LABEL_HEIGHT - 2), texture_name,
              fill=(100, 100, 100), font=small_font, anchor="mb")

    # Paste images
    canvas.paste(orig_resized, (0, LABEL_HEIGHT))
    canvas.paste(upscaled, (up_w + DIVIDER_WIDTH, LABEL_HEIGHT))

    # Draw divider
    draw.rectangle(
        [up_w, LABEL_HEIGHT, up_w + DIVIDER_WIDTH - 1, total_h],
        fill=DIVIDER_COLOR
    )

    # Convert to RGB if saving as JPEG
    if out_format == 'jpg':
        canvas = canvas.convert('RGB')

    return canvas


def create_detail_crop(original: Image.Image, upscaled: Image.Image,
                        texture_name: str, crop_size: int, zoom: int,
                        out_format: str) -> Image.Image:
    """Create a detail crop comparison.

    Crops a region from the center of the original, scales it up with
    nearest-neighbor, and compares against the corresponding region from
    the upscaled version.
    """
    orig_w, orig_h = original.size
    up_w, up_h = upscaled.size
    scale_factor = up_w // orig_w if orig_w > 0 else 1

    # Clamp crop_size to fit in original
    actual_crop = min(crop_size, orig_w, orig_h)

    # Center crop coordinates in original
    cx = orig_w // 2
    cy = orig_h // 2
    half = actual_crop // 2
    x1 = max(0, cx - half)
    y1 = max(0, cy - half)
    x2 = min(orig_w, x1 + actual_crop)
    y2 = min(orig_h, y1 + actual_crop)

    orig_crop = original.crop((x1, y1, x2, y2))

    # Corresponding region in upscaled image
    ux1 = x1 * scale_factor
    uy1 = y1 * scale_factor
    ux2 = x2 * scale_factor
    uy2 = y2 * scale_factor
    up_crop = upscaled.crop((ux1, uy1, ux2, uy2))

    # Scale both crops to display size
    display_size = actual_crop * zoom
    orig_zoomed = orig_crop.resize((display_size, display_size), Image.NEAREST)
    up_zoomed = up_crop.resize((display_size, display_size), Image.NEAREST)

    total_w = display_size * 2 + DIVIDER_WIDTH
    total_h = display_size + LABEL_HEIGHT

    canvas = Image.new('RGBA', (total_w, total_h), LABEL_BG)
    draw = ImageDraw.Draw(canvas)

    font = find_font(16)
    small_font = find_font(12)

    left_label = f"ORIGINAL (nearest {zoom}x)"
    right_label = f"UPSCALED (detail)"

    draw.text((display_size // 2, LABEL_HEIGHT // 2), left_label,
              fill=LABEL_COLOR, font=font, anchor="mm")
    draw.text((display_size + DIVIDER_WIDTH + display_size // 2, LABEL_HEIGHT // 2),
              right_label, fill=(220, 38, 38), font=font, anchor="mm")

    draw.text((total_w // 2, LABEL_HEIGHT - 2),
              f"{texture_name} — center {actual_crop}x{actual_crop}px crop",
              fill=(100, 100, 100), font=small_font, anchor="mb")

    canvas.paste(orig_zoomed, (0, LABEL_HEIGHT))
    canvas.paste(up_zoomed, (display_size + DIVIDER_WIDTH, LABEL_HEIGHT))

    draw.rectangle(
        [display_size, LABEL_HEIGHT,
         display_size + DIVIDER_WIDTH - 1, total_h],
        fill=DIVIDER_COLOR
    )

    if out_format == 'jpg':
        canvas = canvas.convert('RGB')

    return canvas


def format_size(size_bytes: int) -> str:
    """Format file size in human-readable form."""
    if size_bytes < 1024:
        return f"{size_bytes} B"
    elif size_bytes < 1024 * 1024:
        return f"{size_bytes / 1024:.1f} KB"
    else:
        return f"{size_bytes / (1024 * 1024):.2f} MB"


def _escape_html(text: str) -> str:
    """Escape HTML special characters."""
    return (text
            .replace('&', '&amp;')
            .replace('<', '&lt;')
            .replace('>', '&gt;')
            .replace('"', '&quot;'))


def generate_html_gallery(pairs_data: list, output_dir: Path):
    """Generate a self-contained HTML gallery with dark horror theme.

    Args:
        pairs_data: List of dicts with comparison metadata.
        output_dir: Directory where gallery.html will be written.
    """
    # Group by category
    categories = {}
    total_orig_size = 0
    total_up_size = 0

    for item in pairs_data:
        cat = item['category']
        if cat not in categories:
            categories[cat] = []
        categories[cat].append(item)
        total_orig_size += item['orig_file_size']
        total_up_size += item['up_file_size']

    total_count = len(pairs_data)
    avg_ratio = (total_up_size / total_orig_size) if total_orig_size > 0 else 0

    cat_count = len(categories)

    # Build HTML
    html_parts = []

    html_parts.append(f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>KF1 Texture Upscale Comparison</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Rajdhani:wght@400;600;700&display=swap" rel="stylesheet">
<style>
  *, *::before, *::after {{ box-sizing: border-box; margin: 0; padding: 0; }}

  body {{
    background: #1a1a1a;
    color: #e0e0e0;
    font-family: 'Rajdhani', sans-serif;
    font-size: 16px;
    line-height: 1.5;
    min-height: 100vh;
  }}

  ::-webkit-scrollbar {{ width: 8px; }}
  ::-webkit-scrollbar-track {{ background: #1a1a1a; }}
  ::-webkit-scrollbar-thumb {{ background: #dc2626; border-radius: 4px; }}
  ::-webkit-scrollbar-thumb:hover {{ background: #b91c1c; }}
  ::selection {{ background-color: #dc2626; color: white; }}

  h1, h2, h3 {{
    font-family: 'Orbitron', monospace;
    color: #dc2626;
  }}

  .container {{
    max-width: 1400px;
    margin: 0 auto;
    padding: 24px;
  }}

  header {{
    text-align: center;
    padding: 40px 24px 32px;
    background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%);
    border-bottom: 2px solid #8B0000;
    margin-bottom: 32px;
  }}

  header h1 {{
    font-size: 2rem;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    text-shadow: 0 0 20px rgba(220, 38, 38, 0.3);
    margin-bottom: 8px;
  }}

  header p {{
    color: #9ca3af;
    font-size: 1.1rem;
  }}

  .stats-grid {{
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
    margin-bottom: 40px;
  }}

  .stat-card {{
    background: #000;
    border: 1px solid #333;
    border-radius: 8px;
    padding: 20px;
    text-align: center;
    transition: border-color 0.2s, box-shadow 0.2s;
  }}

  .stat-card:hover {{
    border-color: #8B0000;
    box-shadow: 0 0 20px rgba(220, 38, 38, 0.15);
  }}

  .stat-value {{
    font-family: 'Orbitron', monospace;
    font-size: 2rem;
    font-weight: 700;
    color: #dc2626;
    display: block;
  }}

  .stat-label {{
    color: #9ca3af;
    font-size: 0.9rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-top: 4px;
  }}

  .category-section {{
    margin-bottom: 32px;
    border: 1px solid #333;
    border-radius: 8px;
    overflow: hidden;
    background: #000;
  }}

  .category-header {{
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    cursor: pointer;
    background: linear-gradient(135deg, #111 0%, #000 100%);
    border-bottom: 1px solid #333;
    user-select: none;
    transition: background 0.2s;
  }}

  .category-header:hover {{
    background: linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%);
  }}

  .category-header h2 {{
    font-size: 1.3rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }}

  .category-count {{
    font-family: 'Orbitron', monospace;
    color: #9ca3af;
    font-size: 0.9rem;
  }}

  .toggle-icon {{
    color: #dc2626;
    font-size: 1.4rem;
    transition: transform 0.3s;
    display: inline-block;
  }}

  .toggle-icon.collapsed {{
    transform: rotate(-90deg);
  }}

  .category-content {{
    padding: 16px;
  }}

  .category-content.collapsed {{
    display: none;
  }}

  .texture-card {{
    background: #111;
    border: 1px solid #222;
    border-radius: 6px;
    margin-bottom: 16px;
    overflow: hidden;
    transition: border-color 0.2s;
  }}

  .texture-card:hover {{
    border-color: #4A0000;
  }}

  .texture-info {{
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    background: #0a0a0a;
    border-bottom: 1px solid #222;
    flex-wrap: wrap;
    gap: 8px;
  }}

  .texture-name {{
    font-family: 'Orbitron', monospace;
    font-size: 1rem;
    color: #e0e0e0;
    font-weight: 700;
  }}

  .texture-meta {{
    display: flex;
    gap: 16px;
    font-size: 0.85rem;
    color: #9ca3af;
    flex-wrap: wrap;
  }}

  .texture-meta span {{
    white-space: nowrap;
  }}

  .texture-meta .size-increase {{
    color: #dc2626;
    font-weight: 600;
  }}

  .comparison-images {{
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    padding: 12px;
  }}

  .comparison-images a {{
    display: block;
    text-decoration: none;
    border: 1px solid #222;
    border-radius: 4px;
    overflow: hidden;
    transition: border-color 0.2s, box-shadow 0.2s;
  }}

  .comparison-images a:hover {{
    border-color: #8B0000;
    box-shadow: 0 4px 20px rgba(139, 0, 0, 0.3);
  }}

  .comparison-images img {{
    width: 100%;
    height: auto;
    display: block;
  }}

  .comparison-images .img-label {{
    display: block;
    text-align: center;
    padding: 6px;
    background: #0a0a0a;
    color: #9ca3af;
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }}

  footer {{
    text-align: center;
    padding: 32px 24px;
    color: #4b5563;
    font-size: 0.85rem;
    border-top: 1px solid #222;
    margin-top: 40px;
  }}

  @media (max-width: 768px) {{
    .comparison-images {{
      grid-template-columns: 1fr;
    }}
    header h1 {{
      font-size: 1.4rem;
    }}
    .stats-grid {{
      grid-template-columns: repeat(2, 1fr);
    }}
  }}
</style>
</head>
<body>

<header>
  <h1>KF1 Texture Upscale Comparison</h1>
  <p>Original vs AI-upscaled textures &mdash; visual quality comparison</p>
</header>

<div class="container">

  <div class="stats-grid">
    <div class="stat-card">
      <span class="stat-value">{total_count}</span>
      <div class="stat-label">Textures Compared</div>
    </div>
    <div class="stat-card">
      <span class="stat-value">{cat_count}</span>
      <div class="stat-label">Categories</div>
    </div>
    <div class="stat-card">
      <span class="stat-value">{_escape_html(format_size(total_orig_size))}</span>
      <div class="stat-label">Original Total Size</div>
    </div>
    <div class="stat-card">
      <span class="stat-value">{_escape_html(format_size(total_up_size))}</span>
      <div class="stat-label">Upscaled Total Size</div>
    </div>
    <div class="stat-card">
      <span class="stat-value">{avg_ratio:.1f}x</span>
      <div class="stat-label">Avg File Size Ratio</div>
    </div>
  </div>
""")

    # Category sections
    for cat in sorted(categories.keys()):
        items = categories[cat]
        cat_orig = sum(i['orig_file_size'] for i in items)
        cat_up = sum(i['up_file_size'] for i in items)
        cat_label = _escape_html(cat.capitalize())
        section_id = f"cat-{cat}"

        html_parts.append(f"""
  <div class="category-section">
    <div class="category-header" onclick="toggleCategory('{section_id}')">
      <div>
        <h2>{cat_label}</h2>
        <span class="category-count">{len(items)} textures &mdash; {_escape_html(format_size(cat_orig))} &rarr; {_escape_html(format_size(cat_up))}</span>
      </div>
      <span class="toggle-icon" id="icon-{section_id}">&#9660;</span>
    </div>
    <div class="category-content" id="{section_id}">
""")

        for item in sorted(items, key=lambda x: x['name']):
            size_ratio = (item['up_file_size'] / item['orig_file_size']
                          if item['orig_file_size'] > 0 else 0)
            sidebyside_rel = os.path.relpath(
                item['sidebyside_path'], output_dir
            ).replace('\\', '/')
            detail_rel = os.path.relpath(
                item['detail_path'], output_dir
            ).replace('\\', '/')

            safe_name = _escape_html(item['name'])
            safe_sbs = _escape_html(sidebyside_rel)
            safe_detail = _escape_html(detail_rel)

            html_parts.append(f"""
      <div class="texture-card">
        <div class="texture-info">
          <span class="texture-name">{safe_name}</span>
          <div class="texture-meta">
            <span>Original: {item['orig_w']}x{item['orig_h']}</span>
            <span>Upscaled: {item['up_w']}x{item['up_h']}</span>
            <span>{_escape_html(format_size(item['orig_file_size']))} &rarr; {_escape_html(format_size(item['up_file_size']))}</span>
            <span class="size-increase">{size_ratio:.1f}x</span>
          </div>
        </div>
        <div class="comparison-images">
          <a href="{safe_sbs}" target="_blank">
            <img src="{safe_sbs}" alt="{safe_name} side-by-side" loading="lazy">
            <span class="img-label">Side by Side</span>
          </a>
          <a href="{safe_detail}" target="_blank">
            <img src="{safe_detail}" alt="{safe_name} detail crop" loading="lazy">
            <span class="img-label">Detail Crop</span>
          </a>
        </div>
      </div>
""")

        html_parts.append("""
    </div>
  </div>
""")

    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M")
    html_parts.append(f"""
</div>

<footer>
  Generated on {timestamp} by compare_textures.py &mdash; Uliunai.lt KF1 Texture Upscale Pipeline
</footer>

<script>
function toggleCategory(id) {{
  var content = document.getElementById(id);
  var icon = document.getElementById('icon-' + id);
  if (content.classList.contains('collapsed')) {{
    content.classList.remove('collapsed');
    icon.classList.remove('collapsed');
  }} else {{
    content.classList.add('collapsed');
    icon.classList.add('collapsed');
  }}
}}
</script>

</body>
</html>
""")

    gallery_path = output_dir / "gallery.html"
    gallery_path.write_text("".join(html_parts), encoding="utf-8")
    logger.info("HTML gallery written to %s", gallery_path)
    return gallery_path


def process_pair(pair: dict, output_dir: Path, zoom: int, crop_size: int,
                 out_format: str) -> dict:
    """Process a single texture pair: generate comparisons and collect metadata.

    Returns a dict with all metadata needed for the HTML gallery, or None on error.
    """
    name = pair['name']
    category = pair['category']
    orig_path = pair['original_path']
    up_path = pair['upscaled_path']

    try:
        original = Image.open(orig_path).convert('RGBA')
        upscaled = Image.open(up_path).convert('RGBA')
    except Exception as e:
        logger.error("Failed to open %s/%s: %s", category, name, e)
        return None

    orig_w, orig_h = original.size
    up_w, up_h = upscaled.size

    ext = f".{out_format}"

    # Side-by-side
    sbs_dir = output_dir / "sidebyside" / category
    sbs_dir.mkdir(parents=True, exist_ok=True)
    sbs_path = sbs_dir / f"{name}_compare{ext}"
    sbs_img = create_sidebyside(original, upscaled, name, out_format)
    if out_format == 'jpg':
        sbs_img.save(sbs_path, 'JPEG', quality=92)
    else:
        sbs_img.save(sbs_path, 'PNG')

    # Detail crop
    detail_dir = output_dir / "detail" / category
    detail_dir.mkdir(parents=True, exist_ok=True)
    detail_path = detail_dir / f"{name}_detail{ext}"
    detail_img = create_detail_crop(original, upscaled, name, crop_size, zoom, out_format)
    if out_format == 'jpg':
        detail_img.save(detail_path, 'JPEG', quality=92)
    else:
        detail_img.save(detail_path, 'PNG')

    orig_file_size = orig_path.stat().st_size
    up_file_size = up_path.stat().st_size

    return {
        'name': name,
        'category': category,
        'orig_w': orig_w,
        'orig_h': orig_h,
        'up_w': up_w,
        'up_h': up_h,
        'orig_file_size': orig_file_size,
        'up_file_size': up_file_size,
        'sidebyside_path': sbs_path,
        'detail_path': detail_path,
    }


def print_statistics(pairs_data: list):
    """Print per-category and overall statistics to stdout."""
    if not pairs_data:
        print("\nNo textures were processed.")
        return

    categories = {}
    for item in pairs_data:
        cat = item['category']
        if cat not in categories:
            categories[cat] = []
        categories[cat].append(item)

    divider = "-" * 80
    print(f"\n{divider}")
    print("  COMPARISON STATISTICS")
    print(divider)

    grand_orig = 0
    grand_up = 0
    grand_count = 0

    for cat in sorted(categories.keys()):
        items = categories[cat]
        cat_orig = sum(i['orig_file_size'] for i in items)
        cat_up = sum(i['up_file_size'] for i in items)
        cat_ratio = cat_up / cat_orig if cat_orig > 0 else 0

        print(f"\n  [{cat.upper()}] — {len(items)} textures")
        print(f"    Original total:  {format_size(cat_orig)}")
        print(f"    Upscaled total:  {format_size(cat_up)}")
        print(f"    Size ratio:      {cat_ratio:.1f}x")
        print()

        for item in sorted(items, key=lambda x: x['name']):
            ratio = (item['up_file_size'] / item['orig_file_size']
                     if item['orig_file_size'] > 0 else 0)
            print(f"    {item['name']:40s}  "
                  f"{item['orig_w']:>4d}x{item['orig_h']:<4d} -> "
                  f"{item['up_w']:>4d}x{item['up_h']:<4d}  "
                  f"{format_size(item['orig_file_size']):>10s} -> "
                  f"{format_size(item['up_file_size']):>10s}  "
                  f"({ratio:.1f}x)")

        grand_orig += cat_orig
        grand_up += cat_up
        grand_count += len(items)

    grand_ratio = grand_up / grand_orig if grand_orig > 0 else 0

    print(f"\n{divider}")
    print(f"  TOTALS: {grand_count} textures across {len(categories)} categories")
    print(f"    Original:  {format_size(grand_orig)}")
    print(f"    Upscaled:  {format_size(grand_up)}")
    print(f"    Ratio:     {grand_ratio:.1f}x")
    print(divider)


def main():
    parser = argparse.ArgumentParser(
        description='Generate visual comparisons of original vs AI-upscaled KF1 textures.',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Compare all textures with defaults:
  python compare_textures.py

  # Compare only monster textures with higher zoom:
  python compare_textures.py --category monsters --zoom 6

  # Custom directories:
  python compare_textures.py --original ./orig --upscaled ./4x --output ./results

  # JPEG output, no HTML gallery:
  python compare_textures.py --format jpg --no-html
""",
    )
    parser.add_argument('--original', type=Path, default=Path('./original'),
                        help='Directory with original textures (default: ./original)')
    parser.add_argument('--upscaled', type=Path, default=Path('./upscaled'),
                        help='Directory with upscaled textures (default: ./upscaled)')
    parser.add_argument('--output', type=Path, default=Path('./comparisons'),
                        help='Output directory for comparisons (default: ./comparisons)')
    parser.add_argument('--category', type=str, default=None,
                        choices=CATEGORIES,
                        help='Only compare a specific category')
    parser.add_argument('--zoom', type=int, default=4,
                        help='Zoom factor for detail crop comparisons (default: 4)')
    parser.add_argument('--crop-size', type=int, default=64,
                        help='Size of the detail crop region in original pixels (default: 64)')
    parser.add_argument('--html', dest='html', action='store_true', default=True,
                        help='Generate HTML gallery (default: true)')
    parser.add_argument('--no-html', dest='html', action='store_false',
                        help='Skip HTML gallery generation')
    parser.add_argument('--format', type=str, default='png', choices=['png', 'jpg'],
                        help='Output image format (default: png)')
    parser.add_argument('--verbose', '-v', action='store_true',
                        help='Enable verbose logging')

    args = parser.parse_args()

    logging.basicConfig(
        level=logging.DEBUG if args.verbose else logging.INFO,
        format='%(levelname)s: %(message)s',
    )

    original_dir = args.original.resolve()
    upscaled_dir = args.upscaled.resolve()
    output_dir = args.output.resolve()

    if not original_dir.is_dir():
        logger.error("Original directory not found: %s", original_dir)
        sys.exit(1)
    if not upscaled_dir.is_dir():
        logger.error("Upscaled directory not found: %s", upscaled_dir)
        sys.exit(1)

    output_dir.mkdir(parents=True, exist_ok=True)

    logger.info("Original dir:  %s", original_dir)
    logger.info("Upscaled dir:  %s", upscaled_dir)
    logger.info("Output dir:    %s", output_dir)
    logger.info("Format: %s | Zoom: %dx | Crop size: %dpx",
                args.format, args.zoom, args.crop_size)

    # Collect texture pairs
    pairs = collect_texture_pairs(original_dir, upscaled_dir, args.category)

    if not pairs:
        logger.warning("No matching texture pairs found. Nothing to do.")
        sys.exit(0)

    logger.info("Found %d texture pairs to compare", len(pairs))

    # Process each pair
    results = []
    for i, pair in enumerate(pairs, 1):
        logger.info("[%d/%d] %s/%s", i, len(pairs), pair['category'], pair['name'])
        result = process_pair(pair, output_dir, args.zoom, args.crop_size, args.format)
        if result:
            results.append(result)

    # Print statistics
    print_statistics(results)

    # Generate HTML gallery
    if args.html and results:
        gallery_path = generate_html_gallery(results, output_dir)
        print(f"\nHTML gallery: {gallery_path}")

    print(f"\nDone! {len(results)}/{len(pairs)} comparisons generated in {output_dir}")


if __name__ == '__main__':
    main()
