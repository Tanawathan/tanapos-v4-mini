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
  // 本地虛擬子項覆寫 (避免刷新回退)
  virtualOverrides: Record<string, Record<string, MenuItemStatus>>; // parentId -> (componentId -> status)
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
  longPressQuickActions: true,
  hideStats: false
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
  virtualOverrides: {},
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
      // 套用本地虛擬狀態覆寫 (處理 API race 導致回退)
      const overrides = get().virtualOverrides;
      const mergedOrders = orders.map(o => {
        if (!o.menuItems) return o;
        const updatedItems = o.menuItems.map(mi => {
          if ((mi as any).isVirtual && (mi as any).parentComboId) {
            const parentId = (mi as any).parentComboId as string;
            const ov = overrides[parentId]?.[mi.id];
            if (ov && ov !== mi.status) {
              return { ...mi, status: ov };
            }
          }
          return mi;
        });
        return { ...o, menuItems: updatedItems };
      });
      // 計算統計數據
      const stats: KDSStats = {
        pendingOrders: mergedOrders.filter(o => 
          o.status === OrderStatus.PENDING || o.status === OrderStatus.CONFIRMED
        ).length,
        inProgressOrders: mergedOrders.filter(o => o.status === OrderStatus.PREPARING).length,
        completedOrders: mergedOrders.filter(o => 
          o.status === OrderStatus.READY || 
          o.status === OrderStatus.SERVED || 
          o.status === OrderStatus.COMPLETED
        ).length,
        averagePrepTime: 15, // TODO: 從真實數據計算
        overdueOrders: mergedOrders.filter(o => {
          const now = new Date();
          const orderTime = new Date(o.created_at);
          const elapsedMinutes = (now.getTime() - orderTime.getTime()) / (1000 * 60);
          return elapsedMinutes > 30 && o.status !== OrderStatus.COMPLETED;
        }).length,
        totalOrdersToday: mergedOrders.length,
        kitchenEfficiency: 85 // TODO: 從真實數據計算
      };

      set({ 
        orders: mergedOrders, 
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
      const state = get();
      const target = state.orders.flatMap(o => o.menuItems || []).find(i => i.id === itemId);
      const isVirtual = (target as any)?.isVirtual;
      if (isVirtual) {
        const parentId = (target as any)?.parentComboId;
        if (parentId) {
          // 先更新本地 override (立即防跳回)
            const virtualOverrides = { ...get().virtualOverrides };
            virtualOverrides[parentId] = { ...(virtualOverrides[parentId] || {}), [itemId]: status };
            set({ virtualOverrides });
        }
      }

      if (isVirtual) {
        // 虛擬套餐子項：判斷是否需要同步父項狀態
        const parentId = (target as any)?.parentComboId;
        if (parentId) {
          const parentOrder = state.orders.find(o => (o.menuItems || []).some(mi => mi.id === parentId));
          if (parentOrder) {
            const siblings = (parentOrder.menuItems || []).filter(mi => (mi as any).parentComboId === parentId);
            const updatedAllReady = siblings.every(sib => {
              if (sib.id === itemId) return status === MenuItemStatus.READY || status === MenuItemStatus.SERVED;
              return sib.status === MenuItemStatus.READY || sib.status === MenuItemStatus.SERVED;
            });
            const parentNewStatus = updatedAllReady ? MenuItemStatus.READY : MenuItemStatus.PREPARING;
            await KDSService.updateMenuItemStatus(parentId, parentNewStatus);
          }
        }
        console.log('🧪 Virtual component local toggle + parent sync if needed', itemId, status);
      } else {
        await KDSService.updateMenuItemStatus(itemId, status);
      }

      // 本地更新 (包括父項重新計算)
      const orders = state.orders.map(order => {
        const updatedMenuItems = (order.menuItems || []).map(mi => {
          if (mi.id === itemId) return { ...mi, status, updated_at: new Date().toISOString() };
          return mi;
        });

        // 若是虛擬子項，同步父項狀態
        if (isVirtual && (target as any)?.parentComboId) {
          const parentId = (target as any).parentComboId;
          const siblings = updatedMenuItems.filter(mi => (mi as any).parentComboId === parentId);
          const allReady = siblings.length>0 && siblings.every(sib => sib.status === MenuItemStatus.READY || sib.status === MenuItemStatus.SERVED);
          const idx = updatedMenuItems.findIndex(mi => mi.id === parentId);
          if (idx >= 0) {
            updatedMenuItems[idx] = { ...updatedMenuItems[idx], status: allReady ? MenuItemStatus.READY : MenuItemStatus.PREPARING, updated_at: new Date().toISOString() };
          }
        }
        return { ...order, menuItems: updatedMenuItems };
      });

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
