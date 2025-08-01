# 快速開始遷移

選擇您偏好的執行方式:

## 🎯 最簡單的方式 (推薦新手)

```batch
setup-migration.bat
```

這會啟動互動式設定，完成後自動執行遷移。

## 🔧 進階用戶

1. **PowerShell 版本** (功能更豐富):
   ```powershell
   .\setup-migration.ps1
   ```

2. **直接執行**:
   ```bash
   node scripts/migrate-database.mjs
   ```

## 📋 執行前檢查清單

- [ ] 準備好舊 Supabase URL
- [ ] 準備好舊 Service Role Key  
- [ ] 確保網路連接穩定
- [ ] 選擇適當的執行時間 (建議非營業時間)

## ⚡ 常見使用場景

### 場景1: 完整遷移
需要轉移所有資料，包含歷史訂單
```
執行: setup-migration.bat
設定: 包含所有表格，30天訂單資料
```

### 場景2: 基礎資料only  
只需要商品、類別、桌台資料
```
執行: setup-migration.bat  
設定: 排除訂單資料
```

### 場景3: 測試遷移
先小範圍測試
```
執行: node scripts/migrate-database.mjs --test-mode
```

詳細說明請參考: `DATABASE_MIGRATION_COMPLETE_GUIDE.md`
