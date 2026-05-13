<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { Skeleton } from '@ui/skeleton'
import type { Transaction } from '@/types/finance'
import type { CashflowPeriod, CashflowPoint } from '../types'
import { formatCurrency, formatCurrencyCompact } from '@/utils/currency'

const props = defineProps<{
  transactions: Transaction[]
  computeCashflow: (period: CashflowPeriod) => CashflowPoint[]
  loading?: boolean
}>()

const period = ref<CashflowPeriod>('1M')
const PERIODS: CashflowPeriod[] = ['1S', '1M', '6M', '1A']
const canvasRef = ref<HTMLCanvasElement | null>(null)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let chartInstance: any = null

const cashflowData = computed(() => props.computeCashflow(period.value))

const totalIncome = computed(() =>
  cashflowData.value.reduce((s, p) => s + p.income, 0),
)
const totalExpense = computed(() =>
  cashflowData.value.reduce((s, p) => s + p.expense, 0),
)
const net = computed(() => totalIncome.value - totalExpense.value)

function getCSSVar(name: string): string {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim()
}

function hsl(token: string, alpha = 1): string {
  const val = getCSSVar(token)
  return alpha < 1 ? `hsla(${val}, ${alpha})` : `hsl(${val})`
}

async function buildChart() {
  if (!canvasRef.value) return
  const { Chart, LineElement, PointElement, LinearScale, CategoryScale, Filler, Tooltip } =
    await import('chart.js')
  Chart.register(LineElement, PointElement, LinearScale, CategoryScale, Filler, Tooltip)

  if (chartInstance) {
    chartInstance.destroy()
    chartInstance = null
  }

  const data = cashflowData.value
  const labels = data.map((p) => p.label)
  const incomeData = data.map((p) => p.income)
  const expenseData = data.map((p) => p.expense)

  const green = hsl('--success', 0.85)
  const greenFill = hsl('--success', 0.08)
  const red = hsl('--destructive', 0.85)
  const redFill = hsl('--destructive', 0.06)
  const gridColor = hsl('--border', 0.5)
  const tickColor = hsl('--muted-foreground', 0.5)

  chartInstance = new Chart(canvasRef.value, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Receitas',
          data: incomeData,
          borderColor: green,
          backgroundColor: greenFill,
          fill: true,
          tension: 0.4,
          borderWidth: 1.5,
          pointRadius: 0,
          pointHoverRadius: 3,
        },
        {
          label: 'Despesas',
          data: expenseData,
          borderColor: red,
          backgroundColor: redFill,
          fill: true,
          tension: 0.4,
          borderWidth: 1.5,
          pointRadius: 0,
          pointHoverRadius: 3,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
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
            color: tickColor,
            font: { size: 10 },
            maxRotation: 0,
            maxTicksLimit: period.value === '1M' ? 8 : undefined,
          },
        },
        y: {
          grid: { color: gridColor, lineWidth: 0.5 },
          border: { display: false, dash: [3, 3] },
          ticks: {
            color: tickColor,
            font: { size: 10 },
            callback: (val) => (val != null ? formatCurrencyCompact(Number(val)) : ''),
            maxTicksLimit: 5,
          },
        },
      },
    },
  })
}

watch([cashflowData, () => props.loading], async ([, isLoading]) => {
  if (isLoading) return
  await nextTick()
  buildChart()
})

onMounted(async () => {
  if (!props.loading) {
    await nextTick()
    buildChart()
  }
})

onBeforeUnmount(() => {
  if (chartInstance) {
    chartInstance.destroy()
    chartInstance = null
  }
})
</script>

<template>
  <div class="rounded-lg border border-border bg-card">
    <!-- Header -->
    <div class="flex items-center justify-between px-4 py-3 border-b border-border/60">
      <div class="flex items-center gap-3">
        <span class="text-sm font-medium text-foreground">Cashflow</span>
        <!-- Totals -->
        <div v-if="!loading" class="flex items-center gap-3">
          <span class="text-[11px] text-emerald-400/80 tabular-nums">
            +{{ formatCurrency(totalIncome) }}
          </span>
          <span class="text-[11px] text-red-400/80 tabular-nums">
            -{{ formatCurrency(totalExpense) }}
          </span>
          <span
            :class="['text-[11px] tabular-nums font-medium', net >= 0 ? 'text-foreground/70' : 'text-destructive/80']"
          >
            {{ net >= 0 ? '+' : '' }}{{ formatCurrency(net) }}
          </span>
        </div>
      </div>

      <!-- Period toggle -->
      <div class="flex items-center gap-0.5 bg-muted/40 rounded-md p-0.5">
        <button
          v-for="p in PERIODS"
          :key="p"
          :class="[
            'px-2 py-0.5 rounded text-[11px] font-medium transition-all',
            period === p
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground/70 hover:text-foreground',
          ]"
          @click="period = p"
        >
          {{ p }}
        </button>
      </div>
    </div>

    <!-- Chart -->
    <div class="px-4 pt-3 pb-4 h-[160px] relative">
      <div v-if="loading" class="absolute inset-4">
        <Skeleton class="h-full w-full rounded" />
      </div>
      <canvas v-show="!loading" ref="canvasRef" />
    </div>
  </div>
</template>
