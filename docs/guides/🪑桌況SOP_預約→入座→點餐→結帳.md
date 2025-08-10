# 🪑 桌況 SOP（預約 → 入座 → 點餐 → 結帳）

本文件說明目前系統在「/tables 桌台管理」頁面到點餐與結帳的資料流，並提出可行的優化建議。

## 1) 畫面與資料來源
- 頁面：`/tables` → `src/components/TableManagementPage.tsx`
- 主要資料表：
  - `tables`：桌台狀態（available/occupied/reserved/cleaning/maintenance）
  - `table_reservations`：預約（本頁載入狀態：confirmed、seated）
  - `orders`、`order_items`：未結帳訂單顯示與詳情
- 輔助狀態（Zustand store `usePOSStore`）：
  - `tables`, `orders`, `orderItems`, `updateTableStatus`, `orderingInfo`, `selectedTable`

## 2) 預約顯示（/tables）
- 每張桌牌會嘗試關聯「當日該桌」的預約（`table_reservations` where `table_id = table.id` 且 `status in ('confirmed','seated')`）。
- 若有預約：顯示顧客姓名、人数、時間與備註；點擊卡片開啟「預約詳情」模態框。

## 3) 入座（Seat）
- 動作位置：預約詳情模態框「✅ 已入座」
- 後端更新：
  - `table_reservations`: `status = 'seated'`, `seated_at = now()`
  - `tables`: 若該預約已有 `table_id` → 將該桌 `status = 'occupied'`
- 前端狀態：重新載入 `tables` 與 `reservations`；模態框仍可用「開始點餐」。

備註：在預約頁（`EnhancedReservationPage.tsx`）的「入座」快速操作，已改為呼叫 `ReservationService.updateReservationStatus('seated')`，建議桌台頁亦統一走 Service（見改善建議）。

## 4) 開始點餐（Start Ordering）
- 動作位置：預約詳情模態框顯示「🍽️ 開始點餐」（當狀態為 `seated`）。
- 邏輯：
  - 由預約 `table_id` 找到對應 `table`，將以下資訊寫入 Store：
    - `selectedTable = table.id`
    - `orderingInfo = { tableNumber, tableName, partySize, customerName, reservationId }`
  - 關閉模態框；目前程式有註解位置「可觸發導航到點餐頁」，尚未自動導向。
- 導航建議：自動 `navigate('/ordering')`，點餐頁讀取 `orderingInfo` 以顯示顧客與桌台資訊。

## 5) 點餐頁（/ordering）自動帶入
- 來源：`src/components/OrderingPage.tsx`
- 頁首區顯示 `orderingInfo`（桌號、桌名、顧客名與人數）。
- 使用者挑品入購物車，之後建立訂單：
  - API：`store.createOrder()` 或一次性 `store.createOrderWithTableUpdate(orderData)`
  - `createOrderWithTableUpdate` 會：
    - 以桌號生成內用訂單編號
    - 插入 `orders` 與 `order_items`
    - 將 `tables.status = 'occupied'`（再保險）
    - 清空購物車、重置 `selectedTable`

## 6) 結帳（Checkout）
- API：`store.processCheckout(tableId, orderId, paymentData)`
- 後端更新：
  - `orders`: `status = 'completed'`, `payment_status = 'paid'`, 記錄付款資訊至 `payments`
  - `tables`: `status = 'cleaning'`, `current_session_id = null`
- 後續 SOP：打掃完成後，操作「設為可用」→ `tables.status = 'available'`

---

# ✅ 邏輯斷點與風險點
- 預約未綁 `table_id` 時即入座：目前僅在 `table_id` 存在時才同步桌況，應提醒先分配桌台。
- 桌台頁入座與預約頁入座使用不同路徑：一處直打 Supabase，一處走 Service，可能導致行為不一致。
- 「開始點餐」目前只設置 store，未自動導頁到 `/ordering`，造成人工作業一步。
- 結帳後只更新桌況與訂單，預約狀態若仍為 `seated` 未自動標記完成/關閉，需一致化。

---

# 🔧 建議的優化方案

## A. 統一狀態流（以 Service 為單一入口）
- 建立 `ReservationService.seatReservation(reservationId)`：在一個交易中：
  1) `table_reservations`: `status='seated'`, `seated_at=now()`
  2) 若有 `table_id` → `tables.status='occupied'`
- `TableManagementPage` 與 `EnhancedReservationPage` 都呼叫此 Service，避免重複邏輯。

## B. 開始點餐一鍵導引與資料連結
- 在 `handleStartOrdering` 成功後：
  - 若預約尚未 `seated`，先呼叫 A 流程確保狀態一致。
  - `navigate('/ordering')`；在 `OrderingPage`：
    - 自動帶入 `orderingInfo`
    - 建議在建立訂單時將 `reservation_id` 一併寫入 `orders`（新增欄位或沿用現有）以便追溯。

## C. 結帳關聯預約收斂
- `processCheckout` 完成後：
  - 若 `currentOrder` 綁有 `reservation_id`：將該預約 `status = 'completed'` 或新增欄位 `closed_at = now()`。
  - 桌況已設為 `cleaning`，完成清潔後再設為 `available`。

## D. 未現身/取消時的釋桌與資料一致性
- 在預約頁與桌台頁對 `cancelled`、`no_show`：
  - 清空該預約的 `table_id`（避免殘留關聯）
  - 若該桌 `status='reserved'` → 設回 `available`

## E. 對 table_sessions 的建議
- 目前 `current_session_id` 未實際串 `table_sessions`。
- 建議在入座時建立 `table_sessions`：
  - 欄位：`id`, `table_id`, `reservation_id`, `customer_name`, `party_size`, `seated_at`, `closed_at`
  - 在建立訂單時關聯 `session_id`，結帳時填 `closed_at`，資料血緣清晰。

## F. 使用者體驗
- 重要操作（入座、取消、未現身、開始點餐、結帳）加上 toast 與 loading/disabled 狀態。
- 在桌台卡片上直觀顯示：下一筆預約倒數時間、已入座時長、未結帳訂單金額合計。
- 在 `/tables` 支援鍵盤快速操作（例如數字鍵選桌、S=入座、O=點餐、C=取消）。

---

# ✅ 成功準則（驗收）
- 從「預約入座」到「點餐」再到「結帳」，每步驟都更新對應資料表且頁面即時反映。
- 任一入口（預約頁或桌台頁）做入座，另一頁看到的資料完全一致。
- 點餐自動帶入顧客與桌台資訊，建立的訂單可追溯到預約/桌台/會話。
- 結帳後桌況轉為 `cleaning`，清潔完可設為 `available`，不遺留掛單或占用。
