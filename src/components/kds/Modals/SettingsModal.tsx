import React, { useState } from 'react';
import { KDSSettings, MenuCategory } from '../../../lib/kds-types';

interface SettingsModalProps {
  settings: KDSSettings;
  onSave: (settings: Partial<KDSSettings>) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onSave,
  onClose
}) => {
  const [formData, setFormData] = useState<KDSSettings>(settings);

  const handleSave = () => {
    onSave(formData);
    onClose();
  };

  const handleCategoryToggle = (category: MenuCategory) => {
    const newCategories = formData.categoriesVisible.includes(category)
      ? formData.categoriesVisible.filter(c => c !== category)
      : [...formData.categoriesVisible, category];
    
    setFormData({
      ...formData,
      categoriesVisible: newCategories
    });
  };

  const updateEstimatedTime = (category: MenuCategory, time: number) => {
    setFormData({
      ...formData,
      estimatedTimes: {
        ...formData.estimatedTimes,
        [category]: time
      }
    });
  };

  const categoryOptions = [
    { value: MenuCategory.APPETIZERS, label: '前菜', icon: '🥗' },
    { value: MenuCategory.MAIN_COURSE, label: '主餐', icon: '🍖' },
    { value: MenuCategory.BEVERAGES, label: '飲品', icon: '🥤' },
    { value: MenuCategory.A_LA_CARTE, label: '單點', icon: '🍽️' },
    { value: MenuCategory.ADDITIONAL, label: '加點', icon: '➕' },
    { value: MenuCategory.DESSERTS, label: '甜點', icon: '🧁' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto m-4">
        {/* 標題 */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">KDS 系統設定</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* 內容 */}
        <div className="p-6 space-y-6">
          {/* 基本設定 */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">基本設定</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  自動刷新間隔 (秒)
                </label>
                <input
                  type="number"
                  min="5"
                  max="300"
                  value={formData.autoRefreshInterval}
                  onChange={(e) => setFormData({
                    ...formData,
                    autoRefreshInterval: parseInt(e.target.value) || 30
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  預設排序方式
                </label>
                <select
                  value={formData.defaultSort}
                  onChange={(e) => setFormData({
                    ...formData,
                    defaultSort: e.target.value as any
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="time">時間排序</option>
                  <option value="priority">優先級排序</option>
                  <option value="table">桌號排序</option>
                </select>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="soundEnabled"
                  checked={formData.soundEnabled}
                  onChange={(e) => setFormData({
                    ...formData,
                    soundEnabled: e.target.checked
                  })}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="soundEnabled" className="ml-2 text-sm text-gray-700">
                  啟用聲音提醒
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  顯示模式
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="displayMode"
                      value="compact"
                      checked={formData.displayMode === 'compact'}
                      onChange={(e) => setFormData({
                        ...formData,
                        displayMode: e.target.value as any
                      })}
                      className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">緊湊模式</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="displayMode"
                      value="detailed"
                      checked={formData.displayMode === 'detailed'}
                      onChange={(e) => setFormData({
                        ...formData,
                        displayMode: e.target.value as any
                      })}
                      className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">詳細模式</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* 餐點分類設定 */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">餐點分類設定</h3>
            <div className="space-y-3">
              <p className="text-sm text-gray-600">選擇要顯示的餐點分類：</p>
              {categoryOptions.map((category) => (
                <div key={category.value} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id={category.value}
                      checked={formData.categoriesVisible.includes(category.value)}
                      onChange={() => handleCategoryToggle(category.value)}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor={category.value} className="ml-2 flex items-center space-x-2">
                      <span>{category.icon}</span>
                      <span className="text-sm text-gray-700">{category.label}</span>
                    </label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">預估時間:</span>
                    <input
                      type="number"
                      min="1"
                      max="120"
                      value={formData.estimatedTimes[category.value]}
                      onChange={(e) => updateEstimatedTime(
                        category.value, 
                        parseInt(e.target.value) || 1
                      )}
                      className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-500">分鐘</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 底部按鈕 */}
        <div className="p-6 border-t border-gray-200 flex items-center justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            儲存設定
          </button>
        </div>
      </div>
    </div>
  );
};
