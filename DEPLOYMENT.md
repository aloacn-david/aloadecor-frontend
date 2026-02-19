# 部署说明

## 项目部署指南

### 前端部署 (Netlify)

1. 构建项目：
   ```bash
   npm run build
   ```

2. 将 `dist` 目录部署到 Netlify

### 后端部署 (Railway)

1. 创建新的 Railway 项目
2. 上传 server.js 文件
3. 设置环境变量：
   - SHOPIFY_STORE: your-store.myshopify.com
   - SHOPIFY_TOKEN: your-token-here

### 配置前端 API URL

在 Netlify 中设置环境变量：
- VITE_API_URL: https://your-railway-app-url.up.railway.app

## 项目结构
- dist/: 构建后的前端文件
- server.js: 后端代理服务器
- src/: 前端源代码
