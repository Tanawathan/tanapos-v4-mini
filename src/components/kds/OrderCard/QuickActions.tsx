import React from 'react';
import { KDSOrder } from '../../../lib/kds-types';

interface QuickActionsProps {
  order: KDSOrder;
  onAction: (action: string) => void;
  onClose: () => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  order,
  onAction,
  onClose
}) => {
  const actions = [
    { id: 'start', label: '開始製作', icon: '🔄', color: 'text-blue-600 hover:bg-blue-50' },
    { id: 'complete', label: '標記完成', icon: '✅', color: 'text-green-600 hover:bg-green-50' },
    { id: 'pause', label: '暫停', icon: '⏸️', color: 'text-yellow-600 hover:bg-yellow-50' },
    { id: 'add_note', label: '新增備註', icon: '📝', color: 'text-gray-600 hover:bg-gray-50' },
    { id: 'report_issue', label: '問題回報', icon: '⚠️', color: 'text-red-600 hover:bg-red-50' },
    { id: 'view_details', label: '查看詳情', icon: '👁️', color: 'text-purple-600 hover:bg-purple-50' }
  ];

  return (
    <>
      {/* 背景遮罩 */}
      <div 
        className="fixed inset-0 z-40"
        onClick={onClose}
      />
      
      {/* 快速操作選單 */}
      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
        <div className="p-2 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="font-medium text-gray-900">快速操作</div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              ✕
            </button>
          </div>
          <div className="text-sm text-gray-500">
            訂單 #{order.order_number} | 桌號 T{order.table_number?.toString().padStart(2, '0')}
          </div>
        </div>
        
        <div className="py-2">
          <div className="grid grid-cols-2 gap-1">
            {actions.map((action) => (
              <button
                key={action.id}
                onClick={() => onAction(action.id)}
                className={`flex items-center space-x-2 w-full px-3 py-2 text-left text-sm transition-colors ${action.color}`}
              >
                <span>{action.icon}</span>
                <span>{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};
