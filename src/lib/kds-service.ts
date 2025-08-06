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
            ),
            order_combo_selections (
              id,
              rule_id,
              selected_product_id,
              quantity,
              additional_price,
              combo_selection_rules (
                selection_name,
                description
              ),
              products:selected_product_id (
                name,
                price
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
    // 轉換訂單項目 - 支援套餐展開
    const menuItems: KDSMenuItem[] = [];
    
    (dbOrder.order_items || []).forEach((item: any) => {
      if (item.product_name?.startsWith('[套餐]') && item.order_combo_selections?.length > 0) {
        // 套餐項目 - 展開為多個獨立組件
        const comboItems = this.expandComboToComponents(item);
        menuItems.push(...comboItems);
      } else {
        // 一般商品項目
        menuItems.push({
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
          urgencyLevel: this.calculateUrgencyLevel(item.ordered_at || item.created_at),
          
          // 套餐選擇
          combo_selections: item.order_combo_selections || []
        });
      }
    });

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
   * 展開套餐為獨立的餐點組件
   */
  private static expandComboToComponents(comboItem: any): KDSMenuItem[] {
    const components: KDSMenuItem[] = [];
    const comboBaseId = comboItem.id;
    
    // 為每個套餐選擇創建獨立的餐點項目
    (comboItem.order_combo_selections || []).forEach((selection: any, index: number) => {
      const componentId = `${comboBaseId}_component_${index}`;
      const productName = selection.products?.name || '未知商品';
      const selectionName = selection.combo_selection_rules?.selection_name || '組件';
      
      // 根據商品名稱或選擇類型決定分類
      const category = this.inferCategoryFromProduct(productName, selectionName);
      
      components.push({
        id: componentId,
        order_id: comboItem.order_id,
        product_id: selection.selected_product_id,
        combo_id: comboItem.combo_id,
        item_type: 'combo_component',
        product_name: productName, // 使用簡潔的產品名稱
        product_sku: comboItem.product_sku,
        variant_name: comboItem.variant_name,
        quantity: selection.quantity || 1,
        unit_price: selection.additional_price || 0,
        total_price: (selection.additional_price || 0) * (selection.quantity || 1),
        cost_price: 0,
        status: this.mapItemStatus(comboItem.status),
        
        // 時間欄位
        ordered_at: comboItem.ordered_at || comboItem.created_at,
        preparation_started_at: comboItem.preparation_started_at,
        ready_at: comboItem.ready_at,
        served_at: comboItem.served_at,
        estimated_prep_time: this.getEstimatedPrepTimeByCategory(category),
        actual_prep_time: comboItem.actual_prep_time,
        
        // 廚房管理欄位
        special_instructions: `套餐: ${selectionName}`, // 簡化的特殊說明
        modifiers: comboItem.modifiers,
        kitchen_station: this.getKitchenStationByCategory(category),
        priority_level: comboItem.priority_level || 1,
        quality_checked: false,
        
        created_at: comboItem.created_at,
        updated_at: comboItem.updated_at,
        
        // KDS 計算欄位
        category: category,
        urgencyLevel: this.calculateUrgencyLevel(comboItem.ordered_at || comboItem.created_at),
        
        // 套餐選擇 - 包含原始套餐信息
        combo_selections: [{
          id: selection.id,
          order_item_id: comboItem.id,
          rule_id: selection.rule_id,
          selected_product_id: selection.selected_product_id,
          quantity: selection.quantity,
          additional_price: selection.additional_price,
          combo_selection_rules: selection.combo_selection_rules,
          products: selection.products
        }],
        
        // 標記為套餐組件
        isComboComponent: true,
        parentComboId: comboBaseId,
        componentIndex: index
      });
    });
    
    return components;
  }

  /**
   * 根據商品名稱和選擇類型推斷分類
   */
  private static inferCategoryFromProduct(productName: string, selectionName: string): MenuCategory {
    const name = productName.toLowerCase();
    const selection = selectionName.toLowerCase();
    
    // 根據選擇類型推斷
    if (selection.includes('主餐') || selection.includes('main')) return MenuCategory.MAIN_COURSE;
    if (selection.includes('沙拉') || selection.includes('salad') || selection.includes('前菜')) return MenuCategory.APPETIZERS;
    if (selection.includes('飲品') || selection.includes('drink') || selection.includes('beverage')) return MenuCategory.BEVERAGES;
    if (selection.includes('甜點') || selection.includes('dessert')) return MenuCategory.DESSERTS;
    if (selection.includes('湯品') || selection.includes('soup')) return MenuCategory.APPETIZERS;
    
    // 根據商品名稱推斷
    if (name.includes('雞') || name.includes('牛') || name.includes('豬') || name.includes('魚')) return MenuCategory.MAIN_COURSE;
    if (name.includes('沙拉') || name.includes('湯')) return MenuCategory.APPETIZERS;
    if (name.includes('咖啡') || name.includes('茶') || name.includes('可樂') || name.includes('果汁')) return MenuCategory.BEVERAGES;
    if (name.includes('蛋糕') || name.includes('布丁') || name.includes('冰淇淋')) return MenuCategory.DESSERTS;
    
    // 預設為單點
    return MenuCategory.A_LA_CARTE;
  }

  /**
   * 根據分類獲取預估製作時間
   */
  private static getEstimatedPrepTimeByCategory(category: MenuCategory): number {
    switch (category) {
      case MenuCategory.APPETIZERS: return 10;
      case MenuCategory.MAIN_COURSE: return 20;
      case MenuCategory.BEVERAGES: return 5;
      case MenuCategory.DESSERTS: return 8;
      case MenuCategory.A_LA_CARTE: return 15;
      case MenuCategory.ADDITIONAL: return 5;
      default: return 10;
    }
  }

  /**
   * 根據分類獲取廚房工作站
   */
  private static getKitchenStationByCategory(category: MenuCategory): string {
    switch (category) {
      case MenuCategory.APPETIZERS: return '冷盤區';
      case MenuCategory.MAIN_COURSE: return '熱炒區';
      case MenuCategory.BEVERAGES: return '飲品區';
      case MenuCategory.DESSERTS: return '甜點區';
      case MenuCategory.A_LA_CARTE: return '綜合區';
      case MenuCategory.ADDITIONAL: return '備餐區';
      default: return '綜合區';
    }
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
