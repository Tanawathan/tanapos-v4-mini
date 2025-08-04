import React, { useState } from 'react';
import { useTheme, type ThemeMode, type ColorblindMode } from '../lib/theme-store';

interface ThemeControlPanelProps {
  className?: string;
}

export const ThemeControlPanel: React.FC<ThemeControlPanelProps> = ({ 
  className = '' 
}) => {
  const {
    settings,
    setThemeMode,
    setColorblindMode,
    setHighContrast,
    setReducedMotion,
    toggleTheme,
  } = useTheme();

  const [isExpanded, setIsExpanded] = useState(false);

  const themeOptions: { value: ThemeMode; label: string; icon: string }[] = [
    { value: 'light', label: '淺色模式', icon: '☀️' },
    { value: 'dark', label: '深色模式', icon: '🌙' },
    { value: 'system', label: '跟隨系統', icon: '💻' },
  ];

  const colorblindOptions: { value: ColorblindMode; label: string; description: string }[] = [
    { value: 'normal', label: '一般色彩', description: '標準色彩顯示' },
    { value: 'colorblind', label: '色盲友善', description: '藍橙對比配色' },
  ];

  return (
    <div className={`relative ${className}`}>
      {/* 快速切換按鈕 */}
      <button
        onClick={toggleTheme}
        className="p-2 rounded-lg bg-ui-secondary hover:bg-ui-tertiary border border-ui transition-colors"
        title={`目前: ${settings.mode === 'light' ? '淺色' : settings.mode === 'dark' ? '深色' : '系統'}模式`}
      >
        <span className="text-lg">
          {settings.mode === 'light' ? '☀️' : 
           settings.mode === 'dark' ? '🌙' : '💻'}
        </span>
      </button>

      {/* 展開按鈕 */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="ml-2 p-2 rounded-lg bg-ui-secondary hover:bg-ui-tertiary border border-ui transition-colors"
        title="主題設定"
      >
        <svg 
          className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M19 9l-7 7-7-7" 
          />
        </svg>
      </button>

      {/* 展開面板 */}
      {isExpanded && (
        <div className="absolute top-full mt-2 right-0 w-80 bg-ui-primary border border-ui rounded-lg shadow-lg z-50">
          <div className="p-4 space-y-4">
            {/* 標題 */}
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-ui-primary">主題設定</h3>
              <button
                onClick={() => setIsExpanded(false)}
                className="p-1 rounded hover:bg-ui-secondary transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* 主題模式選擇 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-ui-secondary">顯示模式</label>
              <div className="grid grid-cols-3 gap-2">
                {themeOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setThemeMode(option.value)}
                    className={`
                      p-3 rounded-lg border-2 transition-all text-center
                      ${settings.mode === option.value
                        ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                        : 'border-ui hover:bg-ui-secondary'
                      }
                    `}
                  >
                    <div className="text-lg mb-1">{option.icon}</div>
                    <div className="text-xs font-medium">{option.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 色盲友善模式 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-ui-secondary">色彩模式</label>
              <div className="space-y-2">
                {colorblindOptions.map((option) => (
                  <label
                    key={option.value}
                    className={`
                      flex items-center p-3 rounded-lg border cursor-pointer transition-colors
                      ${settings.colorblindMode === option.value
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-ui hover:bg-ui-secondary'
                      }
                    `}
                  >
                    <input
                      type="radio"
                      name="colorblindMode"
                      value={option.value}
                      checked={settings.colorblindMode === option.value}
                      onChange={() => setColorblindMode(option.value)}
                      className="sr-only"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-ui-primary">{option.label}</div>
                      <div className="text-sm text-ui-muted">{option.description}</div>
                    </div>
                    {settings.colorblindMode === option.value && (
                      <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </label>
                ))}
              </div>
            </div>

            {/* 輔助功能選項 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-ui-secondary">輔助功能</label>
              <div className="space-y-2">
                {/* 高對比度 */}
                <label className="flex items-center justify-between p-2 rounded hover:bg-ui-secondary cursor-pointer">
                  <div>
                    <div className="font-medium text-ui-primary">高對比度</div>
                    <div className="text-sm text-ui-muted">增強邊框和文字對比</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.highContrast}
                    onChange={(e) => setHighContrast(e.target.checked)}
                    className="rounded border-ui focus:ring-2 focus:ring-blue-500"
                  />
                </label>

                {/* 減少動畫 */}
                <label className="flex items-center justify-between p-2 rounded hover:bg-ui-secondary cursor-pointer">
                  <div>
                    <div className="font-medium text-ui-primary">減少動畫</div>
                    <div className="text-sm text-ui-muted">停用過渡動畫效果</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.reducedMotion}
                    onChange={(e) => setReducedMotion(e.target.checked)}
                    className="rounded border-ui focus:ring-2 focus:ring-blue-500"
                  />
                </label>
              </div>
            </div>

            {/* 色彩預覽 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-ui-secondary">狀態色彩預覽</label>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="text-center">
                  <div className="w-full h-6 bg-kds-pending rounded mb-1"></div>
                  <span>待處理</span>
                </div>
                <div className="text-center">
                  <div className="w-full h-6 bg-kds-preparing rounded mb-1"></div>
                  <span>製作中</span>
                </div>
                <div className="text-center">
                  <div className="w-full h-6 bg-kds-ready rounded mb-1"></div>
                  <span>完成</span>
                </div>
              </div>
            </div>

            {/* 重置按鈕 */}
            <button
              onClick={() => {
                setThemeMode('system');
                setColorblindMode('normal');
                setHighContrast(false);
                setReducedMotion(false);
              }}
              className="w-full p-2 text-sm border border-ui rounded hover:bg-ui-secondary transition-colors"
            >
              重置為預設值
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// 簡化版主題切換按鈕
export const ThemeToggleButton: React.FC<{ className?: string }> = ({ 
  className = '' 
}) => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`
        p-2 rounded-lg transition-colors
        bg-ui-secondary hover:bg-ui-tertiary border border-ui
        ${className}
      `}
      title={`切換至${isDark ? '淺色' : '深色'}模式`}
    >
      <span className="text-lg">
        {isDark ? '☀️' : '🌙'}
      </span>
    </button>
  );
};

// 色盲模式切換按鈕
export const ColorblindToggleButton: React.FC<{ className?: string }> = ({ 
  className = '' 
}) => {
  const { isColorblind, enableColorblindMode, disableColorblindMode } = useTheme();

  return (
    <button
      onClick={() => isColorblind ? disableColorblindMode() : enableColorblindMode()}
      className={`
        p-2 rounded-lg transition-colors
        ${isColorblind 
          ? 'bg-orange-100 hover:bg-orange-200 border-orange-300 text-orange-700 dark:bg-orange-900/20 dark:border-orange-700 dark:text-orange-300' 
          : 'bg-ui-secondary hover:bg-ui-tertiary border-ui'
        }
        ${className}
      `}
      title={`${isColorblind ? '停用' : '啟用'}色盲友善模式`}
    >
      <span className="text-lg">
        {isColorblind ? '🔶' : '🔷'}
      </span>
    </button>
  );
};
