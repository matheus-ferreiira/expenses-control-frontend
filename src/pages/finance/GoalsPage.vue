<script setup lang="ts">
import FinanceSubNav from '@/features/finance/components/FinanceSubNav.vue'
import { computed, onMounted, ref } from 'vue'
import { Archive, ChevronRight, Flag, Plus } from 'lucide-vue-next'
import { AppPageContainer, EmptyState, PageHeader } from '@/components/shared'
import { Skeleton } from '@ui/skeleton'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { useFinanceStore } from '@/stores/finance'
import { useToast } from '@/composables/useToast'
import { formatCurrency } from '@/utils/currency'
import { toISODate } from '@/utils/date'
import type { FinanceGoal } from '@/types/finance'
import GoalFormSheet from '@/features/finance/components/GoalFormSheet.vue'

const store = useFinanceStore()
const toast = useToast()

const formSheetOpen = ref(false)
const editingGoal = ref<FinanceGoal | null>(null)
const recurringDialogOpen = ref(false)
const pendingGoalForRecurring = ref<FinanceGoal | null>(null)

const activeGoals = computed(() => store.goals.filter((g) => g.status === 'active'))

onMounted(async () => {
  await Promise.all([store.fetchGoals(), store.fetchAccounts()])
})

function openNew() {
  editingGoal.value = null
  formSheetOpen.value = true
}

function openEdit(goal: FinanceGoal) {
  editingGoal.value = goal
  formSheetOpen.value = true
}

function onGoalCreated(goal: FinanceGoal, createRecurring: boolean) {
  if (createRecurring) {
    pendingGoalForRecurring.value = goal
    recurringDialogOpen.value = true
  }
}

async function confirmCreateRecurring() {
  if (!pendingGoalForRecurring.value) return
  const goal = pendingGoalForRecurring.value
  // Local date: toISOString() is UTC, so after 21h the contribution landed on the next day (D-30)
  const today = toISODate(new Date())
  // With its own account, a contribution is a transfer INTO it from another account; it used to be an
  // expense debiting the goal account itself, which lowered the progress (D-16).
  const source = store.activeAccounts.find((a) => a.id !== goal.bank_account_id)
  // Aportes suficientes para atingir a meta — a série termina quando ela é alcançada
  const monthsToGoal = Math.max(1, Math.ceil((goal.remaining ?? goal.target_amount) / goal.monthly_contribution))
  try {
    await store.createTransaction({
      description: `Aporte: ${goal.name}`,
      amount: goal.monthly_contribution,
      transaction_date: today,
      is_recurring: true,
      recurrence_config: { frequency: 'monthly', end_type: 'count', count: monthsToGoal },
      ...(goal.bank_account_id && source
        ? { type: 'transfer' as const, account_id: source.id, destination_account_id: goal.bank_account_id }
        : { type: 'expense' as const, account_id: source?.id ?? store.activeAccounts[0]?.id }),
      goal_id: goal.id,
    })
    toast.success(`Aporte mensal criado — ${monthsToGoal} ${monthsToGoal === 1 ? 'mês' : 'meses'} até a meta`)
  } catch {
    toast.error('Erro ao criar transação fixa')
  } finally {
    pendingGoalForRecurring.value = null
    recurringDialogOpen.value = false
  }
}

function cancelRecurring() {
  pendingGoalForRecurring.value = null
  recurringDialogOpen.value = false
}

// Completed and paused goals: collapsed block at the end, like archived accounts
const closedGoals = computed(() => store.goals.filter((g) => g.status !== 'active'))
const showClosed = ref(false)

// Summary of the active goals (the list is complete, not paginated)
const totalSaved = computed(() => activeGoals.value.reduce((s, g) => s + g.current_amount, 0))
const totalRemaining = computed(() => activeGoals.value.reduce((s, g) => s + g.remaining, 0))
const totalMonthly = computed(() => activeGoals.value.reduce((s, g) => s + (g.monthly_contribution ?? 0), 0))

/** Same bar as the Visão Geral cards: green, never the track colour */
function barColor(pct: number): string {
  return pct >= 100 ? 'bg-success' : 'bg-primary'
}
</script>

<template>
  <AppPageContainer>
    <FinanceSubNav />

    <PageHeader title="Metas" subtitle="Quanto você já juntou para cada objetivo e quanto falta." compact-mobile>
      <template #actions>
        <button
          type="button"
          class="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg text-[13px] font-medium bg-primary text-primary-foreground hover:brightness-110 transition-colors"
          @click="openNew"
        >
          <Plus class="size-3.5" />
          Nova meta
        </button>
      </template>
    </PageHeader>

    <!-- Loading -->
    <div v-if="store.loadingGoals" class="lg:grid lg:grid-cols-[400px_minmax(0,1fr)] xl:grid-cols-[440px_minmax(0,1fr)] lg:gap-5 xl:gap-6 lg:items-start">
      <div class="mb-4 lg:mb-0 bg-card rounded-lg p-4">
        <Skeleton class="h-2.5 w-14 mb-3" />
        <div class="grid grid-cols-2 gap-3">
          <Skeleton class="h-10 w-full" />
          <Skeleton class="h-10 w-full" />
        </div>
      </div>
      <div class="bg-card rounded-lg overflow-hidden">
        <div class="px-4 py-3 border-b border-border"><Skeleton class="h-2.5 w-20" /></div>
        <div v-for="i in 3" :key="i" class="flex items-center gap-3 px-4 py-3">
          <Skeleton class="size-8 rounded-lg shrink-0" />
          <div class="flex-1 space-y-1.5">
            <Skeleton class="h-3 w-1/3" />
            <Skeleton class="h-2.5 w-1/2" />
          </div>
        </div>
      </div>
    </div>

    <EmptyState
      v-else-if="store.goals.length === 0"
      :icon="Flag"
      title="Nenhuma meta criada"
      description="Defina um objetivo financeiro para começar."
      cta-label="Criar meta"
      @cta="openNew"
    />

    <!-- Desktop: summary on the left, the goals on the right (as on Visão Geral) -->
    <div v-else class="lg:grid lg:grid-cols-[400px_minmax(0,1fr)] xl:grid-cols-[440px_minmax(0,1fr)] lg:gap-5 xl:gap-6 lg:items-start">
      <div class="mb-4 lg:mb-0">
        <div class="bg-card rounded-lg p-4">
          <div class="flex items-center justify-between mb-3">
            <p class="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Resumo</p>
            <span class="text-[11px] text-muted-foreground">
              {{ activeGoals.length }} meta{{ activeGoals.length !== 1 ? 's' : '' }} ativa{{ activeGoals.length !== 1 ? 's' : '' }}
            </span>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <p class="text-[12px] text-muted-foreground mb-1">Juntado</p>
              <p class="text-[20px] font-semibold tabular-nums leading-none whitespace-nowrap text-primary">{{ formatCurrency(totalSaved) }}</p>
            </div>
            <div>
              <p class="text-[12px] text-muted-foreground mb-1">Falta</p>
              <p class="text-[20px] font-semibold tabular-nums leading-none whitespace-nowrap text-foreground">{{ formatCurrency(totalRemaining) }}</p>
            </div>
          </div>
          <div v-if="totalMonthly > 0" class="mt-3 rounded-md bg-muted px-3 py-2 text-[12px] flex items-center justify-between gap-3">
            <span class="text-muted-foreground">Aportes previstos por mês</span>
            <span class="tabular-nums font-medium whitespace-nowrap">{{ formatCurrency(totalMonthly) }}</span>
          </div>
          <p class="text-[11px] text-muted-foreground leading-snug mt-3">
            Meta com conta vinculada acompanha o saldo dessa conta. Toque numa meta para editar.
          </p>
        </div>
      </div>

      <div class="space-y-3">
        <!-- Active goals: one card, rows like the Visão Geral lists -->
        <section v-if="activeGoals.length" class="bg-card rounded-lg overflow-hidden">
          <div class="px-4 py-3 border-b border-border">
            <p class="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Ativas</p>
          </div>
          <ul class="divide-y divide-border">
            <li v-for="goal in activeGoals" :key="goal.id">
              <button
                type="button"
                class="w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors"
                :aria-label="`Editar meta ${goal.name}`"
                @click="openEdit(goal)"
              >
                <div class="flex items-center gap-3">
                  <span
                    class="size-8 rounded-lg grid place-items-center shrink-0"
                    :style="{ background: (goal.color ?? '#34d399') + '26', color: goal.color ?? '#34d399' }"
                  >
                    <Flag :size="15" :stroke-width="1.9" aria-hidden="true" />
                  </span>
                  <div class="flex-1 min-w-0">
                    <p class="text-[14px] font-medium text-foreground truncate">{{ goal.name }}</p>
                    <p class="text-[12px] text-muted-foreground tabular-nums truncate mt-0.5">
                      {{ formatCurrency(goal.current_amount) }} de {{ formatCurrency(goal.target_amount) }}
                    </p>
                  </div>
                  <span class="text-[14px] font-semibold tabular-nums shrink-0" :class="goal.progress_percentage >= 100 ? 'text-success' : 'text-foreground'">
                    {{ Math.round(goal.progress_percentage) }}%
                  </span>
                </div>
                <div class="mt-2 ml-11 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    class="h-full rounded-full transition-all duration-700"
                    :class="barColor(goal.progress_percentage)"
                    :style="{ width: `${Math.min(100, goal.progress_percentage)}%` }"
                  />
                </div>
                <p class="ml-11 mt-1.5 text-[11px] text-muted-foreground tabular-nums">
                  Faltam {{ formatCurrency(goal.remaining) }}
                  <template v-if="goal.months_remaining !== null"> · {{ goal.months_remaining }} {{ goal.months_remaining === 1 ? 'mês' : 'meses' }}</template>
                  <template v-if="goal.on_track === false"> · <span class="text-warning font-medium">Abaixo do ritmo</span></template>
                  <template v-else-if="goal.on_track === true"> · <span class="text-success font-medium">No ritmo</span></template>
                </p>
              </button>
            </li>
          </ul>
        </section>

        <p v-else class="bg-card rounded-lg px-4 py-3 text-[12px] text-muted-foreground">
          Nenhuma meta ativa. Crie uma nova para acompanhar um objetivo.
        </p>

        <!-- Completed / paused: collapsed block, muted rows -->
        <section v-if="closedGoals.length" class="bg-card rounded-lg overflow-hidden">
          <button
            type="button"
            class="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-muted/50 transition-colors"
            :aria-expanded="showClosed"
            @click="showClosed = !showClosed"
          >
            <ChevronRight :size="14" class="text-muted-foreground shrink-0 transition-transform" :class="showClosed ? 'rotate-90' : ''" />
            <Archive :size="14" class="text-muted-foreground shrink-0" />
            <span class="text-[13px] font-medium text-foreground">Concluídas e pausadas ({{ closedGoals.length }})</span>
          </button>
          <ul v-if="showClosed" class="border-t border-border divide-y divide-border">
            <li v-for="goal in closedGoals" :key="goal.id" class="flex items-center gap-3 px-4 py-2.5">
              <span class="size-8 rounded-lg grid place-items-center shrink-0 bg-muted text-muted-foreground">
                <Flag :size="15" :stroke-width="1.9" aria-hidden="true" />
              </span>
              <div class="flex-1 min-w-0">
                <p class="text-[14px] font-medium text-muted-foreground truncate">{{ goal.name }}</p>
                <p class="text-[12px] text-muted-foreground mt-0.5">{{ goal.status === 'completed' ? 'Concluída' : 'Pausada' }}</p>
              </div>
              <span class="text-[14px] font-semibold tabular-nums text-muted-foreground shrink-0">{{ formatCurrency(goal.target_amount) }}</span>
            </li>
          </ul>
        </section>
      </div>
    </div>
  </AppPageContainer>

  <GoalFormSheet
    v-model:open="formSheetOpen"
    :goal="editingGoal"
    @created="onGoalCreated"
    @updated="() => {}"
  />

  <!-- Criar transação fixa: a choice after creating a goal, so a grey bottom sheet -->
  <Sheet :open="recurringDialogOpen" @update:open="(v) => { if (!v) cancelRecurring() }">
    <SheetContent side="bottom" class="rounded-t-2xl p-0 max-w-lg mx-auto max-h-[85vh] overflow-y-auto">
      <div class="mx-auto mt-3 h-1 w-10 rounded-full bg-border" />
      <SheetHeader class="text-left px-5 pt-3">
        <SheetTitle class="text-[15px]">Criar aporte mensal?</SheetTitle>
        <SheetDescription class="text-[12px]">
          Uma transação fixa de
          <span class="font-medium text-foreground tabular-nums">{{ pendingGoalForRecurring ? formatCurrency(pendingGoalForRecurring.monthly_contribution) : '' }} por mês</span>
          vinculada a esta meta, até ela ser atingida.
        </SheetDescription>
      </SheetHeader>
      <div class="px-5 pb-6 mt-4 flex gap-2">
        <button type="button" class="flex-1 h-11 rounded-lg text-[14px] font-medium bg-muted text-foreground" @click="cancelRecurring">
          Não, só a meta
        </button>
        <button type="button" class="flex-1 h-11 rounded-lg text-[14px] font-medium bg-primary text-primary-foreground" @click="confirmCreateRecurring">
          Criar aporte
        </button>
      </div>
    </SheetContent>
  </Sheet>
</template>
