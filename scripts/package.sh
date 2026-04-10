#!/usr/bin/env bash
# ============================================================
# SBTI 人格测试 — 构建 & 打包部署包
# 用法: ./scripts/package.sh [output_dir]
# 输出: 部署就绪的 zip 压缩包，适配所有静态平台
# ============================================================
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
OUTPUT_DIR="${1:-$PROJECT_DIR/deploy}"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
PACKAGE_NAME="sbti-deploy-${TIMESTAMP}"

cd "$PROJECT_DIR"

echo "🔨 Step 1: 构建项目..."
npm run build

echo ""
echo "📦 Step 2: 打包部署压缩包..."
mkdir -p "$OUTPUT_DIR"

# 创建临时目录
TEMP_DIR=$(mktemp -d)
DEPLOY_DIR="${TEMP_DIR}/${PACKAGE_NAME}"
mkdir -p "$DEPLOY_DIR"

# 复制构建产物
cp -r dist/* "$DEPLOY_DIR/"

# 生成部署清单
cat > "${DEPLOY_DIR}/DEPLOY.json" << EOF
{
  "name": "sbti-personality-test",
  "version": "$(node -p "require('./package.json').version")",
  "buildTime": "$(date -Iseconds)",
  "platforms": {
    "netlify": { "config": "netlify.toml", "publish": "." },
    "cloudflare": { "config": "wrangler.toml", "publish": "." },
    "vercel": { "config": "vercel.json", "publish": "." },
    "edgeone": { "config": "edgeone.json", "publish": "." },
    "github-pages": { "config": ".github/workflows/deploy.yml", "publish": "." },
    "gitee-pages": { "branch": "gh-pages", "publish": "." },
    "gitlab-pages": { "config": ".gitlab-ci.yml", "publish": "public" }
  }
}
EOF

# 生成静态服务器启动脚本
cat > "${DEPLOY_DIR}/serve.sh" << 'SERVE'
#!/usr/bin/env bash
# 快速本地预览部署包
echo "🌐 预览: http://localhost:8080"
echo "按 Ctrl+C 停止"
python3 -m http.server 8080 2>/dev/null || python -m SimpleHTTPServer 8080
SERVE
chmod +x "${DEPLOY_DIR}/serve.sh"

# 打包 (优先 zip，降级 tar)
cd "$DEPLOY_DIR"
if command -v zip &>/dev/null; then
  zip -r "${OUTPUT_DIR}/${PACKAGE_NAME}.zip" . -x "*.map"
  ARCHIVE_FILE="${OUTPUT_DIR}/${PACKAGE_NAME}.zip"
  ARCHIVE_FORMAT="zip"
else
  cd "$TEMP_DIR"
  tar -czf "${OUTPUT_DIR}/${PACKAGE_NAME}.tar.gz" "${PACKAGE_NAME}/"
  ARCHIVE_FILE="${OUTPUT_DIR}/${PACKAGE_NAME}.tar.gz"
  ARCHIVE_FORMAT="tar.gz"
fi

# 清理
rm -rf "$TEMP_DIR"

FILE_SIZE=$(du -sh "${ARCHIVE_FILE}" | cut -f1)
FILE_COUNT=$(find "${OUTPUT_DIR}" -type f 2>/dev/null | wc -l)

echo ""
echo "✅ 部署包生成完成!"
echo "   📦 文件: ${ARCHIVE_FILE}"
echo "   📊 大小: ${FILE_SIZE} (${ARCHIVE_FORMAT})"
echo ""
echo "支持平台:"
echo "   • Netlify       → 上传 zip/tar 或 Git 部署"
echo "   • Cloudflare    → wrangler pages deploy dist/"
echo "   • EdgeOne       → 上传 zip 或 Git 部署"
echo "   • Vercel        → vercel --prod"
echo "   • GitHub Pages  → 自动 CI/CD"
echo "   • Gitee Pages   → 同步 gh-pages 分支"
echo "   • GitLab Pages  → CI/CD 自动部署"
echo "   • 本地预览      → 解压后运行 serve.sh"
