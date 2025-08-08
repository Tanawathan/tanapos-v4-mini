# 📋 Supabase 桌台設定欄位更新指南

## 🎯 目的
為了支援桌台參數設定功能，需要在 Supabase 控制台中手動添加一些新欄位到餐廳設定中。

---

## ⚠️ 重要提醒
在使用新的桌台設定功能之前，請按照以下步驟操作：

---

## 🔧 手動操作步驟

### 步驟 1: 登入 Supabase 控制台
1. 前往 https://supabase.com
2. 登入您的帳號
3. 選擇專案: `arksfwmcmwnyxvlcpskm`

### 步驟 2: 進入資料表編輯器
1. 在左側選單點擊 "Table Editor"
2. 找到並點擊 `restaurants` 資料表

### 步驟 3: 檢查 settings 欄位
1. 查看是否有 `settings` 欄位 (類型: jsonb)
2. 如果沒有，請新增此欄位：
   - 欄位名稱: `settings`
   - 資料類型: `jsonb`
   - 預設值: `{}`
   - 允許 NULL: 是

---

## 📊 資料結構說明

### settings 欄位應包含以下結構：

```json
{
  "table_settings": {
    "general": {
      "default_capacity": 4,
      "default_cleaning_duration": 15,
      "auto_assignment_enabled": true,
      "qr_code_enabled": true
    },
    "zones": {
      "available_zones": ["大廳", "VIP區", "包廂", "戶外"],
      "default_zone": "大廳"
    },
    "features": {
      "available_features": ["窗邊", "安靜", "充電插座", "兒童友善", "輪椅友善", "包廂"],
      "default_features": []
    },
    "ai_settings": {
      "auto_assignment": true,
      "priority_scoring": true,
      "smart_recommendations": false
    }
  }
}
```

---

## 🧪 測試步驟

### 1. 檢查現有資料
執行以下查詢來檢查現有設定：
```sql
SELECT id, name, settings 
FROM restaurants 
WHERE settings IS NOT NULL;
```

### 2. 初始化預設設定
如果某個餐廳的 settings 為空，可以手動設定：
```sql
UPDATE restaurants 
SET settings = '{
  "table_settings": {
    "general": {
      "default_capacity": 4,
      "default_cleaning_duration": 15,
      "auto_assignment_enabled": true,
      "qr_code_enabled": true
    },
    "zones": {
      "available_zones": ["大廳", "VIP區", "包廂", "戶外"],
      "default_zone": "大廳"
    },
    "features": {
      "available_features": ["窗邊", "安靜", "充電插座", "兒童友善", "輪椅友善", "包廂"],
      "default_features": []
    },
    "ai_settings": {
      "auto_assignment": true,
      "priority_scoring": true,
      "smart_recommendations": false
    }
  }
}'::jsonb
WHERE id = 'your_restaurant_id_here';
```

### 3. 驗證桌台資料表
確保 `tables` 資料表有必要的欄位：
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'tables' 
AND table_schema = 'public'
ORDER BY column_name;
```

---

## ✅ 功能驗證清單

完成設定後，請驗證以下功能：

### 在桌台設定頁面中：
- [ ] 可以看到桌台總覽統計
- [ ] 可以編輯全域設定
- [ ] 可以新增/移除區域
- [ ] 可以新增/移除桌台特色
- [ ] 可以批量更新桌台設定
- [ ] 可以編輯個別桌台參數
- [ ] 儲存後設定能正確保存到資料庫

### 在其他頁面中：
- [ ] 桌台管理頁面能正常運作
- [ ] 預約系統能正確使用桌台資訊
- [ ] KDS 系統能正確顯示桌台資訊

---

## 🚨 疑難排解

### 問題 1: 無法儲存設定
**可能原因**: settings 欄位不存在或權限不足
**解決方案**: 檢查 RLS 政策並確認 settings 欄位存在

### 問題 2: 載入桌台失敗
**可能原因**: 資料表權限設定問題
**解決方案**: 
```sql
-- 確認 RLS 政策
SELECT * FROM pg_policies WHERE tablename = 'tables';

-- 如需要，可以暫時停用 RLS 進行測試
ALTER TABLE public.tables DISABLE ROW LEVEL SECURITY;
```

### 問題 3: 無法更新個別桌台
**可能原因**: 桌台 ID 不正確或資料格式問題
**解決方案**: 檢查桌台 ID 是否存在且格式正確

---

## 📝 注意事項

1. **備份資料**: 在進行任何資料庫修改前，請先備份重要資料
2. **測試環境**: 建議先在測試環境中驗證所有功能
3. **權限設定**: 確保應用程式有適當的資料庫存取權限
4. **欄位驗證**: 新增欄位時要注意資料類型和約束條件

---

## 📞 支援

如果在設定過程中遇到問題，請檢查：
1. Supabase 控制台的錯誤訊息
2. 瀏覽器開發者工具的網路請求
3. 應用程式控制台的錯誤日誌

---

**🎊 完成設定後，您的桌台管理系統將具備完整的參數設定功能！**
