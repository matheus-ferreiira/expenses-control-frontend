import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { pricesApi } from '@/services/api/prices'
import type {
  PriceCategory,
  PriceCategoryPayload,
  PriceProduct,
  PriceProductFilters,
  PriceProductPayload,
  PriceStore,
  PriceStorePayload,
} from '@/features/prices/types'

export const usePricesStore = defineStore('prices', () => {
  const categories = ref<PriceCategory[]>([])
  const stores = ref<PriceStore[]>([])
  const products = ref<PriceProduct[]>([])

  const loadingCategories = ref(false)
  const loadingStores = ref(false)
  const loadingProducts = ref(false)
  const error = ref<string | null>(null)

  const loading = computed(
    () => loadingCategories.value || loadingStores.value || loadingProducts.value,
  )

  const trackingProducts = computed(() =>
    products.value.filter((p) => p.status === 'tracking'),
  )

  // ── Fetch ────────────────────────────────────────────────────────────────

  async function fetchCategories() {
    loadingCategories.value = true
    try {
      categories.value = await pricesApi.categories.list()
    } catch {
      error.value = 'Erro ao carregar categorias'
    } finally {
      loadingCategories.value = false
    }
  }

  async function fetchStores() {
    loadingStores.value = true
    try {
      stores.value = await pricesApi.stores.list()
    } catch {
      error.value = 'Erro ao carregar lojas'
    } finally {
      loadingStores.value = false
    }
  }

  let _fetchProductsVersion = 0

  async function fetchProducts(filters?: PriceProductFilters) {
    const version = ++_fetchProductsVersion
    loadingProducts.value = true
    error.value = null
    try {
      const result = await pricesApi.products.list(filters)
      if (version !== _fetchProductsVersion) return // superseded by a later call
      products.value = result
    } catch (e: unknown) {
      if (version === _fetchProductsVersion) {
        error.value = 'Erro ao carregar produtos'
        throw e
      }
    } finally {
      if (version === _fetchProductsVersion) {
        loadingProducts.value = false
      }
    }
  }

  async function fetchAll() {
    await Promise.all([fetchCategories(), fetchStores(), fetchProducts()])
  }

  /** Fetches catalog data (categories + stores + products) only when missing. */
  async function ensureCatalog() {
    const jobs: Promise<void>[] = []
    if (!categories.value.length) jobs.push(fetchCategories())
    if (!stores.value.length) jobs.push(fetchStores())
    if (!products.value.length) jobs.push(fetchProducts())
    await Promise.all(jobs)
  }

  // ── Categories CRUD ──────────────────────────────────────────────────────

  async function createCategory(payload: PriceCategoryPayload): Promise<PriceCategory> {
    try {
      const created = await pricesApi.categories.create(payload)
      categories.value.push(created)
      return created
    } catch (e: unknown) {
      error.value = 'Erro ao criar categoria'
      throw e
    }
  }

  async function updateCategory(
    id: string,
    payload: Partial<PriceCategoryPayload>,
  ): Promise<PriceCategory> {
    try {
      const updated = await pricesApi.categories.update(id, payload)
      const idx = categories.value.findIndex((c) => c.id === id)
      if (idx !== -1) categories.value[idx] = updated
      return updated
    } catch (e: unknown) {
      error.value = 'Erro ao atualizar categoria'
      throw e
    }
  }

  async function deleteCategory(id: string): Promise<void> {
    try {
      await pricesApi.categories.delete(id)
      categories.value = categories.value.filter((c) => c.id !== id)
    } catch (e: unknown) {
      error.value = 'Erro ao excluir categoria'
      throw e
    }
  }

  // ── Stores CRUD ──────────────────────────────────────────────────────────

  async function createStore(payload: PriceStorePayload): Promise<PriceStore> {
    try {
      const created = await pricesApi.stores.create(payload)
      stores.value.push(created)
      return created
    } catch (e: unknown) {
      error.value = 'Erro ao criar loja'
      throw e
    }
  }

  async function updateStore(
    id: string,
    payload: Partial<PriceStorePayload>,
  ): Promise<PriceStore> {
    try {
      const updated = await pricesApi.stores.update(id, payload)
      const idx = stores.value.findIndex((s) => s.id === id)
      if (idx !== -1) stores.value[idx] = updated
      return updated
    } catch (e: unknown) {
      error.value = 'Erro ao atualizar loja'
      throw e
    }
  }

  async function deleteStore(id: string): Promise<void> {
    try {
      await pricesApi.stores.delete(id)
      stores.value = stores.value.filter((s) => s.id !== id)
    } catch (e: unknown) {
      error.value = 'Erro ao excluir loja'
      throw e
    }
  }

  // ── Products CRUD ────────────────────────────────────────────────────────

  async function createProduct(payload: PriceProductPayload): Promise<PriceProduct> {
    try {
      const created = await pricesApi.products.create(payload)
      products.value.unshift(created)
      return created
    } catch (e: unknown) {
      error.value = 'Erro ao criar produto'
      throw e
    }
  }

  async function updateProduct(
    id: string,
    payload: Partial<PriceProductPayload>,
  ): Promise<PriceProduct> {
    try {
      const updated = await pricesApi.products.update(id, payload)
      const idx = products.value.findIndex((p) => p.id === id)
      if (idx !== -1) {
        // Preserve locally-known stats when the update response omits them
        const previous = products.value[idx]
        products.value[idx] = { ...updated, stats: updated.stats ?? previous?.stats }
      }
      return updated
    } catch (e: unknown) {
      error.value = 'Erro ao atualizar produto'
      throw e
    }
  }

  async function deleteProduct(id: string): Promise<void> {
    try {
      await pricesApi.products.delete(id)
      products.value = products.value.filter((p) => p.id !== id)
    } catch (e: unknown) {
      error.value = 'Erro ao excluir produto'
      throw e
    }
  }

  function resetState(): void {
    categories.value = []
    stores.value = []
    products.value = []
    loadingCategories.value = false
    loadingStores.value = false
    loadingProducts.value = false
    error.value = null
    _fetchProductsVersion = 0
  }

  return {
    categories,
    stores,
    products,
    loadingCategories,
    loadingStores,
    loadingProducts,
    loading,
    error,
    trackingProducts,
    fetchCategories,
    fetchStores,
    fetchProducts,
    fetchAll,
    ensureCatalog,
    createCategory,
    updateCategory,
    deleteCategory,
    createStore,
    updateStore,
    deleteStore,
    createProduct,
    updateProduct,
    deleteProduct,
    resetState,
  }
})
