import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './styles/ui-styles.css'

console.log('🚀 TanaPOS V4-Mini loading...')

// Service Worker 註冊
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('✅ Service Worker 註冊成功:', registration.scope);
        
        // 檢查更新
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  console.log('🔄 新版本可用，請重新整理頁面');
                  // 可選：顯示更新提示
                } else {
                  console.log('📱 應用程式已可離線使用');
                }
              }
            });
          }
        });
      })
      .catch((error) => {
        console.error('❌ Service Worker 註冊失敗:', error);
      });
  });
} else {
  console.warn('⚠️ 此瀏覽器不支援 Service Worker');
}

// Create root and render app
const container = document.getElementById('root')
if (!container) {
  throw new Error('Root element not found')
}

console.log('📦 Root container found, initializing POS system...')

const root = createRoot(container)
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

console.log('✅ TanaPOS V4-Mini system loaded successfully')