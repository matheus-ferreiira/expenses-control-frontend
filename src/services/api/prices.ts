import { client, unwrap, unwrapPaginated } from './client'
import { API_ENDPOINTS } from '@/constants/api'
import type { ApiResponse, PaginatedResponse } from '@/types/api'
import type {
  PriceCategory,
  PriceCategoryPayload,
  PriceCompareResult,
  PriceDashboard,
  PricePatrimony,
  PriceHistory,
  PriceHistoryParams,
  PriceRecord,
  PriceRecordFilters,
  PriceRecordPayload,
  PriceProduct,
  PriceProductFilters,
  PriceProductPayload,
  PricePurchase,
  PricePurchasePayload,
  PriceSale,
  PriceSalePayload,
  PriceStore,
  PriceStorePayload,
} from '@/features/prices/types'

export const pricesApi = {
  categories: {
    list: () =>
      client
        .get<ApiResponse<PriceCategory[]>>(API_ENDPOINTS.PRICES.CATEGORIES)
        .then(unwrap),

    create: (payload: PriceCategoryPayload) =>
      client
        .post<ApiResponse<PriceCategory>>(API_ENDPOINTS.PRICES.CATEGORIES, payload)
        .then(unwrap),

    update: (id: string, payload: Partial<PriceCategoryPayload>) =>
      client
        .put<ApiResponse<PriceCategory>>(API_ENDPOINTS.PRICES.CATEGORY_DETAIL(id), payload)
        .then(unwrap),

    delete: (id: string) =>
      client
        .delete<ApiResponse<null>>(API_ENDPOINTS.PRICES.CATEGORY_DETAIL(id))
        .then(unwrap),
  },

  stores: {
    list: () =>
      client.get<ApiResponse<PriceStore[]>>(API_ENDPOINTS.PRICES.STORES).then(unwrap),

    create: (payload: PriceStorePayload) =>
      client
        .post<ApiResponse<PriceStore>>(API_ENDPOINTS.PRICES.STORES, payload)
        .then(unwrap),

    update: (id: string, payload: Partial<PriceStorePayload>) =>
      client
        .put<ApiResponse<PriceStore>>(API_ENDPOINTS.PRICES.STORE_DETAIL(id), payload)
        .then(unwrap),

    delete: (id: string) =>
      client
        .delete<ApiResponse<null>>(API_ENDPOINTS.PRICES.STORE_DETAIL(id))
        .then(unwrap),
  },

  products: {
    list: (filters?: PriceProductFilters) =>
      client
        .get<ApiResponse<PriceProduct[]>>(API_ENDPOINTS.PRICES.PRODUCTS, {
          params: filters,
        })
        .then(unwrap),

    get: (id: string) =>
      client
        .get<ApiResponse<PriceProduct>>(API_ENDPOINTS.PRICES.PRODUCT_DETAIL(id))
        .then(unwrap),

    create: (payload: PriceProductPayload) =>
      client
        .post<ApiResponse<PriceProduct>>(API_ENDPOINTS.PRICES.PRODUCTS, payload)
        .then(unwrap),

    update: (id: string, payload: Partial<PriceProductPayload>) =>
      client
        .put<ApiResponse<PriceProduct>>(API_ENDPOINTS.PRICES.PRODUCT_DETAIL(id), payload)
        .then(unwrap),

    delete: (id: string) =>
      client
        .delete<ApiResponse<null>>(API_ENDPOINTS.PRICES.PRODUCT_DETAIL(id))
        .then(unwrap),
  },

  priceRecords: {
    list: (filters?: PriceRecordFilters) =>
      client
        .get<PaginatedResponse<PriceRecord>>(API_ENDPOINTS.PRICES.PRICE_RECORDS, {
          params: filters,
        })
        .then(unwrapPaginated),

    create: (payload: PriceRecordPayload) =>
      client
        .post<ApiResponse<PriceRecord>>(API_ENDPOINTS.PRICES.PRICE_RECORDS, payload)
        .then(unwrap),

    update: (id: string, payload: Partial<PriceRecordPayload>) =>
      client
        .put<ApiResponse<PriceRecord>>(
          API_ENDPOINTS.PRICES.PRICE_RECORD_DETAIL(id),
          payload,
        )
        .then(unwrap),

    delete: (id: string) =>
      client
        .delete<ApiResponse<null>>(API_ENDPOINTS.PRICES.PRICE_RECORD_DETAIL(id))
        .then(unwrap),
  },

  purchases: {
    list: () =>
      client
        .get<ApiResponse<PricePurchase[]>>(API_ENDPOINTS.PRICES.PURCHASES)
        .then(unwrap),

    create: (payload: PricePurchasePayload) =>
      client
        .post<ApiResponse<PricePurchase>>(API_ENDPOINTS.PRICES.PURCHASES, payload)
        .then(unwrap),

    update: (id: string, payload: Partial<PricePurchasePayload>) =>
      client
        .put<ApiResponse<PricePurchase>>(API_ENDPOINTS.PRICES.PURCHASE_DETAIL(id), payload)
        .then(unwrap),

    delete: (id: string) =>
      client
        .delete<ApiResponse<null>>(API_ENDPOINTS.PRICES.PURCHASE_DETAIL(id))
        .then(unwrap),
  },

  sales: {
    create: (payload: PriceSalePayload) =>
      client
        .post<ApiResponse<PriceSale>>(API_ENDPOINTS.PRICES.SALES, payload)
        .then(unwrap),

    update: (id: string, payload: Partial<Omit<PriceSalePayload, 'purchase_id'>>) =>
      client
        .put<ApiResponse<PriceSale>>(API_ENDPOINTS.PRICES.SALE_DETAIL(id), payload)
        .then(unwrap),

    delete: (id: string) =>
      client
        .delete<ApiResponse<null>>(API_ENDPOINTS.PRICES.SALE_DETAIL(id))
        .then(unwrap),
  },

  reports: {
    dashboard: () =>
      client
        .get<ApiResponse<PriceDashboard>>(API_ENDPOINTS.PRICES.DASHBOARD)
        .then(unwrap),

    priceHistory: (productId: string, params?: PriceHistoryParams) =>
      client
        .get<ApiResponse<PriceHistory>>(
          API_ENDPOINTS.PRICES.PRICE_HISTORY(productId),
          { params },
        )
        .then(unwrap),

    /** 2 to 4 product ids — serialized as product_ids[]=a&product_ids[]=b. */
    compare: (productIds: string[]) =>
      client
        .get<ApiResponse<PriceCompareResult>>(API_ENDPOINTS.PRICES.COMPARE, {
          params: { product_ids: productIds },
        })
        .then(unwrap),

    patrimony: () =>
      client
        .get<ApiResponse<PricePatrimony>>(API_ENDPOINTS.PRICES.PATRIMONY)
        .then(unwrap),
  },
}
