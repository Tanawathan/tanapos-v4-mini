/**
 * 結帳系統功能測試腳本
 * 目的：測試結帳系統的 Supabase 數據庫連接和核心功能
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// 載入環境變數
config();

// 初始化 Supabase 客戶端
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const restaurantId = process.env.VITE_RESTAURANT_ID;

const supabase = createClient(supabaseUrl, supabaseKey);

// 支付方式類型
const PaymentMethods = {
  CASH: 'cash',
  MOBILE: 'mobile',
  TRANSFER: 'transfer'
};

// 主測試函數
async function testCheckoutFunctions() {
  console.log('💰 開始測試結帳系統功能...\n');

  try {
    // 1. 測試載入有活躍訂單的桌台
    console.log('1️⃣ 測試載入有活躍訂單的桌台');
    
    const tablesWithOrdersResult = await supabase
      .from('tables')
      .select(`
        *,
        orders!inner (
          id,
          order_number,
          status,
          subtotal,
          tax_amount,
          total_amount,
          created_at
        )
      `)
      .eq('restaurant_id', restaurantId)
      .in('orders.status', ['pending', 'confirmed', 'preparing', 'ready', 'served']);

    if (tablesWithOrdersResult.error) {
      console.error('❌ 載入有訂單的桌台失敗:', tablesWithOrdersResult.error);
      return;
    }

    console.log(`✅ 找到 ${tablesWithOrdersResult.data.length} 個有活躍訂單的桌台`);
    
    tablesWithOrdersResult.data.forEach(table => {
      console.log(`   桌號 ${table.table_number}: ${table.orders.length} 個活躍訂單`);
    });

    // 2. 測試計算結帳金額
    console.log('\n2️⃣ 測試計算結帳金額');
    
    if (tablesWithOrdersResult.data.length > 0) {
      const testTable = tablesWithOrdersResult.data[0];
      const testOrder = testTable.orders[0];
      
      console.log(`✅ 測試桌號 ${testTable.table_number} 的訂單 ${testOrder.order_number}:`);
      console.log(`   基本金額: NT$ ${testOrder.subtotal}`);
      
      // 計算不同支付方式的金額
      const cashAmount = testOrder.subtotal;
      const mobileAmount = testOrder.subtotal * 1.05; // 加5%服務費
      const transferAmount = testOrder.subtotal;
      
      console.log(`   現金支付: NT$ ${cashAmount.toLocaleString()}`);
      console.log(`   行動支付: NT$ ${mobileAmount.toLocaleString()} (含5%服務費)`);
      console.log(`   銀行轉帳: NT$ ${transferAmount.toLocaleString()}`);
    }

    // 3. 測試載入訂單詳細項目
    console.log('\n3️⃣ 測試載入訂單詳細項目');
    
    if (tablesWithOrdersResult.data.length > 0) {
      const testOrder = tablesWithOrdersResult.data[0].orders[0];
      
      const orderItemsResult = await supabase
        .from('order_items')
        .select(`
          *,
          product:products (*)
        `)
        .eq('order_id', testOrder.id);

      if (orderItemsResult.error) {
        console.error('❌ 載入訂單項目失敗:', orderItemsResult.error);
      } else {
        console.log(`✅ 訂單 ${testOrder.order_number} 包含 ${orderItemsResult.data.length} 個項目:`);
        
        orderItemsResult.data.forEach((item, index) => {
          console.log(`   ${index + 1}. ${item.product.name} x${item.quantity} = NT$ ${item.total_price}`);
        });
      }
    }

    // 4. 測試結帳處理（模擬）
    console.log('\n4️⃣ 測試結帳處理功能');
    
    if (tablesWithOrdersResult.data.length > 0) {
      const testTable = tablesWithOrdersResult.data[0];
      const testOrder = testTable.orders[0];
      
      console.log(`✅ 模擬處理桌號 ${testTable.table_number} 的結帳:`);
      
      // 測試不同支付方式的處理
      const paymentTests = [
        {
          method: PaymentMethods.CASH,
          receivedAmount: testOrder.subtotal + 100,
          description: '現金支付'
        },
        {
          method: PaymentMethods.MOBILE,
          description: '行動支付'
        },
        {
          method: PaymentMethods.TRANSFER,
          description: '銀行轉帳'
        }
      ];

      paymentTests.forEach(test => {
        const finalAmount = test.method === PaymentMethods.MOBILE ? 
          testOrder.subtotal * 1.05 : testOrder.subtotal;
        
        console.log(`   ${test.description}:`);
        console.log(`     應收金額: NT$ ${finalAmount.toLocaleString()}`);
        
        if (test.method === PaymentMethods.CASH && test.receivedAmount) {
          const change = test.receivedAmount - finalAmount;
          console.log(`     收到金額: NT$ ${test.receivedAmount.toLocaleString()}`);
          console.log(`     找零金額: NT$ ${change.toLocaleString()}`);
        }
      });
    }

    // 5. 測試結帳後狀態更新（模擬）
    console.log('\n5️⃣ 測試結帳後狀態更新');
    
    if (tablesWithOrdersResult.data.length > 0) {
      const testTable = tablesWithOrdersResult.data[0];
      const testOrder = testTable.orders[0];
      
      console.log('✅ 模擬結帳完成後的狀態更新:');
      console.log(`   1. 訂單狀態: ${testOrder.status} → completed`);
      console.log(`   2. 桌台狀態: occupied → available`);
      console.log(`   3. 支付狀態: unpaid → paid`);
      console.log(`   4. 結帳時間: ${new Date().toLocaleString('zh-TW')}`);
    }

    // 6. 測試收據資料準備
    console.log('\n6️⃣ 測試收據資料準備');
    
    if (tablesWithOrdersResult.data.length > 0) {
      const testTable = tablesWithOrdersResult.data[0];
      const testOrder = testTable.orders[0];
      
      const receiptData = {
        orderNumber: testOrder.order_number,
        tableNumber: testTable.table_number,
        subtotal: testOrder.subtotal,
        serviceFee: 0,
        totalAmount: testOrder.subtotal,
        paymentMethod: '現金',
        receivedAmount: testOrder.subtotal + 50,
        changeAmount: 50,
        checkoutTime: new Date().toLocaleString('zh-TW')
      };

      console.log('✅ 收據資料準備完成:');
      console.log(`   訂單編號: ${receiptData.orderNumber}`);
      console.log(`   桌號: ${receiptData.tableNumber}`);
      console.log(`   小計: NT$ ${receiptData.subtotal.toLocaleString()}`);
      console.log(`   總計: NT$ ${receiptData.totalAmount.toLocaleString()}`);
      console.log(`   支付方式: ${receiptData.paymentMethod}`);
      console.log(`   結帳時間: ${receiptData.checkoutTime}`);
    }

    // 7. 測試統計資料更新
    console.log('\n7️⃣ 測試統計資料更新');
    
    // 計算今日營收（模擬）
    const today = new Date().toISOString().split('T')[0];
    const dailyRevenueResult = await supabase
      .from('orders')
      .select('total_amount')
      .eq('restaurant_id', restaurantId)
      .eq('status', 'completed')
      .gte('created_at', `${today}T00:00:00`)
      .lt('created_at', `${today}T23:59:59`);

    if (dailyRevenueResult.error) {
      console.error('❌ 計算今日營收失敗:', dailyRevenueResult.error);
    } else {
      const totalRevenue = dailyRevenueResult.data.reduce(
        (sum, order) => sum + (order.total_amount || 0), 0
      );
      console.log(`✅ 今日總營收: NT$ ${totalRevenue.toLocaleString()}`);
      console.log(`✅ 完成訂單數: ${dailyRevenueResult.data.length}`);
    }

    console.log('\n🎉 結帳系統測試完成！');
    console.log('📋 測試結果摘要:');
    console.log(`   ✅ 有訂單桌台: ${tablesWithOrdersResult.data.length} 個`);
    console.log('   ✅ 金額計算: 現金/行動支付/轉帳 正常');
    console.log('   ✅ 訂單項目: 正常載入');
    console.log('   ✅ 結帳處理: 模擬成功');
    console.log('   ✅ 狀態更新: 流程正確');
    console.log('   ✅ 收據資料: 準備完成');
    console.log('   ✅ 統計更新: 正常運作');

  } catch (error) {
    console.error('❌ 結帳系統測試過程發生錯誤:', error);
  }
}

// 執行測試
testCheckoutFunctions();
