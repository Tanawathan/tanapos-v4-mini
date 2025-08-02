import React, { useState, useEffect } from 'react';

interface PWAInstallPromptProps {
  onClose?: () => void;
}

export const PWAInstallPrompt: React.FC<PWAInstallPromptProps> = ({ onClose }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // 檢查是否已安裝為 PWA
    const checkIfInstalled = () => {
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true);
        return;
      }
      
      if ((window.navigator as any).standalone === true) {
        setIsInstalled(true);
        return;
      }
      
      if (document.referrer.includes('android-app://')) {
        setIsInstalled(true);
        return;
      }
    };

    checkIfInstalled();

    // 監聽安裝提示事件
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    };

    // 監聽應用程式安裝事件
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
      console.log('📱 TanaPOS 已成功安裝為 PWA');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const result = await deferredPrompt.userChoice;
      
      if (result.outcome === 'accepted') {
        console.log('✅ 用戶接受了 PWA 安裝');
      } else {
        console.log('❌ 用戶拒絕了 PWA 安裝');
      }
      
      setDeferredPrompt(null);
      setShowInstallPrompt(false);
    } catch (error) {
      console.error('PWA 安裝過程中發生錯誤:', error);
    }
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    onClose?.();
  };

  // 如果已安裝或不顯示提示，則不渲染
  if (isInstalled || !showInstallPrompt) {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '1rem',
      left: '1rem',
      right: '1rem',
      backgroundColor: '#059669',
      color: 'white',
      padding: '1rem',
      borderRadius: '0.5rem',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      gap: '0.75rem',
      maxWidth: '400px',
      margin: '0 auto'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        <span style={{ fontSize: '1.25rem' }}>📱</span>
        <div>
          <div style={{ fontWeight: 'bold', fontSize: '0.875rem' }}>
            安裝 TanaPOS 應用程式
          </div>
          <div style={{ fontSize: '0.75rem', opacity: 0.9 }}>
            安裝到主畫面以獲得更好的使用體驗
          </div>
        </div>
      </div>
      
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        justifyContent: 'flex-end'
      }}>
        <button
          onClick={handleDismiss}
          style={{
            background: 'transparent',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            color: 'white',
            padding: '0.5rem 1rem',
            borderRadius: '0.25rem',
            cursor: 'pointer',
            fontSize: '0.75rem'
          }}
        >
          稍後
        </button>
        <button
          onClick={handleInstallClick}
          style={{
            background: 'rgba(255, 255, 255, 0.2)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            color: 'white',
            padding: '0.5rem 1rem',
            borderRadius: '0.25rem',
            cursor: 'pointer',
            fontSize: '0.75rem',
            fontWeight: 'bold'
          }}
        >
          安裝
        </button>
      </div>
    </div>
  );
};

export default PWAInstallPrompt;
