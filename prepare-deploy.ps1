# Render Deployment Preparation Script
# Make sure Git is installed before running

Write-Host "================================" -ForegroundColor Cyan
Write-Host "Render Deployment Preparation" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check Git
Write-Host "[Step 1/4] Checking Git..." -ForegroundColor Yellow
if (Get-Command git -ErrorAction SilentlyContinue) {
    Write-Host "OK - Git is installed" -ForegroundColor Green
}
else {
    Write-Host "FAIL - Git not installed. Install from: https://git-scm.com" -ForegroundColor Red
    exit 1
}

# Step 2: Initialize Git
Write-Host ""
Write-Host "[Step 2/4] Initializing Git Repository..." -ForegroundColor Yellow
if (Test-Path ".git") {
    Write-Host "OK - Git already initialized" -ForegroundColor Green
}
else {
    git init
    Write-Host "OK - Git initialized" -ForegroundColor Green
}

# Step 3: Check files
Write-Host ""
Write-Host "[Step 3/4] Checking deployment files..." -ForegroundColor Yellow
$allFiles = $true
if (Test-Path "render.yaml") {
    Write-Host "OK - render.yaml exists" -ForegroundColor Green
}
else {
    Write-Host "FAIL - render.yaml missing" -ForegroundColor Red
    $allFiles = $false
}

if (Test-Path "package.json") {
    Write-Host "OK - package.json exists" -ForegroundColor Green
}
else {
    Write-Host "FAIL - package.json missing" -ForegroundColor Red
    $allFiles = $false
}

if (Test-Path "backend/requirements.txt") {
    Write-Host "OK - backend/requirements.txt exists" -ForegroundColor Green
}
else {
    Write-Host "FAIL - backend/requirements.txt missing" -ForegroundColor Red
    $allFiles = $false
}

if (-not $allFiles) {
    Write-Host ""
    Write-Host "Missing required files. Aborting." -ForegroundColor Red
    exit 1
}

# Step 4: Git Commit
Write-Host ""
Write-Host "[Step 4/4] Creating Git commit..." -ForegroundColor Yellow

git add .
$status = git status --porcelain
if ($status) {
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm"
    git commit -m "Ready for Render deployment - $timestamp"
    Write-Host "OK - Changes committed" -ForegroundColor Green
}
else {
    Write-Host "OK - No changes to commit" -ForegroundColor Green
}

# Summary
Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "Preparation Complete!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Create GitHub Repository:" -ForegroundColor Cyan
Write-Host "   Go to: https://github.com/new"
Write-Host "   Create new repo (e.g., 6y1-equipment-manager)"
Write-Host ""
Write-Host "2. Push to GitHub:" -ForegroundColor Cyan
Write-Host "   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git"
Write-Host "   git branch -M main"
Write-Host "   git push -u origin main"
Write-Host ""
Write-Host "3. Setup Supabase Database:" -ForegroundColor Cyan
Write-Host "   Go to: https://supabase.com"
Write-Host "   Create new project"
Write-Host "   Run SQL from DEPLOY.md"
Write-Host "   Get SUPABASE_URL and SUPABASE_ANON_KEY from Settings > API"
Write-Host ""
Write-Host "4. Deploy to Render:" -ForegroundColor Cyan
Write-Host "   Go to: https://render.com"
Write-Host "   Login with GitHub"
Write-Host "   Click 'New +' > 'Blueprint'"
Write-Host "   Select your GitHub repository"
Write-Host "   Set environment variables for backend:"
Write-Host "     - SUPABASE_URL"
Write-Host "     - SUPABASE_KEY"
Write-Host ""
Write-Host "For detailed instructions, see DEPLOY.md" -ForegroundColor Gray
Write-Host ""
