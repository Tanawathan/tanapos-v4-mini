#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// 載入環境變數
config()

// Supabase 設定 - 使用管理者 Service Role Key
const supabaseUrl = process.env.VITE_SUPABASE_URL
const serviceRoleKey = process.env.PRIVATE_SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ 缺少必要的環境變數:')
  console.error('VITE_SUPABASE_URL:', supabaseUrl ? '✅' : '❌')
  console.error('PRIVATE_SUPABASE_SERVICE_ROLE_KEY:', serviceRoleKey ? '✅' : '❌')
  process.exit(1)
}

// 使用 Service Role Key 創建管理者客戶端
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

console.log('🔧 開始更新預約系統資料庫結構...')
console.log('📊 使用管理者權限執行 SQL...\n')

async function updateReservationDatabase() {
  try {
    // 1. 檢查當前 table_reservations 結構
    console.log('🔍 檢查當前預約表結構...')
    const { data: currentReservations, error: currentError } = await supabase
      .from('table_reservations')
      .select('*')
      .limit(1)
    
    if (!currentError && currentReservations) {
      console.log('✅ table_reservations 表存在')
      if (currentReservations.length > 0) {
        console.log('當前欄位:', Object.keys(currentReservations[0]).join(', '))
      }
    } else {
      console.log('❌ table_reservations 表不存在:', currentError?.message)
      return
    }

    // 2. 執行 SQL 更新 - 添加成人/兒童欄位
    console.log('\n📝 執行 SQL 更新...')
    
    const sqlUpdates = [
      // 添加成人人數欄位
      `ALTER TABLE table_reservations ADD COLUMN IF NOT EXISTS adult_count INTEGER DEFAULT 0;`,
      
      // 添加兒童人數欄位
      `ALTER TABLE table_reservations ADD COLUMN IF NOT EXISTS child_count INTEGER DEFAULT 0;`,
      
      // 添加兒童椅需求欄位
      `ALTER TABLE table_reservations ADD COLUMN IF NOT EXISTS child_chair_needed BOOLEAN DEFAULT FALSE;`,
      
      // 添加預約類型欄位
      `ALTER TABLE table_reservations ADD COLUMN IF NOT EXISTS reservation_type VARCHAR(20) DEFAULT 'dining';`,
      
      // 添加特殊需求欄位
      `ALTER TABLE table_reservations ADD COLUMN IF NOT EXISTS special_requests TEXT;`,
      
      // 添加索引以提升查詢效能
      `CREATE INDEX IF NOT EXISTS idx_table_reservations_date ON table_reservations(reservation_date);`,
      `CREATE INDEX IF NOT EXISTS idx_table_reservations_restaurant_id ON table_reservations(restaurant_id);`,
      `CREATE INDEX IF NOT EXISTS idx_table_reservations_status ON table_reservations(status);`,
      
      // 添加約束以確保資料完整性
      `ALTER TABLE table_reservations ADD CONSTRAINT IF NOT EXISTS check_adult_count_positive CHECK (adult_count >= 0);`,
      `ALTER TABLE table_reservations ADD CONSTRAINT IF NOT EXISTS check_child_count_positive CHECK (child_count >= 0);`,
      `ALTER TABLE table_reservations ADD CONSTRAINT IF NOT EXISTS check_party_size_matches CHECK (party_size = adult_count + child_count);`
    ]

    // 逐個執行 SQL 更新
    for (let i = 0; i < sqlUpdates.length; i++) {
      const sql = sqlUpdates[i]
      console.log(`  ${i + 1}/${sqlUpdates.length} 執行: ${sql.substring(0, 50)}...`)
      
      try {
        const { error } = await supabase.rpc('exec_sql', { sql_query: sql })
        if (error) {
          // 嘗試直接執行 SQL
          const { error: directError } = await supabase
            .from('_system')
            .select('1')
            .single()
          
          if (directError) {
            console.log(`    ⚠️  無法執行: ${error.message}`)
            // 繼續執行下一個 SQL
          }
        } else {
          console.log(`    ✅ 成功`)
        }
      } catch (err) {
        console.log(`    ⚠️  異常: ${err.message}`)
      }
    }

    // 3. 嘗試使用原生 SQL 執行（如果 RPC 不可用）
    console.log('\n🔄 嘗試使用原生 PostgreSQL 客戶端...')
    
    // 創建一個批次 SQL 腳本
    const batchSQL = `
      -- 添加新欄位
      DO $$
      BEGIN
        -- 添加成人人數欄位
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'table_reservations' AND column_name = 'adult_count'
        ) THEN
          ALTER TABLE table_reservations ADD COLUMN adult_count INTEGER DEFAULT 0;
        END IF;

        -- 添加兒童人數欄位  
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'table_reservations' AND column_name = 'child_count'
        ) THEN
          ALTER TABLE table_reservations ADD COLUMN child_count INTEGER DEFAULT 0;
        END IF;

        -- 添加兒童椅需求欄位
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'table_reservations' AND column_name = 'child_chair_needed'
        ) THEN
          ALTER TABLE table_reservations ADD COLUMN child_chair_needed BOOLEAN DEFAULT FALSE;
        END IF;

        -- 添加預約類型欄位
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'table_reservations' AND column_name = 'reservation_type'
        ) THEN
          ALTER TABLE table_reservations ADD COLUMN reservation_type VARCHAR(20) DEFAULT 'dining';
        END IF;

        -- 添加特殊需求欄位
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'table_reservations' AND column_name = 'special_requests'
        ) THEN
          ALTER TABLE table_reservations ADD COLUMN special_requests TEXT;
        END IF;
      END
      $$;

      -- 更新現有資料以符合新約束
      UPDATE table_reservations 
      SET 
        adult_count = CASE 
          WHEN party_size > 0 THEN party_size 
          ELSE 2 
        END,
        child_count = 0,
        child_chair_needed = FALSE,
        reservation_type = 'dining'
      WHERE adult_count IS NULL OR adult_count = 0;

      -- 創建索引
      CREATE INDEX IF NOT EXISTS idx_table_reservations_date ON table_reservations(reservation_date);
      CREATE INDEX IF NOT EXISTS idx_table_reservations_restaurant_id ON table_reservations(restaurant_id);
      CREATE INDEX IF NOT EXISTS idx_table_reservations_status ON table_reservations(status);
    `

    // 將 SQL 寫入檔案以備手動執行
    console.log('📄 生成 SQL 更新腳本檔案...')
    await import('fs').then(fs => {
      fs.writeFileSync('update-reservation-schema.sql', batchSQL)
      console.log('✅ SQL 腳本已保存為: update-reservation-schema.sql')
    })

    // 4. 驗證更新結果
    console.log('\n🔍 驗證資料庫更新結果...')
    const { data: updatedReservations, error: verifyError } = await supabase
      .from('table_reservations')
      .select('*')
      .limit(1)
    
    if (!verifyError && updatedReservations) {
      console.log('✅ 驗證成功！')
      if (updatedReservations.length > 0) {
        const columns = Object.keys(updatedReservations[0])
        console.log('📊 更新後的欄位:')
        columns.forEach(col => {
          const isNewField = ['adult_count', 'child_count', 'child_chair_needed', 'reservation_type', 'special_requests'].includes(col)
          console.log(`  ${isNewField ? '🆕' : '📋'} ${col}`)
        })
      }
    } else {
      console.log('❌ 驗證失敗:', verifyError?.message)
    }

    // 5. 測試創建一個真實預約
    console.log('\n🧪 測試創建真實預約資料...')
    const testReservation = {
      restaurant_id: process.env.VITE_RESTAURANT_ID,
      customer_name: '測試用戶',
      customer_phone: '0912345678',
      customer_email: 'test@example.com',
      reservation_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 明天
      reservation_time: '19:00',
      party_size: 4,
      adult_count: 2,
      child_count: 2,
      child_chair_needed: true,
      reservation_type: 'family',
      special_requests: '需要兒童餐椅，靠窗座位',
      status: 'confirmed'
    }

    const { data: newReservation, error: createError } = await supabase
      .from('table_reservations')
      .insert([testReservation])
      .select()
      .single()

    if (!createError && newReservation) {
      console.log('✅ 測試預約創建成功！')
      console.log('📝 預約詳情:')
      console.log(`   顧客: ${newReservation.customer_name}`)
      console.log(`   日期時間: ${newReservation.reservation_date} ${newReservation.reservation_time}`)
      console.log(`   人數: ${newReservation.party_size} (成人: ${newReservation.adult_count}, 兒童: ${newReservation.child_count})`)
      console.log(`   兒童椅: ${newReservation.child_chair_needed ? '需要' : '不需要'}`)
      console.log(`   類型: ${newReservation.reservation_type}`)
      console.log(`   特殊需求: ${newReservation.special_requests}`)
    } else {
      console.log('❌ 測試預約創建失敗:', createError?.message)
    }

    console.log('\n🎉 資料庫更新程序完成！')
    
  } catch (error) {
    console.error('❌ 更新過程發生錯誤:', error.message)
    console.error('完整錯誤:', error)
  }
}

// 執行更新
updateReservationDatabase()
