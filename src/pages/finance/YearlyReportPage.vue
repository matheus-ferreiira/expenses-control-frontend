<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { AppPageContainer } from '@/components/shared'
import { Skeleton } from '@ui/skeleton'
import {
  ChevronLeft, ChevronRight, Calendar,
} from 'lucide-vue-next'
import { financeApi } from '@/services/api/finance'
import { formatCurrency } from '@/utils/currency'
import { ROUTES } from '@/constants/routes'

type MonthEntry = { month: number; income: number; expenses: number; saved: number; balance: number }
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
const totalSaved = computed(() =>
  report.value?.months.reduce((s, m) => s + (m.saved ?? 0), 0) ?? 0,
)
const yearBalance = computed(() => totalIncome.value - totalExpenses.value - totalSaved.value)

// Poupança = guardado em metas + sobra de caixa, sobre a receita
const savingsRate = computed(() =>
  totalIncome.value > 0
    ? Math.round(((totalIncome.value - totalExpenses.value) / totalIncome.value) * 100)
    : 0
)

const monthsWithData = computed(() =>
  report.value?.months.filter((m) => m.income > 0 || m.expenses > 0 || (m.saved ?? 0) > 0).length ?? 0,
)

const avgMonthlyExpenses = computed(() =>
  monthsWithData.value > 0 ? totalExpenses.value / monthsWithData.value : 0,
)

const worstMonth = computed(() => {
  if (!report.value) return null
  const m = [...report.value.months].sort((a, b) => b.expenses - a.expenses)[0]
  return m ? { name: MONTH_FULL[(m.month - 1)], expenses: m.expenses } : null
})

// ── Monthly table with deltas ─────────────────────────────────────────────────

const monthsWithDelta = computed<Array<MonthEntry & { delta: number | null }>>(() => {
  if (!report.value) return []
  return report.value.months
    .map((m, i) => ({
      ...m,
      delta: i === 0 ? null : m.expenses - (report.value!.months[i - 1]?.expenses ?? 0),
    }))
    // Meses sem movimento são ruído — só mostrar a partir do primeiro mês com dados
    .filter((m) => m.income > 0 || m.expenses > 0 || (m.saved ?? 0) > 0)
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
          backgroundColor: hsl('--success', 0.7),
          borderColor: hsl('--success'),
          borderWidth: 1,
          borderRadius: 4,
        },
        {
          label: 'Despesas',
          data: expenseData,
          backgroundColor: hsl('--destructive', 0.7),
          borderColor: hsl('--destructive'),
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
          backgroundColor: hsl('--card'),
          borderColor: hsl('--border'),
          borderWidth: 1,
          padding: 10,
          titleColor: hsl('--foreground'),
          bodyColor: hsl('--muted-foreground'),
          callbacks: {
            label: (ctx) => ` ${ctx.dataset.label}: ${formatCurrency(ctx.parsed.y ?? 0)}`,
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: hsl('--muted-foreground', 0.6), font: { size: 11 } },
        },
        y: {
          grid: { color: hsl('--border', 0.4) },
          ticks: {
            color: hsl('--muted-foreground', 0.6),
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

function getCSSVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

function hsl(token: string, alpha = 1): string {
  const val = getCSSVar(token)
  return alpha < 1 ? `hsl(${val} / ${alpha})` : `hsl(${val})`
}
</script>

<template>
  <AppPageContainer>
    <!-- Page header -->
    <div class="flex items-start justify-between mb-6">
      <div>
        <p class="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">
          Finanças
        </p>
        <h1 class="text-[22px] font-semibold tracking-tight text-foreground leading-none mb-1.5">
          Relatório anual
        </h1>
        <p class="text-[13px] text-muted-foreground">
          Resumo de receitas e despesas do ano.
        </p>
      </div>
    </div>



    <!-- Toggle Mensal / Anual — same pattern as FinanceSubNav -->
    <div class="-mx-5 px-5 lg:mx-0 lg:px-0 mb-5 overflow-x-auto scrollbar-none">
      <div class="flex items-center gap-1 w-max border-b border-border">
        <button
          class="relative px-3 h-10 text-[13px] font-medium whitespace-nowrap text-muted-foreground hover:text-foreground transition-colors"
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
    <div class="flex items-center justify-between bg-card rounded-lg px-2 py-1.5 mb-5">
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
      <div class="grid grid-cols-2 gap-3">
        <Skeleton v-for="i in 4" :key="i" class="h-24 rounded-xl" />
      </div>
      <Skeleton class="h-64 rounded-xl" />
    </div>

    <!-- Empty state -->
    <div v-else-if="!report" class="flex flex-col items-center justify-center py-16 text-center">
      <Calendar :size="40" class="text-muted-foreground mb-3" />
      <p class="text-[15px] font-semibold">Sem dados para {{ year }}</p>
      <p class="text-[13px] text-muted-foreground mt-1">Nenhuma transação encontrada neste ano.</p>
    </div>

    <template v-else>
      <!-- Period summary card -->
      <div class="bg-card rounded-lg p-4 mb-5">
        <div class="grid gap-2 text-center" :class="totalSaved > 0 ? 'grid-cols-4' : 'grid-cols-3'">
          <div>
            <p class="text-[10px] text-muted-foreground uppercase tracking-widest">Receitas</p>
            <p class="text-[18px] font-semibold text-success tabular-nums mt-1">{{ formatCurrency(totalIncome) }}</p>
          </div>
          <div>
            <p class="text-[10px] text-muted-foreground uppercase tracking-widest">Gastos</p>
            <p class="text-[18px] font-semibold text-destructive tabular-nums mt-1">{{ formatCurrency(totalExpenses) }}</p>
          </div>
          <div v-if="totalSaved > 0">
            <p class="text-[10px] text-muted-foreground uppercase tracking-widest">Guardado</p>
            <p class="text-[18px] font-semibold text-primary tabular-nums mt-1">{{ formatCurrency(totalSaved) }}</p>
          </div>
          <div>
            <p class="text-[10px] text-muted-foreground uppercase tracking-widest">Sobra</p>
            <p
              class="text-[18px] font-semibold tabular-nums mt-1"
              :class="yearBalance >= 0 ? 'text-success' : 'text-destructive'"
            >
              {{ formatCurrency(yearBalance) }}
            </p>
          </div>
        </div>
        <div class="mt-3 pt-3 border-t border-border grid grid-cols-2 gap-3 text-center">
          <div>
            <p class="text-[10px] text-muted-foreground uppercase tracking-widest">Taxa de poupança</p>
            <p class="text-[15px] font-semibold tabular-nums mt-0.5" :class="savingsRate >= 0 ? 'text-success' : 'text-destructive'">
              {{ savingsRate }}%
            </p>
          </div>
          <div>
            <p class="text-[10px] text-muted-foreground uppercase tracking-widest">Média mensal</p>
            <p class="text-[15px] font-semibold tabular-nums mt-0.5 text-destructive">
              {{ formatCurrency(avgMonthlyExpenses) }}
            </p>
          </div>
        </div>
        <p v-if="worstMonth" class="mt-2 text-[11px] text-muted-foreground text-center">
          Maior despesa: <span class="font-semibold text-foreground">{{ worstMonth.name }}</span>
          &nbsp;·&nbsp;<span class="tabular-nums">{{ formatCurrency(worstMonth.expenses) }}</span>
        </p>
      </div>

      <!-- Chart + Table -->
      <div class="grid grid-cols-1 gap-5 mb-5">

        <!-- Bar chart -->
        <div class="bg-card rounded-xl p-4">
          <p class="text-[12px] font-semibold text-foreground mb-3">Receitas × Despesas por mês</p>
          <div class="relative h-64">
            <canvas ref="chartRef" />
          </div>
        </div>

        <!-- Monthly table -->
        <div class="bg-card rounded-xl overflow-hidden">
          <div class="px-4 py-3 border-b border-border">
            <p class="text-[12px] font-semibold text-foreground">Detalhamento mensal</p>
          </div>
          <div>
            <button
              v-for="m in monthsWithDelta"
              :key="m.month"
              type="button"
              class="w-full px-4 py-3 text-left hover:bg-muted transition-colors border-b border-border"
              @click="goToMonth(m.month)"
            >
              <!-- Row 1: month name + balance -->
              <div class="flex items-center justify-between mb-1">
                <span
                  class="text-[14px] font-semibold"
                  :class="m.month === currentMonth && year === currentYear ? 'text-primary' : 'text-foreground'"
                >
                  {{ MONTH_FULL[m.month - 1] }}
                </span>
                <span
                  class="text-[15px] font-semibold tabular-nums"
                  :class="m.balance >= 0 ? 'text-success' : 'text-destructive'"
                >
                  {{ m.balance >= 0 ? '+' : '' }}{{ formatCurrency(m.balance) }}
                </span>
              </div>
              <!-- Row 2: income + delta -->
              <div class="flex items-center justify-between">
                <span class="text-[12px] tabular-nums text-success">
                  +{{ formatCurrency(m.income) }}
                  <span class="text-muted-foreground ml-0.5">receitas</span>
                </span>
                <span
                  v-if="m.delta !== null"
                  class="text-[11px] tabular-nums"
                  :class="m.delta > 0 ? 'text-destructive' : m.delta < 0 ? 'text-success' : 'text-muted-foreground'"
                >
                  {{ m.delta > 0 ? '↑' : m.delta < 0 ? '↓' : '→' }}{{ formatCurrency(Math.abs(m.delta)) }} vs anterior
                </span>
              </div>
              <!-- Row 3: expenses -->
              <div>
                <span class="text-[12px] tabular-nums text-destructive">
                  -{{ formatCurrency(m.expenses) }}
                  <span class="text-muted-foreground ml-0.5">despesas</span>
                </span>
              </div>
            </button>
          </div>
        </div>

      </div>


    </template>

  </AppPageContainer>
</template>
