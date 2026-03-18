#!/bin/bash
set -e
SRC="src"
OUT="public/index.html"
echo "🔨 MyCOACH-MyTEAM ビルド開始..."

cat "$SRC/html/head.html" > "$OUT"
echo "<style>" >> "$OUT"
cat "$SRC/styles/main.css" >> "$OUT"
echo "</style>" >> "$OUT"
echo "<script>" >> "$OUT"

for f in \
  01-core-utils.js \
  02-charts-dashdata.js \
  03-config-data.js \
  04-auth.js \
  05-onboarding.js \
  06-storage-sync.js \
  07-app-navigation.js \
  08-reports-widgets.js \
  09-admin-dashboard.js \
  10-admin-operations.js \
  11-payments.js \
  12-team-pages.js \
  13-coach-pages.js \
  14-player-pages.js \
  15-nutrition.js \
  16-training.js \
  17-ai-advisor.js \
  18-chat.js \
  19-disclosure-matching.js \
  20-misc-export.js \
  21-legal.js \
  22-firebase-startup.js
do
  [ -f "$SRC/js/$f" ] && cat "$SRC/js/$f" >> "$OUT" || echo "  SKIP: $f"
done

echo "</script>" >> "$OUT"
echo "<script>" >> "$OUT"
cat "$SRC/js/90-hardening.js" >> "$OUT"
echo "</script>" >> "$OUT"
cat "$SRC/vendor/sentry-ga.html" >> "$OUT"
cat "$SRC/html/body.html" >> "$OUT"
cat "$SRC/firebase/firebase-module.html" >> "$OUT"
echo "</body>" >> "$OUT"
echo "</html>" >> "$OUT"

echo "✅ ビルド完了: $OUT ($(wc -l < "$OUT") lines)"
