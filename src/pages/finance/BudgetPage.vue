<script setup lang="ts">
import FinanceSubNav from '@/features/finance/components/FinanceSubNav.vue'
import { computed, onMounted, ref, watch } from 'vue'
import { ChevronLeft, ChevronRight, Settings, Plus, Copy, Flag } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { AppPageContainer } from '@/components/shared'
import { useFinanceStore } from '@/stores/finance'
import { useToast } from '@/composables/useToast'
import { formatCurrency } from '@/utils/currency'
import { findIcon } from '@/lib/icons'
import { ROUTES } from '@/constants/routes'
import type { Budget } from '@/types/finance'
import BudgetConfigSheet from '@/features/finance/components/BudgetConfigSheet.vue'

const store = useFinanceStore()
const toast = useToast()
const router = useRouter()

const now = new Date()
const selectedMonth = ref(now.getMonth() + 1)
const selectedYear = ref(now.getFullYear())

const configSheetOpen = ref(false)
const previousBudget = ref<Budget | null>(null)
const loadingPrevious = ref(false)
const copyingPrevious = ref(false)

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

const monthLabel = computed(() =>
  `${MONTH_NAMES[selectedMonth.value - 1]} de ${selectedYear.value}`,
)

const prevMonthLabel = computed(() => {
  const d = new Date(selectedYear.value, selectedMonth.value - 2, 1)
  return `${MONTH_NAMES[d.getMonth()]} de ${d.getFullYear()}`
})

function prevMonth() {
  if (selectedMonth.value === 1) {
    selectedMonth.value = 12
    selectedYear.value--
  } else {
    selectedMonth.value--
  }
}

function nextMonth() {
  if (selectedMonth.value === 12) {
    selectedMonth.value = 1
    selectedYear.value++
  } else {
    selectedMonth.value++
  }
}

async function loadBudget() {
  await store.fetchBudget(selectedMonth.value, selectedYear.value)
}

async function loadPreviousBudget() {
  loadingPrevious.value = true
  try {
    previousBudget.value = await (await import('@/services/api/finance')).financeApi.budgets.getPrevious(
      selectedMonth.value,
      selectedYear.value,
    )
  } catch {
    previousBudget.value = null
  } finally {
    loadingPrevious.value = false
  }
}

watch([selectedMonth, selectedYear], () => {
  store.currentBudget = null
  loadBudget()
  loadPreviousBudget()
})

onMounted(async () => {
  if (!store.categories.length) await store.fetchCategories()
  if (!store.goals.length) store.fetchGoals()
  await Promise.all([loadBudget(), loadPreviousBudget()])
})

async function copyFromPrevious() {
  if (!previousBudget.value || copyingPrevious.value) return
  copyingPrevious.value = true
  try {
    await store.createBudget({
      month: selectedMonth.value,
      year: selectedYear.value,
      base_amount: previousBudget.value.base_amount,
      items: previousBudget.value.items.map((i) => ({
        category_id: i.category_id,
        amount: i.amount,
        percentage: i.percentage,
      })),
    })
    toast.success(`Orçamento copiado de ${prevMonthLabel.value}`)
  } catch {
    toast.error('Erro ao copiar orçamento')
  } finally {
    copyingPrevious.value = false
  }
}

const budget = computed(() => store.currentBudget)

function barColor(status: string): string {
  if (status === 'exceeded') return 'bg-destructive'
  if (status === 'warning') return 'bg-warning'
  return 'bg-primary'
}

const totalSpentPercent = computed(() => {
  if (!budget.value) return 0
  const { total_budgeted, total_spent } = budget.value.summary
  if (total_budgeted <= 0) return 0
  return Math.min(100, Math.round((total_spent / total_budgeted) * 100))
})

const totalBarColor = computed(() => {
  if (totalSpentPercent.value >= 100) return 'bg-destructive'
  if (totalSpentPercent.value >= 70) return 'bg-warning'
  return 'bg-primary'
})

const hasGoalsItems = computed(() =>
  (budget.value?.goals_items?.length ?? 0) > 0,
)
</script>

<template>
  <AppPageContainer>
    <FinanceSubNav />

    <!-- Header -->
    <div class="flex flex-col gap-0.5 mb-4 pb-3 border-b border-border">
      <p class="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground">
        Finanças
      </p>
      <h1 class="text-[22px] font-semibold leading-tight tracking-tight text-foreground">
        Orçamento
      </h1>
      <p class="text-[12px] text-muted-foreground leading-relaxed">
        Controle de gastos por categoria
      </p>
    </div>

    <!-- Month nav + summary card -->
    <div class="bg-card rounded-lg p-4 mb-4">
      <!-- Month nav -->
      <div class="flex items-center justify-between mb-4">
        <button
          type="button"
          class="min-w-11 h-11 -m-1.5 grid place-items-center rounded-md hover:bg-muted text-muted-foreground active:scale-95 transition-all"
          @click="prevMonth"
        >
          <ChevronLeft :size="20" />
        </button>
        <span class="text-[15px] font-semibold">{{ monthLabel }}</span>
        <button
          type="button"
          class="min-w-11 h-11 -m-1.5 grid place-items-center rounded-md hover:bg-muted text-muted-foreground active:scale-95 transition-all"
          @click="nextMonth"
        >
          <ChevronRight :size="20" />
        </button>
      </div>

      <!-- KPIs — 3 colunas -->
      <template v-if="budget">
        <div class="grid grid-cols-3 gap-2 text-center mb-4">
          <div>
            <p class="text-[10px] text-muted-foreground uppercase tracking-widest">Valor base</p>
            <p class="text-[17px] font-semibold tabular-nums mt-1">
              {{ formatCurrency(budget.summary.base_amount) }}
            </p>
          </div>
          <div>
            <p class="text-[10px] text-muted-foreground uppercase tracking-widest">Orçado</p>
            <p class="text-[17px] font-semibold tabular-nums mt-1">
              {{ formatCurrency(budget.summary.total_budgeted) }}
            </p>
          </div>
          <div>
            <p class="text-[10px] text-muted-foreground uppercase tracking-widest">Livre</p>
            <p
              class="text-[17px] font-semibold tabular-nums mt-1"
              :class="budget.summary.free_amount >= 0 ? 'text-success' : 'text-destructive'"
            >
              {{ formatCurrency(budget.summary.free_amount) }}
            </p>
          </div>
        </div>

        <!-- Barra de uso total -->
        <div class="mt-1">
          <div class="flex items-center justify-between mb-1.5">
            <p class="text-[11px] uppercase tracking-widest text-muted-foreground">Uso do orçamento</p>
            <p class="text-[11px] text-muted-foreground tabular-nums">
              {{ formatCurrency(budget.summary.total_spent) }} de {{ formatCurrency(budget.summary.total_budgeted) }}
              · {{ totalSpentPercent }}%
            </p>
          </div>
          <div class="h-1 rounded-full bg-muted overflow-hidden">
            <div
              class="h-full rounded-full transition-all duration-700"
              :class="totalBarColor"
              :style="{ width: `${Math.min(100, totalSpentPercent)}%` }"
            />
          </div>
          <p class="text-[11px] text-muted-foreground mt-1">
            {{ budget.summary.free_percentage.toFixed(1) }}% do total ainda disponível
          </p>
        </div>

        <!-- Resumo: categorias + metas + livre -->
        <div class="mt-3 pt-3 border-t border-border space-y-1">
          <div class="flex items-center justify-between text-[11px]">
            <span class="text-muted-foreground">Categorias</span>
            <span class="text-muted-foreground tabular-nums">
              {{ formatCurrency(budget.summary.total_from_categories) }}
              · {{ budget.summary.categories_percentage.toFixed(1) }}%
            </span>
          </div>
          <div v-if="hasGoalsItems" class="flex items-center justify-between text-[11px]">
            <span class="text-muted-foreground">Metas</span>
            <span class="text-muted-foreground tabular-nums">
              {{ formatCurrency(budget.summary.total_from_goals) }}
              · {{ budget.summary.goals_percentage.toFixed(1) }}%
            </span>
          </div>
          <div class="flex items-center justify-between text-[11px]">
            <span class="text-success">Livre</span>
            <span class="text-success tabular-nums font-medium">
              {{ formatCurrency(budget.summary.free_amount) }}
              · {{ budget.summary.free_percentage.toFixed(1) }}%
            </span>
          </div>
        </div>
      </template>

      <!-- Sem orçamento -->
      <template v-else-if="!store.loadingBudget">
        <div class="text-center py-2">
          <p class="text-[13px] text-muted-foreground mb-1">
            Nenhum orçamento para {{ monthLabel }}
          </p>
        </div>
      </template>

      <!-- Loading -->
      <template v-else>
        <div class="space-y-2 py-2">
          <div class="h-4 w-32 rounded bg-muted animate-pulse mx-auto" />
          <div class="h-3 w-24 rounded bg-muted animate-pulse mx-auto" />
        </div>
      </template>
    </div>

    <!-- Estado vazio — opções -->
    <template v-if="!budget && !store.loadingBudget">
      <div class="space-y-2 mb-4">
        <button
          v-if="previousBudget"
          type="button"
          :disabled="copyingPrevious"
          class="w-full flex items-center gap-3 px-4 py-3.5 rounded-lg bg-card text-left transition-colors hover:bg-muted active:scale-[0.99]"
          @click="copyFromPrevious"
        >
          <span class="size-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
            <Copy :size="18" class="text-primary" />
          </span>
          <div class="flex-1 min-w-0">
            <p class="text-[14px] font-medium text-foreground">Copiar orçamento de {{ prevMonthLabel }}</p>
            <p class="text-[12px] text-muted-foreground mt-0.5">Usar o mesmo valor base e categorias</p>
          </div>
        </button>

        <button
          type="button"
          class="w-full flex items-center gap-3 px-4 py-3.5 rounded-lg bg-card text-left transition-colors hover:bg-muted active:scale-[0.99]"
          @click="configSheetOpen = true"
        >
          <span class="size-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
            <Plus :size="18" class="text-muted-foreground" />
          </span>
          <div class="flex-1 min-w-0">
            <p class="text-[14px] font-medium text-foreground">Criar novo orçamento</p>
            <p class="text-[12px] text-muted-foreground mt-0.5">Definir valor base e limites por categoria</p>
          </div>
        </button>
      </div>
    </template>

    <!-- Listas quando tem orçamento -->
    <template v-else-if="budget">

      <!-- Seção: Categorias -->
      <div class="flex items-center justify-between mb-3">
        <p class="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold">
          Categorias
        </p>
        <button
          type="button"
          class="flex items-center gap-1 text-[12px] text-primary hover:text-primary transition-colors"
          @click="configSheetOpen = true"
        >
          <Settings :size="13" />
          Configurar
        </button>
      </div>

      <div class="space-y-2 mb-5">
        <div
          v-for="item in budget.items"
          :key="item.category_id"
          class="bg-card rounded-lg px-4 py-3"
        >
          <div class="flex items-center gap-3 mb-2">
            <span
              class="size-10 rounded-xl flex items-center justify-center shrink-0"
              :style="{ background: (item.category_color ?? '#888') + '20' }"
            >
              <component
                v-if="item.category_icon && findIcon(item.category_icon)"
                :is="findIcon(item.category_icon)!.component"
                :size="20"
                :style="{ color: item.category_color ?? '#888' }"
              />
              <span v-else class="text-[13px] font-bold" :style="{ color: item.category_color ?? '#888' }">
                {{ item.category_name?.charAt(0) ?? '?' }}
              </span>
            </span>

            <div class="flex-1 min-w-0">
              <p class="text-[14px] font-medium text-foreground truncate">{{ item.category_name }}</p>
              <p class="text-[12px] text-muted-foreground tabular-nums mt-0.5">
                {{ formatCurrency(item.spent) }} / {{ formatCurrency(item.amount) }}
              </p>
            </div>

            <div class="text-right shrink-0">
              <p
                class="text-[13px] font-semibold tabular-nums"
                :class="item.status === 'exceeded' ? 'text-destructive' : item.status === 'warning' ? 'text-warning' : 'text-muted-foreground'"
              >
                {{ item.spent_percentage.toFixed(0) }}%
              </p>
              <span v-if="item.status === 'warning'" class="text-[10px] text-warning">⚠</span>
              <span v-else-if="item.status === 'exceeded'" class="text-[10px] text-destructive">!</span>
            </div>
          </div>

          <div class="h-1 rounded-full bg-muted overflow-hidden">
            <div
              class="h-full rounded-full transition-all duration-700"
              :class="barColor(item.status)"
              :style="{ width: `${Math.min(100, item.spent_percentage)}%` }"
            />
          </div>
        </div>

        <!-- Botão adicionar categoria -->
        <button
          type="button"
          class="w-full flex items-center justify-center gap-2 h-11 rounded-lg border border-dashed border-border text-[13px] text-muted-foreground hover:text-primary transition-colors"
          @click="configSheetOpen = true"
        >
          <Plus :size="16" />
          Adicionar categoria
        </button>
      </div>

      <!-- Seção: Metas (read-only) -->
      <template v-if="hasGoalsItems">
        <div class="flex items-center justify-between mb-3">
          <p class="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold">
            Metas
          </p>
          <button
            type="button"
            class="text-[12px] text-primary hover:text-primary transition-colors"
            @click="router.push({ name: ROUTES.FINANCE_GOALS })"
          >
            Ver metas →
          </button>
        </div>

        <div class="space-y-2">
          <div
            v-for="goalItem in budget.goals_items"
            :key="goalItem.id"
            class="bg-card rounded-lg px-4 py-3 flex items-center gap-3"
          >
            <span
              class="size-10 rounded-xl flex items-center justify-center shrink-0"
              :style="{ background: (goalItem.color ?? '#34d399') + '20' }"
            >
              <Flag :size="20" :style="{ color: goalItem.color ?? '#34d399' }" />
            </span>

            <div class="flex-1 min-w-0">
              <p class="text-[14px] font-medium text-foreground truncate">{{ goalItem.name }}</p>
              <p class="text-[12px] text-muted-foreground tabular-nums mt-0.5">
                {{ formatCurrency(goalItem.amount) }} / mês
              </p>
            </div>

            <p class="text-[13px] font-semibold tabular-nums text-muted-foreground shrink-0">
              {{ goalItem.percentage.toFixed(1) }}%
            </p>
          </div>
        </div>
      </template>

    </template>

  </AppPageContainer>

  <BudgetConfigSheet
    v-model:open="configSheetOpen"
    :month="selectedMonth"
    :year="selectedYear"
    :budget="budget"
    @saved="(b) => { store.currentBudget = b }"
  />
</template>
