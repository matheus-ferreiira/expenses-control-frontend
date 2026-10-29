<script setup lang="ts">
import FinanceSubNav from '@/features/finance/components/FinanceSubNav.vue'
import { computed, onMounted, ref, watch } from 'vue'
import { ChevronRight, Settings, Plus, Copy, Flag } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { AppPageContainer, PageHeader } from '@/components/shared'
import { Skeleton } from '@ui/skeleton'
import MonthNavigator from '@/features/finance/components/MonthNavigator.vue'
import { useFinanceStore } from '@/stores/finance'
import { useToast } from '@/composables/useToast'
import { formatCurrency, formatPercent } from '@/utils/currency'
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

// MonthNavigator (same as Visão Geral) works with "YYYY-MM"
const monthKey = computed(() => `${selectedYear.value}-${String(selectedMonth.value).padStart(2, '0')}`)
const isCurrentMonth = computed(() => selectedYear.value === now.getFullYear() && selectedMonth.value === now.getMonth() + 1)

function selectMonth(key: string) {
  const [y, m] = key.split('-').map(Number)
  selectedYear.value = y!
  selectedMonth.value = m!
}

function resetMonth() {
  selectedYear.value = now.getFullYear()
  selectedMonth.value = now.getMonth() + 1
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

    <PageHeader title="Orçamento" subtitle="Quanto cada categoria pode gastar no mês e quanto já gastou." compact-mobile>
      <template v-if="budget" #actions>
        <button
          type="button"
          class="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg text-[13px] font-medium bg-primary text-primary-foreground hover:brightness-110 transition-colors"
          @click="configSheetOpen = true"
        >
          <Settings class="size-3.5" />
          Configurar
        </button>
      </template>
    </PageHeader>

    <!-- Desktop: month summary on the left, the categories on the right (as on Visão Geral) -->
    <div class="lg:grid lg:grid-cols-[400px_minmax(0,1fr)] xl:grid-cols-[440px_minmax(0,1fr)] lg:gap-5 xl:gap-6 lg:items-start">
      <div class="mb-4 lg:mb-0 space-y-3">
        <!-- Month card -->
        <div class="bg-card rounded-lg p-4">
          <div class="flex justify-center mb-3">
            <MonthNavigator
              :month="monthKey"
              :is-current-month="isCurrentMonth"
              @prev="prevMonth"
              @next="nextMonth"
              @reset="resetMonth"
              @select-month="selectMonth"
            />
          </div>

          <!-- Loading -->
          <div v-if="store.loadingBudget" class="grid grid-cols-3 gap-2">
            <div v-for="i in 3" :key="i" class="flex flex-col items-center gap-1.5">
              <Skeleton class="h-2.5 w-14" />
              <Skeleton class="h-5 w-20" />
            </div>
          </div>

          <template v-else-if="budget">
            <!-- Base · orçado · livre -->
            <div class="grid grid-cols-3 gap-2 text-center">
              <div class="min-w-0">
                <p class="text-[10px] text-muted-foreground uppercase tracking-widest leading-tight h-[26px] flex items-end justify-center">Valor base</p>
                <p class="text-[15px] min-[400px]:text-[17px] font-semibold tabular-nums whitespace-nowrap mt-1">
                  {{ formatCurrency(budget.summary.base_amount) }}
                </p>
              </div>
              <div class="min-w-0">
                <p class="text-[10px] text-muted-foreground uppercase tracking-widest leading-tight h-[26px] flex items-end justify-center">Orçado</p>
                <p class="text-[15px] min-[400px]:text-[17px] font-semibold tabular-nums whitespace-nowrap mt-1">
                  {{ formatCurrency(budget.summary.total_budgeted) }}
                </p>
              </div>
              <div class="min-w-0">
                <p class="text-[10px] text-muted-foreground uppercase tracking-widest leading-tight h-[26px] flex items-end justify-center">Livre</p>
                <p
                  class="text-[15px] min-[400px]:text-[17px] font-semibold tabular-nums whitespace-nowrap mt-1"
                  :class="budget.summary.free_amount >= 0 ? 'text-success' : 'text-destructive'"
                >
                  {{ formatCurrency(budget.summary.free_amount) }}
                </p>
                <p class="text-[10.5px] text-muted-foreground tabular-nums leading-tight mt-0.5">
                  {{ formatPercent(budget.summary.free_percentage) }} da base
                </p>
              </div>
            </div>

            <!-- Spent against what was budgeted -->
            <div class="mt-4">
              <div class="flex items-start justify-between gap-3 text-[11px] text-muted-foreground mb-1.5">
                <span>Gasto do orçado</span>
                <span class="tabular-nums text-right">
                  <span class="font-medium text-foreground whitespace-nowrap">
                    {{ formatCurrency(budget.summary.total_spent) }} de {{ formatCurrency(budget.summary.total_budgeted) }}
                  </span>
                  <span class="block">{{ totalSpentPercent }}%</span>
                </span>
              </div>
              <div class="h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  class="h-full rounded-full transition-all duration-700"
                  :class="totalBarColor"
                  :style="{ width: `${Math.min(100, totalSpentPercent)}%` }"
                />
              </div>
            </div>

            <!-- Where the base goes, and spending the budget does not cover (D-36) -->
            <div class="mt-3 rounded-md bg-muted px-3 py-2 space-y-1 text-[12px]">
              <div class="flex items-center justify-between gap-3">
                <span class="text-muted-foreground">Categorias</span>
                <span class="tabular-nums font-medium whitespace-nowrap">
                  {{ formatCurrency(budget.summary.total_from_categories) }} · {{ formatPercent(budget.summary.categories_percentage) }}
                </span>
              </div>
              <div v-if="hasGoalsItems" class="flex items-center justify-between gap-3">
                <span class="text-muted-foreground">Metas</span>
                <span class="tabular-nums font-medium whitespace-nowrap">
                  {{ formatCurrency(budget.summary.total_from_goals) }} · {{ formatPercent(budget.summary.goals_percentage) }}
                </span>
              </div>
              <div v-if="budget.summary.unbudgeted_spent" class="flex items-center justify-between gap-3">
                <span class="text-muted-foreground">Gasto fora do orçamento</span>
                <span class="tabular-nums font-medium whitespace-nowrap">{{ formatCurrency(budget.summary.unbudgeted_spent) }}</span>
              </div>
              <div v-if="budget.summary.uncategorized_spent" class="flex items-center justify-between gap-3">
                <span class="text-warning">Gasto sem categoria</span>
                <span class="tabular-nums font-medium text-warning whitespace-nowrap">{{ formatCurrency(budget.summary.uncategorized_spent) }}</span>
              </div>
            </div>
          </template>

          <!-- No budget -->
          <p v-else class="text-center text-[13px] text-muted-foreground py-2">
            Nenhum orçamento para {{ monthLabel.toLowerCase() }}.
          </p>
        </div>

        <!-- No budget: copy last month's or create one -->
        <template v-if="!budget && !store.loadingBudget">
          <button
            v-if="previousBudget"
            type="button"
            :disabled="copyingPrevious"
            class="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-card text-left transition-colors hover:bg-muted/50 disabled:opacity-40"
            @click="copyFromPrevious"
          >
            <span class="size-9 rounded-lg bg-muted grid place-items-center shrink-0">
              <Copy :size="16" class="text-primary" />
            </span>
            <div class="flex-1 min-w-0">
              <p class="text-[14px] font-medium text-foreground">Copiar orçamento de {{ prevMonthLabel.toLowerCase() }}</p>
              <p class="text-[12px] text-muted-foreground mt-0.5">Mesmo valor base e mesmas categorias</p>
            </div>
            <ChevronRight :size="14" class="text-muted-foreground shrink-0" />
          </button>

          <button
            type="button"
            class="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-card text-left transition-colors hover:bg-muted/50"
            @click="configSheetOpen = true"
          >
            <span class="size-9 rounded-lg bg-muted grid place-items-center shrink-0">
              <Plus :size="16" class="text-muted-foreground" />
            </span>
            <div class="flex-1 min-w-0">
              <p class="text-[14px] font-medium text-foreground">Criar novo orçamento</p>
              <p class="text-[12px] text-muted-foreground mt-0.5">Definir valor base e limites por categoria</p>
            </div>
            <ChevronRight :size="14" class="text-muted-foreground shrink-0" />
          </button>
        </template>
      </div>

      <div v-if="budget && !store.loadingBudget" class="space-y-3">
        <!-- Categories: one card, rows like the Visão Geral lists -->
        <section class="bg-card rounded-lg overflow-hidden">
          <div class="flex items-center justify-between gap-3 px-4 py-3 border-b border-border">
            <p class="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Categorias</p>
            <span class="text-[11px] text-muted-foreground">
              {{ budget.items.length }} categoria{{ budget.items.length !== 1 ? 's' : '' }}
            </span>
          </div>
          <ul class="divide-y divide-border">
            <li v-for="item in budget.items" :key="item.category_id" class="px-4 py-2.5">
              <div class="flex items-center gap-3">
                <span
                  class="size-8 rounded-lg grid place-items-center shrink-0"
                  :style="{ background: (item.category_color ?? '#888888') + '26', color: item.category_color ?? '#888888' }"
                >
                  <component
                    v-if="item.category_icon && findIcon(item.category_icon)"
                    :is="findIcon(item.category_icon)!.component"
                    :size="15"
                    :stroke-width="1.9"
                    aria-hidden="true"
                  />
                  <span v-else class="text-[12px] font-semibold">{{ item.category_name?.charAt(0) ?? '?' }}</span>
                </span>
                <div class="flex-1 min-w-0">
                  <p class="text-[14px] font-medium text-foreground truncate">{{ item.category_name }}</p>
                  <p class="text-[12px] text-muted-foreground tabular-nums truncate mt-0.5">
                    {{ formatCurrency(item.spent) }} de {{ formatCurrency(item.amount) }}
                  </p>
                </div>
                <span
                  class="text-[14px] font-semibold tabular-nums shrink-0"
                  :class="item.status === 'exceeded' ? 'text-destructive' : item.status === 'warning' ? 'text-warning' : 'text-muted-foreground'"
                >
                  {{ Math.round(item.spent_percentage) }}%
                </span>
              </div>
              <div class="mt-2 ml-11 h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  class="h-full rounded-full transition-all duration-700"
                  :class="barColor(item.status)"
                  :style="{ width: `${Math.min(100, item.spent_percentage)}%` }"
                />
              </div>
            </li>
            <li>
              <button
                type="button"
                class="w-full inline-flex items-center justify-center gap-1.5 py-2.5 text-[12px] font-medium text-primary hover:bg-muted/50 transition-colors"
                @click="configSheetOpen = true"
              >
                <Plus :size="14" />
                Adicionar categoria
              </button>
            </li>
          </ul>
        </section>

        <!-- Goals in the budget (read-only) -->
        <section v-if="hasGoalsItems" class="bg-card rounded-lg overflow-hidden">
          <div class="flex items-center justify-between gap-3 px-4 py-3 border-b border-border">
            <p class="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Metas</p>
            <button
              type="button"
              class="inline-flex items-center gap-0.5 text-[12px] font-medium text-primary"
              @click="router.push({ name: ROUTES.FINANCE_GOALS })"
            >
              Ver metas
              <ChevronRight :size="14" />
            </button>
          </div>
          <ul class="divide-y divide-border">
            <li v-for="goalItem in budget.goals_items" :key="goalItem.id" class="flex items-center gap-3 px-4 py-2.5">
              <span
                class="size-8 rounded-lg grid place-items-center shrink-0"
                :style="{ background: (goalItem.color ?? '#34d399') + '26', color: goalItem.color ?? '#34d399' }"
              >
                <Flag :size="15" :stroke-width="1.9" aria-hidden="true" />
              </span>
              <div class="flex-1 min-w-0">
                <p class="text-[14px] font-medium text-foreground truncate">{{ goalItem.name }}</p>
                <p class="text-[12px] text-muted-foreground tabular-nums mt-0.5">{{ formatCurrency(goalItem.amount) }} por mês</p>
              </div>
              <span class="text-[14px] font-semibold tabular-nums text-muted-foreground shrink-0">
                {{ formatPercent(goalItem.percentage) }}
              </span>
            </li>
          </ul>
        </section>
      </div>
    </div>
  </AppPageContainer>

  <BudgetConfigSheet
    v-model:open="configSheetOpen"
    :month="selectedMonth"
    :year="selectedYear"
    :budget="budget"
    @saved="(b) => { store.currentBudget = b }"
  />
</template>
