<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { AppPageContainer } from '@/components/shared'
import { Skeleton } from '@ui/skeleton'
import { ROUTES } from '@/constants/routes'
import {
  ChevronLeft, ChevronRight, TrendingUp, PieChart,
  AlertTriangle, Sparkles, Tag,
} from 'lucide-vue-next'
import { financeApi } from '@/services/api/finance'
import { formatCurrency } from '@/utils/currency'
import { useFinanceStore } from '@/stores/finance'
import { findIcon } from '@/lib/icons'

const router = useRouter()
const financeStore = useFinanceStore()

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

const today = new Date()
const year = ref(today.getFullYear())
const month = ref(today.getMonth() + 1)

const loading = ref(false)
const report = ref<{
  year: number
  month: number
  income: number
  expenses: number
  balance: number
  transactions_count: number
  expenses_by_category: Array<{
    category: string
    color: string
    total: number
    count: number
    percentage: number
  }>
} | null>(null)

const monthLabel = computed(() => `${MONTH_NAMES[month.value - 1]} de ${year.value}`)

const isCurrentMonth = computed(() => {
  const now = new Date()
  return year.value === now.getFullYear() && month.value === now.getMonth() + 1
})

// ── Donut chart ──────────────────────────────────────────────────────────────
const canvasRef = ref<HTMLCanvasElement | null>(null)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let chartInstance: any = null

async function buildDonut() {
  if (!canvasRef.value || !report.value?.expenses_by_category?.length) return

  const { Chart, DoughnutController, ArcElement, Tooltip, Legend } = await import('chart.js')
  Chart.register(DoughnutController, ArcElement, Tooltip, Legend)

  if (chartInstance) { chartInstance.destroy(); chartInstance = null }

  const cats = report.value.expenses_by_category.sort((a, b) => b.total - a.total).slice(0, 8)

  chartInstance = new Chart(canvasRef.value, {
    type: 'doughnut',
    data: {
      labels: cats.map((c) => c.category),
      datasets: [{
        data: cats.map((c) => c.total),
        backgroundColor: cats.map((c) => c.color + 'cc'),
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
            label: (ctx) => ` ${ctx.label}: ${formatCurrency(ctx.parsed ?? 0)} (${cats[ctx.dataIndex]?.percentage ?? 0}%)`,
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

async function load() {
  loading.value = true
  try {
    report.value = await financeApi.monthlyReport(year.value, month.value)
  } catch {
    report.value = null
  } finally {
    loading.value = false
  }
}

/** Bar width relative to the largest category spend */
const maxCategoryTotal = computed(() =>
  Math.max(...(report.value?.expenses_by_category.map((c) => c.total) ?? [1]), 1)
)

/** Narrative banner */
const narrative = computed(() => {
  if (!report.value) return null
  const { income, expenses, expenses_by_category } = report.value
  const diff = expenses - income
  const topCat = expenses_by_category[0]?.category ?? null
  if (diff > 0) {
    return {
      tone: 'danger' as const,
      icon: AlertTriangle,
      text: `Em ${monthLabel.value} você gastou ${formatCurrency(diff)} a mais do que recebeu.${topCat ? ` ${topCat} foi o principal fator.` : ''}`,
    }
  }
  if (income > 0 && expenses <= income * 0.8) {
    return {
      tone: 'ok' as const,
      icon: TrendingUp,
      text: `Ótimo mês! Você ficou ${formatCurrency(income - expenses)} abaixo das suas receitas em ${monthLabel.value}.`,
    }
  }
  return {
    tone: 'neutral' as const,
    icon: Sparkles,
    text: `${monthLabel.value} equilibrado. Despesas dentro das receitas em quase todas as categorias.`,
  }
})

const narrativeCls = computed(() => {
  if (!narrative.value) return ''
  if (narrative.value.tone === 'danger') return 'bg-destructive/[0.08] text-destructive/90'
  if (narrative.value.tone === 'ok') return 'bg-success/[0.08] text-success/90'
  return 'bg-muted/50 text-foreground/80'
})

function categoryIcon(categoryName: string): object {
  const cat = financeStore.categories.find((c) => c.name === categoryName)
  if (cat?.icon) {
    const found = findIcon(cat.icon)
    if (found) return found.component as object
  }
  return Tag
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
  load()
})
</script>

<template>
  <AppPageContainer>
    <div class="pb-20">
    <!-- Page header -->
    <div class="flex items-start justify-between mb-6">
      <div>
        <p class="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/80 mb-1.5">
          Finanças
        </p>
        <h1 class="text-[22px] font-semibold tracking-tight text-foreground leading-none mb-1.5">
          Relatório mensal
        </h1>
        <p class="text-[13px] text-muted-foreground/50">
          Resumo de receitas, despesas e categorias do mês.
        </p>
      </div>
    </div>



    <!-- Toggle Mensal / Anual — same pattern as FinanceSubNav -->
    <div class="-mx-5 px-5 lg:mx-0 lg:px-0 mb-5 overflow-x-auto scrollbar-none">
      <div class="flex items-center gap-1 w-max border-b border-border">
        <button class="relative px-3 h-10 text-sm font-medium whitespace-nowrap text-foreground">
          Mensal
          <span class="absolute left-2 right-2 -bottom-px h-[2px] rounded-full bg-primary" />
        </button>
        <button
          class="relative px-3 h-10 text-[13px] font-medium whitespace-nowrap text-muted-foreground hover:text-foreground transition-colors"
          @click="router.push({ name: ROUTES.FINANCE_REPORTS_YEARLY })"
        >
          Anual
        </button>
      </div>
    </div>

    <!-- Month navigator -->
    <div class="flex items-center justify-between bg-card border border-border rounded-lg px-2 py-1.5 mb-5">
      <button
        type="button"
        class="min-w-11 h-11 grid place-items-center rounded-md hover:bg-muted text-muted-foreground active:scale-95 transition-all"
        @click="prevMonth"
      >
        <ChevronLeft :size="18" />
      </button>
      <div class="flex items-center gap-2">
        <span class="text-[15px] font-semibold text-foreground">{{ monthLabel }}</span>
        <span
          v-if="isCurrentMonth"
          class="text-[11px] bg-primary/10 text-primary border border-primary/20 rounded px-2 py-0.5"
        >Mês atual</span>
      </div>
      <button
        type="button"
        class="min-w-11 h-11 grid place-items-center rounded-md hover:bg-muted text-muted-foreground active:scale-95 transition-all"
        @click="nextMonth"
      >
        <ChevronRight :size="18" />
      </button>
    </div>

    <!-- Narrative banner -->
    <div
      v-if="!loading && narrative"
      :class="['flex items-start gap-2.5 rounded-lg px-3.5 py-3 text-[12.5px] leading-snug font-medium mb-5', narrativeCls]"
    >
      <component :is="narrative.icon" :size="16" class="shrink-0 mt-0.5" />
      <span>{{ narrative.text }}</span>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="space-y-3">
      <div class="grid grid-cols-2 gap-3">
        <Skeleton v-for="i in 4" :key="i" class="h-24 rounded-lg" />
      </div>
      <Skeleton class="h-48 w-full rounded-lg mt-4" />
      <Skeleton class="h-4 w-32 mt-4" />
      <div v-for="i in 5" :key="i" class="rounded-lg border border-border bg-card p-3.5 space-y-2">
        <div class="flex justify-between">
          <Skeleton class="h-3 w-24" />
          <Skeleton class="h-3 w-16" />
        </div>
        <Skeleton class="h-1.5 w-full rounded-full" />
      </div>
    </div>

    <!-- Content -->
    <template v-else-if="report">
      <!-- Period summary card -->
      <div class="rounded-lg border border-border bg-card p-4 mb-4">
        <div class="grid grid-cols-3 gap-2 text-center">
          <div>
            <p class="text-[10px] text-muted-foreground uppercase tracking-widest">Receitas</p>
            <p class="text-[18px] font-semibold text-success tabular-nums mt-1">{{ formatCurrency(report.income) }}</p>
          </div>
          <div>
            <p class="text-[10px] text-muted-foreground uppercase tracking-widest">Despesas</p>
            <p class="text-[18px] font-semibold text-destructive tabular-nums mt-1">{{ formatCurrency(report.expenses) }}</p>
          </div>
          <div>
            <p class="text-[10px] text-muted-foreground uppercase tracking-widest">Saldo</p>
            <p
              class="text-[18px] font-semibold tabular-nums mt-1"
              :class="report.balance >= 0 ? 'text-success' : 'text-destructive'"
            >
              {{ formatCurrency(report.balance) }}
            </p>
          </div>
        </div>
        <div class="mt-3 pt-3 border-t border-border/40">
          <p class="text-[11.5px] text-muted-foreground">
            {{ report.transactions_count }} transaç{{ report.transactions_count !== 1 ? 'ões' : 'ão' }} no período
          </p>
        </div>
      </div>

      <!-- Donut chart — distribuição por categoria -->
      <div
        v-if="report.expenses_by_category.length > 0"
        class="rounded-lg border border-border bg-card p-4 mb-4"
      >
        <div class="flex items-center gap-2 mb-3">
          <PieChart :size="13" class="text-muted-foreground/50" />
          <p class="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/50">
            Distribuição por categoria
          </p>
        </div>

        <!-- Donut — full width, tall enough on mobile -->
        <div class="relative h-[240px] w-full">
          <canvas ref="canvasRef" />
          <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <p class="text-[11px] text-muted-foreground/50">Despesas</p>
            <p class="text-[17px] font-semibold text-foreground tabular-nums">
              {{ formatCurrency(report.expenses) }}
            </p>
          </div>
        </div>

        <!-- Legend — below donut, full width -->
        <div class="mt-4">
          <div
            v-for="cat in report.expenses_by_category.slice().sort((a, b) => b.total - a.total).slice(0, 8)"
            :key="cat.category"
            class="flex items-center gap-2.5 h-9"
          >
            <span class="size-2 shrink-0 rounded-full" :style="{ background: cat.color }" />
            <span class="flex-1 text-[13px] text-foreground truncate">{{ cat.category }}</span>
            <span class="text-[13px] text-muted-foreground shrink-0 tabular-nums">{{ cat.percentage }}%</span>
          </div>
        </div>
      </div>

      <!-- Category breakdown with mini-bars -->
      <div v-if="report.expenses_by_category.length > 0">
        <div class="flex items-center justify-between mb-3">
          <p class="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/50">
            Por categoria
          </p>
          <span class="text-[11px] text-muted-foreground/40">
            {{ report.expenses_by_category.length }} categorias
          </span>
        </div>

        <ul class="divide-y divide-border bg-card border border-border rounded-md overflow-hidden">
          <li
            v-for="cat in report.expenses_by_category.slice().sort((a, b) => b.total - a.total)"
            :key="cat.category"
            class="px-4 py-3"
          >
            <div class="flex items-center gap-3">
              <!-- IconSwatch-style -->
              <span
                class="size-7 rounded-lg grid place-items-center shrink-0"
                :style="{ background: cat.color + '22', color: cat.color }"
              >
                <component :is="categoryIcon(cat.category)" :size="14" :stroke-width="1.9" />
              </span>
              <span class="flex-1 text-[13px] text-foreground truncate">{{ cat.category }}</span>
              <div class="text-right shrink-0">
                <span class="block text-[13px] tabular-nums font-medium">{{ formatCurrency(cat.total) }}</span>
                <span class="block text-[12px] tabular-nums text-muted-foreground">{{ cat.percentage }}% do total</span>
              </div>
            </div>
            <!-- Bar using category color -->
            <div class="mt-1.5 ml-10 h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                class="h-full rounded-full transition-all duration-500"
                :style="{
                  width: `${Math.min(100, Math.round((cat.total / maxCategoryTotal) * 100))}%`,
                  background: cat.color,
                }"
              />
            </div>
            <p class="ml-10 mt-1 text-[10.5px] text-muted-foreground tabular-nums">
              {{ cat.count }} transaç{{ cat.count !== 1 ? 'ões' : 'ão' }}
            </p>
          </li>
        </ul>
      </div>

      <!-- Empty expenses -->
      <div
        v-else
        class="flex flex-col items-center justify-center py-12 text-center"
      >
        <PieChart :size="32" class="text-muted-foreground/20 mb-3" />
        <p class="text-[13px] font-medium text-foreground">Nenhuma despesa registrada</p>
        <p class="text-[11px] text-muted-foreground mt-0.5">
          Nenhuma transação de despesa em {{ monthLabel }}.
        </p>
      </div>
    </template>

    <!-- Error -->
    <div v-else class="flex flex-col items-center justify-center py-16 text-center">
      <p class="text-[13px] font-medium text-foreground">Erro ao carregar relatório</p>
      <button
        type="button"
        class="text-[13px] font-medium text-primary underline-offset-2 hover:underline mt-3"
        @click="load"
      >
        Tentar novamente
      </button>
    </div>
    </div>
  </AppPageContainer>
</template>
