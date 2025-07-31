# TanaPOS 現代化設計系統文檔

## 🎨 設計理念

TanaPOS V4 採用**極簡風格 + 卡片式設計**的現代設計系統，著重於：

- **簡潔易用**：減少視覺干擾，提升使用者專注度
- **模組化**：卡片式組件便於響應式佈局和功能組織
- **專業感**：商業級別的視覺呈現，適合餐廳營運環境
- **易維護**：統一的設計語言和組件系統

## 🌈 色彩系統

### 主色調
- **Primary**: `#2563eb` (藍色) - 主要操作按鈕、重要資訊
- **Secondary**: `#f1f5f9` (淺灰) - 次要背景、輔助元素
- **Accent**: `#10b981` (綠色) - 成功狀態、正面反饋
- **Warning**: `#f59e0b` (橙色) - 警告提示
- **Danger**: `#ef4444` (紅色) - 錯誤、危險操作

### 中性色調
- 採用 9 階灰度色階，從 `gray-50` 到 `gray-900`
- 支援完整的深色模式切換
- 確保良好的對比度和可讀性

## 📐 間距與尺寸

### 間距系統
```css
--space-xs: 0.25rem   /* 4px */
--space-sm: 0.5rem    /* 8px */
--space-md: 1rem      /* 16px */
--space-lg: 1.5rem    /* 24px */
--space-xl: 2rem      /* 32px */
--space-2xl: 3rem     /* 48px */
```

### 圓角系統
```css
--radius-sm: 0.25rem  /* 4px */
--radius-md: 0.375rem /* 6px */
--radius-lg: 0.5rem   /* 8px */
--radius-xl: 0.75rem  /* 12px */
--radius-2xl: 1rem    /* 16px */
```

## 🔤 字體系統

### 字體家族
- 主要字體：`Inter`, `Noto Sans TC`, `system-ui`
- 優先載入 Web 字體，回退到系統字體

### 字體尺寸
```css
--font-size-xs: 0.75rem    /* 12px */
--font-size-sm: 0.875rem   /* 14px */
--font-size-base: 1rem     /* 16px */
--font-size-lg: 1.125rem   /* 18px */
--font-size-xl: 1.25rem    /* 20px */
--font-size-2xl: 1.5rem    /* 24px */
--font-size-3xl: 1.875rem  /* 30px */
```

## 🧩 組件系統

### 卡片組件 (`.modern-card`)
- 基礎容器，帶圓角和陰影
- 支援懸停效果 (hover lift)
- 標準化的內邊距和間距

### 按鈕系統 (`.modern-btn-*`)
- **Primary**: 主要操作
- **Secondary**: 次要操作  
- **Success**: 確認操作
- **Danger**: 危險操作
- **Ghost**: 透明背景

### 輸入框 (`.modern-input`)
- 統一的邊框和焦點樣式
- 支援佔位符文字
- 無障礙友善的焦點指示

### 表格 (`.modern-table`)
- 簡潔的行列設計
- 懸停行高亮
- 響應式滾動

### 徽章 (`.modern-badge-*`)
- 狀態指示器
- 支援不同語義色彩
- 統一的尺寸和字重

## 📱 響應式設計

### 斷點系統
- **Mobile**: `< 768px`
- **Tablet**: `768px - 1024px`
- **Desktop**: `> 1024px`

### 網格系統
- `.modern-grid-2`: 2 欄自適應網格
- `.modern-grid-3`: 3 欄自適應網格  
- `.modern-grid-4`: 4 欄自適應網格
- 自動響應式調整，行動裝置為單欄

## ✨ 微互動效果

### 懸停效果
- 卡片：輕微上浮 (`translateY(-2px)`)
- 按鈕：上浮 + 陰影增強
- 互動元素：輕微縮放 (`scale(1.02)`)

### 點擊效果
- 壓縮效果 (`scale(0.98)`)
- 快速回彈動畫

### 過渡動畫
- **Fast**: `150ms ease-in-out` - 按鈕、小元素
- **Normal**: `300ms ease-in-out` - 卡片、模態框
- **Slow**: `500ms ease-in-out` - 頁面切換

## 🌓 深色模式支援

### 色彩適配
- 自動調整主色調亮度
- 背景色完全反轉
- 保持良好的對比度

### 切換機制
- 使用 CSS 類別 `.dark` 切換
- 支援系統主題偵測
- 用戶偏好本地儲存

## 🎯 使用指南

### 新建頁面
1. 使用 `modern-container` 作為主容器
2. 添加 `modern-page-header` 設定頁面標題
3. 使用 `modern-grid` 系統組織內容
4. 所有卡片內容使用 `modern-card`

### 表單設計
1. 使用 `modern-input` 統一輸入框樣式
2. 按鈕使用對應的語義類別
3. 錯誤訊息使用 `modern-badge-danger`
4. 成功反饋使用 `modern-badge-success`

### 數據展示
1. 表格使用 `modern-table`
2. 統計數據使用卡片 + 徽章組合
3. 狀態指示器使用對應色彩的徽章

## 🔧 擴展性

### 添加新色彩
在 `modern-design.css` 中的 `:root` 添加新的 CSS 變數

### 新增組件
1. 遵循 `.modern-*` 命名慣例
2. 使用設計系統的色彩和間距變數
3. 確保響應式支援和深色模式適配

### 客製化主題
修改 CSS 變數即可快速調整整體風格，無需修改個別組件

## 📊 設計優勢

1. **統一性**: 所有頁面使用相同的設計語言
2. **擴展性**: 模組化的組件系統易於維護
3. **可用性**: 符合現代使用者體驗標準
4. **效能**: 純 CSS 實現，無額外 JavaScript 負擔
5. **可訪問性**: 支援鍵盤導航和螢幕閱讀器

---

*設計系統版本: 1.0.0*  
*最後更新: 2025年7月31日*
