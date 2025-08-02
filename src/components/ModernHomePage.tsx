import React from 'react';
import { useNavigate } from 'react-router-dom';
import { APP_CONFIG } from '../config';
import { useUIStyle } from '../contexts/UIStyleContext';

const ModernHomePage: React.FC = () => {
  const navigate = useNavigate();
  const { currentStyle, styleConfig } = useUIStyle();

  const features = [
    {
      title: '點餐系統',
      description: '全新設計的點餐系統，支援多種 UI 風格與響應式設計',
      icon: '🛒',
      path: '/pos',
      color: 'primary'
    },
    {
      title: '行動點餐',
      description: '專為手機設計的觸控點餐介面，支援多種視覺風格',
      icon: '📱',
      path: '/mobile',
      color: 'success'
    },
    {
      title: '乾淨手機版',
      description: '最新的簡潔手機點餐介面，使用內聯CSS設計',
      icon: '🧹',
      path: '/mobile-clean',
      color: 'primary'
    },
    {
      title: '新版點餐系統',
      description: '全新設計的點餐系統，完整套餐功能支援',
      icon: '🆕',
      path: '/pos-new',
      color: 'primary'
    },
    {
      title: '舊版點餐系統',
      description: '傳統的點餐介面，基本功能完整',
      icon: '📱',
      path: '/pos-old',
      color: 'secondary'
    },
    {
      title: '桌台管理',
      description: '現代化桌台狀態管理，支援多種 UI 風格與響應式設計',
      icon: '🏢',
      path: '/tables',
      color: 'success'
    },
    {
      title: '舊版桌台管理',
      description: '傳統桌台管理介面，基本功能完整',
      icon: '🪑',
      path: '/tables-legacy',
      color: 'secondary'
    },
    {
      title: '訂單管理',
      description: '完整的訂單追蹤與管理系統',
      icon: '📋',
      path: '/orders',
      color: 'warning'
    },
    {
      title: '廚房顯示',
      description: 'KDS 廚房顯示系統，即時訂單狀態更新',
      icon: '👨‍🍳',
      path: '/kds',
      color: 'info'
    },
    {
      title: '後台管理',
      description: '完整的系統設定與數據管理功能',
      icon: '⚙️',
      path: '/admin',
      color: 'secondary'
    },
    {
      title: '餐後結帳',
      description: '完整的餐後結帳系統，支援多種支付方式與手續費計算',
      icon: '💰',
      path: '/checkout-post-meal',
      color: 'warning'
    },
    {
      title: '報表分析',
      description: '營業數據分析與報表生成',
      icon: '📊',
      path: '/reports',
      color: 'primary'
    },
    ...(APP_CONFIG.FEATURES.USER_GUIDE ? [{
      title: '使用說明',
      description: '系統基本使用指南與功能介紹',
      icon: '📖',
      path: '/admin?tab=userguide',
      color: 'info'
    }] : []),
    ...(APP_CONFIG.FEATURES.OPERATION_GUIDE ? [{
      title: '操作指南',
      description: '詳細的操作步驟說明與最佳實踐',
      icon: '🎯',
      path: '/admin?tab=operationguide',
      color: 'success'
    }] : [])
  ];

  const stats = [
    { label: '今日營業額', value: 'NT$ 45,680', change: '+12.5%', positive: true },
    { label: '今日訂單', value: '156', change: '+8.2%', positive: true },
    { label: '平均客單價', value: 'NT$ 293', change: '-2.1%', positive: false },
    { label: '桌台使用率', value: '78%', change: '+5.3%', positive: true }
  ];

  return (
    <div className="modern-container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
      {/* 頁面標題區 */}
      <div className="modern-page-header">
        <h1 className="modern-page-title">TanaPOS 餐廳管理系統</h1>
        <p className="modern-page-subtitle">
          現代化的餐廳管理解決方案，提升營運效率與顧客體驗
        </p>
      </div>

      {/* 數據統計區 */}
      <div className="modern-grid modern-grid-4" style={{ marginBottom: '3rem' }}>
        {stats.map((stat, index) => (
          <div key={index} className="modern-card">
            <div className="modern-card-header" style={{ marginBottom: '1rem', paddingBottom: '0.5rem' }}>
              <h3 className="modern-card-title" style={{ fontSize: '0.875rem', fontWeight: '500' }}>
                {stat.label}
              </h3>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--color-gray-900)' }}>
                {stat.value}
              </span>
              <span 
                className={`modern-badge ${stat.positive ? 'modern-badge-success' : 'modern-badge-danger'}`}
              >
                {stat.change}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* 功能區塊 */}
      <div className="modern-grid modern-grid-3">
        {features.map((feature, index) => (
          <div 
            key={index} 
            className="modern-card modern-interactive"
            onClick={() => navigate(feature.path)}
            style={{ cursor: 'pointer' }}
          >
            <div className="modern-card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div 
                  style={{ 
                    fontSize: '2rem',
                    width: '3rem',
                    height: '3rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'var(--color-gray-50)',
                    borderRadius: 'var(--radius-xl)'
                  }}
                >
                  {feature.icon}
                </div>
                <div>
                  <h3 className="modern-card-title">{feature.title}</h3>
                </div>
              </div>
            </div>
            <p style={{ 
              color: 'var(--color-gray-600)', 
              margin: '0',
              lineHeight: '1.5'
            }}>
              {feature.description}
            </p>
            <div style={{ marginTop: '1.5rem' }}>
              <button className={`modern-btn modern-btn-${feature.color}`}>
                開始使用
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 快速操作區 */}
      <div className="modern-card" style={{ marginTop: '3rem' }}>
        <div className="modern-card-header">
          <h3 className="modern-card-title">快速操作</h3>
          <p className="modern-card-subtitle">常用功能快速入口</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button 
            className="modern-btn modern-btn-primary"
            onClick={() => navigate('/pos')}
          >
            🛒 新增訂單
          </button>
          <button 
            className="modern-btn modern-btn-success"
            onClick={() => navigate('/tables')}
          >
            🪑 管理桌台
          </button>
          <button 
            className="modern-btn modern-btn-secondary"
            onClick={() => navigate('/kds')}
          >
            👨‍🍳 廚房顯示
          </button>
          <button 
            className="modern-btn modern-btn-ghost"
            onClick={() => navigate('/admin')}
          >
            ⚙️ 系統設定
          </button>
        </div>
      </div>

      {/* 系統狀態 */}
      <div className="modern-grid modern-grid-2" style={{ marginTop: '3rem' }}>
        <div className="modern-card">
          <div className="modern-card-header">
            <h3 className="modern-card-title">系統狀態</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>資料庫連線</span>
              <span className="modern-badge modern-badge-success">正常</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>支付系統</span>
              <span className="modern-badge modern-badge-success">正常</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>印表機狀態</span>
              <span className="modern-badge modern-badge-warning">離線</span>
            </div>
          </div>
        </div>

        <div className="modern-card">
          <div className="modern-card-header">
            <h3 className="modern-card-title">最新活動</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ fontSize: '0.875rem', color: 'var(--color-gray-600)' }}>
              • 桌號 A1 新增訂單 #1001
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--color-gray-600)' }}>
              • 桌號 B3 完成結帳
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--color-gray-600)' }}>
              • 廚房完成訂單 #998
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--color-gray-600)' }}>
              • 新增桌台預約 (19:30)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModernHomePage;
