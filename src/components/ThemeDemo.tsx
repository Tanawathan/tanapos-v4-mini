import React from 'react';
import { useTheme } from '../lib/theme-store';

export const ThemeDemo: React.FC = () => {
  const { settings, isDark, isColorblind } = useTheme();

  return (
    <div className="min-h-screen bg-ui-secondary p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* 標題 */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-ui-primary mb-4">
            主題系統示例
          </h1>
          <p className="text-ui-secondary">
            當前模式：{settings.mode} | 深色模式：{isDark ? '啟用' : '停用'} | 色盲友善：{isColorblind ? '啟用' : '停用'}
          </p>
        </div>

        {/* 色彩卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* 基礎色彩 */}
          <div className="bg-ui-primary rounded-lg p-6 border border-ui">
            <h3 className="text-lg font-semibold text-ui-primary mb-4">基礎色彩</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-ui-secondary">主要文字</span>
                <div className="w-6 h-6 bg-ui-primary rounded border border-ui"></div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-ui-secondary">次要文字</span>
                <div className="w-6 h-6 bg-ui-secondary rounded border border-ui"></div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-ui-muted">弱化文字</span>
                <div className="w-6 h-6 bg-ui-muted rounded border border-ui"></div>
              </div>
            </div>
          </div>

          {/* KDS 狀態色彩 */}
          <div className="bg-ui-primary rounded-lg p-6 border border-ui">
            <h3 className="text-lg font-semibold text-ui-primary mb-4">訂單狀態</h3>
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-kds-pending rounded"></div>
                <span className="text-ui-secondary">待處理</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-kds-confirmed rounded"></div>
                <span className="text-ui-secondary">已確認</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-kds-preparing rounded"></div>
                <span className="text-ui-secondary">製作中</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-kds-ready rounded"></div>
                <span className="text-ui-secondary">準備完成</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-kds-served rounded"></div>
                <span className="text-ui-secondary">已送達</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-kds-completed rounded"></div>
                <span className="text-ui-secondary">已完成</span>
              </div>
            </div>
          </div>

          {/* 語義色彩 */}
          <div className="bg-ui-primary rounded-lg p-6 border border-ui">
            <h3 className="text-lg font-semibold text-ui-primary mb-4">語義色彩</h3>
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span className="text-ui-secondary">成功</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                <span className="text-ui-secondary">警告</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-red-500 rounded"></div>
                <span className="text-ui-secondary">錯誤</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-blue-500 rounded"></div>
                <span className="text-ui-secondary">資訊</span>
              </div>
            </div>
          </div>
        </div>

        {/* 模擬訂單卡片 */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-ui-primary">模擬訂單卡片</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 待處理訂單 */}
            <div className="bg-ui-primary rounded-lg border-l-4 border-kds-pending p-4 shadow-sm">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-ui-primary">訂單 #001</h3>
                  <p className="text-sm text-ui-muted">桌號 5 | 14:30</p>
                </div>
                <span className="px-2 py-1 text-xs font-medium bg-kds-pending text-white rounded">
                  待處理
                </span>
              </div>
              <div className="space-y-1 text-sm text-ui-secondary">
                <div>招牌炒飯 x1</div>
                <div>珍珠奶茶 x2</div>
                <div>炸雞排 x1</div>
              </div>
              <div className="mt-3 pt-3 border-t border-ui">
                <div className="flex justify-between text-sm">
                  <span className="text-ui-muted">總計</span>
                  <span className="font-medium text-ui-primary">$350</span>
                </div>
              </div>
            </div>

            {/* 製作中訂單 */}
            <div className="bg-ui-primary rounded-lg border-l-4 border-kds-preparing p-4 shadow-sm">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-ui-primary">訂單 #002</h3>
                  <p className="text-sm text-ui-muted">桌號 3 | 14:25</p>
                </div>
                <span className="px-2 py-1 text-xs font-medium bg-kds-preparing text-white rounded">
                  製作中
                </span>
              </div>
              <div className="space-y-1 text-sm text-ui-secondary">
                <div>牛肉麵 x1</div>
                <div>滷蛋 x1</div>
                <div>冬瓜茶 x1</div>
              </div>
              <div className="mt-3 pt-3 border-t border-ui">
                <div className="flex justify-between text-sm">
                  <span className="text-ui-muted">總計</span>
                  <span className="font-medium text-ui-primary">$180</span>
                </div>
              </div>
            </div>

            {/* 完成訂單 */}
            <div className="bg-ui-primary rounded-lg border-l-4 border-kds-ready p-4 shadow-sm">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-ui-primary">訂單 #003</h3>
                  <p className="text-sm text-ui-muted">桌號 1 | 14:20</p>
                </div>
                <span className="px-2 py-1 text-xs font-medium bg-kds-ready text-white rounded">
                  準備完成
                </span>
              </div>
              <div className="space-y-1 text-sm text-ui-secondary">
                <div>宮保雞丁 x1</div>
                <div>白飯 x1</div>
                <div>紅茶 x1</div>
              </div>
              <div className="mt-3 pt-3 border-t border-ui">
                <div className="flex justify-between text-sm">
                  <span className="text-ui-muted">總計</span>
                  <span className="font-medium text-ui-primary">$220</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 按鈕示例 */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-ui-primary">按鈕樣式</h2>
          <div className="flex flex-wrap gap-4">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              主要按鈕
            </button>
            <button className="px-4 py-2 bg-ui-secondary text-ui-primary border border-ui rounded-lg hover:bg-ui-tertiary transition-colors">
              次要按鈕
            </button>
            <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
              成功按鈕
            </button>
            <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
              危險按鈕
            </button>
          </div>
        </div>

        {/* 輸入框示例 */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-ui-primary">輸入框樣式</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-ui-secondary mb-2">
                文字輸入
              </label>
              <input
                type="text"
                placeholder="請輸入文字..."
                className="w-full px-3 py-2 bg-ui-primary border border-ui rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-ui-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ui-secondary mb-2">
                選擇框
              </label>
              <select className="w-full px-3 py-2 bg-ui-primary border border-ui rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-ui-primary">
                <option>選項 1</option>
                <option>選項 2</option>
                <option>選項 3</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
