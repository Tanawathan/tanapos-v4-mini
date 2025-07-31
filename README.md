# 🍽️ TanaPOS V4-Mini - 現代化餐廳管理系統

> 🚀 **完整餐廳 POS 解決方案**  
> **基於**: React + TypeScript + Vite + Supabase  
> **特色**: 10種UI主題 + 完整庫存管理 + 圖形化資料編輯

## ✨ 系統特色

### 🎯 核心功能
- 📱 **現代化POS系統** - 直觀的點餐介面，支援拖拽購物車
- 👨‍� **廚房顯示系統** - 即時訂單管理，製作狀態追蹤
- 🪑 **桌台管理** - 視覺化桌位控制，預約管理
- 📋 **訂單管理** - 完整訂單生命週期追蹤
- 📦 **三層庫存系統** - 原料→半成品→成品完整管理
- � **資料庫編輯器** - 圖形化即時資料管理介面
- � **後台管理系統** - 完整的系統設定和資料管理

### 🎨 UI/UX 設計亮點
- 🌈 **10種主題風格** - Modern, Neumorphism, Glassmorphism, Brutalism, Cyberpunk, Kawaii, Skeuomorphism, DOS, BIOS, Code
- 📱 **完全響應式** - 支援桌機、平板、手機全裝置
- ⚡ **極速載入** - Vite + 內聯樣式優化效能
- 🎭 **統一設計系統** - 全系統一致的視覺風格

### 🔧 技術架構
```
前端: React 18 + TypeScript + Vite
狀態管理: Zustand
資料庫: Supabase (PostgreSQL + Real-time)
樣式系統: 內聯樣式 + 主題系統
部署: Netlify / Vercel
```

## 🏗️ 專案結構

```
tanapos-v4-mini/
├── src/
│   ├── components/           # UI 組件
│   │   ├── ui/              # 基礎 UI 組件
│   │   ├── POS/             # POS 相關組件
│   │   ├── KDS/             # 廚房顯示系統
│   │   └── Orders/          # 訂單相關組件
│   ├── pages/               # 頁面組件
│   │   ├── POS.tsx          # 點餐介面
│   │   ├── KDS.tsx          # 廚房系統
│   │   ├── Orders.tsx       # 訂單管理
│   │   └── Checkout.tsx     # 結帳介面
│   ├── store/               # 狀態管理
│   ├── lib/                 # 工具函數
│   │   ├── supabase.ts      # Supabase 客戶端
│   │   └── types.ts         # TypeScript 類型
│   ├── hooks/               # 自定義 Hooks
│   └── App.tsx              # 主應用
├── public/                  # 靜態資源
├── .env.example            # 環境變數範例
└── package.json            # 專案配置
```

## 🚀 快速開始

### 1. 安裝依賴
```bash
cd tanapos-v4-mini
npm install
```

### 2. 設置環境變數
```bash
cp .env.example .env.local
# 編輯 .env.local 填入 Supabase 配置
```

### 3. 啟動開發伺服器
```bash
npm run dev
```

### 4. 訪問應用
- **POS 點餐系統**: http://localhost:5173/
- **KDS 廚房系統**: http://localhost:5173/kds
- **訂單管理**: http://localhost:5173/orders

## 📱 功能模組

### POS 點餐系統
- 商品分類瀏覽
- 快速搜尋商品
- 購物車管理
- 桌號選擇
- 訂單確認

### KDS 廚房系統  
- 即時訂單顯示
- 製作狀態更新
- 完成訂單標記
- 優先級管理

### 訂單管理
- 訂單狀態追蹤
- 歷史訂單查詢
- 訂單詳情檢視
- 退款處理

### 現金結帳
- 簡化收銀介面
- 找零計算
- 收據列印
- 日營業報表

## 🔧 開發指令

```bash
npm run dev          # 啟動開發伺服器
npm run build        # 建置生產版本
npm run preview      # 預覽生產版本
npm run lint         # 程式碼檢查
npm run type-check   # TypeScript 類型檢查
```

## 📊 資料庫結構

使用 V3 現有的資料庫結構：
- `products` - 商品資料
- `categories` - 商品分類
- `orders` - 訂單資料
- `order_items` - 訂單項目
- `tables` - 餐桌資料

## 🎨 設計原則

- **行動優先**: 專為觸控設備設計
- **簡潔直觀**: 最小化學習成本
- **快速響應**: 優化載入速度
- **離線支援**: PWA 離線功能
- **即時更新**: 多裝置同步

---

**版本**: V4-Mini 1.0.0  
**開發團隊**: TanaPOS Development Team  
**最後更新**: 2025年7月30日
