#!/bin/bash
# 一鍵部署到 Render
# 此腳本會引導你完成所有部署步驟

set -e

echo "================================"
echo "🚀 Render 一鍵部署助手"
echo "================================"
echo ""

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Step 1: Check Git
echo -e "${YELLOW}[1/3] 檢查 Git...${NC}"
if ! command -v git &> /dev/null; then
    echo -e "${RED}❌ Git 未安裝${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Git 已安裝${NC}"
echo ""

# Step 2: Initialize and Commit
echo -e "${YELLOW}[2/3] 準備 Git Repository...${NC}"
if [ ! -d ".git" ]; then
    git init
    echo -e "${GREEN}✅ Git 已初始化${NC}"
fi

git add .
if git diff-index --quiet HEAD --; then
    echo -e "${GREEN}✅ 無新變更${NC}"
else
    git commit -m "Ready for Render deployment - $(date '+%Y-%m-%d %H:%M')"
    echo -e "${GREEN}✅ 變更已提交${NC}"
fi
echo ""

# Step 3: Instructions for GitHub
echo -e "${YELLOW}[3/3] 下一步...${NC}"
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ 部署準備完成！${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}請按照以下步驟完成部署：${NC}"
echo ""
echo "1️⃣  建立 Supabase 專案"
echo "   → https://supabase.com"
echo "   → 執行 QUICKSTART.md 中的 SQL"
echo ""
echo "2️⃣  推送到 GitHub"
echo "   → 先在 https://github.com/new 建立 repo"
echo "   → 然後執行："
echo ""
echo -e "${BLUE}   git remote add origin https://github.com/你的帳號/你的repo.git${NC}"
echo -e "${BLUE}   git branch -M main${NC}"
echo -e "${BLUE}   git push -u origin main${NC}"
echo ""
echo "3️⃣  部署到 Render"
echo "   → https://render.com"
echo "   → New + → Blueprint"
echo "   → 選擇你的 GitHub repo"
echo "   → 設定 Backend 環境變數"
echo ""
echo -e "${GREEN}詳細說明請參考 QUICKSTART.md${NC}"
echo ""
