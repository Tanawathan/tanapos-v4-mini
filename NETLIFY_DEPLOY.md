# TanaPOS v4 - Netlify 部署指南

## 環境變數設定

請在 Netlify 環境變數中設定以下變數：

### 必需變數
```
VITE_SUPABASE_URL=https://arksfwmcmwnyxvlcpskm.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
VITE_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
VITE_RESTAURANT_ID=11111111-1111-1111-1111-111111111111
```

### 應用程式變數
```
VITE_APP_NAME=TanaPOS V4-AI
VITE_APP_VERSION=4.1.0
```

## 建置設定

### Build command
```
npm run build
```

### Publish directory
```
dist
```

### Node.js version
```
18
```

## 檔案結構

確保以下檔案存在：
- netlify.toml
- package.json
- tsconfig.json
- vite.config.ts

## 常見問題

1. **TypeScript 錯誤**: 確保所有變數都被使用或正確移除
2. **環境變數**: 確保所有 VITE_ 前綴的變數都在 Netlify 中設定
3. **Dependencies**: 確保 package-lock.json 存在且最新
