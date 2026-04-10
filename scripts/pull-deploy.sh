#!/usr/bin/env bash
# ============================================================
# SBTI Pull 部署脚本
# 用法: ./scripts/pull-deploy.sh <target_dir> [branch]
# 用途: 从 Git 仓库拉取最新代码，构建并部署到指定目录
# 适用于：Nginx / Apache / Caddy 等静态服务器
# ============================================================
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

REPO_URL="${SBTI_REPO_URL:-}"
TARGET_DIR="${1:-/var/www/sbti}"
BRANCH="${2:-main}"
LOCK_FILE="/tmp/sbti-deploy.lock"
MAX_WAIT=60

log()  { echo -e "${BLUE}[SBTI-Deploy]${NC} $*"; }
ok()   { echo -e "${GREEN}[✓]${NC} $*"; }
warn() { echo -e "${YELLOW}[⚠]${NC} $*"; }
err()  { echo -e "${RED}[✗]${NC} $*" >&2; }

# 防止并发部署
cleanup() { rm -f "$LOCK_FILE"; }
trap cleanup EXIT

if [ -f "$LOCK_FILE" ]; then
  WAITED=0
  while [ -f "$LOCK_FILE" ] && [ "$WAITED" -lt "$MAX_WAIT" ]; do
    warn "另一部署正在进行，等待中... (${WAITED}s)"
    sleep 2
    WAITED=$((WAITED + 2))
  done
  if [ -f "$LOCK_FILE" ]; then
    err "部署锁超时，强制清除"
    rm -f "$LOCK_FILE"
  fi
fi
echo $$ > "$LOCK_FILE"

# 检查参数
if [ -z "$REPO_URL" ]; then
  err "请设置环境变量 SBTI_REPO_URL"
  echo "  用法: SBTI_REPO_URL=https://github.com/you/sbti.git ./scripts/pull-deploy.sh /var/www/sbti"
  exit 1
fi

# 检查依赖
for cmd in git node npm; do
  if ! command -v "$cmd" &>/dev/null; then
    err "缺少依赖: $cmd"
    exit 1
  fi
done

log "开始部署 SBTI → ${TARGET_DIR}"
log "仓库: ${REPO_URL} (branch: ${BRANCH})"
echo ""

# Step 1: 拉取/更新代码
if [ -d "${TARGET_DIR}/.git" ]; then
  log "更新现有仓库..."
  cd "$TARGET_DIR"
  git fetch origin
  git reset --hard "origin/${BRANCH}"
  git clean -fd
else
  log "克隆仓库..."
  mkdir -p "$(dirname "$TARGET_DIR")"
  git clone --branch "$BRANCH" --single-branch "$REPO_URL" "$TARGET_DIR"
  cd "$TARGET_DIR"
fi

COMMIT=$(git rev-parse --short HEAD)
ok "代码已更新 (commit: ${COMMIT})"

# Step 2: 安装依赖
log "安装依赖..."
npm ci --production=false --silent
ok "依赖已安装"

# Step 3: 构建
log "构建生产版本..."
npm run build
ok "构建完成"

# Step 4: 部署验证
DIST_DIR="${TARGET_DIR}/dist"
FILE_COUNT=$(find "$DIST_DIR" -type f | wc -l)
TOTAL_SIZE=$(du -sh "$DIST_DIR" | cut -f1)

if [ "$FILE_COUNT" -lt 3 ]; then
  err "构建产物不完整 (${FILE_COUNT} files)，部署中止"
  exit 1
fi

ok "部署成功!"
echo ""
echo "  📁 部署目录: ${DIST_DIR}"
echo "  📊 文件数量: ${FILE_COUNT}"
echo "  📦 总大小:   ${TOTAL_SIZE}"
echo "  🔖 Commit:   ${COMMIT}"
echo "  🕐 时间:     $(date)"
echo ""

# Step 5: 可选 — 重载 Nginx
if command -v nginx &>/dev/null && systemctl is-active nginx &>/dev/null; then
  log "检测到 Nginx，尝试重载..."
  if nginx -t 2>/dev/null; then
    systemctl reload nginx
    ok "Nginx 已重载"
  else
    warn "Nginx 配置检测失败，跳过重载"
  fi
fi

log "🎉 部署完成!"
