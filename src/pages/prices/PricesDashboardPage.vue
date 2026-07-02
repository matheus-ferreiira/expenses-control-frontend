<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { AppPageContainer, EmptyState } from '@/components/shared'
import { Skeleton } from '@ui/skeleton'
import { ChevronDown, ExternalLink, Package, Plus } from 'lucide-vue-next'
import PriceGoalBadge from '@/features/prices/components/PriceGoalBadge.vue'
import PriceHistoryChart from '@/features/prices/components/PriceHistoryChart.vue'
import PriceRecordFormSheet from '@/features/prices/components/PriceRecordFormSheet.vue'
import { pricesApi } from '@/services/api/prices'
import { useToast } from '@/composables/useToast'
import { formatCurrency } from '@/utils/currency'
import { formatDay } from '@/features/prices/utils/priceHelpers'
import { ROUTES } from '@/constants/routes'
import type { PriceDashboard, PriceHistory } from '@/features/prices/types'

const router = useRouter()
const toast = useToast()

const loading = ref(false)
const dashboard = ref<PriceDashboard | null>(null)

// ── Evolution chart — product select ────────────────────────────────────────
const selectedProductId = ref('')
const historyLoading = ref(false)
const history = ref<PriceHistory | null>(null)

// ── Quick record form ───────────────────────────────────────────────────────
const recordFormOpen = ref(false)

async function loadDashboard() {
  loading.value = true
  try {
    dashboard.value = await pricesApi.reports.dashboard()
    const first = dashboard.value.tracked_products[0]
    if (first && !selectedProductId.value) selectedProductId.value = first.id
  } catch {
    toast.error('Erro ao carregar o dashboard de preços')
  } finally {
    loading.value = false
  }
}

async function loadHistory(productId: string) {
  if (!productId) {
    history.value = null
    return
  }
  historyLoading.value = true
  try {
    history.value = await pricesApi.reports.priceHistory(productId)
  } catch {
    toast.error('Erro ao carregar histórico de preços')
    history.value = null
  } finally {
    historyLoading.value = false
  }
}

watch(selectedProductId, (id) => loadHistory(id))

onMounted(loadDashboard)

const isEmpty = computed(
  () => !loading.value && (dashboard.value?.counts.products_total ?? 0) === 0,
)

const chartDatasets = computed(() =>
  (history.value?.series ?? []).map((s) => ({ label: s.store.name, points: s.points })),
)

function goToProduct(id: string) {
  router.push({ name: ROUTES.PRICES_PRODUCT_DETAIL, params: { id } })
}

function onRecordSaved() {
  loadDashboard()
  if (selectedProductId.value) loadHistory(selectedProductId.value)
}

function netCostClass(value: number): string {
  if (value > 0) return 'text-foreground'
  return 'text-success'
}
</script>

<template>
  <AppPageContainer>
    <!-- Header -->
    <div class="flex items-start justify-between mb-4">
      <div>
        <p class="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/80 mb-1.5">
          Preços
        </p>
        <h1 class="text-[22px] lg:text-[18px] font-semibold tracking-tight text-foreground leading-none mb-1.5">
          Visão Geral
        </h1>
        <p v-if="dashboard && !loading" class="text-[12px] text-muted-foreground">
          {{ dashboard.counts.products_tracking }} em acompanhamento ·
          {{ dashboard.counts.records_total }} registro{{ dashboard.counts.records_total !== 1 ? 's' : '' }} de preço
        </p>
      </div>
      <button
        type="button"
        class="inline-flex items-center gap-1.5 h-9 px-3 rounded-md text-[13px] font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors mt-1"
        @click="recordFormOpen = true"
      >
        <Plus :size="14" />
        Registrar preço
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="space-y-3">
      <Skeleton class="h-28 w-full rounded-lg" />
      <Skeleton class="h-64 w-full rounded-lg" />
      <Skeleton class="h-48 w-full rounded-lg" />
    </div>

    <!-- Empty -->
    <EmptyState
      v-else-if="isEmpty"
      :icon="Package"
      title="Nenhum produto acompanhado"
      description="Cadastre produtos e comece a registrar preços para acompanhar a evolução."
      cta-label="Cadastrar produto"
      @cta="router.push({ name: ROUTES.PRICES_PRODUCTS })"
    />

    <template v-else-if="dashboard">
      <!-- KPI card — patrimony snapshot + counts context -->
      <div class="bg-card border border-border rounded-lg p-4 mb-4">
        <div class="grid grid-cols-3 gap-2 text-center">
          <div>
            <p class="text-[10px] text-muted-foreground uppercase tracking-widest">Investido</p>
            <p class="text-[17px] font-semibold tabular-nums mt-1 text-foreground">
              {{ formatCurrency(dashboard.patrimony_snapshot.invested) }}
            </p>
          </div>
          <div>
            <p class="text-[10px] text-muted-foreground uppercase tracking-widest">Recuperado</p>
            <p class="text-[17px] font-semibold tabular-nums mt-1 text-success">
              {{ formatCurrency(dashboard.patrimony_snapshot.recovered) }}
            </p>
          </div>
          <div>
            <p class="text-[10px] text-muted-foreground uppercase tracking-widest">Custo líquido</p>
            <p
              class="text-[17px] font-semibold tabular-nums mt-1"
              :class="netCostClass(dashboard.patrimony_snapshot.net_cost)"
            >
              {{ formatCurrency(dashboard.patrimony_snapshot.net_cost) }}
            </p>
          </div>
        </div>
        <div class="mt-3 pt-3 border-t border-border/40 flex items-center justify-between flex-wrap gap-2">
          <p class="text-[11px] uppercase tracking-widest text-muted-foreground/50">Catálogo</p>
          <p class="text-[12px] text-muted-foreground/60 tabular-nums">
            {{ dashboard.counts.products_total }}
            {{ dashboard.counts.products_total === 1 ? 'produto' : 'produtos' }} ·
            {{ dashboard.counts.products_purchased }}
            {{ dashboard.counts.products_purchased === 1 ? 'comprado' : 'comprados' }} ·
            {{ dashboard.counts.stores_total }}
            {{ dashboard.counts.stores_total === 1 ? 'loja' : 'lojas' }}
          </p>
        </div>
      </div>

      <!-- Evolution chart -->
      <div class="rounded-xl border border-border/50 bg-card mb-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between px-4 py-3 border-b border-border/50 gap-2 sm:gap-0">
          <span class="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/50">
            Evolução de preços
          </span>
          <div class="relative self-start sm:self-auto">
            <select
              v-model="selectedProductId"
              class="h-8 rounded-md border border-border/60 bg-background pl-2.5 pr-8 text-[12px] text-foreground focus:outline-none focus:border-primary/60 appearance-none cursor-pointer transition-colors"
            >
              <option value="" disabled>Selecione um produto</option>
              <option v-for="p in dashboard.tracked_products" :key="p.id" :value="p.id">
                {{ p.name }}
              </option>
            </select>
            <ChevronDown
              :size="12"
              class="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/50 pointer-events-none"
            />
          </div>
        </div>
        <div class="px-4 pt-3 pb-4">
          <p
            v-if="dashboard.tracked_products.length === 0"
            class="text-[12px] text-muted-foreground/50 py-10 text-center"
          >
            Nenhum produto em acompanhamento.
          </p>
          <PriceHistoryChart
            v-else
            :datasets="chartDatasets"
            :target-price="history?.product.target_price ?? null"
            :loading="historyLoading"
            :height="200"
          />
        </div>
      </div>

      <!-- Tracked products -->
      <div class="mb-4">
        <p class="text-[11px] uppercase tracking-widest text-muted-foreground/50 font-semibold mb-2">
          Produtos acompanhados
        </p>
        <div class="rounded-xl border border-border/50 bg-card overflow-hidden">
          <p
            v-if="dashboard.tracked_products.length === 0"
            class="text-[12px] text-muted-foreground/50 px-4 py-8 text-center"
          >
            Nenhum produto com status "Acompanhando".
          </p>
          <button
            v-for="p in dashboard.tracked_products"
            :key="p.id"
            type="button"
            class="w-full flex items-center gap-3 px-4 py-3 text-left border-b border-border/30 last:border-0 hover:bg-muted/30 transition-colors"
            @click="goToProduct(p.id)"
          >
            <div class="flex-1 min-w-0">
              <p class="text-[14px] font-medium text-foreground truncate">{{ p.name }}</p>
              <p class="text-[12px] text-muted-foreground/60 tabular-nums mt-0.5">
                Mín {{ p.min_price !== null ? formatCurrency(p.min_price) : '—' }}
                · Méd {{ p.avg_price !== null ? formatCurrency(p.avg_price) : '—' }}
                <template v-if="p.savings_vs_launch !== null && p.savings_vs_launch > 0">
                  · <span class="text-success/80">-{{ formatCurrency(p.savings_vs_launch) }} vs lançamento</span>
                </template>
              </p>
            </div>
            <div class="text-right shrink-0">
              <p class="text-[14px] font-semibold tabular-nums text-foreground">
                {{ p.last_price !== null ? formatCurrency(p.last_price) : '—' }}
              </p>
              <PriceGoalBadge :status="p.goal_status" :has-target="p.target_price !== null" class="mt-0.5" />
            </div>
          </button>
        </div>
      </div>

      <!-- Recent records -->
      <div>
        <p class="text-[11px] uppercase tracking-widest text-muted-foreground/50 font-semibold mb-2">
          Últimos registros
        </p>
        <div class="rounded-xl border border-border/50 bg-card overflow-hidden">
          <p
            v-if="dashboard.recent_records.length === 0"
            class="text-[12px] text-muted-foreground/50 px-4 py-8 text-center"
          >
            Nenhum preço registrado ainda.
          </p>
          <div
            v-for="record in dashboard.recent_records"
            :key="record.id"
            class="flex items-center gap-3 px-4 py-3 border-b border-border/30 last:border-0"
          >
            <span class="text-[12px] text-muted-foreground/60 tabular-nums shrink-0 w-16">
              {{ formatDay(record.recorded_at) }}
            </span>
            <div class="flex-1 min-w-0">
              <p class="text-[13px] font-medium text-foreground truncate">
                {{ record.product?.name ?? '—' }}
              </p>
              <p class="text-[11px] text-muted-foreground/60 truncate">{{ record.store?.name ?? '—' }}</p>
            </div>
            <a
              v-if="record.url"
              :href="record.url"
              target="_blank"
              rel="noopener noreferrer"
              class="shrink-0 p-1.5 rounded-md text-muted-foreground/50 hover:text-primary hover:bg-muted/40 transition-colors"
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
          </div>
        </div>
      </div>
    </template>
  </AppPageContainer>

  <PriceRecordFormSheet v-model:open="recordFormOpen" @saved="onRecordSaved" />
</template>
