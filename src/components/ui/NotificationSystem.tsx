import React, { createContext, useContext, useState, useEffect } from 'react'
import { CheckCircle, AlertCircle, Info, XCircle, X } from 'lucide-react'

// 通知類型定義
export interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  duration?: number // 毫秒，0 表示不自動消失
  action?: {
    label: string
    onClick: () => void
  }
  sound?: boolean // 是否播放音效
}

interface NotificationContextType {
  notifications: Notification[]
  addNotification: (notification: Omit<Notification, 'id'>) => void
  removeNotification: (id: string) => void
  clearAll: () => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

// 音效配置
const SOUNDS = {
  success: '/sounds/success.mp3',
  error: '/sounds/error.mp3',
  warning: '/sounds/warning.mp3',
  info: '/sounds/info.mp3',
  newOrder: '/sounds/new-order.mp3',
  orderReady: '/sounds/order-ready.mp3'
}

// 通知提供者組件
export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([])

  // 播放音效
  const playSound = (soundType: keyof typeof SOUNDS) => {
    try {
      const audio = new Audio(SOUNDS[soundType])
      audio.volume = 0.5
      audio.play().catch(console.warn) // 忽略自動播放限制錯誤
    } catch (error) {
      console.warn('播放音效失敗:', error)
    }
  }

  // 添加通知
  const addNotification = (notification: Omit<Notification, 'id'>) => {
    const id = `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const newNotification: Notification = {
      ...notification,
      id,
      duration: notification.duration ?? 5000 // 默認 5 秒
    }

    setNotifications(prev => [newNotification, ...prev])

    // 播放音效
    if (notification.sound !== false) {
      playSound(notification.type)
    }

    // 自動移除通知
    if (newNotification.duration && newNotification.duration > 0) {
      setTimeout(() => {
        removeNotification(id)
      }, newNotification.duration)
    }
  }

  // 移除通知
  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  // 清除所有通知
  const clearAll = () => {
    setNotifications([])
  }

  return (
    <NotificationContext.Provider value={{
      notifications,
      addNotification,
      removeNotification,
      clearAll
    }}>
      {children}
      <NotificationContainer />
    </NotificationContext.Provider>
  )
}

// 通知容器組件
const NotificationContainer: React.FC = () => {
  const { notifications, removeNotification } = useNotificationContext()

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {notifications.map(notification => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
    </div>
  )
}

// 通知項目組件
const NotificationItem: React.FC<{
  notification: Notification
  onClose: () => void
}> = ({ notification, onClose }) => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // 入場動畫
    const timer = setTimeout(() => setIsVisible(true), 50)
    return () => clearTimeout(timer)
  }, [])

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(onClose, 200) // 等待退場動畫
  }

  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />
      case 'info':
        return <Info className="w-5 h-5 text-blue-500" />
    }
  }

  const getBgColor = () => {
    switch (notification.type) {
      case 'success':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
      case 'error':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
      case 'warning':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
      case 'info':
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
    }
  }

  return (
    <div className={`
      notification-item ${isVisible ? 'notification-enter' : 'notification-exit'}
      ${getBgColor()}
      border rounded-lg shadow-lg p-4 transition-all duration-200
    `}>
      <div className="flex items-start space-x-3">
        {getIcon()}
        
        <div className="flex-1">
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {notification.title}
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
            {notification.message}
          </p>
          
          {notification.action && (
            <button
              onClick={notification.action.onClick}
              className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 mt-2"
            >
              {notification.action.label}
            </button>
          )}
        </div>
        
        <button
          onClick={handleClose}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

// Hook 用於使用通知系統
export const useNotificationContext = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotificationContext must be used within NotificationProvider')
  }
  return context
}

// 便捷的通知 Hook
export const useNotifications = () => {
  const { addNotification, removeNotification, clearAll } = useNotificationContext()

  return {
    // 成功通知
    success: (title: string, message: string, options?: Partial<Notification>) =>
      addNotification({ type: 'success', title, message, ...options }),
    
    // 錯誤通知
    error: (title: string, message: string, options?: Partial<Notification>) =>
      addNotification({ type: 'error', title, message, duration: 0, ...options }),
    
    // 警告通知
    warning: (title: string, message: string, options?: Partial<Notification>) =>
      addNotification({ type: 'warning', title, message, ...options }),
    
    // 資訊通知
    info: (title: string, message: string, options?: Partial<Notification>) =>
      addNotification({ type: 'info', title, message, ...options }),
    
    // 新訂單通知 (特殊音效)
    newOrder: (orderNumber: string, tableName: string) =>
      addNotification({
        type: 'info',
        title: '新訂單',
        message: `桌號 ${tableName} 的訂單 ${orderNumber} 已建立`,
        duration: 0,
        sound: true,
        action: {
          label: '查看訂單',
          onClick: () => {
            // 導航到訂單管理頁面
            window.location.href = '/orders'
          }
        }
      }),
    
    // 訂單完成通知
    orderReady: (orderNumber: string, tableName: string) =>
      addNotification({
        type: 'success',
        title: '訂單完成',
        message: `桌號 ${tableName} 的訂單 ${orderNumber} 已完成製作`,
        duration: 8000,
        sound: true,
        action: {
          label: '查看詳情',
          onClick: () => {
            window.location.href = '/kds'
          }
        }
      }),
    
    // 桌位狀態變更通知
    tableStatusChange: (tableNumber: number, status: string) =>
      addNotification({
        type: 'info',
        title: '桌位狀態變更',
        message: `桌號 ${tableNumber} 狀態已變更為 ${status}`,
        duration: 3000
      }),
    
    // 系統通知
    systemNotification: (title: string, message: string) =>
      addNotification({
        type: 'warning',
        title,
        message,
        duration: 10000
      }),

    // 手動移除和清除
    remove: removeNotification,
    clearAll
  }
}

export default NotificationProvider
