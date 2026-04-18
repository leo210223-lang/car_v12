# FaCai-B 快速啟動腳本 (PowerShell)
# 使用方法: .\start-system.ps1

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "     FaCai-B 車輛審核系統 - 快速啟動" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

# ============================================================================
# Step 1: 編譯後端
# ============================================================================

Write-Host "[1/4] 檢查後端編譯..." -ForegroundColor Yellow

Set-Location backend

Write-Host "      編譯中..." -ForegroundColor Gray
$buildResult = & npm run build 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "      ✓ 後端編譯成功" -ForegroundColor Green
} else {
    Write-Host "      ✗ 後端編譯失敗" -ForegroundColor Red
    Write-Host "      錯誤信息: $buildResult" -ForegroundColor Red
    Write-Host ""
    Write-Host "      請嘗試:" -ForegroundColor Yellow
    Write-Host "      cd backend && npm install && npm run build" -ForegroundColor Yellow
    Read-Host "      按 Enter 退出"
    exit 1
}

# ============================================================================
# Step 2: 啟動後端
# ============================================================================

Write-Host "[2/4] 啟動後端服務 (端口 5000)..." -ForegroundColor Yellow

$backendProcess = Start-Process -FilePath npm `
                                 -ArgumentList "start" `
                                 -WorkingDirectory (Get-Location) `
                                 -WindowStyle Hidden `
                                 -PassThru

Start-Sleep -Seconds 2

if ($null -ne $backendProcess -and -not $backendProcess.HasExited) {
    Write-Host "      ✓ 後端已啟動 (PID: $($backendProcess.Id))" -ForegroundColor Green
} else {
    Write-Host "      ✗ 後端啟動失敗" -ForegroundColor Red
}

# ============================================================================
# Step 3: 檢查前端環境並啟動
# ============================================================================

Set-Location $scriptDir
Set-Location frontend

Write-Host "[3/4] 檢查前端環境..." -ForegroundColor Yellow

if (-not (Test-Path "node_modules")) {
    Write-Host "      安裝依賴中..." -ForegroundColor Gray
    & npm install | Out-Null
    Write-Host "      ✓ 依賴安裝完成" -ForegroundColor Green
} else {
    Write-Host "      ✓ 依賴已就緒" -ForegroundColor Green
}

# ============================================================================
# Step 4: 啟動前端
# ============================================================================

Write-Host "[4/4] 啟動前端服務 (端口 3000)..." -ForegroundColor Yellow

$frontendProcess = Start-Process -FilePath npm `
                                  -ArgumentList "run", "dev" `
                                  -WorkingDirectory (Get-Location) `
                                  -WindowStyle Hidden `
                                  -PassThru

Start-Sleep -Seconds 2

if ($null -ne $frontendProcess -and -not $frontendProcess.HasExited) {
    Write-Host "      ✓ 前端已啟動 (PID: $($frontendProcess.Id))" -ForegroundColor Green
} else {
    Write-Host "      ✗ 前端啟動失敗" -ForegroundColor Red
}

# ============================================================================
# 驗證服務
# ============================================================================

Write-Host ""
Write-Host "⏳ 等待服務啟動 (5 秒)..." -ForegroundColor Cyan
Start-Sleep -Seconds 5

Write-Host ""
Write-Host "🔍 驗證服務狀態..." -ForegroundColor Cyan
Write-Host ""

$backendHealthy = $false
$frontendHealthy = $false

try {
    $backendResponse = Invoke-WebRequest -Uri "http://localhost:5000/api/v1/health" -TimeoutSec 2 -ErrorAction SilentlyContinue
    if ($backendResponse.StatusCode -eq 200) {
        Write-Host "✓ 後端服務正常: http://localhost:5000" -ForegroundColor Green
        $backendHealthy = $true
    }
} catch {
    Write-Host "⚠ 後端服務未就緒（5-10秒後重試）" -ForegroundColor Yellow
}

try {
    $frontendResponse = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 2 -ErrorAction SilentlyContinue
    if ($frontendResponse.StatusCode -eq 200) {
        Write-Host "✓ 前端服務正常: http://localhost:3000" -ForegroundColor Green
        $frontendHealthy = $true
    }
} catch {
    Write-Host "⚠ 前端服務未就緒（5-10秒後重試）" -ForegroundColor Yellow
}

# ============================================================================
# 顯示信息
# ============================================================================

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✓ 系統啟動完成！" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "📍 前端: " -ForegroundColor Cyan -NoNewline
Write-Host "http://localhost:3000" -ForegroundColor White

Write-Host "📍 後端: " -ForegroundColor Cyan -NoNewline
Write-Host "http://localhost:5000" -ForegroundColor White

Write-Host ""
Write-Host "📋 進程信息:" -ForegroundColor Cyan
Write-Host "   後端 PID: $($backendProcess.Id)" -ForegroundColor Gray
Write-Host "   前端 PID: $($frontendProcess.Id)" -ForegroundColor Gray

Write-Host ""
Write-Host "📖 常見功能:" -ForegroundColor Cyan
Write-Host "   • 車輛審核:   http://localhost:3000/admin/audit" -ForegroundColor Gray
Write-Host "   • 所有車輛:   http://localhost:3000/vehicles" -ForegroundColor Gray
Write-Host "   • 會員管理:   http://localhost:3000/admin/users" -ForegroundColor Gray
Write-Host "   • 代客建檔:   http://localhost:3000/admin/vehicles/new" -ForegroundColor Gray

Write-Host ""
Write-Host "🆘 故障排除:" -ForegroundColor Cyan

if (-not $backendHealthy) {
    Write-Host "   ⚠ 後端不在線:" -ForegroundColor Yellow
    Write-Host "     請檢查 5000 端口是否被占用" -ForegroundColor Gray
    Write-Host "     或檢查後端窗口是否有錯誤信息" -ForegroundColor Gray
}

if (-not $frontendHealthy) {
    Write-Host "   ⚠ 前端不在線:" -ForegroundColor Yellow
    Write-Host "     請檢查 3000 端口是否被占用" -ForegroundColor Gray
    Write-Host "     或檢查前端窗口是否有錯誤信息" -ForegroundColor Gray
}

Write-Host ""
Write-Host "⏹️  關閉系統: Kill-Process -Id $($backendProcess.Id), $($frontendProcess.Id)" -ForegroundColor Cyan
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 保持 PowerShell 窗口打開
Write-Host "按 Ctrl+C 停止服務並退出..." -ForegroundColor Yellow

# 監控進程
while ($true) {
    if ($backendProcess.HasExited -or $frontendProcess.HasExited) {
        Write-Host ""
        Write-Host "⚠️  檢測到進程退出" -ForegroundColor Red
        if ($backendProcess.HasExited) {
            Write-Host "   後端進程已停止" -ForegroundColor Red
        }
        if ($frontendProcess.HasExited) {
            Write-Host "   前端進程已停止" -ForegroundColor Red
        }
        break
    }
    Start-Sleep -Seconds 5
}
