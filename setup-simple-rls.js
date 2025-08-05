import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

async function setupRLS() {
  console.log('🔧 開始設置 RLS 政策...')

  // 基本的 RLS 政策設定
  const policies = [
    // 餐廳表
    `
    ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "restaurants_policy" ON restaurants;
    CREATE POLICY "restaurants_policy" ON restaurants FOR ALL 
    USING (auth.uid() IS NOT NULL);
    `,
    
    // 分類表
    `
    ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "categories_policy" ON categories;
    CREATE POLICY "categories_policy" ON categories FOR ALL 
    USING (auth.uid() IS NOT NULL);
    `,
    
    // 產品表
    `
    ALTER TABLE products ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "products_policy" ON products;
    CREATE POLICY "products_policy" ON products FOR ALL 
    USING (auth.uid() IS NOT NULL);
    `,
    
    // 桌台表
    `
    ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "tables_policy" ON tables;
    CREATE POLICY "tables_policy" ON tables FOR ALL 
    USING (auth.uid() IS NOT NULL);
    `,
    
    // 訂單表
    `
    ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "orders_policy" ON orders;
    CREATE POLICY "orders_policy" ON orders FOR ALL 
    USING (auth.uid() IS NOT NULL);
    `,
    
    // 訂單項目表
    `
    ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "order_items_policy" ON order_items;
    CREATE POLICY "order_items_policy" ON order_items FOR ALL 
    USING (auth.uid() IS NOT NULL);
    `
  ]

  for (let i = 0; i < policies.length; i++) {
    try {
      console.log(`⚙️  執行政策 ${i + 1}/${policies.length}...`)
      const { error } = await supabase.rpc('sql', { query: policies[i] })
      if (error) {
        console.error(`❌ 政策 ${i + 1} 執行失敗:`, error)
      } else {
        console.log(`✅ 政策 ${i + 1} 執行成功`)
      }
    } catch (err) {
      console.error(`❌ 政策 ${i + 1} 錯誤:`, err.message)
    }
    
    // 短暫延遲以避免過載
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  console.log('🎉 RLS 政策設置完成!')
}

setupRLS()
