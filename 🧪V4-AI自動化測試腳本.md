# 🧪 TanaPOS V4-AI 自動化測試腳本與驗證計劃

## 📊 項目概覽

**測試目標**: TanaPOS V4-AI 版本的餐廳營運AI系統
**測試範圍**: POS點餐、訂單管理、桌台管理、結帳系統的完整業務流程
**測試環境**: http://localhost:5174 (V4-AI開發伺服器)
**數據庫**: Supabase 雲端資料庫

## 🎯 V4-AI 系統特色功能測試

### 1. AI 餐廳營運管理測試
- ✅ 桌位狀態自動化管理
- ✅ 訂單狀態機完整性驗證
- ✅ SOP (標準作業流程) 嚴格遵守測試
- ✅ 餐廳生命週期管理驗證

### 2. 核心系統模組測試
- **OrderingPage.tsx**: 點餐系統UI/UX測試
- **OrdersPage.tsx**: 訂單管理與狀態追蹤測試
- **TableManagementPage.tsx**: 桌台管理與篩選功能測試
- **CheckoutPage.tsx**: 結帳系統與支付流程測試

### 3. 資料庫整合測試
- **Supabase 即時同步**: 多客戶端數據同步測試
- **狀態一致性**: 跨模組資料一致性驗證
- **錯誤恢復**: 網路中斷與資料恢復測試

## 🔧 測試環境設置

### 前置作業
```bash
# 切換到 V4-AI 項目目錄
cd "c:\TanaPOS\tanapos-v4-ai"

# 安裝測試依賴
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom @types/testing-library__jest-dom playwright @playwright/test

# 啟動開發伺服器
npm run dev
```

### 環境變數設置
確保 `.env` 文件包含正確的 Supabase 連線設定：
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 🧪 自動化測試腳本

### 1. 桌台管理系統測試腳本

```javascript
// tests/table-management.test.ts
import { test, expect } from '@playwright/test';

test.describe('桌台管理系統', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5174');
    await page.click('[data-testid="table-management-tab"]');
  });

  test('桌台狀態循環測試', async ({ page }) => {
    // 1. 驗證桌台初始狀態為 "Available"
    const table1 = page.locator('[data-testid="table-1"]');
    await expect(table1).toContainText('Available');

    // 2. 模擬顧客入座 - 狀態變更為 "Seated"
    await table1.click();
    await page.click('[data-testid="seat-customers-btn"]');
    await expect(table1).toContainText('Seated');

    // 3. 開始點餐 - 狀態變更為 "Dining"
    await page.click('[data-testid="start-ordering-btn"]');
    await expect(table1).toContainText('Dining');

    // 4. 請求結帳 - 狀態變更為 "Payment-Pending"
    await page.click('[data-testid="request-payment-btn"]');
    await expect(table1).toContainText('Payment-Pending');

    // 5. 完成支付 - 狀態變更為 "Cleaning"
    await page.click('[data-testid="complete-payment-btn"]');
    await expect(table1).toContainText('Cleaning');

    // 6. 完成清潔 - 狀態回復為 "Available"
    await page.click('[data-testid="complete-cleaning-btn"]');
    await expect(table1).toContainText('Available');
  });

  test('桌台篩選功能測試', async ({ page }) => {
    // 測試狀態篩選器
    await page.click('[data-testid="filter-available"]');
    const availableTables = page.locator('[data-testid*="table-"][data-status="Available"]');
    await expect(availableTables).toHaveCount(await page.locator('[data-status="Available"]').count());

    await page.click('[data-testid="filter-occupied"]');
    const occupiedTables = page.locator('[data-testid*="table-"][data-status="Dining"]');
    await expect(occupiedTables).toHaveCount(await page.locator('[data-status="Dining"]').count());
  });

  test('桌台容量分配測試', async ({ page }) => {
    // 測試根據人數自動分配合適桌位
    await page.click('[data-testid="auto-assign-btn"]');
    await page.fill('[data-testid="customer-count-input"]', '2');
    await page.click('[data-testid="confirm-assignment"]');
    
    // 驗證系統選擇了合適容量的桌位
    const assignedTable = page.locator('[data-testid="assigned-table"]');
    const capacity = await assignedTable.getAttribute('data-capacity');
    expect(parseInt(capacity)).toBeGreaterThanOrEqual(2);
  });
});
```

### 2. POS 點餐系統測試腳本

```javascript
// tests/pos-ordering.test.ts
import { test, expect } from '@playwright/test';

test.describe('POS 點餐系統', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5174');
    await page.click('[data-testid="ordering-tab"]');
  });

  test('完整點餐流程測試', async ({ page }) => {
    // 1. 選擇桌位
    await page.click('[data-testid="table-selector"]');
    await page.click('[data-testid="table-option-1"]');

    // 2. 選擇菜品分類
    await page.click('[data-testid="category-main-dishes"]');

    // 3. 添加菜品到購物車
    await page.click('[data-testid="product-beef-noodles"]');
    await page.fill('[data-testid="quantity-input"]', '2');
    await page.click('[data-testid="add-to-cart-btn"]');

    // 4. 驗證購物車內容
    const cartItem = page.locator('[data-testid="cart-item-beef-noodles"]');
    await expect(cartItem).toContainText('牛肉麵');
    await expect(cartItem).toContainText('x2');

    // 5. 添加客製化選項
    await page.click('[data-testid="product-bubble-tea"]');
    await page.click('[data-testid="customization-less-sugar"]');
    await page.click('[data-testid="add-to-cart-btn"]');

    // 6. 填寫訂單資訊
    await page.fill('[data-testid="customer-count"]', '3');
    await page.fill('[data-testid="order-notes"]', '不要太辣');

    // 7. 確認並送出訂單
    await page.click('[data-testid="confirm-order-btn"]');
    
    // 8. 驗證訂單建立成功
    await expect(page.locator('[data-testid="order-success-message"]')).toBeVisible();
    
    // 9. 驗證桌位狀態更新
    await page.click('[data-testid="table-management-tab"]');
    const table1 = page.locator('[data-testid="table-1"]');
    await expect(table1).toContainText('Dining');
  });

  test('套餐選擇測試', async ({ page }) => {
    // 測試套餐的複雜選擇邏輯
    await page.click('[data-testid="table-selector"]');
    await page.click('[data-testid="table-option-2"]');

    await page.click('[data-testid="category-combos"]');
    await page.click('[data-testid="combo-set-a"]');

    // 選擇主餐
    await page.click('[data-testid="main-dish-chicken-rice"]');
    
    // 選擇飲料
    await page.click('[data-testid="drink-iced-tea"]');
    
    // 選擇湯品
    await page.click('[data-testid="soup-corn-soup"]');

    await page.click('[data-testid="add-combo-to-cart"]');

    // 驗證套餐在購物車中正確顯示
    const comboItem = page.locator('[data-testid="cart-item-combo-set-a"]');
    await expect(comboItem).toContainText('雞肉飯');
    await expect(comboItem).toContainText('冰紅茶');
    await expect(comboItem).toContainText('玉米湯');
  });

  test('購物車操作測試', async ({ page }) => {
    // 添加多個商品
    await page.click('[data-testid="table-selector"]');
    await page.click('[data-testid="table-option-1"]');

    await page.click('[data-testid="product-beef-noodles"]');
    await page.click('[data-testid="add-to-cart-btn"]');

    await page.click('[data-testid="product-fried-rice"]');
    await page.fill('[data-testid="quantity-input"]', '2');
    await page.click('[data-testid="add-to-cart-btn"]');

    // 測試修改數量
    await page.click('[data-testid="cart-item-increase-beef-noodles"]');
    const beefNoodlesQty = page.locator('[data-testid="cart-item-qty-beef-noodles"]');
    await expect(beefNoodlesQty).toContainText('2');

    // 測試移除商品
    await page.click('[data-testid="cart-item-remove-fried-rice"]');
    await expect(page.locator('[data-testid="cart-item-fried-rice"]')).not.toBeVisible();

    // 測試清空購物車
    await page.click('[data-testid="clear-cart-btn"]');
    await expect(page.locator('[data-testid="empty-cart-message"]')).toBeVisible();
  });
});
```

### 3. 訂單管理系統測試腳本

```javascript
// tests/order-management.test.ts
import { test, expect } from '@playwright/test';

test.describe('訂單管理系統', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5174');
    // 先建立一個測試訂單
    await createTestOrder(page);
    await page.click('[data-testid="orders-tab"]');
  });

  test('訂單狀態更新測試', async ({ page }) => {
    // 1. 驗證新訂單狀態為 "Pending"
    const order = page.locator('[data-testid="order-1"]');
    await expect(order).toContainText('Pending');

    // 2. 更新為 "Preparing"
    await order.click();
    await page.click('[data-testid="status-preparing-btn"]');
    await expect(order).toContainText('Preparing');

    // 3. 更新為 "Ready"
    await page.click('[data-testid="status-ready-btn"]');
    await expect(order).toContainText('Ready');

    // 4. 更新為 "Served"
    await page.click('[data-testid="status-served-btn"]');
    await expect(order).toContainText('Served');
  });

  test('訂單詳情檢視測試', async ({ page }) => {
    const order = page.locator('[data-testid="order-1"]');
    await order.click();

    // 驗證訂單詳情模態框
    const modal = page.locator('[data-testid="order-detail-modal"]');
    await expect(modal).toBeVisible();

    // 驗證訂單資訊
    await expect(modal).toContainText('桌號');
    await expect(modal).toContainText('客人數量');
    await expect(modal).toContainText('訂單時間');
    await expect(modal).toContainText('總金額');

    // 驗證訂單項目列表
    const orderItems = modal.locator('[data-testid="order-items"]');
    await expect(orderItems).toBeVisible();
  });

  test('訂單篩選功能測試', async ({ page }) => {
    // 按狀態篩選
    await page.click('[data-testid="filter-pending"]');
    const pendingOrders = page.locator('[data-testid*="order-"][data-status="Pending"]');
    expect(await pendingOrders.count()).toBeGreaterThan(0);

    await page.click('[data-testid="filter-preparing"]');
    const preparingOrders = page.locator('[data-testid*="order-"][data-status="Preparing"]');
    expect(await preparingOrders.count()).toBeGreaterThanOrEqual(0);

    // 按桌號篩選
    await page.fill('[data-testid="table-filter-input"]', '1');
    const table1Orders = page.locator('[data-testid*="order-"][data-table="1"]');
    expect(await table1Orders.count()).toBeGreaterThanOrEqual(0);
  });

  test('訂單時間排序測試', async ({ page }) => {
    // 測試按時間排序
    await page.click('[data-testid="sort-by-time"]');
    
    const orderTimes = await page.locator('[data-testid*="order-time-"]').allTextContents();
    const sortedTimes = [...orderTimes].sort();
    expect(orderTimes).toEqual(sortedTimes);
  });
});

async function createTestOrder(page) {
  await page.click('[data-testid="ordering-tab"]');
  await page.click('[data-testid="table-selector"]');
  await page.click('[data-testid="table-option-1"]');
  await page.click('[data-testid="product-beef-noodles"]');
  await page.click('[data-testid="add-to-cart-btn"]');
  await page.fill('[data-testid="customer-count"]', '2');
  await page.click('[data-testid="confirm-order-btn"]');
  await page.waitForSelector('[data-testid="order-success-message"]');
}
```

### 4. 結帳系統測試腳本

```javascript
// tests/checkout-system.test.ts
import { test, expect } from '@playwright/test';

test.describe('結帳系統', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5174');
    // 建立測試訂單並完成到可結帳狀態
    await prepareOrderForCheckout(page);
    await page.click('[data-testid="checkout-tab"]');
  });

  test('現金支付測試', async ({ page }) => {
    // 1. 選擇要結帳的桌位
    await page.click('[data-testid="checkout-table-1"]');

    // 2. 驗證訂單明細顯示
    const orderSummary = page.locator('[data-testid="order-summary"]');
    await expect(orderSummary).toBeVisible();

    // 3. 選擇現金支付
    await page.click('[data-testid="payment-cash"]');

    // 4. 輸入收款金額
    await page.click('[data-testid="amount-500"]'); // 快速金額按鈕
    
    // 5. 驗證找零計算
    const changeAmount = page.locator('[data-testid="change-amount"]');
    await expect(changeAmount).toBeVisible();
    const change = await changeAmount.textContent();
    expect(parseInt(change)).toBeGreaterThan(0);

    // 6. 完成支付
    await page.click('[data-testid="complete-payment-btn"]');

    // 7. 驗證支付成功
    await expect(page.locator('[data-testid="payment-success-message"]')).toBeVisible();

    // 8. 驗證桌位狀態更新為 "Cleaning"
    await page.click('[data-testid="table-management-tab"]');
    const table1 = page.locator('[data-testid="table-1"]');
    await expect(table1).toContainText('Cleaning');
  });

  test('行動支付測試', async ({ page }) => {
    await page.click('[data-testid="checkout-table-2"]');
    
    // 選擇行動支付
    await page.click('[data-testid="payment-mobile"]');

    // 驗證服務費計算（5%）
    const serviceFee = page.locator('[data-testid="service-fee"]');
    await expect(serviceFee).toBeVisible();
    
    const originalAmount = await page.locator('[data-testid="original-amount"]').textContent();
    const totalAmount = await page.locator('[data-testid="total-amount"]').textContent();
    const expectedFee = Math.round(parseInt(originalAmount) * 0.05);
    const actualTotal = parseInt(totalAmount);
    expect(actualTotal).toBe(parseInt(originalAmount) + expectedFee);

    // 模擬支付成功
    await page.click('[data-testid="confirm-mobile-payment"]');
    await expect(page.locator('[data-testid="payment-success-message"]')).toBeVisible();
  });

  test('支付方式切換測試', async ({ page }) => {
    await page.click('[data-testid="checkout-table-1"]');

    // 測試在現金和行動支付間切換
    await page.click('[data-testid="payment-cash"]');
    await expect(page.locator('[data-testid="cash-input-section"]')).toBeVisible();

    await page.click('[data-testid="payment-mobile"]');
    await expect(page.locator('[data-testid="mobile-payment-section"]')).toBeVisible();
    await expect(page.locator('[data-testid="cash-input-section"]')).not.toBeVisible();
  });

  test('收據生成測試', async ({ page }) => {
    await page.click('[data-testid="checkout-table-1"]');
    await page.click('[data-testid="payment-cash"]');
    await page.click('[data-testid="amount-500"]');
    await page.click('[data-testid="complete-payment-btn"]');

    // 驗證收據模態框
    const receiptModal = page.locator('[data-testid="receipt-modal"]');
    await expect(receiptModal).toBeVisible();

    // 驗證收據內容
    await expect(receiptModal).toContainText('收據');
    await expect(receiptModal).toContainText('桌號');
    await expect(receiptModal).toContainText('金額');
    await expect(receiptModal).toContainText('支付方式');
    await expect(receiptModal).toContainText('交易時間');

    // 測試列印功能
    await page.click('[data-testid="print-receipt-btn"]');
    // 驗證列印對話框出現（實際環境中）
  });
});

async function prepareOrderForCheckout(page) {
  // 建立訂單
  await page.click('[data-testid="ordering-tab"]');
  await page.click('[data-testid="table-selector"]');
  await page.click('[data-testid="table-option-1"]');
  await page.click('[data-testid="product-beef-noodles"]');
  await page.click('[data-testid="add-to-cart-btn"]');
  await page.fill('[data-testid="customer-count"]', '2');
  await page.click('[data-testid="confirm-order-btn"]');

  // 更新訂單狀態到可結帳
  await page.click('[data-testid="orders-tab"]');
  const order = page.locator('[data-testid="order-1"]');
  await order.click();
  await page.click('[data-testid="status-served-btn"]');

  // 設置桌位為等待結帳狀態
  await page.click('[data-testid="table-management-tab"]');
  const table1 = page.locator('[data-testid="table-1"]');
  await table1.click();
  await page.click('[data-testid="request-payment-btn"]');
}
```

## 🔍 整合測試流程驗證

### 完整業務流程端到端測試

```javascript
// tests/end-to-end-workflow.test.ts
import { test, expect } from '@playwright/test';

test.describe('完整餐廳營運流程', () => {
  test('從入座到結帳的完整流程', async ({ page }) => {
    await page.goto('http://localhost:5174');

    // === 階段1: 接待與帶位 ===
    await page.click('[data-testid="table-management-tab"]');
    
    // 選擇空閒桌位
    const table1 = page.locator('[data-testid="table-1"]');
    await expect(table1).toContainText('Available');
    
    // 安排客人入座
    await table1.click();
    await page.click('[data-testid="seat-customers-btn"]');
    await page.fill('[data-testid="customer-count-input"]', '3');
    await page.click('[data-testid="confirm-seating"]');
    
    // 驗證桌位狀態變更
    await expect(table1).toContainText('Seated');

    // === 階段2: 點餐服務 ===
    await page.click('[data-testid="ordering-tab"]');
    
    // 選擇桌位開始點餐
    await page.click('[data-testid="table-selector"]');
    await page.click('[data-testid="table-option-1"]');
    
    // 添加主餐
    await page.click('[data-testid="category-main-dishes"]');
    await page.click('[data-testid="product-beef-noodles"]');
    await page.fill('[data-testid="quantity-input"]', '2');
    await page.click('[data-testid="add-to-cart-btn"]');
    
    // 添加飲料
    await page.click('[data-testid="category-drinks"]');
    await page.click('[data-testid="product-bubble-tea"]');
    await page.click('[data-testid="customization-less-sugar"]');
    await page.click('[data-testid="add-to-cart-btn"]');
    
    // 填寫訂單資訊並送出
    await page.fill('[data-testid="order-notes"]', '一份不要辣');
    await page.click('[data-testid="confirm-order-btn"]');
    
    // 驗證桌位狀態更新為用餐中
    await page.click('[data-testid="table-management-tab"]');
    await expect(table1).toContainText('Dining');

    // === 階段3: 廚房作業流程 ===
    await page.click('[data-testid="orders-tab"]');
    
    // 確認訂單出現在訂單列表
    const newOrder = page.locator('[data-testid*="order-"]:first-child');
    await expect(newOrder).toContainText('Pending');
    
    // 模擬廚房接單
    await newOrder.click();
    await page.click('[data-testid="status-preparing-btn"]');
    await expect(newOrder).toContainText('Preparing');
    
    // 模擬出餐完成
    await page.click('[data-testid="status-ready-btn"]');
    await expect(newOrder).toContainText('Ready');
    
    // 模擬送餐完成
    await page.click('[data-testid="status-served-btn"]');
    await expect(newOrder).toContainText('Served');

    // === 階段4: 結帳與翻桌 ===
    // 設置桌位為等待結帳
    await page.click('[data-testid="table-management-tab"]');
    await table1.click();
    await page.click('[data-testid="request-payment-btn"]');
    await expect(table1).toContainText('Payment-Pending');
    
    // 進行結帐
    await page.click('[data-testid="checkout-tab"]');
    await page.click('[data-testid="checkout-table-1"]');
    
    // 驗證訂單明細
    const orderSummary = page.locator('[data-testid="order-summary"]');
    await expect(orderSummary).toContainText('牛肉麵');
    await expect(orderSummary).toContainText('x2');
    await expect(orderSummary).toContainText('珍珠奶茶');
    
    // 選擇現金支付
    await page.click('[data-testid="payment-cash"]');
    await page.click('[data-testid="amount-500"]');
    await page.click('[data-testid="complete-payment-btn"]');
    
    // 驗證支付成功與收據
    await expect(page.locator('[data-testid="payment-success-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="receipt-modal"]')).toBeVisible();
    
    // 關閉收據，檢查桌位狀態
    await page.click('[data-testid="close-receipt"]');
    await page.click('[data-testid="table-management-tab"]');
    await expect(table1).toContainText('Cleaning');
    
    // 完成清潔，重置桌位
    await table1.click();
    await page.click('[data-testid="complete-cleaning-btn"]');
    await expect(table1).toContainText('Available');

    // === 驗證數據一致性 ===
    // 檢查訂單最終狀態
    await page.click('[data-testid="orders-tab"]');
    await expect(newOrder).toContainText('Completed');
    
    console.log('✅ 完整餐廳營運流程測試通過');
  });
});
```

## 📊 執行測試的命令腳本

### Package.json 測試腳本配置

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:debug": "playwright test --debug",
    "test:all": "npm run test:run && npm run test:e2e"
  }
}
```

### 測試執行指令

```bash
# 1. 單元測試與組件測試
npm run test

# 2. 測試覆蓋率報告
npm run test:coverage

# 3. 端到端測試
npm run test:e2e

# 4. 完整測試套件
npm run test:all

# 5. 開發模式下的測試監控
npm run test -- --watch

# 6. 特定測試文件
npx playwright test tests/table-management.test.ts

# 7. 調試模式測試
npm run test:e2e:debug
```

## 🎯 關鍵效能指標(KPI)測試

### 1. 響應時間測試
- 頁面載入時間 < 2秒
- 桌位狀態更新延遲 < 500ms
- 訂單提交回應時間 < 1秒

### 2. 並發處理測試
- 模擬多個桌位同時點餐
- 測試系統在高負載下的穩定性
- 驗證數據庫鎖定機制

### 3. 錯誤恢復測試
- 網路連線中斷恢復
- 瀏覽器刷新後狀態保持
- 異常操作的錯誤處理

## 🔧 持續整合(CI)設置建議

### GitHub Actions 工作流程

```yaml
name: TanaPOS V4-AI 測試流程

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: 設置 Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: 安裝依賴
      run: npm ci
    
    - name: 運行單元測試
      run: npm run test:run
    
    - name: 安裝 Playwright
      run: npx playwright install
    
    - name: 運行端到端測試
      run: npm run test:e2e
      env:
        VITE_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
        VITE_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
    
    - name: 上傳測試報告
      uses: actions/upload-artifact@v3
      if: always()
      with:
        name: test-results
        path: test-results/
```

## 📝 測試報告與監控

### 自動化測試報告內容
1. **功能測試結果**: 通過/失敗的測試案例統計
2. **效能測試數據**: 響應時間與吞吐量指標
3. **錯誤日誌分析**: 失敗測試的詳細錯誤訊息
4. **覆蓋率分析**: 代碼覆蓋率與未測試的功能點
5. **趨勢分析**: 測試品質的歷史趨勢

### 監控警報設置
- 測試失敗率超過5%時發送警報
- 平均響應時間超過2秒時通知
- 代碼覆蓋率低於80%時提醒

---

**建立時間**: 2025年8月4日  
**目標環境**: TanaPOS V4-AI (localhost:5174)  
**負責團隊**: TanaPOS 開發團隊
