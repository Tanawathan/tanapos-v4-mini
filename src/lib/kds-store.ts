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

interface KDSStore {
  // 狀態
  orders: KDSOrder[];
  stats: KDSStats;
  settings: KDSSettings;
  filter: KDSFilter;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchOrders: () => Promise<void>;
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
  }
};

// 預設統計
const defaultStats: KDSStats = {
  pendingOrders: 0,
  inProgressOrders: 0,
  completedOrders: 0,
  averagePrepTime: 0,
  overdueOrders: 0,
  totalOrdersToday: 0,
  kitchenEfficiency: 0
};

// 模擬數據 (開發階段使用)
const mockOrders: KDSOrder[] = [
  {
    id: '1',
    orderNumber: 'ORD-001',
    tableNumber: 5,
    customerCount: 4,
    subtotal: 850,
    taxAmount: 85,
    totalAmount: 935,
    status: OrderStatus.PENDING,
    paymentStatus: 'unpaid',
    createdAt: new Date(Date.now() - 10 * 60 * 1000), // 10分鐘前
    updatedAt: new Date(),
    notes: '牛排七分熟，義大利麵不要洋蔥',
    isExpanded: false,
    urgencyLevel: 'medium',
    totalItems: 8,
    completedItems: 2,
    menuItems: [
      {
        id: 'item-1',
        orderId: '1',
        productName: '凱薩沙拉',
        quantity: 1,
        unitPrice: 180,
        totalPrice: 180,
        status: MenuItemStatus.READY,
        category: MenuCategory.APPETIZERS,
        estimatedTime: 8,
        isComboItem: false,
        qualityChecked: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'item-2',
        orderId: '1',
        productName: '蒜香麵包',
        quantity: 2,
        unitPrice: 80,
        totalPrice: 160,
        status: MenuItemStatus.PREPARING,
        category: MenuCategory.APPETIZERS,
        estimatedTime: 5,
        isComboItem: false,
        qualityChecked: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'item-3',
        orderId: '1',
        productName: '牛排套餐',
        quantity: 2,
        unitPrice: 450,
        totalPrice: 900,
        status: MenuItemStatus.PREPARING,
        category: MenuCategory.MAIN_COURSE,
        estimatedTime: 15,
        isComboItem: true,
        comboId: 'combo-1',
        qualityChecked: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]
  },
  {
    id: '2',
    orderNumber: 'ORD-002',
    tableNumber: 8,
    customerCount: 2,
    subtotal: 520,
    taxAmount: 52,
    totalAmount: 572,
    status: OrderStatus.PREPARING,
    paymentStatus: 'paid',
    createdAt: new Date(Date.now() - 20 * 60 * 1000), // 20分鐘前
    updatedAt: new Date(),
    isExpanded: false,
    urgencyLevel: 'high',
    totalItems: 5,
    completedItems: 3,
    menuItems: [
      {
        id: 'item-4',
        orderId: '2',
        productName: '海鮮義大利麵',
        quantity: 1,
        unitPrice: 320,
        totalPrice: 320,
        status: MenuItemStatus.PREPARING,
        category: MenuCategory.MAIN_COURSE,
        estimatedTime: 18,
        isComboItem: false,
        qualityChecked: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]
  },
  {
    id: '3',
    orderNumber: 'ORD-003',
    tableNumber: 12,
    customerCount: 6,
    subtotal: 1200,
    taxAmount: 120,
    totalAmount: 1320,
    status: OrderStatus.READY,
    paymentStatus: 'paid',
    createdAt: new Date(Date.now() - 45 * 60 * 1000), // 45分鐘前
    updatedAt: new Date(),
    completedAt: new Date(Date.now() - 5 * 60 * 1000), // 5分鐘前完成
    isExpanded: false,
    urgencyLevel: 'low',
    totalItems: 12,
    completedItems: 12,
    menuItems: []
  }
];

export const useKDSStore = create<KDSStore>((set, get) => ({
  // 初始狀態
  orders: [],
  stats: defaultStats,
  settings: defaultSettings,
  filter: {},
  isLoading: false,
  error: null,

  // 獲取訂單數據
  fetchOrders: async () => {
    set({ isLoading: true, error: null });
    
    try {
      // TODO: 替換為實際的 API 調用
      // const response = await supabase.from('orders').select('*');
      
      // 模擬 API 延遲
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // 使用模擬數據
      const orders = mockOrders;
      
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
        averagePrepTime: 15, // 模擬數據
        overdueOrders: orders.filter(o => {
          const now = new Date();
          const orderTime = new Date(o.createdAt);
          const elapsedMinutes = (now.getTime() - orderTime.getTime()) / (1000 * 60);
          return elapsedMinutes > 30 && o.status !== OrderStatus.COMPLETED;
        }).length,
        totalOrdersToday: orders.length,
        kitchenEfficiency: 85 // 模擬數據
      };

      set({ orders, stats, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : '載入訂單失敗',
        isLoading: false 
      });
    }
  },

  // 更新訂單狀態
  updateOrderStatus: async (orderId: string, status: OrderStatus) => {
    try {
      // TODO: 實際的 API 調用
      // await supabase.from('orders').update({ status }).eq('id', orderId);
      
      // 更新本地狀態
      const orders = get().orders.map(order => 
        order.id === orderId 
          ? { 
              ...order, 
              status,
              updatedAt: new Date(),
              ...(status === OrderStatus.COMPLETED && { completedAt: new Date() })
            }
          : order
      );
      
      set({ orders });
      
      // 重新計算統計
      get().fetchOrders();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : '更新狀態失敗' });
    }
  },

  // 更新餐點狀態
  updateMenuItemStatus: async (itemId: string, status: MenuItemStatus) => {
    try {
      // TODO: 實際的 API 調用
      // await supabase.from('order_items').update({ status }).eq('id', itemId);
      
      // 更新本地狀態
      const orders = get().orders.map(order => ({
        ...order,
        menuItems: order.menuItems.map(item =>
          item.id === itemId 
            ? { 
                ...item, 
                status,
                updatedAt: new Date(),
                ...(status === MenuItemStatus.READY && { completedAt: new Date() })
              }
            : item
        )
      }));
      
      set({ orders });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : '更新餐點狀態失敗' });
    }
  },

  // 更新設定
  updateSettings: (newSettings: Partial<KDSSettings>) => {
    const settings = { ...get().settings, ...newSettings };
    set({ settings });
    
    // TODO: 保存到 localStorage 或 API
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
      // TODO: 實際的 API 調用
      // await supabase.from('orders').update({ notes: note }).eq('id', orderId);
      
      // 更新本地狀態
      const orders = get().orders.map(order => 
        order.id === orderId 
          ? { ...order, notes: note, updatedAt: new Date() }
          : order
      );
      
      set({ orders });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : '新增備註失敗' });
    }
  }
}));
