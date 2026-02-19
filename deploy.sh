#!/bin/bash
# 部署脚本

echo "=== AloaDecor 网站部署 ==="

echo "1. 检查构建文件..."
if [ -d "dist" ]; then
  echo "✓ 构建文件存在"
else
  echo "✗ 构建文件不存在，请先运行 npm run build"
  exit 1
fi

echo "2. 准备部署文件..."

# 创建部署目录结构
mkdir -p deployment/frontend
mkdir -p deployment/backend

# 复制前端构建文件
cp -r dist/* deployment/frontend/

# 复制后端文件
cp server.js deployment/backend/
cp -r backend/* deployment/backend/ 2>/dev/null || echo "使用替代方法复制后端文件..."

# 如果上面的命令失败，手动复制文件
cp backend/package.json deployment/backend/
cp backend/Dockerfile deployment/backend/
cp backend/README.md deployment/backend/

echo "3. 创建部署包..."
cd deployment

# 创建单独的前端和后端压缩包
cd frontend
zip -r ../aloadecor-frontend.zip .
cd ..

cd backend
zip -r ../aloadecor-backend.zip .
cd ..

echo "4. 部署说明:"
echo "   前端: 将 aloadecor-frontend.zip 部署到 Netlify"
echo "   后端: 将 aloadecor-backend.zip 部署到 Railway"
echo "   配置: 设置前端的 VITE_API_URL 为后端服务器地址"

echo "=== 部署准备完成 ==="
echo "前端部署包位置: deployment/aloadecor-frontend.zip"
echo "后端部署包位置: deployment/aloadecor-backend.zip"