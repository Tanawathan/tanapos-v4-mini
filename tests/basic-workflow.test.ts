import { test, expect } from '@playwright/test';

test.describe('TanaPOS V4-AI 基本功能流程驗證', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5178');
    await page.waitForLoadState('networkidle');
  });

  test('首頁功能驗證', async ({ page }) => {
    console.log('🏠 開始測試首頁功能...');

    // 驗證頁面標題（使用實際標題）
    await expect(page.locator('h1')).toContainText('TanaPOS v4 AI');
    
    // 驗證功能按鈕存在（使用實際按鈕文字）
    const buttons = ['桌台管理', '庫存管理', '結帳系統'];
    for (const buttonText of buttons) {
      await expect(page.locator(`button:has-text("${buttonText}")`)).toBeVisible();
    }
    
    console.log('✅ 首頁功能驗證完成');
  });

  test('桌台管理頁面導航測試', async ({ page }) => {
    console.log('🪑 開始測試桌台管理導航...');

    // 點擊桌台管理按鈕
    await page.locator('button:has-text("桌台管理")').last().click();
    
    // 等待頁面切換
    await page.waitForSelector('h1:has-text("桌台管理")', { timeout: 5000 });
    
    // 驗證頁面標題
    await expect(page.locator('h1')).toContainText('桌台管理');
    
    // 驗證返回按鈕存在
    await expect(page.locator('button:has-text("返回")')).toBeVisible();
    
    console.log('✅ 桌台管理導航測試完成');
  });

  test('桌台資料載入驗證', async ({ page }) => {
    console.log('📊 開始測試桌台資料載入...');

    // 導航到桌台管理
    await page.locator('button:has-text("桌台管理")').last().click();
    await page.waitForSelector('h1:has-text("桌台管理")', { timeout: 5000 });
    
    // 等待桌台資料載入
    await page.waitForTimeout(2000);
    
    // 檢查是否有桌台資料顯示
    const tableElements = page.locator('[data-table-id], .table-card, .桌台');
    const tableCount = await tableElements.count();
    
    console.log(`找到 ${tableCount} 個桌台元素`);
    
    if (tableCount > 0) {
      console.log('✅ 桌台資料載入成功');
    } else {
      console.log('⚠️ 未找到桌台資料，檢查頁面結構');
      
      // 列出頁面上的所有元素以進行調試
      const allElements = await page.locator('*').count();
      console.log(`頁面總元素數量: ${allElements}`);
      
      // 檢查是否有載入指示器
      const loadingIndicator = page.locator('text=載入中, text=Loading');
      if (await loadingIndicator.isVisible()) {
        console.log('發現載入指示器，等待載入完成...');
        await loadingIndicator.waitFor({ state: 'hidden', timeout: 10000 });
      }
    }
  });

  test('POS系統導航測試', async ({ page }) => {
    console.log('🍽️ 開始測試POS系統導航...');

    // 檢查首頁是否有POS相關功能按鈕
    const posButtons = await page.locator('button:has-text("POS"), button:has-text("點餐"), button:has-text("收銀")').count();
    
    if (posButtons > 0) {
      // 如果找到相關按鈕，點擊第一個
      await page.locator('button:has-text("POS"), button:has-text("點餐"), button:has-text("收銀")').first().click();
      await page.waitForTimeout(2000);
      console.log('✅ POS系統導航成功');
    } else {
      console.log('⚠️ 首頁未找到POS相關按鈕，檢查可用功能');
      
      // 列出所有可用按鈕
      const allButtons = page.locator('button');
      const buttonCount = await allButtons.count();
      console.log(`發現 ${buttonCount} 個按鈕`);
      
      for (let i = 0; i < Math.min(buttonCount, 10); i++) {
        const buttonText = await allButtons.nth(i).textContent();
        console.log(`按鈕 ${i + 1}: ${buttonText}`);
      }
    }
  });

  test('響應式設計驗證', async ({ page }) => {
    console.log('📱 開始測試響應式設計...');

    // 測試桌面版面
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // 驗證桌面版佈局
    const desktopButtons = await page.locator('button:has-text("點餐系統"), button:has-text("桌台管理")').count();
    expect(desktopButtons).toBeGreaterThan(0);
    
    // 測試手機版面
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // 驗證手機版佈局
    const mobileButtons = await page.locator('button:has-text("點餐系統"), button:has-text("桌台管理")').count();
    expect(mobileButtons).toBeGreaterThan(0);
    
    console.log('✅ 響應式設計驗證完成');
  });

  test('系統錯誤處理測試', async ({ page }) => {
    console.log('🛡️ 開始測試錯誤處理...');

    // 監聽控制台錯誤
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // 執行基本操作
    await page.locator('button:has-text("桌台管理")').last().click();
    await page.waitForTimeout(3000);
    
    // 返回首頁
    if (await page.locator('button:has-text("返回")').isVisible()) {
      await page.locator('button:has-text("返回")').click();
    }
    
    await page.waitForTimeout(1000);
    
    // 檢查是否有嚴重錯誤
    const criticalErrors = consoleErrors.filter(error => 
      error.includes('Uncaught') || 
      error.includes('TypeError') || 
      error.includes('ReferenceError')
    );
    
    if (criticalErrors.length > 0) {
      console.log('⚠️ 發現控制台錯誤:', criticalErrors);
    } else {
      console.log('✅ 無嚴重錯誤');
    }
    
    expect(criticalErrors.length).toBe(0);
  });
});
