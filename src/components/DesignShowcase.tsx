import React, { useState } from 'react';

const DesignShowcase: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState('components');

  const tabs = [
    { id: 'components', label: '組件展示' },
    { id: 'colors', label: '色彩系統' },
    { id: 'typography', label: '字體系統' },
    { id: 'layouts', label: '佈局系統' }
  ];

  return (
    <div className="modern-container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
      <div className="modern-page-header">
        <h1 className="modern-page-title">設計系統展示</h1>
        <p className="modern-page-subtitle">
          TanaPOS 現代化設計系統的所有元素和組件
        </p>
      </div>

      {/* 分頁選擇 */}
      <div className="modern-card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`modern-btn ${selectedTab === tab.id ? 'modern-btn-primary' : 'modern-btn-ghost'}`}
              onClick={() => setSelectedTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 組件展示 */}
      {selectedTab === 'components' && (
        <div className="modern-grid modern-grid-2">
          {/* 按鈕展示 */}
          <div className="modern-card">
            <div className="modern-card-header">
              <h3 className="modern-card-title">按鈕系統</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button className="modern-btn modern-btn-primary">Primary</button>
                <button className="modern-btn modern-btn-secondary">Secondary</button>
                <button className="modern-btn modern-btn-success">Success</button>
                <button className="modern-btn modern-btn-danger">Danger</button>
                <button className="modern-btn modern-btn-ghost">Ghost</button>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button className="modern-btn modern-btn-primary" disabled>Disabled</button>
                <button className="modern-btn modern-btn-primary">
                  <div className="modern-loading" style={{ width: '16px', height: '16px' }}></div>
                  Loading
                </button>
              </div>
            </div>
          </div>

          {/* 徽章展示 */}
          <div className="modern-card">
            <div className="modern-card-header">
              <h3 className="modern-card-title">徽章系統</h3>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span className="modern-badge modern-badge-success">Success</span>
              <span className="modern-badge modern-badge-warning">Warning</span>
              <span className="modern-badge modern-badge-danger">Danger</span>
              <span className="modern-badge modern-badge-info">Info</span>
            </div>
          </div>

          {/* 輸入框展示 */}
          <div className="modern-card">
            <div className="modern-card-header">
              <h3 className="modern-card-title">輸入框</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input 
                className="modern-input" 
                placeholder="請輸入文字..."
                defaultValue="範例文字"
              />
              <input 
                className="modern-input" 
                placeholder="電子信箱"
                type="email"
              />
              <input 
                className="modern-input" 
                placeholder="搜尋..."
                type="search"
              />
            </div>
          </div>

          {/* 卡片展示 */}
          <div className="modern-card">
            <div className="modern-card-header">
              <h3 className="modern-card-title">卡片系統</h3>
              <p className="modern-card-subtitle">這是一個標準的卡片組件</p>
            </div>
            <p style={{ color: 'var(--color-gray-600)', margin: '0 0 1rem 0' }}>
              卡片是設計系統的基礎容器，提供一致的視覺層次和間距。
            </p>
            <div className="modern-card modern-interactive" style={{ padding: '1rem', background: 'var(--color-gray-50)' }}>
              <h4 style={{ margin: '0 0 0.5rem 0', fontSize: 'var(--font-size-base)' }}>
                互動式卡片
              </h4>
              <p style={{ margin: '0', fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-600)' }}>
                懸停時會有輕微的浮升效果
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 色彩系統 */}
      {selectedTab === 'colors' && (
        <div className="modern-grid modern-grid-3">
          {/* 主色調 */}
          <div className="modern-card">
            <div className="modern-card-header">
              <h3 className="modern-card-title">主色調</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ 
                  width: '3rem', 
                  height: '3rem', 
                  background: 'var(--color-primary)', 
                  borderRadius: 'var(--radius-md)' 
                }}></div>
                <div>
                  <div style={{ fontWeight: '500' }}>Primary</div>
                  <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-500)' }}>#2563eb</div>
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ 
                  width: '3rem', 
                  height: '3rem', 
                  background: 'var(--color-accent)', 
                  borderRadius: 'var(--radius-md)' 
                }}></div>
                <div>
                  <div style={{ fontWeight: '500' }}>Accent</div>
                  <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-500)' }}>#10b981</div>
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ 
                  width: '3rem', 
                  height: '3rem', 
                  background: 'var(--color-warning)', 
                  borderRadius: 'var(--radius-md)' 
                }}></div>
                <div>
                  <div style={{ fontWeight: '500' }}>Warning</div>
                  <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-500)' }}>#f59e0b</div>
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ 
                  width: '3rem', 
                  height: '3rem', 
                  background: 'var(--color-danger)', 
                  borderRadius: 'var(--radius-md)' 
                }}></div>
                <div>
                  <div style={{ fontWeight: '500' }}>Danger</div>
                  <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-500)' }}>#ef4444</div>
                </div>
              </div>
            </div>
          </div>

          {/* 中性色調 */}
          <div className="modern-card">
            <div className="modern-card-header">
              <h3 className="modern-card-title">中性色調</h3>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map(shade => (
                <div key={shade} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ 
                    width: '1.5rem', 
                    height: '1.5rem', 
                    background: `var(--color-gray-${shade})`, 
                    borderRadius: 'var(--radius-sm)',
                    border: shade === 50 ? '1px solid var(--color-gray-200)' : 'none'
                  }}></div>
                  <span style={{ fontSize: 'var(--font-size-xs)' }}>Gray {shade}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 陰影系統 */}
          <div className="modern-card">
            <div className="modern-card-header">
              <h3 className="modern-card-title">陰影系統</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ 
                padding: '1rem', 
                background: 'var(--color-white)', 
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-sm)' 
              }}>
                Small Shadow
              </div>
              <div style={{ 
                padding: '1rem', 
                background: 'var(--color-white)', 
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-md)' 
              }}>
                Medium Shadow
              </div>
              <div style={{ 
                padding: '1rem', 
                background: 'var(--color-white)', 
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-lg)' 
              }}>
                Large Shadow
              </div>
              <div style={{ 
                padding: '1rem', 
                background: 'var(--color-white)', 
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-xl)' 
              }}>
                Extra Large Shadow
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 字體系統 */}
      {selectedTab === 'typography' && (
        <div className="modern-grid modern-grid-2">
          <div className="modern-card">
            <div className="modern-card-header">
              <h3 className="modern-card-title">字體尺寸</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ fontSize: 'var(--font-size-3xl)', fontWeight: '700' }}>
                3XL 標題 (30px)
              </div>
              <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: '600' }}>
                2XL 副標題 (24px)
              </div>
              <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: '500' }}>
                XL 大文字 (20px)
              </div>
              <div style={{ fontSize: 'var(--font-size-lg)' }}>
                Large 文字 (18px)
              </div>
              <div style={{ fontSize: 'var(--font-size-base)' }}>
                Base 基礎文字 (16px)
              </div>
              <div style={{ fontSize: 'var(--font-size-sm)' }}>
                Small 小文字 (14px)
              </div>
              <div style={{ fontSize: 'var(--font-size-xs)' }}>
                Extra Small 極小文字 (12px)
              </div>
            </div>
          </div>

          <div className="modern-card">
            <div className="modern-card-header">
              <h3 className="modern-card-title">字重展示</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: '700' }}>
                Bold 粗體 (700)
              </div>
              <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: '600' }}>
                Semi Bold 半粗體 (600)
              </div>
              <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: '500' }}>
                Medium 中等 (500)
              </div>
              <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: '400' }}>
                Regular 正常 (400)
              </div>
              <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: '300' }}>
                Light 細體 (300)
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 佈局系統 */}
      {selectedTab === 'layouts' && (
        <div>
          <div className="modern-card" style={{ marginBottom: '2rem' }}>
            <div className="modern-card-header">
              <h3 className="modern-card-title">網格系統展示</h3>
            </div>
            
            <h4 style={{ margin: '1.5rem 0 1rem 0' }}>2 欄網格</h4>
            <div className="modern-grid modern-grid-2">
              <div style={{ 
                padding: '1rem', 
                background: 'var(--color-primary-light)', 
                borderRadius: 'var(--radius-md)',
                textAlign: 'center'
              }}>
                欄位 1
              </div>
              <div style={{ 
                padding: '1rem', 
                background: 'var(--color-primary-light)', 
                borderRadius: 'var(--radius-md)',
                textAlign: 'center'
              }}>
                欄位 2
              </div>
            </div>

            <h4 style={{ margin: '1.5rem 0 1rem 0' }}>3 欄網格</h4>
            <div className="modern-grid modern-grid-3">
              <div style={{ 
                padding: '1rem', 
                background: 'var(--color-secondary)', 
                borderRadius: 'var(--radius-md)',
                textAlign: 'center'
              }}>
                欄位 1
              </div>
              <div style={{ 
                padding: '1rem', 
                background: 'var(--color-secondary)', 
                borderRadius: 'var(--radius-md)',
                textAlign: 'center'
              }}>
                欄位 2
              </div>
              <div style={{ 
                padding: '1rem', 
                background: 'var(--color-secondary)', 
                borderRadius: 'var(--radius-md)',
                textAlign: 'center'
              }}>
                欄位 3
              </div>
            </div>

            <h4 style={{ margin: '1.5rem 0 1rem 0' }}>4 欄網格</h4>
            <div className="modern-grid modern-grid-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} style={{ 
                  padding: '1rem', 
                  background: '#dcfce7', 
                  borderRadius: 'var(--radius-md)',
                  textAlign: 'center'
                }}>
                  欄位 {i}
                </div>
              ))}
            </div>
          </div>

          <div className="modern-card">
            <div className="modern-card-header">
              <h3 className="modern-card-title">間距系統</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[
                { name: 'XS', value: 'var(--space-xs)', pixels: '4px' },
                { name: 'SM', value: 'var(--space-sm)', pixels: '8px' },
                { name: 'MD', value: 'var(--space-md)', pixels: '16px' },
                { name: 'LG', value: 'var(--space-lg)', pixels: '24px' },
                { name: 'XL', value: 'var(--space-xl)', pixels: '32px' },
                { name: '2XL', value: 'var(--space-2xl)', pixels: '48px' }
              ].map(space => (
                <div key={space.name} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ 
                    width: space.value, 
                    height: '1rem', 
                    background: 'var(--color-primary)',
                    minWidth: space.value
                  }}></div>
                  <span>{space.name} - {space.pixels}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DesignShowcase;
