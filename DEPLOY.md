# 🚀 SBTI 人格测试 — 多平台部署指南

## 支持平台一览

| 平台 | 方式 | 配置文件 | 自动化 |
|------|------|----------|--------|
| **GitHub Pages** | Actions | `.github/workflows/deploy.yml` | ✅ push 即部署 |
| **Netlify** | Git / CLI | `netlify.toml` | ✅ CI/CD |
| **Cloudflare Pages** | Wrangler CLI | `wrangler.toml` | ✅ CI/CD |
| **EdgeOne Pages** | API / CLI | `edgeone.json` | ✅ CI/CD |
| **Vercel** | Git / CLI | `vercel.json` | ✅ CI/CD |
| **Gitee Pages** | 分支部署 | `scripts/deploy-pages.sh` | ✅ 镜像同步 |
| **GitLab Pages** | CI/CD | `.gitlab-ci.yml` | ✅ push 即部署 |

---

## 一、GitHub Actions 部署（推荐）

### 所需 Secrets

在 GitHub 仓库 → Settings → Secrets 中配置：

```
# Netlify
NETLIFY_AUTH_TOKEN
NETLIFY_SITE_ID

# Cloudflare Pages
CLOUDFLARE_API_TOKEN
CLOUDFLARE_ACCOUNT_ID

# EdgeOne Pages
EDGEONE_API_TOKEN

# Vercel
VERCEL_TOKEN
VERCEL_ORG_ID
VERCEL_PROJECT_ID

# Gitee（镜像同步）
GITEE_TOKEN
GITEE_REPO

# GitLab（镜像同步）
GITLAB_TOKEN
GITLAB_REPO
```

### 自动触发

- **push 到 main** → 全平台自动部署
- **PR** → 仅构建验证，不部署

### 手动触发

```
GitHub → Actions → Multi-Platform Deploy → Run workflow
→ 可选择 deploy_target: all / netlify / cloudflare / edgeone / vercel / gitee / gitlab
```

---

## 二、单平台快速部署

### Netlify

```bash
# 方式一：Git 部署（推荐）
# 在 Netlify 控制台关联 Git 仓库，自动识别 netlify.toml

# 方式二：CLI 部署
npm install -g netlify-cli
npm run build
netlify deploy --prod --dir=dist
```

### Cloudflare Pages

```bash
npm install -g wrangler
npm run build
wrangler pages deploy dist --project-name=sbti-personality-test
```

### EdgeOne Pages

```bash
# 通过 EdgeOne 控制台导入 Git 仓库
# 或使用腾讯云 EdgeOne CLI
npm install -g @edgeone/cli
edgeone pages deploy dist --token YOUR_TOKEN --project sbti
```

### Vercel

```bash
npm install -g vercel
vercel --prod
```

### GitHub Pages（手动）

```bash
# 使用 gh-pages 分支
npm run build
npx gh-pages -d dist
```

### Gitee Pages

```bash
# 推送到 gh-pages 分支，然后在 Gitee 网页端手动部署
./scripts/deploy-pages.sh https://gitee.com/your-username/sbti.git
```

### GitLab Pages

```bash
# 推送到 GitLab 即自动部署（.gitlab-ci.yml）
git push gitlab main
```

---

## 三、Pull 部署（自托管服务器）

适合 Nginx / Apache / Caddy 等自托管场景：

```bash
# 服务器上执行
SBTI_REPO_URL=https://github.com/you/sbti.git \
  ./scripts/pull-deploy.sh /var/www/sbti

# Nginx 配置示例
server {
    listen 80;
    server_name sbti.example.com;
    root /var/www/sbti/dist;
    index index.html;
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

---

## 四、构建部署压缩包

```bash
# 生成带时间戳的 zip 部署包
./scripts/package.sh

# 输出: deploy/sbti-deploy-YYYYMMDD-HHMMSS.zip
# 可直接上传到任何静态托管平台
```

---

## 五、本地预览

```bash
npm run dev        # 开发服务器
npm run build      # 生产构建
npm run preview    # 预览构建结果

# 或使用部署包内的 serve.sh
unzip deploy/sbti-deploy-*.zip
cd sbti-deploy-*
./serve.sh         # http://localhost:8080
```

---

## 安全说明

- 所有平台配置了安全响应头（X-Frame-Options, X-Content-Type-Options 等）
- 静态资源配置了长期缓存
- HTML 文件不缓存，确保用户获取最新版本
- Secrets 通过 CI/CD 环境变量注入，不暴露在代码中
