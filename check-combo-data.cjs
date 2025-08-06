const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://dmjgskyowetdxxzqcfrd.supabase.co', 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtamdza3lvd2V0ZHh4enFjZnJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE4NjEzNzAsImV4cCI6MjA0NzQzNzM3MH0.7S50eN0-JQtfpZUPO3lzMnlLYcZdGrqQXWNPfqG5JWs'
);

async function checkComboData() {
  console.log('📋 檢查套餐資料...');
  
  try {
    const { data, error } = await supabase
      .from('combo_products')
      .select('*')
      .limit(10);
      
    if (error) {
      console.error('❌ 查詢錯誤:', error);
      return;
    }
    
    console.log(`✅ 找到套餐數量: ${data.length}`);
    
    if (data.length > 0) {
      console.log('📋 套餐範例:');
      data.forEach((combo, index) => {
        console.log(`${index + 1}. ${combo.name} - NT$${combo.price} (${combo.combo_type})`);
      });
    } else {
      console.log('⚠️  資料庫中沒有套餐資料');
    }
    
  } catch (error) {
    console.error('❌ 執行錯誤:', error);
  }
}

checkComboData().then(() => {
  console.log('檢查完成');
  process.exit(0);
});
