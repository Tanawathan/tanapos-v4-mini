// TanaPOS V4-Mini 庫存管理 API 服務
// 實現三層架構庫存管理的核心業務邏輯

import { supabase } from './supabase'
import type {
  RawMaterial,
  SemiFinishedProduct,
  MenuItemEnhanced,
  Recipe,
  RecipeIngredient,
  StockMovement,
  ProductionRecord,
  Supplier,
  PurchaseRecord,
  PurchaseItem,
  InventoryService,
  StockCalculationService,
  ApiResponse,
  InventoryAlert,
  StockSummary,
  CreateType,
  UpdateType
} from './types-inventory'

// ================================
// 1. 庫存計算服務實現
// ================================
class StockCalculationServiceImpl implements StockCalculationService {
  
  /**
   * 計算半成品虛擬庫存
   * 根據食譜和原物料庫存計算可製作的半成品數量
   */
  async calculateSemiVirtualStock(semiId: string): Promise<number> {
    try {
      // 1. 獲取半成品資訊
      const { data: semiProduct } = await supabase
        .from('semi_finished_products')
        .select('*')
        .eq('id', semiId)
        .single()

      if (!semiProduct) return 0

      // 2. 獲取製作此半成品的食譜
      const { data: recipes } = await supabase
        .from('recipes')
        .select(`
          *,
          recipe_ingredients (
            ingredient_id,
            ingredient_type,
            quantity,
            unit
          )
        `)
        .eq('type', 'raw_to_semi')

      const relevantRecipe = recipes?.find(recipe => 
        recipe.name.includes(semiProduct.name) || 
        recipe.id === semiProduct.recipe_id
      )

      if (!relevantRecipe || !relevantRecipe.recipe_ingredients) return 0

      // 3. 計算基於原物料的可製作數量
      let maxMakeable = Infinity

      for (const ingredient of relevantRecipe.recipe_ingredients) {
        if (ingredient.ingredient_type === 'raw') {
          const { data: rawMaterial } = await supabase
            .from('raw_materials')
            .select('current_stock')
            .eq('id', ingredient.ingredient_id)
            .single()

          if (rawMaterial) {
            const possibleQuantity = Math.floor(
              rawMaterial.current_stock / ingredient.quantity
            )
            maxMakeable = Math.min(maxMakeable, possibleQuantity)
          } else {
            maxMakeable = 0
            break
          }
        }
      }

      return maxMakeable === Infinity ? 0 : maxMakeable * relevantRecipe.yield_quantity

    } catch (error) {
      console.error('計算半成品虛擬庫存錯誤:', error)
      return 0
    }
  }

  /**
   * 計算成品虛擬庫存
   * 支援混合模式：原料+半成品組合
   */
  async calculateMenuVirtualStock(menuId: string): Promise<number> {
    try {
      // 1. 獲取成品資訊和食譜
      const { data: menuItem } = await supabase
        .from('products')
        .select(`
          *,
          recipes (
            *,
            recipe_ingredients (
              ingredient_id,
              ingredient_type,
              quantity,
              unit
            )
          )
        `)
        .eq('id', menuId)
        .single()

      if (!menuItem || !menuItem.recipes) return 0

      const recipe = menuItem.recipes
      if (!recipe.recipe_ingredients) return 0

      let maxMakeable = Infinity

      // 2. 檢查每個所需材料
      for (const ingredient of recipe.recipe_ingredients) {
        let availableQuantity = 0

        if (ingredient.ingredient_type === 'raw') {
          // 檢查原物料庫存
          const { data: rawMaterial } = await supabase
            .from('raw_materials')
            .select('current_stock')
            .eq('id', ingredient.ingredient_id)
            .single()

          availableQuantity = rawMaterial?.current_stock || 0

        } else if (ingredient.ingredient_type === 'semi') {
          // 檢查半成品總可用量 (實際+虛擬)
          const { data: semiProduct } = await supabase
            .from('semi_finished_products')
            .select('actual_stock')
            .eq('id', ingredient.ingredient_id)
            .single()

          const actualStock = semiProduct?.actual_stock || 0
          const virtualStock = await this.calculateSemiVirtualStock(ingredient.ingredient_id)
          
          availableQuantity = actualStock + virtualStock
        }

        const possibleQuantity = Math.floor(availableQuantity / ingredient.quantity)
        maxMakeable = Math.min(maxMakeable, possibleQuantity)
      }

      return maxMakeable === Infinity ? 0 : maxMakeable * recipe.yield_quantity

    } catch (error) {
      console.error('計算成品虛擬庫存錯誤:', error)
      return 0
    }
  }

  /**
   * 計算食譜成本
   */
  async calculateRecipeCost(recipeId: string): Promise<{
    rawMaterialCost: number
    semiProductCost: number
    totalCost: number
  }> {
    try {
      const { data: recipe } = await supabase
        .from('recipes')
        .select(`
          *,
          recipe_ingredients (
            ingredient_id,
            ingredient_type,
            quantity
          )
        `)
        .eq('id', recipeId)
        .single()

      if (!recipe || !recipe.recipe_ingredients) {
        return { rawMaterialCost: 0, semiProductCost: 0, totalCost: 0 }
      }

      let rawMaterialCost = 0
      let semiProductCost = 0

      for (const ingredient of recipe.recipe_ingredients) {
        if (ingredient.ingredient_type === 'raw') {
          const { data: rawMaterial } = await supabase
            .from('raw_materials')
            .select('cost')
            .eq('id', ingredient.ingredient_id)
            .single()

          if (rawMaterial) {
            rawMaterialCost += rawMaterial.cost * ingredient.quantity
          }

        } else if (ingredient.ingredient_type === 'semi') {
          const { data: semiProduct } = await supabase
            .from('semi_finished_products')
            .select('virtual_cost')
            .eq('id', ingredient.ingredient_id)
            .single()

          if (semiProduct) {
            semiProductCost += semiProduct.virtual_cost * ingredient.quantity
          }
        }
      }

      const totalCost = rawMaterialCost + semiProductCost + (recipe.labor_cost || 0) + (recipe.overhead_cost || 0)

      return { rawMaterialCost, semiProductCost, totalCost }

    } catch (error) {
      console.error('計算食譜成本錯誤:', error)
      return { rawMaterialCost: 0, semiProductCost: 0, totalCost: 0 }
    }
  }

  /**
   * 檢查是否可製作
   */
  async canMake(itemId: string, quantity: number, itemType: 'semi' | 'menu'): Promise<{
    canMake: boolean
    missingIngredients: Array<{
      id: string
      name: string
      type: 'raw' | 'semi'
      required: number
      available: number
      shortfall: number
    }>
  }> {
    try {
      const missingIngredients: Array<{
        id: string
        name: string
        type: 'raw' | 'semi'
        required: number
        available: number
        shortfall: number
      }> = []

      // 根據類型獲取食譜
      let recipe: any = null
      if (itemType === 'semi') {
        const { data: semiProduct } = await supabase
          .from('semi_finished_products')
          .select(`
            recipes (
              *,
              recipe_ingredients (*)
            )
          `)
          .eq('id', itemId)
          .single()
        recipe = semiProduct?.recipes
      } else {
        const { data: menuItem } = await supabase
          .from('products')
          .select(`
            recipes (
              *,
              recipe_ingredients (*)
            )
          `)
          .eq('id', itemId)
          .single()
        recipe = menuItem?.recipes
      }

      if (!recipe || !recipe.recipe_ingredients) {
        return { canMake: false, missingIngredients }
      }

      // 檢查每個材料
      for (const ingredient of recipe.recipe_ingredients) {
        const requiredQuantity = ingredient.quantity * quantity
        let availableQuantity = 0
        let ingredientName = ''

        if (ingredient.ingredient_type === 'raw') {
          const { data: rawMaterial } = await supabase
            .from('raw_materials')
            .select('name, current_stock')
            .eq('id', ingredient.ingredient_id)
            .single()

          if (rawMaterial) {
            ingredientName = rawMaterial.name
            availableQuantity = rawMaterial.current_stock
          }

        } else if (ingredient.ingredient_type === 'semi') {
          const { data: semiProduct } = await supabase
            .from('semi_finished_products')
            .select('name, actual_stock')
            .eq('id', ingredient.ingredient_id)
            .single()

          if (semiProduct) {
            ingredientName = semiProduct.name
            const virtualStock = await this.calculateSemiVirtualStock(ingredient.ingredient_id)
            availableQuantity = semiProduct.actual_stock + virtualStock
          }
        }

        if (availableQuantity < requiredQuantity) {
          missingIngredients.push({
            id: ingredient.ingredient_id,
            name: ingredientName,
            type: ingredient.ingredient_type,
            required: requiredQuantity,
            available: availableQuantity,
            shortfall: requiredQuantity - availableQuantity
          })
        }
      }

      return {
        canMake: missingIngredients.length === 0,
        missingIngredients
      }

    } catch (error) {
      console.error('檢查製作可能性錯誤:', error)
      return { canMake: false, missingIngredients: [] }
    }
  }

  /**
   * 更新虛擬庫存
   */
  async updateVirtualStock(itemId: string, itemType: 'semi' | 'menu'): Promise<void> {
    try {
      if (itemType === 'semi') {
        const virtualStock = await this.calculateSemiVirtualStock(itemId)
        
        const { data: semiProduct } = await supabase
          .from('semi_finished_products')
          .select('actual_stock')
          .eq('id', itemId)
          .single()
        
        const totalAvailable = (semiProduct?.actual_stock || 0) + virtualStock
        
        await supabase
          .from('semi_finished_products')
          .update({
            virtual_stock: virtualStock,
            total_available: totalAvailable
          })
          .eq('id', itemId)

      } else if (itemType === 'menu') {
        const virtualStock = await this.calculateMenuVirtualStock(itemId)
        
        const { data: menuItem } = await supabase
          .from('products')
          .select('actual_stock')
          .eq('id', itemId)
          .single()
        
        const totalAvailable = (menuItem?.actual_stock || 0) + virtualStock
        
        await supabase
          .from('products')
          .update({
            virtual_stock: virtualStock,
            total_available: totalAvailable
          })
          .eq('id', itemId)
      }

    } catch (error) {
      console.error('更新虛擬庫存錯誤:', error)
    }
  }

  /**
   * 批量更新所有虛擬庫存
   */
  async updateAllVirtualStock(): Promise<void> {
    try {
      // 更新所有半成品虛擬庫存
      const { data: semiProducts } = await supabase
        .from('semi_finished_products')
        .select('id')

      if (semiProducts) {
        for (const product of semiProducts) {
          await this.updateVirtualStock(product.id, 'semi')
        }
      }

      // 更新所有成品虛擬庫存
      const { data: menuItems } = await supabase
        .from('products')
        .select('id')

      if (menuItems) {
        for (const item of menuItems) {
          await this.updateVirtualStock(item.id, 'menu')
        }
      }

    } catch (error) {
      console.error('批量更新虛擬庫存錯誤:', error)
    }
  }
}

// ================================
// 2. 庫存管理服務實現
// ================================
class InventoryServiceImpl implements InventoryService {
  private stockCalculator = new StockCalculationServiceImpl()

  // ================================
  // 原物料操作
  // ================================
  async getRawMaterials(): Promise<RawMaterial[]> {
    try {
      const { data, error } = await supabase
        .from('raw_materials')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('獲取原物料清單錯誤:', error)
      return []
    }
  }

  async getRawMaterial(id: string): Promise<RawMaterial | null> {
    try {
      const { data, error } = await supabase
        .from('raw_materials')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('獲取原物料詳情錯誤:', error)
      return null
    }
  }

  async createRawMaterial(data: CreateType<RawMaterial>): Promise<RawMaterial> {
    try {
      const { data: result, error } = await supabase
        .from('raw_materials')
        .insert([{
          name: data.name,
          category: data.category,
          unit: data.unit,
          current_stock: data.currentStock,
          min_stock: data.minStock,
          max_stock: data.maxStock,
          cost: data.cost,
          supplier: data.supplier,
          expiry_date: data.expiryDate,
          storage_location: data.storageLocation,
          last_restock_date: data.lastRestockDate,
          is_active: data.isActive
        }])
        .select()
        .single()

      if (error) throw error
      return result
    } catch (error) {
      console.error('創建原物料錯誤:', error)
      throw error
    }
  }

  async updateRawMaterial(id: string, data: UpdateType<RawMaterial>): Promise<RawMaterial> {
    try {
      const updateData: any = {}
      
      if (data.name !== undefined) updateData.name = data.name
      if (data.category !== undefined) updateData.category = data.category
      if (data.unit !== undefined) updateData.unit = data.unit
      if (data.currentStock !== undefined) updateData.current_stock = data.currentStock
      if (data.minStock !== undefined) updateData.min_stock = data.minStock
      if (data.maxStock !== undefined) updateData.max_stock = data.maxStock
      if (data.cost !== undefined) updateData.cost = data.cost
      if (data.supplier !== undefined) updateData.supplier = data.supplier
      if (data.expiryDate !== undefined) updateData.expiry_date = data.expiryDate
      if (data.storageLocation !== undefined) updateData.storage_location = data.storageLocation
      if (data.lastRestockDate !== undefined) updateData.last_restock_date = data.lastRestockDate
      if (data.isActive !== undefined) updateData.is_active = data.isActive

      const { data: result, error } = await supabase
        .from('raw_materials')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      // 更新後重新計算相關的虛擬庫存
      await this.stockCalculator.updateAllVirtualStock()

      return result
    } catch (error) {
      console.error('更新原物料錯誤:', error)
      throw error
    }
  }

  async deleteRawMaterial(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('raw_materials')
        .update({ is_active: false })
        .eq('id', id)

      if (error) throw error
    } catch (error) {
      console.error('刪除原物料錯誤:', error)
      throw error
    }
  }

  // ================================
  // 半成品操作
  // ================================
  async getSemiProducts(): Promise<SemiFinishedProduct[]> {
    try {
      const { data, error } = await supabase
        .from('semi_finished_products')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('獲取半成品清單錯誤:', error)
      return []
    }
  }

  async getSemiProduct(id: string): Promise<SemiFinishedProduct | null> {
    try {
      const { data, error } = await supabase
        .from('semi_finished_products')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('獲取半成品詳情錯誤:', error)
      return null
    }
  }

  async createSemiProduct(data: CreateType<SemiFinishedProduct>): Promise<SemiFinishedProduct> {
    try {
      const { data: result, error } = await supabase
        .from('semi_finished_products')
        .insert([{
          name: data.name,
          category: data.category,
          unit: data.unit,
          actual_stock: data.actualStock,
          min_actual_stock: data.minActualStock,
          preparation_time: data.preparationTime,
          shelf_life: data.shelfLife,
          actual_cost: data.actualCost,
          virtual_cost: data.virtualCost,
          auto_restock: data.autoRestock,
          restock_threshold: data.restockThreshold,
          is_active: data.isActive
        }])
        .select()
        .single()

      if (error) throw error

      // 計算虛擬庫存
      await this.stockCalculator.updateVirtualStock(result.id, 'semi')

      return result
    } catch (error) {
      console.error('創建半成品錯誤:', error)
      throw error
    }
  }

  async updateSemiProduct(id: string, data: UpdateType<SemiFinishedProduct>): Promise<SemiFinishedProduct> {
    try {
      const updateData: any = {}
      
      if (data.name !== undefined) updateData.name = data.name
      if (data.category !== undefined) updateData.category = data.category
      if (data.unit !== undefined) updateData.unit = data.unit
      if (data.actualStock !== undefined) updateData.actual_stock = data.actualStock
      if (data.minActualStock !== undefined) updateData.min_actual_stock = data.minActualStock
      if (data.preparationTime !== undefined) updateData.preparation_time = data.preparationTime
      if (data.shelfLife !== undefined) updateData.shelf_life = data.shelfLife
      if (data.actualCost !== undefined) updateData.actual_cost = data.actualCost
      if (data.virtualCost !== undefined) updateData.virtual_cost = data.virtualCost
      if (data.autoRestock !== undefined) updateData.auto_restock = data.autoRestock
      if (data.restockThreshold !== undefined) updateData.restock_threshold = data.restockThreshold
      if (data.isActive !== undefined) updateData.is_active = data.isActive

      const { data: result, error } = await supabase
        .from('semi_finished_products')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      // 更新虛擬庫存
      await this.stockCalculator.updateVirtualStock(id, 'semi')
      await this.stockCalculator.updateAllVirtualStock()

      return result
    } catch (error) {
      console.error('更新半成品錯誤:', error)
      throw error
    }
  }

  async deleteSemiProduct(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('semi_finished_products')
        .update({ is_active: false })
        .eq('id', id)

      if (error) throw error
    } catch (error) {
      console.error('刪除半成品錯誤:', error)
      throw error
    }
  }

  // ================================
  // 食譜操作
  // ================================
  async getRecipes(): Promise<Recipe[]> {
    try {
      const { data, error } = await supabase
        .from('recipes')
        .select(`
          *,
          recipe_ingredients (
            id,
            ingredient_id,
            ingredient_type,
            quantity,
            unit,
            notes,
            is_optional
          )
        `)
        .eq('is_active', true)
        .order('name')

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('獲取食譜清單錯誤:', error)
      return []
    }
  }

  async getRecipe(id: string): Promise<Recipe | null> {
    try {
      const { data, error } = await supabase
        .from('recipes')
        .select(`
          *,
          recipe_ingredients (
            id,
            ingredient_id,
            ingredient_type,
            quantity,
            unit,
            notes,
            is_optional
          )
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('獲取食譜詳情錯誤:', error)
      return null
    }
  }

  async createRecipe(data: CreateType<Recipe>): Promise<Recipe> {
    try {
      // 先創建食譜
      const { data: recipe, error: recipeError } = await supabase
        .from('recipes')
        .insert([{
          name: data.name,
          type: data.type,
          yield_quantity: data.yieldQuantity,
          preparation_time: data.preparationTime,
          difficulty: data.difficulty,
          instructions: data.instructions,
          cost_calculation: data.costCalculation,
          manual_cost: data.manualCost,
          labor_cost: data.laborCost,
          overhead_cost: data.overheadCost,
          is_active: data.isActive
        }])
        .select()
        .single()

      if (recipeError) throw recipeError

      // 然後創建食譜材料
      if (data.ingredients && data.ingredients.length > 0) {
        const ingredientData = data.ingredients.map(ingredient => ({
          recipe_id: recipe.id,
          ingredient_id: ingredient.ingredientId,
          ingredient_type: ingredient.ingredientType,
          quantity: ingredient.quantity,
          unit: ingredient.unit,
          notes: ingredient.notes,
          is_optional: ingredient.isOptional
        }))

        const { error: ingredientError } = await supabase
          .from('recipe_ingredients')
          .insert(ingredientData)

        if (ingredientError) throw ingredientError
      }

      // 更新相關的虛擬庫存
      await this.stockCalculator.updateAllVirtualStock()

      return await this.getRecipe(recipe.id) || recipe
    } catch (error) {
      console.error('創建食譜錯誤:', error)
      throw error
    }
  }

  async updateRecipe(id: string, data: UpdateType<Recipe>): Promise<Recipe> {
    try {
      const updateData: any = {}
      
      if (data.name !== undefined) updateData.name = data.name
      if (data.type !== undefined) updateData.type = data.type
      if (data.yieldQuantity !== undefined) updateData.yield_quantity = data.yieldQuantity
      if (data.preparationTime !== undefined) updateData.preparation_time = data.preparationTime
      if (data.difficulty !== undefined) updateData.difficulty = data.difficulty
      if (data.instructions !== undefined) updateData.instructions = data.instructions
      if (data.costCalculation !== undefined) updateData.cost_calculation = data.costCalculation
      if (data.manualCost !== undefined) updateData.manual_cost = data.manualCost
      if (data.laborCost !== undefined) updateData.labor_cost = data.laborCost
      if (data.overheadCost !== undefined) updateData.overhead_cost = data.overheadCost
      if (data.isActive !== undefined) updateData.is_active = data.isActive

      const { data: result, error } = await supabase
        .from('recipes')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      // 如果有更新材料清單
      if (data.ingredients) {
        // 先刪除舊的材料
        await supabase
          .from('recipe_ingredients')
          .delete()
          .eq('recipe_id', id)

        // 重新插入材料
        if (data.ingredients.length > 0) {
          const ingredientData = data.ingredients.map(ingredient => ({
            recipe_id: id,
            ingredient_id: ingredient.ingredientId,
            ingredient_type: ingredient.ingredientType,
            quantity: ingredient.quantity,
            unit: ingredient.unit,
            notes: ingredient.notes,
            is_optional: ingredient.isOptional
          }))

          await supabase
            .from('recipe_ingredients')
            .insert(ingredientData)
        }
      }

      // 更新相關的虛擬庫存
      await this.stockCalculator.updateAllVirtualStock()

      return await this.getRecipe(id) || result
    } catch (error) {
      console.error('更新食譜錯誤:', error)
      throw error
    }
  }

  async deleteRecipe(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('recipes')
        .update({ is_active: false })
        .eq('id', id)

      if (error) throw error
    } catch (error) {
      console.error('刪除食譜錯誤:', error)
      throw error
    }
  }

  // ================================
  // 庫存異動記錄
  // ================================
  async recordStockMovement(movement: Omit<StockMovement, 'id' | 'createdAt'>): Promise<StockMovement> {
    try {
      const { data, error } = await supabase
        .from('stock_movements')
        .insert([{
          item_id: movement.itemId,
          item_type: movement.itemType,
          movement_type: movement.movementType,
          quantity: movement.quantity,
          cost: movement.cost,
          reason: movement.reason,
          reference_id: movement.referenceId,
          reference_type: movement.referenceType,
          created_by: movement.createdBy
        }])
        .select()
        .single()

      if (error) throw error

      // 更新對應的庫存
      if (movement.itemType === 'raw') {
        const { data: currentItem } = await supabase
          .from('raw_materials')
          .select('current_stock')
          .eq('id', movement.itemId)
          .single()
        
        const multiplier = movement.movementType === 'in' ? 1 : -1
        const newStock = (currentItem?.current_stock || 0) + (movement.quantity * multiplier)
        
        await supabase
          .from('raw_materials')
          .update({ current_stock: newStock })
          .eq('id', movement.itemId)

      } else if (movement.itemType === 'semi') {
        const { data: currentItem } = await supabase
          .from('semi_finished_products')
          .select('actual_stock')
          .eq('id', movement.itemId)
          .single()
        
        const multiplier = movement.movementType === 'in' ? 1 : -1
        const newStock = (currentItem?.actual_stock || 0) + (movement.quantity * multiplier)
        
        await supabase
          .from('semi_finished_products')
          .update({ actual_stock: newStock })
          .eq('id', movement.itemId)

        // 更新半成品虛擬庫存
        await this.stockCalculator.updateVirtualStock(movement.itemId, 'semi')

      } else if (movement.itemType === 'product') {
        const { data: currentItem } = await supabase
          .from('products')
          .select('actual_stock')
          .eq('id', movement.itemId)
          .single()
        
        const multiplier = movement.movementType === 'in' ? 1 : -1
        const newStock = (currentItem?.actual_stock || 0) + (movement.quantity * multiplier)
        
        await supabase
          .from('products')
          .update({ actual_stock: newStock })
          .eq('id', movement.itemId)

        // 更新成品虛擬庫存
        await this.stockCalculator.updateVirtualStock(movement.itemId, 'menu')
      }

      return data
    } catch (error) {
      console.error('記錄庫存異動錯誤:', error)
      throw error
    }
  }

  async getStockMovements(itemId?: string, itemType?: string): Promise<StockMovement[]> {
    try {
      let query = supabase
        .from('stock_movements')
        .select('*')
        .order('created_at', { ascending: false })

      if (itemId) {
        query = query.eq('item_id', itemId)
      }

      if (itemType) {
        query = query.eq('item_type', itemType)
      }

      const { data, error } = await query

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('獲取庫存異動記錄錯誤:', error)
      return []
    }
  }

  // ================================
  // 製作記錄
  // ================================
  async createProductionRecord(record: Omit<ProductionRecord, 'id' | 'createdAt'>): Promise<ProductionRecord> {
    try {
      const { data, error } = await supabase
        .from('production_records')
        .insert([{
          semi_product_id: record.semiProductId,
          recipe_id: record.recipeId,
          quantity_produced: record.quantityProduced,
          actual_cost: record.actualCost,
          production_time: record.productionTime,
          quality_grade: record.qualityGrade,
          notes: record.notes,
          started_at: record.startedAt,
          completed_at: record.completedAt,
          created_by: record.createdBy
        }])
        .select()
        .single()

      if (error) throw error

      // 自動記錄庫存異動
      await this.recordStockMovement({
        itemId: record.semiProductId,
        itemType: 'semi',
        movementType: 'in',
        quantity: record.quantityProduced,
        cost: record.actualCost,
        reason: `生產製作：${record.notes || ''}`,
        referenceId: data.id,
        referenceType: 'production',
        createdBy: record.createdBy
      })

      return data
    } catch (error) {
      console.error('創建製作記錄錯誤:', error)
      throw error
    }
  }

  async getProductionRecords(semiProductId?: string): Promise<ProductionRecord[]> {
    try {
      let query = supabase
        .from('production_records')
        .select('*')
        .order('created_at', { ascending: false })

      if (semiProductId) {
        query = query.eq('semi_product_id', semiProductId)
      }

      const { data, error } = await query

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('獲取製作記錄錯誤:', error)
      return []
    }
  }
}

// ================================
// 3. 服務實例和輔助函數
// ================================

// 創建服務實例
export const inventoryService = new InventoryServiceImpl()
export const stockCalculationService = new StockCalculationServiceImpl()

/**
 * 獲取庫存總覽
 */
export async function getStockSummary(): Promise<StockSummary> {
  try {
    const [rawMaterials, semiProducts, menuItems] = await Promise.all([
      inventoryService.getRawMaterials(),
      inventoryService.getSemiProducts(),
      supabase.from('products').select('*')
    ])

    const alerts: InventoryAlert[] = []
    let totalValue = 0
    let lowStockItems = 0
    let expiringItems = 0

    // 檢查原物料警告
    rawMaterials.forEach(item => {
      totalValue += item.currentStock * item.cost

      if (item.currentStock <= item.minStock) {
        lowStockItems++
        alerts.push({
          id: `raw-${item.id}`,
          type: item.currentStock === 0 ? 'out_of_stock' : 'low_stock',
          severity: item.currentStock === 0 ? 'critical' : 'high',
          itemId: item.id,
          itemName: item.name,
          itemType: 'raw',
          message: `${item.name} 庫存不足 (當前: ${item.currentStock} ${item.unit})`,
          currentStock: item.currentStock,
          requiredStock: item.minStock,
          createdAt: new Date().toISOString()
        })
      }

      if (item.expiryDate) {
        const expiryDate = new Date(item.expiryDate)
        const daysUntilExpiry = Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        
        if (daysUntilExpiry <= 3 && daysUntilExpiry >= 0) {
          expiringItems++
          alerts.push({
            id: `expiry-${item.id}`,
            type: 'expiry_warning',
            severity: daysUntilExpiry <= 1 ? 'critical' : 'medium',
            itemId: item.id,
            itemName: item.name,
            itemType: 'raw',
            message: `${item.name} 即將到期 (${daysUntilExpiry} 天)`,
            expiryDate: item.expiryDate,
            createdAt: new Date().toISOString()
          })
        }
      }
    })

    // 檢查半成品警告
    semiProducts.forEach(item => {
      totalValue += item.actualStock * item.actualCost

      if (item.actualStock <= item.minActualStock) {
        lowStockItems++
        alerts.push({
          id: `semi-${item.id}`,
          type: 'production_needed',
          severity: item.actualStock === 0 ? 'critical' : 'high',
          itemId: item.id,
          itemName: item.name,
          itemType: 'semi',
          message: `${item.name} 需要製作 (實際庫存: ${item.actualStock} ${item.unit})`,
          currentStock: item.actualStock,
          requiredStock: item.minActualStock,
          createdAt: new Date().toISOString()
        })
      }
    })

    return {
      totalRawMaterials: rawMaterials.length,
      totalSemiProducts: semiProducts.length,
      totalMenuItems: menuItems.data?.length || 0,
      lowStockItems,
      expiringItems,
      totalValue,
      alerts: alerts.sort((a, b) => {
        const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
        return severityOrder[a.severity] - severityOrder[b.severity]
      })
    }
  } catch (error) {
    console.error('獲取庫存總覽錯誤:', error)
    return {
      totalRawMaterials: 0,
      totalSemiProducts: 0,
      totalMenuItems: 0,
      lowStockItems: 0,
      expiringItems: 0,
      totalValue: 0,
      alerts: []
    }
  }
}

/**
 * 初始化庫存系統
 * 計算所有虛擬庫存
 */
export async function initializeInventorySystem(): Promise<void> {
  try {
    console.log('正在初始化庫存系統...')
    await stockCalculationService.updateAllVirtualStock()
    console.log('庫存系統初始化完成')
  } catch (error) {
    console.error('初始化庫存系統錯誤:', error)
  }
}
