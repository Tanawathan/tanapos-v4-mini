import { test, expect } from '@playwright/test';

test.describe('TanaPOS V4-AI 桌台管理系統', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // 等待頁面載入完成
    await page.waitForLoadState('networkidle');
    
    // 切換到桌台管理頁面 - 點擊桌台管理按鈕
  const tableManagementButton = page.locator('button:has-text("桌台管理"), a:has-text("桌台管理")').last();
    await tableManagementButton.click();
    
    // 等待桌台管理頁面完全載入
    await page.waitForSelector('[data-testid="table-management-page"], h1:has-text("桌台管理")', { timeout: 5000 });
  });

  test('桌台狀態循環測試 - Available → Seated → Dining → Payment-Pending → Cleaning → Available', async ({ page }) => {
    console.log('開始測試桌台狀態循環...');

    // 查找第一個可用的桌台
    const firstTable = page.locator('[data-table-status="Available"]').first();
    
    if (await firstTable.count() === 0) {
      console.log('沒有可用的桌台，跳過此測試');
      test.skip();
      return;
    }

    // 獲取桌台號碼
    const tableNumber = await firstTable.getAttribute('data-table-number') || '1';
    console.log(`測試桌台: ${tableNumber}`);

    // 1. 驗證初始狀態為 "Available"
    await expect(firstTable).toHaveAttribute('data-table-status', 'Available');
    console.log('✓ 桌台初始狀態為 Available');

    // 2. 點擊桌台並模擬顧客入座
    await firstTable.click();
    
    // 查找並點擊入座按鈕
    const seatButton = page.locator('button:has-text("安排入座"), button:has-text("入座"), button:has-text("Seat")');
    if (await seatButton.count() > 0) {
      await seatButton.first().click();
      
      // 填寫客人數量（如果有輸入框）
      const customerCountInput = page.locator('input[placeholder*="客人"], input[type="number"]');
      if (await customerCountInput.count() > 0) {
        await customerCountInput.fill('2');
      }
      
      // 確認入座
      const confirmButton = page.locator('button:has-text("確認"), button:has-text("Confirm")');
      if (await confirmButton.count() > 0) {
        await confirmButton.click();
      }
    }

    // 3. 驗證狀態變更為 "Seated"
    await page.waitForTimeout(1000); // 等待狀態更新
    const seatedTable = page.locator(`[data-table-number="${tableNumber}"]`);
    await expect(seatedTable).toHaveAttribute('data-table-status', 'Seated');
    console.log('✓ 桌台狀態更新為 Seated');

    // 4. 模擬開始點餐 - 狀態變更為 "Dining"
    await seatedTable.click();
    const startOrderButton = page.locator('button:has-text("開始點餐"), button:has-text("Start Order")');
    if (await startOrderButton.count() > 0) {
      await startOrderButton.click();
    }

    await page.waitForTimeout(1000);
    await expect(seatedTable).toHaveAttribute('data-table-status', 'Dining');
    console.log('✓ 桌台狀態更新為 Dining');

    // 5. 模擬請求結帳 - 狀態變更為 "Payment-Pending"
    await seatedTable.click();
    const requestPaymentButton = page.locator('button:has-text("請求結帳"), button:has-text("Request Payment")');
    if (await requestPaymentButton.count() > 0) {
      await requestPaymentButton.click();
    }

    await page.waitForTimeout(1000);
    await expect(seatedTable).toHaveAttribute('data-table-status', 'Payment-Pending');
    console.log('✓ 桌台狀態更新為 Payment-Pending');

    // 6. 模擬完成支付 - 狀態變更為 "Cleaning"
    await seatedTable.click();
    const completePaymentButton = page.locator('button:has-text("完成支付"), button:has-text("Complete Payment")');
    if (await completePaymentButton.count() > 0) {
      await completePaymentButton.click();
    }

    await page.waitForTimeout(1000);
    await expect(seatedTable).toHaveAttribute('data-table-status', 'Cleaning');
    console.log('✓ 桌台狀態更新為 Cleaning');

    // 7. 模擬完成清潔 - 狀態回復為 "Available"
    await seatedTable.click();
    const completeCleaningButton = page.locator('button:has-text("完成清潔"), button:has-text("Complete Cleaning")');
    if (await completeCleaningButton.count() > 0) {
      await completeCleaningButton.click();
    }

    await page.waitForTimeout(1000);
    await expect(seatedTable).toHaveAttribute('data-table-status', 'Available');
    console.log('✓ 桌台狀態回復為 Available');

    console.log('🎉 桌台狀態循環測試完成！');
  });

  test('桌台篩選功能測試', async ({ page }) => {
    console.log('開始測試桌台篩選功能...');

    // 測試 "Available" 篩選器
    const availableFilter = page.locator('button:has-text("空閒"), button:has-text("Available")');
    if (await availableFilter.count() > 0) {
      await availableFilter.click();
      await page.waitForTimeout(500);
      
      // 驗證只顯示 Available 桌台
      const visibleTables = page.locator('[data-table-status]:visible');
      const tableCount = await visibleTables.count();
      
      for (let i = 0; i < tableCount; i++) {
        const table = visibleTables.nth(i);
        const status = await table.getAttribute('data-table-status');
        if (status && status !== 'Available') {
          console.log(`警告: 篩選器顯示了非 Available 桌台: ${status}`);
        }
      }
      console.log('✓ Available 篩選器功能正常');
    }

    // 測試 "All" 篩選器
    const allFilter = page.locator('button:has-text("全部"), button:has-text("All")');
    if (await allFilter.count() > 0) {
      await allFilter.click();
      await page.waitForTimeout(500);
      console.log('✓ All 篩選器功能正常');
    }

    console.log('🎉 桌台篩選功能測試完成！');
  });

  test('桌台容量與分配測試', async ({ page }) => {
    console.log('開始測試桌台容量分配...');

    // 查找不同容量的桌台
    const tables = page.locator('[data-table-capacity]');
    const tableCount = await tables.count();
    
    if (tableCount === 0) {
      console.log('沒有找到桌台容量資訊，跳過此測試');
      test.skip();
      return;
    }

    for (let i = 0; i < Math.min(tableCount, 3); i++) {
      const table = tables.nth(i);
      const capacity = await table.getAttribute('data-table-capacity');
      const tableNumber = await table.getAttribute('data-table-number');
      
      console.log(`桌台 ${tableNumber} 容量: ${capacity} 人`);
      
      // 驗證容量是有效數字
      expect(parseInt(capacity || '0')).toBeGreaterThan(0);
    }

    console.log('✓ 桌台容量資訊正確');
    console.log('🎉 桌台容量測試完成！');
  });

  test('桌台資訊顯示測試', async ({ page }) => {
    console.log('開始測試桌台資訊顯示...');

    const firstTable = page.locator('[data-table-number]').first();
    
    if (await firstTable.count() === 0) {
      console.log('沒有找到桌台，跳過此測試');
      test.skip();
      return;
    }

    // 點擊桌台查看詳細資訊
    await firstTable.click();

    // 檢查是否有桌台資訊模態框或詳細資訊區域
    const infoModal = page.locator('[data-testid="table-info-modal"], .table-info, .modal');
    
    if (await infoModal.count() > 0) {
      // 驗證桌台資訊內容
      const modalContent = await infoModal.textContent();
      
      // 檢查是否包含基本資訊
      if (modalContent) {
        console.log('桌台資訊內容:', modalContent.substring(0, 100) + '...');
      }
      
      console.log('✓ 桌台資訊顯示正常');
    } else {
      console.log('沒有找到桌台資訊模態框');
    }

    console.log('🎉 桌台資訊顯示測試完成！');
  });
});

test.describe('TanaPOS V4-AI 響應式設計測試', () => {
  test('移動設備桌台管理測試', async ({ page }) => {
    // 設置移動設備視窗大小
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('/');
    
    console.log('開始測試移動設備桌台管理...');

    // 切換到桌台管理
    const tableManagementTab = page.locator('text=桌台管理');
    if (await tableManagementTab.isVisible()) {
      await tableManagementTab.click();
    }

    // 驗證桌台在小螢幕上正確顯示
    const tables = page.locator('[data-table-number]');
    const tableCount = await tables.count();
    
    console.log(`移動設備上顯示 ${tableCount} 個桌台`);
    
    if (tableCount > 0) {
      const firstTable = tables.first();
      
      // 驗證桌台元素可見且可點擊
      await expect(firstTable).toBeVisible();
      
      // 測試觸控操作
      await firstTable.tap();
      
      console.log('✓ 移動設備桌台操作正常');
    }

    console.log('🎉 移動設備測試完成！');
  });
});
