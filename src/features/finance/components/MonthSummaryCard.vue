<script setup lang="ts">
import { computed } from 'vue'
import { CheckCircle2, AlertTriangle, PiggyBank } from 'lucide-vue-next'
import MonthNavigator from './MonthNavigator.vue'
import { formatCurrency } from '@/utils/currency'
import type { Transaction } from '@/types/finance'

const props = defineProps<{
  month: string
  isCurrentMonth: boolean
  income: number
  expenses: number
  /** Aportes em metas confirmados no mês — poupança, não gasto */
  saved: number
  budgetPercent: number
  /** Base da barra de orçamento (base_amount do orçamento do mês, ou receita) */
  budgetBase: number
  status: { tone: 'ok' | 'warn' | 'danger'; text: string }
  expenseDelta: number | null
  loading: boolean
  transactionCount: number
  biggestExpense: Transaction | null
  pendingIncome: number
  pendingExpenses: number
}>()

const hasPending = computed(() => props.pendingIncome > 0 || props.pendingExpenses > 0)

// Linha de detalhes: Transações + (Maior despesa) + (Guardado) + (Pendentes)
const detailCols = computed(() => {
  const count = 1 + (props.biggestExpense ? 1 : 0) + (props.saved > 0 ? 1 : 0) + (hasPending.value ? 1 : 0)
  return count >= 4 ? 'grid-cols-2' : count === 3 ? 'grid-cols-3' : 'grid-cols-2'
})

defineEmits<{
  prev: []
  next: []
  reset: []
  'select-month': [month: string]
}>()
</script>

<template>
  <div class="bg-card rounded-lg p-4">
    <div class="flex justify-center mb-3">
      <MonthNavigator
        :month="month"
        :is-current-month="isCurrentMonth"
        @prev="$emit('prev')"
        @next="$emit('next')"
        @reset="$emit('reset')"
        @select-month="$emit('select-month', $event)"
      />
    </div>

    <!-- 3-column stats -->
    <div class="grid grid-cols-3 gap-2 text-center">
      <div>
        <p class="text-[10px] text-muted-foreground uppercase tracking-widest">Receitas</p>
        <p class="block text-[17px] font-semibold text-success tabular-nums mt-1">{{ formatCurrency(income) }}</p>
      </div>
      <div>
        <p class="text-[10px] text-muted-foreground uppercase tracking-widest">Despesas</p>
        <p class="block text-[17px] font-semibold text-destructive tabular-nums mt-1">{{ formatCurrency(expenses) }}</p>
      </div>
      <div>
        <p class="text-[10px] text-muted-foreground uppercase tracking-widest">Saldo do mês</p>
        <p class="block text-[17px] font-semibold tabular-nums mt-1">{{ formatCurrency(income - expenses - saved) }}</p>
      </div>
    </div>

    <!-- Budget bar with amounts text -->
    <div class="mt-4">
      <div class="flex items-center justify-between text-[11px] text-muted-foreground mb-1.5">
        <span>Orçamento do mês</span>
        <div class="flex flex-col items-end">
          <span class="tabular-nums font-medium text-foreground">{{ formatCurrency(expenses) }} de {{ formatCurrency(budgetBase) }}</span>
          <span class="tabular-nums text-muted-foreground">{{ budgetPercent }}%</span>
        </div>
      </div>
      <div class="h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          class="h-full rounded-full transition-all duration-700"
          :style="{ width: `${budgetPercent}%` }"
          :class="status.tone === 'danger' ? 'bg-destructive' : status.tone === 'warn' ? 'bg-warning' : 'bg-primary'"
        />
      </div>
    </div>

    <!-- Status contextual chip -->
    <div
      class="mt-3 flex items-center gap-2 rounded-md px-2.5 py-2 text-[12px] font-medium"
      :class="status.tone === 'danger'
        ? 'bg-muted text-destructive'
        : status.tone === 'warn'
          ? 'bg-muted text-warning'
          : 'bg-muted text-success'"
    >
      <CheckCircle2 v-if="status.tone === 'ok'" :size="14" class="shrink-0" />
      <AlertTriangle v-else :size="14" class="shrink-0" />
      <span class="leading-snug">{{ status.text }}</span>
    </div>

    <!-- vs mês anterior -->
    <div
      v-if="expenseDelta !== null && !loading"
      class="mt-2 flex items-center gap-1.5 text-[11.5px] text-muted-foreground"
    >
      <span>vs mês anterior:</span>
      <span
        class="inline-flex items-center gap-0.5 font-semibold tabular-nums"
        :class="expenseDelta <= 0 ? 'text-success' : 'text-destructive'"
      >
        {{ expenseDelta <= 0 ? '↓' : '↑' }}
        {{ expenseDelta <= 0 ? '-' : '+' }}{{ formatCurrency(Math.abs(expenseDelta)) }} em despesas
      </span>
    </div>

    <!-- Enrichment row: count + biggest expense + saved + pending -->
    <div
      v-if="!loading"
      class="mt-3 pt-3 border-t border-border grid gap-3"
      :class="detailCols"
    >
      <div>
        <p class="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold mb-1">Transações</p>
        <p class="text-[14px] font-semibold tabular-nums text-foreground">{{ transactionCount }} no mês</p>
      </div>
      <div v-if="biggestExpense">
        <p class="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold mb-1">Maior despesa</p>
        <p class="text-[14px] font-semibold tabular-nums text-destructive">{{ formatCurrency(biggestExpense.amount) }}</p>
        <p class="text-[11px] text-muted-foreground truncate leading-tight mt-0.5">{{ biggestExpense.category?.name ?? biggestExpense.description }}</p>
      </div>
      <div v-if="saved > 0">
        <p class="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold mb-1">Guardado</p>
        <p class="text-[14px] font-semibold tabular-nums text-primary inline-flex items-center gap-1">
          <PiggyBank :size="14" />
          {{ formatCurrency(saved) }}
        </p>
      </div>
      <div v-if="hasPending">
        <p class="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold mb-1">Pendentes</p>
        <p class="text-[13px] tabular-nums font-medium leading-snug">
          <span v-if="pendingIncome > 0" class="text-success">+{{ formatCurrency(pendingIncome) }}</span>
          <span v-if="pendingIncome > 0 && pendingExpenses > 0" class="text-muted-foreground mx-0.5">·</span>
          <span v-if="pendingExpenses > 0" class="text-destructive">-{{ formatCurrency(pendingExpenses) }}</span>
        </p>
      </div>
    </div>
  </div>
</template>
