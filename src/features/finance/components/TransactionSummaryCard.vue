<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { formatCurrency } from '@/utils/currency'
import { financeApi } from '@/services/api/finance'
import { monthLabel, currentMonth } from '@/features/finance/utils/financeHelpers'

const props = defineProps<{
  month: string
  income: number
  expenses: number
  totalBalance: number
  pendingIncome: number
  pendingExpenses: number
}>()

const emit = defineEmits<{
  prev: []
  next: []
  reset: []
}>()

const label = computed(() => monthLabel(props.month))

const monthContext = computed<'current' | 'future' | 'past'>(() => {
  const now = currentMonth()
  if (props.month === now) return 'current'
  return props.month > now ? 'future' : 'past'
})

const isCurrentMonth = computed(() => monthContext.value === 'current')
const monthlyBalance = computed(() => props.income - props.expenses)

// ── Past month: reconstruct account balance at end of that month ──────────────
// Formula: balanceAtEndOfMonth = currentBalance - income received since then + expenses paid since then
const pastEndBalance = ref<number | null>(null)
const loadingPastBalance = ref(false)

async function fetchPastEndBalance() {
  loadingPastBalance.value = true
  pastEndBalance.value = null
  try {
    const [year, month] = props.month.split('-').map(Number)
    const result = await financeApi.getHistoricalBalance(year!, month!)
    pastEndBalance.value = result.balance
  } catch {
    pastEndBalance.value = null
  } finally {
    loadingPastBalance.value = false
  }
}

watch(
  () => [props.month, props.totalBalance] as const,
  () => {
    if (monthContext.value === 'past') fetchPastEndBalance()
    else pastEndBalance.value = null
  },
  { immediate: true },
)

function balanceColor(v: number): string {
  if (v > 0) return 'text-success'
  if (v < 0) return 'text-destructive'
  return 'text-foreground'
}
</script>

<template>
  <div class="bg-card border border-border rounded-lg p-4">
    <!-- Month nav -->
    <div class="flex items-center justify-between mb-3">
      <button
        type="button"
        class="min-w-11 h-11 -m-1.5 grid place-items-center rounded-md hover:bg-muted text-muted-foreground active:scale-95 transition-all"
        @click="emit('prev')"
      >
        <ChevronLeft :size="20" />
      </button>
      <div class="flex items-center gap-2">
        <p class="text-[15px] font-semibold">{{ label }}</p>
        <button
          v-if="!isCurrentMonth"
          type="button"
          class="text-[11px] font-semibold text-primary px-2 py-0.5 rounded border border-primary/30 hover:bg-primary/10 transition-colors"
          @click="emit('reset')"
        >
          Hoje
        </button>
      </div>
      <button
        type="button"
        class="min-w-11 h-11 -m-1.5 grid place-items-center rounded-md hover:bg-muted text-muted-foreground active:scale-95 transition-all"
        @click="emit('next')"
      >
        <ChevronRight :size="20" />
      </button>
    </div>

    <!-- 3-col stats -->
    <div class="grid grid-cols-3 gap-2 text-center">
      <div>
        <p class="text-[10px] text-muted-foreground uppercase tracking-wider">Receitas</p>
        <p class="text-[17px] font-semibold text-success tabular-nums mt-1">{{ formatCurrency(income) }}</p>
      </div>
      <div>
        <p class="text-[10px] text-muted-foreground uppercase tracking-wider">Despesas</p>
        <p class="text-[17px] font-semibold text-destructive tabular-nums mt-1">{{ formatCurrency(expenses) }}</p>
      </div>
      <div>
        <p class="text-[10px] text-muted-foreground uppercase tracking-wider">Resultado</p>
        <p class="text-[17px] font-semibold tabular-nums mt-1" :class="balanceColor(monthlyBalance)">
          {{ formatCurrency(monthlyBalance) }}
        </p>
      </div>
    </div>

    <!-- Account balance row -->
    <div class="mt-3 pt-3 border-t border-border/40">
      <template v-if="monthContext === 'current'">
        <div class="flex items-center justify-between">
          <p class="text-[11px] uppercase tracking-widest text-muted-foreground/50">Saldo da conta</p>
          <p class="tabular-nums font-semibold text-[14px]" :class="balanceColor(totalBalance)">
            {{ formatCurrency(totalBalance) }}
          </p>
        </div>
      </template>

      <template v-else-if="monthContext === 'future'">
        <div class="flex items-center justify-between">
          <p class="text-[11px] uppercase tracking-widest text-muted-foreground/50">Saldo previsto</p>
          <p
            class="tabular-nums font-semibold text-[14px]"
            :class="balanceColor(totalBalance + pendingIncome - pendingExpenses)"
          >
            {{ formatCurrency(totalBalance + pendingIncome - pendingExpenses) }}
          </p>
        </div>
      </template>

      <template v-else>
        <p v-if="loadingPastBalance" class="text-[11.5px] text-muted-foreground/50 animate-pulse">
          Calculando saldo final…
        </p>
        <div v-else-if="pastEndBalance !== null" class="flex items-center justify-between">
          <p class="text-[11px] uppercase tracking-widest text-muted-foreground/50">Saldo da conta</p>
          <p class="tabular-nums font-semibold text-[14px]" :class="balanceColor(pastEndBalance)">
            {{ formatCurrency(pastEndBalance) }}
          </p>
        </div>
        <p v-else class="text-[11.5px] text-muted-foreground/40">
          Saldo histórico não disponível
        </p>
      </template>
    </div>
  </div>
</template>
