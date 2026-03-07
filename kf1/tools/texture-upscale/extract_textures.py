"""
Batch-extract textures from Killing Floor 1 UE2 packages using umodel (UE Viewer).

Wraps the umodel command-line tool to export textures from .utx, .u, and .rom
package files into an organized directory structure suitable for AI upscaling.

Requirements:
    - umodel.exe (UE Viewer) on PATH or specified via --umodel
      Download: https://www.gildor.org/en/projects/umodel
    - No Python dependencies beyond stdlib

Usage:
    # Extract all known texture packages:
    python extract_textures.py --kf-path "D:/SteamLibrary/steamapps/common/KillingFloor"

    # Extract only proof-of-concept assets (shotgun, clot, BioticsLab):
    python extract_textures.py --poc

    # Extract only weapon textures:
    python extract_textures.py --category weapons

    # List packages without extracting:
    python extract_textures.py --list-only

    # Export as TGA instead of PNG:
    python extract_textures.py --format tga
"""

import argparse
import logging
import os
import shutil
import subprocess
import sys
from pathlib import Path

logger = logging.getLogger("extract_textures")

# ---------------------------------------------------------------------------
# Package registry: which files belong to which category
# ---------------------------------------------------------------------------

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
    ],
    # "maps" category is auto-discovered from the Maps/ subdirectory
}

# Proof-of-concept: minimal subset for quick validation
POC_ASSETS = {
    "weapons": ["KF_Weapons_Trip.utx"],
    "monsters": ["KFCharacters.utx"],
    "maps": ["KF-BioticsLab.rom"],
}

DEFAULT_KF_PATH = Path("D:/SteamLibrary/steamapps/common/KillingFloor")
DEFAULT_OUTPUT = Path("./original")
UMODEL_URL = "https://www.gildor.org/en/projects/umodel"


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def find_umodel(umodel_arg: str) -> Path | None:
    """Locate the umodel executable.

    Checks in order:
      1. The explicit path provided via --umodel
      2. PATH lookup via shutil.which
    Returns the resolved Path, or None if not found.
    """
    # If an explicit path was given, check it directly
    explicit = Path(umodel_arg)
    if explicit.is_file():
        return explicit.resolve()

    # Fall back to PATH lookup
    found = shutil.which(umodel_arg)
    if found:
        return Path(found).resolve()

    return None


def discover_map_packages(kf_path: Path) -> list[str]:
    """Auto-discover all .rom map files in the KF1 Maps/ directory."""
    maps_dir = kf_path / "Maps"
    if not maps_dir.is_dir():
        logger.warning("Maps directory not found: %s", maps_dir)
        return []

    rom_files = sorted(maps_dir.glob("KF-*.rom"))
    return [f.name for f in rom_files]


def resolve_package_path(package_name: str, kf_path: Path) -> Path | None:
    """Resolve a package filename to its full path within the KF1 directory.

    Searches in order: Textures/, System/, Maps/, then the root.
    Returns the full path if found, None otherwise.
    """
    # .rom files live in Maps/
    if package_name.lower().endswith(".rom"):
        candidate = kf_path / "Maps" / package_name
        if candidate.is_file():
            return candidate

    # .utx files live in Textures/
    if package_name.lower().endswith(".utx"):
        candidate = kf_path / "Textures" / package_name
        if candidate.is_file():
            return candidate

    # .u files live in System/
    if package_name.lower().endswith(".u"):
        candidate = kf_path / "System" / package_name
        if candidate.is_file():
            return candidate

    # Fallback: search common subdirectories
    for subdir in ["Textures", "System", "Maps", "Animations", "StaticMeshes", ""]:
        candidate = kf_path / subdir / package_name if subdir else kf_path / package_name
        if candidate.is_file():
            return candidate

    return None


def build_package_list(
    kf_path: Path,
    category: str,
    poc: bool,
) -> dict[str, list[str]]:
    """Build the mapping of category -> list of package filenames to process.

    Args:
        kf_path: Root KF1 install directory.
        category: One of 'weapons', 'monsters', 'maps', 'world', 'all'.
        poc: If True, use the minimal proof-of-concept subset.

    Returns:
        Dict mapping category name to list of package filenames.
    """
    if poc:
        return dict(POC_ASSETS)

    result: dict[str, list[str]] = {}

    if category in ("all", "weapons"):
        result["weapons"] = list(PACKAGES["weapons"])
    if category in ("all", "monsters"):
        result["monsters"] = list(PACKAGES["monsters"])
    if category in ("all", "world"):
        result["world"] = list(PACKAGES["world"])
    if category in ("all", "maps"):
        maps = discover_map_packages(kf_path)
        if maps:
            result["maps"] = maps
        else:
            logger.warning("No map packages discovered")

    return result


# ---------------------------------------------------------------------------
# Extraction
# ---------------------------------------------------------------------------

def extract_package(
    umodel: Path,
    package_path: Path,
    kf_path: Path,
    out_dir: Path,
    fmt: str,
) -> bool:
    """Run umodel to export textures from a single package.

    Args:
        umodel: Path to umodel.exe.
        package_path: Full path to the package file.
        kf_path: KF1 install root (used as umodel -path).
        out_dir: Output directory for this package.
        fmt: Export format ('png' or 'tga').

    Returns:
        True on success, False on failure.
    """
    out_dir.mkdir(parents=True, exist_ok=True)

    cmd = [
        str(umodel),
        "-export",
        f"-{fmt}",
        f"-path={kf_path}",
        "-game=kf",
        f"-out={out_dir}",
        str(package_path),
    ]

    logger.debug("Running: %s", " ".join(cmd))

    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=300,
        )
    except subprocess.TimeoutExpired:
        logger.error("  Timed out after 300s: %s", package_path.name)
        return False
    except OSError as exc:
        logger.error("  Failed to execute umodel: %s", exc)
        return False

    if result.returncode != 0:
        logger.error(
            "  umodel exited with code %d for %s",
            result.returncode,
            package_path.name,
        )
        if result.stderr.strip():
            for line in result.stderr.strip().splitlines():
                logger.error("    stderr: %s", line)
        if result.stdout.strip():
            for line in result.stdout.strip().splitlines():
                logger.debug("    stdout: %s", line)
        return False

    # Log stdout (umodel prints progress info there)
    if result.stdout.strip():
        for line in result.stdout.strip().splitlines():
            logger.debug("    %s", line)

    return True


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> int:
    parser = argparse.ArgumentParser(
        description="Batch-extract textures from KF1 packages using umodel.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=f"""\
examples:
  # Extract all texture packages:
  python extract_textures.py

  # Proof-of-concept (shotgun + clot + BioticsLab only):
  python extract_textures.py --poc

  # Weapons only, TGA format:
  python extract_textures.py --category weapons --format tga

  # List what would be extracted:
  python extract_textures.py --list-only

umodel download:
  {UMODEL_URL}
""",
    )

    parser.add_argument(
        "--kf-path",
        type=Path,
        default=DEFAULT_KF_PATH,
        help="KF1 install directory (default: %(default)s)",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=DEFAULT_OUTPUT,
        help="Output root directory (default: %(default)s)",
    )
    parser.add_argument(
        "--umodel",
        default="umodel.exe",
        help="Path to umodel.exe (default: %(default)s, assumes on PATH)",
    )
    parser.add_argument(
        "--poc",
        action="store_true",
        help="Extract only proof-of-concept assets (shotgun, clot, BioticsLab)",
    )
    parser.add_argument(
        "--category",
        choices=["weapons", "monsters", "maps", "world", "all"],
        default="all",
        help="Filter by asset category (default: %(default)s)",
    )
    parser.add_argument(
        "--list-only",
        action="store_true",
        help="List packages that would be processed, without extracting",
    )
    parser.add_argument(
        "--format",
        choices=["png", "tga"],
        default="png",
        help="Export image format (default: %(default)s)",
    )
    parser.add_argument(
        "-v", "--verbose",
        action="store_true",
        help="Enable debug-level logging",
    )

    args = parser.parse_args()

    # ---- Logging setup ----
    log_level = logging.DEBUG if args.verbose else logging.INFO
    logging.basicConfig(
        level=log_level,
        format="%(levelname)-7s %(message)s",
    )

    # ---- Validate KF path ----
    kf_path: Path = args.kf_path.resolve()
    if not kf_path.is_dir():
        logger.error("KF1 install directory not found: %s", kf_path)
        logger.error("Use --kf-path to specify the correct location.")
        return 1

    # ---- Build package list ----
    packages = build_package_list(kf_path, args.category, args.poc)

    if not packages:
        logger.error("No packages to process. Check --category or --kf-path.")
        return 1

    total_count = sum(len(pkgs) for pkgs in packages.values())

    # ---- List-only mode ----
    if args.list_only:
        logger.info("Packages to process (%d total):", total_count)
        logger.info("")
        for cat, pkgs in sorted(packages.items()):
            logger.info("  [%s] (%d packages)", cat, len(pkgs))
            for pkg in pkgs:
                full_path = resolve_package_path(pkg, kf_path)
                status = "OK" if full_path else "NOT FOUND"
                logger.info("    %-40s %s", pkg, status)
            logger.info("")
        return 0

    # ---- Locate umodel ----
    umodel = find_umodel(args.umodel)
    if umodel is None:
        logger.error("umodel executable not found: %s", args.umodel)
        logger.error("")
        logger.error("umodel (UE Viewer) is required to extract textures from UE2 packages.")
        logger.error("Download it from: %s", UMODEL_URL)
        logger.error("")
        logger.error("After downloading, either:")
        logger.error("  1. Place umodel.exe on your PATH, or")
        logger.error("  2. Use --umodel /path/to/umodel.exe")
        return 1

    logger.info("Using umodel: %s", umodel)
    logger.info("KF1 path:     %s", kf_path)
    logger.info("Output:       %s", args.output.resolve())
    logger.info("Format:       %s", args.format)
    if args.poc:
        logger.info("Mode:         proof-of-concept")
    logger.info("")

    # ---- Extract ----
    output_root: Path = args.output.resolve()
    succeeded = 0
    failed = 0
    skipped = 0
    failed_packages: list[str] = []

    for cat, pkgs in sorted(packages.items()):
        logger.info("=== %s (%d packages) ===", cat.upper(), len(pkgs))

        for pkg_name in pkgs:
            pkg_path = resolve_package_path(pkg_name, kf_path)
            if pkg_path is None:
                logger.warning("  SKIP  %-40s (file not found)", pkg_name)
                skipped += 1
                continue

            # Output: {output}/{category}/{package_stem}/
            pkg_stem = Path(pkg_name).stem
            out_dir = output_root / cat / pkg_stem

            logger.info("  EXTRACT  %-40s -> %s", pkg_name, out_dir)

            ok = extract_package(
                umodel=umodel,
                package_path=pkg_path,
                kf_path=kf_path,
                out_dir=out_dir,
                fmt=args.format,
            )

            if ok:
                succeeded += 1
            else:
                failed += 1
                failed_packages.append(f"{cat}/{pkg_name}")

        logger.info("")

    # ---- Summary ----
    logger.info("=" * 60)
    logger.info("SUMMARY")
    logger.info("  Total packages:  %d", total_count)
    logger.info("  Succeeded:       %d", succeeded)
    logger.info("  Failed:          %d", failed)
    logger.info("  Skipped:         %d", skipped)
    logger.info("  Output:          %s", output_root)

    if failed_packages:
        logger.info("")
        logger.info("Failed packages:")
        for name in failed_packages:
            logger.info("  - %s", name)

    logger.info("=" * 60)

    return 1 if failed > 0 else 0


if __name__ == "__main__":
    sys.exit(main())
