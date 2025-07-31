// 離線模式管理器
export class OfflineManager {
  private static instance: OfflineManager
  private isOnline: boolean = navigator.onLine
  private retryCount: number = 0
  private maxRetries: number = 3
  private retryDelay: number = 2000

  private constructor() {
    // 監聽網路狀態變化
    window.addEventListener('online', this.handleOnline.bind(this))
    window.addEventListener('offline', this.handleOffline.bind(this))
  }

  static getInstance(): OfflineManager {
    if (!OfflineManager.instance) {
      OfflineManager.instance = new OfflineManager()
    }
    return OfflineManager.instance
  }

  private handleOnline() {
    this.isOnline = true
    this.retryCount = 0
    console.log('🌐 網路連線已恢復')
  }

  private handleOffline() {
    this.isOnline = false
    console.log('📴 網路連線中斷，切換至離線模式')
  }

  getNetworkStatus(): boolean {
    return this.isOnline
  }

  // 檢測 API 連線狀態
  async checkAPIConnection(url: string): Promise<boolean> {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // 5秒超時

      const response = await fetch(url, {
        method: 'HEAD',
        signal: controller.signal,
        cache: 'no-cache'
      })
      
      clearTimeout(timeoutId)
      return response.ok
    } catch (error) {
      console.log('API 連線檢測失敗:', error)
      return false
    }
  }

  // 重試機制
  async retryWithBackoff<T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T | null> {
    for (let i = 0; i <= this.maxRetries; i++) {
      try {
        const result = await operation()
        if (i > 0) {
          console.log(`✅ ${operationName} 重試成功 (第${i}次)`)
        }
        return result
      } catch (error) {
        if (i === this.maxRetries) {
          console.error(`❌ ${operationName} 重試失敗，已達最大重試次數`)
          return null
        }
        
        const delay = this.retryDelay * Math.pow(2, i) // 指數退避
        console.log(`🔄 ${operationName} 失敗，${delay}ms 後重試 (${i + 1}/${this.maxRetries})`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
    return null
  }

  // 模擬示範資料
  getOfflineTableData() {
    return [
      {
        id: 'offline-table-1',
        table_number: 1,
        capacity: 2,
        status: 'available' as any,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        orders: []
      },
      {
        id: 'offline-table-2',
        table_number: 2,
        capacity: 4,
        status: 'seated' as any,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        orders: [
          {
            id: 'offline-order-1',
            order_number: 'OFF001',
            total_amount: 850,
            status: 'confirmed',
            created_at: new Date().toISOString()
          }
        ]
      },
      {
        id: 'offline-table-3',
        table_number: 3,
        capacity: 6,
        status: 'reserved' as any,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        orders: []
      },
      {
        id: 'offline-table-4',
        table_number: 4,
        capacity: 4,
        status: 'cleaning' as any,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        orders: []
      }
    ]
  }

  getOfflineReservationData() {
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    return [
      {
        id: 'offline-reservation-1',
        table_id: 'offline-table-3',
        customer_name: '離線模式客戶',
        customer_phone: '0900-000-000',
        party_size: 4,
        reservation_time: tomorrow.toISOString(),
        duration_minutes: 120,
        status: 'confirmed' as any,
        notes: '離線模式示範預約',
        created_at: new Date().toISOString(),
        tables: {
          table_number: 3,
          capacity: 6
        }
      }
    ]
  }

  // 本地存儲管理
  saveToLocalStorage(key: string, data: any) {
    try {
      localStorage.setItem(key, JSON.stringify(data))
    } catch (error) {
      console.error('保存到本地存儲失敗:', error)
    }
  }

  getFromLocalStorage(key: string) {
    try {
      const data = localStorage.getItem(key)
      return data ? JSON.parse(data) : null
    } catch (error) {
      console.error('從本地存儲讀取失敗:', error)
      return null
    }
  }

  // 顯示離線狀態提示
  showOfflineNotification() {
    return {
      type: 'warning' as const,
      title: '離線模式',
      message: '目前處於離線模式，顯示示範資料。網路恢復後將自動同步。',
      action: '重新連線'
    }
  }
}

export const offlineManager = OfflineManager.getInstance()
