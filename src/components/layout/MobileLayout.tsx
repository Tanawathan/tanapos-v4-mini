import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useUIStyle } from '../../contexts/UIStyleContext'

// 手機專用佈局組件 - 無導航列版本
const MobileLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [showMenu, setShowMenu] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { currentStyle } = useUIStyle()

  // 檢查當前是否為行動點餐頁面
  const isMobilePOSPage = location.pathname === '/mobile'

  // 主題顏色配置
  const themeColors = {
    background: currentStyle === 'modern' ? '#ffffff' :
               currentStyle === 'neumorphism' ? '#e0e5ec' :
               currentStyle === 'glassmorphism' ? 'rgba(15, 23, 42, 0.9)' :
               currentStyle === 'brutalism' ? '#ffffff' :
               currentStyle === 'cyberpunk' ? '#0a0a0a' :
               currentStyle === 'dos' ? '#0000aa' :
               currentStyle === 'bios' ? '#003366' :
               currentStyle === 'kawaii' ? '#ffe0f0' :
               '#ffffff',
               
    primary: currentStyle === 'modern' ? '#007bff' :
            currentStyle === 'neumorphism' ? '#5a67d8' :
            currentStyle === 'glassmorphism' ? '#ffffff' :
            currentStyle === 'brutalism' ? '#000000' :
            currentStyle === 'cyberpunk' ? '#00ffff' :
            currentStyle === 'dos' ? '#ffff00' :
            currentStyle === 'bios' ? '#00aaff' :
            currentStyle === 'kawaii' ? '#ff69b4' :
            '#007bff',
            
    primaryText: currentStyle === 'modern' ? '#ffffff' :
                currentStyle === 'neumorphism' ? '#ffffff' :
                currentStyle === 'glassmorphism' ? '#000000' :
                currentStyle === 'brutalism' ? '#ffffff' :
                currentStyle === 'cyberpunk' ? '#000000' :
                currentStyle === 'dos' ? '#0000aa' :
                currentStyle === 'bios' ? '#ffffff' :
                currentStyle === 'kawaii' ? '#ffffff' :
                '#ffffff',
                
    text: currentStyle === 'modern' ? '#212529' :
         currentStyle === 'neumorphism' ? '#2d3748' :
         currentStyle === 'glassmorphism' ? '#ffffff' :
         currentStyle === 'brutalism' ? '#000000' :
         currentStyle === 'cyberpunk' ? '#00ffff' :
         currentStyle === 'dos' ? '#ffffff' :
         currentStyle === 'bios' ? '#ffffff' :
         currentStyle === 'kawaii' ? '#ff1493' :
         '#212529',
         
    cardBg: currentStyle === 'modern' ? '#f8f9fa' :
           currentStyle === 'neumorphism' ? '#e0e5ec' :
           currentStyle === 'glassmorphism' ? 'rgba(255, 255, 255, 0.1)' :
           currentStyle === 'brutalism' ? '#f8f9fa' :
           currentStyle === 'cyberpunk' ? '#1a1a1a' :
           currentStyle === 'dos' ? '#0000aa' :
           currentStyle === 'bios' ? '#003366' :
           currentStyle === 'kawaii' ? '#ffffff' :
           '#f8f9fa',
           
    border: currentStyle === 'modern' ? '#dee2e6' :
           currentStyle === 'neumorphism' ? '#cbd5e0' :
           currentStyle === 'glassmorphism' ? 'rgba(255, 255, 255, 0.2)' :
           currentStyle === 'brutalism' ? '#000000' :
           currentStyle === 'cyberpunk' ? '#00ffff' :
           currentStyle === 'dos' ? '#ffffff' :
           currentStyle === 'bios' ? '#666666' :
           currentStyle === 'kawaii' ? '#ffb6c1' :
           '#dee2e6'
  }

  const menuItems = [
    { title: '首頁', path: '/', icon: '🏠' },
    { title: '行動點餐', path: '/mobile', icon: '📱' },
    { title: '桌面點餐', path: '/pos', icon: '🛒' },
    { title: '桌台管理', path: '/tables', icon: '🪑' },
    { title: '廚房顯示', path: '/kds', icon: '👨‍🍳' },
    { title: '訂單管理', path: '/orders', icon: '📋' },
    { title: '庫存管理', path: '/inventory', icon: '📦' },
    { title: '報表分析', path: '/reports', icon: '📊' },
    { title: '系統設定', path: '/admin', icon: '⚙️' }
  ]

  const handleNavigation = (path: string) => {
    navigate(path)
    setShowMenu(false)
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: themeColors.background,
      position: 'relative',
      overflowY: 'auto',
      overflowX: 'hidden',
      WebkitOverflowScrolling: 'touch',
      touchAction: 'pan-y'
    }}>
      {/* 主要內容區域 */}
      <div style={{
        minHeight: '100vh',
        overflowY: 'auto',
        overflowX: 'hidden',
        WebkitOverflowScrolling: 'touch',
        touchAction: 'pan-y'
      }}>
        {children}
      </div>

      {/* 懸浮選單按鈕 - 只在非行動點餐頁面顯示 */}
      {!isMobilePOSPage && (
        <button
          onClick={() => setShowMenu(true)}
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            width: '56px',
            height: '56px',
            borderRadius: '28px',
            backgroundColor: themeColors.primary,
            color: themeColors.primaryText,
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            zIndex: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.3s ease'
          }}
        >
          ☰
        </button>
      )}

      {/* 彈出式選單 */}
      {showMenu && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'flex-end',
          zIndex: 50
        }}>
          <div style={{
            width: '100%',
            maxHeight: '70vh',
            backgroundColor: themeColors.background,
            borderTopLeftRadius: '16px',
            borderTopRightRadius: '16px',
            display: 'flex',
            flexDirection: 'column',
            transform: 'translateY(0)',
            transition: 'transform 0.3s ease-out'
          }}>
            {/* 選單標題 */}
            <div style={{
              padding: '20px',
              borderBottom: `1px solid ${themeColors.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <h2 style={{
                fontSize: '18px',
                fontWeight: 'bold',
                color: themeColors.text,
                margin: '0'
              }}>
                系統選單
              </h2>
              <button
                onClick={() => setShowMenu(false)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '16px',
                  border: 'none',
                  backgroundColor: themeColors.cardBg,
                  color: themeColors.text,
                  fontSize: '18px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ×
              </button>
            </div>

            {/* 選單項目 */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '16px'
            }}>
              {menuItems.map((item, index) => (
                <button
                  key={index}
                  onClick={() => handleNavigation(item.path)}
                  style={{
                    width: '100%',
                    padding: '16px',
                    border: 'none',
                    borderRadius: '8px',
                    backgroundColor: location.pathname === item.path ? 
                                    themeColors.primary : 
                                    themeColors.cardBg,
                    color: location.pathname === item.path ? 
                           themeColors.primaryText : 
                           themeColors.text,
                    fontSize: '16px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    marginBottom: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <span style={{ fontSize: '20px' }}>{item.icon}</span>
                  <span style={{ fontWeight: '500' }}>{item.title}</span>
                </button>
              ))}
            </div>

            {/* 版本資訊 */}
            <div style={{
              padding: '16px',
              borderTop: `1px solid ${themeColors.border}`,
              textAlign: 'center'
            }}>
              <p style={{
                fontSize: '12px',
                color: themeColors.text,
                margin: '0',
                opacity: 0.7
              }}>
                TanaPOS v4-mini | {currentStyle} 主題
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MobileLayout
