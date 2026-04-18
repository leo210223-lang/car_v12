#!/usr/bin/env node

/**
 * Admin 帳號升級腳本
 * 用途：快速將現有 Supabase 帳號升級為 Admin
 * 
 * 使用方法：
 * node backend/scripts/promote-to-admin.js your-email@example.com
 * node backend/scripts/promote-to-admin.js --diagnose        (診斷模式)
 * node backend/scripts/promote-to-admin.js --verify           (驗證模式)
 * 
 * 或使用交互模式：
 * node backend/scripts/promote-to-admin.js
 */

import { createClient } from '@supabase/supabase-js';
import readline from 'readline';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// 獲取當前檔案的目錄
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 載入環境變數（先嘗試 .env.local，再嘗試 .env）
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ 錯誤：未設定 SUPABASE_URL 或 SUPABASE_SERVICE_ROLE_KEY');
  console.error('\n📍 檢查項目：');
  console.error('   1. 確保在 backend/ 目錄中運行此腳本');
  console.error('   2. 檢查 backend/.env.local 或 backend/.env 是否包含以下變數：');
  console.error('      - SUPABASE_URL=https://xxx.supabase.co');
  console.error('      - SUPABASE_SERVICE_ROLE_KEY=xxx');
  console.error('\n💡 獲取這些值：');
  console.error('   1. 進入 https://app.supabase.com');
  console.error('   2. 選擇你的項目');
  console.error('   3. Settings > API');
  console.error('   4. 複製 Project URL 和 service_role secret');
  process.exit(1);
}

// 初始化 Supabase Admin Client
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// 建立 readline 介面
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

/**
 * 診斷環境和連接
 */
async function diagnose() {
  console.log('\n🔍 開始診斷環境...\n');

  // 1. 檢查環境變數
  console.log('1️⃣ 環境變數檢查：');
  console.log(`   SUPABASE_URL: ${SUPABASE_URL ? '✅ 已設定' : '❌ 未設定'}`);
  console.log(`   SUPABASE_SERVICE_ROLE_KEY: ${SUPABASE_SERVICE_ROLE_KEY ? '✅ 已設定' : '❌ 未設定'}`);

  // 2. 檢查 .env 文件
  console.log('\n2️⃣ .env 檔案檢查：');
  const envLocalPath = path.join(__dirname, '..', '.env.local');
  const envPath = path.join(__dirname, '..', '.env');
  console.log(`   .env.local 存在: ${fs.existsSync(envLocalPath) ? '✅' : '❌'}`);
  console.log(`   .env 存在: ${fs.existsSync(envPath) ? '✅' : '❌'}`);

  // 3. 嘗試連接 Supabase
  console.log('\n3️⃣ Supabase 連接檢查：');
  try {
    const { data: users, error } = await supabaseAdmin.auth.admin.listUsers();
    if (error) {
      console.log(`   ❌ 連接失敗: ${error.message}`);
    } else {
      const usersList = Array.isArray(users) ? users : (users?.users || []);
      console.log(`   ✅ 連接成功`);
      console.log(`   📊 當前帳號數: ${usersList.length}`);
      console.log('\n   帳號列表：');
      usersList.forEach((u) => {
        const role = u.user_metadata?.role || u.app_metadata?.role || 'user';
        console.log(`      - ${u.email.padEnd(30)} [${role}]`);
      });
    }
  } catch (error) {
    console.log(`   ❌ 連接失敗: ${error.message}`);
  }

  console.log('\n✅ 診斷完成\n');
}

async function promoteToAdmin(email) {
  try {
    console.log(`\n🔍 正在搜尋帳號: ${email}`);

    // 取得用戶列表
    const { data: users, error: fetchError } = await supabaseAdmin.auth.admin.listUsers();

    if (fetchError) {
      throw new Error(`無法取得用戶列表: ${fetchError.message}`);
    }

    // users 可能是直接的數組或有 users 屬性
    const usersList = Array.isArray(users) ? users : (users?.users || []);

    const user = usersList.find((u) => u.email === email);

    if (!user) {
      console.error(`❌ 找不到帳號: ${email}`);
      console.log('\n📋 現有帳號列表：');
      usersList.forEach((u) => {
        console.log(`   - ${u.email}`);
      });
      process.exit(1);
    }

    console.log(`✅ 找到帳號：${user.email} (ID: ${user.id})`);

    // 更新用戶 metadata
    console.log(`🔄 正在更新 metadata...`);
    const { data: updatedData, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...(user.user_metadata || {}),
        role: 'admin',
      },
    });

    if (updateError) {
      throw new Error(`無法更新帳號: ${updateError.message}`);
    }

    console.log('✅ 已發送升級命令！');
    console.log(`   更新回應: ${JSON.stringify(updatedData?.user_metadata || updatedData)}\n`);

    // 驗證 - 重新取得用戶資訊以確認更新
    console.log(`🔍 正在驗證更新...`);
    const { data: verifyUser, error: verifyError } = await supabaseAdmin.auth.admin.getUserById(user.id);
    
    if (verifyError) {
      console.warn(`⚠️ 驗證失敗: ${verifyError.message}`);
    } else {
      // verifyUser 可能有不同的結構
      const userData = verifyUser?.user || verifyUser;
      console.log('📝 更新後的帳號資訊：');
      console.log(`   Email: ${userData?.email || verifyUser?.email || user.email}`);
      console.log(`   User Metadata: ${JSON.stringify(userData?.user_metadata || verifyUser?.user_metadata || {})}`);
      console.log(`   Role (metadata): ${userData?.user_metadata?.role || verifyUser?.user_metadata?.role || 'user'}`);
    }
    
    console.log('\n✨ 升級程序完成！');
    console.log('📌 提示：');
    console.log('   1. 使用者需要重新登入以獲得新的 JWT token');
    console.log('   2. 若 Role 仍顯示 user，請重新整理頁面後再檢查\n');
  } catch (error) {
    console.error('❌ 錯誤：', error.message);
    process.exit(1);
  }
}

async function main() {
  let email = process.argv[2];

  // 檢查命令行參數
  if (email === '--diagnose') {
    await diagnose();
    rl.close();
    return;
  }

  if (email === '--verify') {
    console.log('\n✅ 環境變數已成功加載');
    console.log(`   SUPABASE_URL: ${SUPABASE_URL.substring(0, 40)}...`);
    console.log(`   SUPABASE_SERVICE_ROLE_KEY: ${SUPABASE_SERVICE_ROLE_KEY.substring(0, 40)}...`);
    rl.close();
    return;
  }

  if (email === '--help') {
    console.log(`
🔐 Admin 帳號升級工具 - 幫助

使用方法：
  node scripts/promote-to-admin.js [email|command]

命令：
  --diagnose    診斷環境和 Supabase 連接
  --verify      驗證環境變數是否正確加載
  --help        顯示此幫助信息

示例：
  node scripts/promote-to-admin.js your-email@example.com
  node scripts/promote-to-admin.js                        (交互模式)
  node scripts/promote-to-admin.js --diagnose            (診斷)
  node scripts/promote-to-admin.js --verify              (驗證)
    `);
    rl.close();
    return;
  }

  if (!email) {
    console.log('\n🔐 Admin 帳號升級工具\n');
    email = await question('請輸入要升級的帳號 Email: ');
  }

  if (!email || !email.includes('@')) {
    console.error('❌ 請輸入有效的 Email 地址');
    process.exit(1);
  }

  await promoteToAdmin(email);
  rl.close();
}

main().catch((error) => {
  console.error('❌ 未預期的錯誤：', error);
  process.exit(1);
});
