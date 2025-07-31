import React from 'react';
import { useUIStyle, STYLE_CONFIGS } from '../contexts/UIStyleContext';

const UIStyleShowcase: React.FC = () => {
  const { currentStyle, setStyle, availableStyles } = useUIStyle();

  const getStyleFeatures = (style: string) => {
    const features = {
      modern: ['大量留白設計', '精簡的視覺元素', '統一的配色方案', '現代化字體', 'subtle 微互動效果'],
      neumorphism: ['內凹/凸陰影效果', '浮雕質感設計', '統一的材質感', '柔和的色彩過渡', '立體層次感'],
      glassmorphism: ['模糊半透明背景', '玻璃質感邊框', '漸層色彩運用', '現代科技感', '層次透明效果'],
      brutalism: ['強烈對比色彩', '粗體字型運用', '不規則排版', '視覺衝擊力強', '反主流設計'],
      cyberpunk: ['螢光色彩搭配', '黑色背景基調', '科技感字體', '霓虹發光效果', '未來感設計'],
      skeuomorphism: ['模仿真實物件', '立體陰影效果', '材質紋理運用', '傳統設計感', '直觀易理解'],
      dos: ['經典藍色背景', 'DOS 字體風格', '命令行界面感', '復古電腦美學', '像素完美邊框'],
      bios: ['系統設定界面', '青色文字顯示', '功能鍵提示', '技術感佈局', '專業系統風格'],
      kawaii: ['粉色系可愛配色', '圓潤卡通字體', '表情符號裝飾', '彈跳動畫效果', '日式可愛美學']
    };
    return features[style as keyof typeof features] || [];
  };

  const getStyleScenarios = (style: string) => {
    const scenarios = {
      modern: '適合商業系統、企業應用、需要專業感的產品。提升使用者專注度，減少視覺干擾，符合現代設計趨勢。',
      neumorphism: '適合概念設計、創意展示、健康追蹤應用。獨特的視覺效果，但需注意無障礙性和對比度問題。',
      glassmorphism: '適合科技品牌、操作系統介面、現代 Web 應用。具有未來感和科技感，適合年輕用戶群體。',
      brutalism: '適合創意產業、藝術展示、個性化品牌。強烈的視覺衝擊，適合需要突出個性的應用。',
      cyberpunk: '適合遊戲界面、科幻應用、AR/VR 平台。強烈的未來科技感，適合科技愛好者。',
      skeuomorphism: '適合傳統行業、年長用戶群、需要直觀操作的應用。容易理解和學習，但可能顯得過時。',
      dos: '適合復古主題餐廳、科技博物館、懷舊風格應用。喚起80-90年代電腦使用體驗，具有強烈的懷舊感。',
      bios: '適合技術人員工具、系統管理界面、專業診斷應用。營造專業技術感，適合 IT 從業人員和技術愛好者。',
      kawaii: '適合兒童餐廳、主題咖啡廳、年輕女性客群應用。可愛療癒的視覺體驗，增加親和力和記憶點。'
    };
    return scenarios[style as keyof typeof scenarios] || '';
  };

  return (
    <div className="modern-container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
      <div className="modern-page-header">
        <h1 className="modern-page-title">UI 風格展示館</h1>
        <p className="modern-page-subtitle">
          探索不同的設計風格，為您的系統選擇最適合的視覺呈現
          <br />
          <strong>🎯 現在所有風格都是真實可用的！</strong>
        </p>
      </div>

      {/* 風格選擇器 */}
      <div className="modern-card" style={{ marginBottom: '2rem' }}>
        <div className="modern-card-header">
          <h3 className="modern-card-title">選擇風格</h3>
          <p className="modern-card-subtitle">
            點擊下方按鈕切換不同的 UI 風格，整個系統界面將立即切換
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {availableStyles.map((style) => {
            const config = STYLE_CONFIGS[style];
            return (
              <button
                key={style}
                className={`modern-btn ${currentStyle === style ? 'modern-btn-primary' : 'modern-btn-secondary'}`}
                onClick={() => setStyle(style)}
                style={{ textTransform: 'capitalize' }}
              >
                {config.icon} {config.displayName}
              </button>
            );
          })}
        </div>
      </div>

      {/* 當前風格展示 */}
      <div className="modern-card" style={{ marginBottom: '2rem' }}>
        <div className="modern-card-header">
          <h3 className="modern-card-title">
            當前風格：{STYLE_CONFIGS[currentStyle].displayName}
          </h3>
          <p className="modern-card-subtitle">
            {STYLE_CONFIGS[currentStyle].description}
          </p>
        </div>
        <div style={{ 
          border: '1px solid var(--color-gray-200)', 
          borderRadius: 'var(--radius-lg)', 
          overflow: 'hidden',
          background: ['cyberpunk', 'dos', 'bios'].includes(currentStyle) ? '#000' : '#f9f9f9',
          padding: '2rem',
          textAlign: 'center'
        }}>
          <h4 style={{ margin: '0 0 1rem 0', fontSize: '1.5rem', fontWeight: '600' }}>
            🎨 當前界面已應用 {STYLE_CONFIGS[currentStyle].displayName} 風格
          </h4>
          <p style={{ margin: '0 0 1rem 0', opacity: 0.8, fontSize: '1.1rem' }}>
            ✅ 導航欄、按鈕、卡片等所有 UI 組件已自動切換到此風格
          </p>
          <p style={{ margin: 0, opacity: 0.7 }}>
            你可以導航到其他頁面（如點餐、桌台管理等），風格設定會保持一致
          </p>

          {/* 實時風格預覽 */}
          <div style={{ 
            marginTop: '2rem', 
            padding: '1rem', 
            border: '1px dashed rgba(0,0,0,0.2)', 
            borderRadius: '0.5rem' 
          }}>
            <h5 style={{ margin: '0 0 1rem 0' }}>實時預覽區域</h5>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button className="modern-btn modern-btn-primary">主要按鈕</button>
              <button className="modern-btn modern-btn-secondary">次要按鈕</button>
              <button className="modern-btn modern-btn-ghost">幽靈按鈕</button>
            </div>
          </div>
        </div>
      </div>

      {/* 如何使用說明 */}
      <div className="modern-card" style={{ marginBottom: '2rem' }}>
        <div className="modern-card-header">
          <h3 className="modern-card-title">如何使用真實風格系統</h3>
        </div>
        <div>
          <ol style={{ margin: 0, paddingLeft: '1.5rem', lineHeight: '1.8' }}>
            <li>
              <strong>即時切換：</strong>選擇任何風格，系統會立即應用到所有頁面
            </li>
            <li>
              <strong>持久保存：</strong>風格選擇會保存在瀏覽器中，下次訪問時自動恢復
            </li>
            <li>
              <strong>全局生效：</strong>導航到點餐、桌台、訂單等任何頁面，風格都會保持一致
            </li>
            <li>
              <strong>導航欄切換：</strong>右上角的風格選擇器可以隨時切換風格
            </li>
            <li>
              <strong>響應式設計：</strong>所有風格都支援手機、平板、桌面等不同設備
            </li>
          </ol>
        </div>
      </div>

      {/* 風格說明 */}
      <div className="modern-grid modern-grid-2" style={{ gap: '1.5rem' }}>
        <div className="modern-card">
          <div className="modern-card-header">
            <h3 className="modern-card-title">風格特徵</h3>
          </div>
          <div>
            <ul style={{ margin: 0, paddingLeft: '1.5rem', lineHeight: '1.6' }}>
              {getStyleFeatures(currentStyle).map((feature, index) => (
                <li key={index}>{feature}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="modern-card">
          <div className="modern-card-header">
            <h3 className="modern-card-title">適用場景</h3>
          </div>
          <div>
            <p style={{ margin: 0, lineHeight: '1.6', color: 'var(--color-gray-600)' }}>
              {getStyleScenarios(currentStyle)}
            </p>
          </div>
        </div>
      </div>

      {/* 技術實現說明 */}
      <div className="modern-card" style={{ marginTop: '2rem' }}>
        <div className="modern-card-header">
          <h3 className="modern-card-title">技術實現</h3>
        </div>
        <div>
          <div className="modern-grid modern-grid-3" style={{ gap: '1rem' }}>
            <div>
              <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', fontWeight: '600' }}>
                🎯 React Context
              </h4>
              <p style={{ margin: 0, fontSize: '0.875rem', opacity: 0.8 }}>
                使用 UIStyleProvider 提供全局風格狀態管理
              </p>
            </div>
            <div>
              <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', fontWeight: '600' }}>
                🎨 CSS 變數
              </h4>
              <p style={{ margin: 0, fontSize: '0.875rem', opacity: 0.8 }}>
                動態設置 CSS 自定義屬性，實現即時風格切換
              </p>
            </div>
            <div>
              <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', fontWeight: '600' }}>
                💾 本地存儲
              </h4>
              <p style={{ margin: 0, fontSize: '0.875rem', opacity: 0.8 }}>
                風格選擇保存在 localStorage，持久化用戶偏好
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UIStyleShowcase;
