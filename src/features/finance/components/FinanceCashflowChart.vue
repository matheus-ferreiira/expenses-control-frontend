<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { Skeleton } from '@ui/skeleton'
import { financeApi } from '@/services/api/finance'
import { formatCurrency, formatCurrencyCompact } from '@/utils/currency'
import type { Transaction } from '@/types/finance'

type Period = '1M' | '3M' | '6M' | '1A'

interface CashflowPoint {
  label: string
  income: number
  expense: number
}

const period = ref<Period>('1M')
const PERIODS: Period[] = ['1M', '3M', '6M', '1A']
const canvasRef = ref<HTMLCanvasElement | null>(null)
const localTransactions = ref<Transaction[]>([])
const loading = ref(false)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let chartInstance: any = null

function getPeriodDates(p: Period): { start_date: string; end_date: string } {
  const now = new Date()
  const end = now.toISOString().slice(0, 10)
  const start = new Date(now)

  if (p === '1M') start.setMonth(start.getMonth() - 1)
  else if (p === '3M') start.setMonth(start.getMonth() - 3)
  else if (p === '6M') start.setMonth(start.getMonth() - 6)
  else start.setFullYear(start.getFullYear() - 1)

  return { start_date: start.toISOString().slice(0, 10), end_date: end }
}

async function loadChartData() {
  loading.value = true
  try {
    const { start_date, end_date } = getPeriodDates(period.value)
    const result = await financeApi.transactions.list({ start_date, end_date, per_page: 300 })
    localTransactions.value = result.data
  } catch {
    localTransactions.value = []
  } finally {
    loading.value = false
  }
}

function computeCashflow(p: Period): CashflowPoint[] {
  const txs = localTransactions.value
  const now = new Date()

  if (p === '1M') {
    // Daily for last 30 days
    const points: CashflowPoint[] = []
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      const key = d.toISOString().slice(0, 10)
      const dayTxs = txs.filter((t) => t.transaction_date === key)
      points.push({
        label: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        income: dayTxs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0),
        expense: dayTxs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
      })
    }
    return points
  }

  if (p === '3M') {
    // Weekly for last 12 weeks
    const points: CashflowPoint[] = []
    for (let i = 11; i >= 0; i--) {
      const weekEnd = new Date(now)
      weekEnd.setDate(weekEnd.getDate() - i * 7)
      const weekStart = new Date(weekEnd)
      weekStart.setDate(weekStart.getDate() - 6)
      const ws = weekStart.toISOString().slice(0, 10)
      const we = weekEnd.toISOString().slice(0, 10)
      const weekTxs = txs.filter((t) => t.transaction_date >= ws && t.transaction_date <= we)
      points.push({
        label: weekStart.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        income: weekTxs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0),
        expense: weekTxs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
      })
    }
    return points
  }

  // 6M and 1A: monthly
  const monthCount = p === '6M' ? 6 : 12
  const points: CashflowPoint[] = []
  for (let i = monthCount - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const ym = d.toISOString().slice(0, 7)
    const monthTxs = txs.filter((t) => t.transaction_date.startsWith(ym))
    points.push({
      label: d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''),
      income: monthTxs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0),
      expense: monthTxs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
    })
  }
  return points
}

const cashflowData = computed(() => computeCashflow(period.value))

const totalIncome = computed(() => cashflowData.value.reduce((s, p) => s + p.income, 0))
const totalExpense = computed(() => cashflowData.value.reduce((s, p) => s + p.expense, 0))
const net = computed(() => totalIncome.value - totalExpense.value)

function getCSSVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

function hsl(token: string, alpha = 1): string {
  const val = getCSSVar(token)
  return alpha < 1 ? `hsl(${val} / ${alpha})` : `hsl(${val})`
}

async function buildChart() {
  if (!canvasRef.value) return
  const { Chart, LineController, LineElement, PointElement, LinearScale, CategoryScale, Filler, Tooltip } =
    await import('chart.js')
  Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Filler, Tooltip)

  if (chartInstance) { chartInstance.destroy(); chartInstance = null }

  const data = cashflowData.value
  const ctx = canvasRef.value.getContext('2d')!

  // Gradient fills
  const h = canvasRef.value.offsetHeight || 180
  const incomeGrad = ctx.createLinearGradient(0, 0, 0, h)
  incomeGrad.addColorStop(0, hsl('--success', 0.3))
  incomeGrad.addColorStop(1, hsl('--success', 0.0))

  const expenseGrad = ctx.createLinearGradient(0, 0, 0, h)
  expenseGrad.addColorStop(0, hsl('--destructive', 0.25))
  expenseGrad.addColorStop(1, hsl('--destructive', 0.0))

  chartInstance = new Chart(canvasRef.value, {
    type: 'line',
    data: {
      labels: data.map((p) => p.label),
      datasets: [
        {
          label: 'Receitas',
          data: data.map((p) => p.income),
          borderColor: hsl('--success', 0.9),
          backgroundColor: incomeGrad,
          fill: true,
          tension: 0.4,
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 4,
        },
        {
          label: 'Despesas',
          data: data.map((p) => p.expense),
          borderColor: hsl('--destructive', 0.8),
          backgroundColor: expenseGrad,
          fill: true,
          tension: 0.4,
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 4,
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
            color: hsl('--muted-foreground', 0.5),
            font: { size: 10 },
            maxRotation: 0,
            maxTicksLimit: period.value === '1M' ? 8 : undefined,
          },
        },
        y: {
          grid: { color: hsl('--border', 0.4), lineWidth: 0.5 },
          border: { display: false, dash: [3, 3] },
          ticks: {
            color: hsl('--muted-foreground', 0.5),
            font: { size: 10 },
            callback: (val) => (val != null ? formatCurrencyCompact(Number(val)) : ''),
            maxTicksLimit: 5,
          },
        },
      },
    },
  })
}

watch([cashflowData, loading], async ([, isLoading]) => {
  if (isLoading) return
  await nextTick()
  buildChart()
})

watch(period, () => loadChartData())

onMounted(() => loadChartData())

onBeforeUnmount(() => {
  if (chartInstance) { chartInstance.destroy(); chartInstance = null }
})
</script>

<template>
  <div class="rounded-lg border border-border/50 bg-card">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between px-4 py-3 border-b border-border/50 gap-2 sm:gap-0">
      <div class="flex items-center gap-4 flex-wrap">
        <span class="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/50">
          Fluxo de caixa
        </span>
        <div v-if="!loading" class="flex items-center gap-3">
          <span class="text-[11px] text-success/80 tabular-nums">
            +{{ formatCurrency(totalIncome) }}
          </span>
          <span class="text-[11px] text-destructive/70 tabular-nums">
            -{{ formatCurrency(totalExpense) }}
          </span>
          <span
            :class="['text-[11px] tabular-nums font-medium', net >= 0 ? 'text-foreground/60' : 'text-destructive/80']"
          >
            {{ net >= 0 ? '+' : '' }}{{ formatCurrency(net) }}
          </span>
        </div>
      </div>

      <!-- Period toggle -->
      <div class="flex items-center gap-0.5 bg-muted/40 rounded-md p-0.5 self-start sm:self-auto">
        <button
          v-for="p in PERIODS"
          :key="p"
          :class="[
            'px-2 py-0.5 rounded text-[11px] font-medium transition-all',
            period === p
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground/60 hover:text-foreground',
          ]"
          @click="period = p"
        >
          {{ p }}
        </button>
      </div>
    </div>

    <!-- Chart -->
    <div class="px-4 pt-3 pb-4 h-[180px] relative">
      <div v-if="loading" class="absolute inset-4">
        <Skeleton class="h-full w-full rounded" />
      </div>
      <canvas v-show="!loading" ref="canvasRef" />
    </div>
  </div>
</template>
