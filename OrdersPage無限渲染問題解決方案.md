# OrdersPage 無限渲染問題分析與解決方案

## 問題分析

### 根本原因
OrdersPage 組件出現無限渲染的主要原因是：

1. **useEffect 依賴項問題**
   ```tsx
   useEffect(() => {
     loadOrders()
   }, [loadOrders])
   ```
   
   `loadOrders` 函數在每次 Zustand store 重新渲染時都會是一個新的函數引用，導致 `useEffect` 認為依賴項改變了，從而觸發重新執行。

2. **Zustand store 函數引用問題**
   - Zustand store 中的函數在每次 store 更新時都會重新創建
   - 這導致依賴這些函數的 `useEffect` 不斷觸發
   - 每次 `loadOrders` 執行後更新 state，又觸發新的渲染循環

3. **Store 結構問題**
   - Store 中的 `loadOrders` 函數每次調用都會 `set({ loading: true })` 然後 `set({ loading: false })`
   - 這些狀態變化會觸發所有使用該 store 的組件重新渲染
   - 重新渲染導致 `loadOrders` 函數引用改變，再次觸發 `useEffect`

## 解決方案

### 方案 1：使用 useCallback 穩定函數引用 (推薦)

```tsx
import { useState, useEffect, useCallback } from 'react'

export default function OrdersPage({ onBack }: OrdersPageProps) {
  const { 
    orders, 
    orderItems, 
    loadOrders, 
    updateOrderStatus,
    loading 
  } = usePOSStore()

  // 使用 useCallback 穩定 loadOrders 的調用
  const stableLoadOrders = useCallback(() => {
    loadOrders()
  }, [])

  useEffect(() => {
    stableLoadOrders()
  }, [stableLoadOrders])
  
  // 其餘代碼保持不變...
}
```

### 方案 2：移除 loadOrders 依賴項

```tsx
useEffect(() => {
  loadOrders()
}, []) // 空依賴數組，只在組件掛載時執行一次
```

### 方案 3：使用 Zustand 的 selector 模式 (最佳實踐)

```tsx
import { useEffect } from 'react'

export default function OrdersPage({ onBack }: OrdersPageProps) {
  // 使用 selector 分別獲取數據和函數
  const orders = usePOSStore(state => state.orders)
  const orderItems = usePOSStore(state => state.orderItems)
  const loading = usePOSStore(state => state.loading)
  const loadOrders = usePOSStore(state => state.loadOrders)
  const updateOrderStatus = usePOSStore(state => state.updateOrderStatus)

  useEffect(() => {
    loadOrders()
  }, []) // 移除依賴項
  
  // 其餘代碼保持不變...
}
```

### 方案 4：修改 Store 結構 (長期解決方案)

在 store 中添加一個標記來避免重複載入：

```typescript
interface POSStore {
  // ... 其他屬性
  ordersLoaded: boolean
  loadOrders: () => Promise<void>
}

export const usePOSStore = create<POSStore>((set, get) => ({
  // ... 其他狀態
  ordersLoaded: false,
  
  loadOrders: async () => {
    const state = get()
    if (state.ordersLoaded && state.orders.length > 0) {
      return // 已經載入過，直接返回
    }
    
    set({ loading: true, error: null })
    try {
      // ... 載入邏輯
      set({ 
        orders: processedOrders, 
        orderItems: processedOrderItems,
        ordersLoaded: true 
      })
    } catch (error) {
      set({ error: (error as Error).message })
    } finally {
      set({ loading: false })
    }
  }
}))
```

## 推薦解決順序

1. **立即修復**：使用方案 2（移除依賴項）快速解決無限渲染
2. **短期優化**：實施方案 3（selector 模式）提升性能
3. **長期改善**：考慮方案 4（store 結構優化）避免不必要的重複載入

## 附加建議

### 1. 添加錯誤邊界
```tsx
const [hasError, setHasError] = useState(false)

useEffect(() => {
  const loadData = async () => {
    try {
      await loadOrders()
    } catch (error) {
      setHasError(true)
      console.error('載入訂單失敗:', error)
    }
  }
  
  loadData()
}, [])
```

### 2. 添加載入狀態檢查
```tsx
useEffect(() => {
  if (!loading && orders.length === 0) {
    loadOrders()
  }
}, [])
```

### 3. 使用 React.memo 優化組件
```tsx
import React from 'react'

const OrdersPage = React.memo(({ onBack }: OrdersPageProps) => {
  // 組件邏輯...
})
```

## 測試驗證

修復後請驗證：
1. 頁面載入時 `loadOrders` 只被調用一次
2. 控制台沒有無限循環的日誌
3. 瀏覽器開發者工具的 React DevTools 中組件不會不斷重新渲染
4. 訂單數據正常顯示
5. 狀態更新功能正常工作
