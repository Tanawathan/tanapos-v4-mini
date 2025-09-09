// ================================
// 庫存管理系統 - Zustand Store
// ================================

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type {
  InventoryState,
  ProductStock,
  RawMaterialStock,
  InventoryTransaction,
  StockAlert,
  InventoryCount,
  InventorySearchFilters,
  TransactionSearchFilters,
  AlertSearchFilters,
  InventoryStats,
  UUID,
} from '../types';

import InventoryServices from '../services';

const {
  InventoryTransactionService,
  StockAlertService,
  InventoryCountService,
  ProductStockService,
  RawMaterialStockService,
  InventoryStatsService,
} = InventoryServices;

// ================================
// 初始狀態
// ================================

const initialState: InventoryState = {
  // 資料
  products: [],
  rawMaterials: [],
  transactions: [],
  alerts: [],
  counts: [],
  
  // 載入狀態
  loading: {
    products: false,
    rawMaterials: false,
    transactions: false,
    alerts: false,
    counts: false,
  },
  
  // 錯誤狀態
  errors: {},
  
  // 篩選器
  filters: {
    products: {},
    transactions: {},
    alerts: {},
  },
  
  // 統計資料
  stats: {
    total_products: 0,
    total_raw_materials: 0,
    low_stock_alerts: 0,
    total_stock_value: 0,
    recent_transactions: 0,
    pending_counts: 0,
  },
  
  // UI 狀態
  selectedItems: [],
  currentPage: 1,
  itemsPerPage: 20,
};

// ================================
// Store Actions 接口
// ================================

interface InventoryActions {
  // 產品相關
  fetchProducts: (filters?: InventorySearchFilters, page?: number) => Promise<void>;
  setProductsFilter: (filters: InventorySearchFilters) => void;
  
  // 原物料相關
  fetchRawMaterials: (filters?: InventorySearchFilters, page?: number) => Promise<void>;
  
  // 庫存異動相關
  fetchTransactions: (filters?: TransactionSearchFilters, page?: number) => Promise<void>;
  setTransactionsFilter: (filters: TransactionSearchFilters) => void;
  createTransaction: (data: any) => Promise<void>;
  
  // 警示相關
  fetchAlerts: (filters?: AlertSearchFilters, page?: number) => Promise<void>;
  setAlertsFilter: (filters: AlertSearchFilters) => void;
  acknowledgeAlert: (id: UUID) => Promise<void>;
  resolveAlert: (id: UUID) => Promise<void>;
  dismissAlert: (id: UUID) => Promise<void>;
  checkStockLevels: () => Promise<void>;
  
  // 盤點相關
  fetchCounts: (page?: number) => Promise<void>;
  createCount: (data: any) => Promise<void>;
  completeCount: (id: UUID) => Promise<void>;
  approveCount: (id: UUID) => Promise<void>;
  
  // 統計相關
  fetchStats: () => Promise<void>;
  
  // UI 狀態
  setSelectedItems: (items: UUID[]) => void;
  clearSelection: () => void;
  setCurrentPage: (page: number) => void;
  
  // 錯誤處理
  clearError: (type: keyof InventoryState['errors']) => void;
  clearAllErrors: () => void;
}

// ================================
// Zustand Store
// ================================

export const useInventoryStore = create<InventoryState & InventoryActions>()(
  devtools(
    (set, get) => ({
      ...initialState,
      
      // ================================
      // 產品相關 Actions
      // ================================
      
      fetchProducts: async (filters = {}, page = 1) => {
        set((state) => ({
          loading: { ...state.loading, products: true },
          errors: { ...state.errors, products: undefined },
        }));
        
        try {
          const response = await ProductStockService.getProducts(filters, page, get().itemsPerPage);
          set((state) => ({
            products: response.data,
            loading: { ...state.loading, products: false },
            currentPage: page,
          }));
        } catch (error) {
          set((state) => ({
            loading: { ...state.loading, products: false },
            errors: { ...state.errors, products: (error as Error).message },
          }));
        }
      },
      
      setProductsFilter: (filters) => {
        set((state) => ({
          filters: { ...state.filters, products: filters },
          currentPage: 1,
        }));
        // 自動重新載入資料
        get().fetchProducts(filters, 1);
      },
      
      // ================================
      // 原物料相關 Actions
      // ================================
      
      fetchRawMaterials: async (filters = {}, page = 1) => {
        set((state) => ({
          loading: { ...state.loading, rawMaterials: true },
          errors: { ...state.errors, rawMaterials: undefined },
        }));
        
        try {
          const response = await RawMaterialStockService.getRawMaterials(filters, page, get().itemsPerPage);
          set((state) => ({
            rawMaterials: response.data,
            loading: { ...state.loading, rawMaterials: false },
            currentPage: page,
          }));
        } catch (error) {
          set((state) => ({
            loading: { ...state.loading, rawMaterials: false },
            errors: { ...state.errors, rawMaterials: (error as Error).message },
          }));
        }
      },
      
      // ================================
      // 庫存異動相關 Actions
      // ================================
      
      fetchTransactions: async (filters = {}, page = 1) => {
        set((state) => ({
          loading: { ...state.loading, transactions: true },
          errors: { ...state.errors, transactions: undefined },
        }));
        
        try {
          const response = await InventoryTransactionService.getTransactions(filters, page, get().itemsPerPage);
          set((state) => ({
            transactions: response.data,
            loading: { ...state.loading, transactions: false },
            currentPage: page,
          }));
        } catch (error) {
          set((state) => ({
            loading: { ...state.loading, transactions: false },
            errors: { ...state.errors, transactions: (error as Error).message },
          }));
        }
      },
      
      setTransactionsFilter: (filters) => {
        set((state) => ({
          filters: { ...state.filters, transactions: filters },
          currentPage: 1,
        }));
        // 自動重新載入資料
        get().fetchTransactions(filters, 1);
      },
      
      createTransaction: async (data) => {
        try {
          await InventoryTransactionService.createTransaction(data);
          // 重新載入相關資料
          await Promise.all([
            get().fetchTransactions(),
            get().fetchProducts(),
            get().fetchRawMaterials(),
            get().fetchStats(),
          ]);
        } catch (error) {
          set((state) => ({
            errors: { ...state.errors, transactions: (error as Error).message },
          }));
          throw error;
        }
      },
      
      // ================================
      // 警示相關 Actions
      // ================================
      
      fetchAlerts: async (filters = {}, page = 1) => {
        set((state) => ({
          loading: { ...state.loading, alerts: true },
          errors: { ...state.errors, alerts: undefined },
        }));
        
        try {
          const response = await StockAlertService.getAlerts(filters, page, get().itemsPerPage);
          set((state) => ({
            alerts: response.data,
            loading: { ...state.loading, alerts: false },
            currentPage: page,
          }));
        } catch (error) {
          set((state) => ({
            loading: { ...state.loading, alerts: false },
            errors: { ...state.errors, alerts: (error as Error).message },
          }));
        }
      },
      
      setAlertsFilter: (filters) => {
        set((state) => ({
          filters: { ...state.filters, alerts: filters },
          currentPage: 1,
        }));
        // 自動重新載入資料
        get().fetchAlerts(filters, 1);
      },
      
      acknowledgeAlert: async (id) => {
        try {
          await StockAlertService.acknowledgeAlert(id);
          // 更新本地狀態
          set((state) => ({
            alerts: state.alerts.map(alert =>
              alert.id === id
                ? { ...alert, status: 'acknowledged', acknowledged_at: new Date().toISOString() }
                : alert
            ),
          }));
        } catch (error) {
          set((state) => ({
            errors: { ...state.errors, alerts: (error as Error).message },
          }));
          throw error;
        }
      },
      
      resolveAlert: async (id) => {
        try {
          await StockAlertService.resolveAlert(id);
          // 更新本地狀態
          set((state) => ({
            alerts: state.alerts.map(alert =>
              alert.id === id
                ? { ...alert, status: 'resolved', resolved_at: new Date().toISOString() }
                : alert
            ),
          }));
        } catch (error) {
          set((state) => ({
            errors: { ...state.errors, alerts: (error as Error).message },
          }));
          throw error;
        }
      },
      
      dismissAlert: async (id) => {
        try {
          await StockAlertService.dismissAlert(id);
          // 更新本地狀態
          set((state) => ({
            alerts: state.alerts.map(alert =>
              alert.id === id ? { ...alert, status: 'dismissed' } : alert
            ),
          }));
        } catch (error) {
          set((state) => ({
            errors: { ...state.errors, alerts: (error as Error).message },
          }));
          throw error;
        }
      },
      
      checkStockLevels: async () => {
        try {
          await StockAlertService.checkStockLevels();
          // 重新載入警示
          await get().fetchAlerts();
        } catch (error) {
          set((state) => ({
            errors: { ...state.errors, alerts: (error as Error).message },
          }));
          throw error;
        }
      },
      
      // ================================
      // 盤點相關 Actions
      // ================================
      
      fetchCounts: async (page = 1) => {
        set((state) => ({
          loading: { ...state.loading, counts: true },
          errors: { ...state.errors, counts: undefined },
        }));
        
        try {
          const response = await InventoryCountService.getCounts(page, get().itemsPerPage);
          set((state) => ({
            counts: response.data,
            loading: { ...state.loading, counts: false },
            currentPage: page,
          }));
        } catch (error) {
          set((state) => ({
            loading: { ...state.loading, counts: false },
            errors: { ...state.errors, counts: (error as Error).message },
          }));
        }
      },
      
      createCount: async (data) => {
        try {
          await InventoryCountService.createCount(data);
          // 重新載入盤點記錄
          await get().fetchCounts();
        } catch (error) {
          set((state) => ({
            errors: { ...state.errors, counts: (error as Error).message },
          }));
          throw error;
        }
      },
      
      completeCount: async (id) => {
        try {
          await InventoryCountService.completeCount(id);
          // 更新本地狀態
          set((state) => ({
            counts: state.counts.map(count =>
              count.id === id
                ? { ...count, status: 'completed', completed_at: new Date().toISOString() }
                : count
            ),
          }));
        } catch (error) {
          set((state) => ({
            errors: { ...state.errors, counts: (error as Error).message },
          }));
          throw error;
        }
      },
      
      approveCount: async (id) => {
        try {
          await InventoryCountService.approveCount(id);
          // 更新本地狀態
          set((state) => ({
            counts: state.counts.map(count =>
              count.id === id
                ? { ...count, status: 'approved', approved_at: new Date().toISOString() }
                : count
            ),
          }));
        } catch (error) {
          set((state) => ({
            errors: { ...state.errors, counts: (error as Error).message },
          }));
          throw error;
        }
      },
      
      // ================================
      // 統計相關 Actions
      // ================================
      
      fetchStats: async () => {
        try {
          const stats = await InventoryStatsService.getStats();
          set({ stats });
        } catch (error) {
          console.error('獲取統計資料失敗:', error);
        }
      },
      
      // ================================
      // UI 狀態 Actions
      // ================================
      
      setSelectedItems: (items) => {
        set({ selectedItems: items });
      },
      
      clearSelection: () => {
        set({ selectedItems: [] });
      },
      
      setCurrentPage: (page) => {
        set({ currentPage: page });
      },
      
      // ================================
      // 錯誤處理 Actions
      // ================================
      
      clearError: (type) => {
        set((state) => ({
          errors: { ...state.errors, [type]: undefined },
        }));
      },
      
      clearAllErrors: () => {
        set({ errors: {} });
      },
    }),
    {
      name: 'inventory-store',
    }
  )
);

// ================================
// Selector Hooks
// ================================

// 產品相關選擇器
export const useProducts = () => useInventoryStore((state) => state.products);
export const useProductsLoading = () => useInventoryStore((state) => state.loading.products);
export const useProductsError = () => useInventoryStore((state) => state.errors.products);

// 原物料相關選擇器
export const useRawMaterials = () => useInventoryStore((state) => state.rawMaterials);
export const useRawMaterialsLoading = () => useInventoryStore((state) => state.loading.rawMaterials);
export const useRawMaterialsError = () => useInventoryStore((state) => state.errors.rawMaterials);

// 異動記錄相關選擇器
export const useTransactions = () => useInventoryStore((state) => state.transactions);
export const useTransactionsLoading = () => useInventoryStore((state) => state.loading.transactions);
export const useTransactionsError = () => useInventoryStore((state) => state.errors.transactions);

// 警示相關選擇器
export const useAlerts = () => useInventoryStore((state) => state.alerts);
export const useAlertsLoading = () => useInventoryStore((state) => state.loading.alerts);
export const useAlertsError = () => useInventoryStore((state) => state.errors.alerts);

// 盤點相關選擇器
export const useCounts = () => useInventoryStore((state) => state.counts);
export const useCountsLoading = () => useInventoryStore((state) => state.loading.counts);
export const useCountsError = () => useInventoryStore((state) => state.errors.counts);

// 統計相關選擇器
export const useInventoryStats = () => useInventoryStore((state) => state.stats);

// UI 狀態選擇器
export const useSelectedItems = () => useInventoryStore((state) => state.selectedItems);
export const useCurrentPage = () => useInventoryStore((state) => state.currentPage);

// 篩選器選擇器
export const useProductsFilter = () => useInventoryStore((state) => state.filters.products);
export const useTransactionsFilter = () => useInventoryStore((state) => state.filters.transactions);
export const useAlertsFilter = () => useInventoryStore((state) => state.filters.alerts);
