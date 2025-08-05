import React, { useState, useEffect } from 'react';
import { KDSOrder, UrgencyLevel } from '../../../lib/kds-types';

interface OrderSummaryProps {
  order: KDSOrder;
  completedItems: number;
  totalItems: number;
  estimatedTimeRemaining: number;
  urgencyLevel: UrgencyLevel;
  progressPercentage: number;
}

export const OrderSummary: React.FC<OrderSummaryProps> = ({
  order,
  completedItems,
  totalItems,
  estimatedTimeRemaining,
  urgencyLevel,
  progressPercentage
}) => {
  const [currentTime, setCurrentTime] = useState(Date.now());

  // 每分鐘更新一次時間，確保持續時間顯示準確
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 60000); // 每60秒更新一次

    return () => clearInterval(interval);
  }, []);

  // 計算訂單持續時間（分鐘）
  const calculateOrderDuration = (createdAt: string): number => {
    const orderTime = new Date(createdAt).getTime();
    return Math.floor((currentTime - orderTime) / (1000 * 60)); // 轉換為分鐘
  };

  // 格式化持續時間顯示
  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes}分鐘`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}小時${remainingMinutes}分鐘`;
  };

  const getStatusIcon = () => {
    switch (order.status) {
      case 'pending':
      case 'confirmed':
        return '📦';
      case 'preparing':
        return '🔄';
      case 'ready':
      case 'served':
      case 'completed':
        return '✅';
      default:
        return '📋';
    }
  };

  const getUrgencyColor = () => {
    switch (urgencyLevel) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-2">
      {/* 第一行：基本信息 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="text-lg">{getStatusIcon()}</span>
          <div className="flex items-center space-x-2 text-sm">
            <span className="font-semibold text-gray-900">#{order.order_number}</span>
            <span className="text-gray-500">|</span>
            <span className="text-gray-700">T{order.table_number?.toString().padStart(2, '0')}</span>
            <span className="text-gray-500">|</span>
            <span className="text-gray-600">
              ⏰ {formatDuration(calculateOrderDuration(order.created_at))}
            </span>
            <span className="text-gray-500">|</span>
            <span className="text-gray-600">👥 {order.party_size || 0}人</span>
            <span className="text-gray-500">|</span>
            <span className="text-gray-600">📦 {totalItems}項</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button 
            className="text-gray-400 hover:text-gray-600 transition-colors"
            title="展開訂單詳情"
          >
            ▼
          </button>
        </div>
      </div>

      {/* 第二行：進度和時間 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* 進度指示 */}
          <div className="flex items-center space-x-2">
            <span className={`text-sm font-medium ${getUrgencyColor()}`}>
              {order.status === 'preparing' ? '🔄 製作中' : 
               order.status === 'ready' ? '✅ 已完成' : 
               '📦 待處理'}
            </span>
            <span className="text-sm text-gray-600">
              {completedItems}/{totalItems}
            </span>
          </div>

          {/* 進度條 */}
          <div className="flex-1 min-w-[80px]">
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div 
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  progressPercentage === 100 ? 'bg-green-500' :
                  progressPercentage > 50 ? 'bg-blue-500' : 'bg-orange-500'
                }`}
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          {/* 預估時間 */}
          {estimatedTimeRemaining > 0 && (
            <span className={`text-sm ${getUrgencyColor()}`}>
              ⏱️ 剩餘 {estimatedTimeRemaining}分鐘
            </span>
          )}
        </div>

        {/* 快速操作按鈕 */}
        <div className="flex items-center space-x-1">
          <button
            className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors"
            title="快速操作"
            onClick={(e) => {
              e.stopPropagation();
              // 觸發快速操作選單
            }}
          >
            操作
          </button>
        </div>
      </div>

      {/* 超時警告 */}
      {urgencyLevel === 'high' && (
        <div className="flex items-center space-x-1 text-red-600 text-sm">
          <span className="animate-pulse">⚠️</span>
          <span>超時警告</span>
        </div>
      )}
    </div>
  );
};
