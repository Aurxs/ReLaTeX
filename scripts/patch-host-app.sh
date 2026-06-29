#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MAIN_HTML="$ROOT_DIR/ReLaTeX/ReLaTeX/Resources/Base.lproj/Main.html"
STYLE_CSS="$ROOT_DIR/ReLaTeX/ReLaTeX/Resources/Style.css"

python3 - "$MAIN_HTML" "$STYLE_CSS" <<'PY'
from pathlib import Path
import sys

main_html = Path(sys.argv[1])
style_css = Path(sys.argv[2])

html = main_html.read_text()
broken_img = '<img src="../Icon.png" width="128" height="128" alt="ReLaTeX Icon">'
inline_icon = '''<svg class="app-icon" viewBox="0 0 128 128" role="img" aria-label="ReLaTeX Icon">
        <rect width="128" height="128" rx="24" fill="#111827"/>
        <path d="M28 35h72v12H28zM28 58h72v12H28zM28 81h72v12H28z" fill="#f9fafb"/>
        <path d="M37 38l19 26-19 26h14l19-26-19-26z" fill="#38bdf8"/>
        <path d="M76 88h28v-9H86V38H76z" fill="#a7f3d0"/>
    </svg>'''

if broken_img in html:
    html = html.replace(broken_img, inline_icon)
main_html.write_text(html)

css = style_css.read_text()
icon_css = '''.app-icon {
    display: block;
    width: 128px;
    height: 128px;
    flex: none;
}

'''

if ".app-icon" not in css:
    css = css.replace("button {\n", icon_css + "button {\n")
style_css.write_text(css)
PY
