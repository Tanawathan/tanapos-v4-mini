import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://peubpisofenlyquqnpan.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBldWJwaXNvZmVubHlxdXFucGFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4NTgwODgsImV4cCI6MjA2OTQzNDA4OH0.6IzK9jjs-Ld_mFBRQqNk594ayXapjGxwAmhQpoY26cY'
);

async function checkSpecificOrder() {
  console.log('🔍 檢查訂單 #ORD-1754124290876');
  console.log('=' .repeat(50));
  
  // 先檢查訂單是否存在
  const { data: order, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (*)
    `)
    .eq('order_number', 'ORD-1754124290876')
    .single();
  
  if (error) {
    console.log('❌ 查詢錯誤:', error.message);
    
    // 查看最近的訂單
    console.log('\n📋 最近的訂單:');
    const { data: recentOrders } = await supabase
      .from('orders')
      .select('order_number, table_number, total_amount, created_at, status')
      .order('created_at', { ascending: false })
      .limit(10);
    
    recentOrders?.forEach(o => {
      const date = new Date(o.created_at).toLocaleString('zh-TW');
      console.log(`- ${o.order_number} (桌${o.table_number}) NT$ ${o.total_amount} [${o.status}] ${date}`);
    });
    
    return;
  }
  
  if (!order) {
    console.log('❌ 找不到訂單 ORD-1754124290876');
    return;
  }
  
  console.log('✅ 找到訂單資料:');
  console.log(`📋 訂單編號: ${order.order_number}`);
  console.log(`🪑 桌號: ${order.table_number}`);
  console.log(`💰 總金額: NT$ ${order.total_amount}`);
  console.log(`📊 狀態: ${order.status}`);
  console.log(`👤 客戶: ${order.customer_name || 'N/A'}`);
  console.log(`📅 建立時間: ${new Date(order.created_at).toLocaleString('zh-TW')}`);
  
  console.log('\n🍽️ 訂單項目:');
  if (order.order_items && order.order_items.length > 0) {
    order.order_items.forEach((item, index) => {
      const isMealSet = item.product_name.includes('套餐');
      const icon = isMealSet ? '🍽️' : '🍴';
      const badge = isMealSet ? '[套餐]' : '[一般]';
      
      console.log(`${index + 1}. ${icon} ${item.product_name} ${badge}`);
      console.log(`   數量: ${item.quantity}`);
      console.log(`   單價: NT$ ${item.unit_price}`);
      console.log(`   總價: NT$ ${item.total_price}`);
      console.log(`   狀態: ${item.status}`);
      
      if (item.special_instructions) {
        console.log(`   備註: ${item.special_instructions}`);
      }
      
      if (item.product_id) {
        console.log(`   產品ID: ${item.product_id}`);
      }
      
      // 檢查是否有異常的資料格式
      console.log(`   原始資料欄位:`, Object.keys(item));
      
      console.log('');
    });
  } else {
    console.log('❌ 沒有訂單項目');
  }
  
  // 檢查產品表中對應的套餐資料
  console.log('\n🔍 檢查相關產品資料:');
  for (const item of order.order_items) {
    if (item.product_id) {
      const { data: product } = await supabase
        .from('products')
        .select('*')
        .eq('id', item.product_id)
        .single();
      
      if (product) {
        console.log(`\n📦 產品: ${product.name}`);
        console.log(`   描述: ${product.description || 'N/A'}`);
        console.log(`   價格: NT$ ${product.price}`);
        console.log(`   類別ID: ${product.category_id || 'N/A'}`);
        console.log(`   是否可用: ${product.is_available}`);
        console.log(`   是否啟用: ${product.is_active}`);
      }
    }
  }
}

checkSpecificOrder().then(() => {
  console.log('\n✅ 檢查完成');
  process.exit(0);
}).catch(console.error);
