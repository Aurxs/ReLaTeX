#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
KATEX_DIST="$ROOT_DIR/node_modules/katex/dist"
VENDOR_DIR="$ROOT_DIR/extension/vendor/katex"

mkdir -p "$VENDOR_DIR/fonts"
cp "$KATEX_DIST/katex.min.js" "$VENDOR_DIR/katex.min.js"
cp "$KATEX_DIST/katex.min.css" "$VENDOR_DIR/katex.min.css"
cp "$ROOT_DIR/node_modules/katex/LICENSE" "$VENDOR_DIR/LICENSE"
cp "$KATEX_DIST"/fonts/* "$VENDOR_DIR/fonts/"
