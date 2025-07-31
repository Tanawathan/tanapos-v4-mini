# TanaPOS V4-Mini 🍽️

[![React](https://img.shields.io/badge/React-18.2-blue)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4-purple)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-teal)](https://tailwindcss.com/)

> 專為餐廳設計的行動端點餐系統 - 簡潔、快速、現代化

## ✨ 特色功能

### 🏪 核心功能
- **📱 行動優先設計** - 專為手機/平板優化的響應式界面
- **🛒 智能購物車** - 即時計算、數量管理、小計顯示
- **🍽️ 菜單瀏覽** - 分類檢視、產品搜尋、詳細資訊
- **📋 訂單管理** - 訂單狀態追蹤、歷史記錄
- **👨‍🍳 KDS 系統** - 廚房顯示螢幕，即時訂單處理
- **🪑 桌位管理** - 桌位狀態、容量管理、佔用追蹤

### 🔧 技術特色
- **⚡ 極速載入** - Vite 建構工具，HMR 熱重載
- **🎨 現代 UI** - Tailwind CSS，Lucide React 圖標
- **📦 狀態管理** - Zustand 輕量級狀態管理
- **🏗️ 型別安全** - 完整 TypeScript 支援
- **🔄 即時同步** - Supabase Realtime 即時資料同步（可選）
- **📲 PWA 支援** - 可安裝為原生應用程式

## 🚀 快速開始

### 安裝與啟動

```bash
# 1. 進入專案目錄
cd c:\TanaPOS\tanapos-v4-mini

# 2. 安裝相依套件
npm install

# 3. 啟動開發伺服器
npm run dev

# 4. 在瀏覽器開啟
# http://localhost:5173
```

### 建構產品版本

```bash
# 建構最佳化版本
npm run build

# 預覽建構結果
npm run preview
```

## 🗂️ 專案結構

```
tanapos-v4-mini/
├── src/
│   ├── components/          # React 組件
│   │   ├── Layout.tsx      # 主版面配置
│   │   ├── MenuView.tsx    # 菜單檢視
│   │   ├── CartView.tsx    # 購物車檢視
│   │   ├── OrdersView.tsx  # 訂單管理
│   │   ├── KDSView.tsx     # 廚房顯示系統
│   │   └── TablesView.tsx  # 桌位管理
│   ├── lib/
│   │   ├── store-local.ts  # 本地狀態管理
│   │   ├── store.ts        # Supabase 狀態管理
│   │   ├── api.ts          # API 服務層
│   │   ├── types.ts        # TypeScript 型別定義
│   │   └── supabase.ts     # Supabase 設定
│   └── App.tsx             # 根組件
├── public/                 # 靜態資源
├── setup-database.sql      # 資料庫設置腳本
└── SUPABASE_SETUP.md      # Supabase 設置指南
```

## 📊 資料模型

### 核心實體

```typescript
interface Product {
  id: string
  name: string
  price: number
  category_id: string
  description?: string
  is_available: boolean
}

interface Order {
  id: string
  order_number: string
  table_id?: number
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed'
  items: OrderItem[]
  total_amount: number
}

interface Table {
  id: string
  table_number: number
  capacity: number
  status: 'available' | 'occupied' | 'cleaning' | 'reserved'
}
```

## 🔧 開發模式

### 本地開發 (當前設定)
- 使用 `store-local.ts` 模擬資料
- 無需資料庫連線
- 即時可用，適合開發測試

### Supabase 即時模式
1. 設定 `.env` 檔案中的 Supabase 憑證
2. 執行 `setup-database.sql` 建立資料表
3. 將 App.tsx 改為使用 `./lib/store`
4. 享受即時資料同步功能

## 🎯 使用流程

### 1. 點餐流程
```
選擇桌位 → 瀏覽菜單 → 加入購物車 → 確認訂單 → 送出訂單
```

### 2. 廚房流程
```
接收新訂單 → 準備中 → 製作完成 → 出餐
```

### 3. 管理流程
```
檢視所有訂單 → 更新訂單狀態 → 管理桌位狀態
```

## 🛠️ 自訂配置

### 新增產品分類
編輯 `src/lib/store-local.ts` 中的 `mockCategories` 陣列

### 新增產品
編輯 `src/lib/store-local.ts` 中的 `mockProducts` 陣列

### 調整桌位數量
修改 `src/lib/store-local.ts` 中的 `mockTables` 產生邏輯

### 客製化樣式
編輯 `tailwind.config.js` 或直接修改組件中的 CSS 類別

## 📱 PWA 功能

系統支援 Progressive Web App：

- **離線存取** - 核心功能離線可用
- **安裝提示** - 可安裝至桌面
- **推播通知** - 新訂單通知（Supabase 模式）
- **背景同步** - 離線時資料快取，上線時同步

## 🔐 安全性

### 資料驗證
- 所有輸入資料都經過驗證
- TypeScript 型別檢查防止資料錯誤
- 購物車狀態本地儲存

### Supabase 安全 (可選)
- Row Level Security (RLS) 政策
- API 金鑰保護
- 即時訂閱安全控管

## 🧪 測試資料

系統預載了豐富的測試資料：

- **4 個產品分類** - 熱飲、冷飲、小食、主餐
- **10 種產品** - 包含價格、描述、製作時間
- **12 個桌位** - 不同容量和狀態
- **模擬訂單** - 各種狀態的示例訂單

## 🚀 部署選項

### Netlify (建議)
```bash
npm run build
# 上傳 dist/ 資料夾至 Netlify
```

### Vercel
```bash
npm run build
# 使用 Vercel CLI 部署
```

### 自託管
```bash
npm run build
# 將 dist/ 資料夾部署至 Web 伺服器
```

## 🤝 貢獻指南

1. Fork 此專案
2. 建立功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交變更 (`git commit -m 'Add amazing feature'`)
4. 推送分支 (`git push origin feature/amazing-feature`)
5. 開啟 Pull Request

## 📄 版本歷程

### V4-Mini (當前版本)
- ✅ 行動優先設計
- ✅ 核心 POS 功能
- ✅ 本地測試資料
- ✅ PWA 支援
- ✅ Supabase 整合準備

### 未來規劃
- 🔄 支付整合
- 📊 銷售報表
- 👥 多店面支援
- 🎨 主題切換
- 📱 原生 App

## 📞 技術支援

如遇問題請檢查：

1. **Node.js 版本** - 建議 18.0 以上
2. **瀏覽器相容性** - Chrome, Firefox, Safari, Edge
3. **網路連線** - Supabase 模式需要網路
4. **控制台錯誤** - 按 F12 查看詳細錯誤

---

**由 TanaPOS 團隊打造 ❤️**

*專業餐廳管理系統，讓點餐變得簡單高效*
