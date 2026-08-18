#!/usr/bin/env bash
# Capture README/Marketplace screenshots of every variant on macOS.
#
#   scripts/capture-screenshots.sh            # all four variants → images/screenshot-<variant>.png
#   scripts/capture-screenshots.sh "Alone Soft"
#
# What it does: packages the current tree into a VSIX, installs it into a
# throwaway VS Code profile under /tmp (short path — VS Code's IPC socket
# path limit rejects long --user-data-dir values), opens samples/demo.tsx
# with the README's recommended editor settings and the given theme, waits
# for the window, and captures it with `screencapture`.
#
# Requirements (one-time, macOS): the terminal you run this from needs
# System Settings → Privacy & Security → Screen Recording (for screencapture)
# and → Accessibility (so osascript can read the window bounds). Without them
# the capture is the desktop wallpaper — that's how you know they're missing.
#
# JetBrains Mono (or the Nerd Font build) should be installed for the shot to
# match the README's recommended settings; the fallback is the system mono.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PROFILE=/tmp/alone-shot
CODE_BIN="${CODE_BIN:-/Applications/Visual Studio Code.app/Contents/MacOS/Code}"
SAMPLE="${SAMPLE:-$ROOT/samples/demo.tsx}"
WAIT="${WAIT:-10}"
VARIANTS=("$@")
if [ ${#VARIANTS[@]} -eq 0 ]; then VARIANTS=("Alone" "Alone Soft" "Alone Focused" "Alone Roman"); fi

[ -x "$CODE_BIN" ] || { echo "VS Code binary not found at $CODE_BIN (set CODE_BIN)"; exit 3; }
command -v screencapture >/dev/null || { echo "screencapture not found — this script is macOS-only"; exit 3; }

rm -rf "$PROFILE" && mkdir -p "$PROFILE/user/User" "$PROFILE/ext"
(cd "$ROOT" && npx vsce package --out "$PROFILE/alone.vsix" >/dev/null)
"$CODE_BIN" --user-data-dir "$PROFILE/user" --extensions-dir "$PROFILE/ext" --install-extension "$PROFILE/alone.vsix" >/dev/null 2>&1

slug() { echo "$1" | tr '[:upper:] ' '[:lower:]-'; }

for variant in "${VARIANTS[@]}"; do
  cat > "$PROFILE/user/User/settings.json" <<JSON
{
  "workbench.colorTheme": "$variant",
  "workbench.startupEditor": "none",
  "editor.fontFamily": "'JetBrains Mono Variable', 'JetBrains Mono', 'JetBrainsMono Nerd Font', monospace",
  "editor.fontSize": 14,
  "editor.fontWeight": "450",
  "editor.fontVariations": true,
  "editor.fontLigatures": false,
  "editor.lineHeight": 1.6,
  "editor.letterSpacing": 0.3,
  "editor.cursorBlinking": "solid",
  "editor.cursorStyle": "block",
  "editor.bracketPairColorization.enabled": true,
  "editor.guides.bracketPairs": "active",
  "editor.minimap.enabled": true,
  "editor.minimap.renderCharacters": false,
  "editor.renderWhitespace": "none",
  "editor.semanticHighlighting.enabled": true,
  "window.titleBarStyle": "custom",
  "window.newWindowDimensions": "maximized",
  "workbench.tips.enabled": false,
  "update.mode": "none",
  "telemetry.telemetryLevel": "off",
  "extensions.ignoreRecommendations": true,
  "security.workspace.trust.enabled": false,
  "git.enabled": false
}
JSON
  "$CODE_BIN" --user-data-dir "$PROFILE/user" --extensions-dir "$PROFILE/ext" --disable-workspace-trust "$SAMPLE" >/dev/null 2>&1 &
  pid=$!
  sleep "$WAIT"
  out="$ROOT/images/screenshot-$(slug "$variant").png"
  bounds="$(osascript -e 'tell application "System Events" to tell (first process whose name is "Code" and background only is false) to get {position, size} of window 1' 2>/dev/null || true)"
  if [ -n "$bounds" ]; then
    # "x, y, w, h" → screencapture -R x,y,w,h
    rect="$(echo "$bounds" | tr -d ' ')"
    screencapture -x -R "$rect" "$out"
  else
    echo "  (no window bounds via osascript — capturing the whole main display; crop by hand)"
    screencapture -x -m "$out"
  fi
  echo "wrote ${out#$ROOT/}"
  kill "$pid" 2>/dev/null || true
  pkill -f "$PROFILE" 2>/dev/null || true
  sleep 2
done

rm -rf "$PROFILE"
echo "Done. Review images/screenshot-*.png, then reference them from README.md (see docs/PUBLISHING.md § Screenshots)."
