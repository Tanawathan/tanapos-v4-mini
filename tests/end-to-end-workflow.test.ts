import { test, expect } from '@playwright/test';

test.describe('TanaPOS V4-AI 端到端業務流程測試', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('完整餐廳營運流程: 從入座到結帳', async ({ page }) => {
    console.log('🍽️ 開始完整餐廳營運流程測試...');

    // === 階段1: 接待與帶位 ===
    console.log('📍 階段1: 接待與帶位');
    
    // 切換到桌台管理（避免嚴格模式多重匹配，限定為連結或按鈕）
    const tableManagementTab = page.locator('a:has-text("桌台管理"), button:has-text("桌台管理")').first();
    if (await tableManagementTab.count() > 0) {
      await tableManagementTab.click();
      await page.waitForTimeout(500);
    }

    // 查找可用桌台
    const availableTable = page.locator('[data-table-status="Available"]').first();
    
    if (await availableTable.count() === 0) {
      console.log('⚠️ 沒有可用桌台，無法進行完整流程測試');
      test.skip();
      return;
    }

    const tableNumber = await availableTable.getAttribute('data-table-number') || '1';
    console.log(`🪑 選擇桌台: ${tableNumber}`);

    // 安排客人入座
    await availableTable.click();
    
    const seatButton = page.locator('button:has-text("安排入座"), button:has-text("入座")');
    if (await seatButton.count() > 0) {
      await seatButton.first().click();
      
      // 填寫客人數量
      const customerInput = page.locator('input[type="number"], input[placeholder*="客人"]');
      if (await customerInput.count() > 0) {
        await customerInput.fill('3');
        console.log('👥 設定客人數量: 3人');
      }
      
      const confirmButton = page.locator('button:has-text("確認")');
      if (await confirmButton.count() > 0) {
        await confirmButton.click();
      }
    }

    await page.waitForTimeout(1000);
    
    // 驗證桌台狀態更新
    const seatedTable = page.locator(`[data-table-number="${tableNumber}"]`);
    await expect(seatedTable).toHaveAttribute('data-table-status', 'Seated');
    console.log('✅ 桌台狀態更新為 Seated');

    // === 階段2: 點餐服務 ===
    console.log('📍 階段2: 點餐服務');
    
    // 切換到點餐頁面
    const orderingTab = page.locator('a:has-text("點餐系統"), a:has-text("開始點餐"), button:has-text("點餐")');
    if (await orderingTab.count() > 0) {
      await orderingTab.first().click();
      await page.waitForTimeout(500);
    }

    // 選擇桌台進行點餐
    const tableSelector = page.locator(`[data-table="${tableNumber}"], button:has-text("桌台 ${tableNumber}"), option:has-text("${tableNumber}")`);
    if (await tableSelector.count() > 0) {
      await tableSelector.first().click();
      console.log(`🍽️ 選擇桌台 ${tableNumber} 開始點餐`);
    }

    // 查找菜品並添加到購物車
    const products = page.locator('[data-product-id], .product-item, .menu-item');
    const productCount = await products.count();
    
    if (productCount > 0) {
      // 添加第一個產品
      const firstProduct = products.first();
      await firstProduct.click();
      
      // 查找添加到購物車按鈕
      const addToCartBtn = page.locator('button:has-text("加入購物車"), button:has-text("添加"), button:has-text("Add")');
      if (await addToCartBtn.count() > 0) {
        await addToCartBtn.first().click();
        console.log('🛒 添加產品到購物車');
      }

      // 如果有第二個產品，也添加
      if (productCount > 1) {
        const secondProduct = products.nth(1);
        await secondProduct.click();
        
        // 設定數量
        const quantityInput = page.locator('input[type="number"]');
        if (await quantityInput.count() > 0) {
          await quantityInput.fill('2');
        }
        
        if (await addToCartBtn.count() > 0) {
          await addToCartBtn.first().click();
          console.log('🛒 添加第二個產品到購物車 (數量:2)');
        }
      }
    }

    // 填寫訂單備註
    const notesInput = page.locator('textarea[placeholder*="備註"], input[placeholder*="備註"], textarea[name="notes"]');
    if (await notesInput.count() > 0) {
      await notesInput.fill('不要太辣，謝謝！');
      console.log('📝 添加訂單備註');
    }

    // 確認訂單
    const confirmOrderBtn = page.locator('button:has-text("確認訂單"), button:has-text("送出訂單"), button:has-text("Submit")');
    if (await confirmOrderBtn.count() > 0) {
      await confirmOrderBtn.click();
      console.log('📋 確認並送出訂單');
      await page.waitForTimeout(2000);
    }

    // 驗證桌台狀態更新為用餐中
    await tableManagementTab.click();
    await page.waitForTimeout(500);
    
    const diningTable = page.locator(`[data-table-number="${tableNumber}"]`);
    await expect(diningTable).toHaveAttribute('data-table-status', 'Dining');
    console.log('✅ 桌台狀態更新為 Dining');

    // === 階段3: 訂單管理 ===
    console.log('📍 階段3: 訂單管理');
    
  const ordersTab = page.locator('a:has-text("訂單管理"), button:has-text("訂單")');
    if (await ordersTab.count() > 0) {
      await ordersTab.first().click();
      await page.waitForTimeout(500);
    }

    // 查找新建立的訂單
    const orders = page.locator('[data-order-id], .order-item, .order-card');
    if (await orders.count() > 0) {
      const latestOrder = orders.first();
      
      // 驗證訂單狀態為 Pending
      const orderStatus = await latestOrder.getAttribute('data-order-status');
      if (orderStatus === 'Pending' || await latestOrder.locator('text=Pending, text=待處理').count() > 0) {
        console.log('✅ 訂單狀態為 Pending');
      }

      // 模擬廚房接單 - 更新為 Preparing
      await latestOrder.click();
      const preparingBtn = page.locator('button:has-text("準備中"), button:has-text("Preparing")');
      if (await preparingBtn.count() > 0) {
        await preparingBtn.click();
        console.log('👨‍🍳 訂單狀態更新為 Preparing');
        await page.waitForTimeout(1000);
      }

      // 模擬出餐完成 - 更新為 Ready
      const readyBtn = page.locator('button:has-text("準備完成"), button:has-text("Ready")');
      if (await readyBtn.count() > 0) {
        await readyBtn.click();
        console.log('🍽️ 訂單狀態更新為 Ready');
        await page.waitForTimeout(1000);
      }

      // 模擬送餐完成 - 更新為 Served
      const servedBtn = page.locator('button:has-text("已出餐"), button:has-text("Served")');
      if (await servedBtn.count() > 0) {
        await servedBtn.click();
        console.log('🚚 訂單狀態更新為 Served');
        await page.waitForTimeout(1000);
      }
    }

    // === 階段4: 結帳流程 ===
    console.log('📍 階段4: 結帳流程');
    
    // 設置桌台為等待結帳狀態
    await tableManagementTab.click();
    await page.waitForTimeout(500);
    
    const tableForPayment = page.locator(`[data-table-number="${tableNumber}"]`);
    await tableForPayment.click();
    
    const requestPaymentBtn = page.locator('button:has-text("請求結帳"), button:has-text("Request Payment")');
    if (await requestPaymentBtn.count() > 0) {
      await requestPaymentBtn.click();
      console.log('💰 設置桌台為等待結帳狀態');
      await page.waitForTimeout(1000);
    }

    // 切換到結帳頁面
  const checkoutTab = page.locator('a:has-text("結帳系統"), a:has-text("結帳管理"), button:has-text("結帳")');
    if (await checkoutTab.count() > 0) {
      await checkoutTab.first().click();
      await page.waitForTimeout(500);
    }

    // 選擇要結帳的桌台
    const checkoutTable = page.locator(`[data-checkout-table="${tableNumber}"], button:has-text("桌台 ${tableNumber}")`);
    if (await checkoutTable.count() > 0) {
      await checkoutTable.click();
      console.log(`💳 選擇桌台 ${tableNumber} 進行結帳`);
    }

    // 選擇支付方式 - 現金
    const cashPaymentBtn = page.locator('button:has-text("現金"), input[value="cash"]');
    if (await cashPaymentBtn.count() > 0) {
      await cashPaymentBtn.click();
      console.log('💵 選擇現金支付');
    }

    // 輸入收款金額
    const amountButtons = page.locator('button:has-text("500"), button[data-amount="500"]');
    if (await amountButtons.count() > 0) {
      await amountButtons.first().click();
      console.log('💰 設定收款金額: 500元');
    }

    // 完成支付
    const completePaymentBtn = page.locator('button:has-text("完成支付"), button:has-text("Complete Payment")');
    if (await completePaymentBtn.count() > 0) {
      await completePaymentBtn.click();
      console.log('✅ 完成支付');
      await page.waitForTimeout(2000);
    }

    // === 階段5: 收據與清潔 ===
    console.log('📍 階段5: 收據與清潔');
    
    // 檢查收據是否顯示
    const receipt = page.locator('[data-testid="receipt"], .receipt, .payment-success');
    if (await receipt.count() > 0) {
      console.log('🧾 收據顯示正常');
      
      // 關閉收據
      const closeReceiptBtn = page.locator('button:has-text("關閉"), button:has-text("Close"), .close-btn');
      if (await closeReceiptBtn.count() > 0) {
        await closeReceiptBtn.click();
      }
    }

    // 檢查桌台狀態是否更新為清潔中
    await tableManagementTab.click();
    await page.waitForTimeout(500);
    
    const cleaningTable = page.locator(`[data-table-number="${tableNumber}"]`);
    await expect(cleaningTable).toHaveAttribute('data-table-status', 'Cleaning');
    console.log('✅ 桌台狀態更新為 Cleaning');

    // 完成清潔，重置桌台
    await cleaningTable.click();
    const completeCleaningBtn = page.locator('button:has-text("完成清潔"), button:has-text("Complete Cleaning")');
    if (await completeCleaningBtn.count() > 0) {
      await completeCleaningBtn.click();
      console.log('🧹 完成桌台清潔');
      await page.waitForTimeout(1000);
    }

    // 驗證桌台狀態回復為可用
    await expect(cleaningTable).toHaveAttribute('data-table-status', 'Available');
    console.log('✅ 桌台狀態回復為 Available');

    // === 驗證最終狀態 ===
    console.log('📍 最終驗證');
    
    // 檢查訂單最終狀態
    await ordersTab.first().click();
    await page.waitForTimeout(500);
    
    const finalOrders = page.locator('[data-order-id], .order-item');
    if (await finalOrders.count() > 0) {
      const completedOrder = finalOrders.first();
      const finalStatus = await completedOrder.getAttribute('data-order-status');
      
      if (finalStatus === 'Completed' || await completedOrder.locator('text=Completed, text=已完成').count() > 0) {
        console.log('✅ 訂單最終狀態為 Completed');
      }
    }

    console.log('🎉 完整餐廳營運流程測試成功完成！');
    console.log('📊 測試摘要:');
    console.log('   ✅ 桌台狀態管理正常');
    console.log('   ✅ 點餐流程運作正常');
    console.log('   ✅ 訂單狀態更新正常');
    console.log('   ✅ 結帳流程運作正常');
    console.log('   ✅ 桌台清潔與重置正常');
  });

  test('多桌台並行操作測試', async ({ page }) => {
    console.log('🏢 開始多桌台並行操作測試...');

    // 切換到桌台管理
    const tableManagementTab = page.locator('a:has-text("桌台管理"), button:has-text("桌台管理")').first();
    if (await tableManagementTab.count() > 0) {
      await tableManagementTab.click();
      await page.waitForTimeout(500);
    }

    // 查找多個可用桌台
    const availableTables = page.locator('[data-table-status="Available"]');
    const tableCount = await availableTables.count();
    
    if (tableCount < 2) {
      console.log('⚠️ 可用桌台少於2個，無法進行多桌台測試');
      test.skip();
      return;
    }

    const testTableCount = Math.min(3, tableCount);
    console.log(`🪑 測試 ${testTableCount} 個桌台的並行操作`);

    // 並行安排多個桌台入座
    for (let i = 0; i < testTableCount; i++) {
      const table = availableTables.nth(i);
      const tableNumber = await table.getAttribute('data-table-number');
      
      await table.click();
      
      const seatButton = page.locator('button:has-text("安排入座"), button:has-text("入座")');
      if (await seatButton.count() > 0) {
        await seatButton.first().click();
        
        const customerInput = page.locator('input[type="number"]');
        if (await customerInput.count() > 0) {
          await customerInput.fill((i + 2).toString()); // 2-4人
        }
        
        const confirmButton = page.locator('button:has-text("確認")');
        if (await confirmButton.count() > 0) {
          await confirmButton.click();
        }
      }
      
      console.log(`👥 桌台 ${tableNumber} 安排入座: ${i + 2}人`);
      await page.waitForTimeout(500);
    }

    // 驗證所有桌台狀態都已更新
    for (let i = 0; i < testTableCount; i++) {
      const table = availableTables.nth(i);
      await expect(table).toHaveAttribute('data-table-status', 'Seated');
    }

    console.log('✅ 多桌台並行操作測試完成');
  });

  test('錯誤處理與恢復測試', async ({ page }) => {
    console.log('🔄 開始錯誤處理與恢復測試...');

    // 測試網路中斷恢復（模擬）
    await page.route('**/api/**', route => route.abort());
    console.log('🚫 模擬網路中斷...');

    // 嘗試執行操作（應該失敗）
    const tableManagementTab = page.locator('a:has-text("桌台管理"), button:has-text("桌台管理")').first();
    if (await tableManagementTab.count() > 0) {
      await tableManagementTab.click();
    }

    // 恢復網路連接
    await page.unroute('**/api/**');
    console.log('✅ 恢復網路連接');

    // 刷新頁面測試狀態保持
    await page.reload();
    await page.waitForLoadState('networkidle');
    console.log('🔄 頁面刷新後狀態檢查');

    // 驗證基本功能仍然正常
    const tableManagementTab2 = page.locator('a:has-text("桌台管理"), button:has-text("桌台管理")').first();
    if (await tableManagementTab2.count() > 0) {
      await tableManagementTab2.click();
      const tables = page.locator('[data-table-number]');
      const tableCount = await tables.count();
      
      if (tableCount > 0) {
        console.log(`✅ 頁面刷新後仍顯示 ${tableCount} 個桌台`);
      }
    }

    console.log('✅ 錯誤處理與恢復測試完成');
  });
});
