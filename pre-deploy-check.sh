#!/bin/bash
# 部署前檢查清單

echo "================================"
echo "Render 部署前檢查清單"
echo "================================"
echo ""

# 檢查 1: Git 初始化
if [ -d ".git" ]; then
    echo "✅ Git 已初始化"
else
    echo "❌ Git 未初始化。請執行: git init"
    exit 1
fi

# 檢查 2: package.json 存在
if [ -f "package.json" ]; then
    echo "✅ package.json 存在"
else
    echo "❌ package.json 不存在"
    exit 1
fi

# 檢查 3: Backend requirements.txt
if [ -f "backend/requirements.txt" ]; then
    echo "✅ backend/requirements.txt 存在"
else
    echo "❌ backend/requirements.txt 不存在"
    exit 1
fi

# 檢查 4: render.yaml 配置
if [ -f "render.yaml" ]; then
    echo "✅ render.yaml 存在"
else
    echo "❌ render.yaml 不存在"
    exit 1
fi

# 檢查 5: 環境變數範例檔案
if [ -f ".env.example" ] && [ -f "backend/.env.example" ]; then
    echo "✅ 環境變數範例檔案存在"
else
    echo "⚠️  建議建立 .env.example 檔案"
fi

# 檢查 6: .gitignore
if [ -f ".gitignore" ]; then
    if grep -q ".env" ".gitignore"; then
        echo "✅ .gitignore 已設定忽略 .env 檔案"
    else
        echo "⚠️  .gitignore 未包含 .env"
    fi
else
    echo "❌ .gitignore 不存在"
fi

echo ""
echo "================================"
echo "檢查完成！"
echo "================================"
echo ""
echo "下一步："
echo "1. 確認 Supabase 專案已建立並取得 URL 和 Key"
echo "2. 將程式碼推送到 GitHub:"
echo "   git add ."
echo "   git commit -m 'Ready for Render deployment'"
echo "   git push origin main"
echo "3. 前往 Render.com 建立 Blueprint"
echo ""
