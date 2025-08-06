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
npm ci && npm run build
```

### Publish directory
```
dist
```

### Node.js version
```
18.19.0
```

### NPM version
```
10.2.3
```

## 檔案結構

確保以下檔案存在：
- netlify.toml (Netlify 配置)
- .nvmrc (Node.js 版本)
- .npmrc (NPM 配置)
- package.json
- package-lock.json (重新生成)
- tsconfig.json
- vite.config.ts

## 常見問題

1. **TypeScript 錯誤**: 確保所有變數都被使用或正確移除
2. **環境變數**: 確保所有 VITE_ 前綴的變數都在 Netlify 中設定
3. **Dependencies**: 確保 package-lock.json 存在且最新
4. **Node.js 版本**: 使用 Node.js 18.19.0 以確保相容性
5. **NPM Cache**: 如果建置失敗，嘗試清除 NPM cache

### 故障排除步驟

如果部署失敗：

1. **清除並重新生成 package-lock.json**:
   ```bash
   rm package-lock.json
   npm cache clean --force
   npm install
   ```

2. **檢查 Node.js 版本**:
   - 確保使用 Node.js 18.19.0
   - 檢查 .nvmrc 檔案存在

3. **驗證建置命令**:
   ```bash
   npm ci && npm run build
   ```

4. **檢查環境變數**:
   - 確保所有 VITE_ 變數都在 Netlify 設定中
