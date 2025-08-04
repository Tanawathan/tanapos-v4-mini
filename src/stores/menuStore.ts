import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { menuService } from '../services/menuService'
import type {
  Category,
  Product,
  ComboProduct,
  ProductFilters,
  ProductSorting,
  CreateCategoryDto,
  UpdateCategoryDto,
  CreateProductDto,
  UpdateProductDto,
  CreateComboDto,
  UpdateComboDto,
  MenuViewMode
} from '../lib/menu-types'

interface MenuStore {
  // === 狀態 ===
  categories: Category[]
  products: Product[]
  combos: ComboProduct[]
  loading: boolean
  error: string | null

  // === 篩選與搜尋 ===
  filters: ProductFilters
  sorting: ProductSorting
  viewMode: MenuViewMode
  searchTerm: string
  selectedCategory: string | null

  // === 分頁 ===
  currentPage: number
  pageSize: number
  totalCount: number
  hasNextPage: boolean

  // === 選擇狀態 ===
  selectedProducts: string[]
  selectedCategories: string[]

  // === 操作方法 - 載入資料 ===
  loadCategories: () => Promise<void>
  loadProducts: (refresh?: boolean) => Promise<void>
  loadCombos: () => Promise<void>
  refreshAll: () => Promise<void>

  // === 操作方法 - 分類管理 ===
  createCategory: (category: CreateCategoryDto) => Promise<boolean>
  updateCategory: (id: string, category: UpdateCategoryDto) => Promise<boolean>
  deleteCategory: (id: string) => Promise<boolean>

  // === 操作方法 - 商品管理 ===
  createProduct: (product: CreateProductDto) => Promise<boolean>
  updateProduct: (id: string, product: UpdateProductDto) => Promise<boolean>
  deleteProduct: (id: string) => Promise<boolean>
  duplicateProduct: (id: string) => Promise<boolean>

  // === 操作方法 - 套餐管理 ===
  createCombo: (combo: CreateComboDto) => Promise<boolean>
  updateCombo: (id: string, combo: UpdateComboDto) => Promise<boolean>
  deleteCombo: (id: string) => Promise<boolean>

  // === 操作方法 - 篩選與搜尋 ===
  setFilters: (filters: Partial<ProductFilters>) => void
  setSorting: (sorting: ProductSorting) => void
  setViewMode: (mode: MenuViewMode) => void
  setSearchTerm: (term: string) => void
  setSelectedCategory: (categoryId: string | null) => void
  clearFilters: () => void

  // === 操作方法 - 分頁 ===
  setPage: (page: number) => void
  setPageSize: (size: number) => void
  nextPage: () => void
  prevPage: () => void

  // === 操作方法 - 選擇 ===
  selectProduct: (id: string) => void
  unselectProduct: (id: string) => void
  selectAllProducts: () => void
  clearProductSelection: () => void
  selectCategory: (id: string) => void
  unselectCategory: (id: string) => void
  clearCategorySelection: () => void

  // === 操作方法 - 批量操作 ===
  batchUpdateProducts: (updates: Partial<UpdateProductDto>) => Promise<boolean>
  batchDeleteProducts: () => Promise<boolean>
  batchChangeCategory: (categoryId: string) => Promise<boolean>

  // === 操作方法 - 錯誤處理 ===
  setError: (error: string | null) => void
  clearError: () => void
}

export const useMenuStore = create<MenuStore>()(
  devtools(
    (set, get) => ({
      // === 初始狀態 ===
      categories: [],
      products: [],
      combos: [],
      loading: false,
      error: null,

      filters: {},
      sorting: { field: 'sort_order', order: 'asc' },
      viewMode: { mode: 'grid' },
      searchTerm: '',
      selectedCategory: null,

      currentPage: 0,
      pageSize: 20,
      totalCount: 0,
      hasNextPage: false,

      selectedProducts: [],
      selectedCategories: [],

      // === 載入資料 ===
      loadCategories: async () => {
        set({ loading: true, error: null })
        try {
          const response = await menuService.getCategories()
          if (response.error) {
            set({ error: response.error, loading: false })
            return
          }
          set({ categories: response.data || [], loading: false })
        } catch (error) {
          set({ error: (error as Error).message, loading: false })
        }
      },

      loadProducts: async (refresh = false) => {
        const state = get()
        if (!refresh && state.loading) return

        set({ loading: true, error: null })
        try {
          const response = await menuService.getProducts(
            state.filters,
            state.sorting,
            refresh ? 0 : state.currentPage,
            state.pageSize
          )

          set({
            products: response.data,
            totalCount: response.count,
            hasNextPage: response.has_next,
            currentPage: refresh ? 0 : state.currentPage,
            loading: false
          })
        } catch (error) {
          set({ error: (error as Error).message, loading: false })
        }
      },

      loadCombos: async () => {
        set({ loading: true, error: null })
        try {
          const response = await menuService.getCombos()
          if (response.error) {
            set({ error: response.error, loading: false })
            return
          }
          set({ combos: response.data || [], loading: false })
        } catch (error) {
          set({ error: (error as Error).message, loading: false })
        }
      },

      refreshAll: async () => {
        const { loadCategories, loadProducts, loadCombos } = get()
        await Promise.all([
          loadCategories(),
          loadProducts(true),
          loadCombos()
        ])
      },

      // === 分類管理 ===
      createCategory: async (category) => {
        set({ loading: true, error: null })
        try {
          const response = await menuService.createCategory(category)
          if (response.error) {
            set({ error: response.error, loading: false })
            return false
          }
          
          const state = get()
          set({ 
            categories: [...state.categories, response.data!],
            loading: false 
          })
          return true
        } catch (error) {
          set({ error: (error as Error).message, loading: false })
          return false
        }
      },

      updateCategory: async (id, category) => {
        set({ loading: true, error: null })
        try {
          const response = await menuService.updateCategory(id, category)
          if (response.error) {
            set({ error: response.error, loading: false })
            return false
          }

          const state = get()
          set({
            categories: state.categories.map(c => 
              c.id === id ? response.data! : c
            ),
            loading: false
          })
          return true
        } catch (error) {
          set({ error: (error as Error).message, loading: false })
          return false
        }
      },

      deleteCategory: async (id) => {
        set({ loading: true, error: null })
        try {
          const response = await menuService.deleteCategory(id)
          if (response.error) {
            set({ error: response.error, loading: false })
            return false
          }

          const state = get()
          set({
            categories: state.categories.filter(c => c.id !== id),
            loading: false
          })
          return true
        } catch (error) {
          set({ error: (error as Error).message, loading: false })
          return false
        }
      },

      // === 商品管理 ===
      createProduct: async (product) => {
        set({ loading: true, error: null })
        try {
          const response = await menuService.createProduct(product)
          if (response.error) {
            set({ error: response.error, loading: false })
            return false
          }

          // 重新載入商品列表
          await get().loadProducts(true)
          return true
        } catch (error) {
          set({ error: (error as Error).message, loading: false })
          return false
        }
      },

      updateProduct: async (id, product) => {
        set({ loading: true, error: null })
        try {
          const response = await menuService.updateProduct(id, product)
          if (response.error) {
            set({ error: response.error, loading: false })
            return false
          }

          const state = get()
          set({
            products: state.products.map(p => 
              p.id === id ? response.data! : p
            ),
            loading: false
          })
          return true
        } catch (error) {
          set({ error: (error as Error).message, loading: false })
          return false
        }
      },

      deleteProduct: async (id) => {
        set({ loading: true, error: null })
        try {
          const response = await menuService.deleteProduct(id)
          if (response.error) {
            set({ error: response.error, loading: false })
            return false
          }

          const state = get()
          set({
            products: state.products.filter(p => p.id !== id),
            selectedProducts: state.selectedProducts.filter(pid => pid !== id),
            loading: false
          })
          return true
        } catch (error) {
          set({ error: (error as Error).message, loading: false })
          return false
        }
      },

      duplicateProduct: async (id) => {
        set({ loading: true, error: null })
        try {
          const originalResponse = await menuService.getProductById(id)
          if (originalResponse.error || !originalResponse.data) {
            set({ error: originalResponse.error || '找不到原始商品', loading: false })
            return false
          }

          const original = originalResponse.data
          const duplicateData: CreateProductDto = {
            restaurant_id: original.restaurant_id,
            category_id: original.category_id,
            name: `${original.name} (複製)`,
            description: original.description,
            price: original.price,
            cost: original.cost,
            image_url: original.image_url,
            preparation_time: original.preparation_time,
            ai_recommended: false
          }

          return await get().createProduct(duplicateData)
        } catch (error) {
          set({ error: (error as Error).message, loading: false })
          return false
        }
      },

      // === 套餐管理 ===
      createCombo: async (combo) => {
        set({ loading: true, error: null })
        try {
          const response = await menuService.createCombo(combo)
          if (response.error) {
            set({ error: response.error, loading: false })
            return false
          }

          const state = get()
          set({
            combos: [...state.combos, response.data!],
            loading: false
          })
          return true
        } catch (error) {
          set({ error: (error as Error).message, loading: false })
          return false
        }
      },

      updateCombo: async (id, combo) => {
        set({ loading: true, error: null })
        try {
          const response = await menuService.updateCombo(id, combo)
          if (response.error) {
            set({ error: response.error, loading: false })
            return false
          }

          const state = get()
          set({
            combos: state.combos.map(c => 
              c.id === id ? response.data! : c
            ),
            loading: false
          })
          return true
        } catch (error) {
          set({ error: (error as Error).message, loading: false })
          return false
        }
      },

      deleteCombo: async (id) => {
        set({ loading: true, error: null })
        try {
          const response = await menuService.deleteCombo(id)
          if (response.error) {
            set({ error: response.error, loading: false })
            return false
          }

          const state = get()
          set({
            combos: state.combos.filter(c => c.id !== id),
            loading: false
          })
          return true
        } catch (error) {
          set({ error: (error as Error).message, loading: false })
          return false
        }
      },

      // === 篩選與搜尋 ===
      setFilters: (filters) => {
        set(state => ({
          filters: { ...state.filters, ...filters },
          currentPage: 0
        }))
        get().loadProducts(true)
      },

      setSorting: (sorting) => {
        set({ sorting, currentPage: 0 })
        get().loadProducts(true)
      },

      setViewMode: (viewMode) => {
        set({ viewMode })
      },

      setSearchTerm: (searchTerm) => {
        set(state => ({
          searchTerm,
          filters: { ...state.filters, search_term: searchTerm },
          currentPage: 0
        }))
        get().loadProducts(true)
      },

      setSelectedCategory: (selectedCategory) => {
        set(state => ({
          selectedCategory,
          filters: { ...state.filters, category_id: selectedCategory },
          currentPage: 0
        }))
        get().loadProducts(true)
      },

      clearFilters: () => {
        set({
          filters: {},
          searchTerm: '',
          selectedCategory: null,
          currentPage: 0
        })
        get().loadProducts(true)
      },

      // === 分頁 ===
      setPage: (page) => {
        set({ currentPage: page })
        get().loadProducts()
      },

      setPageSize: (pageSize) => {
        set({ pageSize, currentPage: 0 })
        get().loadProducts(true)
      },

      nextPage: () => {
        const state = get()
        if (state.hasNextPage) {
          get().setPage(state.currentPage + 1)
        }
      },

      prevPage: () => {
        const state = get()
        if (state.currentPage > 0) {
          get().setPage(state.currentPage - 1)
        }
      },

      // === 選擇 ===
      selectProduct: (id) => {
        set(state => ({
          selectedProducts: [...state.selectedProducts, id]
        }))
      },

      unselectProduct: (id) => {
        set(state => ({
          selectedProducts: state.selectedProducts.filter(pid => pid !== id)
        }))
      },

      selectAllProducts: () => {
        const state = get()
        set({
          selectedProducts: state.products.map(p => p.id)
        })
      },

      clearProductSelection: () => {
        set({ selectedProducts: [] })
      },

      selectCategory: (id) => {
        set(state => ({
          selectedCategories: [...state.selectedCategories, id]
        }))
      },

      unselectCategory: (id) => {
        set(state => ({
          selectedCategories: state.selectedCategories.filter(cid => cid !== id)
        }))
      },

      clearCategorySelection: () => {
        set({ selectedCategories: [] })
      },

      // === 批量操作 ===
      batchUpdateProducts: async (updates) => {
        const state = get()
        if (state.selectedProducts.length === 0) return false

        set({ loading: true, error: null })
        try {
          const response = await menuService.batchUpdateProducts(
            state.selectedProducts,
            updates
          )
          if (response.error) {
            set({ error: response.error, loading: false })
            return false
          }

          // 重新載入商品列表
          await get().loadProducts(true)
          set({ selectedProducts: [] })
          return true
        } catch (error) {
          set({ error: (error as Error).message, loading: false })
          return false
        }
      },

      batchDeleteProducts: async () => {
        const state = get()
        if (state.selectedProducts.length === 0) return false

        set({ loading: true, error: null })
        try {
          const response = await menuService.batchDeleteProducts(state.selectedProducts)
          if (response.error) {
            set({ error: response.error, loading: false })
            return false
          }

          set(prevState => ({
            products: prevState.products.filter(p => 
              !prevState.selectedProducts.includes(p.id)
            ),
            selectedProducts: [],
            loading: false
          }))
          return true
        } catch (error) {
          set({ error: (error as Error).message, loading: false })
          return false
        }
      },

      batchChangeCategory: async (categoryId) => {
        return await get().batchUpdateProducts({ category_id: categoryId })
      },

      // === 錯誤處理 ===
      setError: (error) => {
        set({ error })
      },

      clearError: () => {
        set({ error: null })
      }
    }),
    {
      name: 'menu-store',
      partialize: (state: MenuStore) => ({
        filters: state.filters,
        sorting: state.sorting,
        viewMode: state.viewMode,
        selectedCategory: state.selectedCategory,
        pageSize: state.pageSize
      })
    }
  )
)
