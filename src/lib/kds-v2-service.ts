import { supabase } from './supabase';
import { MenuCategory, MenuItemStatus, OrderStatus } from './kds-types';

export interface KitchenTask {
  id: string;               // task id (order_item id or virtual id parent_component_n)
  orderId: string;
  orderNumber: string;
  tableNumber?: number;
  name: string;
  quantity: number;
  category: MenuCategory;
  status: MenuItemStatus;
  isVirtual: boolean;
  comboParentId?: string;
  createdAt: string;
  priority: number;
  station: string;
}

export interface MinimalOrderInfo {
  id: string;
  orderNumber: string;
  tableNumber?: number;
  createdAt: string;
  status: OrderStatus;
}

interface FetchResult {
  tasks: KitchenTask[];
  orders: Record<string, MinimalOrderInfo>;
}

// Very small focused service – only what KDS v2 needs
export class KDSV2Service {
  static async fetchActive(restaurantId: string): Promise<FetchResult> {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const { data, error } = await supabase
      .from('orders')
      .select(`
        id, order_number, table_number, created_at, status, metadata,
        order_items(
          id, product_name, product_id, quantity, status, created_at, special_instructions,
          priority_level, product_sku, variant_name, combo_id,
          order_combo_selections(
            id, rule_id, selected_product_id, quantity, additional_price,
            combo_selection_rules(selection_name),
            products:selected_product_id(name)
          )
        )
      `)
      .eq('restaurant_id', restaurantId)
      .in('status', ['pending','confirmed','preparing','ready'])
      .gte('created_at', yesterday.toISOString())
      .order('created_at', { ascending: false });

    if (error) throw error;

    const tasks: KitchenTask[] = [];
    const orders: Record<string, MinimalOrderInfo> = {};

  (data||[]).forEach((o: any) => {
  orders[o.id] = { id: o.id, orderNumber: o.order_number, tableNumber: o.table_number, createdAt: o.created_at, status: this.mapOrderStatus(o.status) };
    const orderMeta = o.metadata || {};
    (o.order_items||[]).forEach((it: any) => {
        const looksLikeComboParent = !it.product_id && /：/.test(it.special_instructions || '') && /(\||\n)/.test(it.special_instructions || '');
        const hasSelections = (it.order_combo_selections?.length || 0) > 0;

        if (looksLikeComboParent || hasSelections) {
      // treat as combo parent + parse, pass order metadata for persisted statuses
      tasks.push(this.parentToTask(it, o));
      const componentTasks = hasSelections ? this.expandLegacy(it, o, orderMeta) : this.parseSummary(it, o, orderMeta);
          tasks.push(...componentTasks);
        } else {
          tasks.push(this.itemToTask(it, o));
        }
      });
    });

    return { tasks, orders };
  }

  private static parentToTask(raw: any, order: any): KitchenTask {
    return {
      id: raw.id,
      orderId: order.id,
      orderNumber: order.order_number,
      tableNumber: order.table_number,
      name: (raw.product_name || '套餐').replace(/^\[套餐]\s*/, ''),
      quantity: raw.quantity || 1,
      category: MenuCategory.MAIN_COURSE,
      status: this.mapStatus(raw.status),
      isVirtual: false,
      comboParentId: undefined,
      createdAt: raw.created_at,
      priority: raw.priority_level || 1,
      station: '綜合'
    };
  }

  private static itemToTask(raw: any, order: any): KitchenTask {
    return {
      id: raw.id,
      orderId: order.id,
      orderNumber: order.order_number,
      tableNumber: order.table_number,
      name: raw.product_name,
      quantity: raw.quantity || 1,
      category: this.mapCategory(raw),
      status: this.mapStatus(raw.status),
      isVirtual: false,
      createdAt: raw.created_at,
      priority: raw.priority_level || 1,
      station: this.mapStation(this.mapCategory(raw))
    };
  }

  private static parseSummary(parent: any, order: any, orderMeta: any): KitchenTask[] {
    const groupMap: Record<string, any> = (orderMeta?.kds_combo_component_statuses || {})[parent.id] || {};
    const text: string = parent.special_instructions || '';
    if (!text) return [];
    const groups = text.split(/\s*\|\s*|\n/).map(s=>s.trim()).filter(Boolean);
    const out: KitchenTask[] = [];
    let i=0;
    for (const g of groups) {
      const [header, rest] = g.split(/：|:/,2);
      if (!rest) continue;
      const cat = this.mapHeader(header);
      rest.split(/\s+/).filter(Boolean).forEach(tok => {
        const m = tok.match(/(.+?)x(\d+)/i); if(!m) return;
        const name = m[1]; const qty = parseInt(m[2])||1;
        const id = `${parent.id}_g${i}`;
  const persisted = groupMap[id]?.status;
        out.push({
          id,
          orderId: order.id,
          orderNumber: order.order_number,
          tableNumber: order.table_number,
          name,
            quantity: qty,
          category: cat,
          status: persisted ? this.mapStatus(persisted) : this.mapStatus(parent.status),
          isVirtual: true,
          comboParentId: parent.id,
          createdAt: parent.created_at,
          priority: parent.priority_level || 1,
          station: this.mapStation(cat)
        });
        i++;
      });
    }
    return out;
  }

  private static expandLegacy(parent: any, order: any, orderMeta: any): KitchenTask[] {
    const groupMap: Record<string, any> = (orderMeta?.kds_combo_component_statuses || {})[parent.id] || {};
    return (parent.order_combo_selections||[]).map((sel: any, idx: number) => {
      const id = `${parent.id}_component_${idx}`;
      const cat = this.inferCategory(sel.products?.name || '', sel.combo_selection_rules?.selection_name || '');
      const persisted = groupMap[id]?.status;
      return {
        id,
        orderId: order.id,
        orderNumber: order.order_number,
        tableNumber: order.table_number,
        name: sel.products?.name || '組件',
        quantity: sel.quantity || 1,
        category: cat,
        status: persisted ? this.mapStatus(persisted) : this.mapStatus(parent.status),
        isVirtual: true,
        comboParentId: parent.id,
        createdAt: parent.created_at,
        priority: parent.priority_level || 1,
        station: this.mapStation(cat)
      } as KitchenTask;
    });
  }

  static async updateRealItem(itemId: string, status: MenuItemStatus) {
    const now = new Date().toISOString();
    const update: any = { status: status.toLowerCase(), updated_at: now };
    switch (status) {
      case MenuItemStatus.PREPARING: update.preparation_started_at = now; break;
      case MenuItemStatus.READY: update.ready_at = now; break;
      case MenuItemStatus.SERVED: update.served_at = now; break;
    }
    const { error } = await supabase.from('order_items').update(update).eq('id', itemId);
    if (error) throw error;
  }

  static async updateOrderStatus(orderId: string, status: OrderStatus) {
    const now = new Date().toISOString();
    const update: any = { status: status.toLowerCase(), updated_at: now };
    switch (status) {
      case OrderStatus.PREPARING: update.preparation_started_at = now; break;
      case OrderStatus.READY: update.ready_at = now; break;
      case OrderStatus.SERVED: update.served_at = now; break;
      case OrderStatus.COMPLETED: update.completed_at = now; break;
    }
    const { error } = await supabase.from('orders').update(update).eq('id', orderId);
    if (error) throw error;
  }

  static async persistComboChild(orderId: string, parentId: string, children: { id: string; status: MenuItemStatus }[]) {
    // read order metadata
    const { data, error } = await supabase.from('orders').select('metadata').eq('id', orderId).single();
    if (error) throw error;
    const meta = data?.metadata || {};
    const comboRoot: Record<string, any> = meta.kds_combo_component_statuses || {};
    const existing = comboRoot[parentId] || {};
    children.forEach(ch => { existing[ch.id] = { status: ch.status }; });
    comboRoot[parentId] = existing;
    // recompute parent status
    const allReady = Object.values(existing).length>0 && Object.values(existing).every((v:any)=>['ready','served'].includes(v.status));
    const parentStatus = allReady ? MenuItemStatus.READY : MenuItemStatus.PREPARING;
    // update order metadata
    const { error: orderErr } = await supabase.from('orders').update({ metadata: { ...meta, kds_combo_component_statuses: comboRoot } }).eq('id', orderId);
    if (orderErr) throw orderErr;
    // update parent item status
    await this.updateRealItem(parentId, parentStatus);
    return parentStatus;
  }

  private static mapStatus(raw: string): MenuItemStatus {
    switch ((raw||'').toLowerCase()) {
      case 'preparing': return MenuItemStatus.PREPARING;
      case 'ready': return MenuItemStatus.READY;
      case 'served': return MenuItemStatus.SERVED;
      default: return MenuItemStatus.PENDING;
    }
  }

  private static mapOrderStatus(raw: string): OrderStatus {
    switch ((raw||'').toLowerCase()) {
      case 'pending': return OrderStatus.PENDING;
      case 'confirmed': return OrderStatus.CONFIRMED;
      case 'preparing': return OrderStatus.PREPARING;
      case 'ready': return OrderStatus.READY;
      case 'served': return OrderStatus.SERVED;
      case 'completed': return OrderStatus.COMPLETED;
      default: return OrderStatus.PENDING;
    }
  }

  private static mapHeader(h: string): MenuCategory {
    const l = h.toLowerCase();
    if (/主餐|main/.test(l)) return MenuCategory.MAIN_COURSE;
    if (/前菜|沙拉|salad|app/.test(l)) return MenuCategory.APPETIZERS;
    if (/飲|drink|茶|咖啡|beverage/.test(l)) return MenuCategory.BEVERAGES;
    if (/甜|dessert/.test(l)) return MenuCategory.DESSERTS;
    return MenuCategory.A_LA_CARTE;
  }

  private static inferCategory(name: string, sel: string): MenuCategory {
    const base = `${name} ${sel}`.toLowerCase();
    if (/主餐|雞|牛|豬|魚|main/.test(base)) return MenuCategory.MAIN_COURSE;
    if (/沙拉|前菜|salad|app/.test(base)) return MenuCategory.APPETIZERS;
    if (/咖啡|茶|果汁|cola|drink|飲/.test(base)) return MenuCategory.BEVERAGES;
    if (/蛋糕|冰|甜|dessert/.test(base)) return MenuCategory.DESSERTS;
    return MenuCategory.A_LA_CARTE;
  }

  private static mapCategory(raw: any): MenuCategory {
    const n = (raw.products?.categories?.name || raw.category_name || '').toLowerCase();
  if (/appetizer|前菜|小菜|沙拉/.test(n)) return MenuCategory.APPETIZERS;
  if (/main|主餐|主菜/.test(n)) return MenuCategory.MAIN_COURSE;
  if (/飲|beverage|drink|茶|咖啡/.test(n)) return MenuCategory.BEVERAGES;
  if (/甜|dessert/.test(n)) return MenuCategory.DESSERTS;
  if (/加點|extra|附加|加購|加飯|加麵|加蛋|side/.test(n)) return MenuCategory.ADDITIONAL;
  // 若資料庫沒有分類名稱，使用品名進行啟發式分類，避免全部落在單點
  const pn = (raw.product_name || '').toLowerCase();
  if (/沙拉|salad|涼拌|前菜|app/.test(pn)) return MenuCategory.APPETIZERS;
  if (/飯|麵|雞|豬|牛|魚|排|咖哩|main|套餐/.test(pn)) return MenuCategory.MAIN_COURSE;
  if (/奶茶|茶|咖啡|汁|可樂|汽水|drink|冰沙|smoothie|可爾必思|蘇打|果茶|飲/.test(pn)) return MenuCategory.BEVERAGES;
  if (/蛋糕|派|布丁|奶酪|甜|冰|雪糕|霜淇淋|dessert|奶酥|餅乾|仙草/.test(pn)) return MenuCategory.DESSERTS;
  if (/加點|加購|加飯|加麵|加蛋|extra|附加|side/.test(pn)) return MenuCategory.ADDITIONAL;
  return MenuCategory.A_LA_CARTE;
  }

  private static mapStation(cat: MenuCategory): string {
    switch (cat) {
      case MenuCategory.APPETIZERS: return '前菜';
      case MenuCategory.MAIN_COURSE: return '熱廚';
      case MenuCategory.BEVERAGES: return '飲品';
      case MenuCategory.DESSERTS: return '甜點';
  case MenuCategory.ADDITIONAL: return '加點';
      default: return '綜合';
    }
  }
}
