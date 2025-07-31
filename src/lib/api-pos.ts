import { supabase } from './supabase'
import type { Product, Category, Order, Table } from './types-unified'

// 餐廳服務
export const restaurantService = {
  // 取得餐廳資訊
  async getRestaurant() {
    const { data, error } = await supabase
      .from('restaurants')
      .select('*')
      .single()
    
    if (error) throw new Error(`取得餐廳資訊失敗: ${error.message}`)
    return data
  }
}

// 分類服務
export const categoriesService = {
  // 取得所有分類
  async getAll(): Promise<Category[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order')
    
    if (error) throw new Error(`載入分類失敗: ${error.message}`)
    return data || []
  },

  // 根據餐廳ID取得分類
  async getByRestaurant(restaurantId: string): Promise<Category[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .eq('is_active', true)
      .order('sort_order')
    
    if (error) throw new Error(`載入分類失敗: ${error.message}`)
    return data || []
  }
}

// 產品服務
export const productsService = {
  // 取得所有產品
  async getAll(): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        categories:category_id (
          name,
          color,
          icon
        )
      `)
      .eq('is_available', true)
      .order('sort_order')
    
    if (error) throw new Error(`載入產品失敗: ${error.message}`)
    return data || []
  },

  // 根據分類取得產品
  async getByCategory(categoryId: string): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        categories:category_id (
          name,
          color,
          icon
        )
      `)
      .eq('category_id', categoryId)
      .eq('is_available', true)
      .order('sort_order')
    
    if (error) throw new Error(`載入產品失敗: ${error.message}`)
    return data || []
  },

  // 根據ID取得產品
  async getById(id: string): Promise<Product | null> {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        categories:category_id (
          name,
          color,
          icon
        )
      `)
      .eq('id', id)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') return null
      throw new Error(`載入產品失敗: ${error.message}`)
    }
    return data
  },

  // 搜尋產品
  async search(query: string): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        categories:category_id (
          name,
          color,
          icon
        )
      `)
      .ilike('name', `%${query}%`)
      .eq('is_available', true)
      .order('sort_order')
    
    if (error) throw new Error(`搜尋產品失敗: ${error.message}`)
    return data || []
  }
}

// 桌位服務
export const tablesService = {
  // 取得所有桌位
  async getAll(): Promise<Table[]> {
    const { data, error } = await supabase
      .from('tables')
      .select('*')
      .eq('is_active', true)
      .order('table_number')
    
    if (error) throw new Error(`載入桌位失敗: ${error.message}`)
    return data || []
  },

  // 取得可用桌位
  async getAvailable(): Promise<Table[]> {
    const { data, error } = await supabase
      .from('tables')
      .select('*')
      .eq('status', 'available')
      .eq('is_active', true)
      .order('table_number')
    
    if (error) throw new Error(`載入桌位失敗: ${error.message}`)
    return data || []
  },

  // 更新桌位狀態
  async updateStatus(tableId: string, status: string): Promise<boolean> {
    const { error } = await supabase
      .from('tables')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', tableId)
    
    if (error) throw new Error(`更新桌位狀態失敗: ${error.message}`)
    return true
  }
}

// 訂單服務
export const ordersService = {
  // 建立訂單
  async create(orderData: {
    table_id?: string;
    table_number?: number;
    items: Array<{
      product_id: string;
      product_name: string;
      product_sku?: string;
      quantity: number;
      unit_price: number;
      special_instructions?: string;
    }>;
    subtotal: number;
    tax_amount?: number;
    total_amount: number;
    customer_name?: string;
    customer_phone?: string;
    notes?: string;
    created_by?: string;
  }): Promise<Order | null> {
    try {
      // 產生訂單編號
      const orderNumber = `ORD-${Date.now()}`
      
      // 建立訂單
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_number: orderNumber,
          table_id: orderData.table_id,
          table_number: orderData.table_number,
          subtotal: orderData.subtotal,
          tax_amount: orderData.tax_amount || orderData.subtotal * 0.1,
          total_amount: orderData.total_amount,
          customer_name: orderData.customer_name,
          customer_phone: orderData.customer_phone,
          notes: orderData.notes,
          created_by: orderData.created_by || '系統',
          status: 'pending'
        })
        .select()
        .single()
      
      if (orderError) throw orderError
      
      // 建立訂單項目
      const orderItems = orderData.items.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        product_name: item.product_name,
        product_sku: item.product_sku,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.quantity * item.unit_price,
        special_instructions: item.special_instructions
      }))
      
      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)
      
      if (itemsError) throw itemsError
      
      // 如果有桌位，更新桌位狀態為佔用
      if (orderData.table_id) {
        await tablesService.updateStatus(orderData.table_id, 'occupied')
      }
      
      return order
      
    } catch (error: any) {
      throw new Error(`建立訂單失敗: ${error.message}`)
    }
  },

  // 取得所有訂單
  async getAll(): Promise<Order[]> {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          products (name, sku, image_url)
        )
      `)
      .order('created_at', { ascending: false })
    
    if (error) throw new Error(`載入訂單失敗: ${error.message}`)
    
    // 轉換資料格式以符合前端需求
    return (data || []).map(order => ({
      ...order,
      items: order.order_items?.map((item: any) => ({
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        price: item.unit_price,
        notes: item.special_instructions
      })) || []
    }))
  },

  // 根據狀態取得訂單
  async getByStatus(status: Order['status']): Promise<Order[]> {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          products (name, sku, image_url)
        )
      `)
      .eq('status', status)
      .order('created_at', { ascending: false })
    
    if (error) throw new Error(`載入訂單失敗: ${error.message}`)
    
    return (data || []).map(order => ({
      ...order,
      items: order.order_items?.map((item: any) => ({
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        price: item.unit_price,
        notes: item.special_instructions
      })) || []
    }))
  },

  // 更新訂單狀態
  async updateStatus(orderId: string, status: Order['status']): Promise<boolean> {
    const { error } = await supabase
      .from('orders')
      .update({ 
        status,
        updated_at: new Date().toISOString(),
        ...(status === 'completed' && { served_at: new Date().toISOString() })
      })
      .eq('id', orderId)
    
    if (error) throw new Error(`更新訂單狀態失敗: ${error.message}`)
    return true
  },

  // 取得桌位的訂單
  async getByTable(tableNumber: number): Promise<Order[]> {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          products (name, sku, image_url)
        )
      `)
      .eq('table_number', tableNumber)
      .in('status', ['pending', 'confirmed', 'preparing', 'ready'])
      .order('created_at', { ascending: false })
    
    if (error) throw new Error(`載入桌位訂單失敗: ${error.message}`)
    
    return (data || []).map(order => ({
      ...order,
      items: order.order_items?.map((item: any) => ({
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        price: item.unit_price,
        notes: item.special_instructions
      })) || []
    }))
  }
}

// 即時訂閱服務
export const realtimeService = {
  // 訂閱訂單變更
  subscribeToOrders(callback: (payload: any) => void) {
    return supabase
      .channel('orders_channel')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'orders' },
        callback
      )
      .subscribe()
  },

  // 訂閱桌位變更
  subscribeToTables(callback: (payload: any) => void) {
    return supabase
      .channel('tables_channel')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'tables' },
        callback
      )
      .subscribe()
  },

  // 取消訂閱
  unsubscribe(subscription: any) {
    if (subscription) {
      supabase.removeChannel(subscription)
    }
  }
}
