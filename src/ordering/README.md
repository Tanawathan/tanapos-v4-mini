# 新版點餐系統 (Ordering Module)

該模組為重構後的點餐流程：
- 支援單品 / 套餐 (共用選擇)
- 響應式：桌機 / 平板 / 手機
- 狀態持久化 (localStorage)
- 送單/列印邏輯後續接入現有 service

目錄結構：
```
ordering/
  state/orderingStore.ts   # cart + combo 草稿 + context
  components/OrderingLayout.tsx
  components/ComboModal.tsx
  hooks/useProducts.ts
```

後續待辦：
1. 接真實產品 / 套餐 / 桌台 / 預約資料來源。
2. 建立 orderingService.createOrder -> Supabase inserts。
3. 與 printer-store 整合訂單列印。
4. 加入錯誤/離線/重試策略。
5. 套餐規則驗證 (min/max) 與加價計算。
6. UI：商品卡、數量調整、備註編輯、移除、金額 recalculation。
7. Checkout 流程與成功頁。
```
