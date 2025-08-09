import React, { useState, useEffect } from 'react';
import { KDSMenuItem, MenuItemStatus } from '../../../lib/kds-types';
import MenuItemTimerService from '../../../lib/menu-item-timer-service';

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
  const [elapsedTime, setElapsedTime] = useState<number>(0);

  // 實時更新計時器
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (item.status === MenuItemStatus.PREPARING) {
      // 檢查是否有保存的計時器狀態
      const timerState = MenuItemTimerService.getTimerState(item.id);
      
      // 設置定時器每秒更新
      interval = setInterval(() => {
        if (timerState) {
          const startTime = new Date(timerState.startTime).getTime();
          const now = Date.now();
          const elapsed = Math.floor((now - startTime) / 1000); // 轉換為秒數
          setElapsedTime(elapsed);
        } else if (item.preparation_started_at) {
          // 回退到原始的準備開始時間
          const startTime = new Date(item.preparation_started_at).getTime();
          const now = Date.now();
          const elapsed = Math.floor((now - startTime) / 1000); // 轉換為秒數
          setElapsedTime(elapsed);
        }
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [item.status, item.id, item.preparation_started_at]);

  // 初始化計時器狀態
  useEffect(() => {
    if (item.status === MenuItemStatus.PREPARING) {
      const timerState = MenuItemTimerService.getTimerState(item.id);
      if (timerState) {
        const startTime = new Date(timerState.startTime).getTime();
        const now = Date.now();
        const elapsed = Math.floor((now - startTime) / 1000); // 轉換為秒數
        setElapsedTime(elapsed);
      }
    }
  }, [item.id, item.status]);

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
    const now = new Date().toISOString();
    // 保存計時器狀態
    MenuItemTimerService.saveTimerState(item.id, now);
    // 更新餐點狀態
    onStatusChange(item.id, MenuItemStatus.PREPARING);
  };

  const handleComplete = () => {
    // 移除計時器狀態
    MenuItemTimerService.removeTimerState(item.id);
    // 更新餐點狀態
    onStatusChange(item.id, MenuItemStatus.READY);
  };

  // 格式化時間顯示為 MM:SS 格式
  const formatElapsedTime = () => {
    if (item.status === MenuItemStatus.PREPARING) {
      const minutes = Math.floor(elapsedTime / 60);
      const seconds = elapsedTime % 60;
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    return null;
  };

  return (
    <div className="p-3 hover:bg-gray-50 transition-colors">
      <div className="flex items-center justify-between">
        {/* 左側：餐點信息 */}
        <div className="flex items-center space-x-3">
          {/* 狀態切換按鈕 */}
          {!item.isComboParent && (
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
          )}

          {/* 餐點詳情 */}
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <span className="font-medium text-gray-900">
                {/* 如果是套餐組件，顯示簡化的名稱 */}
                {item.isComboComponent 
                  ? (item.combo_selections?.[0]?.products?.name || item.product_name?.split(' - ').pop() || item.product_name)
                  : item.product_name
                }
              </span>
              <span className="text-gray-500">x{item.quantity}</span>
              
              {/* 簡化的套餐標識 */}
              {(item.isComboComponent || item.isComboParent || (item.combo_id && !item.isComboComponent)) && (
                <span className="px-1.5 py-0.5 bg-purple-100 text-purple-600 text-xs rounded">
                  套餐
                </span>
              )}
            </div>

            {/* 特殊說明 - 對套餐組件進行簡化 */}
            {item.special_instructions && !item.isComboComponent && (
              <div className="text-xs text-yellow-800 mt-1 whitespace-pre-line leading-snug">
                {item.isComboParent ? item.special_instructions : `📝 ${item.special_instructions}`}
              </div>
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
              {item.status === MenuItemStatus.PREPARING ? (
                <span className="text-blue-600 font-medium">
                  ⏱️ {formatElapsedTime()}
                </span>
              ) : (
                <span>預估 {item.estimated_prep_time || 0}分鐘</span>
              )}
            </div>
          </div>

          {/* 快速操作 */}
          <div className="flex items-center space-x-1">
            {!item.isComboParent && item.status === MenuItemStatus.PENDING && (
              <button
                onClick={handleStartPreparing}
                className="px-2 py-1 bg-blue-100 text-blue-600 text-xs rounded hover:bg-blue-200 transition-colors"
              >
                ▶️ 開始
              </button>
            )}
            
            {!item.isComboParent && item.status === MenuItemStatus.PREPARING && (
              <button
                onClick={handleComplete}
                className="px-2 py-1 bg-green-100 text-green-600 text-xs rounded hover:bg-green-200 transition-colors"
              >
                ✅ 完成
              </button>
            )}

            {/* 品質檢查 */}
            {!item.isComboParent && item.status === MenuItemStatus.READY && (
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
