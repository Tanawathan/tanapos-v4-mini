# KDS 系統：功能設計與頁面佈局

## 📋 系統概述

KDS (Kitchen Display System) 廚房顯示系統是專為餐廳廚房設計的訂單管理系統，用於接收、顯示和管理來自 POS 系統的訂單信息。

## 🎯 核心功能

### 1. 訂單接收與顯示
- **即時訂單接收**：從 POS 系統即時接收新訂單
- **訂單狀態管理**：待處理 → 確認中 → 製作中 → 已完成 → 已送出
- **訂單優先級**：根據下單時間和訂單類型自動排序

### 2. 折疊式卡片系統 ⭐
- **智能收縮顯示**：預設顯示訂單摘要，節省畫面空間
- **快速展開**：點擊卡片或 ▼ 圖示快速展開查看詳情
- **批量操作**：支援全部展開/收縮功能
- **狀態指示器**：收縮狀態下仍可清楚看到進度和狀態
- **快速操作**：收縮狀態下可直接進行常用操作

### 3. 餐點分類分組
- **智能分組顯示**：按前菜、主餐、飲品、單點、加點、甜點分組
- **可折疊分類**：每個分類可獨立折疊，專注查看特定類別
- **進度追蹤**：每個分類顯示完成進度 (如：2/5 項完成)
- **優先級排序**：根據製作時間和重要性排序

### 4. 套餐管理
- **套餐餐點分組**：將套餐內的餐點按類別分組顯示
- **套餐備註功能**：顯示套餐特殊要求和備註
- **套餐完整度追蹤**：確保套餐內所有餐點完成
- **套餐選擇顯示**：清楚顯示客戶的套餐選擇項目

### 5. Todo 功能
- **餐點製作狀態**：待處理 → 確認 → 製作中 → 已完成
- **餐點品相檢查**：品質檢查清單
- **製作時間追蹤**：記錄每道餐點的製作時間
- **一鍵操作**：快速標記完成或開始製作

### 6. 卡片製作順序
- **正序模式**：按下單時間順序顯示
- **逆序模式**：最新訂單優先顯示
- **自定義排序**：按優先級、桌號、餐點類型排序
- **拖拽排序**：支援手動拖拽調整訂單順序

## 🎨 頁面佈局設計

### 主要區域劃分

```
┌─────────────────────────────────────────────────────────────┐
│                    KDS 系統標題欄                            │
│  📊 統計面板  |  🔄 排序控制  |  ⚙️ 設定  |  🔔 通知        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   待處理    │  │   製作中    │  │   已完成    │         │
│  │   Queue     │  │  In Progress │  │  Completed  │         │
│  ├─────────────┤  ├─────────────┤  ├─────────────┤         │
│  │             │  │             │  │             │         │
│  │ 📦 #001 ▼   │  │ 🔄 #003 ▼   │  │ ✅ #005 ▼   │         │
│  │ 📦 #002 ▼   │  │ 🔄 #004 ▲   │  │ ✅ #006 ▼   │         │
│  │ 📦 #007 ▼   │  │ 🔄 #008 ▼   │  │ ✅ #009 ▼   │         │
│  │ 📦 #010 ▼   │  │ 🔄 #011 ▼   │  │ ✅ #012 ▼   │         │
│  │             │  │             │  │             │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  📈 即時統計: 待處理 12 | 製作中 8 | 完成 24 | 平均 15分鐘   │
└─────────────────────────────────────────────────────────────┘
```

說明：
- ▼ 表示卡片收縮狀態
- ▲ 表示卡片展開狀態  
- 📦 表示待處理訂單
- 🔄 表示製作中訂單
- ✅ 表示已完成訂單

### 訂單卡片設計 (折疊列表)

#### 收縮狀態 (預設顯示)
```
┌─────────────────────────────────────────────────────────┐
│ 🏷️ #001 | T05 | ⏰ 14:30 | 👥 4人 | 📦 8項    [▼]     │
│ 🔄 製作中 3/8 | ⏱️ 剩餘 12分鐘               [操作] ▼  │
└─────────────────────────────────────────────────────────┘
```

#### 展開狀態 (點擊展開)
```
┌─────────────────────────────────────────────────────────┐
│ 🏷️ 訂單 #001 | 桌號: T05 | ⏰ 14:30 | 👥 4人    [▲]   │
│ 🔄 製作中 3/8 項目 | ⏱️ 預估剩餘 12分鐘                 │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ ▼ 🥗 前菜 (2項) - 1項完成                               │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ ✅ 凱薩沙拉 x1  ⏱️ 已完成 (8分鐘)                    │ │
│ │ 🔄 蒜香麵包 x2  ⏱️ 製作中 (3分鐘)                    │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ ▼ 🍖 主餐 (3項) - 進行中                                │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 🔄 牛排套餐 x2  ⏱️ 製作中 (12分鐘)                   │ │
│ │   └ 🍟 薯條: 已完成 | 🥗 沙拉: 製作中                │ │
│ │ ⏸️ 義大利麵 x1  ⏱️ 待開始 (12分鐘)                   │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ ▲ 🥤 飲品 (3項) - 全部完成                              │
│                                                         │
│ 📝 備註: 牛排七分熟，義大利麵不要洋蔥                    │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │  [全部開始] [暫停全部] [標記完成] [問題回報]        │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

#### 快速操作模式 (右鍵或長按)
```
┌─────────────────────────────────────────────────────────┐
│ 🏷️ #001 | T05 | ⏰ 14:30                              │
│ ┌─ 快速操作 ─────────────────────────────────────────┐  │
│ │ ✅ 標記完成    🔄 開始製作    ⏸️ 暫停               │  │
│ │ 📝 新增備註    ⚠️ 問題回報    👁️ 查看詳情           │  │
│ └─────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## 🛠️ 技術架構

### 前端組件結構
```
KDSPage/
├── Header/
│   ├── StatsPanel.tsx          # 統計面板
│   ├── SortControl.tsx         # 排序控制
│   └── NotificationPanel.tsx   # 通知面板
├── OrderBoard/
│   ├── OrderColumn.tsx         # 訂單欄位
│   ├── CollapsibleOrderCard.tsx # 折疊式訂單卡片 ⭐
│   └── MenuItemGroup.tsx       # 餐點分組
├── OrderCard/
│   ├── OrderHeader.tsx         # 訂單標題 (收縮狀態)
│   ├── OrderSummary.tsx        # 訂單摘要 (收縮狀態) ⭐
│   ├── ExpandedOrderView.tsx   # 展開狀態視圖 ⭐
│   ├── MenuCategories.tsx      # 餐點分類 (可折疊)
│   ├── TodoCheckbox.tsx        # Todo 功能
│   ├── QuickActions.tsx        # 快速操作按鈕 ⭐
│   └── ActionButtons.tsx       # 操作按鈕
├── MenuItems/
│   ├── MenuItemRow.tsx         # 餐點行項目 ⭐
│   ├── ComboItemGroup.tsx      # 套餐項目群組 ⭐
│   └── ItemStatusIndicator.tsx # 項目狀態指示器 ⭐
└── Modals/
    ├── OrderDetailModal.tsx    # 訂單詳情
    ├── QuickNoteModal.tsx      # 快速備註視窗 ⭐
    └── SettingsModal.tsx       # 設定視窗
```

### 折疊式卡片組件設計

```typescript
// CollapsibleOrderCard.tsx 主要組件
interface CollapsibleOrderCardProps {
  order: KDSOrder;
  isExpanded: boolean;
  onToggleExpand: (orderId: string) => void;
  onStatusChange: (orderId: string, status: OrderStatus) => void;
  onItemStatusChange: (itemId: string, status: MenuItemStatus) => void;
}

// OrderSummary.tsx - 收縮狀態摘要
interface OrderSummaryProps {
  order: KDSOrder;
  completedItems: number;
  totalItems: number;
  estimatedTimeRemaining: number;
  urgencyLevel: 'low' | 'medium' | 'high';
}

// ExpandedOrderView.tsx - 展開狀態詳細視圖
interface ExpandedOrderViewProps {
  order: KDSOrder;
  menuGroups: MenuItemGroup[];
  onGroupToggle: (category: MenuCategory) => void;
  onItemToggle: (itemId: string) => void;
}

// QuickActions.tsx - 快速操作
interface QuickActionsProps {
  order: KDSOrder;
  onStartAll: () => void;
  onPauseAll: () => void;
  onMarkComplete: () => void;
  onReportIssue: () => void;
  onAddNote: () => void;
}
```

### 資料結構設計 (基於 Supabase Schema)

```typescript
// 基於 supabase.sql 的訂單狀態 (對應 orders.status)
enum OrderStatus {
  PENDING = 'pending',       // 待處理
  CONFIRMED = 'confirmed',   // 已確認
  PREPARING = 'preparing',   // 製作中
  READY = 'ready',          // 已完成
  SERVED = 'served',        // 已送出
  COMPLETED = 'completed',   // 已完成
  CANCELLED = 'cancelled'    // 已取消
}

// 基於 supabase.sql 的餐點狀態 (對應 order_items.status)
enum MenuItemStatus {
  PENDING = 'pending',       // 待處理
  CONFIRMED = 'confirmed',   // 已確認
  PREPARING = 'preparing',   // 製作中
  READY = 'ready',          // 已完成
  SERVED = 'served',        // 已送出
  CANCELLED = 'cancelled'    // 已取消
}

// 餐點分類 (基於 categories 表結構)
enum MenuCategory {
  APPETIZERS = 'appetizers',   // 前菜
  MAIN_COURSE = 'main_course', // 主餐
  BEVERAGES = 'beverages',     // 飲品
  A_LA_CARTE = 'a_la_carte',   // 單點
  ADDITIONAL = 'additional',   // 加點
  DESSERTS = 'desserts'        // 甜點
}

// KDS 訂單介面 (基於 orders 表)
interface KDSOrder {
  id: string;                    // orders.id
  orderNumber: string;           // orders.order_number
  tableId: string;              // orders.table_id
  tableNumber: number;          // orders.table_number
  customerName?: string;        // orders.customer_name
  customerPhone?: string;       // orders.customer_phone
  customerCount: number;        // orders.customer_count
  subtotal: number;             // orders.subtotal
  taxAmount: number;            // orders.tax_amount
  totalAmount: number;          // orders.total_amount
  status: OrderStatus;          // orders.status
  paymentStatus: string;        // orders.payment_status
  paymentMethod?: string;       // orders.payment_method
  notes?: string;               // orders.notes
  createdBy?: string;           // orders.created_by
  servedAt?: Date;             // orders.served_at
  completedAt?: Date;          // orders.completed_at
  createdAt: Date;             // orders.created_at
  updatedAt: Date;             // orders.updated_at
  
  // KDS 專用欄位
  estimatedPrepTime?: number;   // orders.ai_estimated_prep_time
  aiRecommendations?: any;      // orders.ai_recommendations
  menuItems: KDSMenuItem[];     // 關聯的訂單項目
  
  // KDS 狀態管理
  isExpanded: boolean;          // 卡片是否展開
  urgencyLevel: 'low' | 'medium' | 'high'; // 緊急程度
  totalItems: number;           // 總項目數
  completedItems: number;       // 已完成項目數
}

// KDS 餐點介面 (基於 order_items 表)
interface KDSMenuItem {
  id: string;                   // order_items.id
  orderId: string;             // order_items.order_id
  productId: string;           // order_items.product_id
  productName: string;         // order_items.product_name
  productSku?: string;         // order_items.product_sku
  quantity: number;            // order_items.quantity
  unitPrice: number;           // order_items.unit_price
  totalPrice: number;          // order_items.total_price
  specialInstructions?: string; // order_items.special_instructions
  status: MenuItemStatus;      // order_items.status
  createdAt: Date;             // order_items.created_at
  updatedAt: Date;             // order_items.updated_at
  
  // KDS 專用欄位
  category: MenuCategory;       // 從 products.category_id 關聯
  estimatedTime: number;        // 從 products.prep_time_minutes
  actualTime?: number;          // 實際製作時間
  startedAt?: Date;            // 開始製作時間
  completedAt?: Date;          // 完成時間
  
  // 套餐相關 (基於 combo_products 和相關表)
  isComboItem: boolean;         // 是否為套餐項目
  comboId?: string;            // combo_products.id
  comboSelections?: KDSComboSelection[]; // 套餐選擇
  
  // KDS 狀態
  qualityChecked: boolean;      // 品質檢查
  notes?: string;              // 廚房備註
}

// 套餐選擇 (基於 order_combo_selections 表)
interface KDSComboSelection {
  id: string;                   // order_combo_selections.id
  orderItemId: string;         // order_combo_selections.order_item_id
  ruleId: string;              // order_combo_selections.rule_id
  selectedProductId: string;    // order_combo_selections.selected_product_id
  quantity: number;            // order_combo_selections.quantity
  additionalPrice: number;     // order_combo_selections.additional_price
  productName: string;         // 從 products 表關聯
  status: MenuItemStatus;      // 選擇項目的狀態
}

// 餐點分組 (用於 KDS 顯示)
interface MenuItemGroup {
  category: MenuCategory;
  categoryName: string;
  categoryIcon: string;
  items: KDSMenuItem[];
  totalItems: number;
  completedItems: number;
  isExpanded: boolean;
  estimatedTime: number;       // 該分類預估完成時間
}

// KDS 統計資料
interface KDSStats {
  pendingOrders: number;
  inProgressOrders: number;
  completedOrders: number;
  averagePrepTime: number;
  overdueOrders: number;
  totalOrdersToday: number;
  kitchenEfficiency: number;   // 百分比
}

// KDS 設定
interface KDSSettings {
  autoRefreshInterval: number;  // 自動刷新間隔 (秒)
  soundEnabled: boolean;       // 聲音提醒
  displayMode: 'compact' | 'detailed'; // 顯示模式
  defaultSort: 'time' | 'priority' | 'table'; // 預設排序
  categoriesVisible: MenuCategory[]; // 顯示的分類
  estimatedTimes: Record<MenuCategory, number>; // 各分類預估時間
}

// KDS 篩選條件
interface KDSFilter {
  status?: OrderStatus[];
  categories?: MenuCategory[];
  timeRange?: {
    start: Date;
    end: Date;
  };
  tableNumbers?: number[];
  urgencyLevel?: ('low' | 'medium' | 'high')[];
}
```

## 🎛️ 功能控制項

### 1. 折疊卡片交互邏輯 ⭐
- **單擊展開/收縮**：點擊卡片標題區域或 ▼/▲ 圖示
- **雙擊快速操作**：雙擊卡片標題快速標記為製作中
- **右鍵快速選單**：右鍵點擊顯示快速操作選單
- **長按多選**：長按卡片進入多選模式，可批量操作
- **滑動操作**：左滑顯示快速操作，右滑標記完成
- **鍵盤快捷鍵**：
  - `Space`: 展開/收縮選中的卡片
  - `Enter`: 標記選中訂單為製作中
  - `Ctrl+A`: 全部展開
  - `Ctrl+C`: 全部收縮

### 2. 排序控制
- **時間排序**：最早 → 最晚 / 最晚 → 最早
- **優先級排序**：高優先級訂單優先
- **桌號排序**：按桌號順序排列
- **餐點類型排序**：按餐點製作時間排序
- **拖拽排序**：支援手動拖拽調整順序

### 3. 篩選功能
- **訂單狀態篩選**：顯示特定狀態的訂單
- **餐點分類篩選**：只顯示特定分類的餐點
- **時間範圍篩選**：顯示特定時間範圍的訂單
- **桌號篩選**：篩選特定桌號的訂單
- **緊急程度篩選**：顯示特定緊急程度的訂單

### 4. 批量操作
- **批量展開/收縮**：一鍵展開或收縮所有卡片
- **批量狀態變更**：選中多個訂單後批量變更狀態
- **批量列印**：選中多個訂單批量列印標籤
- **批量備註**：為多個訂單添加相同備註

### 5. 通知系統
- **新訂單提醒**：聲音 + 視覺提醒
- **超時警告**：製作時間超過預估時間警告
- **完成通知**：訂單完成後通知服務生
- **卡片閃爍**：重要訂單卡片閃爍提醒

## 📊 統計面板

### 即時統計
- **待處理訂單數量**
- **製作中訂單數量**
- **今日完成訂單數量**
- **平均製作時間**
- **超時訂單數量**

### 效能指標
- **廚房效率**：訂單完成率
- **製作速度**：平均每道餐點製作時間
- **準時率**：按時完成的訂單比例

## 🎨 視覺設計規範

### 色彩系統
- **待處理**：橙色 (#FF9500)
- **製作中**：藍色 (#007AFF)
- **已完成**：綠色 (#34C759)
- **超時警告**：紅色 (#FF3B30)
- **套餐標識**：紫色 (#AF52DE)

### 字體層級
- **訂單標題**：24px, Bold
- **餐點名稱**：18px, Medium
- **數量/時間**：14px, Regular
- **備註**：12px, Regular

### 間距規範
- **卡片間距**：16px
- **內容間距**：12px
- **按鈕間距**：8px

## 🔧 配置選項

### 系統設定
- **自動刷新間隔**：可設定 5-60 秒
- **聲音提醒**：開啟/關閉新訂單提醒音
- **顯示模式**：緊湊模式/詳細模式
- **排序偏好**：預設排序方式

### 廚房設定
- **餐點分類顯示**：可自定義顯示的分類
- **時間預估**：可調整各類餐點的預估製作時間
- **優先級規則**：設定訂單優先級判斷規則

## 📱 響應式設計

### 桌面版 (1920x1080)
- 三欄式佈局：待處理 | 製作中 | 已完成
- 每欄顯示 3-4 張訂單卡片

### 平板版 (1024x768)
- 兩欄式佈局：待處理+製作中 | 已完成
- 卡片尺寸適度縮小

### 手機版 (375x667)
- 單欄佈局，可滑動切換狀態
- 卡片資訊精簡顯示

## 🔄 即時更新機制

### WebSocket 連接
- 與 POS 系統建立 WebSocket 連接
- 即時接收新訂單和訂單狀態更新
- 斷線自動重連機制

### 資料同步
- 訂單狀態變更即時同步
- 餐點完成狀態實時更新
- 多個 KDS 終端間的狀態同步

## 🚀 後續擴展功能

### 1. 進階分析
- 廚房效能分析報表
- 餐點製作時間趨勢
- 高峰時段分析

### 2. 智能功能
- AI 預測製作時間
- 自動排程優化
- 智能提醒系統

### 3. 整合功能
- 庫存系統整合
- 員工排班系統整合
- 客戶通知系統

---

## 📋 開發優先級

### Phase 1 - 核心功能 (MVP)
1. 基本訂單顯示
2. 餐點分類分組
3. 狀態管理 (待處理 → 製作中 → 已完成)
4. 基本 Todo 功能

### Phase 2 - 進階功能
1. 套餐管理
2. 排序控制
3. 統計面板
4. 通知系統

### Phase 3 - 優化功能
1. 響應式設計
2. 效能優化
3. 進階篩選
4. 自定義設定

這個設計文檔為 KDS 系統提供了完整的功能規劃和視覺設計指導，您可以根據實際需求調整和優化具體的實現細節。
