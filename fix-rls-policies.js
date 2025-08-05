/**
 * 修正 RLS 政策設置腳本
 * 目的：正確設置 RLS 政策，確保只有認證用戶可以訪問資料
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_KEY;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function fixRLSPolicies() {
  console.log('🔧 修正 RLS 政策設置...\n');

  try {
    const tables = ['restaurants', 'categories', 'products', 'tables', 'orders', 'order_items'];
    
    for (const table of tables) {
      console.log(`🔧 修正 ${table} 表格的 RLS 政策...`);
      
      // 1. 啟用 RLS
      await supabaseAdmin.rpc('exec_sql', {
        sql: `ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY;`
      });
      
      // 2. 刪除所有現有政策
      await supabaseAdmin.rpc('exec_sql', {
        sql: `DROP POLICY IF EXISTS "${table}_policy" ON ${table};`
      });
      
      await supabaseAdmin.rpc('exec_sql', {
        sql: `DROP POLICY IF EXISTS "${table}_select_policy" ON ${table};`
      });
      
      await supabaseAdmin.rpc('exec_sql', {
        sql: `DROP POLICY IF EXISTS "${table}_insert_policy" ON ${table};`
      });
      
      await supabaseAdmin.rpc('exec_sql', {
        sql: `DROP POLICY IF EXISTS "${table}_update_policy" ON ${table};`
      });
      
      await supabaseAdmin.rpc('exec_sql', {
        sql: `DROP POLICY IF EXISTS "${table}_delete_policy" ON ${table};`
      });

      // 3. 建立新的嚴格政策
      let selectPolicy, insertPolicy, updatePolicy, deletePolicy;
      
      if (table === 'restaurants') {
        // 餐廳表格政策
        selectPolicy = `
          CREATE POLICY "${table}_select_policy" ON ${table}
          FOR SELECT USING (
            auth.role() = 'service_role' OR 
            (auth.uid() IS NOT NULL AND (
              id::text = auth.jwt() ->> 'restaurant_id' OR
              auth.jwt() ->> 'role' = 'admin'
            ))
          );
        `;
        
        insertPolicy = `
          CREATE POLICY "${table}_insert_policy" ON ${table}
          FOR INSERT WITH CHECK (
            auth.role() = 'service_role' OR 
            (auth.uid() IS NOT NULL AND auth.jwt() ->> 'role' = 'admin')
          );
        `;
        
        updatePolicy = `
          CREATE POLICY "${table}_update_policy" ON ${table}
          FOR UPDATE USING (
            auth.role() = 'service_role' OR 
            (auth.uid() IS NOT NULL AND (
              id::text = auth.jwt() ->> 'restaurant_id' OR
              auth.jwt() ->> 'role' = 'admin'
            ))
          );
        `;
        
        deletePolicy = `
          CREATE POLICY "${table}_delete_policy" ON ${table}
          FOR DELETE USING (
            auth.role() = 'service_role' OR 
            (auth.uid() IS NOT NULL AND auth.jwt() ->> 'role' = 'admin')
          );
        `;
      } else {
        // 其他表格政策（基於 restaurant_id）
        selectPolicy = `
          CREATE POLICY "${table}_select_policy" ON ${table}
          FOR SELECT USING (
            auth.role() = 'service_role' OR 
            (auth.uid() IS NOT NULL AND (
              restaurant_id::text = auth.jwt() ->> 'restaurant_id' OR
              auth.jwt() ->> 'role' = 'admin'
            ))
          );
        `;
        
        insertPolicy = `
          CREATE POLICY "${table}_insert_policy" ON ${table}
          FOR INSERT WITH CHECK (
            auth.role() = 'service_role' OR 
            (auth.uid() IS NOT NULL AND (
              restaurant_id::text = auth.jwt() ->> 'restaurant_id' OR
              auth.jwt() ->> 'role' = 'admin'
            ))
          );
        `;
        
        updatePolicy = `
          CREATE POLICY "${table}_update_policy" ON ${table}
          FOR UPDATE USING (
            auth.role() = 'service_role' OR 
            (auth.uid() IS NOT NULL AND (
              restaurant_id::text = auth.jwt() ->> 'restaurant_id' OR
              auth.jwt() ->> 'role' = 'admin'
            ))
          );
        `;
        
        deletePolicy = `
          CREATE POLICY "${table}_delete_policy" ON ${table}
          FOR DELETE USING (
            auth.role() = 'service_role' OR 
            (auth.uid() IS NOT NULL AND (
              restaurant_id::text = auth.jwt() ->> 'restaurant_id' OR
              auth.jwt() ->> 'role' = 'admin'
            ))
          );
        `;
      }

      // 4. 執行政策建立
      const policies = [
        { name: 'SELECT', sql: selectPolicy },
        { name: 'INSERT', sql: insertPolicy },
        { name: 'UPDATE', sql: updatePolicy },
        { name: 'DELETE', sql: deletePolicy }
      ];

      for (const policy of policies) {
        const { error } = await supabaseAdmin.rpc('exec_sql', {
          sql: policy.sql
        });

        if (error) {
          console.log(`   ⚠️  ${table} ${policy.name} 政策建立失敗:`, error.message);
        } else {
          console.log(`   ✅ ${table} ${policy.name} 政策建立成功`);
        }
      }
    }

    console.log('\n🎉 RLS 政策修正完成！');
    console.log('\n📋 政策特點:');
    console.log('   🔒 未認證用戶完全無法訪問');
    console.log('   ✅ 已認證用戶只能訪問所屬餐廳資料');
    console.log('   👑 管理者擁有跨餐廳訪問權限');
    console.log('   🛡️  Service Role 擁有完整權限');

  } catch (error) {
    console.error('❌ 修正過程發生錯誤:', error);
  }
}

// 執行修正
fixRLSPolicies();
