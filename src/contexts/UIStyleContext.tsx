import React, { createContext, useContext, useState, useEffect } from 'react';

// UI 風格類型定義
export type UIStyle = 
  | 'modern' 
  | 'neumorphism' 
  | 'glassmorphism' 
  | 'brutalism' 
  | 'cyberpunk' 
  | 'skeuomorphism' 
  | 'dos' 
  | 'bios' 
  | 'kawaii'
  | 'code';

// 風格配置介面
interface StyleConfig {
  name: string;
  displayName: string;
  icon: string;
  description: string;
  cssClass: string;
  bodyClass?: string;
  fontFamily?: string;
}

// 風格配置表
export const STYLE_CONFIGS: Record<UIStyle, StyleConfig> = {
  modern: {
    name: 'modern',
    displayName: '極簡現代',
    icon: '🎯',
    description: '簡潔、專業、符合現代設計趨勢 (深色主題)',
    cssClass: 'ui-style-modern',
    bodyClass: 'modern-body-dark',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  neumorphism: {
    name: 'neumorphism',
    displayName: '新擬物風',
    icon: '🔘',
    description: '立體浮雕效果，獨特的視覺體驗',
    cssClass: 'ui-style-neumorphism',
    bodyClass: 'neumorphism-body',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  glassmorphism: {
    name: 'glassmorphism',
    displayName: '玻璃質感',
    icon: '💎',
    description: '半透明玻璃效果，現代科技感',
    cssClass: 'ui-style-glassmorphism',
    bodyClass: 'glassmorphism-body',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  brutalism: {
    name: 'brutalism',
    displayName: '極繁主義',
    icon: '⚡',
    description: '強烈視覺衝擊，反主流設計',
    cssClass: 'ui-style-brutalism',
    bodyClass: 'brutalism-body',
    fontFamily: 'Impact, "Arial Black", sans-serif'
  },
  cyberpunk: {
    name: 'cyberpunk',
    displayName: '未來科技',
    icon: '🤖',
    description: '霓虹發光效果，未來感設計',
    cssClass: 'ui-style-cyberpunk',
    bodyClass: 'cyberpunk-body',
    fontFamily: '"Orbitron", "Courier New", monospace'
  },
  skeuomorphism: {
    name: 'skeuomorphism',
    displayName: '擬物風格',
    icon: '📱',
    description: '模仿真實物件，直觀易理解',
    cssClass: 'ui-style-skeuomorphism',
    fontFamily: 'Georgia, "Times New Roman", serif'
  },
  dos: {
    name: 'dos',
    displayName: 'DOS復古',
    icon: '💾',
    description: '80年代電腦風格，懷舊感十足',
    cssClass: 'ui-style-dos',
    bodyClass: 'dos-body',
    fontFamily: '"Perfect DOS VGA 437", "Courier New", monospace'
  },
  bios: {
    name: 'bios',
    displayName: 'BIOS系統',
    icon: '⚙️',
    description: '系統設定界面，專業技術感',
    cssClass: 'ui-style-bios',
    bodyClass: 'bios-body',
    fontFamily: '"Courier New", monospace'
  },
  kawaii: {
    name: 'kawaii',
    displayName: '撲撲可愛',
    icon: '🌸',
    description: '日式可愛風格，療癒溫馨',
    cssClass: 'ui-style-kawaii',
    bodyClass: 'kawaii-body',
    fontFamily: '"Comic Sans MS", "Marker Felt", cursive'
  },
  code: {
    name: 'code',
    displayName: 'Code 彩蛋',
    icon: '👾',
    description: '程式碼原始感 × 極繁主義動畫的衝突美學',
    cssClass: 'ui-style-code',
    bodyClass: 'code-body',
    fontFamily: '"Fira Code", "JetBrains Mono", "Source Code Pro", monospace'
  }
};

// 風格上下文
interface UIStyleContextType {
  currentStyle: UIStyle;
  setStyle: (style: UIStyle) => void;
  styleConfig: StyleConfig;
  availableStyles: UIStyle[];
}

const UIStyleContext = createContext<UIStyleContextType | undefined>(undefined);

// 風格提供者組件
interface UIStyleProviderProps {
  children: React.ReactNode;
  defaultStyle?: UIStyle;
}

export const UIStyleProvider: React.FC<UIStyleProviderProps> = ({ 
  children, 
  defaultStyle = 'modern' 
}) => {
  const [currentStyle, setCurrentStyle] = useState<UIStyle>(() => {
    // 首先檢查 URL 參數
    const urlParams = new URLSearchParams(window.location.search);
    const urlStyle = urlParams.get('theme') as UIStyle;
    if (urlStyle && STYLE_CONFIGS[urlStyle]) {
      return urlStyle;
    }
    
    // 然後從 localStorage 讀取保存的風格
    const savedStyle = localStorage.getItem('ui-style') as UIStyle;
    return savedStyle && STYLE_CONFIGS[savedStyle] ? savedStyle : defaultStyle;
  });

  const setStyle = (style: UIStyle) => {
    setCurrentStyle(style);
    localStorage.setItem('ui-style', style);
  };

  // 監聽 URL 參數變化
  useEffect(() => {
    const handleURLChange = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const urlStyle = urlParams.get('theme') as UIStyle;
      if (urlStyle && STYLE_CONFIGS[urlStyle] && urlStyle !== currentStyle) {
        setCurrentStyle(urlStyle);
      }
    };

    // 監聽 popstate 事件
    window.addEventListener('popstate', handleURLChange);
    
    return () => {
      window.removeEventListener('popstate', handleURLChange);
    };
  }, [currentStyle]);

  const styleConfig = STYLE_CONFIGS[currentStyle];
  const availableStyles = Object.keys(STYLE_CONFIGS) as UIStyle[];

  // 應用樣式到 document
  useEffect(() => {
    const body = document.body;
    const html = document.documentElement;

    // 清除所有風格類別
    availableStyles.forEach(style => {
      const config = STYLE_CONFIGS[style];
      body.classList.remove(config.cssClass);
      if (config.bodyClass) {
        body.classList.remove(config.bodyClass);
      }
    });

    // 應用當前風格
    body.classList.add(styleConfig.cssClass);
    if (styleConfig.bodyClass) {
      body.classList.add(styleConfig.bodyClass);
    }

    // 設置字體
    if (styleConfig.fontFamily) {
      body.style.fontFamily = styleConfig.fontFamily;
    }

    // 設置風格特定的 CSS 變數
    const root = html.style;
    switch (currentStyle) {
      case 'neumorphism':
        root.setProperty('--style-primary', '#f0f0f3');
        root.setProperty('--style-secondary', '#cacdd1');
        root.setProperty('--style-text', '#555');
        break;
      case 'glassmorphism':
        root.setProperty('--style-primary', 'rgba(255, 255, 255, 0.1)');
        root.setProperty('--style-secondary', 'rgba(255, 255, 255, 0.2)');
        root.setProperty('--style-text', '#333');
        break;
      case 'brutalism':
        root.setProperty('--style-primary', '#ff0080');
        root.setProperty('--style-secondary', '#00ffff');
        root.setProperty('--style-text', '#ffffff');
        root.setProperty('--style-bg', '#000000');
        break;
      case 'cyberpunk':
        root.setProperty('--style-primary', '#00ffff');
        root.setProperty('--style-secondary', '#ff0080');
        root.setProperty('--style-text', '#00ffff');
        root.setProperty('--style-bg', '#0a0a0a');
        break;
      case 'dos':
        root.setProperty('--style-primary', '#000080');
        root.setProperty('--style-secondary', '#c0c0c0');
        root.setProperty('--style-text', '#ffffff');
        root.setProperty('--style-bg', '#000080');
        break;
      case 'bios':
        root.setProperty('--style-primary', '#008080');
        root.setProperty('--style-secondary', '#00ffff');
        root.setProperty('--style-text', '#00ffff');
        root.setProperty('--style-bg', '#000040');
        break;
      case 'kawaii':
        root.setProperty('--style-primary', '#FF69B4');
        root.setProperty('--style-secondary', '#FFB6C1');
        root.setProperty('--style-text', '#FF1493');
        root.setProperty('--style-bg', '#FFF0F5');
        break;
      case 'code':
        root.setProperty('--style-primary', '#61DAFB');
        root.setProperty('--style-secondary', '#F7DF1E');
        root.setProperty('--style-text', '#61DAFB');
        root.setProperty('--style-bg', '#0D1117');
        root.setProperty('--style-accent-1', '#FF6B6B');
        root.setProperty('--style-accent-2', '#4ECDC4');
        root.setProperty('--style-accent-3', '#45B7D1');
        root.setProperty('--style-accent-4', '#96CEB4');
        root.setProperty('--style-accent-5', '#FFEAA7');
        root.setProperty('--style-accent-6', '#DDA0DD');
        break;
      default: // modern
        root.setProperty('--style-primary', 'var(--color-primary)');
        root.setProperty('--style-secondary', 'var(--color-secondary)');
        root.setProperty('--style-text', 'var(--color-gray-900)');
        root.setProperty('--style-bg', 'var(--color-white)');
    }

    return () => {
      // 清理函數：重置字體
      body.style.fontFamily = '';
    };
  }, [currentStyle, styleConfig, availableStyles]);

  const contextValue: UIStyleContextType = {
    currentStyle,
    setStyle,
    styleConfig,
    availableStyles
  };

  return (
    <UIStyleContext.Provider value={contextValue}>
      {children}
    </UIStyleContext.Provider>
  );
};

// 使用風格的 Hook
export const useUIStyle = (): UIStyleContextType => {
  const context = useContext(UIStyleContext);
  if (!context) {
    throw new Error('useUIStyle must be used within a UIStyleProvider');
  }
  return context;
};

// 風格切換器組件
export const StyleSwitcher: React.FC = () => {
  const { currentStyle, setStyle, availableStyles } = useUIStyle();
  
  // 檢查 Code 風格是否已解鎖
  const isCodeUnlocked = localStorage.getItem('code-style-unlocked') === 'true';
  const displayStyles = isCodeUnlocked ? availableStyles : availableStyles.filter(style => style !== 'code');

  // 根據當前風格獲取選擇器的配色
  const getSelectorColors = (style: string) => {
    switch (style) {
      case 'brutalism':
        return {
          bg: '#000000',
          text: '#ffffff',
          border: '#ffffff',
          focusBorder: '#ff0080'
        }
      case 'cyberpunk':
        return {
          bg: 'linear-gradient(135deg, #0a0a0a, #1a0033)',
          text: '#00ffff',
          border: '#00ffff',
          focusBorder: '#ff0080'
        }
      case 'dos':
        return {
          bg: '#0000aa',
          text: '#ffffff',
          border: '#c0c0c0',
          focusBorder: '#ffff00'
        }
      case 'bios':
        return {
          bg: '#000040',
          text: '#00ffff',
          border: '#008080',
          focusBorder: '#ffff00'
        }
      case 'code':
        return {
          bg: '#0D1117',
          text: '#C9D1D9',
          border: '#21262D',
          focusBorder: '#61DAFB'
        }
      case 'kawaii':
        return {
          bg: '#FFF0F5',
          text: '#8B008B',
          border: '#FF69B4',
          focusBorder: '#FF1493'
        }
      case 'neumorphism':
        return {
          bg: 'linear-gradient(145deg, #f0f0f3, #cacdd1)',
          text: '#555555',
          border: 'none',
          focusBorder: '#667eea'
        }
      case 'glassmorphism':
        return {
          bg: 'rgba(255, 255, 255, 0.1)',
          text: '#333333',
          border: 'rgba(255, 255, 255, 0.2)',
          focusBorder: 'rgba(255, 255, 255, 0.4)'
        }
      case 'skeuomorphism':
        return {
          bg: 'linear-gradient(145deg, #ffffff, #f0f0f0)',
          text: '#333333',
          border: '#D1D1D6',
          focusBorder: '#007AFF'
        }
      default: // modern
        return {
          bg: '#ffffff',
          text: '#1f2937',
          border: '#e5e7eb',
          focusBorder: '#2563eb'
        }
    }
  }

  const colors = getSelectorColors(currentStyle)

  return (
    <div style={{ position: 'relative' }}>
      <select 
        value={currentStyle} 
        onChange={(e) => setStyle(e.target.value as UIStyle)}
        style={{
          padding: '6px 12px',
          background: colors.bg,
          color: colors.text,
          border: currentStyle === 'neumorphism' ? 'none' : 
                 currentStyle === 'brutalism' ? `2px solid ${colors.border}` :
                 `1px solid ${colors.border}`,
          borderRadius: currentStyle === 'brutalism' || currentStyle === 'dos' || currentStyle === 'bios' ? '0' :
                       currentStyle === 'kawaii' ? '15px' :
                       currentStyle === 'neumorphism' ? '12px' : '6px',
          fontSize: '14px',
          fontWeight: currentStyle === 'brutalism' || currentStyle === 'dos' ? '900' : '500',
          fontFamily: currentStyle === 'brutalism' ? 'Impact, "Arial Black", sans-serif' :
                     currentStyle === 'dos' || currentStyle === 'bios' ? 'monospace' :
                     currentStyle === 'code' ? 'Consolas, Monaco, "Courier New", monospace' :
                     currentStyle === 'kawaii' ? '"Comic Sans MS", "Marker Felt", cursive' : 'inherit',
          textTransform: currentStyle === 'brutalism' || currentStyle === 'dos' ? 'uppercase' : 'none',
          cursor: 'pointer',
          minWidth: '150px',
          boxShadow: currentStyle === 'brutalism' ? '2px 2px 0px #ffffff' :
                    currentStyle === 'cyberpunk' ? '0 0 8px rgba(0, 255, 255, 0.3)' :
                    currentStyle === 'kawaii' ? '0 4px 8px rgba(255, 105, 180, 0.3)' :
                    currentStyle === 'neumorphism' ? 'inset 6px 6px 12px #bebebe, inset -6px -6px 12px #ffffff' :
                    currentStyle === 'glassmorphism' ? '0 4px 16px rgba(31, 38, 135, 0.2)' :
                    currentStyle === 'skeuomorphism' ? '0 2px 4px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.4)' :
                    '0 1px 3px rgba(0, 0, 0, 0.1)',
          backdropFilter: currentStyle === 'glassmorphism' ? 'blur(10px)' : 'none',
          transform: currentStyle === 'brutalism' ? 'rotate(-1deg)' : 'none'
        }}
      >
        {displayStyles.map(style => {
          const config = STYLE_CONFIGS[style];
          return (
            <option 
              key={style} 
              value={style}
              style={{
                background: colors.bg,
                color: colors.text
              }}
            >
              {config.icon} {config.displayName}
            </option>
          );
        })}
      </select>
    </div>
  );
};
