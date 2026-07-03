<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { AppPageContainer, ConfirmDialog } from '@/components/shared'
import { Skeleton } from '@ui/skeleton'
import { ArrowLeft, ExternalLink, Pencil, Plus, Trash2 } from 'lucide-vue-next'
import PriceGoalBadge from '@/features/prices/components/PriceGoalBadge.vue'
import PriceHistoryChart from '@/features/prices/components/PriceHistoryChart.vue'
import PriceRecordFormSheet from '@/features/prices/components/PriceRecordFormSheet.vue'
import ProductFormSheet from '@/features/prices/components/ProductFormSheet.vue'
import { pricesApi } from '@/services/api/prices'
import { usePricesStore } from '@/stores/prices'
import { useToast } from '@/composables/useToast'
import { formatCurrency } from '@/utils/currency'
import { daysAgoISO, formatDay } from '@/features/prices/utils/priceHelpers'
import { ROUTES } from '@/constants/routes'
import type {
  PriceHistory,
  PriceRecord,
  PriceProduct,
} from '@/features/prices/types'
import { PRICE_PRODUCT_STATUS_LABELS } from '@/features/prices/types'

const route = useRoute()
const router = useRouter()
const store = usePricesStore()
const toast = useToast()

const productId = computed(() => String(route.params.id))

// ── Period filter for the chart ─────────────────────────────────────────────
type Period = '30d' | '90d' | '1a' | 'tudo'
const PERIODS: Array<{ key: Period; label: string }> = [
  { key: '30d', label: '30d' },
  { key: '90d', label: '90d' },
  { key: '1a', label: '1 ano' },
  { key: 'tudo', label: 'Tudo' },
]
const period = ref<Period>('tudo')

function periodDateFrom(): string | undefined {
  if (period.value === '30d') return daysAgoISO(30)
  if (period.value === '90d') return daysAgoISO(90)
  if (period.value === '1a') return daysAgoISO(365)
  return undefined
}

// ── Data ────────────────────────────────────────────────────────────────────
const product = ref<PriceProduct | null>(null)
const history = ref<PriceHistory | null>(null)
const records = ref<PriceRecord[]>([])
const loading = ref(false)
const historyLoading = ref(false)

async function loadProduct() {
  try {
    product.value = await pricesApi.products.get(productId.value)
  } catch {
    toast.error('Produto não encontrado')
    router.push({ name: ROUTES.PRICES_PRODUCTS })
  }
}

async function loadHistory() {
  historyLoading.value = true
  try {
    history.value = await pricesApi.reports.priceHistory(productId.value, {
      date_from: periodDateFrom(),
    })
  } catch {
    toast.error('Erro ao carregar histórico de preços')
  } finally {
    historyLoading.value = false
  }
}

async function loadRecords() {
  try {
    const result = await pricesApi.priceRecords.list({
      product_id: productId.value,
      per_page: 50,
    })
    records.value = result.data
  } catch {
    toast.error('Erro ao carregar registros')
  }
}

async function loadAll() {
  loading.value = true
  try {
    await Promise.all([loadProduct(), loadHistory(), loadRecords()])
  } finally {
    loading.value = false
  }
}

watch(period, loadHistory)
watch(productId, loadAll)
onMounted(loadAll)

const chartDatasets = computed(() =>
  (history.value?.series ?? []).map((s) => ({ label: s.store.name, points: s.points })),
)

const stats = computed(() => history.value?.stats ?? null)
const goalStatus = computed(() => product.value?.stats?.goal_status ?? null)

// ── Sheets ──────────────────────────────────────────────────────────────────
const recordFormOpen = ref(false)
const editingRecord = ref<PriceRecord | null>(null)
const productFormOpen = ref(false)

const deleteRecordOpen = ref(false)
const deletingRecordId = ref<string | null>(null)
const deletingRecord = ref(false)

const deleteProductOpen = ref(false)
const deletingProduct = ref(false)

function openCreateRecord() {
  editingRecord.value = null
  recordFormOpen.value = true
}

function openEditRecord(record: PriceRecord) {
  editingRecord.value = record
  recordFormOpen.value = true
}

function onRecordSaved() {
  loadHistory()
  loadRecords()
  loadProduct()
}

function requestDeleteRecord(id: string) {
  deletingRecordId.value = id
  deleteRecordOpen.value = true
}

async function confirmDeleteRecord() {
  if (!deletingRecordId.value) return
  deletingRecord.value = true
  try {
    await pricesApi.priceRecords.delete(deletingRecordId.value)
    toast.success('Registro excluído')
    deleteRecordOpen.value = false
    deletingRecordId.value = null
    onRecordSaved()
  } catch {
    toast.error('Erro ao excluir registro')
  } finally {
    deletingRecord.value = false
  }
}

async function confirmDeleteProduct() {
  if (!product.value) return
  deletingProduct.value = true
  try {
    await store.deleteProduct(product.value.id)
    toast.success('Produto excluído')
    router.push({ name: ROUTES.PRICES_PRODUCTS })
  } catch {
    toast.error('Erro ao excluir produto')
  } finally {
    deletingProduct.value = false
  }
}

function onProductSaved(updated: PriceProduct) {
  product.value = product.value ? { ...product.value, ...updated } : updated
  loadHistory()
}
</script>

<template>
  <AppPageContainer>
    <!-- Loading -->
    <div v-if="loading" class="space-y-3">
      <Skeleton class="h-8 w-48" />
      <Skeleton class="h-28 w-full rounded-lg" />
      <Skeleton class="h-64 w-full rounded-lg" />
    </div>

    <template v-else-if="product">
      <!-- Header / hero -->
      <div class="flex items-start gap-3 mb-4">
        <button
          type="button"
          aria-label="Voltar"
          class="p-1.5 mt-0.5 rounded-lg hover:bg-card text-muted-foreground transition-colors shrink-0"
          @click="router.push({ name: ROUTES.PRICES_PRODUCTS })"
        >
          <ArrowLeft :size="18" />
        </button>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 flex-wrap">
            <h1 class="text-[22px] lg:text-[18px] font-semibold tracking-tight text-foreground leading-tight">
              {{ product.name }}
            </h1>
            <span
              class="text-[11px] font-medium px-2 py-0.5 rounded-full"
              :class="product.status === 'tracking'
                ? 'bg-muted text-primary'
                : 'bg-muted text-muted-foreground'"
            >
              {{ PRICE_PRODUCT_STATUS_LABELS[product.status] }}
            </span>
          </div>
          <p class="text-[12px] text-muted-foreground mt-1">
            {{ [product.brand, product.model, product.category?.name].filter(Boolean).join(' · ') || 'Sem detalhes' }}
          </p>
        </div>
        <div class="flex items-center gap-1 shrink-0 mt-0.5">
          <button
            type="button"
            aria-label="Editar produto"
            class="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            @click="productFormOpen = true"
          >
            <Pencil :size="15" />
          </button>
          <button
            type="button"
            aria-label="Excluir produto"
            class="p-2 rounded-md text-muted-foreground hover:text-destructive hover:bg-muted transition-colors"
            @click="deleteProductOpen = true"
          >
            <Trash2 :size="15" />
          </button>
        </div>
      </div>

      <!-- Hero card: last price + goal -->
      <div class="bg-card rounded-lg p-4 mb-4">
        <div class="flex items-end justify-between gap-3">
          <div>
            <p class="text-[10px] text-muted-foreground uppercase tracking-widest">Último preço</p>
            <p class="text-[20px] font-semibold tabular-nums mt-1 text-foreground">
              {{ stats?.last != null ? formatCurrency(stats.last) : '—' }}
            </p>
            <PriceGoalBadge :status="goalStatus" :has-target="product.target_price !== null" class="mt-1" />
          </div>
          <div class="text-right">
            <p v-if="product.target_price !== null" class="text-[12px] text-muted-foreground tabular-nums">
              Meta <span class="font-semibold text-foreground">{{ formatCurrency(product.target_price) }}</span>
            </p>
            <p v-if="product.launch_price !== null" class="text-[12px] text-muted-foreground tabular-nums mt-0.5">
              Lançamento <span class="font-semibold text-foreground">{{ formatCurrency(product.launch_price) }}</span>
            </p>
          </div>
        </div>

        <div class="grid grid-cols-3 gap-2 text-center mt-3 pt-3 border-t border-border">
          <div>
            <p class="text-[10px] text-muted-foreground uppercase tracking-widest">Mínimo</p>
            <p class="text-[14px] font-semibold tabular-nums mt-1 text-success">
              {{ stats?.min != null ? formatCurrency(stats.min) : '—' }}
            </p>
          </div>
          <div>
            <p class="text-[10px] text-muted-foreground uppercase tracking-widest">Médio</p>
            <p class="text-[14px] font-semibold tabular-nums mt-1 text-foreground">
              {{ stats?.avg != null ? formatCurrency(stats.avg) : '—' }}
            </p>
          </div>
          <div>
            <p class="text-[10px] text-muted-foreground uppercase tracking-widest">Máximo</p>
            <p class="text-[14px] font-semibold tabular-nums mt-1 text-foreground">
              {{ stats?.max != null ? formatCurrency(stats.max) : '—' }}
            </p>
          </div>
        </div>

        <div
          v-if="stats?.savings_vs_launch != null"
          class="mt-3 pt-3 border-t border-border flex items-center justify-between"
        >
          <p class="text-[11px] uppercase tracking-widest text-muted-foreground">Economia vs lançamento</p>
          <p
            class="text-[13px] font-semibold tabular-nums"
            :class="stats.savings_vs_launch > 0 ? 'text-success' : 'text-muted-foreground'"
          >
            {{ stats.savings_vs_launch > 0 ? '-' : '' }}{{ formatCurrency(Math.abs(stats.savings_vs_launch)) }}
          </p>
        </div>
      </div>

      <!-- Chart by store -->
      <div class="rounded-xl bg-card mb-4">
        <div class="flex items-center justify-between px-4 py-3 border-b border-border">
          <span class="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Evolução por loja
          </span>
          <div class="flex items-center gap-0.5 bg-muted rounded-md p-0.5">
            <button
              v-for="p in PERIODS"
              :key="p.key"
              type="button"
              class="px-2 py-0.5 rounded text-[11px] font-medium transition-all"
              :class="period === p.key
                ? 'bg-card text-foreground'
                : 'text-muted-foreground hover:text-foreground'"
              @click="period = p.key"
            >
              {{ p.label }}
            </button>
          </div>
        </div>
        <div class="px-4 pt-3 pb-4">
          <PriceHistoryChart
            :datasets="chartDatasets"
            :target-price="product.target_price"
            :loading="historyLoading"
            :height="220"
          />
        </div>
      </div>

      <!-- Records history -->
      <div class="flex items-center justify-between mb-2">
        <p class="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold">
          Histórico de registros
        </p>
        <button
          type="button"
          class="inline-flex items-center gap-1 h-8 px-2.5 rounded-md text-[12px] font-medium text-primary hover:brightness-110 transition-colors"
          @click="openCreateRecord"
        >
          <Plus :size="13" />
          Registrar preço
        </button>
      </div>
      <div class="rounded-xl bg-card overflow-hidden">
        <p
          v-if="records.length === 0"
          class="text-[12px] text-muted-foreground px-4 py-8 text-center"
        >
          Nenhum preço registrado para este produto.
        </p>
        <div
          v-for="record in records"
          :key="record.id"
          class="flex items-center gap-3 px-4 py-3 border-b border-border last:border-0 hover:bg-muted transition-colors cursor-pointer"
          @click="openEditRecord(record)"
        >
          <span class="text-[12px] text-muted-foreground tabular-nums shrink-0 w-16">
            {{ formatDay(record.recorded_at) }}
          </span>
          <div class="flex-1 min-w-0">
            <p class="text-[13px] font-medium text-foreground truncate">{{ record.store?.name ?? '—' }}</p>
            <p v-if="record.notes" class="text-[11px] text-muted-foreground truncate">{{ record.notes }}</p>
          </div>
          <a
            v-if="record.url"
            :href="record.url"
            target="_blank"
            rel="noopener noreferrer"
            class="shrink-0 p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-muted transition-colors"
            @click.stop
          >
            <ExternalLink :size="13" />
          </a>
          <div class="text-right shrink-0">
            <p class="text-[14px] font-semibold tabular-nums text-foreground">
              {{ formatCurrency(record.price) }}
            </p>
            <PriceGoalBadge :status="record.goal_status" compact class="mt-0.5" />
          </div>
          <button
            type="button"
            aria-label="Excluir registro"
            class="shrink-0 p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-muted transition-colors"
            @click.stop="requestDeleteRecord(record.id)"
          >
            <Trash2 :size="13" />
          </button>
        </div>
      </div>
    </template>
  </AppPageContainer>

  <PriceRecordFormSheet
    v-model:open="recordFormOpen"
    :record="editingRecord"
    :preset-product-id="productId"
    @saved="onRecordSaved"
  />

  <ProductFormSheet
    v-model:open="productFormOpen"
    :product="product"
    @saved="onProductSaved"
  />

  <ConfirmDialog
    v-model:open="deleteRecordOpen"
    title="Excluir registro de preço"
    description="Este registro será removido permanentemente do histórico."
    confirm-label="Excluir"
    variant="destructive"
    :loading="deletingRecord"
    @confirm="confirmDeleteRecord"
  />

  <ConfirmDialog
    v-model:open="deleteProductOpen"
    title="Excluir produto"
    :description="`'${product?.name}' e todo o histórico de preços dele serão removidos.`"
    confirm-label="Excluir"
    variant="destructive"
    :loading="deletingProduct"
    @confirm="confirmDeleteProduct"
  />
</template>
