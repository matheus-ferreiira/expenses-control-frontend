<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { AppPageContainer } from '@/components/shared'
import FinanceSubNav from '@/features/finance/components/FinanceSubNav.vue'
import { Skeleton } from '@ui/skeleton'
import { ROUTES } from '@/constants/routes'
import {
  ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Wallet, Receipt, PieChart,
  AlertTriangle, Sparkles, CalendarRange,
  ShoppingCart, UtensilsCrossed, Car, Home, Heart, Tv2, Repeat, Tag,
  Zap, Dumbbell, Book, Plane, Baby, PawPrint, Banknote, Briefcase, GraduationCap,
} from 'lucide-vue-next'
import { financeApi } from '@/services/api/finance'
import { formatCurrency } from '@/utils/currency'

const router = useRouter()

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
          backgroundColor: 'hsl(240 5% 8%)',
          borderColor: 'hsl(240 4% 13%)',
          borderWidth: 1,
          titleColor: 'hsl(0 0% 93%)',
          bodyColor: 'hsl(0 0% 60%)',
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

/** Map a category name to a Lucide icon component */
const CATEGORY_ICONS: Record<string, object> = {
  restaurante: UtensilsCrossed, alimentação: UtensilsCrossed, lanche: UtensilsCrossed,
  padaria: UtensilsCrossed, café: UtensilsCrossed, bar: UtensilsCrossed,
  supermercado: ShoppingCart, mercado: ShoppingCart, compras: ShoppingCart,
  transporte: Car, uber: Car, ônibus: Car, combustível: Zap, gasolina: Zap,
  moradia: Home, aluguel: Home, condomínio: Home,
  saúde: Heart, farmácia: Heart, médico: Heart,
  lazer: Tv2, entretenimento: Tv2, cinema: Tv2, streaming: Tv2,
  assinaturas: Repeat, subscriptions: Repeat,
  academia: Dumbbell, esporte: Dumbbell,
  educação: GraduationCap, curso: GraduationCap, livro: Book,
  viagem: Plane, hotel: Plane,
  pets: PawPrint, animais: PawPrint,
  bebê: Baby, filhos: Baby,
  investimento: Banknote, poupança: Banknote,
  trabalho: Briefcase, serviços: Briefcase,
}

function categoryIcon(name: string): object {
  const key = name.toLowerCase().trim()
  for (const [k, icon] of Object.entries(CATEGORY_ICONS)) {
    if (key.includes(k)) return icon as object
  }
  return Tag
}

onMounted(() => load())
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
          Relatório mensal
        </h1>
        <p class="text-[13px] text-muted-foreground/50">
          Resumo de receitas, despesas e categorias do mês.
        </p>
      </div>
    </div>

    <FinanceSubNav />

    <!-- Toggle Mensal / Anual -->
    <div class="flex items-center gap-2 mb-4">
      <span class="text-[12px] font-semibold text-foreground/70 bg-foreground/10 px-3 py-1.5 rounded-full">Mensal</span>
      <button
        type="button"
        class="inline-flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground/60 hover:text-foreground px-3 py-1.5 rounded-full hover:bg-muted/40 transition-colors"
        @click="router.push({ name: ROUTES.FINANCE_REPORTS_YEARLY })"
      >
        <CalendarRange :size="13" />
        Anual
      </button>
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
      <span class="text-[15px] font-semibold text-foreground">{{ monthLabel }}</span>
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
      <div v-for="i in 5" :key="i" class="rounded-lg border border-border/50 bg-card p-3.5 space-y-2">
        <div class="flex justify-between">
          <Skeleton class="h-3 w-24" />
          <Skeleton class="h-3 w-16" />
        </div>
        <Skeleton class="h-1.5 w-full rounded-full" />
      </div>
    </div>

    <!-- Content -->
    <template v-else-if="report">
      <!-- Summary cards -->
      <div class="grid grid-cols-2 gap-3 mb-5">
        <div class="rounded-lg border border-border/50 bg-card p-3.5 flex flex-col gap-2">
          <div class="flex items-center gap-1.5">
            <span class="flex items-center justify-center size-7 rounded-md bg-success/15">
              <TrendingUp :size="13" class="text-success" />
            </span>
            <span class="text-[10px] uppercase tracking-[0.08em] text-muted-foreground/50">Receitas</span>
          </div>
          <p class="text-[20px] font-semibold tabular-nums text-success leading-none">
            {{ formatCurrency(report.income) }}
          </p>
        </div>

        <div class="rounded-lg border border-border/50 bg-card p-3.5 flex flex-col gap-2">
          <div class="flex items-center gap-1.5">
            <span class="flex items-center justify-center size-7 rounded-md bg-destructive/15">
              <TrendingDown :size="13" class="text-destructive" />
            </span>
            <span class="text-[10px] uppercase tracking-[0.08em] text-muted-foreground/50">Despesas</span>
          </div>
          <p class="text-[20px] font-semibold tabular-nums text-destructive leading-none">
            {{ formatCurrency(report.expenses) }}
          </p>
        </div>

        <div class="rounded-lg border border-border/50 bg-card p-3.5 flex flex-col gap-2">
          <div class="flex items-center gap-1.5">
            <span class="flex items-center justify-center size-7 rounded-md bg-muted">
              <Wallet :size="13" class="text-muted-foreground" />
            </span>
            <span class="text-[10px] uppercase tracking-[0.08em] text-muted-foreground/50">Saldo</span>
          </div>
          <p
            class="text-[20px] font-semibold tabular-nums leading-none"
            :class="report.balance >= 0 ? 'text-foreground' : 'text-destructive'"
          >
            {{ formatCurrency(report.balance) }}
          </p>
        </div>

        <div class="rounded-lg border border-border/50 bg-card p-3.5 flex flex-col gap-2">
          <div class="flex items-center gap-1.5">
            <span class="flex items-center justify-center size-7 rounded-md bg-muted">
              <Receipt :size="13" class="text-muted-foreground" />
            </span>
            <span class="text-[10px] uppercase tracking-[0.08em] text-muted-foreground/50">Transações</span>
          </div>
          <p class="text-[20px] font-semibold tabular-nums text-foreground leading-none">
            {{ report.transactions_count }}
          </p>
        </div>
      </div>

      <!-- Donut chart — distribuição por categoria -->
      <div
        v-if="report.expenses_by_category.length > 0"
        class="rounded-lg border border-border/50 bg-card p-4 mb-5"
      >
        <div class="flex items-center gap-2 mb-3">
          <PieChart :size="13" class="text-muted-foreground/50" />
          <p class="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/50">
            Distribuição por categoria
          </p>
        </div>
        <div class="flex items-center gap-4">
          <!-- Donut -->
          <div class="relative h-[150px] w-[150px] shrink-0">
            <canvas ref="canvasRef" />
            <!-- Center text -->
            <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <p class="text-[11px] text-muted-foreground/50">Despesas</p>
              <p class="text-[15px] font-semibold text-foreground tabular-nums">
                {{ formatCurrency(report.expenses) }}
              </p>
            </div>
          </div>
          <!-- Legend -->
          <div class="flex-1 min-w-0 space-y-1.5 overflow-hidden">
            <div
              v-for="cat in report.expenses_by_category.sort((a, b) => b.total - a.total).slice(0, 6)"
              :key="cat.category"
              class="flex items-center gap-2 min-w-0"
            >
              <span class="size-2 rounded-full shrink-0" :style="{ background: cat.color }" />
              <span class="text-[11px] text-foreground/70 truncate flex-1">{{ cat.category }}</span>
              <span class="text-[11px] tabular-nums text-muted-foreground/50 shrink-0">{{ cat.percentage }}%</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Category breakdown with mini-bars -->
      <div v-if="report.expenses_by_category.length > 0">
        <div class="flex items-center justify-between mb-3">
          <p class="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/50">
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
              <span class="flex-1 text-sm truncate">{{ cat.category }}</span>
              <div class="text-right shrink-0">
                <span class="block text-sm tabular-nums font-medium">{{ formatCurrency(cat.total) }}</span>
                <span class="block text-[10.5px] tabular-nums text-muted-foreground/70">{{ cat.percentage }}% do total</span>
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
        <p class="text-sm font-medium text-foreground">Nenhuma despesa registrada</p>
        <p class="text-xs text-muted-foreground mt-0.5">
          Nenhuma transação de despesa em {{ monthLabel }}.
        </p>
      </div>
    </template>

    <!-- Error -->
    <div v-else class="flex flex-col items-center justify-center py-16 text-center">
      <p class="text-sm font-medium text-foreground">Erro ao carregar relatório</p>
      <button
        type="button"
        class="text-[13px] font-medium text-primary underline-offset-2 hover:underline mt-3"
        @click="load"
      >
        Tentar novamente
      </button>
    </div>
  </AppPageContainer>
</template>
