#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

// Supabase 設定
const supabaseUrl = 'https://arksfwmcmwnyxvlcpskm.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFya3Nmd21jbXdueXh2bGNwc2ttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzMzM3MTAsImV4cCI6MjA2OTkwOTcxMH0.7ifP1Un1mZvtazPjeLAQEPnpO_G75VmxrI3NdkaaYCU'

const supabase = createClient(supabaseUrl, supabaseKey)

console.log('🚀 開始執行預約系統資料庫擴展...\n')

async function executeReservationDatabaseExtension() {
  try {
    console.log('📖 讀取 SQL 文件...')
    const sqlContent = fs.readFileSync('./reservation-database-extension.sql', 'utf-8')
    
    console.log('📝 SQL 內容預覽:')
    console.log(sqlContent.substring(0, 300) + '...\n')
    
    // 分割 SQL 語句 (以分號分隔)
    const sqlStatements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
    
    console.log(`📊 找到 ${sqlStatements.length} 個 SQL 語句\n`)
    
    // 逐一執行每個 SQL 語句
    for (let i = 0; i < sqlStatements.length; i++) {
      const statement = sqlStatements[i]
      
      // 跳過註釋行
      if (statement.startsWith('--') || statement.trim().length === 0) {
        continue
      }
      
      console.log(`執行第 ${i + 1} 個語句:`)
      console.log(`${statement.substring(0, 100)}...`)
      
      try {
        const { data, error } = await supabase.rpc('exec_sql', { 
          sql_query: statement 
        })
        
        if (error) {
          // 如果 exec_sql 不存在，嘗試使用其他方法
          console.log(`⚠️  exec_sql 函數不可用，嘗試其他方法...`)
          
          // 對於 ALTER TABLE 語句，我們需要使用管理員權限
          console.log(`❌ 需要管理員權限執行: ${statement.substring(0, 50)}...`)
          console.log(`請在 Supabase Dashboard 的 SQL Editor 中執行此語句`)
        } else {
          console.log(`✅ 執行成功`)
          if (data) {
            console.log(`   結果: ${JSON.stringify(data).substring(0, 100)}...`)
          }
        }
      } catch (err) {
        console.log(`❌ 執行失敗: ${err.message}`)
      }
      
      console.log('')
    }
    
    console.log('🎯 === 執行摘要 ===')
    console.log('大部分資料庫結構更新需要管理員權限')
    console.log('請在 Supabase Dashboard → SQL Editor 中執行 reservation-database-extension.sql')
    
    // 測試現有結構
    console.log('\n🔍 測試現有預約表結構...')
    const { data: testData, error: testError } = await supabase
      .from('table_reservations')
      .select('*')
      .limit(1)
    
    if (!testError) {
      console.log('✅ 預約表可正常訪問')
      if (testData && testData.length > 0) {
        console.log('欄位:', Object.keys(testData[0]))
      }
    } else {
      console.log('❌ 預約表訪問失敗:', testError.message)
    }
    
  } catch (error) {
    console.log('❌ 整體執行失敗:', error.message)
  }
}

executeReservationDatabaseExtension()
