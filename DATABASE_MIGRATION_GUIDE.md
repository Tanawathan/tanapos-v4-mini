# 📊 TanaPOS 資料庫一鍵轉移工具

## 🎯 功能說明

這個工具可以幫您從舊的 Supabase 資料庫轉移資料到新的資料庫，支援：

- ✅ 自動備份現有資料
- ✅ 從舊資料庫獲取資料
- ✅ 智能合併避免重複
- ✅ 安全的資料遷移
- ✅ 完整的錯誤處理

## 🔧 使用前準備

### 1. 設定舊資料庫連接資訊

複製 `.env.migration` 文件並填入您的舊資料庫資訊：

```bash
# 舊資料庫設定
OLD_SUPABASE_URL=https://your-old-project.supabase.co
OLD_SUPABASE_SERVICE_KEY=your-old-service-role-key
```

### 2. 確認新資料庫設定

檢查 `.env` 文件中的新資料庫設定是否正確：

```bash
VITE_SUPABASE_URL=https://peubpisofenlyquqnpan.supabase.co
VITE_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## 🚀 執行方式

### 方式一：使用批次腳本 (推薦)

```bash
# Windows 命令提示字元
migrate-database.bat

# 或使用 PowerShell
.\migrate-database.ps1
```

### 方式二：直接執行 Node.js 腳本

```bash
node scripts/migrate-database.mjs
```

## 📋 執行流程

1. **檢查設定** - 驗證資料庫連接設定
2. **測試連接** - 確認新舊資料庫都能正常連接
3. **備份資料** - 自動備份現有資料到 JSON 文件
4. **獲取舊資料** - 從舊資料庫獲取所有相關資料
5. **合併資料** - 智能合併，避免重複資料
6. **更新資料庫** - 將合併後的資料寫入新資料庫

## 📊 轉移的資料類型

- **分類資料** (categories)
- **產品資料** (products)  
- **桌台設定** (tables)
- **歷史訂單** (orders) - 最近30天
- **訂單項目** (order_items)

## ⚠️ 注意事項

### 🔒 安全提醒
- 建議在非營業時間執行
- 執行前會自動備份現有資料
- 確保有足夠的磁碟空間儲存備份

### 📝 資料處理規則
- **分類**: 依名稱避免重複
- **產品**: 依名稱避免重複  
- **桌台**: 依桌號避免重複，狀態重置為可用
- **訂單**: 保留所有歷史訂單
- **ID**: 所有 ID 重新生成，確保資料完整性

### 🔄 失敗處理
- 如果遷移失敗，使用備份文件恢復
- 檢查錯誤訊息並修正問題後重新執行
- 確保網路連接穩定

## 📁 生成的文件

### 備份文件
```
backup_2025-01-08T10-30-00-000Z.json
```
包含遷移前的完整資料備份

### 日誌文件
執行過程中會在終端顯示詳細的進度和狀態資訊

## 🛠️ 故障排除

### 常見問題

**Q: 連接舊資料庫失敗**
- 檢查 `.env.migration` 中的 URL 和 Key 是否正確
- 確認舊專案仍然可用
- 檢查網路連接

**Q: 新資料庫更新失敗**  
- 檢查 Service Role Key 權限
- 確認資料庫表格結構正確
- 檢查資料庫空間是否足夠

**Q: 資料重複或遺失**
- 檢查合併邏輯設定
- 使用備份文件恢復
- 重新執行遷移

### 手動恢復

如果需要手動恢復資料：

```bash
# 使用備份文件
node -e "
const fs = require('fs');
const backup = JSON.parse(fs.readFileSync('./backup_[timestamp].json'));
console.log('備份資料:', backup);
"
```

## 🎉 完成後檢查

遷移完成後，請檢查：

1. **應用程式功能** - 所有頁面正常載入
2. **資料完整性** - 分類、產品、桌台資料正確
3. **歷史記錄** - 訂單歷史是否保留
4. **系統性能** - 運行速度是否正常

## 📞 技術支援

如果遇到問題，請提供：
- 錯誤訊息截圖
- 備份文件時間戳
- 資料庫設定 (隱藏敏感資訊)
- 執行環境資訊

---

**⚡ 快速開始**: 
1. 設定 `.env.migration`
2. 執行 `migrate-database.bat`  
3. 等待完成並檢查結果
