<script setup lang="ts">
import FinanceSubNav from '@/features/finance/components/FinanceSubNav.vue'
import { computed, onMounted, ref } from 'vue'
import { Flag, Plus } from 'lucide-vue-next'
import { AppPageContainer } from '@/components/shared'
import { useFinanceStore } from '@/stores/finance'
import { useToast } from '@/composables/useToast'
import { formatCurrency } from '@/utils/currency'
import type { FinanceGoal } from '@/types/finance'
import GoalFormSheet from '@/features/finance/components/GoalFormSheet.vue'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

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
  const today = new Date().toISOString().slice(0, 10)
  const firstAccount = store.activeAccounts[0]
  // Aportes suficientes para atingir a meta — a série termina quando ela é alcançada
  const monthsToGoal = Math.max(1, Math.ceil((goal.remaining ?? goal.target_amount) / goal.monthly_contribution))
  try {
    await store.createTransaction({
      description: `Aporte: ${goal.name}`,
      amount: goal.monthly_contribution,
      type: 'expense',
      transaction_date: today,
      is_recurring: true,
      recurrence_config: { frequency: 'monthly', end_type: 'count', count: monthsToGoal },
      account_id: goal.bank_account_id ?? firstAccount?.id,
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

function barColor(pct: number): string {
  if (pct >= 100) return 'bg-success'
  if (pct >= 70) return 'bg-primary'
  return 'bg-muted'
}
</script>

<template>
  <AppPageContainer>
    <FinanceSubNav />

    <!-- Header -->
    <div class="flex items-start justify-between mb-4 pb-3 border-b border-border">
      <div>
        <p class="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground">
          Finanças
        </p>
        <h1 class="text-[22px] font-semibold leading-tight tracking-tight text-foreground">
          Metas
        </h1>
        <p class="hidden md:block text-[12px] text-muted-foreground mt-1 leading-relaxed">
          Seus objetivos financeiros
        </p>
      </div>
      <button
        type="button"
        class="mt-1 flex items-center gap-1.5 h-9 px-3 rounded-md text-[13px] font-medium bg-primary text-primary-foreground hover:brightness-110 transition-colors"
        @click="openNew"
      >
        <Plus :size="16" />
        Nova meta
      </button>
    </div>

    <!-- Loading -->
    <div v-if="store.loadingGoals" class="space-y-3">
      <div v-for="i in 3" :key="i" class="bg-card rounded-lg p-4">
        <div class="flex items-start gap-3">
          <div class="size-10 rounded-xl bg-muted animate-pulse shrink-0" />
          <div class="flex-1 space-y-2">
            <div class="h-4 w-32 rounded bg-muted animate-pulse" />
            <div class="h-3 w-48 rounded bg-muted animate-pulse" />
            <div class="h-1.5 w-full rounded-full bg-muted animate-pulse mt-2" />
          </div>
        </div>
      </div>
    </div>

    <!-- Estado vazio -->
    <div
      v-else-if="activeGoals.length === 0"
      class="flex flex-col items-center gap-3 py-16 text-center"
    >
      <div class="size-14 rounded-2xl bg-muted flex items-center justify-center">
        <Flag :size="24" class="text-muted-foreground" />
      </div>
      <div>
        <p class="text-[14px] font-medium text-foreground">Nenhuma meta criada</p>
        <p class="text-[12px] text-muted-foreground mt-0.5">
          Defina um objetivo financeiro para começar
        </p>
      </div>
      <button
        type="button"
        class="mt-2 flex items-center gap-1.5 h-10 px-4 rounded-lg text-[13px] font-medium bg-primary text-primary-foreground hover:brightness-110 transition-colors"
        @click="openNew"
      >
        <Plus :size="16" />
        Criar meta
      </button>
    </div>

    <!-- Lista de metas -->
    <div v-else class="space-y-3">
      <div
        v-for="goal in activeGoals"
        :key="goal.id"
        class="bg-card rounded-lg p-4"
        @click="openEdit(goal)"
        role="button"
        tabindex="0"
        @keydown.enter="openEdit(goal)"
      >
        <div class="flex items-start gap-3">
          <!-- Ícone colorido -->
          <span
            class="size-10 rounded-xl flex items-center justify-center shrink-0"
            :style="{ background: (goal.color ?? '#34d399') + '20' }"
          >
            <Flag :size="20" :style="{ color: goal.color ?? '#34d399' }" />
          </span>

          <!-- Info -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between gap-2">
              <p class="text-[14px] font-medium text-foreground truncate">{{ goal.name }}</p>
              <p class="text-[12px] text-muted-foreground tabular-nums shrink-0">
                {{ goal.progress_percentage.toFixed(0) }}%
              </p>
            </div>

            <p class="text-[12px] text-muted-foreground tabular-nums mt-0.5">
              {{ formatCurrency(goal.current_amount) }} de {{ formatCurrency(goal.target_amount) }}
            </p>

            <!-- Barra de progresso -->
            <div class="h-1 rounded-full bg-muted overflow-hidden mt-2">
              <div
                class="h-full rounded-full transition-all duration-700"
                :class="barColor(goal.progress_percentage)"
                :style="{ width: `${Math.min(100, goal.progress_percentage)}%` }"
              />
            </div>

            <!-- Faltam + prazo -->
            <div class="flex items-center gap-3 mt-1.5">
              <p class="text-[11px] text-muted-foreground tabular-nums">
                Faltam {{ formatCurrency(goal.remaining) }}
              </p>
              <span v-if="goal.months_remaining !== null" class="text-[11px] text-muted-foreground">
                · {{ goal.months_remaining }} meses
              </span>
              <span
                v-if="goal.on_track === false"
                class="text-[10px] text-warning font-medium"
              >⚠ Abaixo do ritmo</span>
              <span
                v-else-if="goal.on_track === true"
                class="text-[10px] text-success font-medium"
              >No ritmo</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Metas concluídas -->
    <div
      v-if="!store.loadingGoals && store.goals.filter(g => g.status !== 'active').length > 0"
      class="mt-6"
    >
      <p class="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold mb-3">
        Concluídas / Pausadas
      </p>
      <div class="space-y-2">
        <div
          v-for="goal in store.goals.filter(g => g.status !== 'active')"
          :key="goal.id"
          class="bg-card rounded-lg px-4 py-3 flex items-center gap-3 opacity-60"
        >
          <span
            class="size-9 rounded-xl flex items-center justify-center shrink-0"
            :style="{ background: (goal.color ?? '#888') + '20' }"
          >
            <Flag :size="16" :style="{ color: goal.color ?? '#888' }" />
          </span>
          <div class="flex-1 min-w-0">
            <p class="text-[13px] font-medium text-foreground truncate">{{ goal.name }}</p>
            <p class="text-[11px] text-muted-foreground capitalize">{{ goal.status === 'completed' ? 'Concluída' : 'Pausada' }}</p>
          </div>
          <p class="text-[12px] font-semibold tabular-nums text-success">
            {{ formatCurrency(goal.target_amount) }}
          </p>
        </div>
      </div>
    </div>

  </AppPageContainer>

  <GoalFormSheet
    v-model:open="formSheetOpen"
    :goal="editingGoal"
    @created="onGoalCreated"
    @updated="() => {}"
  />

  <!-- AlertDialog: criar transação fixa -->
  <AlertDialog v-model:open="recurringDialogOpen">
    <AlertDialogContent class="max-w-sm">
      <AlertDialogHeader>
        <AlertDialogTitle class="text-[15px]">Criar transação fixa?</AlertDialogTitle>
        <AlertDialogDescription class="text-[13px]">
          Deseja criar uma transação fixa de
          <strong>{{ pendingGoalForRecurring ? formatCurrency(pendingGoalForRecurring.monthly_contribution) : '' }}/mês</strong>
          vinculada a esta meta?
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter class="gap-2">
        <AlertDialogCancel
          class="flex-1 h-[52px] rounded-xl text-[15px] bg-muted text-muted-foreground"
          @click="cancelRecurring"
        >
          Não, só a meta
        </AlertDialogCancel>
        <AlertDialogAction
          class="flex-1 h-[52px] rounded-xl font-semibold text-[15px] bg-primary text-primary-foreground"
          @click="confirmCreateRecurring"
        >
          Sim, criar transação
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>
