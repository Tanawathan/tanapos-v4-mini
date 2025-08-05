# 🍳 KDS 廚房顯示系統 - 真實數據串接 TODO 清單

## 📊 數據分析結果

### 數據庫結構分析
- **Orders 表**: 41 個欄位，包含完整的訂單生命週期
- **Order Items 表**: 24 個欄位，包含餐點狀態和時間追蹤
- **現有數據**: 15 筆訂單 (2 筆 pending, 13 筆 completed)

## 🚨 關鍵問題與待修復功能

### 1. **數據源問題 (高優先級)**
- [ ] **替換模擬數據**: 目前 `kds-store.ts` 使用 `mockOrders`
- [ ] **Supabase 認證**: 需要使用管理者權限讀取所有餐廳訂單
- [ ] **實時數據同步**: 實現 Supabase realtime subscription

### 2. **數據結構不匹配 (高優先級)**
- [ ] **KDSOrder 介面更新**: 對齊實際數據庫欄位
  - 缺少: `order_type`, `party_size`, `ordered_at`, `confirmed_at` 等
  - 時間欄位: `preparation_started_at`, `ready_at`, `served_at`
  - AI 功能: `ai_estimated_prep_time`, `ai_recommendations`
- [ ] **KDSMenuItem 介面更新**: 對齊 order_items 表
  - 添加: `kitchen_station`, `priority_level`, `quality_checked`
  - 時間追蹤: `preparation_started_at`, `ready_at`, `served_at`

### 3. **核心功能實現 (高優先級)**

#### A. 訂單狀態管理
```typescript
// 目前狀態: 使用模擬數據
// 需要實現:
- [ ] updateOrderStatus() - 更新訂單狀態到數據庫
- [ ] updateMenuItemStatus() - 更新餐點項目狀態
- [ ] 狀態變更時自動更新時間戳記
  - confirmed_at, preparation_started_at, ready_at, served_at
```

#### B. 實時數據載入
```typescript
// 目前狀態: fetchOrders() 使用 setTimeout 模擬
// 需要實現:
- [ ] 真實 Supabase 查詢
- [ ] 多餐廳數據過濾 (基於當前用戶權限)
- [ ] 訂單項目關聯查詢 (join order_items)
- [ ] 實時訂閱 (realtime subscription)
```

### 4. **用戶介面問題 (中優先級)**

#### A. 數據顯示錯誤
- [ ] **時間顯示**: 目前顯示模擬時間，需要使用真實 `ordered_at`
- [ ] **桌號顯示**: 確保 `table_number` 正確顯示
- [ ] **餐點項目**: 顯示真實的產品名稱和數量

#### B. 狀態操作
- [ ] **訂單確認**: 實現 pending → confirmed 狀態切換
- [ ] **開始製作**: confirmed → preparing + 記錄 preparation_started_at
- [ ] **完成製作**: preparing → ready + 記錄 ready_at
- [ ] **送餐完成**: ready → served + 記錄 served_at

### 5. **進階功能 (低優先級)**

#### A. AI 功能集成
- [ ] **預估時間**: 使用 `ai_estimated_prep_time` 
- [ ] **效率評分**: 顯示 `ai_efficiency_score`
- [ ] **智能建議**: 實現 `ai_recommendations` 功能

#### B. 廚房工作流程
- [ ] **廚房分區**: 使用 `kitchen_station` 分配工作
- [ ] **優先級管理**: 基於 `priority_level` 排序
- [ ] **品質檢查**: 實現 `quality_checked` 功能

## 🔧 技術實現計劃

### Phase 1: 基礎數據串接 (第一周)
1. **修復 kds-store.ts**
   - 實現真實的 fetchOrders()
   - 添加 Supabase 認證
   - 更新介面定義

2. **測試真實數據流**
   - 確保訂單正確載入
   - 驗證狀態更新功能

### Phase 2: 核心功能實現 (第二周)
1. **狀態管理系統**
   - 實現完整的訂單生命週期
   - 添加時間戳記追蹤

2. **實時更新**
   - Supabase realtime subscription
   - 自動刷新機制

### Phase 3: 用戶體驗優化 (第三周)
1. **界面完善**
   - 真實數據顯示
   - 互動功能測試

2. **性能優化**
   - 數據載入優化
   - 狀態更新效能

## 🎯 立即開始項目

### 優先修復清單:
1. ✅ **數據庫結構分析** - 已完成
2. 🔄 **更新 KDS 類型定義** - 進行中
3. 🔄 **實現真實 fetchOrders()** - 進行中  
4. 🔄 **修復狀態更新功能** - 待開始
5. 🔄 **測試完整工作流程** - 待開始

---

**總結**: KDS 系統目前有完整的 UI 框架，但核心數據邏輯仍使用模擬數據。需要系統性地替換為真實 Supabase 數據，並確保所有狀態管理功能正常運作。
