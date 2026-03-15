#!/bin/bash
# ============================================================
# GitHub Push Script
# ダウンロードしたZIPを展開して実行してください
#
# 手順:
#   1. このフォルダをターミナルで開く
#   2. bash github-push.sh
# ============================================================
set -e

echo "🚀 GitHubにプッシュ開始..."

# Git初期化（初回のみ）
if [ ! -d ".git" ]; then
  git init
  git branch -m main
fi

git config user.name "ymozfleet-creator"
git config user.email "y.moz.fleet@gmail.com"

# リモート設定
git remote remove origin 2>/dev/null || true
git remote add origin https://github.com/ymozfleet-creator/bukatsu-backend.git

# 全ファイルをステージ&コミット
git add -A
git commit -m "v54: MyCOACH-MyTEAM モジュール分割プロジェクト" --allow-empty

# プッシュ
echo ""
echo "GitHubのPersonal Access Tokenを入力してください（非表示）:"
read -s TOKEN
echo ""

git push https://ymozfleet-creator:${TOKEN}@github.com/ymozfleet-creator/bukatsu-backend.git main --force

echo ""
echo "✅ プッシュ完了!"
echo "   https://github.com/ymozfleet-creator/bukatsu-backend"
