#!/bin/bash
# distディレクトリの存在と内容を確認するスクリプト
# Cloudflare PagesのDeploy commandで使用

if [ ! -d "dist" ]; then
  echo "Error: dist directory not found"
  exit 1
fi

if [ ! -f "dist/index.html" ]; then
  echo "Error: dist/index.html not found"
  exit 1
fi

echo "✓ dist directory exists"
echo "✓ dist/index.html exists"
echo "✓ Ready for deployment"
exit 0

