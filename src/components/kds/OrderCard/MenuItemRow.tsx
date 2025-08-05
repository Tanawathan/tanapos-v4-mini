import React, { useState } from 'react';
import { KDSMenuItem, MenuItemStatus } from '../../../lib/kds-types';

interface MenuItemRowProps {
  item: KDSMenuItem;
  onStatusChange: (itemId: string, status: MenuItemStatus) => void;
}

export const MenuItemRow: React.FC<MenuItemRowProps> = ({
  item,
  onStatusChange
}) => {
  const [isChecked, setIsChecked] = useState(
    item.status === MenuItemStatus.READY || item.status === MenuItemStatus.SERVED
  );

  const getStatusIcon = () => {
    switch (item.status) {
      case MenuItemStatus.READY:
      case MenuItemStatus.SERVED:
        return '✅';
      case MenuItemStatus.PREPARING:
        return '🔄';
      case MenuItemStatus.CONFIRMED:
        return '📋';
      default:
        return '⏸️';
    }
  };

  const getStatusText = () => {
    switch (item.status) {
      case MenuItemStatus.READY:
        return '已完成';
      case MenuItemStatus.SERVED:
        return '已送出';
      case MenuItemStatus.PREPARING:
        return '製作中';
      case MenuItemStatus.CONFIRMED:
        return '已確認';
      default:
        return '待開始';
    }
  };

  const getStatusColor = () => {
    switch (item.status) {
      case MenuItemStatus.READY:
      case MenuItemStatus.SERVED:
        return 'text-green-600';
      case MenuItemStatus.PREPARING:
        return 'text-blue-600';
      case MenuItemStatus.CONFIRMED:
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  const handleStatusToggle = () => {
    const newStatus = isChecked ? MenuItemStatus.PENDING : MenuItemStatus.READY;
    setIsChecked(!isChecked);
    onStatusChange(item.id, newStatus);
  };

  const handleStartPreparing = () => {
    onStatusChange(item.id, MenuItemStatus.PREPARING);
  };

  // 計算經過時間
  const getElapsedTime = () => {
    if (item.preparation_started_at) {
      const now = new Date();
      const startTime = new Date(item.preparation_started_at);
      const elapsed = Math.floor((now.getTime() - startTime.getTime()) / (1000 * 60));
      return `${elapsed}分鐘`;
    }
    return null;
  };

  return (
    <div className="p-3 hover:bg-gray-50 transition-colors">
      <div className="flex items-center justify-between">
        {/* 左側：餐點信息 */}
        <div className="flex items-center space-x-3">
          {/* 狀態切換按鈕 */}
          <button
            onClick={handleStatusToggle}
            className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
              isChecked 
                ? 'bg-green-500 border-green-500 text-white' 
                : 'border-gray-300 hover:border-green-400'
            }`}
          >
            {isChecked && '✓'}
          </button>

          {/* 餐點詳情 */}
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <span className="font-medium text-gray-900">
                {item.product_name}
              </span>
              <span className="text-gray-500">x{item.quantity}</span>
              
              {/* 套餐標識 */}
              {item.combo_id && (
                <span className="px-2 py-0.5 bg-purple-100 text-purple-600 text-xs rounded-full">
                  套餐
                </span>
              )}
            </div>

            {/* 特殊說明 */}
            {item.special_instructions && (
              <p className="text-sm text-yellow-700 mt-1">
                📝 {item.special_instructions}
              </p>
            )}

          </div>
        </div>

        {/* 右側：狀態和操作 */}
        <div className="flex items-center space-x-3">
          {/* 時間信息 */}
          <div className="text-right text-sm">
            <div className={`font-medium ${getStatusColor()}`}>
              {getStatusIcon()} {getStatusText()}
            </div>
            <div className="text-gray-500">
              {item.status === MenuItemStatus.PREPARING && getElapsedTime() ? (
                <span>已用時 {getElapsedTime()}</span>
              ) : (
                <span>預估 {item.estimated_prep_time || 0}分鐘</span>
              )}
            </div>
          </div>

          {/* 快速操作 */}
          <div className="flex items-center space-x-1">
            {item.status === MenuItemStatus.PENDING && (
              <button
                onClick={handleStartPreparing}
                className="px-2 py-1 bg-blue-100 text-blue-600 text-xs rounded hover:bg-blue-200 transition-colors"
              >
                開始
              </button>
            )}
            
            {item.status === MenuItemStatus.PREPARING && (
              <button
                onClick={() => onStatusChange(item.id, MenuItemStatus.READY)}
                className="px-2 py-1 bg-green-100 text-green-600 text-xs rounded hover:bg-green-200 transition-colors"
              >
                完成
              </button>
            )}

            {/* 品質檢查 */}
            {item.status === MenuItemStatus.READY && (
              <button
                onClick={() => {
                  // TODO: 實作品質檢查邏輯
                }}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  item.quality_checked 
                    ? 'bg-green-100 text-green-600' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {item.quality_checked ? '✓ 已檢' : '品檢'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
