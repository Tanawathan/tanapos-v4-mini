# TanaPOS v4 AI - 智慧餐廳管理系統

## 專案概述

TanaPOS v4 AI 是一個現代化的餐廳點餐與管理系統，使用 React + TypeScript + Supabase 構建，專為餐廳營運優化設計。

## 📚 文件總覽 (Documentation Index)

完整的開發 / 設定 / 報告與指南文件已統一整理於 `docs/` 目錄。

- 快速進入索引：➡️ [docs/INDEX.md](docs/INDEX.md)
- 主要分類：
  - reports：功能完成 / 修復 / 部署報告與變更紀錄
  - guides：安裝設定、系統定義、操作流程、設計規劃

建議先閱讀 `docs/INDEX.md` 以了解全部可用文件，再按需求深入各主題。

## 技術架構

### 前端技術棧
- **React 18** - 現代化 UI 框架
- **TypeScript** - 類型安全的 JavaScript
- **Vite** - 快速構建工具
- **TailwindCSS** - 實用性優先的 CSS 框架
- **Zustand** - 輕量級狀態管理

### 後端服務
- **Supabase** - 後端即服務平台
  - PostgreSQL 資料庫
  - 即時訂閱功能
  - 身份認證系統
  - 自動 API 生成

## 核心功能

### 🍽️ 點餐系統
- 產品分類瀏覽
- 購物車管理
- 套餐選擇器
- 客製化選項

### 🪑 桌台管理
- 桌台狀態追蹤
- 即時狀態更新
- 桌台分配管理

### 💳 結帳系統
- 多種付款方式
- 發票開立
- 交易記錄

### 📊 庫存管理
- 即時庫存追蹤
- 自動警示功能
- 成本計算

## 專案結構

```
src/
├── components/         # UI 組件
├── lib/               # 核心邏輯
│   ├── supabase.ts    # Supabase 客戶端
│   ├── store.ts       # Zustand 狀態管理
│   └── types.ts       # TypeScript 類型定義
├── App.tsx            # 主應用程式
├── main.tsx           # 應用程式入口
└── index.css          # 全域樣式
```

## 開發環境設置

### 1. 安裝依賴
```bash
npm install
```

### 2. 環境變數配置
複製 `.env.example` 為 `.env` 並填入 Supabase 配置：
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. 啟動開發伺服器
```bash
npm run dev
```
預設運行在 http://localhost:5174/

### 4. 構建生產版本
```bash
npm run build
```

## 資料庫架構

系統使用 Supabase PostgreSQL 資料庫，包含以下主要表格：

- `restaurants` - 餐廳基本資訊
- `categories` - 產品分類
- `products` - 產品資訊
- `combo_products` - 套餐產品
- `tables` - 桌台管理
- `orders` - 訂單資訊
- `order_items` - 訂單項目
- `payments` - 付款記錄
- `inventory` - 庫存管理

## 狀態管理

使用 Zustand 進行狀態管理，主要狀態包括：

### 基本資料狀態
- `currentRestaurant` - 當前餐廳
- `categories` - 產品分類
- `products` - 產品列表
- `tables` - 桌台列表

### 業務邏輯狀態
- `cartItems` - 購物車項目
- `selectedTable` - 選擇的桌台
- `currentOrder` - 當前訂單

### 系統狀態
- `loading` - 載入狀態
- `error` - 錯誤訊息

## API 操作

### 資料載入
- `loadCategories()` - 載入產品分類
- `loadProducts()` - 載入產品列表
- `loadTables()` - 載入桌台資訊

### 購物車操作
- `addToCart()` - 加入購物車
- `updateCartQuantity()` - 更新數量
- `removeFromCart()` - 移除項目
- `clearCart()` - 清空購物車

### 訂單操作
- `createOrder()` - 建立訂單
- `addOrderItem()` - 新增訂單項目
- `updateOrderStatus()` - 更新訂單狀態

## 開發指南

### 新增產品類型
1. 在 `types.ts` 中定義新的介面
2. 更新 Supabase 資料庫架構
3. 在 store 中新增相關操作函數
4. 建立對應的 UI 組件

### 自定義主題
1. 修改 `tailwind.config.js` 中的顏色配置
2. 更新 `index.css` 中的自定義樣式
3. 調整組件中的 CSS 類別

### 新增功能模組
1. 在 `components/` 建立新的組件目錄
2. 定義相關的 TypeScript 介面
3. 在 store 中新增狀態和操作
4. 整合到主應用程式中

## 部署

### Netlify 部署
1. 將專案推送到 Git 倉庫
2. 連接到 Netlify
3. 設置環境變數
4. 自動部署

### Vercel 部署
1. 導入 Git 倉庫到 Vercel
2. 配置環境變數
3. 自動構建和部署

## 貢獻指南

1. Fork 專案
2. 建立功能分支
3. 提交變更
4. 發起 Pull Request

## 授權

本專案使用 MIT 授權條款。

## 聯絡資訊

如有問題或建議，請聯絡開發團隊。
