#!/usr/bin/env bash
# ============================================================
# SBTI — Gitee/GitLab Pages 分支部署
# 将构建产物推送到 gh-pages 分支
# 用法: ./scripts/deploy-pages.sh [repo_url] [branch]
# ============================================================
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
REPO_URL="${1:-${PAGES_REPO_URL:-}}"
PAGES_BRANCH="${2:-gh-pages}"

cd "$PROJECT_DIR"

if [ -z "$REPO_URL" ]; then
  echo "用法: PAGES_REPO_URL=https://gitee.com/you/sbti.git ./scripts/deploy-pages.sh"
  echo "  或: ./scripts/deploy-pages.sh https://gitee.com/you/sbti.git"
  exit 1
fi

echo "🔨 构建项目..."
npm run build

echo "📦 准备 gh-pages 分支..."
TEMP_DIR=$(mktemp -d)
cp -r dist/* "$TEMP_DIR/"
cd "$TEMP_DIR"

git init
git checkout -b "$PAGES_BRANCH"
git add -A
git commit -m "deploy: $(date +%Y%m%d-%H%M%S)"

echo "🚀 推送到 ${REPO_URL} (${PAGES_BRANCH})..."
git push "$REPO_URL" "$PAGES_BRANCH" --force

cd "$PROJECT_DIR"
rm -rf "$TEMP_DIR"

echo "✅ Pages 部署完成!"
echo "   Gitee:  前往仓库设置 → Pages → 选择 ${PAGES_BRANCH} 分支 → 部署"
echo "   GitLab: 前往 Settings → Pages 查看部署状态"
