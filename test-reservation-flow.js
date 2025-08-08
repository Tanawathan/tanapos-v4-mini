// 測試預約狀態變更後的資料顯示
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://bgwbcnbmtglncknnjzla.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJnd2JjbmJtdGdsbmNrbm5qemxhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ1OTQ0ODIsImV4cCI6MjA1MDE3MDQ4Mn0.0LClHZW9bv7cZHKLBk4E3WA-hU6r4Ry1D-qKyJqVMhc'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testReservationFlow() {
  console.log('🧪 開始測試預約流程...')
  
  // 1. 檢查現有預約和桌台狀態
  console.log('\n📊 檢查當前狀態...')
  
  const { data: tables } = await supabase
    .from('tables')
    .select('*')
    .order('table_number')
  
  const { data: reservations } = await supabase
    .from('table_reservations')
    .select('*')
    .in('status', ['confirmed', 'seated'])
    .order('reservation_time')
  
  console.log('桌台狀態:')
  if (tables && tables.length > 0) {
    tables.forEach(table => {
      console.log(`- 桌台${table.table_number}: ${table.status}`)
    })
  } else {
    console.log('- 沒有找到桌台')
  }
  
  console.log('\n預約狀態:')
  if (reservations && reservations.length > 0) {
    reservations.forEach(reservation => {
      const table = tables?.find(t => t.id === reservation.table_id)
      console.log(`- ${reservation.customer_name} (桌台${table?.table_number || '未知'}): ${reservation.status}`)
    })
  } else {
    console.log('- 沒有找到預約')
  }
  
  // 2. 找一個已確認的預約進行測試
  const confirmedReservation = reservations?.find(r => r.status === 'confirmed')
  
  if (!confirmedReservation) {
    console.log('\n❌ 找不到已確認的預約進行測試')
    
    // 檢查是否有已入座的預約
    const seatedReservation = reservations?.find(r => r.status === 'seated')
    if (seatedReservation) {
      console.log('✅ 找到已入座的預約，測試查詢邏輯...')
      
      const table = tables?.find(t => t.id === seatedReservation.table_id)
      console.log(`已入座預約: ${seatedReservation.customer_name} (桌台${table?.table_number}, 狀態: ${table?.status})`)
    }
    
    return
  }
  
  console.log(`\n🎯 測試預約: ${confirmedReservation.customer_name}`)
  
  // 3. 將預約狀態改為已入座
  console.log('📍 將預約狀態改為已入座...')
  
  const { error: reservationError } = await supabase
    .from('table_reservations')
    .update({ 
      status: 'seated',
      updated_at: new Date().toISOString()
    })
    .eq('id', confirmedReservation.id)
  
  if (reservationError) {
    console.error('❌ 更新預約狀態失敗:', reservationError)
    return
  }
  
  // 4. 將桌台狀態改為佔用中
  console.log('🪑 將桌台狀態改為佔用中...')
  
  const { error: tableError } = await supabase
    .from('tables')
    .update({ 
      status: 'occupied',
      updated_at: new Date().toISOString()
    })
    .eq('id', confirmedReservation.table_id)
  
  if (tableError) {
    console.error('❌ 更新桌台狀態失敗:', tableError)
    return
  }
  
  // 5. 檢查更新後的狀態
  console.log('\n🔍 檢查更新後狀態...')
  
  const { data: updatedTables } = await supabase
    .from('tables')
    .select('*')
    .eq('id', confirmedReservation.table_id)
  
  const { data: updatedReservations } = await supabase
    .from('table_reservations')
    .select('*')
    .eq('id', confirmedReservation.id)
  
  console.log('更新後桌台狀態:', updatedTables[0].status)
  console.log('更新後預約狀態:', updatedReservations[0].status)
  
  // 6. 測試查詢邏輯 - 模擬 TableManagementPage 的查詢
  console.log('\n🔎 測試查詢邏輯...')
  
  const { data: testReservations } = await supabase
    .from('table_reservations')
    .select('*')
    .in('status', ['confirmed', 'seated'])
    .order('reservation_time')
  
  const tableReservation = testReservations.find(r => r.table_id === confirmedReservation.table_id)
  
  if (tableReservation) {
    console.log('✅ 成功找到已入座預約:', tableReservation.customer_name)
    console.log('預約狀態:', tableReservation.status)
  } else {
    console.log('❌ 找不到已入座預約')
  }
  
  console.log('\n✨ 測試完成')
}

// 執行測試
testReservationFlow().catch(console.error)
