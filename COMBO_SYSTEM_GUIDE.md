# 🍽️ 套餐系統完整設置指南

## 📋 目前完成狀況

✅ **已完成：**
1. 套餐管理前端組件 (`ComboManagement.tsx`)
2. 管理系統整合（添加套餐管理標籤頁）
3. 資料庫架構設計 (`setup-combo-system.sql`)
4. 設置腳本 (`setup-combo-system.js`)

⚠️ **待完成：**
1. 在 Supabase 中執行 SQL 建立資料表
2. 測試套餐管理功能
3. 整合套餐到點餐介面

## 🛠️ 完成設置步驟

### 第一步：執行資料庫設置

1. **登入 Supabase Dashboard**
   - 網址：https://supabase.com/dashboard
   - 選擇您的 TanaPOS 專案

2. **執行 SQL 指令**
   - 進入 SQL Editor
   - 將 `setup-combo-system.sql` 檔案內容複製貼上
   - 點擊 "Run" 執行

3. **確認表格創建**
   - 檢查 `combo_products` 表格（套餐主表）
   - 檢查 `combo_items` 表格（套餐項目表）
   - 確認有示例資料插入

### 第二步：啟動系統測試

```bash
# 進入專案目錄
cd c:\TanaPOS\tanapos-v4-mini

# 啟動開發伺服器
npm run dev
```

### 第三步：測試套餐管理功能

1. **進入管理系統**
   - 開啟瀏覽器前往開發伺服器網址
   - 點擊「管理系統」

2. **測試套餐管理**
   - 點擊「🍽️ 套餐管理」標籤頁
   - 查看是否顯示示例套餐
   - 測試新增套餐功能
   - 測試套餐項目管理

## 🔧 套餐管理功能說明

### 主要功能

1. **套餐創建**
   - 套餐名稱、描述
   - 價格設定
   - 分類選擇
   - 製作時間設定

2. **套餐項目管理**
   - 添加產品到套餐
   - 設定數量
   - 移除項目
   - 視覺化管理界面

3. **套餐設定**
   - 啟用/停用切換
   - 價格調整
   - 描述更新

### 資料庫結構

**combo_products 表格：**
- `id`: 套餐ID (UUID)
- `name`: 套餐名稱
- `description`: 套餐描述
- `price`: 套餐價格
- `category_id`: 分類ID
- `is_available`: 是否可用
- `preparation_time`: 製作時間

**combo_items 表格：**
- `id`: 項目ID (UUID)
- `combo_id`: 套餐ID
- `product_id`: 產品ID
- `quantity`: 數量
- `is_optional`: 是否可選
- `additional_price`: 額外價格

## 🚀 下一步開發計畫

### 整合到點餐介面

1. **修改 SimplePOS**
   - 顯示套餐產品
   - 套餐價格計算
   - 套餐項目選擇

2. **修改 CleanMobilePOS**
   - 手機版套餐顯示
   - 觸控優化
   - 套餐訂購流程

3. **KDS 系統整合**
   - 套餐項目分解顯示
   - 製作順序控制
   - 完成狀態追蹤

### 進階功能

1. **套餐組合選項**
   - 可選項目 (optional items)
   - 額外加價項目
   - 替換選項

2. **動態定價**
   - 時段價格
   - 促銷優惠
   - 會員折扣

3. **庫存整合**
   - 套餐可用性檢查
   - 成分庫存追蹤
   - 自動停用機制

## 🎯 快速測試清單

- [ ] 資料庫表格已創建
- [ ] 管理系統可進入套餐管理頁面
- [ ] 可以新增套餐
- [ ] 可以添加套餐項目
- [ ] 可以刪除套餐
- [ ] 示例資料顯示正確
- [ ] 所有功能按鈕正常運作

## 🔗 相關檔案

- **前端組件**：`src/components/admin/ComboManagement.tsx`
- **管理系統**：`src/components/admin/AdminSystem.tsx`
- **資料庫架構**：`setup-combo-system.sql`
- **設置腳本**：`setup-combo-system.js`
- **使用指南**：`COMBO_SYSTEM_GUIDE.md` (本檔案)

---

**📞 需要協助？**

如果在設置過程中遇到問題，請確認：
1. Supabase 連線正常
2. 所有 SQL 指令已執行
3. 資料表權限設置正確
4. 開發伺服器正常運行

完成資料庫設置後，套餐管理系統就能完全運作了！🎉
