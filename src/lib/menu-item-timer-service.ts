// 餐點計時器本地儲存服務

interface TimerState {
  startTime: string;
  timestamp: number;
}

interface ActiveTimer {
  itemId: string;
  startTime: string;
  elapsedTime: number;
}

class MenuItemTimerServiceClass {
  private static readonly STORAGE_KEY = 'kds-menu-item-timers';

  // 保存計時器狀態到 localStorage
  saveTimerState(itemId: string, startTime: string): void {
    try {
      const timers = this.getTimerStates();
      timers[itemId] = {
        startTime,
        timestamp: Date.now()
      };
      localStorage.setItem(MenuItemTimerServiceClass.STORAGE_KEY, JSON.stringify(timers));
      console.log(`🎯 MenuItemTimer: 保存計時器狀態 ${itemId}`);
    } catch (error) {
      console.warn('無法保存計時器狀態:', error);
    }
  }

  // 獲取計時器狀態
  getTimerState(itemId: string): { startTime: string } | null {
    try {
      const timers = this.getTimerStates();
      return timers[itemId] || null;
    } catch (error) {
      console.warn('無法讀取計時器狀態:', error);
      return null;
    }
  }

  // 移除計時器狀態
  removeTimerState(itemId: string): void {
    try {
      const timers = this.getTimerStates();
      delete timers[itemId];
      localStorage.setItem(MenuItemTimerServiceClass.STORAGE_KEY, JSON.stringify(timers));
      console.log(`🎯 MenuItemTimer: 移除計時器狀態 ${itemId}`);
    } catch (error) {
      console.warn('無法移除計時器狀態:', error);
    }
  }

  // 清除所有計時器狀態
  clearAllTimerStates(): void {
    try {
      localStorage.removeItem(MenuItemTimerServiceClass.STORAGE_KEY);
      console.log('🎯 MenuItemTimer: 清除所有計時器狀態');
    } catch (error) {
      console.warn('無法清除計時器狀態:', error);
    }
  }

  // 獲取所有計時器狀態
  private getTimerStates(): Record<string, TimerState> {
    try {
      const stored = localStorage.getItem(MenuItemTimerServiceClass.STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.warn('無法解析計時器狀態:', error);
      return {};
    }
  }

  // 清理過期的計時器狀態 (超過 24 小時)
  cleanupExpiredTimers(): void {
    try {
      const timers = this.getTimerStates();
      const now = Date.now();
      const twentyFourHours = 24 * 60 * 60 * 1000;
      
      let hasChanges = false;
      Object.keys(timers).forEach(itemId => {
        if (now - timers[itemId].timestamp > twentyFourHours) {
          delete timers[itemId];
          hasChanges = true;
        }
      });

      if (hasChanges) {
        localStorage.setItem(MenuItemTimerServiceClass.STORAGE_KEY, JSON.stringify(timers));
        console.log('🎯 MenuItemTimer: 清理過期計時器');
      }
    } catch (error) {
      console.warn('無法清理過期計時器:', error);
    }
  }

  // 獲取計時器的已進行時間（毫秒）
  getElapsedTime(itemId: string): number {
    try {
      const timer = this.getTimerState(itemId);
      if (!timer) return 0;

      const now = Date.now();
      const startTime = new Date(timer.startTime).getTime();
      return now - startTime;
    } catch (error) {
      console.warn('無法計算已進行時間:', error);
      return 0;
    }
  }

  // 格式化時間顯示
  formatElapsedTime(itemId: string): string {
    const elapsedMs = this.getElapsedTime(itemId);
    const elapsedMinutes = Math.floor(elapsedMs / (1000 * 60));
    
    if (elapsedMinutes >= 60) {
      const hours = Math.floor(elapsedMinutes / 60);
      const minutes = elapsedMinutes % 60;
      return `${hours}小時${minutes}分鐘`;
    }
    
    return `${elapsedMinutes}分鐘`;
  }

  // 檢查是否有活躍的計時器
  hasActiveTimer(itemId: string): boolean {
    return this.getTimerState(itemId) !== null;
  }

  // 獲取所有活躍的計時器
  getAllActiveTimers(): ActiveTimer[] {
    try {
      const timers = this.getTimerStates();
      return Object.keys(timers).map(itemId => ({
        itemId,
        startTime: timers[itemId].startTime,
        elapsedTime: this.getElapsedTime(itemId)
      }));
    } catch (error) {
      console.warn('無法獲取活躍計時器:', error);
      return [];
    }
  }
}

// 創建單例實例
const MenuItemTimerService = new MenuItemTimerServiceClass();

// 導出實例
export default MenuItemTimerService;

// 也提供命名導出以支持舊的導入方式
export { MenuItemTimerService };
