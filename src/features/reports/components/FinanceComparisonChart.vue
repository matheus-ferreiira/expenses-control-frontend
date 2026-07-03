<script setup lang="ts">
import { ref, watch, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { Skeleton } from '@ui/skeleton'
import { BarChart2 } from 'lucide-vue-next'
import { formatCurrencyCompact } from '@/utils/currency'
import type { YearlySummary } from '@/types/reports'

const props = defineProps<{
  data: YearlySummary | null
  loading?: boolean
}>()

const canvasRef = ref<HTMLCanvasElement | null>(null)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let chartInstance: any = null

const MONTH_LABELS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

const chartData = computed(() => {
  if (!props.data?.months) return { labels: [], income: [], expenses: [] }
  const months = [...props.data.months].sort((a, b) => a.month - b.month)
  return {
    labels: months.map((m) => MONTH_LABELS[m.month - 1] ?? String(m.month)),
    income: months.map((m) => m.income),
    expenses: months.map((m) => m.expenses),
  }
})

function getCSSVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

function hsl(token: string, alpha = 1): string {
  const val = getCSSVar(token)
  return alpha < 1 ? `hsl(${val} / ${alpha})` : `hsl(${val})`
}

async function buildChart() {
  if (!canvasRef.value || props.loading) return
  const { Chart, BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend } =
    await import('chart.js')
  Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend)

  if (chartInstance) { chartInstance.destroy(); chartInstance = null }

  const { labels, income, expenses } = chartData.value

  chartInstance = new Chart(canvasRef.value, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Receitas',
          data: income,
          backgroundColor: hsl('--success', 0.5),
          borderColor: hsl('--success', 0.8),
          borderWidth: 1,
          borderRadius: 3,
        },
        {
          label: 'Despesas',
          data: expenses,
          backgroundColor: hsl('--destructive', 0.4),
          borderColor: hsl('--destructive', 0.7),
          borderWidth: 1,
          borderRadius: 3,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          display: true,
          position: 'top',
          align: 'end',
          labels: {
            color: hsl('--muted-foreground', 0.6),
            font: { size: 10 },
            boxWidth: 10,
            boxHeight: 10,
            padding: 12,
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
            label: (ctx) => ` ${ctx.dataset.label}: ${formatCurrencyCompact(ctx.parsed.y ?? 0)}`,
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
          },
        },
        y: {
          grid: { color: hsl('--border', 0.35), lineWidth: 0.5 },
          border: { display: false },
          ticks: {
            color: hsl('--muted-foreground', 0.5),
            font: { size: 10 },
            maxTicksLimit: 5,
            callback: (val) => (val != null ? formatCurrencyCompact(Number(val)) : ''),
          },
          min: 0,
        },
      },
    },
  })
}

watch(
  [chartData, () => props.loading],
  async ([, isLoading]) => {
    if (isLoading) return
    await nextTick()
    buildChart()
  },
)

const isEmpty = computed(() => {
  if (props.loading) return false
  if (!props.data?.months?.length) return true
  return props.data.months.every((m) => m.income === 0 && m.expenses === 0)
})

onMounted(() => {
  if (!props.loading) buildChart()
})

onBeforeUnmount(() => {
  if (chartInstance) { chartInstance.destroy(); chartInstance = null }
})
</script>

<template>
  <div class="rounded-lg bg-card">
    <div class="px-4 py-3 border-b border-border">
      <span class="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
        Receitas vs Despesas — {{ data?.year ?? new Date().getFullYear() }}
      </span>
    </div>
    <div class="px-4 pt-3 pb-4 h-[200px] relative">
      <div v-if="loading" class="absolute inset-4">
        <Skeleton class="h-full w-full rounded" />
      </div>
      <div v-else-if="isEmpty" class="absolute inset-0 flex flex-col items-center justify-center gap-2">
        <BarChart2 :size="20" class="text-muted-foreground" />
        <p class="text-[12px] text-muted-foreground">Nenhuma transação registrada no ano</p>
      </div>
      <canvas v-show="!loading && !isEmpty" ref="canvasRef" />
    </div>
  </div>
</template>
