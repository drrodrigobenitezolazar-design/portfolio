#!/usr/bin/env bash
# Regenerates the downloadable CV PDFs (ES + EN) from cv.html + data/content.js.
# Run after changing the site content:  bash tools/build-cv.sh
set -euo pipefail
cd "$(dirname "$0")/.."
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
mkdir -p assets/cv
for lang in es en; do
  out="assets/cv/CV-Rodrigo-Benitez-Olazar-$(echo "$lang" | tr a-z A-Z).pdf"
  "$CHROME" --headless=new --disable-gpu --no-pdf-header-footer \
    --virtual-time-budget=8000 \
    --print-to-pdf="$PWD/$out" "file://$PWD/cv.html?lang=$lang" 2>/dev/null
  echo "✓ $out"
done
