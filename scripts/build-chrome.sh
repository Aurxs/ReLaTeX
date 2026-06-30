#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SOURCE_DIR="$ROOT_DIR/extension"
BUILD_ROOT="$ROOT_DIR/build/chrome"
OUT_DIR="$BUILD_ROOT/ReLaTeX-Chrome"
ZIP_PATH="$BUILD_ROOT/ReLaTeX-Chrome.zip"

rm -rf "$OUT_DIR" "$ZIP_PATH"
mkdir -p "$BUILD_ROOT"

rsync -a --delete --exclude ".DS_Store" "$SOURCE_DIR"/ "$OUT_DIR"/

node - "$OUT_DIR/manifest.json" <<'NODE'
const fs = require("fs");
const manifestPath = process.argv[2];
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

if (manifest.manifest_version !== 3) {
  throw new Error("Chrome package must use Manifest V3.");
}

for (const [size, iconPath] of Object.entries(manifest.icons || {})) {
  if (!iconPath.endsWith(".png")) {
    throw new Error(`Chrome icon ${size} must be a PNG file: ${iconPath}`);
  }
}

for (const size of ["48", "128"]) {
  if (!manifest.icons || !manifest.icons[size]) {
    throw new Error(`Chrome manifest is missing a ${size}x${size} icon.`);
  }
}

if (!Array.isArray(manifest.content_scripts) || manifest.content_scripts.length === 0) {
  throw new Error("Chrome manifest must declare at least one content script.");
}
NODE

(cd "$OUT_DIR" && zip -qr "$ZIP_PATH" .)

echo "Chrome extension directory: $OUT_DIR"
echo "Chrome extension zip: $ZIP_PATH"
