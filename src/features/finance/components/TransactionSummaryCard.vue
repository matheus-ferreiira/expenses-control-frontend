<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-vue-next'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { formatCurrency } from '@/utils/currency'
import { monthLabel, currentMonth } from '@/features/finance/utils/financeHelpers'
import { useHistoricalBalance } from '@/features/finance/composables/useHistoricalBalance'
import BalanceDetailSheet from '@/features/finance/components/BalanceDetailSheet.vue'

const props = defineProps<{
  month: string
  income: number
  expenses: number
  totalBalance: number
  pendingIncome: number
  pendingExpenses: number
  expenseDelta?: number | null
}>()

const emit = defineEmits<{
  prev: []
  next: []
  reset: []
  selectMonth: [month: string]
}>()

const label = computed(() => monthLabel(props.month))

const monthContext = computed<'current' | 'future' | 'past'>(() => {
  const now = currentMonth()
  if (props.month === now) return 'current'
  return props.month > now ? 'future' : 'past'
})

const isCurrentMonth = computed(() => monthContext.value === 'current')
const monthlyBalance = computed(() => props.income - props.expenses)

// ── Budget bar ────────────────────────────────────────────────────────────────
const budgetPercent = computed(() =>
  props.income > 0 ? Math.min(100, Math.round((props.expenses / props.income) * 100)) : 0
)
const budgetBarColor = computed(() => {
  if (budgetPercent.value >= 100) return 'bg-destructive'
  if (budgetPercent.value >= 70) return 'bg-warning'
  return 'bg-primary'
})

// ── Month picker ──────────────────────────────────────────────────────────────
const pickerOpen = ref(false)
const pickerYear = ref(new Date().getFullYear())

const MONTHS_SHORT = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'] as const

watch(pickerOpen, (open) => {
  if (open) {
    const [year] = props.month.split('-').map(Number)
    pickerYear.value = year ?? new Date().getFullYear()
  }
})

function selectMonthFromPicker(monthIdx: number) {
  const m = String(monthIdx + 1).padStart(2, '0')
  emit('selectMonth', `${pickerYear.value}-${m}`)
  pickerOpen.value = false
}

function isPickerCurrentRealMonth(monthIdx: number): boolean {
  const now = new Date()
  return pickerYear.value === now.getFullYear() && monthIdx === now.getMonth()
}

function isPickerSelectedMonth(monthIdx: number): boolean {
  const m = String(monthIdx + 1).padStart(2, '0')
  return props.month === `${pickerYear.value}-${m}`
}

// ── Historical balance — shared composable (same endpoint as everywhere) ──────
const {
  loading: loadingPastBalance,
  confirmedBalance: pastEndBalance,
  projectedBalance: futureProjectedBalance,
} = useHistoricalBalance(
  computed(() => props.month),
  computed(() => props.totalBalance),
)

// ── Balance detail sheet ──────────────────────────────────────────────────────
const balanceSheetOpen = ref(false)

const balanceSheetTitle = computed(() =>
  monthContext.value === 'future' ? 'Saldo previsto' : 'Saldo da conta'
)

const balanceSheetAmount = computed(() => {
  if (monthContext.value === 'future') {
    return futureProjectedBalance.value ?? (props.totalBalance + props.pendingIncome - props.pendingExpenses)
  }
  if (monthContext.value === 'past') {
    return pastEndBalance.value ?? props.totalBalance
  }
  return props.totalBalance
})

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
        <!-- Month label → opens month picker popover -->
        <Popover v-model:open="pickerOpen">
          <PopoverTrigger as-child>
            <button type="button" class="flex items-center gap-1 hover:text-primary transition-colors group">
              <span class="text-[15px] font-semibold">{{ label }}</span>
              <ChevronDown :size="12" class="text-muted-foreground/50 group-hover:text-primary transition-colors" />
            </button>
          </PopoverTrigger>
          <PopoverContent class="w-60 p-4" align="center" :side-offset="8">
            <!-- Year navigation -->
            <div class="flex items-center justify-between mb-3">
              <button
                type="button"
                class="size-7 flex items-center justify-center rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                @click="pickerYear--"
              >
                <ChevronLeft :size="14" />
              </button>
              <span class="text-[14px] font-semibold tabular-nums">{{ pickerYear }}</span>
              <button
                type="button"
                class="size-7 flex items-center justify-center rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                @click="pickerYear++"
              >
                <ChevronRight :size="14" />
              </button>
            </div>
            <!-- Month grid 6×2 -->
            <div class="grid grid-cols-6 gap-1">
              <button
                v-for="(abbr, idx) in MONTHS_SHORT"
                :key="abbr"
                type="button"
                class="h-8 rounded-md text-[11px] font-medium transition-colors"
                :class="isPickerCurrentRealMonth(idx)
                  ? 'bg-primary text-primary-foreground'
                  : isPickerSelectedMonth(idx)
                    ? 'bg-primary/20 text-primary'
                    : 'text-foreground hover:bg-muted/40'"
                @click="selectMonthFromPicker(idx)"
              >{{ abbr }}</button>
            </div>
            <!-- Footer -->
            <div class="flex items-center justify-between mt-3 pt-2 border-t border-border/40">
              <button
                type="button"
                class="text-primary text-[13px] font-medium hover:text-primary/80 transition-colors"
                @click="emit('reset'); pickerOpen = false"
              >Mês atual</button>
              <button
                type="button"
                class="text-muted-foreground text-[13px] hover:text-foreground transition-colors"
                @click="pickerOpen = false"
              >Cancelar</button>
            </div>
          </PopoverContent>
        </Popover>
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
        <p class="text-[10px] text-muted-foreground uppercase tracking-widest">Receitas</p>
        <p class="text-[17px] font-semibold text-success tabular-nums mt-1">{{ formatCurrency(income) }}</p>
      </div>
      <div>
        <p class="text-[10px] text-muted-foreground uppercase tracking-widest">Despesas</p>
        <p class="text-[17px] font-semibold text-destructive tabular-nums mt-1">{{ formatCurrency(expenses) }}</p>
      </div>
      <div>
        <p class="text-[10px] text-muted-foreground uppercase tracking-widest">Resultado</p>
        <p class="text-[17px] font-semibold tabular-nums mt-1" :class="balanceColor(monthlyBalance)">
          {{ formatCurrency(monthlyBalance) }}
        </p>
      </div>
    </div>

    <!-- Budget bar + vs mês anterior — shown when at least one has data -->
    <div
      v-if="income > 0 || (expenseDelta !== null && expenseDelta !== undefined)"
      class="mt-3 pt-3 border-t border-border/40"
    >
      <!-- Budget bar (only when income > 0) -->
      <template v-if="income > 0">
        <div class="flex items-center justify-between mb-1.5">
          <p class="text-[11px] uppercase tracking-widest text-muted-foreground/50">Orçamento do mês</p>
          <p class="text-[11px] text-muted-foreground/60 tabular-nums">
            {{ formatCurrency(expenses) }} de {{ formatCurrency(income) }} · {{ budgetPercent }}%
          </p>
        </div>
        <div class="h-1 rounded-full bg-muted/30 overflow-hidden">
          <div
            class="h-full rounded-full transition-all duration-700"
            :class="budgetBarColor"
            :style="{ width: `${Math.min(100, budgetPercent)}%` }"
          />
        </div>
      </template>
      <!-- vs mês anterior -->
      <div
        v-if="expenseDelta !== null && expenseDelta !== undefined"
        class="flex items-center gap-1 text-[12px] text-muted-foreground/50"
        :class="income > 0 ? 'mt-1.5' : ''"
      >
        <span>vs mês anterior:</span>
        <span
          class="font-semibold tabular-nums"
          :class="expenseDelta <= 0 ? 'text-success' : 'text-destructive'"
        >
          {{ expenseDelta <= 0 ? '↘' : '↗' }}
          {{ expenseDelta <= 0 ? '-' : '+' }}{{ formatCurrency(Math.abs(expenseDelta)) }} em despesas
        </span>
      </div>
    </div>

    <!-- Account balance row — value is clickable, opens BalanceDetailSheet -->
    <div class="mt-3 pt-3 border-t border-border/40">
      <template v-if="monthContext === 'current'">
        <div class="flex items-center justify-between">
          <p class="text-[11px] uppercase tracking-widest text-muted-foreground/50">Saldo da conta</p>
          <button
            type="button"
            class="flex items-center gap-1 hover:opacity-80 transition-opacity"
            @click="balanceSheetOpen = true"
          >
            <span class="tabular-nums font-semibold text-[14px]" :class="balanceColor(totalBalance)">
              {{ formatCurrency(totalBalance) }}
            </span>
            <ChevronDown :size="12" class="text-muted-foreground/40" />
          </button>
        </div>
      </template>

      <template v-else-if="monthContext === 'future'">
        <p v-if="loadingPastBalance" class="text-[11.5px] text-muted-foreground/50 animate-pulse">
          Calculando saldo previsto…
        </p>
        <div v-else class="flex items-center justify-between">
          <p class="text-[11px] uppercase tracking-widest text-muted-foreground/50">Saldo previsto</p>
          <button
            type="button"
            class="flex items-center gap-1 hover:opacity-80 transition-opacity"
            @click="balanceSheetOpen = true"
          >
            <span
              class="tabular-nums font-semibold text-[14px]"
              :class="balanceColor(futureProjectedBalance !== null ? futureProjectedBalance : totalBalance + pendingIncome - pendingExpenses)"
            >
              {{ formatCurrency(futureProjectedBalance !== null ? futureProjectedBalance : totalBalance + pendingIncome - pendingExpenses) }}
            </span>
            <ChevronDown :size="12" class="text-muted-foreground/40" />
          </button>
        </div>
      </template>

      <template v-else>
        <p v-if="loadingPastBalance" class="text-[11.5px] text-muted-foreground/50 animate-pulse">
          Calculando saldo final…
        </p>
        <div v-else-if="pastEndBalance !== null" class="flex items-center justify-between">
          <p class="text-[11px] uppercase tracking-widest text-muted-foreground/50">Saldo da conta</p>
          <button
            type="button"
            class="flex items-center gap-1 hover:opacity-80 transition-opacity"
            @click="balanceSheetOpen = true"
          >
            <span class="tabular-nums font-semibold text-[14px]" :class="balanceColor(pastEndBalance)">
              {{ formatCurrency(pastEndBalance) }}
            </span>
            <ChevronDown :size="12" class="text-muted-foreground/40" />
          </button>
        </div>
        <p v-else class="text-[11.5px] text-muted-foreground/40">
          Saldo histórico não disponível
        </p>
      </template>
    </div>
  </div>

  <BalanceDetailSheet
    v-model:open="balanceSheetOpen"
    :title="balanceSheetTitle"
    :total-amount="balanceSheetAmount"
  />
</template>
