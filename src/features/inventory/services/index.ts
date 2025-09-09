// ================================
// 庫存管理系統 - Supabase 服務層
// ================================

import { createClient } from '@supabase/supabase-js';
import type {
  InventoryTransaction,
  CreateInventoryTransactionRequest,
  StockAlert,
  CreateStockAlertRequest,
  InventoryCount,
  InventoryCountItem,
  CreateInventoryCountRequest,
  UpdateInventoryCountItemRequest,
  ProductStock,
  RawMaterialStock,
  InventorySearchFilters,
  TransactionSearchFilters,
  AlertSearchFilters,
  PaginatedResponse,
  InventoryStats,
} from '../types';

// 獲取 Supabase 客戶端
const getSupabaseClient = () => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase 環境變數未設置');
  }
  
  return createClient(supabaseUrl, supabaseKey);
};

const supabase = getSupabaseClient();

// ================================
// 1. 庫存異動服務
// ================================

class InventoryTransactionService {
  // 獲取庫存異動記錄
  static async getTransactions(
    filters: TransactionSearchFilters = {},
    page = 1,
    limit = 20
  ): Promise<PaginatedResponse<InventoryTransaction>> {
    let query = supabase
      .from('inventory_transactions')
      .select(`
        *,
        products(name, sku),
        raw_materials(name, sku)
      `)
      .order('created_at', { ascending: false });

    // 應用篩選器
    if (filters.restaurant_id) {
      query = query.eq('restaurant_id', filters.restaurant_id);
    }
    if (filters.search) {
      query = query.or(`reason.ilike.%${filters.search}%,notes.ilike.%${filters.search}%`);
    }
    
    if (filters.transaction_type) {
      query = query.eq('transaction_type', filters.transaction_type);
    }
    
    if (filters.restaurant_id) {
      query = query.eq('restaurant_id', filters.restaurant_id);
    }
    
    if (filters.date_from) {
      query = query.gte('created_at', filters.date_from);
    }
    
    if (filters.date_to) {
      query = query.lte('created_at', filters.date_to);
    }
    
    if (filters.reference_type) {
      query = query.eq('reference_type', filters.reference_type);
    }

    // 分頁
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    
    const { data, error, count } = await query
      .range(from, to)
      .returns<InventoryTransaction[]>();

    if (error) {
      throw new Error(`獲取庫存異動記錄失敗: ${error.message}`);
    }

    return {
      data: data || [],
      total: count || 0,
      page,
      limit,
      has_more: (count || 0) > to + 1,
    };
  }

  // 建立庫存異動記錄
  static async createTransaction(
    request: CreateInventoryTransactionRequest
  ): Promise<InventoryTransaction> {
    // 首先獲取當前庫存
    let currentStock = 0;
    let restaurantIdForTx: string | undefined;
    let fallbackUnit: string | undefined;
    if (request.product_id) {
      const { data: product } = await supabase
        .from('products')
        .select('current_stock, restaurant_id, unit')
        .eq('id', request.product_id)
        .single();
      currentStock = product?.current_stock || 0;
      restaurantIdForTx = (product as any)?.restaurant_id;
      fallbackUnit = (product as any)?.unit;
    } else if (request.raw_material_id) {
      const { data: rawMaterial } = await supabase
        .from('raw_materials')
        .select('current_stock, restaurant_id, unit')
        .eq('id', request.raw_material_id)
        .single();
      currentStock = rawMaterial?.current_stock || 0;
      restaurantIdForTx = (rawMaterial as any)?.restaurant_id;
      fallbackUnit = (rawMaterial as any)?.unit;
    }

    // 計算新的庫存量
    const stockBefore = currentStock;
    let stockAfter = currentStock;
    
    switch (request.transaction_type) {
      case 'in':
        stockAfter = currentStock + request.quantity;
        break;
      case 'out':
        stockAfter = currentStock - request.quantity;
        break;
      case 'adjust':
        stockAfter = currentStock + request.quantity; // quantity 可以是負數
        break;
      case 'transfer':
        // 調撥需要特殊處理，這裡暫時按出庫處理
        stockAfter = currentStock - request.quantity;
        break;
    }

    // 建立異動記錄
    const transactionData: any = {
      ...request,
      stock_before: stockBefore,
      stock_after: stockAfter,
      total_cost: request.unit_cost ? request.quantity * request.unit_cost : null,
    };

    if (restaurantIdForTx) {
      transactionData.restaurant_id = restaurantIdForTx;
    }

    // 合理預設：如果缺少 unit 或 reason，嘗試補上
    if (!transactionData.unit && fallbackUnit) {
      transactionData.unit = fallbackUnit;
    }
    if (!transactionData.reason) {
      transactionData.reason = '庫存調整';
    }

    // 嘗試建立異動記錄；若表格尚未建立（404），採用降級策略：僅更新庫存並回傳模擬記錄
  let transaction: InventoryTransaction | null = null;
    try {
      const { data, error, status } = await supabase
        .from('inventory_transactions')
        .insert(transactionData)
        .select()
        .single();

      if (error) {
        // 若是 PostgREST 404 或資料表不存在，改走降級路徑
        const msg = String(error.message || '');
        if (status === 404 || msg.includes('Not Found') || msg.includes('relation') || msg.includes('does not exist')) {
          console.warn('[inventory] inventory_transactions 不存在，先僅更新庫存；請執行 inventory-database-extension.sql 建立資料表');
        } else {
          throw new Error(`建立庫存異動記錄失敗: ${error.message}`);
        }
      } else {
        transaction = data as any;
      }
    } catch (e: any) {
      // 透傳非 404 類錯誤
      if (!String(e?.message || '').includes('inventory_transactions 不存在')) {
        throw e;
      }
    }

    // 更新商品或原物料的庫存
    if (request.product_id) {
      await supabase
        .from('products')
        .update({ current_stock: stockAfter })
        .eq('id', request.product_id);
    } else if (request.raw_material_id) {
      await supabase
        .from('raw_materials')
        .update({ current_stock: stockAfter })
        .eq('id', request.raw_material_id);
    }

    // 若無法建立異動記錄，回傳一筆最小可用的模擬資料，讓前端流程不中斷
    if (!transaction) {
      transaction = {
        id: `fallback-${Date.now()}`,
        restaurant_id: (transactionData.restaurant_id || '00000000-0000-0000-0000-000000000000') as any,
        product_id: transactionData.product_id ?? null,
        raw_material_id: transactionData.raw_material_id ?? null,
        transaction_type: transactionData.transaction_type,
        quantity: transactionData.quantity,
        unit: transactionData.unit || '',
        reason: transactionData.reason,
        reference_type: transactionData.reference_type ?? null,
        reference_id: transactionData.reference_id ?? null,
        stock_before: transactionData.stock_before,
        stock_after: stockAfter,
        unit_cost: transactionData.unit_cost ?? null,
        total_cost: transactionData.total_cost ?? null,
        warehouse_location: transactionData.warehouse_location ?? null,
        from_location: transactionData.from_location ?? null,
        to_location: transactionData.to_location ?? null,
        batch_number: transactionData.batch_number ?? null,
        lot_number: transactionData.lot_number ?? null,
        expiry_date: transactionData.expiry_date ?? null,
        created_by: transactionData.created_by ?? null,
        created_at: new Date().toISOString() as any,
        notes: transactionData.notes ?? null,
        metadata: transactionData.metadata ?? null,
      } as any;
    }

  return transaction as InventoryTransaction;
  }

  // 獲取單一異動記錄
  static async getTransactionById(id: string): Promise<InventoryTransaction> {
    const { data, error } = await supabase
      .from('inventory_transactions')
      .select(`
        *,
        products(name, sku),
        raw_materials(name, sku)
      `)
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(`獲取庫存異動記錄失敗: ${error.message}`);
    }

    return data;
  }
}

// ================================
// 2. 庫存警示服務
// ================================

class StockAlertService {
  // 獲取庫存警示
  static async getAlerts(
    filters: AlertSearchFilters = {},
    page = 1,
    limit = 20
  ): Promise<PaginatedResponse<StockAlert>> {
    let query = supabase
      .from('stock_alerts')
      .select(`
        *,
        products(name, sku, current_stock),
        raw_materials(name, sku, current_stock)
      `)
      .order('created_at', { ascending: false });

    // 應用篩選器
    if (filters.alert_type) {
      query = query.eq('alert_type', filters.alert_type);
    }
    
    if (filters.alert_level) {
      query = query.eq('alert_level', filters.alert_level);
    }
    
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    
    if (filters.date_from) {
      query = query.gte('created_at', filters.date_from);
    }
    
    if (filters.date_to) {
      query = query.lte('created_at', filters.date_to);
    }

    // 分頁
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    
    const { data, error, count } = await query.range(from, to);

    if (error) {
      throw new Error(`獲取庫存警示失敗: ${error.message}`);
    }

    return {
      data: data || [],
      total: count || 0,
      page,
      limit,
      has_more: (count || 0) > to + 1,
    };
  }

  // 建立庫存警示
  static async createAlert(request: CreateStockAlertRequest): Promise<StockAlert> {
    const { data, error } = await supabase
      .from('stock_alerts')
      .insert(request)
      .select()
      .single();

    if (error) {
      throw new Error(`建立庫存警示失敗: ${error.message}`);
    }

    return data;
  }

  // 確認警示
  static async acknowledgeAlert(id: string): Promise<void> {
    const { error } = await supabase
      .from('stock_alerts')
      .update({
        status: 'acknowledged',
        acknowledged_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      throw new Error(`確認警示失敗: ${error.message}`);
    }
  }

  // 解決警示
  static async resolveAlert(id: string): Promise<void> {
    const { error } = await supabase
      .from('stock_alerts')
      .update({
        status: 'resolved',
        resolved_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      throw new Error(`解決警示失敗: ${error.message}`);
    }
  }

  // 忽略警示
  static async dismissAlert(id: string): Promise<void> {
    const { error } = await supabase
      .from('stock_alerts')
      .update({ status: 'dismissed' })
      .eq('id', id);

    if (error) {
      throw new Error(`忽略警示失敗: ${error.message}`);
    }
  }

  // 檢查庫存水位並生成警示
  static async checkStockLevels(): Promise<void> {
    const { error } = await supabase.rpc('check_stock_levels');
    
    if (error) {
      throw new Error(`檢查庫存水位失敗: ${error.message}`);
    }
  }
}

// ================================
// 3. 盤點服務
// ================================

class InventoryCountService {
  // 獲取盤點記錄
  static async getCounts(page = 1, limit = 20): Promise<PaginatedResponse<InventoryCount>> {
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    
    const { data, error, count } = await supabase
      .from('inventory_counts')
      .select('*')
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      throw new Error(`獲取盤點記錄失敗: ${error.message}`);
    }

    return {
      data: data || [],
      total: count || 0,
      page,
      limit,
      has_more: (count || 0) > to + 1,
    };
  }

  // 建立盤點記錄
  static async createCount(request: CreateInventoryCountRequest): Promise<InventoryCount> {
    const { data, error } = await supabase
      .from('inventory_counts')
      .insert(request)
      .select()
      .single();

    if (error) {
      throw new Error(`建立盤點記錄失敗: ${error.message}`);
    }

    return data;
  }

  // 獲取盤點詳情
  static async getCountById(id: string): Promise<InventoryCount> {
    const { data, error } = await supabase
      .from('inventory_counts')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(`獲取盤點記錄失敗: ${error.message}`);
    }

    return data;
  }

  // 獲取盤點項目
  static async getCountItems(countId: string): Promise<InventoryCountItem[]> {
    const { data, error } = await supabase
      .from('inventory_count_items')
      .select(`
        *,
        products(name, sku),
        raw_materials(name, sku)
      `)
      .eq('count_id', countId)
      .order('created_at');

    if (error) {
      throw new Error(`獲取盤點項目失敗: ${error.message}`);
    }

    return data || [];
  }

  // 更新盤點項目
  static async updateCountItem(
    itemId: string,
    request: UpdateInventoryCountItemRequest
  ): Promise<InventoryCountItem> {
    const { data, error } = await supabase
      .from('inventory_count_items')
      .update({
        ...request,
        counted: true,
        counted_at: new Date().toISOString(),
      })
      .eq('id', itemId)
      .select()
      .single();

    if (error) {
      throw new Error(`更新盤點項目失敗: ${error.message}`);
    }

    return data;
  }

  // 完成盤點
  static async completeCount(id: string): Promise<void> {
    const { error } = await supabase
      .from('inventory_counts')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      throw new Error(`完成盤點失敗: ${error.message}`);
    }
  }

  // 核准盤點
  static async approveCount(id: string): Promise<void> {
    const { error } = await supabase
      .from('inventory_counts')
      .update({
        status: 'approved',
        approved_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      throw new Error(`核准盤點失敗: ${error.message}`);
    }
  }
}

// ================================
// 4. 商品庫存服務
// ================================

class ProductStockService {
  // 獲取商品庫存
  static async getProducts(
    filters: InventorySearchFilters = {},
    page = 1,
    limit = 20
  ): Promise<PaginatedResponse<ProductStock>> {
    let query = supabase
      .from('products')
      .select(`
        *,
        categories(name)
      `)
      .eq('is_active', true)
      .order('name');

    if (filters.restaurant_id) {
      query = query.eq('restaurant_id', filters.restaurant_id);
    }

    // 應用篩選器
    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,sku.ilike.%${filters.search}%`);
    }
    
    if (filters.category_id) {
      query = query.eq('category_id', filters.category_id);
    }
    
    if (filters.stock_status) {
      switch (filters.stock_status) {
        case 'low':
          query = query.lt('current_stock', 'min_stock');
          break;
        case 'out':
          query = query.eq('current_stock', 0);
          break;
        case 'over':
          query = query.gt('current_stock', 'max_stock');
          break;
      }
    }

    // 分頁
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    
    const { data, error, count } = await query.range(from, to);

    if (error) {
      throw new Error(`獲取商品庫存失敗: ${error.message}`);
    }

    // 計算庫存狀態
    const processedData = (data || []).map(product => ({
      ...product,
      stock_status: this.calculateStockStatus(product.current_stock, product.min_stock, product.max_stock),
      stock_value: product.current_stock * product.cost,
    }));

    return {
      data: processedData,
      total: count || 0,
      page,
      limit,
      has_more: (count || 0) > to + 1,
    };
  }

  // 計算庫存狀態
  private static calculateStockStatus(current: number, min: number, max: number): string {
    if (current === 0) return 'out';
    if (current <= min) return 'low';
    if (max > 0 && current >= max) return 'over';
    return 'normal';
  }
}

// ================================
// 5. 原物料庫存服務
// ================================

class RawMaterialStockService {
  // 獲取原物料庫存
  static async getRawMaterials(
    filters: InventorySearchFilters = {},
    page = 1,
    limit = 20
  ): Promise<PaginatedResponse<RawMaterialStock>> {
    let query = supabase
      .from('raw_materials')
      .select(`
        *,
        suppliers(name)
      `)
      .eq('is_active', true)
      .order('name');

    if (filters.restaurant_id) {
      query = query.eq('restaurant_id', filters.restaurant_id);
    }

    // 應用篩選器
    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,sku.ilike.%${filters.search}%`);
    }
    
    if (filters.supplier_id) {
      query = query.eq('supplier_id', filters.supplier_id);
    }
    
    if (filters.stock_status) {
      switch (filters.stock_status) {
        case 'low':
          query = query.lt('current_stock', 'min_stock');
          break;
        case 'out':
          query = query.eq('current_stock', 0);
          break;
        case 'over':
          query = query.gt('current_stock', 'max_stock');
          break;
      }
    }

    // 分頁
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    
    const { data, error, count } = await query.range(from, to);

    if (error) {
      throw new Error(`獲取原物料庫存失敗: ${error.message}`);
    }

    // 計算庫存狀態
    const processedData = (data || []).map(material => ({
      ...material,
      stock_status: this.calculateStockStatus(material.current_stock, material.min_stock, material.max_stock),
      stock_value: material.current_stock * material.cost_per_unit,
    }));

    return {
      data: processedData,
      total: count || 0,
      page,
      limit,
      has_more: (count || 0) > to + 1,
    };
  }

  // 計算庫存狀態
  private static calculateStockStatus(current: number, min: number, max: number): string {
    if (current === 0) return 'out';
    if (current <= min) return 'low';
    if (max > 0 && current >= max) return 'over';
    return 'normal';
  }

  // 批量新增/更新原物料
  static async bulkUpsertRawMaterials(
    rows: Array<Partial<RawMaterialStock> & { name: string; unit: string; category?: string; supplier_id?: string }>,
    restaurant_id: string
  ): Promise<{ inserted: number; updated?: number }> {
    if (!rows?.length) return { inserted: 0 };

    // 準備資料：補上 restaurant_id 與預設值，轉型數字
    // 若同名重複，後者覆蓋前者
    const nameDedupMap = new Map<string, any>();
    for (const r of rows) {
      nameDedupMap.set(r.name, r);
    }

    const prepared = Array.from(nameDedupMap.values()).map(r => ({
      restaurant_id,
      name: r.name,
      category: r.category ?? '未分類',
      unit: r.unit,
      supplier_id: r.supplier_id ?? null,
      current_stock: Number((r as any).current_stock ?? 0),
      min_stock: Number((r as any).min_stock ?? 0),
      max_stock: Number((r as any).max_stock ?? 0),
      cost_per_unit: Number((r as any).cost_per_unit ?? 0),
      last_purchase_cost: (r as any).last_purchase_cost != null ? Number((r as any).last_purchase_cost) : null,
      shelf_life_days: (r as any).shelf_life_days != null ? Number((r as any).shelf_life_days) : null,
      is_active: (r as any).is_active != null ? Boolean((r as any).is_active) : true,
    }));

    // 嘗試使用 (restaurant_id, name) 作為衝突鍵，若失敗則退回 insert
    const { data, error } = await supabase
      .from('raw_materials')
      .upsert(prepared, { onConflict: 'restaurant_id,name' })
      .select();

    // 若成功，直接返回
    if (!error) {
      return { inserted: data?.length || 0 };
    }

    // 若資料庫尚未建立唯一鍵，進入後備策略：先查既有，再分批 update/insert
    const noUniqueMsg = 'no unique or exclusion constraint matching the ON CONFLICT specification';
    if (String(error.message).toLowerCase().includes('on conflict') &&
        String(error.message).toLowerCase().includes('no unique') ) {
      // 取得當前餐廳、同名清單的既有原物料
      const names = prepared.map(p => p.name);
      const { data: existingRows, error: fetchErr } = await supabase
        .from('raw_materials')
        .select('id,name')
        .eq('restaurant_id', restaurant_id)
        .in('name', names);

      if (fetchErr) {
        throw new Error(`批量匯入原物料失敗（讀取既有資料）: ${fetchErr.message}`);
      }

      const existingSet = new Set((existingRows || []).map(r => r.name));
      const toInsert = prepared.filter(p => !existingSet.has(p.name));
      const toUpdate = prepared.filter(p => existingSet.has(p.name));

      // 執行更新（逐筆，避免多筆更新同欄位衝突）
      let updatedCount = 0;
      if (toUpdate.length) {
        const updatePromises = toUpdate.map(row =>
          supabase
            .from('raw_materials')
            .update({
              category: row.category,
              unit: row.unit,
              supplier_id: row.supplier_id,
              current_stock: row.current_stock,
              min_stock: row.min_stock,
              max_stock: row.max_stock,
              cost_per_unit: row.cost_per_unit,
              last_purchase_cost: row.last_purchase_cost,
              shelf_life_days: row.shelf_life_days,
              is_active: row.is_active,
            })
            .eq('restaurant_id', restaurant_id)
            .eq('name', row.name)
            .select()
        );

        const updateResults = await Promise.all(updatePromises);
        updatedCount = updateResults.reduce((acc, res) => acc + (res.data?.length || 0), 0);
        const anyUpdateErr = updateResults.find(res => res.error);
        if (anyUpdateErr?.error) {
          throw new Error(`批量更新原物料部分失敗: ${anyUpdateErr.error.message}`);
        }
      }

      // 插入新增資料
      let insertedCount = 0;
      if (toInsert.length) {
        const insertRes = await supabase
          .from('raw_materials')
          .insert(toInsert)
          .select();
        if (insertRes.error) {
          throw new Error(`批量新增原物料失敗: ${insertRes.error.message}`);
        }
        insertedCount = insertRes.data?.length || 0;
      }

      return { inserted: insertedCount, updated: updatedCount };
    }

    // 其他錯誤原樣丟出
    throw new Error(`批量匯入原物料失敗: ${error.message}`);
  }
}

// ================================
// 6. 統計服務
// ================================

class InventoryStatsService {
  // 獲取庫存統計資料
  static async getStats(): Promise<InventoryStats> {
    // 這裡需要建立 RPC 函數或者使用多個查詢
    // 為了簡化，先使用基本查詢
    
    const [
      { count: totalProducts },
      { count: totalRawMaterials },
      { count: lowStockAlerts },
      recentTransactionsResult
    ] = await Promise.all([
      supabase.from('products').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('raw_materials').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('stock_alerts').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('inventory_transactions').select('*', { count: 'exact', head: true })
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    ]);

    // 計算總庫存價值需要額外查詢
    const { data: products } = await supabase
      .from('products')
      .select('current_stock, cost')
      .eq('is_active', true);
    
    const { data: rawMaterials } = await supabase
      .from('raw_materials')
      .select('current_stock, cost_per_unit')
      .eq('is_active', true);

    const totalStockValue = 
      (products || []).reduce((sum, p) => sum + (p.current_stock * p.cost), 0) +
      (rawMaterials || []).reduce((sum, r) => sum + (r.current_stock * r.cost_per_unit), 0);

    const { count: pendingCounts } = await supabase
      .from('inventory_counts')
      .select('*', { count: 'exact', head: true })
      .in('status', ['draft', 'in_progress']);

    return {
      total_products: totalProducts || 0,
      total_raw_materials: totalRawMaterials || 0,
      low_stock_alerts: lowStockAlerts || 0,
      total_stock_value: totalStockValue,
      recent_transactions: recentTransactionsResult.count || 0,
      pending_counts: pendingCounts || 0,
    };
  }
}

// 默認導出所有服務
const InventoryServices = {
  InventoryTransactionService,
  StockAlertService,
  InventoryCountService,
  ProductStockService,
  RawMaterialStockService,
  InventoryStatsService,
};

export default InventoryServices;
