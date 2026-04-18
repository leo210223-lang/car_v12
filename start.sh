#!/bin/bash
# FaCai-B 快速啟動腳本

echo "🚀 啟動 FaCai-B 車輛審核系統..."
echo ""

# 檢查後端
echo "📌 檢查後端編譯..."
cd backend
npm run build > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ 後端編譯成功"
else
    echo "❌ 後端編譯失敗"
    exit 1
fi

# 後台啟動後端
echo "📌 啟動後端服務 (端口 5000)..."
npm start > ../backend.log 2>&1 &
BACKEND_PID=$!
echo "✅ 後端已啟動 (PID: $BACKEND_PID)"

# 返回根目錄
cd ..

# 檢查前端依賴
echo "📌 檢查前端依賴..."
cd frontend
if [ ! -d "node_modules" ]; then
    echo "📥 安裝前端依賴..."
    npm install > /dev/null 2>&1
fi

# 後台啟動前端
echo "📌 啟動前端服務 (端口 3000)..."
npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
echo "✅ 前端已啟動 (PID: $FRONTEND_PID)"

cd ..

# 等待服務啟動
echo ""
echo "⏳ 等待服務啟動 (5 秒)..."
sleep 5

# 驗證服務
echo ""
echo "🔍 驗證服務..."

# 檢查後端
if curl -s http://localhost:5000/api/v1/health | grep -q "ok"; then
    echo "✅ 後端服務正常: http://localhost:5000"
else
    echo "⚠️  後端服務狀態未知，檢查日誌: backend.log"
fi

# 檢查前端
if curl -s http://localhost:3000 | grep -q "DOCTYPE"; then
    echo "✅ 前端服務正常: http://localhost:3000"
else
    echo "⚠️  前端服務狀態未知，檢查日誌: frontend.log"
fi

echo ""
echo "=========================================="
echo "✅ 系統已啟動！"
echo ""
echo "📍 前端: http://localhost:3000"
echo "📍 後端: http://localhost:5000"
echo ""
echo "📋 後端進程 ID: $BACKEND_PID"
echo "📋 前端進程 ID: $FRONTEND_PID"
echo ""
echo "📖 查看日誌:"
echo "   後端: tail -f backend.log"
echo "   前端: tail -f frontend.log"
echo ""
echo "⏹️  停止服務: kill $BACKEND_PID $FRONTEND_PID"
echo "=========================================="
