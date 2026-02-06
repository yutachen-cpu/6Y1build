# Windows PowerShell version - Deployment Pre-check
# Encoding: UTF-8

Write-Host "================================" -ForegroundColor Cyan
Write-Host "Render Deploy Pre-check" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

$allChecks = $true

# Check 1: Git initialized
if (Test-Path ".git") {
    Write-Host "[OK] Git initialized" -ForegroundColor Green
}
else {
    Write-Host "[FAIL] Git not initialized. Run: git init" -ForegroundColor Red
    $allChecks = $false
}

# Check 2: package.json exists
if (Test-Path "package.json") {
    Write-Host "[OK] package.json exists" -ForegroundColor Green
}
else {
    Write-Host "[FAIL] package.json missing" -ForegroundColor Red
    $allChecks = $false
}

# Check 3: Backend requirements.txt
if (Test-Path "backend/requirements.txt") {
    Write-Host "[OK] backend/requirements.txt exists" -ForegroundColor Green
}
else {
    Write-Host "[FAIL] backend/requirements.txt missing" -ForegroundColor Red
    $allChecks = $false
}

# Check 4: render.yaml config
if (Test-Path "render.yaml") {
    Write-Host "[OK] render.yaml exists" -ForegroundColor Green
}
else {
    Write-Host "[FAIL] render.yaml missing" -ForegroundColor Red
    $allChecks = $false
}

# Check 5: Environment example files
if ((Test-Path ".env.example") -and (Test-Path "backend/.env.example")) {
    Write-Host "[OK] Environment example files exist" -ForegroundColor Green
}
else {
    Write-Host "[WARN] .env.example files recommended" -ForegroundColor Yellow
}

# Check 6: .gitignore
if (Test-Path ".gitignore") {
    $content = Get-Content ".gitignore" -Raw
    if ($content -match "\.env") {
        Write-Host "[OK] .gitignore configured for .env" -ForegroundColor Green
    }
    else {
        Write-Host "[WARN] .gitignore missing .env" -ForegroundColor Yellow
    }
}
else {
    Write-Host "[FAIL] .gitignore missing" -ForegroundColor Red
    $allChecks = $false
}

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
if ($allChecks) {
    Write-Host "All checks passed! Ready to deploy" -ForegroundColor Green
}
else {
    Write-Host "Issues found, please fix before deployment" -ForegroundColor Red
}
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Ensure Supabase project is created with URL and Key"
Write-Host "2. Push code to GitHub:"
Write-Host "   git add ."
Write-Host "   git commit -m 'Ready for Render deployment'"
Write-Host "   git push origin main"
Write-Host "3. Go to Render.com and create Blueprint"
Write-Host ""
