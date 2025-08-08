import { create } from 'zustand';
import { 
  KDSOrder, 
  OrderStatus, 
  MenuItemStatus, 
  KDSStats, 
  KDSSettings, 
  KDSFilter,
  MenuCategory 
} from './kds-types';
import { KDSService } from './kds-service';

interface KDSStore {
  // 狀態
  orders: KDSOrder[];
  stats: KDSStats;
  settings: KDSSettings;
  filter: KDSFilter;
  isLoading: boolean;
  isInitialLoad: boolean;  // 新增：用於追蹤是否為初次載入
  error: string | null;

  // Actions
  fetchOrders: (silent?: boolean) => Promise<void>;  // 修改：新增 silent 參數
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  updateMenuItemStatus: (itemId: string, status: MenuItemStatus) => Promise<void>;
  updateSettings: (settings: Partial<KDSSettings>) => void;
  setFilter: (filter: Partial<KDSFilter>) => void;
  addNote: (orderId: string, note: string) => Promise<void>;
}

// 預設設定
const defaultSettings: KDSSettings = {
  autoRefreshInterval: 30,
  soundEnabled: true,
  displayMode: 'compact',
  defaultSort: 'time',
  categoriesVisible: [
    MenuCategory.APPETIZERS,
    MenuCategory.MAIN_COURSE,
    MenuCategory.BEVERAGES,
    MenuCategory.A_LA_CARTE,
    MenuCategory.ADDITIONAL,
    MenuCategory.DESSERTS
  ],
  estimatedTimes: {
    [MenuCategory.APPETIZERS]: 10,
    [MenuCategory.MAIN_COURSE]: 20,
    [MenuCategory.BEVERAGES]: 5,
    [MenuCategory.A_LA_CARTE]: 15,
    [MenuCategory.ADDITIONAL]: 8,
    [MenuCategory.DESSERTS]: 12
  },
  // 新增：功能旗標（預設關閉，不影響既有功能）
  mobileLandscapeMode: false,
  longPressQuickActions: true
};

// 預設篩選條件
const defaultFilter: KDSFilter = {
  status: [OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PREPARING],
  categories: [],
  urgencyLevel: []
};

// 初始統計數據
const initialStats: KDSStats = {
  pendingOrders: 0,
  inProgressOrders: 0,
  completedOrders: 0,
  averagePrepTime: 0,
  overdueOrders: 0,
  totalOrdersToday: 0,
  kitchenEfficiency: 0
};

export const useKDSStore = create<KDSStore>((set, get) => ({
  // 初始狀態
  orders: [],
  stats: initialStats,
  settings: defaultSettings,
  filter: defaultFilter,
  isLoading: false,
  isInitialLoad: true,  // 新增：初始狀態為 true
  error: null,

  // 獲取訂單數據
  fetchOrders: async (silent: boolean = false) => {
    const currentState = get();
    
    // 只有在非靜默模式且為初次載入時才顯示載入動畫
    if (!silent && currentState.isInitialLoad) {
      set({ isLoading: true, error: null });
    } else if (!silent) {
      // 非初次載入但非靜默模式，只清除錯誤
      set({ error: null });
    }
    
    try {
      // 使用環境變數中的餐廳ID
      const restaurantId = import.meta.env.VITE_RESTAURANT_ID || '11111111-1111-1111-1111-111111111111';
      
      console.log('🔍 KDS Store: 開始獲取訂單...');
      const orders = await KDSService.fetchActiveOrders(restaurantId);
      console.log(`✅ KDS Store: 成功獲取 ${orders.length} 筆訂單`);
      
      // 計算統計數據
      const stats: KDSStats = {
        pendingOrders: orders.filter(o => 
          o.status === OrderStatus.PENDING || o.status === OrderStatus.CONFIRMED
        ).length,
        inProgressOrders: orders.filter(o => o.status === OrderStatus.PREPARING).length,
        completedOrders: orders.filter(o => 
          o.status === OrderStatus.READY || 
          o.status === OrderStatus.SERVED || 
          o.status === OrderStatus.COMPLETED
        ).length,
        averagePrepTime: 15, // TODO: 從真實數據計算
        overdueOrders: orders.filter(o => {
          const now = new Date();
          const orderTime = new Date(o.created_at);
          const elapsedMinutes = (now.getTime() - orderTime.getTime()) / (1000 * 60);
          return elapsedMinutes > 30 && o.status !== OrderStatus.COMPLETED;
        }).length,
        totalOrdersToday: orders.length,
        kitchenEfficiency: 85 // TODO: 從真實數據計算
      };

      set({ 
        orders, 
        stats, 
        isLoading: false,
        isInitialLoad: false  // 第一次載入完成後設為 false
      });
    } catch (error) {
      console.error('❌ KDS Store: 獲取訂單失敗:', error);
      set({ 
        error: error instanceof Error ? error.message : '載入訂單失敗',
        isLoading: false,
        isInitialLoad: false  // 即使失敗也設為 false
      });
    }
  },

  // 更新訂單狀態
  updateOrderStatus: async (orderId: string, status: OrderStatus) => {
    try {
      await KDSService.updateOrderStatus(orderId, status);
      
      // 更新本地狀態
      const orders = get().orders.map(order => 
        order.id === orderId 
          ? { 
              ...order, 
              status,
              updated_at: new Date().toISOString()
            }
          : order
      );
      
      set({ orders });
      
      // 重新計算統計
      const stats: KDSStats = {
        pendingOrders: orders.filter(o => 
          o.status === OrderStatus.PENDING || o.status === OrderStatus.CONFIRMED
        ).length,
        inProgressOrders: orders.filter(o => o.status === OrderStatus.PREPARING).length,
        completedOrders: orders.filter(o => 
          o.status === OrderStatus.READY || 
          o.status === OrderStatus.SERVED || 
          o.status === OrderStatus.COMPLETED
        ).length,
        averagePrepTime: 15,
        overdueOrders: orders.filter(o => {
          const now = new Date();
          const orderTime = new Date(o.created_at);
          const elapsedMinutes = (now.getTime() - orderTime.getTime()) / (1000 * 60);
          return elapsedMinutes > 30 && o.status !== OrderStatus.COMPLETED;
        }).length,
        totalOrdersToday: orders.length,
        kitchenEfficiency: 85
      };
      
      set({ stats });
    } catch (error) {
      console.error('❌ 更新訂單狀態失敗:', error);
      set({ error: error instanceof Error ? error.message : '更新狀態失敗' });
    }
  },

  // 更新餐點狀態
  updateMenuItemStatus: async (itemId: string, status: MenuItemStatus) => {
    try {
      await KDSService.updateMenuItemStatus(itemId, status);
      
      // 更新本地狀態
      const orders = get().orders.map(order => ({
        ...order,
        menuItems: (order.menuItems || []).map(item =>
          item.id === itemId 
            ? { 
                ...item, 
                status,
                updated_at: new Date().toISOString()
              }
            : item
        )
      }));
      
      set({ orders });
    } catch (error) {
      console.error('❌ 更新餐點狀態失敗:', error);
      set({ error: error instanceof Error ? error.message : '更新餐點狀態失敗' });
    }
  },

  // 更新設定
  updateSettings: (newSettings: Partial<KDSSettings>) => {
    const settings = { ...get().settings, ...newSettings };
    set({ settings });
    
    // 保存到 localStorage
    localStorage.setItem('kds-settings', JSON.stringify(settings));
  },

  // 設定篩選條件
  setFilter: (newFilter: Partial<KDSFilter>) => {
    const filter = { ...get().filter, ...newFilter };
    set({ filter });
  },

  // 新增備註
  addNote: async (orderId: string, note: string) => {
    try {
      await KDSService.addOrderNote(orderId, note);
      
      // 重新獲取訂單以更新備註
      await get().fetchOrders();
    } catch (error) {
      console.error('❌ 新增備註失敗:', error);
      set({ error: error instanceof Error ? error.message : '新增備註失敗' });
    }
  }
}));

// 載入保存的設定
if (typeof window !== 'undefined') {
  const savedSettings = localStorage.getItem('kds-settings');
  if (savedSettings) {
    try {
      const settings = JSON.parse(savedSettings);
      useKDSStore.getState().updateSettings(settings);
    } catch (error) {
      console.warn('載入 KDS 設定失敗:', error);
    }
  }
}
