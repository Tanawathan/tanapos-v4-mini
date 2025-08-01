# TanaPOS 資料庫遷移完整指南

## 🎯 總覽

本系統提供完整的資料庫遷移解決方案，可以安全地將舊 Supabase 專案的資料轉移到新專案。

## 📋 準備工作

### 1. 系統需求
- Node.js 16+ 
- 網路連接
- 舊 Supabase 專案的管理權限
- 新 Supabase 專案已設定

### 2. 準備資料
- 舊 Supabase URL 
- 舊 Supabase Service Role Key
- 確認新專案資料庫結構已建立

## 🚀 快速開始

### 方法一: 使用自動設定工具 (推薦)

1. **執行設定工具:**
   ```batch
   setup-migration.bat
   ```
   或
   ```powershell
   .\setup-migration.ps1
   ```

2. **按照提示輸入:**
   - 舊 Supabase URL
   - 舊 Service Role Key

3. **執行遷移:**
   ```batch
   migrate-database.bat
   ```

### 方法二: 手動設定

1. **複製設定模板:**
   ```batch
   copy .env.migration.template .env.migration
   ```

2. **編輯 `.env.migration`:**
   ```env
   OLD_SUPABASE_URL=https://你的舊專案.supabase.co
   OLD_SUPABASE_SERVICE_KEY=你的舊ServiceRoleKey
   ```

3. **執行遷移:**
   ```bash
   node scripts/migrate-database.mjs
   ```

## 🔧 進階設定

### 環境變數選項

```env
# 必要設定
OLD_SUPABASE_URL=舊專案URL
OLD_SUPABASE_SERVICE_KEY=舊專案金鑰

# 可選設定  
MIGRATION_INCLUDE_ORDERS=true        # 包含訂單資料
MIGRATION_DAYS_BACK=30              # 遷移最近30天資料
MIGRATION_BACKUP_ENABLED=true       # 啟用自動備份
MIGRATION_BATCH_SIZE=100            # 批次處理大小
```

### 自訂遷移範圍

編輯 `migrate-database.mjs` 中的設定:

```javascript
const migrationConfig = {
  includeTables: ['categories', 'products', 'tables', 'orders'],
  dateRange: 30, // 天數
  batchSize: 100
}
```

## 📊 遷移流程

### 1. 預檢階段
- ✅ 檢查新舊資料庫連接
- ✅ 驗證表格結構
- ✅ 統計資料量

### 2. 備份階段  
- 🔒 自動備份新專案現有資料
- 📁 備份檔案: `backup_YYYYMMDD_HHMMSS.json`

### 3. 資料轉移
- 📋 Categories (商品類別)
- 🛍️ Products (商品)  
- 🪑 Tables (桌台)
- 📦 Orders (訂單) - 可選

### 4. 驗證階段
- 🔍 資料完整性檢查
- 📈 統計報告
- ✅ 確認轉移成功

## ⚠️ 安全須知

### 執行前檢查
- [ ] 確認舊專案資料權限
- [ ] 檢查網路連接穩定性  
- [ ] 建議非營業時間執行
- [ ] 準備充足時間 (大資料量可能需要較長時間)

### 備份政策
- 系統會自動備份新專案現有資料
- 備份檔案位於專案根目錄
- 建議手動備份重要資料

### 資料合併策略
- **Categories**: 按名稱合併，避免重複
- **Products**: 按名稱合併，更新價格和描述
- **Tables**: 按編號合併，保持現有狀態
- **Orders**: 僅轉移指定時間範圍內的訂單

## 🛠️ 疑難排解

### 常見問題

#### Q: 遷移中斷怎麼辦？
A: 系統支援斷點續傳，重新執行即可從中斷點繼續。

#### Q: 資料重複怎麼處理？
A: 系統會自動檢測並合併重複資料，不會造成衝突。

#### Q: 舊專案無法連接？
A: 檢查以下項目:
- URL 格式正確
- Service Role Key 有效
- 網路連接正常
- 專案未被暫停

#### Q: 轉移失敗如何恢復？
A: 使用自動備份檔案恢復:
```bash
node scripts/restore-backup.mjs backup_20231201_143022.json
```

### 錯誤碼對照

| 錯誤碼 | 說明 | 解決方案 |
|--------|------|----------|
| E001 | 舊資料庫連接失敗 | 檢查URL和金鑰 |
| E002 | 新資料庫權限不足 | 確認Service Role Key |
| E003 | 表格結構不匹配 | 更新資料庫結構 |
| E004 | 資料驗證失敗 | 檢查資料格式 |

## 📞 技術支援

### 日誌檔案
- 遷移日誌: `migration.log`
- 錯誤日誌: `migration-error.log`
- 詳細日誌: `migration-debug.log`

### 聯絡資訊
如遇到技術問題，請提供:
1. 錯誤訊息截圖
2. 日誌檔案
3. 系統環境資訊
4. 遷移設定檔案

## 🔄 版本更新

### v1.0.0 (當前版本)
- ✅ 基礎資料遷移
- ✅ 自動備份功能
- ✅ Windows 自動化腳本
- ✅ 詳細文檔

### 計劃功能
- 🔄 增量同步
- 📊 進度視覺化
- 🔧 Web UI 管理界面
- 📱 行動端監控

---

**最後更新**: 2024年12月
**版本**: v1.0.0
