import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://peubpisofenlyquqnpan.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBldWJwaXNvZmVubHlxdXFucGFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4NTgwODgsImV4cCI6MjA2OTQzNDA4OH0.6IzK9jjs-Ld_mFBRQqNk594ayXapjGxwAmhQpoY26cY'
);

async function checkMealSets() {
  console.log('🍽️ 檢查套餐資料');
  
  // 檢查產品表
  const { data: products } = await supabase.from('products').select('*').limit(1);
  if (products && products[0]) {
    console.log('Products 欄位:', Object.keys(products[0]));
  }
  
  // 尋找套餐產品
  const { data: mealSets } = await supabase
    .from('products')
    .select('*')
    .ilike('name', '%套餐%')
    .limit(5);
  
  console.log('\n套餐產品數量:', mealSets?.length || 0);
  if (mealSets) {
    mealSets.forEach(p => {
      console.log(`- ${p.name} (ID: ${p.id})`);
    });
  }
  
  // 檢查套餐訂單項目
  const { data: orderItems } = await supabase
    .from('order_items')
    .select('*')
    .ilike('product_name', '%套餐%')
    .limit(5);
  
  console.log('\n套餐訂單項目數量:', orderItems?.length || 0);
  if (orderItems) {
    orderItems.forEach(item => {
      console.log(`- ${item.product_name} x${item.quantity} = NT$ ${item.total_price}`);
      console.log(`  Product ID: ${item.product_id}`);
    });
  }
  
  // 檢查是否有產品關聯問題
  if (orderItems && orderItems.length > 0) {
    for (const item of orderItems) {
      if (item.product_id) {
        const { data: product } = await supabase
          .from('products')
          .select('*')
          .eq('id', item.product_id)
          .single();
        
        if (product) {
          console.log(`\n產品關聯檢查 - ${item.product_name}:`);
          console.log(`  產品表名稱: ${product.name}`);
          console.log(`  產品類別: ${product.category || 'N/A'}`);
          console.log(`  是否為套餐: ${product.name?.includes('套餐') ? '是' : '否'}`);
        }
      }
    }
  }
}

checkMealSets().then(() => {
  console.log('\n✅ 檢查完成');
  process.exit(0);
}).catch(console.error);
