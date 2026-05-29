<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { AppPageContainer } from '@/components/shared'
import FinanceSubNav from '@/features/finance/components/FinanceSubNav.vue'
import { Skeleton } from '@ui/skeleton'
import {
  ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Wallet, Calendar,
} from 'lucide-vue-next'
import { financeApi } from '@/services/api/finance'
import { formatCurrency } from '@/utils/currency'
import { ROUTES } from '@/constants/routes'

type MonthEntry = { month: number; income: number; expenses: number; balance: number }
type YearlyReport = { year: number; months: MonthEntry[] }

const router = useRouter()
const year = ref(new Date().getFullYear())
const report = ref<YearlyReport | null>(null)
const loading = ref(false)

const currentYear = new Date().getFullYear()
const currentMonth = new Date().getMonth() + 1

const chartRef = ref<HTMLCanvasElement | null>(null)
let chartInstance: unknown = null

const MONTH_NAMES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
const MONTH_FULL  = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

// ── Load data ─────────────────────────────────────────────────────────────────

async function load() {
  loading.value = true
  destroyChart()
  try {
    report.value = await financeApi.yearlyReport(year.value)
  } catch {
    report.value = null
  } finally {
    loading.value = false
  }
}

function prevYear() { year.value--; load() }
function nextYear() { year.value++; load() }

// ── KPIs ──────────────────────────────────────────────────────────────────────

const totalIncome = computed(() =>
  report.value?.months.reduce((s, m) => s + m.income, 0) ?? 0,
)
const totalExpenses = computed(() =>
  report.value?.months.reduce((s, m) => s + m.expenses, 0) ?? 0,
)
const yearBalance = computed(() => totalIncome.value - totalExpenses.value)

const worstMonth = computed(() => {
  if (!report.value) return null
  const m = [...report.value.months].sort((a, b) => b.expenses - a.expenses)[0]
  return m ? { name: MONTH_FULL[(m.month - 1)], expenses: m.expenses } : null
})

// ── Monthly table with deltas ─────────────────────────────────────────────────

const monthsWithDelta = computed<Array<MonthEntry & { delta: number | null }>>(() => {
  if (!report.value) return []
  return report.value.months.map((m, i) => ({
    ...m,
    delta: i === 0 ? null : m.expenses - (report.value!.months[i - 1]?.expenses ?? 0),
  }))
})

// ── Chart ─────────────────────────────────────────────────────────────────────

function destroyChart() {
  if (chartInstance) {
    (chartInstance as { destroy: () => void }).destroy()
    chartInstance = null
  }
}

async function buildChart() {
  if (!chartRef.value || !report.value || loading.value) return
  destroyChart()

  const { Chart, BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend } =
    await import('chart.js')
  Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend)

  const labels = MONTH_NAMES
  const incomeData = report.value.months.map((m) => m.income)
  const expenseData = report.value.months.map((m) => m.expenses)

  chartInstance = new Chart(chartRef.value, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Receitas',
          data: incomeData,
          backgroundColor: 'hsl(162 100% 39% / 0.7)',
          borderColor: 'hsl(162 100% 39%)',
          borderWidth: 1,
          borderRadius: 4,
        },
        {
          label: 'Despesas',
          data: expenseData,
          backgroundColor: 'hsl(0 100% 65% / 0.7)',
          borderColor: 'hsl(0 100% 65%)',
          borderWidth: 1,
          borderRadius: 4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: true, position: 'top', labels: { boxWidth: 12, font: { size: 11 } } },
        tooltip: {
          backgroundColor: 'hsl(0 0% 8%)',
          borderColor: 'hsl(0 0% 13%)',
          borderWidth: 1,
          padding: 10,
          callbacks: {
            label: (ctx) => ` ${ctx.dataset.label}: ${formatCurrency(ctx.parsed.y ?? 0)}`,
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: 'hsl(0 0% 55%)', font: { size: 11 } },
        },
        y: {
          grid: { color: 'hsl(0 0% 13%)' },
          ticks: {
            color: 'hsl(0 0% 55%)',
            font: { size: 11 },
            callback: (v) => `R$ ${(Number(v) / 1000).toFixed(0)}k`,
          },
        },
      },
    },
  })
}

watch([report, loading], async () => {
  if (!loading.value && report.value) {
    await nextTick()
    buildChart()
  }
})

onMounted(() => load())
onBeforeUnmount(() => destroyChart())

// ── Navigate to monthly report ────────────────────────────────────────────────

function goToMonth(month: number) {
  router.push({ name: ROUTES.FINANCE_REPORTS, query: { year: year.value, month } })
}
</script>

<template>
  <AppPageContainer>
    <!-- Page header -->
    <div class="flex items-start justify-between mb-6">
      <div>
        <p class="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/40 mb-1.5">
          Finanças
        </p>
        <h1 class="text-2xl font-semibold tracking-tight text-foreground leading-none mb-1.5">
          Relatório anual
        </h1>
        <p class="text-[13px] text-muted-foreground/50">
          Resumo de receitas e despesas do ano.
        </p>
      </div>
    </div>

    <FinanceSubNav />

    <!-- Toggle Mensal / Anual — same pattern as FinanceSubNav -->
    <div class="-mx-5 px-5 lg:mx-0 lg:px-0 mb-5 overflow-x-auto scrollbar-none">
      <div class="flex items-center gap-1 w-max border-b border-border">
        <button
          class="relative px-3 h-10 text-sm font-medium whitespace-nowrap text-muted-foreground hover:text-foreground transition-colors"
          @click="$router.push({ name: 'finance-reports' })"
        >
          Mensal
        </button>
        <button class="relative px-3 h-10 text-sm font-medium whitespace-nowrap text-foreground">
          Anual
          <span class="absolute left-2 right-2 -bottom-px h-[2px] rounded-full bg-primary" />
        </button>
      </div>
    </div>

    <!-- Year navigator -->
    <div class="flex items-center justify-between bg-card border border-border rounded-lg px-2 py-1.5 mb-5">
      <button
        type="button"
        class="min-w-11 h-11 grid place-items-center rounded-md hover:bg-muted text-muted-foreground active:scale-95 transition-all"
        @click="prevYear"
      >
        <ChevronLeft :size="18" />
      </button>
      <span class="text-[15px] font-semibold text-foreground">{{ year }}</span>
      <button
        type="button"
        class="min-w-11 h-11 grid place-items-center rounded-md hover:bg-muted text-muted-foreground active:scale-95 transition-all"
        @click="nextYear"
      >
        <ChevronRight :size="18" />
      </button>
    </div>

    <!-- Loading skeletons -->
    <div v-if="loading" class="space-y-4">
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Skeleton v-for="i in 4" :key="i" class="h-24 rounded-xl" />
      </div>
      <Skeleton class="h-64 rounded-xl" />
    </div>

    <!-- Empty state -->
    <div v-else-if="!report" class="flex flex-col items-center justify-center py-16 text-center">
      <Calendar :size="40" class="text-muted-foreground/30 mb-3" />
      <p class="text-[15px] font-semibold">Sem dados para {{ year }}</p>
      <p class="text-[13px] text-muted-foreground/50 mt-1">Nenhuma transação encontrada neste ano.</p>
    </div>

    <template v-else>
      <!-- 4 KPI cards -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <div class="bg-card border border-border rounded-xl p-3.5">
          <p class="text-[10px] uppercase tracking-wider text-muted-foreground/50 font-medium mb-1">Receitas</p>
          <p class="text-lg font-semibold tabular-nums text-success">{{ formatCurrency(totalIncome) }}</p>
        </div>
        <div class="bg-card border border-border rounded-xl p-3.5">
          <p class="text-[10px] uppercase tracking-wider text-muted-foreground/50 font-medium mb-1">Despesas</p>
          <p class="text-lg font-semibold tabular-nums text-destructive">{{ formatCurrency(totalExpenses) }}</p>
        </div>
        <div class="bg-card border border-border rounded-xl p-3.5">
          <div class="flex items-center gap-1.5 mb-1">
            <Wallet :size="10" class="text-muted-foreground/40" />
            <p class="text-[10px] uppercase tracking-wider text-muted-foreground/50 font-medium">Saldo</p>
          </div>
          <p
            class="text-lg font-semibold tabular-nums"
            :class="yearBalance >= 0 ? 'text-success' : 'text-destructive'"
          >
            {{ yearBalance >= 0 ? '+' : '' }}{{ formatCurrency(yearBalance) }}
          </p>
        </div>
        <div class="bg-card border border-border rounded-xl p-3.5">
          <div class="flex items-center gap-1.5 mb-1">
            <TrendingDown :size="10" class="text-muted-foreground/40" />
            <p class="text-[10px] uppercase tracking-wider text-muted-foreground/50 font-medium">Maior despesa</p>
          </div>
          <p class="text-lg font-semibold tabular-nums text-foreground leading-tight">
            {{ worstMonth?.name ?? '—' }}
          </p>
          <p v-if="worstMonth" class="text-[11px] text-muted-foreground/50 tabular-nums mt-0.5">
            {{ formatCurrency(worstMonth.expenses) }}
          </p>
        </div>
      </div>

      <!-- Chart + Table side by side on desktop -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">

        <!-- Bar chart -->
        <div class="bg-card border border-border rounded-xl p-4">
          <p class="text-[12px] font-semibold text-foreground mb-3">Receitas × Despesas por mês</p>
          <div class="relative h-64">
            <canvas ref="chartRef" />
          </div>
        </div>

        <!-- Monthly table -->
        <div class="bg-card border border-border rounded-xl overflow-hidden">
          <div class="px-4 py-3 border-b border-border">
            <p class="text-[12px] font-semibold text-foreground">Detalhamento mensal</p>
          </div>
          <div class="divide-y divide-border/60">
            <button
              v-for="m in monthsWithDelta"
              :key="m.month"
              type="button"
              class="w-full grid grid-cols-4 items-center gap-2 px-4 py-2.5 text-left hover:bg-muted/30 transition-colors group"
              @click="goToMonth(m.month)"
            >
              <!-- Month name -->
              <span class="text-[12px] font-medium text-foreground group-hover:text-primary transition-colors">
                {{ MONTH_FULL[m.month - 1] }}
              </span>
              <!-- Income -->
              <span class="text-[11px] tabular-nums text-success text-right">
                +{{ formatCurrency(m.income) }}
              </span>
              <!-- Expenses -->
              <span class="text-[11px] tabular-nums text-destructive text-right">
                -{{ formatCurrency(m.expenses) }}
              </span>
              <!-- Balance + delta -->
              <div class="text-right">
                <p
                  class="text-[12px] tabular-nums font-semibold"
                  :class="m.balance >= 0 ? 'text-success' : 'text-destructive'"
                >
                  {{ m.balance >= 0 ? '+' : '' }}{{ formatCurrency(m.balance) }}
                </p>
                <p
                  v-if="m.delta !== null"
                  class="text-[10px] tabular-nums"
                  :class="m.delta > 0 ? 'text-destructive/70' : m.delta < 0 ? 'text-success/70' : 'text-muted-foreground/40'"
                >
                  {{ m.delta > 0 ? '↑' : m.delta < 0 ? '↓' : '→' }}{{ formatCurrency(Math.abs(m.delta)) }}
                </p>
              </div>
            </button>
          </div>
        </div>

      </div>

      <!-- Mobile: months summary as 2-line cards (lg:hidden) -->
      <div class="lg:hidden space-y-2 mb-4 pb-24">
        <button
          v-for="m in monthsWithDelta"
          :key="m.month"
          type="button"
          class="w-full rounded-xl px-4 py-3 text-left transition-colors"
          :class="m.month === currentMonth && year === currentYear
            ? 'bg-primary/10 border border-primary/20'
            : 'bg-card border border-border/40 hover:bg-popover'"
          @click="goToMonth(m.month)"
        >
          <!-- Row 1: month name + balance -->
          <div class="flex items-center justify-between mb-1">
            <span
              class="text-[13px] font-semibold"
              :class="m.month === currentMonth && year === currentYear ? 'text-primary' : 'text-foreground'"
            >
              {{ MONTH_FULL[m.month - 1] }}
            </span>
            <span
              class="text-[14px] tabular-nums font-bold"
              :class="m.balance >= 0 ? 'text-success' : 'text-destructive'"
            >
              {{ m.balance >= 0 ? '+' : '' }}{{ formatCurrency(m.balance) }}
            </span>
          </div>
          <!-- Row 2: income · expenses -->
          <div class="flex items-center gap-1.5">
            <span class="text-[11px] tabular-nums text-success">+{{ formatCurrency(m.income) }}</span>
            <span class="text-[10px] text-muted-foreground/30">·</span>
            <span class="text-[11px] tabular-nums text-destructive">-{{ formatCurrency(m.expenses) }}</span>
          </div>
        </button>
      </div>

      <!-- Year trend indicators -->
      <div class="grid grid-cols-2 gap-3">
        <div class="bg-card border border-border rounded-xl p-3.5 flex items-center gap-3">
          <span
            class="flex items-center justify-center size-9 rounded-xl shrink-0"
            :class="yearBalance >= 0 ? 'bg-success/15 text-success' : 'bg-destructive/15 text-destructive'"
          >
            <component :is="yearBalance >= 0 ? TrendingUp : TrendingDown" :size="16" />
          </span>
          <div>
            <p class="text-[11px] text-muted-foreground/50">Taxa de poupança</p>
            <p class="text-[14px] font-semibold tabular-nums">
              {{ totalIncome > 0 ? Math.round(((totalIncome - totalExpenses) / totalIncome) * 100) : 0 }}%
            </p>
          </div>
        </div>
        <div class="bg-card border border-border rounded-xl p-3.5 flex items-center gap-3">
          <span class="flex items-center justify-center size-9 rounded-xl shrink-0 bg-muted text-muted-foreground">
            <Calendar :size="16" />
          </span>
          <div>
            <p class="text-[11px] text-muted-foreground/50">Média mensal</p>
            <p class="text-[14px] font-semibold tabular-nums text-destructive">
              {{ formatCurrency(totalExpenses / 12) }}
            </p>
          </div>
        </div>
      </div>
    </template>

  </AppPageContainer>
</template>
