import { useState, useEffect } from 'react';
import type { Category, CreateCategoryDto, UpdateCategoryDto } from '../../lib/menu-types';

interface CategoryModalProps {
  isOpen: boolean;
  category: Category | null;
  onClose: () => void;
  onSave: (data: CreateCategoryDto | UpdateCategoryDto) => Promise<void>;
}

const PRESET_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Violet
  '#06B6D4', // Cyan
  '#84CC16', // Lime
  '#F97316', // Orange
  '#EC4899', // Pink
  '#6B7280', // Gray
];

const PRESET_ICONS = [
  '🍽️', '🍜', '🥤', '🍰', '🥗', '🍕', '🍔', '🍟', '🌭', '🥪',
  '🍣', '🍤', '🥘', '🍲', '🥙', '🌮', '🌯', '🥖', '🥨', '🧀',
  '🍳', '🥓', '🥩', '🍖', '🐟', '🐠', '🦐', '🦀', '🥞', '🧇'
];

export default function CategoryModal({ isOpen, category, onClose, onSave }: CategoryModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '🍽️',
    color: '#3B82F6',
    is_active: true,
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 當模態框打開時重置表單
  useEffect(() => {
    if (isOpen) {
      if (category) {
        // 編輯模式
        setFormData({
          name: category.name,
          description: category.description || '',
          icon: category.icon,
          color: category.color,
          is_active: category.is_active,
        });
      } else {
        // 新增模式
        setFormData({
          name: '',
          description: '',
          icon: '🍽️',
          color: '#3B82F6',
          is_active: true,
        });
      }
      setErrors({});
    }
  }, [isOpen, category]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = '分類名稱不能為空';
    } else if (formData.name.length > 50) {
      newErrors.name = '分類名稱不能超過 50 個字元';
    }

    if (formData.description && formData.description.length > 200) {
      newErrors.description = '分類描述不能超過 200 個字元';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const data = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        icon: formData.icon,
        color: formData.color,
        is_active: formData.is_active,
      };

      await onSave(data);
      onClose();
    } catch (error) {
      console.error('儲存分類失敗:', error);
      setErrors({ submit: '儲存失敗，請稍後再試' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // 清除該欄位的錯誤
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        {/* 標題 */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              {category ? '編輯分類' : '新增分類'}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              disabled={loading}
            >
              ✕
            </button>
          </div>
        </div>

        {/* 表單內容 */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* 分類名稱 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              分類名稱 *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="輸入分類名稱"
              disabled={loading}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          {/* 分類描述 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              分類描述
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.description ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="輸入分類描述（選填）"
              disabled={loading}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description}</p>
            )}
          </div>

          {/* 圖示選擇 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              分類圖示
            </label>
            <div className="grid grid-cols-10 gap-2">
              {PRESET_ICONS.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => handleInputChange('icon', icon)}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg hover:bg-gray-100 transition-colors ${
                    formData.icon === icon ? 'bg-blue-100 ring-2 ring-blue-500' : 'bg-gray-50'
                  }`}
                  disabled={loading}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          {/* 顏色選擇 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              分類顏色
            </label>
            <div className="grid grid-cols-5 gap-2">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => handleInputChange('color', color)}
                  className={`w-10 h-10 rounded-lg transition-all ${
                    formData.color === color ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: color }}
                  disabled={loading}
                />
              ))}
            </div>
            {/* 自訂顏色 */}
            <div className="mt-2">
              <input
                type="color"
                value={formData.color}
                onChange={(e) => handleInputChange('color', e.target.value)}
                className="w-full h-8 rounded border border-gray-300"
                disabled={loading}
              />
            </div>
          </div>

          {/* 預覽 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              預覽
            </label>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-lg font-bold"
                style={{ backgroundColor: formData.color }}
              >
                {formData.icon}
              </div>
              <div>
                <div className="font-medium text-gray-900">
                  {formData.name || '分類名稱'}
                </div>
                {formData.description && (
                  <div className="text-sm text-gray-600">
                    {formData.description}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 狀態開關 */}
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">
              啟用此分類
            </label>
            <button
              type="button"
              onClick={() => handleInputChange('is_active', !formData.is_active)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                formData.is_active ? 'bg-blue-600' : 'bg-gray-200'
              }`}
              disabled={loading}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  formData.is_active ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* 錯誤訊息 */}
          {errors.submit && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{errors.submit}</p>
            </div>
          )}

          {/* 操作按鈕 */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              disabled={loading}
            >
              取消
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              disabled={loading}
            >
              {loading ? '儲存中...' : '儲存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
