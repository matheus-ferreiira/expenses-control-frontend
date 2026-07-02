<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Sheet, SheetContent } from '@ui/sheet'
import { X } from 'lucide-vue-next'
import { Skeleton } from '@ui/skeleton'
import PriceGoalBadge from './PriceGoalBadge.vue'
import PriceHistoryChart from './PriceHistoryChart.vue'
import { pricesApi } from '@/services/api/prices'
import { useToast } from '@/composables/useToast'
import { formatCurrency, formatPercent } from '@/utils/currency'
import type { PriceCompareProduct } from '@/features/prices/types'

const props = defineProps<{
  open: boolean
  /** 2 to 4 product ids. */
  productIds: string[]
}>()

const emit = defineEmits<{ 'update:open': [value: boolean] }>()

const toast = useToast()
const loading = ref(false)
const products = ref<PriceCompareProduct[]>([])

watch(
  () => props.open,
  async (isOpen) => {
    if (!isOpen) return
    if (props.productIds.length < 2) return
    loading.value = true
    products.value = []
    try {
      const result = await pricesApi.reports.compare(props.productIds)
      products.value = result.products
    } catch {
      toast.error('Erro ao comparar produtos')
      emit('update:open', false)
    } finally {
      loading.value = false
    }
  },
)

function close() {
  emit('update:open', false)
}

const chartDatasets = computed(() =>
  products.value.map((p) => ({ label: p.name, points: p.series })),
)

const bestMin = computed(() => {
  const values = products.value
    .map((p) => p.stats.min)
    .filter((v): v is number => v !== null)
  return values.length ? Math.min(...values) : null
})

const bestAvg = computed(() => {
  const values = products.value
    .map((p) => p.stats.avg)
    .filter((v): v is number => v !== null)
  return values.length ? Math.min(...values) : null
})

/** % difference vs the best (lowest) value across compared products. */
function deltaVsBest(value: number | null, best: number | null): string | null {
  if (value === null || best === null || best === 0) return null
  const delta = ((value - best) / best) * 100
  if (delta === 0) return 'melhor'
  return `+${formatPercent(delta)}`
}
</script>

<template>
  <Sheet :open="open" @update:open="emit('update:open', $event)">
    <SheetContent
      side="bottom"
      class="rounded-t-2xl border-t-2 border-primary bg-background max-h-[92vh] overflow-y-auto p-0 focus:outline-none [&>button]:hidden"
    >
      <!-- Drag handle -->
      <div class="mx-auto mt-3 mb-0 h-1 w-10 rounded-full bg-muted-foreground/20 shrink-0" />

      <!-- Header -->
      <div class="flex items-center justify-between px-5 pt-2 pb-3">
        <p class="text-[15px] font-semibold">Comparar produtos</p>
        <button
          type="button"
          aria-label="Fechar"
          class="size-7 rounded-full grid place-items-center text-muted-foreground hover:bg-muted transition-colors"
          @click="close"
        >
          <X :size="15" aria-hidden="true" />
        </button>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="px-5 pb-8 space-y-3">
        <Skeleton class="h-40 w-full rounded-xl" />
        <Skeleton class="h-56 w-full rounded-xl" />
      </div>

      <template v-else-if="products.length">
        <!-- Stats side by side (horizontal scroll on narrow screens) -->
        <div class="px-5 pb-5 overflow-x-auto">
          <table class="w-full min-w-[480px] border-collapse">
            <thead>
              <tr>
                <th class="w-24"></th>
                <th
                  v-for="p in products"
                  :key="p.id"
                  class="text-left pb-2 pr-4 align-bottom"
                >
                  <p class="text-[13px] font-semibold text-foreground leading-snug">{{ p.name }}</p>
                  <PriceGoalBadge :status="p.stats.goal_status" class="mt-1" />
                </th>
              </tr>
            </thead>
            <tbody>
              <tr class="border-b border-border/30">
                <td class="py-2.5 text-[11px] uppercase tracking-widest text-muted-foreground/50 font-semibold">Último</td>
                <td v-for="p in products" :key="p.id" class="py-2.5 pr-4 text-[14px] tabular-nums font-semibold text-foreground">
                  {{ p.stats.last !== null ? formatCurrency(p.stats.last) : '—' }}
                </td>
              </tr>
              <tr class="border-b border-border/30">
                <td class="py-2.5 text-[11px] uppercase tracking-widest text-muted-foreground/50 font-semibold">Mínimo</td>
                <td v-for="p in products" :key="p.id" class="py-2.5 pr-4">
                  <span
                    class="text-[14px] tabular-nums font-semibold"
                    :class="p.stats.min !== null && p.stats.min === bestMin ? 'text-success' : 'text-foreground'"
                  >
                    {{ p.stats.min !== null ? formatCurrency(p.stats.min) : '—' }}
                  </span>
                  <span
                    v-if="deltaVsBest(p.stats.min, bestMin)"
                    class="block text-[11px] tabular-nums mt-0.5"
                    :class="p.stats.min === bestMin ? 'text-success/70' : 'text-muted-foreground/60'"
                  >
                    {{ deltaVsBest(p.stats.min, bestMin) }}
                  </span>
                </td>
              </tr>
              <tr class="border-b border-border/30">
                <td class="py-2.5 text-[11px] uppercase tracking-widest text-muted-foreground/50 font-semibold">Médio</td>
                <td v-for="p in products" :key="p.id" class="py-2.5 pr-4">
                  <span
                    class="text-[14px] tabular-nums font-semibold"
                    :class="p.stats.avg !== null && p.stats.avg === bestAvg ? 'text-success' : 'text-foreground'"
                  >
                    {{ p.stats.avg !== null ? formatCurrency(p.stats.avg) : '—' }}
                  </span>
                  <span
                    v-if="deltaVsBest(p.stats.avg, bestAvg)"
                    class="block text-[11px] tabular-nums mt-0.5"
                    :class="p.stats.avg === bestAvg ? 'text-success/70' : 'text-muted-foreground/60'"
                  >
                    {{ deltaVsBest(p.stats.avg, bestAvg) }}
                  </span>
                </td>
              </tr>
              <tr class="border-b border-border/30">
                <td class="py-2.5 text-[11px] uppercase tracking-widest text-muted-foreground/50 font-semibold">Máximo</td>
                <td v-for="p in products" :key="p.id" class="py-2.5 pr-4 text-[14px] tabular-nums font-semibold text-foreground">
                  {{ p.stats.max !== null ? formatCurrency(p.stats.max) : '—' }}
                </td>
              </tr>
              <tr class="border-b border-border/30">
                <td class="py-2.5 text-[11px] uppercase tracking-widest text-muted-foreground/50 font-semibold">Meta</td>
                <td v-for="p in products" :key="p.id" class="py-2.5 pr-4 text-[13px] tabular-nums font-semibold text-foreground">
                  {{ p.target_price !== null ? formatCurrency(p.target_price) : '—' }}
                </td>
              </tr>
              <tr>
                <td class="py-2.5 text-[11px] uppercase tracking-widest text-muted-foreground/50 font-semibold">Registros</td>
                <td v-for="p in products" :key="p.id" class="py-2.5 pr-4 text-[13px] tabular-nums font-semibold text-muted-foreground">
                  {{ p.stats.records_count }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Overlaid evolution chart -->
        <div class="px-5 pb-8">
          <p class="text-[11px] uppercase tracking-widest text-muted-foreground/50 font-semibold mb-3">
            Evolução de preços
          </p>
          <PriceHistoryChart :datasets="chartDatasets" :height="240" />
        </div>
      </template>
    </SheetContent>
  </Sheet>
</template>
