#!/bin/bash

##############################################################################
# FaCai-B 車輛審核系統 - 自動化測試套件
# 文件: test-automation.sh
# 功能: 完整的 API 端點自動化測試
# 使用: ./test-automation.sh
##############################################################################

set -e  # Exit on error

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="http://localhost:5000/api/v1"
ADMIN_EMAIL="admin@test.com"
ADMIN_PASSWORD="password123"
USER_EMAIL="user-a@test.com"
USER_PASSWORD="password123"
SUSPENDED_EMAIL="user-b@test.com"
SUSPENDED_PASSWORD="password123"

# Test counters
TOTAL=0
PASSED=0
FAILED=0
SKIPPED=0

# Tokens
ADMIN_TOKEN=""
USER_TOKEN=""
SUSPENDED_TOKEN=""

# Test data
TEST_VEHICLE_ID=""
TEST_PROXY_VEHICLE_ID=""

##############################################################################
# Helper Functions
##############################################################################

# Colors helper
print_header() {
  echo -e "\n${MAGENTA}╔══════════════════════════════════════════════════════════╗${NC}"
  echo -e "${MAGENTA}║${NC} $1"
  echo -e "${MAGENTA}╚══════════════════════════════════════════════════════════╝${NC}\n"
}

print_section() {
  echo -e "\n${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${CYAN}📋 $1${NC}"
  echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
}

print_test() {
  echo -ne "${BLUE}Test $TOTAL: ${NC}$1 ... "
}

print_pass() {
  echo -e "${GREEN}✅ PASSED${NC}"
  PASSED=$((PASSED + 1))
}

print_fail() {
  echo -e "${RED}❌ FAILED${NC}: $1"
  FAILED=$((FAILED + 1))
}

print_skip() {
  echo -e "${YELLOW}⏭️  SKIPPED${NC}: $1"
  SKIPPED=$((SKIPPED + 1))
}

# Test wrapper
run_test() {
  local test_name=$1
  local method=$2
  local endpoint=$3
  local data=$4
  local expected_status=$5
  local token=$6
  local should_skip=$7
  
  TOTAL=$((TOTAL + 1))
  
  if [ "$should_skip" == "true" ]; then
    print_test "$test_name"
    print_skip "test data not ready"
    return 0
  fi
  
  print_test "$test_name"
  
  # Build curl command
  local curl_cmd="curl -s -w '\n%{http_code}' -X $method '$BASE_URL$endpoint'"
  
  if [ -n "$token" ]; then
    curl_cmd="$curl_cmd -H 'Authorization: Bearer $token'"
  fi
  
  if [ -n "$data" ] && [ "$data" != "none" ]; then
    curl_cmd="$curl_cmd -H 'Content-Type: application/json' -d '$data'"
  fi
  
  # Execute curl
  local response=$(eval "$curl_cmd")
  local http_code=$(echo "$response" | tail -n1)
  local body=$(echo "$response" | head -n-1)
  
  # Check status code
  if [ "$http_code" == "$expected_status" ]; then
    print_pass
    # Store response for later use if needed
    echo "$body" > /tmp/test_response.json 2>/dev/null || true
    return 0
  else
    print_fail "Expected $expected_status, got $http_code"
    if [ -n "$body" ]; then
      echo -e "${RED}Response: $body${NC}"
    fi
    return 1
  fi
}

# Authenticate users
authenticate_users() {
  print_section "認證用戶"
  
  echo "🔐 獲取管理員令牌..."
  ADMIN_TOKEN=$(curl -s -X POST "$BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}" | jq -r '.data.token' 2>/dev/null)
  
  if [ -z "$ADMIN_TOKEN" ] || [ "$ADMIN_TOKEN" == "null" ]; then
    echo -e "${RED}❌ 無法獲取管理員令牌${NC}"
    echo "提示: 確保已在數據庫中創建測試用戶"
    exit 1
  fi
  echo -e "${GREEN}✅ 管理員令牌: ${ADMIN_TOKEN:0:20}...${NC}\n"
  
  echo "🔐 獲取普通用戶令牌..."
  USER_TOKEN=$(curl -s -X POST "$BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$USER_EMAIL\",\"password\":\"$USER_PASSWORD\"}" | jq -r '.data.token' 2>/dev/null)
  
  if [ -z "$USER_TOKEN" ] || [ "$USER_TOKEN" == "null" ]; then
    echo -e "${RED}❌ 無法獲取普通用戶令牌${NC}"
    exit 1
  fi
  echo -e "${GREEN}✅ 普通用戶令牌: ${USER_TOKEN:0:20}...${NC}\n"
  
  echo "🔐 獲取懸停用戶令牌..."
  SUSPENDED_TOKEN=$(curl -s -X POST "$BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$SUSPENDED_EMAIL\",\"password\":\"$SUSPENDED_PASSWORD\"}" | jq -r '.data.token' 2>/dev/null)
  
  if [ -z "$SUSPENDED_TOKEN" ] || [ "$SUSPENDED_TOKEN" == "null" ]; then
    echo -e "${YELLOW}⚠️  懸停用戶令牌獲取失敗（可能用戶不存在）${NC}\n"
  else
    echo -e "${GREEN}✅ 懸停用戶令牌: ${SUSPENDED_TOKEN:0:20}...${NC}\n"
  fi
}

##############################################################################
# Test Suites
##############################################################################

test_authentication() {
  print_section "🔐 認證端點測試"
  
  # Test 1: Valid login
  run_test \
    "有效的管理員登錄" \
    "POST" \
    "/auth/login" \
    "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}" \
    "200"
  
  # Test 2: Invalid password
  run_test \
    "無效密碼" \
    "POST" \
    "/auth/login" \
    "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"wrongpassword\"}" \
    "401"
  
  # Test 3: Non-existent user
  run_test \
    "不存在的用戶" \
    "POST" \
    "/auth/login" \
    "{\"email\":\"nonexistent@test.com\",\"password\":\"password\"}" \
    "401"
}

test_admin_pending_list() {
  print_section "📋 管理員待審核列表"
  
  # Test 1: Get pending vehicles (authenticated)
  run_test \
    "獲取待審核列表（認證）" \
    "GET" \
    "/admin/vehicles/pending" \
    "" \
    "200" \
    "$ADMIN_TOKEN"
  
  # Test 2: Get pending with limit
  run_test \
    "獲取待審核列表（自定義限制）" \
    "GET" \
    "/admin/vehicles/pending?limit=10" \
    "" \
    "200" \
    "$ADMIN_TOKEN"
  
  # Test 3: Without authentication
  run_test \
    "未認證訪問" \
    "GET" \
    "/admin/vehicles/pending" \
    "" \
    "401"
  
  # Test 4: With invalid token
  run_test \
    "無效令牌" \
    "GET" \
    "/admin/vehicles/pending" \
    "" \
    "401" \
    "invalid.token.here"
  
  # Test 5: User tries to access admin endpoint
  run_test \
    "普通用戶訪問管理員端點" \
    "GET" \
    "/admin/vehicles/pending" \
    "" \
    "403" \
    "$USER_TOKEN"
}

test_vehicle_detail() {
  print_section "🚗 車輛詳情端點"
  
  # Test 1: Valid vehicle ID
  # Note: Replace with actual UUID from test data
  SAMPLE_VEHICLE_ID="550e8400-e29b-41d4-a716-446655440000"
  
  run_test \
    "獲取車輛詳情（有效ID）" \
    "GET" \
    "/admin/vehicles/$SAMPLE_VEHICLE_ID/detail" \
    "" \
    "200" \
    "$ADMIN_TOKEN"
  
  # Test 2: Invalid UUID format
  run_test \
    "無效的UUID格式" \
    "GET" \
    "/admin/vehicles/invalid-uuid/detail" \
    "" \
    "400" \
    "$ADMIN_TOKEN"
  
  # Test 3: Non-existent vehicle
  NON_EXISTENT_ID="550e8400-e29b-41d4-a716-999999999999"
  run_test \
    "不存在的車輛ID" \
    "GET" \
    "/admin/vehicles/$NON_EXISTENT_ID/detail" \
    "" \
    "404" \
    "$ADMIN_TOKEN"
}

test_vehicle_approval() {
  print_section "✅ 車輛核准端點"
  
  SAMPLE_VEHICLE_ID="550e8400-e29b-41d4-a716-446655440000"
  
  # Test 1: Approve valid vehicle
  run_test \
    "核准有效車輛" \
    "POST" \
    "/admin/vehicles/$SAMPLE_VEHICLE_ID/approve" \
    "{}" \
    "200" \
    "$ADMIN_TOKEN"
  
  # Test 2: Try to approve non-existent vehicle
  NON_EXISTENT_ID="550e8400-e29b-41d4-a716-999999999999"
  run_test \
    "核准不存在的車輛" \
    "POST" \
    "/admin/vehicles/$NON_EXISTENT_ID/approve" \
    "{}" \
    "404" \
    "$ADMIN_TOKEN"
  
  # Test 3: Unauthorized user tries to approve
  run_test \
    "普通用戶嘗試核准車輛" \
    "POST" \
    "/admin/vehicles/$SAMPLE_VEHICLE_ID/approve" \
    "{}" \
    "403" \
    "$USER_TOKEN"
}

test_vehicle_rejection() {
  print_section "❌ 車輛拒絕端點"
  
  SAMPLE_VEHICLE_ID="550e8400-e29b-41d4-a716-446655440001"
  
  # Test 1: Reject with valid reason
  run_test \
    "有效拒絕原因" \
    "POST" \
    "/admin/vehicles/$SAMPLE_VEHICLE_ID/reject" \
    "{\"rejection_reason\":\"車輛狀況不符合要求\"}" \
    "200" \
    "$ADMIN_TOKEN"
  
  # Test 2: Reject without reason
  run_test \
    "拒絕不提供原因" \
    "POST" \
    "/admin/vehicles/$SAMPLE_VEHICLE_ID/reject" \
    "{\"rejection_reason\":\"\"}" \
    "400" \
    "$ADMIN_TOKEN"
  
  # Test 3: Reject with empty/whitespace reason
  run_test \
    "拒絕原因為空格" \
    "POST" \
    "/admin/vehicles/$SAMPLE_VEHICLE_ID/reject" \
    "{\"rejection_reason\":\"   \"}" \
    "400" \
    "$ADMIN_TOKEN"
  
  # Test 4: Missing rejection_reason field
  run_test \
    "缺少rejection_reason字段" \
    "POST" \
    "/admin/vehicles/$SAMPLE_VEHICLE_ID/reject" \
    "{}" \
    "400" \
    "$ADMIN_TOKEN"
}

test_image_upload() {
  print_section "🖼️  圖片上傳端點"
  
  SAMPLE_VEHICLE_ID="550e8400-e29b-41d4-a716-446655440002"
  
  echo -e "${YELLOW}注意: 圖片上傳測試需要先創建測試圖片${NC}\n"
  
  # Check if test images exist
  if [ ! -d "test-data/images" ]; then
    echo -e "${YELLOW}⏭️  創建測試圖片目錄...${NC}"
    mkdir -p test-data/images
    
    # Try to create test image (requires ImageMagick)
    if command -v convert &> /dev/null; then
      convert -size 800x600 xc:blue test-data/images/test-image.jpg 2>/dev/null || true
      echo -e "${GREEN}✅ 測試圖片已創建${NC}\n"
    else
      echo -e "${YELLOW}⚠️  ImageMagick 未安裝，跳過圖片創建${NC}\n"
    fi
  fi
  
  # Test image upload
  if [ -f "test-data/images/test-image.jpg" ]; then
    # Create temporary curl command for multipart
    CURL_CMD="curl -s -w '\n%{http_code}' -X POST '$BASE_URL/admin/vehicles/$SAMPLE_VEHICLE_ID/images' \
      -H 'Authorization: Bearer $ADMIN_TOKEN' \
      -F 'images=@test-data/images/test-image.jpg'"
    
    TOTAL=$((TOTAL + 1))
    print_test "上傳單個圖片"
    
    local response=$(eval "$CURL_CMD")
    local http_code=$(echo "$response" | tail -n1)
    
    if [ "$http_code" == "200" ]; then
      print_pass
    else
      print_fail "Expected 200, got $http_code"
    fi
  else
    TOTAL=$((TOTAL + 1))
    print_test "上傳單個圖片"
    print_skip "test image not available"
  fi
}

test_proxy_creation() {
  print_section "👨‍💼 代客建檔端點"
  
  # Test 1: Create proxy vehicle with valid data
  run_test \
    "創建代客建檔車輛" \
    "POST" \
    "/admin/vehicles/proxy" \
    "{
      \"owner_dealer_id\":\"550e8400-e29b-41d4-a716-222222222222\",
      \"brand_id\":\"550e8400-e29b-41d4-a716-333333333333\",
      \"spec_id\":\"550e8400-e29b-41d4-a716-444444444444\",
      \"model_id\":\"550e8400-e29b-41d4-a716-555555555555\",
      \"year\":2023,
      \"listing_price\":500000
    }" \
    "201" \
    "$ADMIN_TOKEN"
  
  # Test 2: Missing required fields
  run_test \
    "缺少必需字段" \
    "POST" \
    "/admin/vehicles/proxy" \
    "{\"owner_dealer_id\":\"550e8400-e29b-41d4-a716-222222222222\"}" \
    "400" \
    "$ADMIN_TOKEN"
  
  # Test 3: Non-existent owner
  run_test \
    "指定不存在的車主" \
    "POST" \
    "/admin/vehicles/proxy" \
    "{
      \"owner_dealer_id\":\"550e8400-e29b-41d4-a716-999999999999\",
      \"brand_id\":\"550e8400-e29b-41d4-a716-333333333333\",
      \"spec_id\":\"550e8400-e29b-41d4-a716-444444444444\",
      \"model_id\":\"550e8400-e29b-41d4-a716-555555555555\",
      \"year\":2023,
      \"listing_price\":500000
    }" \
    "400" \
    "$ADMIN_TOKEN"
}

test_user_vehicles() {
  print_section "👤 用戶車輛端點"
  
  # Test 1: Get user's vehicles
  run_test \
    "獲取用戶車輛列表" \
    "GET" \
    "/vehicles" \
    "" \
    "200" \
    "$USER_TOKEN"
  
  # Test 2: Create user vehicle
  run_test \
    "用戶提交車輛審核" \
    "POST" \
    "/vehicles" \
    "{
      \"brand_id\":\"550e8400-e29b-41d4-a716-333333333333\",
      \"spec_id\":\"550e8400-e29b-41d4-a716-444444444444\",
      \"model_id\":\"550e8400-e29b-41d4-a716-555555555555\",
      \"year\":2023,
      \"listing_price\":450000
    }" \
    "201" \
    "$USER_TOKEN"
  
  # Test 3: Get vehicles without authentication
  run_test \
    "未認證獲取車輛列表" \
    "GET" \
    "/vehicles" \
    "" \
    "401"
}

test_edge_cases() {
  print_section "🔍 邊界情況測試"
  
  # Test 1: Empty UUID
  run_test \
    "空 UUID" \
    "GET" \
    "/admin/vehicles//detail" \
    "" \
    "404" \
    "$ADMIN_TOKEN"
  
  # Test 2: Very long string as UUID
  LONG_ID=$(printf 'a%.0s' {1..500})
  run_test \
    "超長字符串作為 UUID" \
    "GET" \
    "/admin/vehicles/$LONG_ID/detail" \
    "" \
    "400" \
    "$ADMIN_TOKEN"
  
  # Test 3: Special characters in UUID
  run_test \
    "特殊字符 UUID" \
    "GET" \
    "/admin/vehicles/550e8400-e29b-41d4-<>@/detail" \
    "" \
    "400" \
    "$ADMIN_TOKEN"
  
  # Test 4: SQL injection attempt
  run_test \
    "SQL 注入防護" \
    "GET" \
    "/admin/vehicles/550e8400-e29b-41d4-a716-446655440000'; DROP TABLE vehicles; --/detail" \
    "" \
    "400" \
    "$ADMIN_TOKEN"
}

##############################################################################
# Main Test Execution
##############################################################################

main() {
  print_header "🧪 FaCai-B 車輛審核系統 - 自動化測試套件"
  
  echo "⏱️  開始時間: $(date '+%Y-%m-%d %H:%M:%S')"
  echo "🌐 測試基礎 URL: $BASE_URL"
  echo ""
  
  # Authenticate first
  authenticate_users
  
  # Run test suites
  test_authentication
  test_admin_pending_list
  test_vehicle_detail
  test_vehicle_approval
  test_vehicle_rejection
  test_image_upload
  test_proxy_creation
  test_user_vehicles
  test_edge_cases
  
  # Print summary
  print_header "📊 測試結果摘要"
  
  echo "⏱️  結束時間: $(date '+%Y-%m-%d %H:%M:%S')\n"
  
  local total_run=$((TOTAL - SKIPPED))
  
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "📈 測試統計"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "總計:   $TOTAL"
  echo "已運行: $total_run"
  echo "已跳過: $SKIPPED"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo -e "${GREEN}✅ 通過: $PASSED${NC}"
  echo -e "${RED}❌ 失敗: $FAILED${NC}"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  
  if [ $total_run -gt 0 ]; then
    local pass_rate=$((PASSED * 100 / total_run))
    echo -e "通過率: ${CYAN}${pass_rate}%${NC}"
  fi
  
  echo ""
  
  # Final verdict
  if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}╔══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║${NC} 🎉 所有測試通過！系統準備就緒！                              ${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════════════════╝${NC}"
    exit 0
  else
    echo -e "${RED}╔══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║${NC} ⚠️  發現 $FAILED 個失敗測試，請檢查上述報告！                    ${NC}"
    echo -e "${RED}╚══════════════════════════════════════════════════════════╝${NC}"
    exit 1
  fi
}

# Run main
main "$@"
