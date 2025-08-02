import { supabase } from './supabase'
import { Product, Category, Order, Table } from './types-unified'

type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled' | 'served'

// Products Service
export const productsService = {
  // 修復套餐產品問題
  async fixComboProducts(): Promise<void> {
    try {
      console.log('🔧 開始修復套餐產品問題...');
      
      // 獲取所有套餐
      const { data: combos, error: comboError } = await supabase
        .from('combo_products')
        .select('*');
      
      if (comboError) {
        console.error('獲取套餐失敗:', comboError);
        return;
      }
      
      console.log(`找到 ${combos.length} 個套餐`);
      
      // 檢查並插入缺失的套餐到 products 表
      for (const combo of combos) {
        console.log(`處理套餐: ${combo.name} (ID: ${combo.id})`);
        
        // 檢查是否已存在
        const { data: existingProduct } = await supabase
          .from('products')
          .select('id')
          .eq('id', combo.id)
          .single();
        
        if (existingProduct) {
          console.log(`  ✅ 套餐已存在於 products 表中`);
          continue;
        }
        
        // 插入套餐到 products 表
        const { error: insertError } = await supabase
          .from('products')
          .insert({
            id: combo.id,
            name: combo.name,
            description: combo.description || '',
            price: combo.price,
            category_id: combo.category_id,
            image_url: combo.image_url || null,
            is_available: true
          });
        
        if (insertError) {
          console.error(`  ❌ 插入套餐失敗:`, insertError);
        } else {
          console.log(`  ✅ 成功插入套餐到 products 表`);
        }
      }
      
      console.log('🎉 套餐產品修復完成！');
      
    } catch (error) {
      console.error('修復過程出錯:', error);
      throw error;
    }
  },

  async getAll(): Promise<Product[]> {
    try {
      // 載入一般產品
      const { data: products, error: productsError } = await supabase
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

      if (productsError) {
        console.error('Error fetching products:', productsError)
        return []
      }

      // 載入套餐產品（轉換為Product格式）
      const { data: combos, error: combosError } = await supabase
        .from('combo_products')
        .select(`
          id,
          name,
          description,
          price,
          category_id,
          is_available,
          preparation_time,
          created_at,
          updated_at,
          combo_type,
          combo_choices (
            id,
            category_id,
            min_selections,
            max_selections,
            sort_order,
            categories (
              id,
              name
            )
          )
        `)
        .eq('is_available', true)
        .order('name')

      if (combosError) {
        console.error('Error fetching combos:', combosError)
        // 即使套餐載入失敗，還是返回一般產品
        return products || []
      }

      // 將套餐轉換為Product格式
      const comboProducts: Product[] = (combos || []).map(combo => ({
        id: combo.id,
        name: `🍽️ ${combo.name}`, // 添加套餐標識
        description: combo.description || '',
        price: combo.price,
        category_id: combo.category_id || '',
        image_url: undefined,
        is_available: combo.is_available,
        preparation_time: combo.preparation_time || 15,
        created_at: combo.created_at,
        updated_at: combo.updated_at,
        combo_type: combo.combo_type, // 保留套餐類型
        combo_choices: (combo.combo_choices || []).map(choice => ({
          id: choice.id,
          category_id: choice.category_id,
          min_selections: choice.min_selections,
          max_selections: choice.max_selections,
          sort_order: choice.sort_order,
          categories: choice.categories && choice.categories.length > 0 ? choice.categories[0] : { id: '', name: '' }
        }))
      }))

      // 合併一般產品和套餐產品
      const allProducts = [...(products || []), ...comboProducts]
      console.log(`載入產品總數: ${allProducts.length} (一般產品: ${products?.length || 0}, 套餐: ${comboProducts.length})`)
      
      return allProducts
    } catch (error) {
      console.error('Service error fetching products:', error)
      return []
    }
  },

  async getByCategory(categoryId: string): Promise<Product[]> {
    try {
      // 載入該分類的一般產品
      const { data: products, error: productsError } = await supabase
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

      if (productsError) {
        console.error('Error fetching products by category:', productsError)
        return []
      }

      // 載入該分類的套餐產品
      const { data: combos, error: combosError } = await supabase
        .from('combo_products')
        .select(`
          id,
          name,
          description,
          price,
          category_id,
          is_available,
          preparation_time,
          created_at,
          updated_at,
          combo_type,
          combo_choices (
            id,
            category_id,
            min_selections,
            max_selections,
            sort_order,
            categories (
              id,
              name
            )
          )
        `)
        .eq('category_id', categoryId)
        .eq('is_available', true)
        .order('name')

      if (combosError) {
        console.error('Error fetching combos by category:', combosError)
        // 即使套餐載入失敗，還是返回一般產品
        return products || []
      }

      // 將套餐轉換為Product格式
      const comboProducts: Product[] = (combos || []).map(combo => ({
        id: combo.id,
        name: `🍽️ ${combo.name}`, // 添加套餐標識
        description: combo.description || '',
        price: combo.price,
        category_id: combo.category_id || '',
        image_url: undefined,
        is_available: combo.is_available,
        preparation_time: combo.preparation_time || 15,
        created_at: combo.created_at,
        updated_at: combo.updated_at,
        combo_type: combo.combo_type, // 保留套餐類型
        combo_choices: (combo.combo_choices || []).map(choice => ({
          id: choice.id,
          category_id: choice.category_id,
          min_selections: choice.min_selections,
          max_selections: choice.max_selections,
          sort_order: choice.sort_order,
          categories: choice.categories && choice.categories.length > 0 ? choice.categories[0] : { id: '', name: '' }
        }))
      }))

      // 合併一般產品和套餐產品
      const allProducts = [...(products || []), ...comboProducts]
      console.log(`分類 ${categoryId} 產品數: ${allProducts.length} (一般: ${products?.length || 0}, 套餐: ${comboProducts.length})`)
      
      return allProducts
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
      // 生成訂單號碼（如果沒有提供）
      const orderNumber = orderData.order_number || `ORD-${Date.now()}`
      
      const { data, error } = await supabase
        .from('orders')
        .insert({
          order_number: orderNumber,
          table_id: orderData.table_id,
          table_number: orderData.table_number,
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

      // 如果有訂單項目，創建它們
      if (orderData.order_items && orderData.order_items.length > 0) {
        const orderItems = orderData.order_items.map((item: any) => ({
          order_id: data.id,
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price,
          special_instructions: item.special_instructions,
          status: item.status || 'pending'
        }))

        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItems)

        if (itemsError) {
          console.error('Error creating order items:', itemsError)
          // 如果創建訂單項目失敗，刪除已創建的訂單
          await supabase.from('orders').delete().eq('id', data.id)
          throw new Error('Failed to create order items')
        }
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
          table_number,
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
            product_name,
            quantity,
            unit_price,
            total_price,
            special_instructions,
            status
          )
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching orders:', error)
        return []
      }

      // @ts-ignore - Complex type mapping from Supabase
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

      // @ts-ignore - Database structure mapping
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

      // @ts-ignore - Database structure mapping
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
        id: table.id.toString(),
        table_number: table.table_number,
        name: `桌號 ${table.table_number}`,
        capacity: table.capacity,
        status: table.status || 'available',
        occupied: table.status === 'occupied',
        is_active: table.is_active,
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
