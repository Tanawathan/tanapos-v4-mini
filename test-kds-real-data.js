// KDS 真實數據測試腳本
import { KDSService } from './src/lib/kds-service.js';

async function testKDSRealData() {
  console.log('🧪 KDS 真實數據測試開始...\n');
  
  try {
    const restaurantId = 'f6d8c3e4-8b7a-4e9d-9f1c-2a5b3c4d5e6f';
    
    console.log('🔍 測試 1: 獲取活躍訂單');
    const orders = await KDSService.fetchActiveOrders(restaurantId);
    
    console.log(`✅ 成功獲取 ${orders.length} 筆訂單`);
    
    if (orders.length > 0) {
      const firstOrder = orders[0];
      console.log('\n📋 第一筆訂單範例:');
      console.log('- 訂單 ID:', firstOrder.id);
      console.log('- 訂單號碼:', firstOrder.order_number);
      console.log('- 狀態:', firstOrder.status);
      console.log('- 桌號:', firstOrder.table_number);
      console.log('- 總金額:', firstOrder.total_amount);
      console.log('- 項目數量:', firstOrder.totalItems);
      console.log('- 完成項目:', firstOrder.completedItems);
      console.log('- 緊急程度:', firstOrder.urgencyLevel);
      
      if (firstOrder.menuItems && firstOrder.menuItems.length > 0) {
        console.log('\n🍽️ 餐點項目:');
        firstOrder.menuItems.forEach((item, index) => {
          console.log(`  ${index + 1}. ${item.product_name} (${item.status}) - 數量: ${item.quantity}`);
        });
      }
    }
    
    console.log('\n📊 統計資訊:');
    const stats = {
      pending: orders.filter(o => o.status === 'pending' || o.status === 'confirmed').length,
      preparing: orders.filter(o => o.status === 'preparing').length,
      ready: orders.filter(o => o.status === 'ready').length,
      completed: orders.filter(o => o.status === 'completed').length
    };
    
    console.log('- 待處理:', stats.pending);
    console.log('- 準備中:', stats.preparing);
    console.log('- 已完成:', stats.ready);
    console.log('- 已出餐:', stats.completed);
    
    console.log('\n✅ KDS 真實數據測試完成！');
    
  } catch (error) {
    console.error('❌ KDS 測試失敗:', error.message);
    console.error('詳細錯誤:', error);
  }
}

// 執行測試
testKDSRealData();
