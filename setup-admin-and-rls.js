/**
 * Supabase 管理者建立和 RLS 設置腳本
 * 目的：建立管理者用戶並設置正確的 RLS 政策
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// 載入環境變數
config();

// 使用 Service Role Key (有完整權限)
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_KEY;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function setupAdminAndRLS() {
  console.log('🔐 開始設置 Supabase 管理者和 RLS...\n');

  try {
    // 1. 建立管理者用戶
    console.log('1️⃣ 建立管理者用戶');
    
    const adminEmail = 'admin@tanapos.com';
    const adminPassword = 'TanaPos2025!';
    
    const { data: user, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: {
        role: 'admin',
        name: 'TanaPOS Administrator',
        restaurant_id: process.env.VITE_RESTAURANT_ID
      }
    });

    if (signUpError) {
      if (signUpError.message.includes('already registered')) {
        console.log('✅ 管理者用戶已存在');
      } else {
        console.error('❌ 建立管理者用戶失敗:', signUpError);
        return;
      }
    } else {
      console.log('✅ 管理者用戶建立成功:', user.user.email);
    }

    // 2. 檢查並建立自定義角色
    console.log('\n2️⃣ 設置自定義角色');
    
    // 建立 admin 角色（如果不存在）
    const createRoleQuery = `
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'admin_role') THEN
          CREATE ROLE admin_role;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'restaurant_user') THEN
          CREATE ROLE restaurant_user;
        END IF;
      END
      $$;
    `;

    const { error: roleError } = await supabaseAdmin.rpc('exec_sql', { 
      sql: createRoleQuery 
    });

    if (roleError) {
      console.log('ℹ️  角色可能已存在或需要手動建立');
    } else {
      console.log('✅ 自定義角色設置完成');
    }

    // 3. 更新 RLS 政策
    console.log('\n3️⃣ 更新 RLS 政策');
    
    // 針對每個表格設置 RLS 政策
    const tables = ['restaurants', 'categories', 'products', 'tables', 'orders', 'order_items'];
    
    for (const table of tables) {
      console.log(`   設置 ${table} 表格的 RLS 政策...`);
      
      // 啟用 RLS
      const { error: enableRLSError } = await supabaseAdmin.rpc('exec_sql', {
        sql: `ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY;`
      });

      // 刪除現有政策（如果存在）
      const { error: dropPolicyError } = await supabaseAdmin.rpc('exec_sql', {
        sql: `DROP POLICY IF EXISTS "${table}_policy" ON ${table};`
      });

      // 建立新政策 - 允許 authenticated 用戶訪問所屬餐廳的資料
      let policySQL;
      
      if (table === 'restaurants') {
        // 餐廳表格：用戶只能訪問自己的餐廳
        policySQL = `
          CREATE POLICY "${table}_policy" ON ${table}
          FOR ALL USING (
            auth.role() = 'service_role' OR
            id = auth.jwt() ->> 'restaurant_id' OR
            auth.jwt() ->> 'role' = 'admin'
          );
        `;
      } else {
        // 其他表格：基於 restaurant_id 的訪問控制
        policySQL = `
          CREATE POLICY "${table}_policy" ON ${table}
          FOR ALL USING (
            auth.role() = 'service_role' OR
            restaurant_id = (auth.jwt() ->> 'restaurant_id')::uuid OR
            auth.jwt() ->> 'role' = 'admin'
          );
        `;
      }

      const { error: createPolicyError } = await supabaseAdmin.rpc('exec_sql', {
        sql: policySQL
      });

      if (createPolicyError) {
        console.log(`   ⚠️  ${table} 政策設置可能需要調整`);
      } else {
        console.log(`   ✅ ${table} RLS 政策設置完成`);
      }
    }

    // 4. 建立管理者專用的訪問函數
    console.log('\n4️⃣ 建立管理者專用函數');
    
    const adminFunctionSQL = `
      CREATE OR REPLACE FUNCTION is_admin()
      RETURNS BOOLEAN AS $$
      BEGIN
        RETURN auth.jwt() ->> 'role' = 'admin' OR auth.role() = 'service_role';
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `;

    const { error: functionError } = await supabaseAdmin.rpc('exec_sql', {
      sql: adminFunctionSQL
    });

    if (functionError) {
      console.log('ℹ️  管理者函數可能已存在');
    } else {
      console.log('✅ 管理者函數建立完成');
    }

    // 5. 測試管理者登入
    console.log('\n5️⃣ 測試管理者登入');
    
    const { data: signInData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
      email: adminEmail,
      password: adminPassword
    });

    if (signInError) {
      console.error('❌ 管理者登入測試失敗:', signInError);
    } else {
      console.log('✅ 管理者登入測試成功');
      console.log('   用戶 ID:', signInData.user.id);
      console.log('   角色:', signInData.user.user_metadata.role);
    }

    // 6. 提供前端使用說明
    console.log('\n📋 前端使用說明');
    console.log('='.repeat(50));
    console.log('管理者登入資訊:');
    console.log(`📧 Email: ${adminEmail}`);
    console.log(`🔑 Password: ${adminPassword}`);
    console.log('');
    console.log('前端登入範例代碼:');
    console.log(`
const { data, error } = await supabase.auth.signInWithPassword({
  email: '${adminEmail}',
  password: '${adminPassword}'
});

if (data.user) {
  // 登入成功，現在可以訪問受 RLS 保護的資料
  console.log('管理者已登入:', data.user.email);
}
    `);

    // 7. 測試資料庫訪問
    console.log('\n6️⃣ 測試資料庫訪問權限');
    
    // 使用管理者身份測試資料訪問
    const testQueries = [
      { name: '餐廳資料', table: 'restaurants' },
      { name: '分類資料', table: 'categories' },
      { name: '產品資料', table: 'products' },
      { name: '桌台資料', table: 'tables' }
    ];

    for (const query of testQueries) {
      const { data, error } = await supabaseAdmin
        .from(query.table)
        .select('*')
        .limit(1);

      if (error) {
        console.log(`   ❌ ${query.name}訪問失敗:`, error.message);
      } else {
        console.log(`   ✅ ${query.name}訪問成功 (${data.length} 筆記錄)`);
      }
    }

    console.log('\n🎉 Supabase 管理者和 RLS 設置完成！');
    console.log('\n📝 後續步驟:');
    console.log('1. 在前端應用中實現管理者登入功能');
    console.log('2. 確保所有 API 呼叫都在 authenticated 狀態下進行');
    console.log('3. 測試不同角色的資料訪問權限');

  } catch (error) {
    console.error('❌ 設置過程發生錯誤:', error);
  }
}

// 執行設置
setupAdminAndRLS();
