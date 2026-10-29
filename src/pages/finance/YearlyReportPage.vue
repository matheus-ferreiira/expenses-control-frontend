<script setup lang="ts">
import FinanceSubNav from '@/features/finance/components/FinanceSubNav.vue'
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { AppPageContainer, EmptyState, PageHeader } from '@/components/shared'
import { Button } from '@ui/button'
import { Skeleton } from '@ui/skeleton'
import { AlertTriangle, BarChart3, Calendar, CheckCircle2, ChevronLeft, ChevronRight, PiggyBank } from 'lucide-vue-next'
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
  const viewed = year.value
  try {
    const r = await financeApi.yearlyReport(viewed)
    if (year.value === viewed) report.value = r
  } catch {
    if (year.value === viewed) report.value = null
  } finally {
    if (year.value === viewed) loading.value = false
  }
}

function prevYear() { year.value--; load() }
function nextYear() { year.value++; load() }
function resetYear() { year.value = currentYear; load() }

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
/** Entrou − saiu, as on Visão Geral and the monthly report: money put away is shown apart, not subtracted */
const yearLeftover = computed(() => Math.round((totalIncome.value - totalExpenses.value) * 100) / 100)

const hasData = computed(() =>
  report.value?.months.some((m) => m.income > 0 || m.expenses > 0 || (m.saved ?? 0) > 0) ?? false,
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
  return m && m.expenses > 0 ? { name: MONTH_FULL[(m.month - 1)], expenses: m.expenses } : null
})

/** Same status sentences as the Visão Geral month card (the old "taxa de poupança" read -2335% on small incomes) */
const status = computed<{ tone: 'ok' | 'danger'; text: string } | null>(() => {
  if (!hasData.value) return null
  if (yearLeftover.value >= 0) {
    return { tone: 'ok', text: totalIncome.value > 0 ? `Sobrou ${Math.round((yearLeftover.value / totalIncome.value) * 100)}% do que entrou` : `Sobrou ${formatCurrency(yearLeftover.value)}` }
  }
  return { tone: 'danger', text: `Saiu ${formatCurrency(-yearLeftover.value)} a mais do que entrou` }
})

// ── Months with deltas ────────────────────────────────────────────────────────

const monthsWithDelta = computed<Array<MonthEntry & { leftover: number; delta: number | null }>>(() => {
  if (!report.value) return []
  return report.value.months
    .map((m, i) => ({
      ...m,
      leftover: Math.round((m.income - m.expenses) * 100) / 100,
      delta: i === 0 ? null : m.expenses - (report.value!.months[i - 1]?.expenses ?? 0),
    }))
    // Months without movement are noise
    .filter((m) => m.income > 0 || m.expenses > 0 || (m.saved ?? 0) > 0)
})

// ── Chart ─────────────────────────────────────────────────────────────────────

function destroyChart() {
  if (chartInstance) {
    (chartInstance as { destroy: () => void }).destroy()
    chartInstance = null
  }
}

/** Axis label: "R$ 2,5k" — whole thousands repeated labels ("R$ 3k, R$ 3k, R$ 2k…") */
function axisMoney(v: number): string {
  if (Math.abs(v) < 1000) return `R$ ${Math.round(v)}`
  return `R$ ${(v / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}k`
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
        legend: { display: true, position: 'top', labels: { boxWidth: 12, font: { size: 11 }, color: hsl('--muted-foreground') } },
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
          ticks: { color: hsl('--muted-foreground'), font: { size: 11 } },
        },
        y: {
          grid: { color: hsl('--border') },
          ticks: {
            color: hsl('--muted-foreground'),
            font: { size: 11 },
            maxTicksLimit: 6,
            callback: (v) => axisMoney(Number(v)),
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
    <FinanceSubNav />
    <PageHeader title="Relatório anual" subtitle="Resumo de receitas e despesas do ano." compact-mobile />

    <!-- Mensal / Anual: segmented toggle, as on Visão Geral -->
    <div class="flex gap-1 rounded-lg bg-muted p-1 mb-4 lg:w-[400px] xl:w-[440px]" role="group" aria-label="Período do relatório">
      <button
        type="button"
        aria-pressed="false"
        class="flex-1 h-8 rounded-md text-[12px] font-medium text-muted-foreground hover:text-foreground transition-colors"
        @click="router.push({ name: ROUTES.FINANCE_REPORTS })"
      >
        Mensal
      </button>
      <button type="button" aria-pressed="true" class="flex-1 h-8 rounded-md text-[12px] bg-primary/15 text-primary font-semibold">
        Anual
      </button>
    </div>

    <!-- Desktop: year summary on the left, chart and months on the right -->
    <div class="lg:grid lg:grid-cols-[400px_minmax(0,1fr)] xl:grid-cols-[440px_minmax(0,1fr)] lg:gap-5 xl:gap-6 lg:items-start">
      <div class="mb-4 lg:mb-0">
        <div class="bg-card rounded-lg p-4">
          <!-- Year navigator: same controls as MonthNavigator -->
          <div class="flex flex-col items-center mb-3">
            <div class="flex items-center gap-1">
              <Button variant="ghost" size="icon" class="min-h-[44px] min-w-[44px]" aria-label="Ano anterior" @click="prevYear">
                <ChevronLeft :size="14" />
              </Button>
              <span class="min-w-28 text-center text-[13px] font-medium text-foreground tabular-nums">{{ year }}</span>
              <Button variant="ghost" size="icon" class="min-h-[44px] min-w-[44px]" aria-label="Próximo ano" @click="nextYear">
                <ChevronRight :size="14" />
              </Button>
              <Button v-if="year !== currentYear" variant="ghost" size="sm" class="min-h-[44px] px-2 text-[11px] text-muted-foreground ml-1" @click="resetYear">
                Este ano
              </Button>
            </div>
            <p class="text-[11px] text-muted-foreground -mt-0.5">
              {{ year === currentYear ? 'Em andamento' : year < currentYear ? 'Ano fechado' : 'Previsão' }}
            </p>
          </div>

          <div v-if="loading" class="grid grid-cols-3 gap-2">
            <div v-for="i in 3" :key="i" class="flex flex-col items-center gap-1.5">
              <Skeleton class="h-2.5 w-14" />
              <Skeleton class="h-5 w-20" />
            </div>
          </div>

          <template v-else-if="report && hasData">
            <div class="grid grid-cols-3 gap-2 text-center">
              <div class="min-w-0">
                <p class="text-[10px] text-muted-foreground uppercase tracking-widest leading-tight h-[26px] flex items-end justify-center">Receitas</p>
                <p class="text-[15px] min-[400px]:text-[17px] font-semibold tabular-nums whitespace-nowrap mt-1 text-success">{{ formatCurrency(totalIncome) }}</p>
              </div>
              <div class="min-w-0">
                <p class="text-[10px] text-muted-foreground uppercase tracking-widest leading-tight h-[26px] flex items-end justify-center">Despesas</p>
                <p class="text-[15px] min-[400px]:text-[17px] font-semibold tabular-nums whitespace-nowrap mt-1 text-destructive">{{ formatCurrency(totalExpenses) }}</p>
              </div>
              <div class="min-w-0">
                <p class="text-[10px] text-muted-foreground uppercase tracking-widest leading-tight h-[26px] flex items-end justify-center">Sobrou</p>
                <p
                  class="text-[15px] min-[400px]:text-[17px] font-semibold tabular-nums whitespace-nowrap mt-1"
                  :class="yearLeftover < 0 ? 'text-destructive' : 'text-foreground'"
                >{{ formatCurrency(yearLeftover) }}</p>
              </div>
            </div>

            <div
              v-if="status"
              class="mt-3 flex items-center gap-2 rounded-md bg-muted px-2.5 py-2 text-[12px] font-medium"
              :class="status.tone === 'danger' ? 'text-destructive' : 'text-success'"
            >
              <CheckCircle2 v-if="status.tone === 'ok'" :size="14" class="shrink-0" />
              <AlertTriangle v-else :size="14" class="shrink-0" />
              <span class="leading-snug">{{ status.text }}</span>
            </div>

            <div class="mt-3 rounded-md bg-muted px-3 py-2 space-y-1 text-[12px]">
              <div class="flex items-center justify-between gap-3">
                <span class="text-muted-foreground">Despesa média por mês</span>
                <span class="tabular-nums font-medium whitespace-nowrap">{{ formatCurrency(avgMonthlyExpenses) }}</span>
              </div>
              <div v-if="worstMonth" class="flex items-center justify-between gap-3">
                <span class="text-muted-foreground">Mês com mais despesa</span>
                <span class="tabular-nums font-medium whitespace-nowrap">{{ worstMonth.name }} · {{ formatCurrency(worstMonth.expenses) }}</span>
              </div>
            </div>

            <div v-if="totalSaved !== 0" class="mt-3 pt-3 border-t border-border flex items-center justify-between gap-3">
              <span class="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground">
                <PiggyBank :size="14" class="text-primary" />
                Guardado no ano
              </span>
              <span class="text-[14px] font-semibold tabular-nums text-primary">{{ formatCurrency(totalSaved) }}</span>
            </div>
          </template>

          <p v-else class="text-center text-[13px] text-muted-foreground py-2">Nenhuma transação em {{ year }}.</p>
        </div>
      </div>

      <div v-if="loading" class="bg-card rounded-lg p-4">
        <Skeleton class="h-2.5 w-32 mb-3" />
        <Skeleton class="h-56 w-full" />
      </div>

      <EmptyState v-else-if="!report || !hasData" :icon="Calendar" :title="`Sem dados para ${year}`" description="Nenhuma transação encontrada neste ano." />

      <div v-else class="space-y-3">
        <!-- Bar chart -->
        <div class="bg-card rounded-lg p-4">
          <p class="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
            <BarChart3 :size="14" class="shrink-0" />
            Receitas e despesas por mês
          </p>
          <div class="relative h-56">
            <canvas ref="chartRef" />
          </div>
        </div>

        <!-- Months: a row opens that month's report -->
        <section class="bg-card rounded-lg overflow-hidden">
          <div class="flex items-center justify-between gap-3 px-4 py-3 border-b border-border">
            <p class="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Mês a mês</p>
            <span class="text-[11px] text-muted-foreground">{{ monthsWithDelta.length }} {{ monthsWithDelta.length === 1 ? 'mês' : 'meses' }}</span>
          </div>
          <ul class="divide-y divide-border">
            <li v-for="m in monthsWithDelta" :key="m.month">
              <button
                type="button"
                class="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-muted/50 transition-colors"
                :aria-label="`Ver relatório de ${MONTH_FULL[m.month - 1]}`"
                @click="goToMonth(m.month)"
              >
                <div class="flex-1 min-w-0">
                  <p class="text-[14px] font-medium text-foreground">
                    {{ MONTH_FULL[m.month - 1] }}
                    <span v-if="m.month === currentMonth && year === currentYear" class="text-[11px] font-normal text-muted-foreground"> · em andamento</span>
                  </p>
                  <p class="text-[12px] tabular-nums mt-0.5">
                    <span class="text-success">+{{ formatCurrency(m.income) }}</span>
                    <span class="text-muted-foreground"> · </span>
                    <span class="text-destructive">−{{ formatCurrency(m.expenses) }}</span>
                  </p>
                </div>
                <div class="text-right shrink-0">
                  <p class="text-[14px] font-semibold tabular-nums" :class="m.leftover < 0 ? 'text-destructive' : 'text-foreground'">
                    {{ formatCurrency(m.leftover) }}
                  </p>
                  <p
                    v-if="m.delta !== null && m.delta !== 0"
                    class="text-[11px] tabular-nums mt-0.5"
                    :class="m.delta > 0 ? 'text-destructive' : 'text-success'"
                  >
                    {{ m.delta > 0 ? '↑' : '↓' }} {{ formatCurrency(Math.abs(m.delta)) }} em despesas
                  </p>
                </div>
                <ChevronRight :size="14" class="text-muted-foreground shrink-0" aria-hidden="true" />
              </button>
            </li>
          </ul>
        </section>
      </div>
    </div>
  </AppPageContainer>
</template>
