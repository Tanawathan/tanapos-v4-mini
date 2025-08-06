import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.PRIVATE_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkComboTableStructure() {
  console.log('🔍 檢查套餐資料表結構與資料...');
  
  try {
    // 檢查 combo_products 表是否存在以及其結構
    const { data: tables } = await supabase
      .rpc('get_table_info', { table_name: 'combo_products' })
      .single();
    
    console.log('📊 combo_products 表結構:', tables);
    
    // 直接查詢表是否存在
    const { data, error, count } = await supabase
      .from('combo_products')
      .select('*', { count: 'exact' })
      .limit(5);
    
    if (error) {
      console.error('❌ 查詢 combo_products 表失敗:', error.message);
      
      // 檢查是否是因為表不存在
      if (error.message.includes('relation "combo_products" does not exist')) {
        console.log('\n⚠️ combo_products 表尚未建立');
        console.log('📝 需要執行資料庫 migration 來建立套餐相關表格');
        
        // 檢查相關表格
        console.log('\n🔍 檢查其他相關表格...');
        
        const relatedTables = [
          'combo_selection_rules',
          'combo_selection_options',
          'order_combo_selections'
        ];
        
        for (const tableName of relatedTables) {
          const { error: tableError } = await supabase
            .from(tableName)
            .select('*', { count: 'exact', head: true })
            .limit(1);
          
          if (tableError) {
            console.log(`❌ ${tableName} 表不存在`);
          } else {
            console.log(`✅ ${tableName} 表存在`);
          }
        }
      }
      return;
    }
    
    console.log(`✅ combo_products 表存在，共有 ${count} 筆資料`);
    
    if (data && data.length > 0) {
      console.log('\n📋 現有套餐資料:');
      data.forEach((combo, index) => {
        console.log(`  ${index + 1}. ${combo.name} (類型: ${combo.combo_type}, 價格: $${combo.price})`);
      });
    } else {
      console.log('\n📝 套餐表已建立但尚無資料');
    }
    
  } catch (error) {
    console.error('❌ 檢查失敗:', error);
  }
}

checkComboTableStructure();
