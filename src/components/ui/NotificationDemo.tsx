import React from 'react'
import { useNotifications } from '../ui/NotificationSystem'

const NotificationDemo: React.FC = () => {
  const notifications = useNotifications()

  const testNotifications = [
    {
      label: '成功通知',
      action: () => notifications.success('操作成功', '您的操作已成功完成！')
    },
    {
      label: '錯誤通知',
      action: () => notifications.error('操作失敗', '請檢查網路連接後重試')
    },
    {
      label: '警告通知',
      action: () => notifications.warning('注意事項', '庫存不足，請及時補貨')
    },
    {
      label: '資訊通知',
      action: () => notifications.info('系統提示', '系統將於晚上 12 點進行維護')
    },
    {
      label: '新訂單通知',
      action: () => notifications.newOrder('ORD001', '桌號 5')
    },
    {
      label: '訂單完成通知',
      action: () => notifications.orderReady('ORD001', '桌號 5')
    },
    {
      label: '桌位狀態變更',
      action: () => notifications.tableStatusChange(3, '使用中')
    },
    {
      label: '系統通知',
      action: () => notifications.systemNotification('系統更新', '新功能已上線，請查看使用說明')
    }
  ]

  const handleClearAll = () => {
    notifications.clearAll()
  }

  return (
    <div className="p-6 bg-background">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-foreground mb-6">通知系統演示</h1>
        
        <div className="bg-card rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">測試不同類型的通知</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {testNotifications.map((test, index) => (
              <button
                key={index}
                onClick={test.action}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg 
                         transition-colors duration-200 text-sm font-medium"
              >
                {test.label}
              </button>
            ))}
          </div>
          
          <div className="mt-4 pt-4 border-t border-border">
            <button
              onClick={handleClearAll}
              className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg 
                       transition-colors duration-200 font-medium"
            >
              清除所有通知
            </button>
          </div>
        </div>

        <div className="bg-card rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">通知系統功能特色</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-foreground mb-3">✨ 核心功能</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• 多種通知類型（成功、錯誤、警告、資訊）</li>
                <li>• 自動消失或手動關閉</li>
                <li>• 動畫效果和響應式設計</li>
                <li>• 音效提醒（可選）</li>
                <li>• 操作按鈕支援</li>
                <li>• 堆疊顯示管理</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium text-foreground mb-3">🎯 POS 專用功能</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• 新訂單音效提醒</li>
                <li>• 訂單狀態變更通知</li>
                <li>• 桌位狀態同步提醒</li>
                <li>• 系統狀態通知</li>
                <li>• 快速操作連結</li>
                <li>• 深色模式支援</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>💡 提示：</strong> 通知系統已整合到所有頁面中，在實際使用 POS 功能時會自動觸發相應的通知。
              音效檔案可放置在 <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">/public/sounds/</code> 目錄中。
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NotificationDemo
