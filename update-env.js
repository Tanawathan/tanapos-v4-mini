#!/usr/bin/env node
/**
 * TanaPOS v4 AI - 環境變數更新工具
 * 用於更新 .env 檔案中的 Supabase 設定
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function updateEnvFile(updates) {
  const envPath = '.env';
  
  try {
    // 讀取現有 .env 檔案
    let envContent = '';
    try {
      envContent = readFileSync(envPath, 'utf8');
    } catch (error) {
      console.log('📝 創建新的 .env 檔案');
    }

    // 解析現有變數
    const envVars = new Map();
    const lines = envContent.split('\n');
    
    for (const line of lines) {
      if (line.trim() && !line.startsWith('#')) {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
          envVars.set(key.trim(), valueParts.join('=').trim());
        }
      }
    }

    // 更新變數
    for (const [key, value] of Object.entries(updates)) {
      envVars.set(key, value);
    }

    // 重新組織內容
    const newContent = [
      '# TanaPOS v4 AI - Supabase 設定',
      '# 更新時間: ' + new Date().toISOString(),
      '',
      '# Supabase 連接設定',
      `VITE_SUPABASE_URL=${envVars.get('VITE_SUPABASE_URL') || ''}`,
      `VITE_SUPABASE_ANON_KEY=${envVars.get('VITE_SUPABASE_ANON_KEY') || ''}`,
      `VITE_SUPABASE_SERVICE_KEY=${envVars.get('VITE_SUPABASE_SERVICE_KEY') || ''}`,
      '',
      '# 後端腳本使用',
      `SUPABASE_URL=${envVars.get('SUPABASE_URL') || envVars.get('VITE_SUPABASE_URL') || ''}`,
      `SUPABASE_ANON_KEY=${envVars.get('SUPABASE_ANON_KEY') || envVars.get('VITE_SUPABASE_ANON_KEY') || ''}`,
      `SUPABASE_SERVICE_KEY=${envVars.get('SUPABASE_SERVICE_KEY') || envVars.get('VITE_SUPABASE_SERVICE_KEY') || ''}`,
      '',
      '# 餐廳設定',
      `VITE_RESTAURANT_ID=${envVars.get('VITE_RESTAURANT_ID') || '11111111-1111-1111-1111-111111111111'}`,
      `RESTAURANT_ID=${envVars.get('RESTAURANT_ID') || envVars.get('VITE_RESTAURANT_ID') || '11111111-1111-1111-1111-111111111111'}`,
      '',
      '# 其他設定',
      ...Array.from(envVars.entries())
        .filter(([key]) => !key.startsWith('VITE_SUPABASE') && !key.startsWith('SUPABASE') && !key.includes('RESTAURANT_ID'))
        .map(([key, value]) => `${key}=${value}`),
      ''
    ].join('\n');

    // 寫入檔案
    writeFileSync(envPath, newContent);
    
    console.log('✅ .env 檔案更新成功！');
    console.log('📋 目前設定:');
    console.log(`   SUPABASE_URL: ${envVars.get('VITE_SUPABASE_URL') || '未設定'}`);
    console.log(`   ANON_KEY: ${envVars.get('VITE_SUPABASE_ANON_KEY') ? '✓ 已設定' : '❌ 未設定'}`);
    console.log(`   SERVICE_KEY: ${envVars.get('VITE_SUPABASE_SERVICE_KEY') ? '✓ 已設定' : '❌ 未設定'}`);
    console.log(`   RESTAURANT_ID: ${envVars.get('VITE_RESTAURANT_ID') || '使用預設值'}`);
    
  } catch (error) {
    console.error('❌ 更新 .env 檔案失敗:', error.message);
  }
}

// 命令列使用方式
if (process.argv.length > 2) {
  const updates = {};
  
  // 解析命令列參數
  for (let i = 2; i < process.argv.length; i += 2) {
    const key = process.argv[i]?.replace('--', '');
    const value = process.argv[i + 1];
    
    if (key && value) {
      updates[key] = value;
      
      // 同時設定前端和後端版本
      if (key.startsWith('VITE_SUPABASE_')) {
        const backendKey = key.replace('VITE_', '');
        updates[backendKey] = value;
      }
      
      if (key === 'VITE_RESTAURANT_ID') {
        updates['RESTAURANT_ID'] = value;
      }
    }
  }
  
  if (Object.keys(updates).length > 0) {
    console.log('🔧 更新環境變數...');
    updateEnvFile(updates);
  } else {
    console.log('📖 使用方式:');
    console.log('node update-env.js --VITE_SUPABASE_URL your_url --VITE_SUPABASE_ANON_KEY your_anon_key --VITE_SUPABASE_SERVICE_KEY your_service_key');
  }
} else {
  console.log('📖 TanaPOS v4 AI - 環境變數更新工具');
  console.log('');
  console.log('🔧 使用方式:');
  console.log('node update-env.js --VITE_SUPABASE_URL your_url --VITE_SUPABASE_ANON_KEY your_anon_key --VITE_SUPABASE_SERVICE_KEY your_service_key');
  console.log('');
  console.log('📋 範例:');
  console.log('node update-env.js \\');
  console.log('  --VITE_SUPABASE_URL https://xxxxx.supabase.co \\');
  console.log('  --VITE_SUPABASE_ANON_KEY eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... \\');
  console.log('  --VITE_SUPABASE_SERVICE_KEY eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');
  console.log('');
  console.log('💡 提示: Service Key 提供最高權限，請小心保管');
}

export { updateEnvFile };
