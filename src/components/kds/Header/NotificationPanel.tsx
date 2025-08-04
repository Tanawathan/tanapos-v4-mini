import React, { useState, useEffect } from 'react';

export const NotificationPanel: React.FC = () => {
  const [notifications, setNotifications] = useState<{
    id: string;
    message: string;
    type: 'info' | 'warning' | 'error';
    timestamp: Date;
  }[]>([]);

  const [isOpen, setIsOpen] = useState(false);

  // 模擬通知
  useEffect(() => {
    const interval = setInterval(() => {
      // 隨機生成通知 (實際應用中會從 WebSocket 或 API 接收)
      if (Math.random() > 0.8) {
        const newNotification = {
          id: Date.now().toString(),
          message: '新訂單 #ORD-' + Math.floor(Math.random() * 1000).toString().padStart(3, '0'),
          type: 'info' as const,
          timestamp: new Date()
        };
        
        setNotifications(prev => [newNotification, ...prev.slice(0, 4)]);
        
        // 5秒後自動移除通知
        setTimeout(() => {
          setNotifications(prev => prev.filter(n => n.id !== newNotification.id));
        }, 5000);
      }
    }, 10000); // 每10秒檢查一次

    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.length;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors"
        title="通知"
      >
        🔔
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-900">通知</h3>
              <button
                onClick={() => setNotifications([])}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                全部清除
              </button>
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                暫無通知
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="p-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50"
                >
                  <div className="flex items-start space-x-3">
                    <div className={`mt-1 w-2 h-2 rounded-full ${
                      notification.type === 'error' ? 'bg-red-400' :
                      notification.type === 'warning' ? 'bg-yellow-400' :
                      'bg-blue-400'
                    }`}></div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">{notification.message}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {notification.timestamp.toLocaleTimeString('zh-TW')}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 點擊外部關閉 */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        ></div>
      )}
    </div>
  );
};
