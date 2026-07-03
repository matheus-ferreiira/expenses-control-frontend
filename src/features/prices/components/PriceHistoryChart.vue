<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import type { Chart as ChartJS, ChartConfiguration, ChartDataset } from 'chart.js'
import { Skeleton } from '@ui/skeleton'
import { formatCurrency, formatCurrencyCompact } from '@/utils/currency'
import { formatDayShort, PRICE_CHART_TOKENS } from '@/features/prices/utils/priceHelpers'
import type { PricePoint } from '@/features/prices/types'

export interface PriceChartDataset {
  label: string
  points: PricePoint[]
}

const props = withDefaults(
  defineProps<{
    datasets: PriceChartDataset[]
    /** Renders a dashed horizontal goal line when set. */
    targetPrice?: number | null
    loading?: boolean
    height?: number
  }>(),
  { targetPrice: null, loading: false, height: 220 },
)

const canvasRef = ref<HTMLCanvasElement | null>(null)
let chartInstance: ChartJS<'line', (number | null)[], string> | null = null

const hasData = computed(() => props.datasets.some((d) => d.points.length > 0))

// Colors resolved from CSS vars at runtime — same approach as FinanceCashflowChart
function getCSSVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}
function hsl(token: string, alpha = 1): string {
  const val = getCSSVar(token)
  return alpha < 1 ? `hsl(${val} / ${alpha})` : `hsl(${val})`
}

async function buildChart() {
  if (!canvasRef.value || !hasData.value) return

  const { Chart, LineController, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend } =
    await import('chart.js')
  Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend)

  if (chartInstance) {
    chartInstance.destroy()
    chartInstance = null
  }

  // Union of all dates, sorted — each series aligns by date with gaps
  const allDates = [...new Set(props.datasets.flatMap((d) => d.points.map((p) => p.date)))].sort()

  const datasets: ChartDataset<'line', (number | null)[]>[] = props.datasets.map((series, i) => {
    const byDate = new Map(series.points.map((p) => [p.date, p.price]))
    const token = PRICE_CHART_TOKENS[i % PRICE_CHART_TOKENS.length]!
    return {
      label: series.label,
      data: allDates.map((date) => byDate.get(date) ?? null),
      borderColor: hsl(token, 0.9),
      backgroundColor: hsl(token, 0.9),
      spanGaps: true,
      tension: 0.3,
      borderWidth: 2,
      pointRadius: 2,
      pointHoverRadius: 4,
    }
  })

  if (props.targetPrice !== null && props.targetPrice !== undefined && allDates.length > 0) {
    datasets.push({
      label: 'Meta',
      data: allDates.map(() => props.targetPrice),
      borderColor: hsl('--primary', 0.6),
      backgroundColor: hsl('--primary', 0.6),
      borderDash: [5, 5],
      borderWidth: 1.5,
      pointRadius: 0,
      pointHoverRadius: 0,
      tension: 0,
    })
  }

  const config: ChartConfiguration<'line', (number | null)[], string> = {
    type: 'line',
    data: {
      labels: allDates.map((d) => formatDayShort(d)),
      datasets,
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          display: datasets.length > 1,
          position: 'bottom',
          labels: {
            color: hsl('--muted-foreground', 0.7),
            boxWidth: 8,
            boxHeight: 8,
            usePointStyle: true,
            font: { size: 10 },
          },
        },
        tooltip: {
          backgroundColor: hsl('--card'),
          borderColor: hsl('--border'),
          borderWidth: 1,
          titleColor: hsl('--foreground'),
          bodyColor: hsl('--muted-foreground'),
          padding: 10,
          callbacks: {
            label: (ctx) => ` ${ctx.dataset.label}: ${formatCurrency(ctx.parsed.y ?? 0)}`,
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          border: { display: false },
          ticks: {
            color: hsl('--muted-foreground', 0.5),
            font: { size: 10 },
            maxRotation: 0,
            maxTicksLimit: 8,
          },
        },
        y: {
          grid: { color: hsl('--border', 0.4), lineWidth: 0.5 },
          border: { display: false },
          ticks: {
            color: hsl('--muted-foreground', 0.5),
            font: { size: 10 },
            callback: (val) => (val != null ? formatCurrencyCompact(Number(val)) : ''),
            maxTicksLimit: 5,
          },
        },
      },
    },
  }

  chartInstance = new Chart(canvasRef.value, config)
}

watch(
  [() => props.datasets, () => props.targetPrice, () => props.loading],
  async ([, , isLoading]) => {
    if (isLoading) return
    await nextTick()
    buildChart()
  },
  { deep: true, immediate: true },
)

onBeforeUnmount(() => {
  if (chartInstance) {
    chartInstance.destroy()
    chartInstance = null
  }
})
</script>

<template>
  <div class="relative" :style="{ height: `${height}px` }">
    <div v-if="loading" class="absolute inset-0">
      <Skeleton class="h-full w-full rounded" />
    </div>
    <div
      v-else-if="!hasData"
      class="absolute inset-0 grid place-items-center"
    >
      <p class="text-[12px] text-muted-foreground">Sem registros de preço no período</p>
    </div>
    <canvas v-show="!loading && hasData" ref="canvasRef" role="img" aria-label="Gráfico de evolução de preços" />
  </div>
</template>
