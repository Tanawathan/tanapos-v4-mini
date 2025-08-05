// 創建前端診斷腳本
export async function runFrontendDiagnosis() {
  console.log('🔍 前端 Supabase 連接診斷')
  console.log('=' .repeat(50))
  
  // 檢查環境變數
  console.log('📋 環境變數檢查:')
  console.log('- VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL ? '✅' : '❌')
  console.log('- VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅' : '❌')
  console.log('- URL:', import.meta.env.VITE_SUPABASE_URL)
  console.log('- Key 前30字:', import.meta.env.VITE_SUPABASE_ANON_KEY?.substring(0, 30))
  
  // 動態導入 supabase 客戶端
  try {
    const { supabase } = await import('../lib/supabase.js')
    
    console.log('\n🧪 測試 Supabase 連接:')
    
    // 測試基本查詢
    const { data: restaurants, error: restaurantError } = await supabase
      .from('restaurants')
      .select('id, name, is_active')
      .limit(1)
    
    if (restaurantError) {
      console.log('❌ 餐廳查詢錯誤:', restaurantError.message)
    } else {
      console.log('✅ 餐廳查詢成功:', restaurants?.length, '筆')
    }
    
    // 測試認證狀態
    const { data: authData, error: authError } = await supabase.auth.getSession()
    console.log('🔐 認證狀態:', authError ? '❌ ' + authError.message : '✅ OK')
    console.log('🔐 用戶狀態:', authData.session ? '已登入' : '未登入')
    
    if (authData.session) {
      console.log('👤 用戶:', authData.session.user.email)
    }
    
  } catch (e) {
    console.error('💥 診斷過程發生錯誤:', (e as Error).message)
  }
  
  console.log('\n' + '=' .repeat(50))
}

// 擴展 Window 介面
declare global {
  interface Window {
    runFrontendDiagnosis: typeof runFrontendDiagnosis
  }
}

// 如果在瀏覽器環境中，直接執行
if (typeof window !== 'undefined') {
  window.runFrontendDiagnosis = runFrontendDiagnosis
  console.log('🎯 前端診斷功能已註冊，請在控制台執行: runFrontendDiagnosis()')
}
