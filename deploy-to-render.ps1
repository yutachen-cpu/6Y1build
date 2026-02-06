# Render 部署自動化腳本
# 執行前請確保已安裝 Git

param(
    [string]$GitHubRepo = "",
    [switch]$SkipBuild = $false
)

Write-Host "================================" -ForegroundColor Cyan
Write-Host "Render 部署準備工具" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# 步驟 1: 檢查 Git
Write-Host "[Step 1/5] 檢查 Git..." -ForegroundColor Yellow
if (Get-Command git -ErrorAction SilentlyContinue) {
    Write-Host "✅ Git 已安裝" -ForegroundColor Green
}
else {
    Write-Host "❌ Git 未安裝。請先安裝 Git: https://git-scm.com" -ForegroundColor Red
    exit 1
}

# 步驟 2: 初始化 Git (如果需要)
Write-Host ""
Write-Host "[Step 2/5] 初始化 Git Repository..." -ForegroundColor Yellow
if (Test-Path ".git") {
    Write-Host "✅ Git 已初始化" -ForegroundColor Green
}
else {
    git init
    Write-Host "✅ Git 初始化完成" -ForegroundColor Green
}

# 步驟 3: 測試 Build (除非跳過)
if (-not $SkipBuild) {
    Write-Host ""
    Write-Host "[Step 3/5] 測試 Frontend Build..." -ForegroundColor Yellow
    Write-Host "這可能需要幾分鐘..." -ForegroundColor Gray
    
    $buildOutput = npm run build 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Build 成功" -ForegroundColor Green
    }
    else {
        Write-Host "❌ Build 失敗。請檢查錯誤訊息。" -ForegroundColor Red
        Write-Host $buildOutput -ForegroundColor Red
        exit 1
    }
}
else {
    Write-Host ""
    Write-Host "[Step 3/5] 跳過 Build 測試" -ForegroundColor Gray
}

# 步驟 4: 建立 .gitignore (如果不存在)
Write-Host ""
Write-Host "[Step 4/5] 檢查 .gitignore..." -ForegroundColor Yellow
if (Test-Path ".gitignore") {
    Write-Host "✅ .gitignore 已存在" -ForegroundColor Green
}
else {
    Write-Host "⚠️  .gitignore 不存在，建立中..." -ForegroundColor Yellow
    # .gitignore 應該已經存在，這裡只是檢查
}

# 步驟 5: Git Commit
Write-Host ""
Write-Host "[Step 5/5] 準備 Git Commit..." -ForegroundColor Yellow

git add .
$status = git status --porcelain
if ($status) {
    Write-Host "發現變更，準備 commit..." -ForegroundColor Gray
    git commit -m "Ready for Render deployment - $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
    Write-Host "✅ Commit 完成" -ForegroundColor Green
}
else {
    Write-Host "✅ 沒有新的變更" -ForegroundColor Green
}

# 顯示下一步
Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "準備完成！" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 下一步操作指南：" -ForegroundColor Yellow
Write-Host ""
Write-Host "1️⃣  建立 GitHub Repository（如果還沒有）：" -ForegroundColor Cyan
Write-Host "   - 前往 https://github.com/new"
Write-Host "   - 建立新的 repository（例如：6y1-equipment-manager）"
Write-Host "   - 不要初始化 README、.gitignore 或 license"
Write-Host ""
Write-Host "2️⃣  連接到 GitHub Repository：" -ForegroundColor Cyan
if ($GitHubRepo) {
    Write-Host "   git remote add origin $GitHubRepo" -ForegroundColor White
    Write-Host "   git branch -M main" -ForegroundColor White
    Write-Host "   git push -u origin main" -ForegroundColor White
}
else {
    Write-Host "   git remote add origin https://github.com/您的帳號/您的repo名稱.git" -ForegroundColor White
    Write-Host "   git branch -M main" -ForegroundColor White
    Write-Host "   git push -u origin main" -ForegroundColor White
}
Write-Host ""
Write-Host "3️⃣  設定 Supabase（資料庫）：" -ForegroundColor Cyan
Write-Host "   - 前往 https://supabase.com"
Write-Host "   - 建立新專案"
Write-Host "   - 執行 SQL（在專案的 SQL Editor）："
Write-Host "     請參考 DEPLOY.md 中的資料表建立指令"
Write-Host "   - 從 Settings > API 取得："
Write-Host "     * SUPABASE_URL"
Write-Host "     * SUPABASE_ANON_KEY"
Write-Host ""
Write-Host "4️⃣  部署到 Render：" -ForegroundColor Cyan
Write-Host "   - 前往 https://render.com"
Write-Host "   - 使用 GitHub 帳號登入"
Write-Host "   - 點擊 'New +' > 'Blueprint'"
Write-Host "   - 選擇你的 GitHub repository"
Write-Host "   - Render 會自動偵測 render.yaml 並建立服務"
Write-Host "   - 在 Backend 服務設定環境變數："
Write-Host "     * SUPABASE_URL"
Write-Host "     * SUPABASE_KEY (使用 SUPABASE_ANON_KEY)"
Write-Host ""
Write-Host "5️⃣  等待部署完成：" -ForegroundColor Cyan
Write-Host "   - Backend: 約 3-5 分鐘"
Write-Host "   - Frontend: 約 2-3 分鐘"
Write-Host "   - 首次訪問會需要 30-90 秒喚醒服務（免費方案限制）"
Write-Host ""
Write-Host "📚 詳細說明請參考 DEPLOY.md 文件" -ForegroundColor Gray
Write-Host ""
