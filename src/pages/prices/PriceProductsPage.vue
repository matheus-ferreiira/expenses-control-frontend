<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { AppPageContainer, ConfirmDialog, EmptyState } from '@/components/shared'
import { Skeleton } from '@ui/skeleton'
import {
  Check, ChevronDown, GitCompareArrows, Package, Pencil, Plus, Search, Store as StoreIcon, Tag, Trash2, X,
} from 'lucide-vue-next'
import PriceGoalBadge from '@/features/prices/components/PriceGoalBadge.vue'
import ProductFormSheet from '@/features/prices/components/ProductFormSheet.vue'
import CategoryListSheet from '@/features/prices/components/CategoryListSheet.vue'
import StoreListSheet from '@/features/prices/components/StoreListSheet.vue'
import ProductCompareSheet from '@/features/prices/components/ProductCompareSheet.vue'
import { usePricesStore } from '@/stores/prices'
import { useToast } from '@/composables/useToast'
import { useDebounce } from '@/composables/useDebounce'
import { formatCurrency } from '@/utils/currency'
import { ROUTES } from '@/constants/routes'
import type {
  PriceProduct,
  PriceProductFilters,
  PriceProductStatus,
} from '@/features/prices/types'
import { PRICE_PRODUCT_STATUS_LABELS } from '@/features/prices/types'

const router = useRouter()
const store = usePricesStore()
const toast = useToast()

// ── Filters ─────────────────────────────────────────────────────────────────
type StatusFilter = PriceProductStatus | 'all'
const STATUS_FILTERS: StatusFilter[] = ['all', 'tracking', 'purchased', 'discarded']

const statusFilter = ref<StatusFilter>('all')
const categoryFilter = ref('')
const search = ref('')
const debouncedSearch = useDebounce(search, 300)

function toApiFilters(): PriceProductFilters {
  const filters: PriceProductFilters = {}
  if (statusFilter.value !== 'all') filters.status = statusFilter.value
  if (categoryFilter.value) filters.category_id = categoryFilter.value
  if (debouncedSearch.value.trim()) filters.search = debouncedSearch.value.trim()
  return filters
}

const hasActiveFilters = computed(
  () => statusFilter.value !== 'all' || !!categoryFilter.value || !!search.value.trim(),
)

watch([statusFilter, categoryFilter, debouncedSearch], () => {
  store.fetchProducts(toApiFilters()).catch(() => {})
})

// ── Sheets state ────────────────────────────────────────────────────────────
const formOpen = ref(false)
const editingProduct = ref<PriceProduct | null>(null)
const categoriesOpen = ref(false)
const storesOpen = ref(false)

const deleteOpen = ref(false)
const deleteTarget = ref<PriceProduct | null>(null)
const deleting = ref(false)

// ── Compare mode ────────────────────────────────────────────────────────────
const compareMode = ref(false)
const selectedIds = ref<Set<string>>(new Set())
const compareOpen = ref(false)

function toggleCompareMode() {
  compareMode.value = !compareMode.value
  selectedIds.value = new Set()
}

function toggleSelection(id: string) {
  const next = new Set(selectedIds.value)
  if (next.has(id)) {
    next.delete(id)
  } else {
    if (next.size >= 4) {
      toast.warning('Compare no máximo 4 produtos')
      return
    }
    next.add(id)
  }
  selectedIds.value = next
}

const canCompare = computed(() => selectedIds.value.size >= 2 && selectedIds.value.size <= 4)

function onCardClick(product: PriceProduct) {
  if (compareMode.value) {
    toggleSelection(product.id)
    return
  }
  router.push({ name: ROUTES.PRICES_PRODUCT_DETAIL, params: { id: product.id } })
}

// ── CRUD helpers ────────────────────────────────────────────────────────────
function openCreate() {
  editingProduct.value = null
  formOpen.value = true
}

function openEdit(product: PriceProduct) {
  editingProduct.value = product
  formOpen.value = true
}

function requestDelete(product: PriceProduct) {
  deleteTarget.value = product
  deleteOpen.value = true
}

async function confirmDelete() {
  if (!deleteTarget.value) return
  deleting.value = true
  try {
    await store.deleteProduct(deleteTarget.value.id)
    toast.success('Produto excluído')
    deleteOpen.value = false
    deleteTarget.value = null
  } catch {
    toast.error('Erro ao excluir produto')
  } finally {
    deleting.value = false
  }
}

onMounted(() => {
  store.fetchProducts(toApiFilters()).catch(() => {})
  if (!store.categories.length) store.fetchCategories()
  if (!store.stores.length) store.fetchStores()
})

function statusLabel(filter: StatusFilter): string {
  return filter === 'all' ? 'Todos' : PRICE_PRODUCT_STATUS_LABELS[filter]
}
</script>

<template>
  <AppPageContainer>
    <!-- Header -->
    <div class="flex items-start justify-between mb-4">
      <div>
        <p class="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">
          Preços
        </p>
        <h1 class="text-[22px] lg:text-[18px] font-semibold tracking-tight text-foreground leading-none mb-1.5">
          Produtos
        </h1>
        <p class="text-[12px] text-muted-foreground">
          {{ store.products.length }} produto{{ store.products.length !== 1 ? 's' : '' }}
        </p>
      </div>
      <button
        type="button"
        class="inline-flex items-center gap-1.5 h-9 px-3 rounded-md text-[13px] font-medium bg-primary text-primary-foreground hover:brightness-110 transition-colors mt-1"
        @click="openCreate"
      >
        <Plus :size="14" />
        Novo produto
      </button>
    </div>

    <!-- Secondary actions -->
    <div class="flex flex-wrap items-center gap-2 mb-4">
      <button
        type="button"
        class="inline-flex items-center gap-1.5 h-9 px-3 rounded-md text-[12px] font-medium bg-muted text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        @click="categoriesOpen = true"
      >
        <Tag :size="13" />
        Categorias
      </button>
      <button
        type="button"
        class="inline-flex items-center gap-1.5 h-9 px-3 rounded-md text-[12px] font-medium bg-muted text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        @click="storesOpen = true"
      >
        <StoreIcon :size="13" />
        Lojas
      </button>
      <button
        type="button"
        class="inline-flex items-center gap-1.5 h-9 px-3 rounded-md text-[12px] font-medium transition-colors"
        :class="compareMode
          ? 'bg-primary text-primary-foreground'
          : 'bg-muted text-muted-foreground hover:bg-muted hover:text-foreground'"
        @click="toggleCompareMode"
      >
        <GitCompareArrows :size="13" />
        {{ compareMode ? 'Cancelar comparação' : 'Comparar' }}
      </button>
    </div>

    <!-- Filters -->
    <div class="space-y-3 mb-4">
      <!-- Status pills -->
      <div class="flex flex-wrap items-center gap-1.5">
        <button
          v-for="f in STATUS_FILTERS"
          :key="f"
          type="button"
          class="h-8 px-3 rounded-full text-[12px] font-medium transition-colors"
          :class="statusFilter === f
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-muted-foreground hover:bg-muted'"
          @click="statusFilter = f"
        >
          {{ statusLabel(f) }}
        </button>
      </div>

      <!-- Search + category -->
      <div class="flex flex-wrap items-center gap-2">
        <div class="relative flex-1 min-w-[180px]">
          <Search :size="14" class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            v-model="search"
            type="text"
            placeholder="Buscar produto..."
            class="w-full h-9 rounded-md bg-card pl-9 pr-3 text-[13px] text-foreground outline-none transition-colors focus:border-primary placeholder:text-muted-foreground"
          />
        </div>
        <div class="relative">
          <select
            v-model="categoryFilter"
            class="h-9 rounded-md bg-card pl-3 pr-8 text-[12px] text-foreground focus:outline-none focus:border-primary appearance-none cursor-pointer transition-colors"
            :class="!categoryFilter ? 'text-muted-foreground' : ''"
          >
            <option value="">Todas as categorias</option>
            <option v-for="c in store.categories" :key="c.id" :value="c.id">{{ c.name }}</option>
          </select>
          <ChevronDown :size="12" class="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="store.loadingProducts" class="grid grid-cols-1 gap-3">
      <Skeleton v-for="i in 4" :key="i" class="h-24 w-full rounded-lg" />
    </div>

    <!-- Empty -->
    <EmptyState
      v-else-if="store.products.length === 0 && !hasActiveFilters"
      :icon="Package"
      title="Nenhum produto cadastrado"
      description="Cadastre os produtos que você quer acompanhar e defina metas de preço."
      cta-label="Novo produto"
      @cta="openCreate"
    />

    <p
      v-else-if="store.products.length === 0"
      class="text-[13px] text-muted-foreground py-12 text-center"
    >
      Nenhum produto encontrado com os filtros atuais.
    </p>

    <!-- Products grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-3" :class="canCompare || compareMode ? 'pb-20' : ''">
      <div
        v-for="product in store.products"
        :key="product.id"
        role="button"
        tabindex="0"
        class="rounded-lg p-4 text-left transition-colors cursor-pointer"
        :class="compareMode && selectedIds.has(product.id)
          ? 'bg-muted'
          : 'bg-card hover:bg-muted'"
        @click="onCardClick(product)"
        @keydown.enter="onCardClick(product)"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 min-w-0">
              <span
                v-if="compareMode"
                class="size-4 rounded grid place-items-center shrink-0 transition-colors"
                :class="selectedIds.has(product.id) ? 'bg-primary text-primary-foreground' : 'bg-muted'"
              >
                <Check v-if="selectedIds.has(product.id)" :size="11" />
              </span>
              <p class="text-[15px] font-semibold text-foreground truncate">{{ product.name }}</p>
            </div>
            <p class="text-[12px] text-muted-foreground truncate mt-0.5">
              <template v-if="product.brand || product.model">
                {{ [product.brand, product.model].filter(Boolean).join(' · ') }}
              </template>
              <template v-else>{{ product.category?.name ?? 'Sem categoria' }}</template>
            </p>
          </div>
          <div class="flex items-center gap-1 shrink-0">
            <span
              class="text-[11px] font-medium px-2 py-0.5 rounded-full"
              :class="product.status === 'tracking'
                ? 'bg-muted text-primary'
                : product.status === 'purchased'
                  ? 'bg-muted text-muted-foreground'
                  : 'bg-muted text-muted-foreground'"
            >
              {{ PRICE_PRODUCT_STATUS_LABELS[product.status] }}
            </span>
          </div>
        </div>

        <div class="flex items-end justify-between mt-3">
          <div>
            <p class="text-[10px] text-muted-foreground uppercase tracking-widest">Último preço</p>
            <p class="text-[17px] font-semibold tabular-nums mt-0.5 text-foreground">
              {{ product.stats?.last_price != null ? formatCurrency(product.stats.last_price) : '—' }}
            </p>
            <p class="text-[11px] text-muted-foreground tabular-nums mt-0.5">
              Mín {{ product.stats?.min_price != null ? formatCurrency(product.stats.min_price) : '—' }}
              · Méd {{ product.stats?.avg_price != null ? formatCurrency(product.stats.avg_price) : '—' }}
            </p>
          </div>
          <div class="text-right">
            <PriceGoalBadge
              :status="product.stats?.goal_status ?? null"
              :has-target="product.target_price !== null"
            />
            <p v-if="product.target_price !== null" class="text-[11px] text-muted-foreground tabular-nums mt-1">
              Meta <span class="font-semibold">{{ formatCurrency(product.target_price) }}</span>
            </p>
          </div>
        </div>

        <!-- Row actions -->
        <div v-if="!compareMode" class="flex items-center justify-end gap-1 mt-2 pt-2 border-t border-border">
          <button
            type="button"
            aria-label="Editar produto"
            class="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            @click.stop="openEdit(product)"
          >
            <Pencil :size="13" />
          </button>
          <button
            type="button"
            aria-label="Excluir produto"
            class="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-muted transition-colors"
            @click.stop="requestDelete(product)"
          >
            <Trash2 :size="13" />
          </button>
        </div>
      </div>
    </div>

    <!-- Compare action bar -->
    <div
      v-if="compareMode"
      class="fixed bottom-0 left-0 right-0 z-30 bg-background border-t border-border px-4 py-3 flex items-center justify-between gap-3"
    >
      <p class="text-[12px] text-muted-foreground tabular-nums">
        {{ selectedIds.size }} de 4 selecionados
      </p>
      <div class="flex items-center gap-2">
        <button
          type="button"
          class="inline-flex items-center gap-1 h-10 px-3 rounded-lg text-[13px] text-muted-foreground hover:bg-muted transition-colors"
          @click="toggleCompareMode"
        >
          <X :size="14" />
          Cancelar
        </button>
        <button
          type="button"
          class="inline-flex items-center gap-1.5 h-10 px-4 rounded-lg text-[13px] font-semibold bg-primary text-primary-foreground transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
          :disabled="!canCompare"
          @click="compareOpen = true"
        >
          <GitCompareArrows :size="14" />
          Comparar ({{ selectedIds.size }})
        </button>
      </div>
    </div>
  </AppPageContainer>

  <ProductFormSheet v-model:open="formOpen" :product="editingProduct" />
  <CategoryListSheet v-model:open="categoriesOpen" />
  <StoreListSheet v-model:open="storesOpen" />
  <ProductCompareSheet v-model:open="compareOpen" :product-ids="[...selectedIds]" />

  <ConfirmDialog
    v-model:open="deleteOpen"
    title="Excluir produto"
    :description="`'${deleteTarget?.name}' e todo o histórico de preços dele serão removidos.`"
    confirm-label="Excluir"
    variant="destructive"
    :loading="deleting"
    @confirm="confirmDelete"
  />
</template>
