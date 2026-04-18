@echo off
REM FaCai-B 快速啟動腳本 (Windows)
REM 這個腳本會同時啟動前端和後端服務

setlocal enabledelayedexpansion

echo.
echo ========================================
echo     FaCai-B 車輛審核系統 - 快速啟動
echo ========================================
echo.

REM 獲取當前目錄
set SCRIPT_DIR=%~dp0
cd /d "%SCRIPT_DIR%"

REM 檢查並編譯後端
echo [1/4] 檢查後端編譯...
cd backend
call npm run build >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ✓ 後端編譯成功
) else (
    echo ✗ 後端編譯失敗
    echo   請嘗試: cd backend && npm install && npm run build
    pause
    exit /b 1
)

REM 啟動後端
echo [2/4] 啟動後端服務 (端口 5000)...
start "FaCai-B Backend" npm start
if %ERRORLEVEL% EQU 0 (
    echo ✓ 後端已啟動
) else (
    echo ✗ 後端啟動失敗
)

REM 返回主目錄
cd ..

REM 檢查前端依賴
echo [3/4] 檢查前端環境...
cd frontend
if not exist "node_modules" (
    echo 📥 安裝前端依賴...
    call npm install >nul 2>&1
)

REM 啟動前端
echo [4/4] 啟動前端服務 (端口 3000)...
start "FaCai-B Frontend" npm run dev
if %ERRORLEVEL% EQU 0 (
    echo ✓ 前端已啟動
) else (
    echo ✗ 前端啟動失敗
)

REM 返回主目錄
cd ..

echo.
echo ========================================
echo.
echo ✓ 系統啟動完成！
echo.
echo 📍 前端: http://localhost:3000
echo 📍 後端: http://localhost:5000
echo.
echo 請稍等 5-10 秒，讓服務完全啟動...
echo.
echo 常見功能:
echo   • 車輛審核:   /admin/audit
echo   • 所有車輛:   /vehicles
echo   • 會員管理:   /admin/users
echo   • 代客建檔:   /admin/vehicles/new
echo.
echo 如果無法訪問，請檢查:
echo   1. 後端是否在 http://localhost:5000/api/v1/health
echo   2. 前端是否在 http://localhost:3000
echo   3. 查看啟動的兩個窗口是否有錯誤信息
echo.
echo ========================================
pause
