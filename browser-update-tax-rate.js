// 在瀏覽器控制台中執行這段代碼來更新稅率
// 打開 http://localhost:5183，按 F12 打開開發者工具，在 Console 標籤中貼上並執行

(async function updateTaxRate() {
  console.log('🔧 更新餐廳稅率為 0% (無稅金)...')
  
  // 使用前端已初始化的 supabase 客戶端
  const { data, error } = await window.supabase
    .from('restaurants')
    .update({ tax_rate: 0 })
    .select()

  if (error) {
    console.error('❌ 更新稅率失敗:', error)
    return
  }

  console.log('✅ 稅率更新成功!')
  console.log('📊 更新的餐廳:')
  data.forEach(restaurant => {
    console.log(`   - ${restaurant.name}: 稅率 ${restaurant.tax_rate * 100}%`)
  })
  
  // 重新載入頁面以反映更改
  location.reload()
})()
