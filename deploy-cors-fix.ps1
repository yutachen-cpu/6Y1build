# 🚀 快速部署 CORS 修復

Write-Host "🔧 準備部署 CORS 修復..." -ForegroundColor Cyan
Write-Host ""

# 檢查變更
Write-Host "📋 檢查 backend/main.py 的變更..." -ForegroundColor Yellow
git diff backend/main.py

Write-Host ""
Write-Host "📦 準備提交:" -ForegroundColor Green
Write-Host "  ✓ backend/main.py (修復 CORS 配置)" -ForegroundColor Gray
Write-Host ""
Write-Host "修復內容:" -ForegroundColor Cyan
Write-Host "  - 修正 origins 列表語法錯誤" -ForegroundColor Gray
Write-Host "  - 添加前端域名: https://sixy1build-1.onrender.com" -ForegroundColor Gray
Write-Host "  - 支援環境變數 CORS_ORIGINS" -ForegroundColor Gray
Write-Host "  - 添加調試輸出" -ForegroundColor Gray

Write-Host ""
$confirm = Read-Host "是否要提交並推送？ (y/N)"

if ($confirm -eq 'y' -or $confirm -eq 'Y') {
    Write-Host ""
    Write-Host "📝 提交變更..." -ForegroundColor Cyan
    
    git add backend/main.py
    git add CORS_FIX.md
    
    git commit -m "fix: 修復 CORS 配置，允許前端域名訪問

- 修正 origins 列表語法錯誤
- 明確添加前端域名 https://sixy1build-1.onrender.com
- 支援從環境變數 CORS_ORIGINS 讀取
- 添加 CORS 配置調試輸出
- 修復 'Access-Control-Allow-Origin' header 缺失問題"
    
    Write-Host ""
    Write-Host "🌐 推送到遠端..." -ForegroundColor Cyan
    git push origin main
    
    Write-Host ""
    Write-Host "✅ 已推送成功！" -ForegroundColor Green
    Write-Host ""
    Write-Host "⏰ 等待 Render 重新部署..." -ForegroundColor Yellow
    Write-Host "   預計需要 2-3 分鐘" -ForegroundColor Gray
    Write-Host ""
    Write-Host "📊 下一步:" -ForegroundColor Cyan
    Write-Host "   1. 前往 Render Dashboard 查看部署狀態" -ForegroundColor Gray
    Write-Host "      https://dashboard.render.com/" -ForegroundColor Blue
    Write-Host ""
    Write-Host "   2. 部署完成後，刷新前端網站測試" -ForegroundColor Gray
    Write-Host "      https://sixy1build-1.onrender.com/" -ForegroundColor Blue
    Write-Host ""
    Write-Host "   3. 檢查瀏覽器 Console，確認無 CORS 錯誤" -ForegroundColor Gray
    Write-Host ""
    Write-Host "🎉 CORS 問題應該已經解決！" -ForegroundColor Magenta
    
} else {
    Write-Host ""
    Write-Host "❌ 已取消部署" -ForegroundColor Red
    Write-Host ""
    Write-Host "稍後可手動執行:" -ForegroundColor Gray
    Write-Host "  git add backend/main.py" -ForegroundColor DarkGray
    Write-Host "  git commit -m 'fix: CORS configuration'" -ForegroundColor DarkGray
    Write-Host "  git push origin main" -ForegroundColor DarkGray
}

Write-Host ""
