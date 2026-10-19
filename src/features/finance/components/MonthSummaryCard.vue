<script setup lang="ts">
import { computed } from 'vue'
import { CheckCircle2, AlertTriangle, PiggyBank } from 'lucide-vue-next'
import { Skeleton } from '@ui/skeleton'
import MonthNavigator from './MonthNavigator.vue'
import { formatCurrency } from '@/utils/currency'

/** past = mês fechado · current = em andamento · future = previsão */
export type MonthMode = 'past' | 'current' | 'future'

const props = defineProps<{
  /** YYYY-MM */
  month: string
  mode: MonthMode
  /** Receitas e despesas confirmadas (despesa = parte própria, como no relatório mensal) */
  income: number
  expenses: number
  pendingIncome: number
  pendingExpenses: number
  /** Guardado no mês: aportes em metas + o que foi para as caixinhas */
  saved: number
  pendingSaved: number
  /** Base do orçamento do mês, quando existe */
  budgetBase: number | null
  /** Despesas a mais (+) ou a menos (−) que o período comparado */
  comparison: { label: string; delta: number } | null
  loading: boolean
}>()

defineEmits<{
  prev: []
  next: []
  reset: []
  'select-month': [month: string]
}>()

const round2 = (n: number) => Math.round(n * 100) / 100

// ── Calendário do mês visto ─────────────────────────────────────────────────
const daysInMonth = computed(() => {
  const [y, m] = props.month.split('-').map(Number)
  return new Date(y!, m!, 0).getDate()
})
const today = new Date().getDate()
const daysLeft = computed(() => daysInMonth.value - today)
const elapsedPct = computed(() => Math.round((today / daysInMonth.value) * 100))

const modeLabel = computed(() => {
  if (props.mode === 'past') return 'Mês fechado'
  if (props.mode === 'future') return 'Previsão'
  return daysLeft.value === 0 ? 'Em andamento · último dia' : `Em andamento · faltam ${daysLeft.value} dia${daysLeft.value !== 1 ? 's' : ''}`
})

// ── Números principais ──────────────────────────────────────────────────────
const expectedIncome = computed(() => props.income + props.pendingIncome)
const expectedExpenses = computed(() => props.expenses + props.pendingExpenses)
/** Entrou − saiu: o que já aconteceu (fechado/em andamento) ou o previsto (futuro). O guardado fica à parte. */
const leftover = computed(() =>
  round2(props.mode === 'future' ? expectedIncome.value - expectedExpenses.value : props.income - props.expenses),
)
const forecast = computed(() => round2(expectedIncome.value - expectedExpenses.value))

const columns = computed(() => {
  if (props.mode === 'future') {
    return [
      { label: 'Receita prevista', value: expectedIncome.value, cls: 'text-success', sub: null },
      { label: 'Despesa prevista', value: expectedExpenses.value, cls: 'text-destructive', sub: null },
      { label: 'Sobra prevista', value: leftover.value, cls: leftover.value < 0 ? 'text-destructive' : 'text-foreground', sub: null },
    ]
  }
  const current = props.mode === 'current'
  return [
    {
      label: current ? 'Recebido' : 'Receitas', value: props.income, cls: 'text-success',
      sub: current && props.pendingIncome > 0 ? { value: `+${formatCurrency(props.pendingIncome)}`, label: 'a receber' } : null,
    },
    {
      label: current ? 'Gasto' : 'Despesas', value: props.expenses, cls: 'text-destructive',
      sub: current && props.pendingExpenses > 0 ? { value: `−${formatCurrency(props.pendingExpenses)}`, label: 'a pagar' } : null,
    },
    {
      label: current ? 'Sobra até hoje' : 'Sobrou', value: leftover.value,
      cls: leftover.value < 0 ? 'text-destructive' : 'text-foreground', sub: null,
    },
  ]
})

// ── Barra: gasto contra o orçamento do mês, ou contra a receita prevista quando não há orçamento ──
const base = computed(() => (props.budgetBase && props.budgetBase > 0 ? props.budgetBase : expectedIncome.value))
const baseLabel = computed(() => {
  if (props.budgetBase && props.budgetBase > 0) return 'Orçamento do mês'
  return props.mode === 'past' ? 'Receitas do mês' : 'Receita prevista do mês'
})
/** Despesa considerada na barra: no futuro tudo é previsto; no passado, o que ficou pendente não conta */
const barSpent = computed(() => (props.mode === 'future' ? 0 : props.expenses))
const barPending = computed(() => (props.mode === 'past' ? 0 : props.pendingExpenses))
const pct = (value: number) => (base.value > 0 ? Math.round((value / base.value) * 100) : 0)
const spentPct = computed(() => pct(barSpent.value))
const totalPct = computed(() => pct(barSpent.value + barPending.value))
const spentWidth = computed(() => Math.min(100, spentPct.value))
const pendingWidth = computed(() => Math.max(0, Math.min(100, totalPct.value) - spentWidth.value))
const barTone = computed(() => (totalPct.value > 100 ? 'bg-destructive' : spentPct.value > elapsedPct.value + 10 && props.mode === 'current' ? 'bg-warning' : 'bg-primary'))

// ── Status: o que o mês diz, conforme ele já fechou, está andando ou ainda vai começar ──
const status = computed<{ tone: 'ok' | 'warn' | 'danger'; text: string } | null>(() => {
  if (props.mode === 'past') {
    if (props.income === 0 && props.expenses === 0) return null
    if (leftover.value >= 0) {
      return { tone: 'ok', text: props.income > 0 ? `Sobrou ${Math.round((leftover.value / props.income) * 100)}% do que entrou` : `Sobrou ${formatCurrency(leftover.value)}` }
    }
    return { tone: 'danger', text: `Saiu ${formatCurrency(-leftover.value)} a mais do que entrou` }
  }
  if (props.mode === 'future') {
    if (expectedIncome.value === 0 && expectedExpenses.value === 0) return null
    if (leftover.value < 0) return { tone: 'warn', text: `Pelo previsto, sai ${formatCurrency(-leftover.value)} a mais do que entra` }
    return { tone: 'ok', text: expectedIncome.value > 0 ? `Pelo previsto, sobram ${Math.round((leftover.value / expectedIncome.value) * 100)}% do que entra` : 'Sem despesas previstas' }
  }
  if (forecast.value < 0) return { tone: 'danger', text: `Pelo previsto, o mês fecha ${formatCurrency(-forecast.value)} no negativo` }
  if (base.value <= 0) return null
  if (spentPct.value > elapsedPct.value + 10) return { tone: 'warn', text: `Já gastou ${spentPct.value}% com ${elapsedPct.value}% do mês` }
  return { tone: 'ok', text: `No ritmo: ${spentPct.value}% gasto com ${elapsedPct.value}% do mês` }
})

const comparisonText = computed(() => {
  const c = props.comparison
  if (!c) return null
  // The month in progress is set against the whole previous month: "Até agora" says it is not over yet
  const prefix = props.mode === 'current' ? 'Até agora, ' : ''
  if (Math.abs(c.delta) < 0.01) return { up: false, text: `${prefix ? `${prefix}mesmas` : 'Mesmas'} despesas que ${c.label}` }
  return { up: c.delta > 0, text: `${prefix}${formatCurrency(Math.abs(c.delta))} ${c.delta > 0 ? 'a mais' : 'a menos'} em despesas que ${c.label}` }
})

// ── Guardado ────────────────────────────────────────────────────────────────
const monthSaved = computed(() => (props.mode === 'future' ? props.pendingSaved : props.saved))
const showSaved = computed(() => monthSaved.value !== 0)
const leftPending = computed(() => props.mode === 'past' && (props.pendingIncome > 0 || props.pendingExpenses > 0))
</script>

<template>
  <div class="bg-card rounded-lg p-4">
    <div class="flex flex-col items-center mb-3">
      <MonthNavigator
        :month="month"
        :is-current-month="mode === 'current'"
        @prev="$emit('prev')"
        @next="$emit('next')"
        @reset="$emit('reset')"
        @select-month="$emit('select-month', $event)"
      />
      <p class="text-[11px] text-muted-foreground -mt-0.5">{{ modeLabel }}</p>
    </div>

    <!-- Entrou · saiu · sobrou -->
    <div class="grid grid-cols-3 gap-2 text-center">
      <div v-for="col in columns" :key="col.label" class="min-w-0">
        <!-- Fixed two-line label area keeps the three values aligned when a label wraps -->
        <p class="text-[10px] text-muted-foreground uppercase tracking-widest leading-tight h-[26px] flex items-end justify-center">{{ col.label }}</p>
        <Skeleton v-if="loading" class="h-5 w-20 mx-auto mt-1.5" />
        <p v-else class="text-[15px] min-[400px]:text-[17px] font-semibold tabular-nums whitespace-nowrap mt-1" :class="col.cls">
          {{ formatCurrency(col.value) }}
        </p>
        <p v-if="col.sub && !loading" class="text-[10.5px] text-muted-foreground tabular-nums leading-tight mt-0.5">
          <span class="block whitespace-nowrap">{{ col.sub.value }}</span>
          <span class="block">{{ col.sub.label }}</span>
        </p>
      </div>
    </div>

    <!-- Resultado previsto do mês em andamento, com o que está lançado -->
    <div
      v-if="!loading && mode === 'current' && (pendingIncome > 0 || pendingExpenses > 0)"
      class="mt-3 rounded-md bg-muted px-3 py-2 text-[12px]"
    >
      <div class="flex items-center justify-between gap-3">
        <span class="text-muted-foreground">Resultado previsto</span>
        <span class="tabular-nums font-semibold whitespace-nowrap" :class="forecast < 0 ? 'text-destructive' : 'text-success'">
          {{ forecast > 0 ? '+' : '' }}{{ formatCurrency(forecast) }}
        </span>
      </div>
    </div>

    <!-- Barra: gasto (cheio) e a pagar (claro) contra a base; o traço marca o dia de hoje -->
    <div v-if="!loading && base > 0" class="mt-4">
      <div class="flex items-start justify-between gap-3 text-[11px] text-muted-foreground mb-1.5">
        <span>{{ baseLabel }}</span>
        <div class="flex flex-col items-end">
          <span class="tabular-nums font-medium text-foreground whitespace-nowrap">
            {{ formatCurrency(barSpent + barPending) }} de {{ formatCurrency(base) }}
          </span>
          <span class="tabular-nums">
            <template v-if="mode === 'future'">{{ totalPct }}% previsto</template>
            <template v-else-if="barPending > 0">{{ spentPct }}% gasto · {{ totalPct }}% com o previsto</template>
            <template v-else>{{ spentPct }}%</template>
          </span>
        </div>
      </div>
      <div class="relative h-1.5 bg-muted rounded-full overflow-hidden">
        <div class="absolute inset-y-0 left-0 rounded-full transition-all duration-700" :class="barTone" :style="{ width: `${spentWidth}%` }" />
        <div
          class="absolute inset-y-0 rounded-full opacity-40 transition-all duration-700"
          :class="barTone"
          :style="{ left: `${spentWidth}%`, width: `${pendingWidth}%` }"
        />
        <div v-if="mode === 'current'" class="absolute inset-y-0 w-px bg-foreground/60" :style="{ left: `${elapsedPct}%` }" />
      </div>
    </div>

    <!-- Status do mês -->
    <div
      v-if="status && !loading"
      class="mt-3 flex items-center gap-2 rounded-md bg-muted px-2.5 py-2 text-[12px] font-medium"
      :class="status.tone === 'danger' ? 'text-destructive' : status.tone === 'warn' ? 'text-warning' : 'text-success'"
    >
      <CheckCircle2 v-if="status.tone === 'ok'" :size="14" class="shrink-0" />
      <AlertTriangle v-else :size="14" class="shrink-0" />
      <span class="leading-snug">{{ status.text }}</span>
    </div>

    <!-- Comparação: mês fechado com o anterior inteiro; em andamento com o anterior até o mesmo dia -->
    <p
      v-if="comparisonText && !loading"
      class="mt-2 text-[11.5px] leading-snug"
      :class="comparisonText.up ? 'text-destructive' : 'text-success'"
    >
      {{ comparisonText.up ? '↑' : '↓' }} {{ comparisonText.text }}
    </p>

    <!-- Lançamentos de um mês fechado que nunca foram confirmados -->
    <p v-if="leftPending && !loading" class="mt-2 text-[11.5px] leading-snug text-warning">
      Ficaram sem confirmar:
      <span v-if="pendingIncome > 0" class="tabular-nums">+{{ formatCurrency(pendingIncome) }} a receber</span>
      <span v-if="pendingIncome > 0 && pendingExpenses > 0"> · </span>
      <span v-if="pendingExpenses > 0" class="tabular-nums">−{{ formatCurrency(pendingExpenses) }} a pagar</span>
    </p>

    <!-- Guardado no mês (o total nas caixinhas fica no card de saldo) -->
    <div v-if="showSaved && !loading" class="mt-3 pt-3 border-t border-border flex items-center justify-between gap-3">
      <span class="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground">
        <PiggyBank :size="14" class="text-primary" />
        {{ mode === 'future' ? 'Guardar no mês (previsto)' : 'Guardado no mês' }}
      </span>
      <span class="text-[14px] font-semibold tabular-nums text-primary">{{ formatCurrency(monthSaved) }}</span>
    </div>
  </div>
</template>
