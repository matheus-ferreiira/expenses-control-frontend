<script setup lang="ts">
import FinanceSubNav from '@/features/finance/components/FinanceSubNav.vue'
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { AppPageContainer, PageHeader } from '@/components/shared'
import { Skeleton } from '@ui/skeleton'
import { ROUTES } from '@/constants/routes'
import { TrendingUp, PieChart, PiggyBank, AlertTriangle, Sparkles } from 'lucide-vue-next'
import { financeApi } from '@/services/api/finance'
import { formatCurrency, formatPercent } from '@/utils/currency'
import { withAlpha } from '@/utils/color'
import { useFinanceStore } from '@/stores/finance'
import CategoryBreakdownList from '@/features/finance/components/CategoryBreakdownList.vue'
import CategoryTransactionsSheet from '@/features/finance/components/CategoryTransactionsSheet.vue'
import MonthNavigator from '@/features/finance/components/MonthNavigator.vue'
import type { CategoryBreakdownItem } from '@/types/finance'

const router = useRouter()
const route = useRoute()
const financeStore = useFinanceStore()

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

const today = new Date()
const year = ref(today.getFullYear())
const month = ref(today.getMonth() + 1)

const loading = ref(false)
const report = ref<Awaited<ReturnType<typeof financeApi.monthlyReport>> | null>(null)

const monthLabel = computed(() => `${MONTH_NAMES[month.value - 1]} de ${year.value}`)
const monthKey = computed(() => `${year.value}-${String(month.value).padStart(2, '0')}`)

/** past = closed month · current = in progress · future = forecast (same reading as Visão Geral) */
const mode = computed<'past' | 'current' | 'future'>(() => {
  const now = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
  return monthKey.value < now ? 'past' : monthKey.value > now ? 'future' : 'current'
})
const modeLabel = computed(() => (mode.value === 'past' ? 'Mês fechado' : mode.value === 'future' ? 'Previsão' : 'Em andamento'))

// ── Donut chart ──────────────────────────────────────────────────────────────
const canvasRef = ref<HTMLCanvasElement | null>(null)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let chartInstance: any = null

const donutCategories = computed(() =>
  (report.value?.expenses_by_category ?? []).slice().sort((a, b) => b.total - a.total).slice(0, 8),
)

async function buildDonut() {
  if (!canvasRef.value || !donutCategories.value.length) return

  const { Chart, DoughnutController, ArcElement, Tooltip, Legend } = await import('chart.js')
  Chart.register(DoughnutController, ArcElement, Tooltip, Legend)

  if (chartInstance) { chartInstance.destroy(); chartInstance = null }

  const cats = donutCategories.value

  chartInstance = new Chart(canvasRef.value, {
    type: 'doughnut',
    data: {
      labels: cats.map((c) => c.category),
      datasets: [{
        data: cats.map((c) => c.total),
        // withAlpha: "#888" + "cc" was an invalid colour and the slice came out black
        backgroundColor: cats.map((c) => withAlpha(c.color, 'cc')),
        borderColor: cats.map((c) => c.color),
        borderWidth: 1.5,
        hoverOffset: 6,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '65%',
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          callbacks: {
            label: (ctx) => ` ${ctx.label}: ${formatCurrency(ctx.parsed ?? 0)} (${formatPercent(cats[ctx.dataIndex]?.percentage ?? 0)})`,
          },
          backgroundColor: hsl('--card'),
          borderColor: hsl('--border'),
          borderWidth: 1,
          titleColor: hsl('--foreground'),
          bodyColor: hsl('--muted-foreground'),
          padding: 10,
        },
      },
    },
  })
}

watch([report, loading], async ([r, l]) => {
  if (!l && r?.expenses_by_category?.length) {
    await nextTick()
    buildDonut()
  }
})

onBeforeUnmount(() => {
  if (chartInstance) { chartInstance.destroy(); chartInstance = null }
})

// ── Nav ──────────────────────────────────────────────────────────────────────
function prevMonth() {
  if (month.value === 1) { month.value = 12; year.value-- }
  else month.value--
  load()
}

function nextMonth() {
  if (month.value === 12) { month.value = 1; year.value++ }
  else month.value++
  load()
}

function selectMonth(key: string) {
  const [y, m] = key.split('-').map(Number)
  year.value = y!
  month.value = m!
  load()
}

function resetMonth() {
  year.value = today.getFullYear()
  month.value = today.getMonth() + 1
  load()
}

async function load() {
  loading.value = true
  const viewed = monthKey.value
  try {
    const r = await financeApi.monthlyReport(year.value, month.value)
    if (monthKey.value === viewed) report.value = r
  } catch {
    if (monthKey.value === viewed) report.value = null
  } finally {
    if (monthKey.value === viewed) loading.value = false
  }
}

// ── Summary: entrou · saiu · sobrou, money put away apart (as on Visão Geral) ──
const columns = computed(() => {
  const r = report.value
  if (!r) return []
  if (mode.value === 'future') {
    const inc = r.income + r.pending_income
    const exp = r.expenses + r.pending_expenses
    const left = Math.round((inc - exp) * 100) / 100
    return [
      { label: 'Receita prevista', value: inc, cls: 'text-success' },
      { label: 'Despesa prevista', value: exp, cls: 'text-destructive' },
      { label: 'Sobra prevista', value: left, cls: left < 0 ? 'text-destructive' : 'text-foreground' },
    ]
  }
  const current = mode.value === 'current'
  const left = Math.round((r.income - r.expenses) * 100) / 100
  return [
    { label: current ? 'Recebido' : 'Receitas', value: r.income, cls: 'text-success' },
    { label: current ? 'Gasto' : 'Despesas', value: r.expenses, cls: 'text-destructive' },
    { label: current ? 'Sobra até hoje' : 'Sobrou', value: left, cls: left < 0 ? 'text-destructive' : 'text-foreground' },
  ]
})

/**
 * Status line: every sentence states its numbers and base (D-35). No judgement the data does not
 * support ("ótimo mês", "principal fator"); partial, future and empty months are said as such.
 */
const narrative = computed(() => {
  if (!report.value) return null
  const { income, expenses, pending_income, pending_expenses, expenses_by_category, transactions_count } = report.value
  const pendingNote = pending_income > 0 || pending_expenses > 0
    ? ` Ainda previstos: +${formatCurrency(pending_income)} e −${formatCurrency(pending_expenses)}.`
    : ''
  if (transactions_count === 0) {
    return { tone: 'neutral' as const, icon: Sparkles, text: `Não há lançamentos em ${monthLabel.value.toLowerCase()}.` }
  }
  if (mode.value === 'future') {
    return { tone: 'neutral' as const, icon: Sparkles, text: `${monthLabel.value} ainda não começou.${pendingNote}` }
  }
  const top = expenses_by_category[0]
  const topNote = top && expenses > 0 ? ` Maior gasto: ${top.category}, ${formatCurrency(top.total)} (${formatPercent(top.percentage)} das despesas).` : ''
  if (mode.value === 'current') {
    return { tone: 'neutral' as const, icon: Sparkles, text: `Até hoje (dia ${today.getDate()}).${pendingNote}${topNote}` }
  }
  const result = Math.round((income - expenses) * 100) / 100
  return {
    tone: result < 0 ? ('danger' as const) : ('ok' as const),
    icon: result < 0 ? AlertTriangle : TrendingUp,
    text: result < 0
      ? `Saiu ${formatCurrency(-result)} a mais do que entrou.${topNote}`
      : `${income > 0 ? `Sobrou ${Math.round((result / income) * 100)}% do que entrou.` : `Sobrou ${formatCurrency(result)}.`}${topNote}`,
  }
})
const narrativeCls = computed(() => {
  if (!narrative.value) return ''
  if (narrative.value.tone === 'danger') return 'text-destructive'
  if (narrative.value.tone === 'ok') return 'text-success'
  return 'text-foreground'
})

const monthSaved = computed(() => (mode.value === 'future' ? report.value?.pending_saved ?? 0 : report.value?.saved ?? 0))

// ── Category drill-down (same sheet as Visão Geral, read-only here) ─────────
const categorySheetOpen = ref(false)
const selectedCategory = ref<CategoryBreakdownItem | null>(null)
function openCategory(category: CategoryBreakdownItem) {
  selectedCategory.value = category
  categorySheetOpen.value = true
}

function getCSSVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

function hsl(token: string, alpha = 1): string {
  const val = getCSSVar(token)
  return alpha < 1 ? `hsl(${val} / ${alpha})` : `hsl(${val})`
}

onMounted(() => {
  if (!financeStore.categories.length) financeStore.fetchCategories()
  // The yearly report opens a month with ?year=&month= (it used to be ignored: always the current month)
  const qy = Number(route.query.year)
  const qm = Number(route.query.month)
  if (Number.isInteger(qy) && qy > 1900 && Number.isInteger(qm) && qm >= 1 && qm <= 12) {
    year.value = qy
    month.value = qm
  }
  load()
})
</script>

<template>
  <AppPageContainer>
    <FinanceSubNav />
    <PageHeader title="Relatório mensal" subtitle="Resumo de receitas, despesas e categorias do mês." compact-mobile />

    <!-- Mensal / Anual: segmented toggle, as on Visão Geral -->
    <div class="flex gap-1 rounded-lg bg-muted p-1 mb-4 lg:w-[400px] xl:w-[440px]" role="group" aria-label="Período do relatório">
      <button type="button" aria-pressed="true" class="flex-1 h-8 rounded-md text-[12px] bg-primary/15 text-primary font-semibold">
        Mensal
      </button>
      <button
        type="button"
        aria-pressed="false"
        class="flex-1 h-8 rounded-md text-[12px] font-medium text-muted-foreground hover:text-foreground transition-colors"
        @click="router.push({ name: ROUTES.FINANCE_REPORTS_YEARLY })"
      >
        Anual
      </button>
    </div>

    <!-- Desktop: summary and donut on the left, categories on the right -->
    <div class="lg:grid lg:grid-cols-[400px_minmax(0,1fr)] xl:grid-cols-[440px_minmax(0,1fr)] lg:gap-5 xl:gap-6 lg:items-start">
      <div class="mb-4 lg:mb-0 space-y-3">
        <!-- Month card -->
        <div class="bg-card rounded-lg p-4">
          <div class="flex flex-col items-center mb-3">
            <MonthNavigator
              :month="monthKey"
              :is-current-month="mode === 'current'"
              @prev="prevMonth"
              @next="nextMonth"
              @reset="resetMonth"
              @select-month="selectMonth"
            />
            <p class="text-[11px] text-muted-foreground -mt-0.5">{{ modeLabel }}</p>
          </div>

          <div v-if="loading" class="grid grid-cols-3 gap-2">
            <div v-for="i in 3" :key="i" class="flex flex-col items-center gap-1.5">
              <Skeleton class="h-2.5 w-14" />
              <Skeleton class="h-5 w-20" />
            </div>
          </div>

          <template v-else-if="report">
            <div class="grid grid-cols-3 gap-2 text-center">
              <div v-for="col in columns" :key="col.label" class="min-w-0">
                <p class="text-[10px] text-muted-foreground uppercase tracking-widest leading-tight h-[26px] flex items-end justify-center">{{ col.label }}</p>
                <p class="text-[15px] min-[400px]:text-[17px] font-semibold tabular-nums whitespace-nowrap mt-1" :class="col.cls">
                  {{ formatCurrency(col.value) }}
                </p>
              </div>
            </div>

            <div
              v-if="narrative"
              class="mt-3 flex items-start gap-2 rounded-md bg-muted px-2.5 py-2 text-[12px] font-medium leading-snug"
              :class="narrativeCls"
            >
              <component :is="narrative.icon" :size="14" class="shrink-0 mt-px" />
              <span>{{ narrative.text }}</span>
            </div>

            <div v-if="monthSaved !== 0" class="mt-3 pt-3 border-t border-border flex items-center justify-between gap-3">
              <span class="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground">
                <PiggyBank :size="14" class="text-primary" />
                {{ mode === 'future' ? 'Guardar no mês (previsto)' : 'Guardado no mês' }}
              </span>
              <span class="text-[14px] font-semibold tabular-nums text-primary">{{ formatCurrency(monthSaved) }}</span>
            </div>

            <p class="text-[11px] text-muted-foreground mt-3">
              {{ report.transactions_count }} transaç{{ report.transactions_count !== 1 ? 'ões' : 'ão' }} no mês
            </p>
          </template>

          <div v-else class="text-center py-2">
            <p class="text-[13px] text-muted-foreground">Erro ao carregar o relatório.</p>
            <button type="button" class="mt-2 text-[12px] font-medium text-primary" @click="load">Tentar novamente</button>
          </div>
        </div>

        <!-- Donut: share of each category in the month's spending -->
        <div v-if="!loading && donutCategories.length" class="bg-card rounded-lg p-4">
          <p class="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
            <PieChart :size="14" class="shrink-0" />
            Distribuição das despesas
          </p>
          <div class="relative h-[200px] w-full">
            <canvas ref="canvasRef" />
            <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <p class="text-[11px] text-muted-foreground">Despesas</p>
              <p class="text-[17px] font-semibold text-foreground tabular-nums">{{ formatCurrency(report?.expenses ?? 0) }}</p>
            </div>
          </div>
          <ul class="mt-3 space-y-1">
            <li v-for="cat in donutCategories" :key="cat.category_id ?? cat.category" class="flex items-center gap-2.5 py-1 text-[12px]">
              <span class="size-2 shrink-0 rounded-full" :style="{ background: cat.color }" />
              <span class="flex-1 text-foreground truncate">{{ cat.category }}</span>
              <span class="text-muted-foreground tabular-nums shrink-0">{{ formatPercent(cat.percentage) }}</span>
            </li>
          </ul>
        </div>
      </div>

      <!-- Categories: same card as Visão Geral; a row opens its transactions -->
      <div v-if="loading" class="bg-card rounded-lg p-4 space-y-3">
        <Skeleton class="h-2.5 w-24" />
        <div v-for="i in 4" :key="i" class="flex items-center gap-3">
          <Skeleton class="size-7 rounded-lg shrink-0" />
          <Skeleton class="h-3 flex-1" />
          <Skeleton class="h-3 w-16" />
        </div>
      </div>
      <CategoryBreakdownList
        v-else-if="report"
        boxed
        selectable
        title="Despesas por categoria"
        :empty-text="`Nenhuma despesa confirmada em ${monthLabel.toLowerCase()}.`"
        :categories="report.expenses_by_category"
        @select="openCategory"
      />
    </div>

    <CategoryTransactionsSheet
      v-model:open="categorySheetOpen"
      :category="selectedCategory"
      type="expense"
      :month="monthKey"
      readonly
    />
  </AppPageContainer>
</template>
