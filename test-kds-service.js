import { KDSService } from './src/lib/kds-service.js';
import dotenv from 'dotenv';

// 載入環境變數
dotenv.config();

const restaurantId = process.env.VITE_RESTAURANT_ID || '11111111-1111-1111-1111-111111111111';

async function testKDSService() {
  try {
    console.log('🧪 測試 KDS Service...');
    console.log(`📍 餐廳ID: ${restaurantId}`);
    
    const orders = await KDSService.fetchActiveOrders(restaurantId);
    
    console.log(`✅ KDS Service 返回 ${orders.length} 筆訂單`);
    console.log('📋 KDS 訂單詳細:', JSON.stringify(orders, null, 2));
    
  } catch (error) {
    console.error('❌ KDS Service 測試失敗:', error);
  }
}

testKDSService();
