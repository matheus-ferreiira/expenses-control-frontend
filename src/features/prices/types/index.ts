// ── Enums + labels ──────────────────────────────────────────────────────────

export type PriceProductStatus = 'tracking' | 'purchased' | 'discarded'

export const PRICE_PRODUCT_STATUS_LABELS: Record<PriceProductStatus, string> = {
  tracking: 'Acompanhando',
  purchased: 'Comprado',
  discarded: 'Descartado',
}

export type PriceGoalStatus = 'excellent' | 'near' | 'above'

export const PRICE_GOAL_STATUS_LABELS: Record<PriceGoalStatus, string> = {
  excellent: 'Excelente oportunidade',
  near: 'Próximo da meta',
  above: 'Acima da meta',
}

/** Text color classes per goal status (tokens only — never hex). */
export const PRICE_GOAL_STATUS_COLORS: Record<PriceGoalStatus, string> = {
  excellent: 'text-success',
  near: 'text-warning',
  above: 'text-destructive',
}

/** Dot background classes per goal status. */
export const PRICE_GOAL_STATUS_DOT_COLORS: Record<PriceGoalStatus, string> = {
  excellent: 'bg-success',
  near: 'bg-warning',
  above: 'bg-destructive',
}

// ── Entities ────────────────────────────────────────────────────────────────

export interface PriceCategory {
  id: string
  name: string
  icon: string | null
  created_at: string
}

export interface PriceStore {
  id: string
  name: string
  website_url: string | null
  notes: string | null
  created_at: string
}

export interface PriceProductStats {
  last_price: number | null
  last_recorded_at: string | null
  min_price: number | null
  avg_price: number | null
  max_price: number | null
  records_count: number
  goal_status: PriceGoalStatus | null
}

export interface PriceProduct {
  id: string
  category_id: string | null
  name: string
  brand: string | null
  model: string | null
  specs: string | null
  notes: string | null
  target_price: number | null
  launch_price: number | null
  status: PriceProductStatus
  category?: PriceCategory
  stats?: PriceProductStats
  created_at: string
}

export interface PriceRecord {
  id: string
  product_id: string
  store_id: string
  price: number
  /** YYYY-MM-DD */
  recorded_at: string
  url: string | null
  notes: string | null
  goal_status: PriceGoalStatus | null
  product?: { id: string; name: string; target_price: number | null }
  store?: { id: string; name: string }
  created_at: string
}

export interface PriceSale {
  id: string
  purchase_id: string
  sale_price: number
  /** YYYY-MM-DD */
  sold_at: string
  notes: string | null
  created_at: string
}

export interface PricePurchase {
  id: string
  product_id: string
  store_id: string | null
  price_paid: number
  /** YYYY-MM-DD */
  purchased_at: string
  warranty_months: number | null
  current_value: number | null
  notes: string | null
  is_sold: boolean
  sale?: PriceSale
  product?: { id: string; name: string }
  store?: { id: string; name: string }
  created_at: string
}

// ── Payloads ────────────────────────────────────────────────────────────────

export interface PriceCategoryPayload {
  name: string
  icon?: string | null
}

export interface PriceStorePayload {
  name: string
  website_url?: string | null
  notes?: string | null
}

export interface PriceProductPayload {
  category_id?: string | null
  name: string
  brand?: string | null
  model?: string | null
  specs?: string | null
  notes?: string | null
  target_price?: number | null
  launch_price?: number | null
  status?: PriceProductStatus
}

export interface PriceRecordPayload {
  product_id: string
  store_id: string
  price: number
  /** YYYY-MM-DD */
  recorded_at: string
  url?: string | null
  notes?: string | null
}

export interface PricePurchasePayload {
  product_id: string
  store_id?: string | null
  price_paid: number
  /** YYYY-MM-DD */
  purchased_at: string
  warranty_months?: number | null
  current_value?: number | null
  notes?: string | null
}

export interface PriceSalePayload {
  purchase_id: string
  sale_price: number
  /** YYYY-MM-DD */
  sold_at: string
  notes?: string | null
}

// ── Filters ─────────────────────────────────────────────────────────────────

export interface PriceProductFilters {
  status?: PriceProductStatus
  category_id?: string
  search?: string
}

export interface PriceRecordFilters {
  product_id?: string
  store_id?: string
  date_from?: string
  date_to?: string
  per_page?: number
  page?: number
}

// ── Aggregations (reports) ──────────────────────────────────────────────────

export interface PriceDashboardCounts {
  products_total: number
  products_tracking: number
  products_purchased: number
  products_discarded: number
  records_total: number
  stores_total: number
}

export interface PricePatrimonySnapshot {
  invested: number
  recovered: number
  net_cost: number
}

export interface PriceTrackedProduct {
  id: string
  name: string
  target_price: number | null
  launch_price: number | null
  last_price: number | null
  last_recorded_at: string | null
  min_price: number | null
  avg_price: number | null
  max_price: number | null
  records_count: number
  goal_status: PriceGoalStatus | null
  savings_vs_launch: number | null
}

export interface PriceDashboard {
  counts: PriceDashboardCounts
  patrimony_snapshot: PricePatrimonySnapshot
  tracked_products: PriceTrackedProduct[]
  recent_records: PriceRecord[]
}

export interface PricePoint {
  /** YYYY-MM-DD */
  date: string
  price: number
}

export interface PriceHistoryParams {
  date_from?: string
  date_to?: string
  store_id?: string
}

export interface PriceHistory {
  product: {
    id: string
    name: string
    target_price: number | null
    launch_price: number | null
  }
  stats: {
    min: number | null
    avg: number | null
    max: number | null
    last: number | null
    records_count: number
    savings_vs_launch: number | null
  }
  series: Array<{
    store: { id: string; name: string }
    points: PricePoint[]
  }>
}

export interface PriceCompareProduct {
  id: string
  name: string
  target_price: number | null
  stats: {
    min: number | null
    avg: number | null
    max: number | null
    last: number | null
    records_count: number
    goal_status: PriceGoalStatus | null
  }
  series: PricePoint[]
}

export interface PriceCompareResult {
  products: PriceCompareProduct[]
}

export interface PricePatrimonyItem {
  purchase_id: string
  product_id: string
  product_name: string
  price_paid: number
  purchased_at: string
  warranty_months: number | null
  current_value: number | null
  is_sold: boolean
  sale_price: number | null
  sold_at: string | null
}

export interface PricePatrimony {
  totals: {
    invested: number
    recovered: number
    current_worth: number
    depreciation: number
    net_cost: number
  }
  by_year: Array<{
    year: number
    invested: number
    items: PricePatrimonyItem[]
  }>
}
