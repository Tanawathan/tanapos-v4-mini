import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUIStyle, StyleSwitcher } from '../contexts/UIStyleContext';

const ModernNavigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentStyle, styleConfig } = useUIStyle();
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  // 檢測螢幕尺寸
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      setIsMobile(width <= 639);
      setIsTablet(width >= 640 && width <= 1023);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // 根據 UI 風格獲取導航欄主題配色
  const getNavThemeColors = (style: string) => {
    switch (style) {
      case 'brutalism':
        return {
          navBg: '#000000',
          navText: '#ffffff',
          navBorder: '#ffffff',
          activeBg: '#ff0080',
          activeText: '#000000',
          hoverBg: '#333333',
          logoBg: '#ff0080',
          logoText: '#000000'
        }
      case 'cyberpunk':
        return {
          navBg: 'linear-gradient(135deg, #0a0a0a 0%, #1a0033 50%, #000 100%)',
          navText: '#00ffff',
          navBorder: '#00ffff',
          activeBg: '#00ffff',
          activeText: '#000000',
          hoverBg: 'rgba(0, 255, 255, 0.1)',
          logoBg: 'linear-gradient(45deg, #00ffff, #ff0080)',
          logoText: '#000000'
        }
      case 'dos':
        return {
          navBg: '#0000aa',
          navText: '#ffffff',
          navBorder: '#c0c0c0',
          activeBg: '#ffff00',
          activeText: '#000000',
          hoverBg: '#000080',
          logoBg: '#ffff00',
          logoText: '#000000'
        }
      case 'bios':
        return {
          navBg: 'linear-gradient(to bottom, #000040, #000080)',
          navText: '#00ffff',
          navBorder: '#008080',
          activeBg: '#ffff00',
          activeText: '#000000',
          hoverBg: 'rgba(0, 255, 255, 0.1)',
          logoBg: '#008080',
          logoText: '#000040'
        }
      case 'code':
        return {
          navBg: '#0D1117',
          navText: '#C9D1D9',
          navBorder: '#21262D',
          activeBg: '#61DAFB',
          activeText: '#0D1117',
          hoverBg: '#21262D',
          logoBg: '#61DAFB',
          logoText: '#0D1117'
        }
      case 'kawaii':
        return {
          navBg: 'linear-gradient(135deg, #FFF0F5, #FFE4E1)',
          navText: '#8B008B',
          navBorder: '#FF69B4',
          activeBg: '#FF69B4',
          activeText: '#ffffff',
          hoverBg: 'rgba(255, 105, 180, 0.1)',
          logoBg: '#FF69B4',
          logoText: '#ffffff'
        }
      case 'neumorphism':
        return {
          navBg: 'linear-gradient(145deg, #f0f0f3, #cacdd1)',
          navText: '#555555',
          navBorder: 'none',
          activeBg: '#667eea',
          activeText: '#ffffff',
          hoverBg: 'rgba(102, 126, 234, 0.1)',
          logoBg: '#667eea',
          logoText: '#ffffff'
        }
      case 'glassmorphism':
        return {
          navBg: 'rgba(255, 255, 255, 0.1)',
          navText: '#333333',
          navBorder: 'rgba(255, 255, 255, 0.2)',
          activeBg: 'rgba(255, 255, 255, 0.3)',
          activeText: '#333333',
          hoverBg: 'rgba(255, 255, 255, 0.05)',
          logoBg: 'rgba(255, 255, 255, 0.2)',
          logoText: '#333333'
        }
      case 'skeuomorphism':
        return {
          navBg: 'linear-gradient(135deg, #f5f5f5, #e8e8e8)',
          navText: '#333333',
          navBorder: '#D1D1D6',
          activeBg: '#007AFF',
          activeText: '#ffffff',
          hoverBg: 'rgba(0, 122, 255, 0.1)',
          logoBg: '#007AFF',
          logoText: '#ffffff'
        }
      default: // modern
        return {
          navBg: '#ffffff',
          navText: '#1f2937',
          navBorder: '#e5e7eb',
          activeBg: '#2563eb',
          activeText: '#ffffff',
          hoverBg: '#f3f4f6',
          logoBg: '#2563eb',
          logoText: '#ffffff'
        }
    }
  }

  const themeColors = getNavThemeColors(currentStyle)

  const navigationItems = [
    { path: '/', label: '首頁', icon: '🏠' },
    { path: '/pos-simple', label: '點餐', icon: '🛒' },
    { path: '/tables', label: '桌台', icon: '🪑' },
    { path: '/orders', label: '訂單', icon: '📋' },
    { path: '/checkout', label: '結帳', icon: '💰' },
    { path: '/checkout-post-meal', label: '餐後', icon: '🍽️' },
    { path: '/kds', label: '廚房', icon: '👨‍🍳' },
    { path: '/inventory', label: '庫存', icon: '📦' },
    { path: '/reports', label: '報表', icon: '📊' },
    { path: '/admin', label: '後台', icon: '⚙️' },
    { path: '/ui-styles', label: '風格', icon: '🎨' },
  ];

  const isActivePath = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <nav style={{
      background: themeColors.navBg,
      borderBottom: currentStyle === 'neumorphism' ? 'none' : 
                   currentStyle === 'brutalism' ? `4px solid ${themeColors.navBorder}` :
                   currentStyle === 'kawaii' ? `2px solid ${themeColors.navBorder}` :
                   `1px solid ${themeColors.navBorder}`,
      boxShadow: currentStyle === 'brutalism' ? '0 8px 0px #00ffff' :
                currentStyle === 'cyberpunk' ? '0 4px 20px rgba(0, 255, 255, 0.3)' :
                currentStyle === 'kawaii' ? '0 4px 20px rgba(255, 105, 180, 0.3)' :
                currentStyle === 'neumorphism' ? '0 8px 16px #bebebe, 0 -8px 16px #ffffff' :
                currentStyle === 'glassmorphism' ? '0 8px 32px rgba(31, 38, 135, 0.37)' :
                currentStyle === 'skeuomorphism' ? '0 2px 8px rgba(0, 0, 0, 0.15)' :
                currentStyle === 'code' ? '0 1px 3px rgba(0, 0, 0, 0.3)' : '0 1px 3px rgba(0, 0, 0, 0.1)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      backdropFilter: currentStyle === 'glassmorphism' ? 'blur(10px)' : 'none',
      fontFamily: currentStyle === 'brutalism' ? 'Impact, "Arial Black", sans-serif' :
                 currentStyle === 'dos' || currentStyle === 'bios' ? 'monospace' :
                 currentStyle === 'code' ? 'Consolas, Monaco, "Courier New", monospace' :
                 currentStyle === 'kawaii' ? '"Comic Sans MS", "Marker Felt", cursive' : 'inherit'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 1.5rem'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: isMobile ? '3rem' : isTablet ? '3.5rem' : '4rem', // 手機3rem，平板3.5rem，桌面4rem
          minHeight: isMobile ? '3rem' : isTablet ? '3.5rem' : '4rem'
        }}>
          {/* Logo - 純裝飾性品牌標識 */}
          <div 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.75rem'
            }}
          >
            <div style={{
              width: isMobile ? '2rem' : isTablet ? '2.25rem' : '2.5rem', // 響應式Logo尺寸
              height: isMobile ? '2rem' : isTablet ? '2.25rem' : '2.5rem',
              background: themeColors.logoBg,
              borderRadius: currentStyle === 'brutalism' || currentStyle === 'dos' || currentStyle === 'bios' ? '0' :
                          currentStyle === 'kawaii' ? '50%' :
                          currentStyle === 'neumorphism' ? '50%' : '0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: isMobile ? '1rem' : isTablet ? '1.125rem' : '1.25rem', // 響應式圖標尺寸
              boxShadow: currentStyle === 'brutalism' ? '3px 3px 0px #ffffff' :
                        currentStyle === 'cyberpunk' ? '0 0 10px rgba(0, 255, 255, 0.5)' :
                        currentStyle === 'kawaii' ? '0 4px 8px rgba(255, 105, 180, 0.3)' :
                        currentStyle === 'neumorphism' ? '6px 6px 12px #bebebe, -6px -6px 12px #ffffff' :
                        currentStyle === 'skeuomorphism' ? '0 2px 4px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.4)' : 'none',
              transform: currentStyle === 'brutalism' ? 'rotate(-2deg)' : 'none'
            }}>
              🍽️
            </div>
            <span 
              style={{
                fontSize: isMobile ? '1rem' : isTablet ? '1.125rem' : '1.25rem', // 響應式文字尺寸
                fontWeight: currentStyle === 'brutalism' || currentStyle === 'dos' ? '900' : '700',
                color: themeColors.logoText,
                display: isMobile ? 'none' : 'inline',
                textTransform: currentStyle === 'brutalism' || currentStyle === 'dos' ? 'uppercase' : 'none',
                textShadow: currentStyle === 'cyberpunk' ? '0 0 10px rgba(0, 255, 255, 0.5)' :
                           currentStyle === 'kawaii' ? '0 2px 4px rgba(255, 105, 180, 0.3)' : 'none',
                transform: currentStyle === 'brutalism' ? 'rotate(1deg)' : 'none'
              }}
            >
              TanaPOS
            </span>
          </div>

          {/* Navigation Items */}
          <div style={{ display: 'flex', gap: isMobile ? '0.25rem' : isTablet ? '0.375rem' : '0.5rem' }}>
            {navigationItems.map((item) => {
              const isActive = isActivePath(item.path)
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: isMobile ? '0.25rem' : isTablet ? '0.375rem' : '0.5rem',
                    padding: isMobile ? '0.375rem 0.5rem' : isTablet ? '0.4rem 0.75rem' : '0.5rem 1rem', // 三級響應式內邊距
                    backgroundColor: isActive ? themeColors.activeBg : 'transparent',
                    color: isActive ? themeColors.activeText : themeColors.navText,
                    border: currentStyle === 'brutalism' ? `2px solid ${themeColors.navBorder}` :
                           currentStyle === 'kawaii' ? `1px solid ${themeColors.navBorder}` :
                           currentStyle === 'skeuomorphism' ? `1px solid ${themeColors.navBorder}` : 'none',
                    borderRadius: currentStyle === 'brutalism' || currentStyle === 'dos' || currentStyle === 'bios' ? '0' :
                                 currentStyle === 'kawaii' ? '20px' :
                                 currentStyle === 'neumorphism' ? '12px' : '6px',
                    fontSize: isMobile ? '12px' : isTablet ? '13px' : '14px', // 三級響應式字體
                    fontWeight: currentStyle === 'brutalism' || currentStyle === 'dos' ? '900' : '500',
                    cursor: 'pointer',
                    textTransform: currentStyle === 'brutalism' || currentStyle === 'dos' ? 'uppercase' : 'none',
                    transition: 'all 0.2s ease',
                    boxShadow: isActive && currentStyle === 'brutalism' ? '2px 2px 0px #ffffff' :
                              isActive && currentStyle === 'cyberpunk' ? '0 0 8px rgba(0, 255, 255, 0.3)' :
                              isActive && currentStyle === 'kawaii' ? '0 4px 8px rgba(255, 105, 180, 0.3)' :
                              isActive && currentStyle === 'neumorphism' ? 'inset 3px 3px 6px #bebebe, inset -3px -3px 6px #ffffff' :
                              isActive && currentStyle === 'skeuomorphism' ? 'inset 0 2px 4px rgba(0, 0, 0, 0.2)' : 'none',
                    transform: currentStyle === 'brutalism' && isActive ? 'rotate(-1deg)' : 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = themeColors.hoverBg
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'transparent'
                    }
                  }}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              )
            })}
          </div>

          {/* User Actions */}
          <div style={{ display: 'flex', gap: isMobile ? '0.25rem' : isTablet ? '0.375rem' : '0.5rem', alignItems: 'center' }}>
            {/* 風格切換器 */}
            <StyleSwitcher />
            
            <button 
              style={{
                padding: '0.5rem',
                backgroundColor: 'transparent',
                color: themeColors.navText,
                border: currentStyle === 'brutalism' ? `2px solid ${themeColors.navBorder}` :
                       currentStyle === 'kawaii' ? `1px solid ${themeColors.navBorder}` : 'none',
                borderRadius: currentStyle === 'brutalism' || currentStyle === 'dos' || currentStyle === 'bios' ? '0' :
                             currentStyle === 'kawaii' ? '50%' : '6px',
                fontSize: '16px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: currentStyle === 'neumorphism' ? '3px 3px 6px #bebebe, -3px -3px 6px #ffffff' : 'none'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = themeColors.hoverBg
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              🌙
            </button>
            <button 
              style={{
                padding: '0.5rem',
                backgroundColor: 'transparent',
                color: themeColors.navText,
                border: currentStyle === 'brutalism' ? `2px solid ${themeColors.navBorder}` :
                       currentStyle === 'kawaii' ? `1px solid ${themeColors.navBorder}` : 'none',
                borderRadius: currentStyle === 'brutalism' || currentStyle === 'dos' || currentStyle === 'bios' ? '0' :
                             currentStyle === 'kawaii' ? '50%' : '6px',
                fontSize: '16px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: currentStyle === 'neumorphism' ? '3px 3px 6px #bebebe, -3px -3px 6px #ffffff' : 'none'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = themeColors.hoverBg
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              👤
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default ModernNavigation;
