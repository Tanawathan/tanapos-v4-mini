import { test } from '@playwright/test';

test('V4-AI 頁面結構調試', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  
  console.log('📝 調試V4-AI頁面結構...');
  
  // 1. 檢查頁面標題
  const title = await page.locator('h1').textContent();
  console.log(`頁面標題: "${title}"`);
  
  // 2. 列出所有按鈕
  const buttons = page.locator('button');
  const buttonCount = await buttons.count();
  console.log(`\n發現 ${buttonCount} 個按鈕:`);
  
  for (let i = 0; i < buttonCount; i++) {
    const buttonText = await buttons.nth(i).textContent();
    const isVisible = await buttons.nth(i).isVisible();
    console.log(`${i + 1}. "${buttonText}" (可見: ${isVisible})`);
  }
  
  // 3. 檢查是否有特定的功能區域
  const cardElements = page.locator('.card, .bg-white, .bg-blue, .bg-green');
  const cardCount = await cardElements.count();
  console.log(`\n發現 ${cardCount} 個卡片元素`);
  
  // 4. 檢查是否有文字包含特定關鍵字的元素
  const keywords = ['點餐', '桌台', '庫存', '結帳', 'POS', '管理'];
  for (const keyword of keywords) {
  // Use getByText with exact: false to find partial matches
  const elements = page.getByText(keyword, { exact: false });
    const count = await elements.count();
    if (count > 0) {
      console.log(`\n包含"${keyword}"的元素 (${count}個):`);
      for (let i = 0; i < Math.min(count, 3); i++) {
        const text = await elements.nth(i).textContent();
        console.log(`  - "${text}"`);
      }
    }
  }
  
  // 5. 檢查主要容器
  const mainContent = page.locator('main, .main, #main, .container');
  const mainCount = await mainContent.count();
  console.log(`\n主要容器數量: ${mainCount}`);
});
