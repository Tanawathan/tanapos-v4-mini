import { supabase } from './supabase'
import { Product, Category, Order, Table } from './types-unified'

type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled' | 'served'

// Products Service
export const productsService = {
  async getAll(): Promise<Product[]> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          name,
          description,
          price,
          category_id,
          image_url,
          is_available,
          preparation_time,
          created_at,
          updated_at
        `)
        .eq('is_available', true)
        .order('name')

      if (error) {
        console.error('Error fetching products:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Service error fetching products:', error)
      return []
    }
  },

  async getByCategory(categoryId: string): Promise<Product[]> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          name,
          description,
          price,
          category_id,
          image_url,
          is_available,
          preparation_time,
          created_at,
          updated_at
        `)
        .eq('category_id', categoryId)
        .eq('is_available', true)
        .order('name')

      if (error) {
        console.error('Error fetching products by category:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Service error fetching products by category:', error)
      return []
    }
  },

  async getById(id: string): Promise<Product | null> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          name,
          description,
          price,
          category_id,
          image_url,
          is_available,
          preparation_time,
          created_at,
          updated_at
        `)
        .eq('id', id)
        .single()

      if (error) {
        console.error('Error fetching product:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Service error fetching product:', error)
      return null
    }
  }
}

// Categories Service
export const categoriesService = {
  async getAll(): Promise<Category[]> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select(`
          id,
          name,
          description,
          sort_order,
          is_active,
          created_at,
          updated_at
        `)
        .eq('is_active', true)
        .order('sort_order')

      if (error) {
        console.error('Error fetching categories:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Service error fetching categories:', error)
      return []
    }
  }
}

// Orders Service
export const ordersService = {
  async create(orderData: any): Promise<Order | null> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .insert({
          order_number: orderData.order_number,
          table_id: orderData.table_id,
          status: orderData.status,
          subtotal: orderData.subtotal || 0,
          total_amount: orderData.total_amount,
          tax_amount: orderData.tax_amount || 0,
          notes: orderData.notes
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating order:', error)
        throw new Error('Failed to create order')
      }

      return data as Order
    } catch (error) {
      console.error('Service error creating order:', error)
      throw error
    }
  },

  async getAll(): Promise<Order[]> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          table_id,
          status,
          subtotal,
          total_amount,
          tax_amount,
          payment_method,
          notes,
          created_at,
          updated_at,
          order_items (
            id,
            product_id,
            quantity,
            unit_price,
            subtotal,
            notes
          )
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching orders:', error)
        return []
      }

      return (data || []).map(order => ({
        ...order,
        subtotal: order.subtotal || 0,
        tax_amount: order.tax_amount || 0,
        order_items: order.order_items || []
      })) as Order[]
    } catch (error) {
      console.error('Service error fetching orders:', error)
      return []
    }
  },

  async updateStatus(orderId: string, status: OrderStatus): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)

      if (error) {
        console.error('Error updating order status:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Service error updating order status:', error)
      return false
    }
  },

  async getByStatus(status: OrderStatus): Promise<Order[]> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          table_id,
          status,
          items,
          total_amount,
          tax_amount,
          payment_method,
          notes,
          created_at,
          updated_at
        `)
        .eq('status', status)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching orders by status:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Service error fetching orders by status:', error)
      return []
    }
  },

  async getByTable(tableId: number): Promise<Order[]> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          table_id,
          status,
          items,
          total_amount,
          tax_amount,
          payment_method,
          notes,
          created_at,
          updated_at
        `)
        .eq('table_id', tableId)
        .not('status', 'in', '(completed,cancelled)')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching orders by table:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Service error fetching orders by table:', error)
      return []
    }
  }
}

// Tables Service
export const tablesService = {
  async getAll(): Promise<Table[]> {
    try {
      const { data, error } = await supabase
        .from('tables')
        .select(`
          id,
          table_number,
          capacity,
          status,
          is_active,
          created_at,
          updated_at
        `)
        .eq('is_active', true)
        .order('table_number')

      if (error) {
        console.error('Error fetching tables:', error)
        return []
      }

      // Transform the data to match our interface
      return (data || []).map(table => ({
        id: table.table_number,
        name: `桌號 ${table.table_number}`,
        capacity: table.capacity,
        occupied: table.status === 'occupied',
        created_at: table.created_at,
        updated_at: table.updated_at
      }))
    } catch (error) {
      console.error('Service error fetching tables:', error)
      return []
    }
  },

  async updateStatus(tableNumber: number, status: 'available' | 'occupied'): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('tables')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('table_number', tableNumber)

      if (error) {
        console.error('Error updating table status:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Service error updating table status:', error)
      return false
    }
  }
}

// Real-time subscriptions
export const subscriptions = {
  subscribeToOrders(callback: (payload: any) => void) {
    return supabase
      .channel('orders-channel')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'orders' 
        }, 
        callback
      )
      .subscribe()
  },

  subscribeToTables(callback: (payload: any) => void) {
    return supabase
      .channel('tables-channel')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'tables' 
        }, 
        callback
      )
      .subscribe()
  },

  unsubscribe(subscription: any) {
    return supabase.removeChannel(subscription)
  }
}
