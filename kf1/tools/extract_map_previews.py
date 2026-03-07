"""
Extract map preview textures from KF1 .rom map files (UE2 package format).

Parses the Unreal Engine 2 binary package format used by Killing Floor 1,
finds embedded Screenshot/preview Texture objects, decodes DXT1/DXT3/DXT5/RGBA8
pixel data, and saves as PNG files.

Requirements:
    pip install Pillow

Usage:
    # Extract from default KF1 install path (all maps):
    python extract_map_previews.py

    # Extract from a custom maps directory:
    python extract_map_previews.py --maps-dir "D:/path/to/Maps"

    # Extract a single .rom file:
    python extract_map_previews.py --file "D:/path/to/KF-CustomMap.rom"

    # Specify output directory:
    python extract_map_previews.py --output "./my_previews"

    # Force re-extract (overwrite existing):
    python extract_map_previews.py --force

After extraction, upload to the server:
    # Option A: SCP directly to server uploads dir
    scp extracted_previews/*.png hetzner:/home/uliunai/kf1/map-images/uploads/

    # Option B: Use the map image API (requires basicauth credentials)
    curl -X POST -H "Content-Type: image/png" --data-binary @KF-MapName.png \\
        https://kf1-uliunai.fezle.io/map-api/upload/KF-MapName

Notes:
    - KF1 uses a modified UE2 signature (0x9E2A83C2 vs standard 0x9E2A83C1)
    - Map previews are typically 512x256 DXT1 textures
    - The script searches for Texture exports named Screenshot*, *preview*, etc.
    - Some maps (e.g. KF-Biohazard) use non-obvious names like "pre1" or "HHPre"
      which won't be auto-detected. Use --texture-name to specify manually.
    - KF-Menu is the main menu screen, not a playable map (has no preview).

Known texture names for stock maps that don't match the auto-detect pattern:
    KF-Biohazard:        pre1
    KF-Crash:            crash1, crash2, crash3
    KF-Hospitalhorrors:  HHPre
"""
import argparse
import struct
import os
import sys
from pathlib import Path

KF_SIGNATURE = 0x9E2A83C2
UE2_SIGNATURE = 0x9E2A83C1

DEFAULT_MAPS_DIR = Path(r"D:\SteamLibrary\steamapps\common\KillingFloorBeta\Maps")
DEFAULT_OUTPUT_DIR = Path(__file__).parent / "extracted_previews"

# Manual overrides for maps whose preview texture has a non-standard name.
# Add entries here when community maps use unusual texture names.
TEXTURE_NAME_OVERRIDES = {
    'KF-Biohazard': ['pre1'],
    'KF-Crash': ['crash1', 'crash2', 'crash3'],
    'KF-Hospitalhorrors': ['HHPre'],
    'KF-Forgotten': ['ForgottenTitleShot3', 'ForgottenTitleShot1'],
    'KF-Hell': ['HellTitleShot4', 'HellTitleShot1'],
}


class BinaryReader:
    def __init__(self, data: bytes):
        self.data = data
        self.pos = 0

    def seek(self, pos):
        self.pos = pos

    def read_bytes(self, n):
        result = self.data[self.pos:self.pos + n]
        self.pos += n
        return result

    def read_uint32(self):
        val = struct.unpack_from('<I', self.data, self.pos)[0]
        self.pos += 4
        return val

    def read_int32(self):
        val = struct.unpack_from('<i', self.data, self.pos)[0]
        self.pos += 4
        return val

    def read_uint16(self):
        val = struct.unpack_from('<H', self.data, self.pos)[0]
        self.pos += 2
        return val

    def read_uint8(self):
        val = self.data[self.pos]
        self.pos += 1
        return val

    def read_compact_index(self):
        b0 = self.read_uint8()
        negative = bool(b0 & 0x80)
        more = bool(b0 & 0x40)
        value = b0 & 0x3F
        shift = 6
        while more:
            b = self.read_uint8()
            more = bool(b & 0x80)
            value |= (b & 0x7F) << shift
            shift += 7
            if shift > 35:
                break
        if negative:
            value = -value
        return value

    def read_fstring(self):
        length = self.read_compact_index()
        if length <= 0:
            return ""
        s = self.data[self.pos:self.pos + length]
        self.pos += length
        if s and s[-1] == 0:
            s = s[:-1]
        return s.decode('latin-1', errors='replace')


def parse_package(filepath, texture_name=None):
    """Parse a .rom/.utx package and extract the preview/screenshot texture.

    Args:
        filepath: Path to the .rom or .utx file.
        texture_name: If set, look for this exact texture name instead of auto-detecting.

    Returns:
        dict with 'width', 'height', 'pixels' or None if not found.
    """
    with open(filepath, 'rb') as f:
        data = f.read()

    r = BinaryReader(data)
    sig = r.read_uint32()
    if sig not in (KF_SIGNATURE, UE2_SIGNATURE):
        print(f"  Unknown signature: 0x{sig:08X}")
        return None

    version = r.read_uint16()
    licensee = r.read_uint16()
    pkg_flags = r.read_uint32()
    name_count = r.read_uint32()
    name_offset = r.read_uint32()
    export_count = r.read_uint32()
    export_offset = r.read_uint32()
    import_count = r.read_uint32()
    import_offset = r.read_uint32()

    r.read_bytes(16)  # GUID
    gen_count = r.read_uint32()
    for _ in range(gen_count):
        r.read_uint32()
        r.read_uint32()

    # Name table
    names = []
    r.seek(name_offset)
    for _ in range(name_count):
        names.append(r.read_fstring())
        r.read_uint32()

    # Import table
    imports = []
    r.seek(import_offset)
    for _ in range(import_count):
        class_package = r.read_compact_index()
        class_name = r.read_compact_index()
        package_idx = r.read_int32()
        object_name = r.read_compact_index()
        imports.append({
            'class_name': names[class_name] if class_name < len(names) else '?',
            'object_name': names[object_name] if object_name < len(names) else '?',
        })

    # Export table
    exports = []
    r.seek(export_offset)
    for _ in range(export_count):
        class_index = r.read_compact_index()
        super_index = r.read_compact_index()
        package = r.read_int32()
        object_name = r.read_compact_index()
        object_flags = r.read_uint32()
        serial_size = r.read_compact_index()
        serial_offset = r.read_compact_index() if serial_size > 0 else 0

        obj_name = names[object_name] if object_name < len(names) else '?'

        # Resolve class: negative = import (use object_name!), positive = export, zero = Class
        if class_index < 0:
            imp_idx = -class_index - 1
            cls = imports[imp_idx]['object_name'] if imp_idx < len(imports) else '?'
        elif class_index > 0:
            cls = f'Export[{class_index - 1}]'
        else:
            cls = 'Class'

        exports.append({
            'class_name': cls,
            'name': obj_name,
            'serial_size': serial_size,
            'serial_offset': serial_offset,
        })

    # If a specific texture name was requested, find it directly
    if texture_name:
        for exp in exports:
            if exp['name'] == texture_name and exp['class_name'] == 'Texture':
                print(f"  Found (manual): {exp['name']} (size={exp['serial_size']}, offset=0x{exp['serial_offset']:X})")
                return extract_texture(r, exp, names)
        print(f"  Texture '{texture_name}' not found")
        return None

    # Auto-detect: find Screenshot/preview Texture export
    # Priority: 1) name starts with Screenshot, 2) contains 'preview', 3) contains 'screenshot'
    candidates = []
    for exp in exports:
        if exp['class_name'] != 'Texture' or exp['serial_size'] < 1000:
            continue
        name_lower = exp['name'].lower()
        if name_lower.startswith('screenshot'):
            candidates.insert(0, (0, exp))
        elif 'preview' in name_lower:
            candidates.append((1, exp))
        elif 'screenshot' in name_lower:
            candidates.append((2, exp))

    if not candidates:
        print(f"  No Screenshot/preview Texture found (use --texture-name to specify manually)")
        return None

    candidates.sort(key=lambda x: x[0])
    screenshot_export = candidates[0][1]

    print(f"  Found: {screenshot_export['name']} (class={screenshot_export['class_name']}, size={screenshot_export['serial_size']}, offset=0x{screenshot_export['serial_offset']:X})")

    return extract_texture(r, screenshot_export, names)


def extract_texture(r, export, names):
    r.seek(export['serial_offset'])
    end_offset = export['serial_offset'] + export['serial_size']

    tex_format = None
    tex_usize = None
    tex_vsize = None

    # Parse properties
    while r.pos < end_offset:
        name_idx = r.read_compact_index()
        if name_idx < 0 or name_idx >= len(names):
            break
        prop_name = names[name_idx]
        if prop_name == 'None':
            break

        info = r.read_uint8()
        prop_type = info & 0x0F
        prop_size_type = (info >> 4) & 0x07
        is_array = bool(info & 0x80)

        if prop_size_type == 0: size = 1
        elif prop_size_type == 1: size = 2
        elif prop_size_type == 2: size = 4
        elif prop_size_type == 3: size = 12
        elif prop_size_type == 4: size = 16
        elif prop_size_type == 5: size = r.read_uint8()
        elif prop_size_type == 6: size = r.read_uint16()
        elif prop_size_type == 7: size = r.read_uint32()
        else: size = 0

        if prop_type == 10:  # StructProperty
            r.read_compact_index()
        if is_array and prop_type != 3:
            r.read_compact_index()

        prop_data_start = r.pos
        if prop_name == 'Format' and size == 1:
            tex_format = r.data[r.pos]
        elif prop_name == 'USize' and size == 4:
            tex_usize = struct.unpack_from('<I', r.data, r.pos)[0]
        elif prop_name == 'VSize' and size == 4:
            tex_vsize = struct.unpack_from('<I', r.data, r.pos)[0]
        elif prop_name == 'UClamp' and tex_usize is None and size == 4:
            tex_usize = struct.unpack_from('<I', r.data, r.pos)[0]
        elif prop_name == 'VClamp' and tex_vsize is None and size == 4:
            tex_vsize = struct.unpack_from('<I', r.data, r.pos)[0]
        r.seek(prop_data_start + size)

    FORMAT_NAMES = {0: 'P8', 1: 'RGBA7', 2: 'RGB16', 3: 'DXT1', 4: 'RGB8', 5: 'RGBA8', 7: 'DXT3', 8: 'DXT5', 9: 'DXT5'}
    if tex_format is not None:
        print(f"  Format: {FORMAT_NAMES.get(tex_format, f'?({tex_format})')}, Size: {tex_usize}x{tex_vsize}")

    mip_count = r.read_compact_index()
    print(f"  Mipmap count: {mip_count}")
    if mip_count <= 0 or mip_count > 16:
        return None

    for mip_idx in range(mip_count):
        if r.pos >= end_offset:
            break
        r.read_uint32()  # offset field
        mip_data_size = r.read_compact_index()
        if mip_data_size <= 0 or mip_data_size > 50_000_000:
            break
        mip_data = r.read_bytes(mip_data_size)
        mip_width = r.read_uint32()
        mip_height = r.read_uint32()
        r.read_uint8()  # UBits
        r.read_uint8()  # VBits

        if mip_idx == 0:
            print(f"  Mip 0: {mip_width}x{mip_height}, data: {mip_data_size} bytes")
            if mip_width == 0 or mip_height == 0:
                return None

            pixels = decode_pixels(mip_data, mip_width, mip_height, tex_format)
            if pixels is None:
                return None
            return {'width': mip_width, 'height': mip_height, 'pixels': pixels}
    return None


def decode_pixels(data, width, height, fmt):
    if fmt == 3:  # DXT1
        return decode_dxt1(data, width, height)
    elif fmt == 7:  # DXT3
        return decode_dxt(data, width, height, 16, decode_dxt3_block)
    elif fmt == 8 or fmt == 9:  # DXT5 (format 8 in KF1 variant, 9 in standard UE2)
        return decode_dxt(data, width, height, 16, decode_dxt5_block)
    elif fmt == 5:  # RGBA8
        pixels = []
        for j in range(0, min(len(data), width * height * 4), 4):
            b, g, red, a = data[j], data[j+1], data[j+2], data[j+3]
            pixels.append((red, g, b, a))
        while len(pixels) < width * height:
            pixels.append((0, 0, 0, 255))
        return pixels
    elif fmt == 4:  # RGB8
        pixels = []
        for j in range(0, min(len(data), width * height * 3), 3):
            pixels.append((data[j], data[j+1], data[j+2], 255))
        while len(pixels) < width * height:
            pixels.append((0, 0, 0, 255))
        return pixels
    else:
        print(f"  Unsupported format: {fmt}")
        return None


def decode_rgb565(c):
    r = ((c >> 11) & 0x1F) * 255 // 31
    g = ((c >> 5) & 0x3F) * 255 // 63
    b = (c & 0x1F) * 255 // 31
    return (r, g, b, 255)


def decode_dxt1_block(block):
    c0 = struct.unpack_from('<H', block, 0)[0]
    c1 = struct.unpack_from('<H', block, 2)[0]
    bits = struct.unpack_from('<I', block, 4)[0]
    colors = [decode_rgb565(c0), decode_rgb565(c1)]
    if c0 > c1:
        colors.append(tuple((2 * colors[0][i] + colors[1][i]) // 3 for i in range(3)) + (255,))
        colors.append(tuple((colors[0][i] + 2 * colors[1][i]) // 3 for i in range(3)) + (255,))
    else:
        colors.append(tuple((colors[0][i] + colors[1][i]) // 2 for i in range(3)) + (255,))
        colors.append((0, 0, 0, 0))
    pixels = []
    for y in range(4):
        for x in range(4):
            idx = (bits >> (2 * (4 * y + x))) & 0x03
            pixels.append(colors[idx])
    return pixels


def decode_dxt3_block(block):
    alpha_data = block[0:8]
    alphas = []
    for i in range(16):
        byte_idx = i // 2
        a = (alpha_data[byte_idx] & 0x0F) if i % 2 == 0 else ((alpha_data[byte_idx] >> 4) & 0x0F)
        alphas.append(a * 17)
    color_pixels = decode_dxt1_block(block[8:16])
    return [(r, g, b, alphas[i]) for i, (r, g, b, _) in enumerate(color_pixels)]


def decode_dxt5_block(block):
    a0, a1 = block[0], block[1]
    alphas = [a0, a1]
    if a0 > a1:
        for i in range(1, 7):
            alphas.append(((7 - i) * a0 + i * a1) // 7)
    else:
        for i in range(1, 5):
            alphas.append(((5 - i) * a0 + i * a1) // 5)
        alphas.extend([0, 255])
    alpha_bits = sum(block[2 + i] << (8 * i) for i in range(6))
    alpha_indices = [(alpha_bits >> (3 * i)) & 0x07 for i in range(16)]
    color_pixels = decode_dxt1_block(block[8:16])
    return [(r, g, b, alphas[alpha_indices[i]] if alpha_indices[i] < len(alphas) else 255)
            for i, (r, g, b, _) in enumerate(color_pixels)]


def decode_dxt1(data, width, height):
    return decode_dxt(data, width, height, 8, lambda b: decode_dxt1_block(b))


def decode_dxt(data, width, height, block_bytes, decoder):
    pixels = [(0, 0, 0, 255)] * (width * height)
    block_idx = 0
    for by in range(0, height, 4):
        for bx in range(0, width, 4):
            if block_idx + block_bytes > len(data):
                break
            block = data[block_idx:block_idx + block_bytes]
            block_idx += block_bytes
            block_pixels = decoder(block)
            for py in range(4):
                for px in range(4):
                    x, y = bx + px, by + py
                    if x < width and y < height:
                        pixels[y * width + x] = block_pixels[py * 4 + px]
    return pixels


def save_png(tex_data, output_path):
    from PIL import Image
    img = Image.new('RGBA', (tex_data['width'], tex_data['height']))
    img.putdata(tex_data['pixels'])
    img.save(output_path, 'PNG')
    print(f"  Saved: {output_path}")


def list_textures(filepath):
    """List all Texture exports in a package (useful for finding the right name)."""
    with open(filepath, 'rb') as f:
        data = f.read()

    r = BinaryReader(data)
    sig = r.read_uint32()
    if sig not in (KF_SIGNATURE, UE2_SIGNATURE):
        print(f"Unknown signature: 0x{sig:08X}")
        return

    r.read_uint16(); r.read_uint16(); r.read_uint32()
    name_count = r.read_uint32(); name_offset = r.read_uint32()
    export_count = r.read_uint32(); export_offset = r.read_uint32()
    import_count = r.read_uint32(); import_offset = r.read_uint32()
    r.read_bytes(16)
    gen_count = r.read_uint32()
    for _ in range(gen_count):
        r.read_uint32(); r.read_uint32()

    names = []
    r.seek(name_offset)
    for _ in range(name_count):
        names.append(r.read_fstring()); r.read_uint32()

    imports = []
    r.seek(import_offset)
    for _ in range(import_count):
        r.read_compact_index(); r.read_compact_index(); r.read_int32(); r.read_compact_index()
        imports.append(names[imports[-1]] if False else None)  # placeholder

    # Re-parse imports properly
    imports = []
    r.seek(import_offset)
    for _ in range(import_count):
        cp = r.read_compact_index(); cn = r.read_compact_index()
        r.read_int32(); on = r.read_compact_index()
        imports.append(names[on] if on < len(names) else '?')

    r.seek(export_offset)
    print(f"Texture exports in {filepath.name}:\n")
    for _ in range(export_count):
        ci = r.read_compact_index(); r.read_compact_index(); r.read_int32()
        on = r.read_compact_index(); r.read_uint32()
        ss = r.read_compact_index(); so = r.read_compact_index() if ss > 0 else 0
        cls = imports[-ci - 1] if ci < 0 and (-ci - 1) < len(imports) else '?'
        name = names[on] if on < len(names) else '?'
        if cls == 'Texture' and ss > 1000:
            print(f"  {name:40s}  size={ss:>8d}  offset=0x{so:X}")


def main():
    parser = argparse.ArgumentParser(
        description='Extract map preview textures from KF1 .rom files.',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Extract all maps from default KF1 install:
  python extract_map_previews.py

  # Extract from a custom directory (e.g. community maps):
  python extract_map_previews.py --maps-dir "D:/KF1Server/Maps"

  # Extract a single map file:
  python extract_map_previews.py --file KF-CustomMap.rom

  # If auto-detect fails, list textures then specify manually:
  python extract_map_previews.py --file KF-CustomMap.rom --list-textures
  python extract_map_previews.py --file KF-CustomMap.rom --texture-name "MyPreviewTex"

  # Force re-extract all (overwrite existing PNGs):
  python extract_map_previews.py --force
""",
    )
    parser.add_argument('--maps-dir', type=Path, default=DEFAULT_MAPS_DIR,
                        help='Directory containing .rom map files')
    parser.add_argument('--output', type=Path, default=DEFAULT_OUTPUT_DIR,
                        help='Output directory for extracted PNGs')
    parser.add_argument('--file', type=Path, default=None,
                        help='Extract from a single .rom file instead of a directory')
    parser.add_argument('--texture-name', type=str, default=None,
                        help='Exact texture name to extract (bypasses auto-detect)')
    parser.add_argument('--list-textures', action='store_true',
                        help='List all Texture exports in the package (for discovery)')
    parser.add_argument('--force', action='store_true',
                        help='Overwrite existing extracted PNGs')
    parser.add_argument('--no-overrides', action='store_true',
                        help='Skip built-in texture name overrides for stock maps')

    args = parser.parse_args()
    output_dir = args.output
    output_dir.mkdir(parents=True, exist_ok=True)

    # Single file mode
    if args.file:
        rom = Path(args.file)
        if not rom.exists():
            print(f"File not found: {rom}")
            sys.exit(1)

        if args.list_textures:
            list_textures(rom)
            return

        map_name = rom.stem
        print(f"Processing {map_name}...")
        tex_data = parse_package(rom, texture_name=args.texture_name)
        if tex_data:
            out_path = output_dir / f"{map_name}.png"
            save_png(tex_data, out_path)
        else:
            print(f"  Failed. Try: --list-textures to see available textures, then --texture-name")
            sys.exit(1)
        return

    # Batch mode
    rom_files = sorted(args.maps_dir.glob("KF-*.rom"))
    if not rom_files:
        print(f"No KF-*.rom files found in {args.maps_dir}")
        sys.exit(1)

    print(f"Found {len(rom_files)} map files\n")
    extracted = 0
    failed = []

    for rom in rom_files:
        map_name = rom.stem
        out_path = output_dir / f"{map_name}.png"

        if out_path.exists() and not args.force:
            print(f"{map_name}: already extracted, skipping (use --force to overwrite)")
            extracted += 1
            continue

        print(f"Processing {map_name}...")

        # Check for manual texture name override
        tex_name = args.texture_name
        if not tex_name and not args.no_overrides and map_name in TEXTURE_NAME_OVERRIDES:
            override_names = TEXTURE_NAME_OVERRIDES[map_name]
            # Try each override name
            for name in override_names:
                try:
                    tex_data = parse_package(rom, texture_name=name)
                    if tex_data:
                        save_png(tex_data, out_path)
                        extracted += 1
                        break
                except Exception as e:
                    print(f"  ERROR with override '{name}': {e}")
            else:
                failed.append(map_name)
            print()
            continue

        try:
            tex_data = parse_package(rom, texture_name=tex_name)
            if tex_data:
                save_png(tex_data, out_path)
                extracted += 1
            else:
                failed.append(map_name)
        except Exception as e:
            print(f"  ERROR: {e}")
            failed.append(map_name)
        print()

    print(f"\nDone! {extracted}/{len(rom_files)} map previews extracted to {output_dir}")
    if failed:
        print(f"\nFailed ({len(failed)}): {', '.join(failed)}")
        print("Tip: Use --file <map>.rom --list-textures to find the texture name,")
        print("     then --texture-name <name> to extract it.")


if __name__ == '__main__':
    main()
