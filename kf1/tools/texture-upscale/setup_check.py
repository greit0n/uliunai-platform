#!/usr/bin/env python3
"""
KF1 AI Texture Upscale — Setup Check

Verifies that all required tools and dependencies are installed.
No external dependencies — uses stdlib only.

Exit code 0 if all checks pass, 1 if any fail.
"""

import argparse
import importlib
import os
import platform
import shutil
import subprocess
import sys


# Default paths to search for KF1 installation
KF1_DEFAULT_PATHS = [
    r"D:\SteamLibrary\steamapps\common\KillingFloor",
    r"D:\SteamLibrary\steamapps\common\KillingFloorBeta",
    r"C:\Program Files (x86)\Steam\steamapps\common\KillingFloor",
    r"C:\Program Files\Steam\steamapps\common\KillingFloor",
    os.path.expanduser("~/.steam/steam/steamapps/common/KillingFloor"),
    os.path.expanduser("~/.local/share/Steam/steamapps/common/KillingFloor"),
]

# Default paths to search for umodel
UMODEL_DEFAULT_PATHS = [
    r"D:\Tools\umodel.exe",
    r"C:\Tools\umodel.exe",
    r"D:\umodel\umodel.exe",
    r"C:\umodel\umodel.exe",
]

# Required subdirectories under texture-upscale/
REQUIRED_DIRS = [
    os.path.join("original", "weapons"),
    os.path.join("original", "monsters"),
    os.path.join("original", "maps"),
    os.path.join("original", "world"),
    "upscaled",
    "materials",
    "comparisons",
    "output",
]


def check_mark():
    """Return a check mark character, with fallback for terminals that lack UTF-8."""
    return "\u2713"


def cross_mark():
    """Return a cross mark character, with fallback for terminals that lack UTF-8."""
    return "\u2717"


def ok(msg):
    return f"  {check_mark()} {msg}"


def fail(msg):
    return f"  {cross_mark()} {msg}"


def check_python_version():
    """Check that Python >= 3.8 is running."""
    version = sys.version_info
    version_str = f"{version.major}.{version.minor}.{version.micro}"
    if version >= (3, 8):
        return True, ok(f"Python {version_str}")
    else:
        return False, fail(f"Python {version_str} — requires 3.8+ (upgrade Python)")


def check_pillow():
    """Check that Pillow is installed and report its version."""
    try:
        pil = importlib.import_module("PIL")
        version = getattr(pil, "__version__", "unknown")
        return True, ok(f"Pillow {version}")
    except ImportError:
        return False, fail("Pillow — not installed (pip install Pillow)")


def check_realesrgan():
    """Check that realesrgan is installed."""
    # Try importing the package first
    try:
        mod = importlib.import_module("realesrgan")
        version = getattr(mod, "__version__", None)
        if version:
            return True, ok(f"realesrgan {version}")
        # Package found but no __version__; try to find version from metadata
        try:
            from importlib.metadata import version as meta_version
            ver = meta_version("realesrgan")
            return True, ok(f"realesrgan {ver}")
        except Exception:
            return True, ok("realesrgan (version unknown)")
    except ImportError:
        pass

    # Fallback: try running as a CLI tool
    try:
        result = subprocess.run(
            [sys.executable, "-m", "realesrgan", "--help"],
            capture_output=True,
            timeout=10,
        )
        if result.returncode == 0:
            return True, ok("realesrgan (CLI available)")
    except (subprocess.TimeoutExpired, FileNotFoundError, OSError):
        pass

    return False, fail("realesrgan — not installed (pip install realesrgan)")


def check_umodel(custom_path=None):
    """Check that umodel.exe is accessible."""
    # If a custom path is provided, check it first
    if custom_path:
        if os.path.isfile(custom_path):
            return True, ok(f"umodel found at {custom_path}")
        else:
            return False, fail(f"umodel not found at {custom_path}")

    # Check if umodel is on PATH
    umodel_on_path = shutil.which("umodel") or shutil.which("umodel.exe")
    if umodel_on_path:
        return True, ok(f"umodel found at {umodel_on_path}")

    # Check common install locations
    for path in UMODEL_DEFAULT_PATHS:
        if os.path.isfile(path):
            return True, ok(f"umodel found at {path}")

    return False, fail(
        "umodel — not found. Download from https://www.gildor.org/en/projects/umodel "
        "and place in PATH or D:\\Tools\\umodel.exe"
    )


def check_kf1_install(custom_path=None):
    """Check that KF1 is installed."""
    if custom_path:
        # Verify it looks like a KF1 install (has System/ and Textures/ dirs)
        system_dir = os.path.join(custom_path, "System")
        textures_dir = os.path.join(custom_path, "Textures")
        if os.path.isdir(system_dir) or os.path.isdir(textures_dir):
            return True, ok(f"KF1 installed at {custom_path}")
        else:
            return False, fail(
                f"KF1 path {custom_path} exists but doesn't look like a KF1 install "
                "(missing System/ or Textures/)"
            )

    for path in KF1_DEFAULT_PATHS:
        if os.path.isdir(path):
            system_dir = os.path.join(path, "System")
            textures_dir = os.path.join(path, "Textures")
            if os.path.isdir(system_dir) or os.path.isdir(textures_dir):
                return True, ok(f"KF1 installed at {path}")

    return False, fail(
        "KF1 — not found at default paths. Use --kf-path to specify the install directory"
    )


def check_directory_structure():
    """Check that the required working directories exist."""
    script_dir = os.path.dirname(os.path.abspath(__file__))
    missing = []
    for d in REQUIRED_DIRS:
        full_path = os.path.join(script_dir, d)
        if not os.path.isdir(full_path):
            missing.append(d)

    if not missing:
        return True, ok("Directory structure is set up")

    # Build the mkdir command for missing dirs
    # Use forward slashes for cross-platform display
    dirs_str = " ".join(d.replace(os.sep, "/") for d in missing)
    return False, fail(
        f"Directory structure — {len(missing)} missing. Run: "
        f"mkdir -p {dirs_str}"
    )


def main():
    parser = argparse.ArgumentParser(
        description="KF1 AI Texture Upscale — Setup Check"
    )
    parser.add_argument(
        "--kf-path",
        type=str,
        default=None,
        help="Path to KF1 installation directory",
    )
    parser.add_argument(
        "--umodel-path",
        type=str,
        default=None,
        help="Path to umodel.exe",
    )
    args = parser.parse_args()

    print()
    print("KF1 AI Texture Upscale — Setup Check")
    print("=" * 37)

    checks = [
        check_python_version(),
        check_pillow(),
        check_realesrgan(),
        check_umodel(args.umodel_path),
        check_kf1_install(args.kf_path),
        check_directory_structure(),
    ]

    issues = 0
    for passed, message in checks:
        print(message)
        if not passed:
            issues += 1

    print()
    if issues == 0:
        print("All checks passed. Ready to go.")
    elif issues == 1:
        print("1 issue found. Fix it before proceeding.")
    else:
        print(f"{issues} issues found. Fix them before proceeding.")

    print()
    sys.exit(0 if issues == 0 else 1)


if __name__ == "__main__":
    main()
