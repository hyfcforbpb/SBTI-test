# SBTI 人格测试

> 工程化重构版，基于原作 [蛆肉儿串儿](https://www.bilibili.com/video/BV1LpDHByET6/) 的 SBTI 测试，参照 [UnluckyNinja/SBTI-test](https://github.com/UnluckyNinja/SBTI-test) 镜像，使用 [OpenClaw](https://github.com/openclaw/openclaw) 进行完整重构。

原版是一个单 HTML 文件，本项目用 TypeScript + Vite + Chart.js 重写，代码模块化、类型安全、可维护性大幅提升，同时保留了原始测试内容和体验。

## 特性

- **TypeScript 重构** — 全量类型标注，核心逻辑与 UI 分离
- **评分单元测试** — 内置 `scoring.test.ts`，保证 15 维度评分准确性
- **雷达图可视化** — 基于 Chart.js 绘制结果页维度雷达图
- **多平台部署** — 开箱即用支持 7 个平台，一份代码多处部署
- **零依赖运行时** — 构建产物为纯静态文件，任何静态服务器均可托管

## 技术栈

| 技术 | 用途 |
|------|------|
| TypeScript 6 | 类型安全 |
| Vite 8 | 构建工具 |
| Chart.js 4 | 雷达图渲染 |
| ESLint | 代码规范 |

## 项目结构

```
src/
├── core/
│   ├── scoring.ts         # 核心评分逻辑
│   └── scoring.test.ts    # 评分单元测试
├── data/
│   ├── questions.json     # 测试题目
│   ├── special-questions.json
│   ├── type-library.json  # 人格类型库
│   ├── dim-explanations.json
│   ├── dimension-meta.json
│   ├── dimension-order.json
│   ├── normal-types.json
│   └── type-images.json
├── ui/
│   ├── chart.ts           # Chart.js 雷达图
│   ├── dom.ts             # DOM 操作封装
│   ├── render.ts          # 页面渲染逻辑
│   └── style.css          # 样式
├── main.ts                # 入口文件
└── types.ts               # 类型定义
```

## 快速开始

```bash
# 安装依赖
npm install

# 开发
npm run dev

# 构建
npm run build

# 预览构建结果
npm run preview

# 运行评分测试
npm test
```

## 部署

本项目支持一键部署到多个平台，详见 [DEPLOY.md](./DEPLOY.md)。

| 平台 | 配置文件 | 自动化 |
|------|----------|--------|
| GitHub Pages | `.github/workflows/deploy.yml` | ✅ push 即部署 |
| Netlify | `netlify.toml` | ✅ CI/CD |
| Cloudflare Pages | `wrangler.toml` | ✅ CI/CD |
| Vercel | `vercel.json` | ✅ CI/CD |
| EdgeOne Pages | `edgeone.json` | ✅ CI/CD |
| Gitee Pages | `scripts/deploy-pages.sh` | ✅ 镜像同步 |
| GitLab Pages | `.gitlab-ci.yml` | ✅ push 即部署 |

```bash
# 快速部署示例
npm run build
npx wrangler pages deploy dist --project-name=sbti
```

## 致谢

- **原作者**：[蛆肉儿串儿](https://www.bilibili.com/video/BV1LpDHByET6/)（B站 UID: 417038183）
- **镜像仓库**：[UnluckyNinja/SBTI-test](https://github.com/UnluckyNinja/SBTI-test)
