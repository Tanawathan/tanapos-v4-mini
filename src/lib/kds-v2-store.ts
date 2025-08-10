import { create } from 'zustand';
import { KDSV2Service, KitchenTask } from './kds-v2-service';
import { MenuItemStatus, OrderStatus } from './kds-types';

interface KDSV2State {
  tasks: KitchenTask[];
  orders: Record<string, any>;
  loading: boolean;
  error?: string;
  lastFetch?: number;
  filter: { categories: string[]; search?: string; station?: string };
  fetch: (silent?: boolean) => Promise<void>;
  toggleTask: (id: string) => Promise<void>;
  toggleCategory: (cat: string) => void;
  clearCategories: () => void;
  selectAllCategories: (cats: string[]) => void;
  markOrderReady: (orderId: string) => Promise<void>;
  markOrderServed: (orderId: string) => Promise<void>;
}

const savedCats = (typeof window !== 'undefined' && localStorage.getItem('kdsV2Cats')) ? JSON.parse(localStorage.getItem('kdsV2Cats') as string) : [];

export const useKDSV2Store = create<KDSV2State>((set, get) => ({
  tasks: [],
  orders: {},
  loading: false,
  filter: { categories: Array.isArray(savedCats) ? savedCats : [] },
  async fetch(silent=false) {
    if (!silent) set({ loading: true, error: undefined });
    try {
      const restaurantId = import.meta.env.VITE_RESTAURANT_ID || '11111111-1111-1111-1111-111111111111';
      const { tasks, orders } = await KDSV2Service.fetchActive(restaurantId);
      set({ tasks, orders, loading: false, lastFetch: Date.now() });
    } catch (e:any) {
      set({ error: e.message || '載入失敗', loading: false });
    }
  },
  async toggleTask(id: string) {
    const state = get();
    const task = state.tasks.find(t => t.id === id);
    if (!task) return;
    const next = task.status === MenuItemStatus.READY ? MenuItemStatus.PREPARING : MenuItemStatus.READY;

    // Optimistic local update
    set({ tasks: state.tasks.map(t => t.id === id ? { ...t, status: next } : t) });

    try {
      if (task.isVirtual && task.comboParentId) {
        // collect siblings statuses for persistence
        const siblings = state.tasks.filter(t => t.comboParentId === task.comboParentId);
        const updatedChildren = siblings.map(s => ({ id: s.id, status: s.id===id ? next : s.status }));
        const parentStatus = await KDSV2Service.persistComboChild(task.orderId, task.comboParentId, updatedChildren);
        // reflect parent status locally
        set({ tasks: get().tasks.map(t => t.id === task.comboParentId ? { ...t, status: parentStatus } : t) });
      } else if (!task.isVirtual) {
        await KDSV2Service.updateRealItem(id, next);
      }
    } catch (e:any) {
      // rollback on failure
      set({ tasks: state.tasks });
      console.error('KDSv2 toggleTask error', e);
    }
  }
  ,toggleCategory(cat: string) {
    const cur = get().filter.categories;
    const next = cur.includes(cat) ? cur.filter(c => c!==cat) : [...cur, cat];
    set({ filter: { ...get().filter, categories: next } });
    if (typeof window !== 'undefined') localStorage.setItem('kdsV2Cats', JSON.stringify(next));
  }
  ,clearCategories() {
    set({ filter: { ...get().filter, categories: [] } });
    if (typeof window !== 'undefined') localStorage.setItem('kdsV2Cats', JSON.stringify([]));
  }
  ,selectAllCategories(cats: string[]) {
    set({ filter: { ...get().filter, categories: cats } });
    if (typeof window !== 'undefined') localStorage.setItem('kdsV2Cats', JSON.stringify(cats));
  }
  ,async markOrderReady(orderId: string) {
    const state = get();
    const orderTasks = state.tasks.filter(t => t.orderId === orderId && !t.isVirtual); // parent + real items
    const allChildren = state.tasks.filter(t => t.orderId === orderId);
    const allReady = allChildren.length>0 && allChildren.every(t => [MenuItemStatus.READY, MenuItemStatus.SERVED].includes(t.status));
    if (!allReady) return; // guard
    await KDSV2Service.updateOrderStatus(orderId, OrderStatus.READY);
    set({ orders: { ...state.orders, [orderId]: { ...state.orders[orderId], status: OrderStatus.READY } } });
  }
  ,async markOrderServed(orderId: string) {
    const state = get();
    if (![OrderStatus.READY, OrderStatus.SERVED].includes(state.orders[orderId]?.status)) return;
    await KDSV2Service.updateOrderStatus(orderId, OrderStatus.SERVED);
    set({ orders: { ...state.orders, [orderId]: { ...state.orders[orderId], status: OrderStatus.SERVED } } });
  }
}));
