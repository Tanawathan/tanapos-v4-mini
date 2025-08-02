import React from 'react'
import ReactDOM from 'react-dom/client'
import NewMobilePOS from './components/mobile/NewMobilePOS'
import './index.css'
import './styles/ui-styles.css'
import './styles/new-mobile-pos.css'

const TestNewMobileApp: React.FC = () => {
  const testThemeColors = {
    primary: '#3b82f6',
    primaryText: '#ffffff',
    secondary: '#6b7280',
    text: '#1f2937',
    background: '#ffffff',
    cardBg: '#f9fafb',
    border: '#e5e7eb',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444'
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <NewMobilePOS 
        uiStyle="modern"
        themeColors={testThemeColors}
      />
    </div>
  )
}

// 確保DOM已載入
const rootElement = document.getElementById('root')
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement)
  root.render(<TestNewMobileApp />)
} else {
  console.error('找不到 root 元素')
}
