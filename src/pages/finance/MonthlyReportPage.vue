<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { AppPageContainer } from '@/components/shared'
import FinanceSubNav from '@/features/finance/components/FinanceSubNav.vue'
import { Skeleton } from '@ui/skeleton'
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Wallet, Receipt } from 'lucide-vue-next'
import { financeApi } from '@/services/api/finance'
import { formatCurrency } from '@/utils/currency'

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

const today = new Date()
const year = ref(today.getFullYear())
const month = ref(today.getMonth() + 1) // 1-indexed

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

/** Bar color by percentage */
function barColor(pct: number): string {
  if (pct < 50) return 'bg-success'
  if (pct < 75) return 'bg-warning'
  return 'bg-destructive'
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

    <!-- Month navigator -->
    <div class="flex items-center justify-between mb-5">
      <button
        type="button"
        class="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-accent/40 transition-colors text-muted-foreground hover:text-foreground"
        @click="prevMonth"
      >
        <ChevronLeft :size="16" />
      </button>
      <span class="text-[14px] font-semibold text-foreground">{{ monthLabel }}</span>
      <button
        type="button"
        class="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-accent/40 transition-colors text-muted-foreground hover:text-foreground"
        @click="nextMonth"
      >
        <ChevronRight :size="16" />
      </button>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="space-y-3">
      <div class="grid grid-cols-2 gap-3">
        <Skeleton v-for="i in 4" :key="i" class="h-24 rounded-lg" />
      </div>
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
      <div class="grid grid-cols-2 gap-3 mb-6">
        <!-- Income -->
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

        <!-- Expenses -->
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

        <!-- Balance -->
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

        <!-- Transactions count -->
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

      <!-- Expenses by category -->
      <div v-if="report.expenses_by_category.length > 0">
        <div class="flex items-center justify-between mb-3">
          <p class="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/50">
            Despesas por categoria
          </p>
          <span class="text-[11px] text-muted-foreground/40">
            {{ report.expenses_by_category.length }} categorias
          </span>
        </div>

        <div class="space-y-2">
          <div
            v-for="cat in report.expenses_by_category.sort((a, b) => b.total - a.total)"
            :key="cat.category"
            class="rounded-lg border border-border/50 bg-card p-3.5"
          >
            <div class="flex items-start justify-between mb-2">
              <div class="flex items-center gap-2 min-w-0">
                <span
                  class="size-2.5 rounded-full shrink-0 mt-0.5"
                  :style="{ background: cat.color }"
                />
                <div class="min-w-0">
                  <p class="text-[13px] font-medium text-foreground truncate">{{ cat.category }}</p>
                  <p class="text-[11px] text-muted-foreground/50">
                    {{ cat.count }} transaç{{ cat.count !== 1 ? 'ões' : 'ão' }}
                  </p>
                </div>
              </div>
              <div class="text-right shrink-0 ml-3">
                <p class="text-[14px] font-semibold tabular-nums text-foreground">
                  {{ formatCurrency(cat.total) }}
                </p>
                <p class="text-[10px] text-muted-foreground/40 tabular-nums">
                  {{ cat.percentage }}% do total
                </p>
              </div>
            </div>

            <!-- Progress bar -->
            <div class="h-1.5 bg-muted/60 rounded-full overflow-hidden">
              <div
                class="h-full rounded-full transition-all"
                :class="barColor(cat.percentage)"
                :style="{ width: `${Math.min(cat.percentage, 100)}%` }"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Empty expenses -->
      <div
        v-else
        class="flex flex-col items-center justify-center py-12 text-center"
      >
        <p class="text-sm font-medium text-foreground">Nenhuma despesa registrada</p>
        <p class="text-xs text-muted-foreground mt-0.5">
          Nenhuma transação de despesa em {{ monthLabel }}.
        </p>
      </div>
    </template>

    <!-- Error / null -->
    <div
      v-else
      class="flex flex-col items-center justify-center py-16 text-center"
    >
      <p class="text-sm font-medium text-foreground">Erro ao carregar relatório</p>
      <p class="text-xs text-muted-foreground mt-0.5 mb-4">Tente novamente.</p>
      <button
        type="button"
        class="text-[13px] font-medium text-primary underline-offset-2 hover:underline"
        @click="load"
      >
        Tentar novamente
      </button>
    </div>
  </AppPageContainer>
</template>
