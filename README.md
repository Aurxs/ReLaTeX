<p align="center">
  <img src="extension/icons/icon.svg" alt="ReLaTeX" width="112" height="112">
</p>

<h1 align="center">ReLaTeX</h1>

<p align="center">
  A Safari extension that brings broken ChatGPT LaTeX back to readable math.
</p>

<p align="center">
  <a href="https://github.com/Aurxs/ReLaTeX/releases"><img alt="Release" src="https://img.shields.io/github/v/release/Aurxs/ReLaTeX?include_prereleases&style=flat-square"></a>
  <a href="https://github.com/Aurxs/ReLaTeX/blob/main/LICENSE"><img alt="License" src="https://img.shields.io/github/license/Aurxs/ReLaTeX?style=flat-square"></a>
  <img alt="Platform" src="https://img.shields.io/badge/platform-macOS%20%7C%20Safari-0f172a?style=flat-square">
  <img alt="Scope" src="https://img.shields.io/badge/scope-ChatGPT%20only-2563eb?style=flat-square">
</p>

<p align="center">
  <a href="#features">Features</a> ·
  <a href="#install">Install</a> ·
  <a href="#development">Development</a> ·
  <a href="#privacy">Privacy</a>
</p>

---

ReLaTeX is a small macOS Safari Web Extension built for one problem: ChatGPT pages sometimes show LaTeX as raw text instead of rendered formulas. ReLaTeX watches ChatGPT messages, detects raw math such as `$...$`, `\(...\)`, `\[...\]`, and common matrix blocks, then renders them locally with KaTeX.

![ReLaTeX demo](docs/assets/demo.svg)

## Features

- ChatGPT-only injection for `chatgpt.com` and legacy `chat.openai.com`.
- Local KaTeX renderer. No CDN, no remote math rendering service.
- Handles formulas that ChatGPT splits across multiple DOM lines.
- Repairs common matrix row mistakes such as `\begin{pmatrix}1\0\end{pmatrix}`.
- Watches streamed and newly loaded messages through `MutationObserver`.
- Skips editors, buttons, code blocks, and formulas already rendered by ReLaTeX.

## Install

ReLaTeX is currently distributed as source. Build and enable it locally:

```sh
git clone https://github.com/Aurxs/ReLaTeX.git
cd ReLaTeX
npm install
npm run build:safari
open ReLaTeX/ReLaTeX.xcodeproj
```

In Xcode:

1. Select the `ReLaTeX` scheme.
2. Choose `My Mac` as the run destination.
3. Run the app.

In Safari:

1. Open Safari Settings.
2. Go to Extensions.
3. Enable `ReLaTeX for ChatGPT`.
4. Refresh your ChatGPT page.

If Safari does not show the extension during local development, enable unsigned extensions first:

1. Safari Settings -> Advanced -> Show features for web developers.
2. Safari menu bar -> Develop -> Allow Unsigned Extensions.
3. Run `ReLaTeX` from Xcode again.

## Development

Install dependencies:

```sh
npm install
```

Refresh vendored KaTeX assets after dependency updates:

```sh
npm run vendor:katex
```

Generate or refresh the Safari/Xcode project:

```sh
npm run build:safari
```

Run a local build check:

```sh
xcodebuild \
  -project ReLaTeX/ReLaTeX.xcodeproj \
  -scheme ReLaTeX \
  -configuration Debug \
  -destination 'generic/platform=macOS' \
  -derivedDataPath build/DerivedData \
  CODE_SIGNING_ALLOWED=NO \
  build
```

## Project Structure

```text
extension/                 Web extension source
extension/content.js       ChatGPT LaTeX detection and rendering
extension/vendor/katex/    Bundled KaTeX runtime, CSS, and fonts
ReLaTeX/                   Generated Safari app and extension project
scripts/                   Asset and host-app patch scripts
docs/assets/               README visuals
```

## Privacy

ReLaTeX runs locally in Safari. It only requests access to ChatGPT pages and does not send page text, formulas, account data, or browsing content to any third-party service.

## Credits

ReLaTeX uses [KaTeX](https://katex.org/) for fast local math rendering.

## License

MIT. See [LICENSE](LICENSE).
