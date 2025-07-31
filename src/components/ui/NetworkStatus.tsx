import React, { useState, useEffect } from 'react'

interface NetworkStatusProps {
  onStatusChange?: (isOnline: boolean) => void
}

export const NetworkStatus: React.FC<NetworkStatusProps> = ({ onStatusChange }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [lastChecked, setLastChecked] = useState(new Date())

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      setLastChecked(new Date())
      onStatusChange?.(true)
    }

    const handleOffline = () => {
      setIsOnline(false)
      setLastChecked(new Date())
      onStatusChange?.(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // 定期檢查網路狀態
    const interval = setInterval(() => {
      const wasOnline = isOnline
      const nowOnline = navigator.onLine
      
      if (wasOnline !== nowOnline) {
        setIsOnline(nowOnline)
        setLastChecked(new Date())
        onStatusChange?.(nowOnline)
      }
    }, 5000)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      clearInterval(interval)
    }
  }, [isOnline, onStatusChange])

  if (!isOnline) {
    return (
      <div className="fixed top-0 left-0 right-0 bg-red-600 text-white p-2 text-center z-50">
        <div className="flex items-center justify-center">
          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <span>網路連線中斷 - 離線模式</span>
          <span className="ml-2 text-xs opacity-75">
            {lastChecked.toLocaleTimeString()}
          </span>
        </div>
      </div>
    )
  }

  return null
}

export default NetworkStatus
