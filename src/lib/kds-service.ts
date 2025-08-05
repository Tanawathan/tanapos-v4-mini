import { supabase } from './supabase';
import { KDSOrder, KDSMenuItem, MenuCategory, OrderStatus, MenuItemStatus } from './kds-types';

export class KDSService {
  
  /**
   * 獲取所有當日有效訂單（pending, confirmed, preparing, ready）
   */
  static async fetchActiveOrders(restaurantId: string): Promise<KDSOrder[]> {
    try {
      console.log('🔍 KDS: 開始獲取訂單數據...');
      
      // 獲取今天的開始時間 - 使用更寬鬆的時間範圍
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // 使用昨天作為起始時間，確保不會因為時區問題遺漏訂單
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      // 查詢有效狀態的訂單
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            products (
              name,
              category_id,
              categories (
                name
              )
            )
          )
        `)
        .eq('restaurant_id', restaurantId)
        .gte('created_at', yesterday.toISOString())
        .in('status', ['pending', 'confirmed', 'preparing', 'ready'])
        .order('created_at', { ascending: false });

      if (ordersError) {
        console.error('❌ KDS: 獲取訂單失敗:', ordersError);
        throw ordersError;
      }

      console.log(`✅ KDS: 成功獲取 ${orders?.length || 0} 筆訂單`);

      // 轉換為 KDS 格式
      const kdsOrders: KDSOrder[] = (orders || []).map((order: any) => 
        this.transformToKDSOrder(order)
      );

      return kdsOrders;
      
    } catch (error) {
      console.error('❌ KDS: 獲取訂單數據失敗:', error);
      throw error;
    }
  }

  /**
   * 轉換數據庫訂單為 KDS 格式
   */
  private static transformToKDSOrder(dbOrder: any): KDSOrder {
    // 轉換訂單項目
    const menuItems: KDSMenuItem[] = (dbOrder.order_items || []).map((item: any) => ({
      id: item.id,
      order_id: item.order_id,
      product_id: item.product_id,
      combo_id: item.combo_id,
      item_type: item.item_type || 'product',
      product_name: item.product_name,
      product_sku: item.product_sku,
      variant_name: item.variant_name,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.total_price,
      cost_price: item.cost_price || 0,
      status: this.mapItemStatus(item.status),
      
      // 時間欄位
      ordered_at: item.ordered_at || item.created_at,
      preparation_started_at: item.preparation_started_at,
      ready_at: item.ready_at,
      served_at: item.served_at,
      estimated_prep_time: item.estimated_prep_time,
      actual_prep_time: item.actual_prep_time,
      
      // 廚房管理欄位
      special_instructions: item.special_instructions,
      modifiers: item.modifiers,
      kitchen_station: item.kitchen_station,
      priority_level: item.priority_level || 1,
      quality_checked: item.quality_checked || false,
      
      created_at: item.created_at,
      updated_at: item.updated_at,
      
      // KDS 計算欄位
      category: this.mapCategory(item.products?.categories?.name),
      urgencyLevel: this.calculateUrgencyLevel(item.ordered_at || item.created_at)
    }));

    // 計算總項目數和已完成項目數
    const totalItems = menuItems.length;
    const completedItems = menuItems.filter(item => 
      item.status === MenuItemStatus.READY || 
      item.status === MenuItemStatus.SERVED
    ).length;

    return {
      id: dbOrder.id,
      restaurant_id: dbOrder.restaurant_id,
      order_number: dbOrder.order_number,
      status: this.mapOrderStatus(dbOrder.status),
      order_type: dbOrder.order_type || 'dine_in',
      
      // 客戶資訊
      customer_name: dbOrder.customer_name,
      customer_phone: dbOrder.customer_phone,
      party_size: dbOrder.party_size || 1,
      
      // 桌台資訊
      table_id: dbOrder.table_id,
      table_number: dbOrder.table_number,
      
      // 金額資訊
      subtotal: dbOrder.subtotal || 0,
      tax_amount: dbOrder.tax_amount || 0,
      service_charge: dbOrder.service_fee || 0,
      discount_amount: dbOrder.discount_amount || 0,
      total_amount: dbOrder.total_amount,
      
      // 支付資訊
      payment_method: dbOrder.payment_method,
      payment_status: dbOrder.payment_status || 'pending',
      
      // 時間追蹤
      ordered_at: dbOrder.ordered_at || dbOrder.created_at,
      confirmed_at: dbOrder.confirmed_at,
      preparation_started_at: dbOrder.preparation_started_at,
      ready_at: dbOrder.ready_at,
      served_at: dbOrder.served_at,
      completed_at: dbOrder.completed_at,
      
      // AI 輔助欄位
      ai_optimized: dbOrder.ai_optimized || false,
      ai_estimated_prep_time: dbOrder.ai_estimated_prep_time,
      ai_recommendations: dbOrder.ai_recommendations,
      ai_complexity_score: dbOrder.ai_complexity_score,
      ai_efficiency_score: dbOrder.ai_efficiency_score,
      
      // 其他欄位
      notes: dbOrder.notes,
      special_instructions: dbOrder.special_instructions,
      source: dbOrder.source || 'pos',
      created_by: dbOrder.created_by,
      updated_by: dbOrder.updated_by,
      created_at: dbOrder.created_at,
      updated_at: dbOrder.updated_at,
      metadata: dbOrder.metadata,
      
      // KDS 計算欄位
      menuItems,
      isExpanded: false,
      urgencyLevel: this.calculateOrderUrgencyLevel(dbOrder.created_at, totalItems, completedItems),
      totalItems,
      completedItems
    };
  }

  /**
   * 映射訂單狀態
   */
  private static mapOrderStatus(dbStatus: string): OrderStatus {
    switch (dbStatus?.toLowerCase()) {
      case 'pending': return OrderStatus.PENDING;
      case 'confirmed': return OrderStatus.CONFIRMED;
      case 'preparing': return OrderStatus.PREPARING;
      case 'ready': return OrderStatus.READY;
      case 'served': return OrderStatus.SERVED;
      case 'completed': return OrderStatus.COMPLETED;
      case 'cancelled': return OrderStatus.CANCELLED;
      default: return OrderStatus.PENDING;
    }
  }

  /**
   * 映射項目狀態
   */
  private static mapItemStatus(dbStatus: string): MenuItemStatus {
    switch (dbStatus?.toLowerCase()) {
      case 'pending': return MenuItemStatus.PENDING;
      case 'preparing': return MenuItemStatus.PREPARING;
      case 'ready': return MenuItemStatus.READY;
      case 'served': return MenuItemStatus.SERVED;
      default: return MenuItemStatus.PENDING;
    }
  }

  /**
   * 映射菜單分類
   */
  private static mapCategory(categoryName: string): MenuCategory {
    if (!categoryName) return MenuCategory.A_LA_CARTE;
    
    const name = categoryName.toLowerCase();
    if (name.includes('appetizer') || name.includes('前菜')) return MenuCategory.APPETIZERS;
    if (name.includes('main') || name.includes('主菜')) return MenuCategory.MAIN_COURSE;
    if (name.includes('beverage') || name.includes('飲品')) return MenuCategory.BEVERAGES;
    if (name.includes('dessert') || name.includes('甜點')) return MenuCategory.DESSERTS;
    if (name.includes('additional') || name.includes('加點')) return MenuCategory.ADDITIONAL;
    
    return MenuCategory.A_LA_CARTE;
  }

  /**
   * 計算單項緊急程度
   */
  private static calculateUrgencyLevel(orderedAt: string): import('./kds-types').UrgencyLevel {
    const now = new Date();
    const orderTime = new Date(orderedAt);
    const elapsedMinutes = (now.getTime() - orderTime.getTime()) / (1000 * 60);
    
    if (elapsedMinutes > 30) return 'high';
    if (elapsedMinutes > 15) return 'medium';
    return 'low';
  }

  /**
   * 計算訂單整體緊急程度
   */
  private static calculateOrderUrgencyLevel(
    createdAt: string, 
    totalItems: number, 
    completedItems: number
  ): import('./kds-types').UrgencyLevel {
    const now = new Date();
    const orderTime = new Date(createdAt);
    const elapsedMinutes = (now.getTime() - orderTime.getTime()) / (1000 * 60);
    const completionRate = totalItems > 0 ? completedItems / totalItems : 0;
    
    // 如果已經超過 45 分鐘且完成率低於 50%
    if (elapsedMinutes > 45 && completionRate < 0.5) return 'high';
    
    // 如果已經超過 30 分鐘且完成率低於 75%
    if (elapsedMinutes > 30 && completionRate < 0.75) return 'medium';
    
    // 如果已經超過 20 分鐘
    if (elapsedMinutes > 20) return 'medium';
    
    return 'low';
  }

  /**
   * 更新訂單狀態
   */
  static async updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
    try {
      const now = new Date().toISOString();
      const updateData: any = { 
        status: status.toLowerCase(),
        updated_at: now
      };

      // 根據狀態更新對應的時間戳
      switch (status) {
        case OrderStatus.CONFIRMED:
          updateData.confirmed_at = now;
          break;
        case OrderStatus.PREPARING:
          updateData.preparation_started_at = now;
          break;
        case OrderStatus.READY:
          updateData.ready_at = now;
          break;
        case OrderStatus.SERVED:
          updateData.served_at = now;
          break;
        case OrderStatus.COMPLETED:
          updateData.completed_at = now;
          break;
      }

      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId);

      if (error) throw error;
      
      console.log(`✅ KDS: 訂單 ${orderId} 狀態更新為 ${status}`);
    } catch (error) {
      console.error('❌ KDS: 更新訂單狀態失敗:', error);
      throw error;
    }
  }

  /**
   * 更新訂單項目狀態
   */
  static async updateMenuItemStatus(itemId: string, status: MenuItemStatus): Promise<void> {
    try {
      const now = new Date().toISOString();
      const updateData: any = { 
        status: status.toLowerCase(),
        updated_at: now
      };

      // 根據狀態更新對應的時間戳
      switch (status) {
        case MenuItemStatus.PREPARING:
          updateData.preparation_started_at = now;
          break;
        case MenuItemStatus.READY:
          updateData.ready_at = now;
          break;
        case MenuItemStatus.SERVED:
          updateData.served_at = now;
          break;
      }

      const { error } = await supabase
        .from('order_items')
        .update(updateData)
        .eq('id', itemId);

      if (error) throw error;
      
      console.log(`✅ KDS: 訂單項目 ${itemId} 狀態更新為 ${status}`);
    } catch (error) {
      console.error('❌ KDS: 更新訂單項目狀態失敗:', error);
      throw error;
    }
  }

  /**
   * 添加訂單備註
   */
  static async addOrderNote(orderId: string, note: string): Promise<void> {
    try {
      // 先獲取現有備註
      const { data: order } = await supabase
        .from('orders')
        .select('notes')
        .eq('id', orderId)
        .single();

      const existingNotes = order?.notes || '';
      const timestamp = new Date().toLocaleString('zh-TW');
      const newNote = `[${timestamp}] ${note}`;
      const updatedNotes = existingNotes 
        ? `${existingNotes}\n${newNote}`
        : newNote;

      const { error } = await supabase
        .from('orders')
        .update({ 
          notes: updatedNotes,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) throw error;
      
      console.log(`✅ KDS: 訂單 ${orderId} 添加備註成功`);
    } catch (error) {
      console.error('❌ KDS: 添加訂單備註失敗:', error);
      throw error;
    }
  }
}
