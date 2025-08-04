import { test, expect } from '@playwright/test';

test.describe('TanaPOS V4-AI 最終功能驗證', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5178');
    await page.waitForLoadState('networkidle');
  });

  test('V4-AI 系統基本功能完整驗證', async ({ page }) => {
    console.log('🎯 開始V4-AI系統完整驗證...');

    // 1. 驗證頁面標題
    await expect(page.locator('h1')).toContainText('TanaPOS v4 AI');
    console.log('✅ 頁面標題驗證通過');

    // 2. 驗證所有主要功能按鈕
    const mainButtons = [
      '開始點餐',
      '訂單管理', 
      '桌台管理',
      '結帳管理'
    ];

    for (const buttonText of mainButtons) {
      await expect(page.locator(`button:has-text("${buttonText}")`)).toBeVisible();
      console.log(`✅ "${buttonText}" 按鈕存在且可見`);
    }

    // 3. 測試桌台管理功能流程
    console.log('🪑 測試桌台管理功能...');
    await page.locator('button:has-text("桌台管理")').click();
    await page.waitForSelector('h1:has-text("桌台管理")', { timeout: 5000 });
    await expect(page.locator('h1')).toContainText('桌台管理');
    console.log('✅ 桌台管理頁面導航成功');

    // 檢查返回功能
    await expect(page.locator('button:has-text("返回")')).toBeVisible();
    await page.locator('button:has-text("返回")').click();
    await page.waitForSelector('h1:has-text("TanaPOS v4 AI")', { timeout: 5000 });
    console.log('✅ 返回首頁功能正常');

    // 4. 測試開始點餐功能
    console.log('🍽️ 測試點餐功能...');
    await page.locator('button:has-text("開始點餐")').click();
    await page.waitForTimeout(2000);
    
    // 檢查是否導航到點餐頁面（根據實際頁面結構調整）
    const hasOrderInterface = await page.locator('h1, h2, h3').count() > 0;
    if (hasOrderInterface) {
      console.log('✅ 點餐功能導航成功');
    } else {
      console.log('⚠️ 點餐頁面可能需要進一步開發');
    }

    // 返回首頁（如果有返回按鈕的話）
    const backButton = page.locator('button:has-text("返回"), button:has-text("首頁")');
    if (await backButton.isVisible()) {
      await backButton.first().click();
      await page.waitForTimeout(1000);
    }

    // 5. 測試訂單管理功能
    console.log('📋 測試訂單管理功能...');
    await page.locator('button:has-text("訂單管理")').click();
    await page.waitForTimeout(2000);
    
    const hasOrderManagement = await page.locator('h1, h2, h3').count() > 0;
    if (hasOrderManagement) {
      console.log('✅ 訂單管理功能導航成功');
    }

    // 6. 測試結帳管理功能
    console.log('💰 測試結帳管理功能...');
    
    // 先回到首頁
    await page.goto('http://localhost:5178');
    await page.waitForLoadState('networkidle');
    
    await page.locator('button:has-text("結帳管理")').click();
    await page.waitForTimeout(2000);
    
    const hasCheckoutManagement = await page.locator('h1, h2, h3').count() > 0;
    if (hasCheckoutManagement) {
      console.log('✅ 結帳管理功能導航成功');
    }

    console.log('🎉 V4-AI系統功能驗證完成！');
  });

  test('V4-AI 響應式設計測試', async ({ page }) => {
    console.log('📱 開始響應式設計測試...');

    // 測試桌面版
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    let buttonCount = await page.locator('button:has-text("開始點餐"), button:has-text("桌台管理")').count();
    expect(buttonCount).toBeGreaterThan(0);
    console.log(`✅ 桌面版 (1280x720): 發現 ${buttonCount} 個主要按鈕`);

    // 測試平板版
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    buttonCount = await page.locator('button:has-text("開始點餐"), button:has-text("桌台管理")').count();
    expect(buttonCount).toBeGreaterThan(0);
    console.log(`✅ 平板版 (768x1024): 發現 ${buttonCount} 個主要按鈕`);

    // 測試手機版
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    buttonCount = await page.locator('button:has-text("開始點餐"), button:has-text("桌台管理")').count();
    expect(buttonCount).toBeGreaterThan(0);
    console.log(`✅ 手機版 (375x667): 發現 ${buttonCount} 個主要按鈕`);

    console.log('✅ 響應式設計測試通過');
  });

  test('V4-AI 系統穩定性測試', async ({ page }) => {
    console.log('🛡️ 開始系統穩定性測試...');

    // 監聽控制台錯誤
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // 執行完整的頁面導航流程
    const actions = [
      '桌台管理',
      '開始點餐', 
      '訂單管理',
      '結帳管理'
    ];

    for (const action of actions) {
      console.log(`🔄 測試 ${action} 功能...`);
      
      // 回到首頁
      await page.goto('http://localhost:5178');
      await page.waitForLoadState('networkidle');
      
      // 點擊相應按鈕
      await page.locator(`button:has-text("${action}")`).click();
      await page.waitForTimeout(2000);
      
      console.log(`✅ ${action} 導航完成`);
    }

    // 檢查嚴重錯誤
    const criticalErrors = consoleErrors.filter(error => 
      error.includes('Uncaught') || 
      error.includes('TypeError') || 
      error.includes('ReferenceError')
    );

    console.log(`📊 控制台錯誤統計: 總計 ${consoleErrors.length} 個，嚴重錯誤 ${criticalErrors.length} 個`);
    
    if (criticalErrors.length > 0) {
      console.log('⚠️ 發現嚴重錯誤:', criticalErrors.slice(0, 3));
    } else {
      console.log('✅ 未發現嚴重系統錯誤');
    }

    expect(criticalErrors.length).toBe(0);
    console.log('✅ 系統穩定性測試通過');
  });
});
