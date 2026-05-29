<script setup lang="ts">
import { ref, computed, reactive, watch } from 'vue'
import { useUiStore } from '@/stores/ui'
import { useFinanceStore } from '@/stores/finance'
import { useTaskStore } from '@/stores/tasks'
import { useHabitStore } from '@/stores/habits'
import { useCalendarStore } from '@/stores/calendar'
import { useToast } from '@/composables/useToast'
import { Sheet, SheetContent } from '@ui/sheet'
import {
  CheckSquare, TrendingDown, TrendingUp, Repeat, CalendarPlus,
  ArrowLeft, Loader2, Check, CheckCircle, Wallet, ArrowLeftRight,
} from 'lucide-vue-next'
import { findIcon } from '@/lib/icons'
import CategoryQuickCreateSheet from '@/features/finance/components/CategoryQuickCreateSheet.vue'
import { isCompletedToday } from '@/features/habits/utils/habitHelpers'
import { DatePicker } from '@/components/ui/date-picker'
import type { TransactionType } from '@/types/finance'

type QuickAction = 'expense' | 'income' | 'transfer' | 'task' | 'habit' | 'event'

const ui = useUiStore()
const financeStore = useFinanceStore()
const taskStore = useTaskStore()
const habitStore = useHabitStore()
const calendarStore = useCalendarStore()
const toast = useToast()

const open = computed({
  get: () => ui.quickAddOpen,
  set: (v) => (ui.quickAddOpen = v),
})

const action = ref<QuickAction | null>(null)
const submitting = ref(false)

watch(open, (val) => {
  if (val) {
    if (!financeStore.categories.length) financeStore.fetchCategories()
    if (!financeStore.activeAccounts.length) financeStore.fetchAccounts()
    if (!habitStore.habits.length) habitStore.fetchHabits()
  }
})

function selectAction(a: QuickAction) {
  if (a === 'expense' || a === 'income') {
    txForm.type = a
    const cats = financeStore.categories.filter((c) => c.type === a || c.type === 'transfer')
    txForm.category_id = cats[0]?.id ?? ''
    txForm.account_id = financeStore.activeAccounts[0]?.id ?? ''
  } else if (a === 'transfer') {
    txForm.type = 'transfer'
    txForm.category_id = ''
    // Pre-select first account as origin, second as destination (if available)
    txForm.account_id = financeStore.activeAccounts[0]?.id ?? ''
    txForm.destination_account_id = financeStore.activeAccounts[1]?.id ?? ''
  }
  action.value = a
}

function goBack() {
  action.value = null
}

function close() {
  open.value = false
  setTimeout(() => {
    action.value = null
    resetTxForm()
    resetTaskForm()
    resetEventForm()
  }, 300)
}

// ── Transaction form ─────────────────────────────────────────────────────────

const txForm = reactive({
  type: 'expense' as TransactionType,
  amount: '',
  description: '',
  transaction_date: new Date().toLocaleDateString('en-CA'),
  category_id: '',
  account_id: '',
  destination_account_id: '',
  is_recurring: false,
})

function resetTxForm() {
  txForm.type = 'expense'
  txForm.amount = ''
  txForm.description = ''
  txForm.transaction_date = new Date().toLocaleDateString('en-CA')
  txForm.category_id = ''
  txForm.account_id = ''
  txForm.destination_account_id = ''
  txForm.is_recurring = false
}

const txCategories = computed(() =>
  financeStore.categories.filter((c) => c.type === txForm.type),
)

const showCategorySheet = ref(false)

function onTxTypeChange(t: TransactionType) {
  txForm.type = t
  const cats = financeStore.categories.filter((c) => c.type === t)
  txForm.category_id = cats[0]?.id ?? ''
  if (action.value !== t) action.value = t as QuickAction
}

async function submitTx() {
  if (!txForm.amount || !txForm.description.trim()) {
    toast.error('Preencha valor e título')
    return
  }
  const amt = parseFloat(txForm.amount.replace(',', '.'))
  if (isNaN(amt) || amt <= 0) {
    toast.error('Valor inválido')
    return
  }
  if (txForm.type === 'transfer') {
    if (!txForm.account_id || !txForm.destination_account_id) {
      toast.error('Selecione as contas de origem e destino')
      return
    }
    if (txForm.account_id === txForm.destination_account_id) {
      toast.error('Contas de origem e destino devem ser diferentes')
      return
    }
  }
  submitting.value = true
  try {
    await financeStore.createTransaction({
      type: txForm.type,
      amount: amt,
      description: txForm.description.trim(),
      transaction_date: txForm.transaction_date,
      ...(txForm.category_id ? { category_id: txForm.category_id } : {}),
      ...(txForm.account_id ? { account_id: txForm.account_id } : {}),
      ...(txForm.destination_account_id ? { destination_account_id: txForm.destination_account_id } : {}),
      ...(txForm.is_recurring ? { is_recurring: true } : {}),
    })
    const label = txForm.type === 'income' ? 'Receita registrada' : txForm.type === 'transfer' ? 'Transferência registrada' : 'Despesa registrada'
    toast.success(label)
    close()
  } catch {
    toast.error('Erro ao salvar transação')
  } finally {
    submitting.value = false
  }
}

// ── Task form ────────────────────────────────────────────────────────────────

const taskForm = reactive({
  title: '',
  due_date: null as string | null,
})

function resetTaskForm() {
  taskForm.title = ''
  taskForm.due_date = null
}

async function submitTask() {
  if (!taskForm.title.trim()) {
    toast.error('Informe o título da tarefa')
    return
  }
  submitting.value = true
  try {
    await taskStore.createTask({
      title: taskForm.title.trim(),
      ...(taskForm.due_date ? { due_date: taskForm.due_date } : {}),
    })
    toast.success('Tarefa criada')
    close()
  } catch {
    toast.error('Erro ao criar tarefa')
  } finally {
    submitting.value = false
  }
}

// ── Habit toggle form ────────────────────────────────────────────────────────

const selectedHabits = ref<Set<string>>(new Set())

const todayActiveHabits = computed(() =>
  habitStore.habits.filter((h) => h.is_active).slice(0, 8),
)

function toggleHabit(id: string) {
  if (selectedHabits.value.has(id)) selectedHabits.value.delete(id)
  else selectedHabits.value.add(id)
}

async function submitHabits() {
  if (selectedHabits.value.size === 0) {
    close()
    return
  }
  submitting.value = true
  try {
    await Promise.all([...selectedHabits.value].map((id) => habitStore.optimisticLog(id)))
    toast.success('Hábitos registrados')
    selectedHabits.value = new Set()
    close()
  } catch {
    toast.error('Erro ao registrar hábitos')
  } finally {
    submitting.value = false
  }
}

// ── Event form ───────────────────────────────────────────────────────────────

const eventForm = reactive({
  title: '',
  start_date: new Date().toLocaleDateString('en-CA'),
})

function resetEventForm() {
  eventForm.title = ''
  eventForm.start_date = new Date().toLocaleDateString('en-CA')
}

async function submitEvent() {
  if (!eventForm.title.trim()) {
    toast.error('Informe o título do evento')
    return
  }
  submitting.value = true
  try {
    const startISO = new Date(eventForm.start_date + 'T09:00:00').toISOString()
    const endISO = new Date(eventForm.start_date + 'T10:00:00').toISOString()
    await calendarStore.createEvent({
      title: eventForm.title.trim(),
      start_date: startISO,
      end_date: endISO,
      is_all_day: true,
    })
    toast.success('Evento criado')
    close()
  } catch {
    toast.error('Erro ao criar evento')
  } finally {
    submitting.value = false
  }
}

const QUICK_ACTIONS = [
  { id: 'task' as QuickAction, label: 'Nova tarefa', desc: 'Item para sua lista', icon: CheckSquare, color: 'hsl(var(--chart-1, 220 70% 60%))' },
  { id: 'expense' as QuickAction, label: 'Nova despesa', desc: 'Registre um gasto', icon: TrendingDown, color: 'hsl(var(--destructive))' },
  { id: 'income' as QuickAction, label: 'Nova receita', desc: 'Registre uma entrada', icon: TrendingUp, color: 'hsl(var(--success))' },
  { id: 'transfer' as QuickAction, label: 'Transferência', desc: 'Mover entre contas', icon: ArrowLeftRight, color: 'oklch(0.68 0.18 280)' },
  { id: 'habit' as QuickAction, label: 'Marcar hábito', desc: 'Concluir hábito de hoje', icon: Repeat, color: 'hsl(var(--warning))' },
  { id: 'event' as QuickAction, label: 'Novo evento', desc: 'Adicionar à agenda', icon: CalendarPlus, color: 'hsl(217 91% 68%)' },
]
</script>

<template>
  <Sheet v-model:open="open">
    <SheetContent
      side="bottom"
      class="rounded-t-2xl border-t border-border bg-card p-0 max-h-[92vh] overflow-y-auto [&>button]:hidden"
    >
      <!-- Drag handle -->
      <div class="mx-auto mt-2 mb-1 h-1 w-10 rounded-full bg-muted-foreground/30" />

      <!-- Menu -->
      <template v-if="!action">
        <div class="px-5 pt-2 pb-3">
          <p class="text-base font-semibold">Adicionar rápido</p>
          <p class="text-xs text-muted-foreground mt-0.5">O que você quer registrar agora?</p>
        </div>
        <ul class="px-2 pb-6">
          <li v-for="a in QUICK_ACTIONS" :key="a.id">
            <button
              class="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-muted text-left min-h-[56px] transition-colors"
              @click="selectAction(a.id)"
            >
              <span class="size-10 rounded-lg bg-muted grid place-items-center shrink-0">
                <component :is="a.icon" :size="20" :style="{ color: a.color }" />
              </span>
              <span class="flex-1 min-w-0">
                <span class="block text-sm font-medium">{{ a.label }}</span>
                <span class="block text-[11px] text-muted-foreground">{{ a.desc }}</span>
              </span>
            </button>
          </li>
        </ul>
      </template>

      <!-- ── Transaction Form (expense / income) ── -->
      <template v-else-if="action === 'expense' || action === 'income'">
        <form class="flex flex-col" @submit.prevent="submitTx">
          <!-- Header -->
          <header class="flex items-center gap-2 px-4 pt-3 pb-0 sticky top-0 bg-card z-10">
            <button type="button" class="p-1.5 rounded-lg hover:bg-muted text-muted-foreground" @click="goBack">
              <ArrowLeft :size="18" />
            </button>
            <div class="flex-1">
              <h3 class="text-[15px] font-semibold leading-none">Nova transação</h3>
              <p class="text-[11px] mt-0.5" :class="txForm.type === 'expense' ? 'text-destructive' : 'text-success'">
                {{ txForm.type === 'expense' ? 'Despesa' : 'Receita' }}
              </p>
            </div>
          </header>

          <!-- Type pills -->
          <div class="grid grid-cols-2 gap-1 p-1 mx-4 mt-3 bg-muted/60 rounded-xl">
            <button
              v-for="t in (['expense', 'income'] as TransactionType[])"
              :key="t"
              type="button"
              class="flex items-center justify-center gap-1.5 h-9 rounded-lg text-[12px] font-semibold transition-all"
              :class="txForm.type === t
                ? t === 'expense'
                  ? 'bg-destructive/15 text-destructive shadow-sm'
                  : 'bg-success/15 text-success shadow-sm'
                : 'text-muted-foreground/60'"
              @click="onTxTypeChange(t)"
            >
              <component :is="t === 'expense' ? TrendingDown : TrendingUp" :size="13" />
              {{ t === 'expense' ? 'Despesa' : 'Receita' }}
            </button>
          </div>

          <div class="px-4 py-4 space-y-5">
            <!-- Value — hero -->
            <div class="text-center">
              <div class="flex items-center justify-center gap-2 mb-3">
                <span
                  class="text-xl font-semibold"
                  :class="txForm.amount && parseFloat(txForm.amount.replace(',','.')) > 0
                    ? (txForm.type === 'expense' ? 'text-destructive' : 'text-success')
                    : 'text-muted-foreground/30'"
                >R$</span>
                <input
                  v-model="txForm.amount"
                  inputmode="decimal"
                  placeholder="0,00"
                  autofocus
                  class="bg-transparent outline-none text-5xl font-bold tabular-nums w-auto max-w-[200px] text-center transition-colors"
                  :class="txForm.amount && parseFloat(txForm.amount.replace(',','.')) > 0
                    ? (txForm.type === 'expense' ? 'text-destructive' : 'text-success')
                    : 'text-muted-foreground/20 placeholder:text-muted-foreground/20'"
                  size="8"
                  @input="(e: Event) => { txForm.amount = (e.target as HTMLInputElement).value.replace(/[^\d.,]/g, '') }"
                />
              </div>
              <!-- Quick increments -->
              <div class="flex gap-1.5 justify-center">
                <button
                  v-for="inc in [10, 50, 100, 500]"
                  :key="inc"
                  type="button"
                  class="h-7 px-3 rounded-full text-[11px] font-semibold border transition-all active:scale-95"
                  :class="txForm.type === 'expense'
                    ? 'bg-destructive/10 text-destructive hover:bg-destructive/20 border-destructive/20'
                    : 'bg-success/10 text-success hover:bg-success/20 border-success/20'"
                  @click="() => {
                    const cur = parseFloat(txForm.amount.replace(',','.')) || 0
                    txForm.amount = (cur + inc).toFixed(2).replace('.', ',')
                  }"
                >+{{ inc }}</button>
              </div>
            </div>

            <!-- Category grid -->
            <div>
              <p class="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50 mb-2.5">Categoria</p>
              <div class="grid grid-cols-4 gap-2">
                <button
                  v-for="cat in txCategories"
                  :key="cat.id"
                  type="button"
                  class="flex flex-col items-center justify-center gap-1.5 rounded-2xl border py-3 px-1 text-[11px] font-medium leading-tight transition-all active:scale-95"
                  :class="txForm.category_id === cat.id
                    ? 'border-2 shadow-sm'
                    : 'border-border/40 text-muted-foreground hover:border-border/80 hover:bg-muted/40'"
                  :style="txForm.category_id === cat.id
                    ? { borderColor: cat.color, background: cat.color + '18', color: cat.color }
                    : {}"
                  @click="txForm.category_id = txForm.category_id === cat.id ? '' : cat.id"
                >
                  <span
                    class="flex items-center justify-center size-9 rounded-xl"
                    :style="{ backgroundColor: cat.color + '25', color: cat.color }"
                  >
                    <component
                      v-if="cat.icon && findIcon(cat.icon)"
                      :is="findIcon(cat.icon)!.component"
                      :size="18"
                      :stroke-width="1.8"
                    />
                    <span v-else class="text-sm font-bold">{{ cat.name.charAt(0) }}</span>
                  </span>
                  <span class="truncate w-full text-center text-[10.5px]">{{ cat.name }}</span>
                </button>

                <!-- "+ Nova" button -->
                <button
                  type="button"
                  class="flex flex-col items-center justify-center gap-1.5 rounded-2xl border border-dashed border-border/50 py-3 px-1 text-[11px] font-medium text-muted-foreground/60 hover:border-border hover:text-muted-foreground hover:bg-muted/30 transition-all active:scale-95"
                  @click="showCategorySheet = true"
                >
                  <span class="flex items-center justify-center size-9 rounded-xl bg-muted/40">
                    <Plus :size="18" :stroke-width="1.8" />
                  </span>
                  <span class="text-[10.5px]">Nova</span>
                </button>
              </div>
            </div>

            <!-- Category quick-create sheet -->
            <CategoryQuickCreateSheet
              v-model:open="showCategorySheet"
              :default-type="txForm.type"
              @created="(cat) => { txForm.category_id = cat.id }"
            />

            <!-- Title -->
            <div>
              <p class="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50 mb-2">Título</p>
              <input
                v-model="txForm.description"
                placeholder="Onde/o quê? Ex: iFood, Salário"
                class="w-full h-12 px-4 rounded-2xl bg-muted/60 border border-border/40 focus:border-border/80 outline-none text-sm transition-colors"
              />
            </div>

            <!-- Account cards -->
            <div>
              <p class="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50 mb-2">
                Conta
              </p>
              <div v-if="financeStore.activeAccounts.length === 0" class="flex items-center gap-2 py-3 text-muted-foreground/50">
                <Wallet :size="16" />
                <span class="text-[12px]">Nenhuma conta cadastrada</span>
              </div>
              <div v-else class="flex gap-2 overflow-x-auto pb-1">
                <button
                  v-for="acc in financeStore.activeAccounts"
                  :key="acc.id"
                  type="button"
                  class="flex-shrink-0 flex items-center gap-2 h-11 pl-3 pr-4 rounded-2xl border text-left transition-all"
                  :class="txForm.account_id === acc.id
                    ? txForm.type === 'expense'
                      ? 'bg-destructive/15 text-destructive border-transparent shadow-sm'
                      : 'bg-success/15 text-success border-transparent shadow-sm'
                    : 'border-border/50 bg-muted/30 text-muted-foreground hover:bg-muted/60'"
                  @click="txForm.account_id = txForm.account_id === acc.id ? '' : acc.id"
                >
                  <span class="flex items-center justify-center size-7 rounded-xl text-xs font-bold uppercase shrink-0 bg-muted text-foreground">
                    {{ acc.name.charAt(0) }}
                  </span>
                  <div>
                    <p class="text-[12px] font-semibold leading-none">{{ acc.name }}</p>
                    <p class="text-[10px] opacity-60 mt-0.5 leading-none">{{ acc.type }}</p>
                  </div>
                </button>
              </div>
            </div>

            <!-- Recurring toggle -->
            <div
              class="rounded-2xl border border-border/40 bg-muted/20 p-3 cursor-pointer transition-all"
              :class="txForm.is_recurring ? 'border-violet-500/30 bg-violet-500/5' : ''"
              @click="txForm.is_recurring = !txForm.is_recurring"
            >
              <div class="flex items-center justify-between gap-4">
                <div class="flex items-center gap-2.5 min-w-0">
                  <span
                    class="flex items-center justify-center size-8 rounded-xl shrink-0 transition-colors"
                    :class="txForm.is_recurring ? 'bg-violet-500/15 text-violet-400' : 'bg-muted text-muted-foreground/40'"
                  >
                    <Repeat :size="14" />
                  </span>
                  <div>
                    <p class="text-[12px] font-semibold leading-none">Transação fixa</p>
                    <p class="text-[10px] text-muted-foreground/50 mt-0.5">Gera 60 meses automaticamente</p>
                  </div>
                </div>
                <button
                  type="button"
                  class="h-6 w-11 rounded-full transition-all flex items-center px-0.5 shrink-0"
                  :class="txForm.is_recurring ? 'bg-violet-500' : 'bg-muted'"
                  @click.stop="txForm.is_recurring = !txForm.is_recurring"
                >
                  <span
                    class="size-5 rounded-full bg-background shadow-sm transition-transform duration-200"
                    :class="txForm.is_recurring ? 'translate-x-5' : 'translate-x-0'"
                  />
                </button>
              </div>
            </div>
          </div>

          <!-- CTA footer -->
          <div class="sticky bottom-0 bg-card px-4 pt-2 pb-5">
            <button
              type="submit"
              class="w-full h-14 rounded-2xl font-bold text-[15px] flex items-center justify-center gap-2.5 transition-all active:scale-[0.98] text-white"
              :class="txForm.type === 'expense'
                ? 'bg-destructive hover:opacity-90'
                : 'bg-success hover:opacity-90'"
              :disabled="submitting"
            >
              <Loader2 v-if="submitting" :size="18" class="animate-spin" />
              <template v-else>
                <CheckCircle :size="18" :stroke-width="2.5" />
                Salvar {{ txForm.type === 'expense' ? 'Despesa' : 'Receita' }}
              </template>
            </button>
          </div>
        </form>
      </template>

      <!-- ── Transfer Form ── -->
      <template v-else-if="action === 'transfer'">
        <form class="flex flex-col" @submit.prevent="submitTx">
          <!-- Header -->
          <header class="flex items-center gap-2 px-4 pt-3 pb-0 sticky top-0 bg-card z-10">
            <button type="button" class="p-1.5 rounded-lg hover:bg-muted text-muted-foreground" @click="goBack">
              <ArrowLeft :size="18" />
            </button>
            <div class="flex-1">
              <h3 class="text-[15px] font-semibold leading-none">Transferência</h3>
              <p class="text-[11px] mt-0.5" style="color: oklch(0.68 0.18 280)">Entre contas</p>
            </div>
          </header>

          <div class="px-4 py-4 space-y-5">
            <!-- Amount hero -->
            <div class="text-center">
              <div class="flex items-center justify-center gap-2 mb-3">
                <span class="text-xl font-semibold" style="color: oklch(0.68 0.18 280)">R$</span>
                <input
                  v-model="txForm.amount"
                  inputmode="decimal"
                  placeholder="0,00"
                  autofocus
                  class="bg-transparent outline-none text-5xl font-bold tabular-nums w-auto max-w-[200px] text-center transition-colors"
                  style="color: oklch(0.68 0.18 280)"
                  size="8"
                  @input="(e: Event) => { txForm.amount = (e.target as HTMLInputElement).value.replace(/[^\d.,]/g, '') }"
                />
              </div>
              <div class="flex gap-1.5 justify-center">
                <button
                  v-for="inc in [10, 50, 100, 500]"
                  :key="inc"
                  type="button"
                  class="min-h-[44px] px-3 rounded-full text-[11px] font-semibold border transition-all active:scale-95"
                  style="background: oklch(0.68 0.18 280 / 0.1); color: oklch(0.68 0.18 280); border-color: oklch(0.68 0.18 280 / 0.2)"
                  @click="() => { const cur = parseFloat(txForm.amount.replace(',','.')) || 0; txForm.amount = (cur + inc).toFixed(2).replace('.', ',') }"
                >+{{ inc }}</button>
              </div>
            </div>

            <!-- Title -->
            <div>
              <p class="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50 mb-2">Título</p>
              <input
                v-model="txForm.description"
                placeholder="Descrição da transferência"
                class="w-full h-12 px-4 rounded-2xl bg-muted/60 border border-border/40 focus:border-border/80 outline-none text-sm transition-colors"
              />
            </div>

            <!-- Origin account -->
            <div>
              <p class="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50 mb-2">
                Conta de origem <span class="text-destructive">*</span>
              </p>
              <div v-if="financeStore.activeAccounts.length === 0" class="flex items-center gap-2 py-3 text-muted-foreground/50">
                <Wallet :size="16" />
                <span class="text-[12px]">Nenhuma conta cadastrada</span>
              </div>
              <div v-else class="flex gap-2 overflow-x-auto pb-1">
                <button
                  v-for="acc in financeStore.activeAccounts"
                  :key="acc.id"
                  type="button"
                  :disabled="acc.id === txForm.destination_account_id"
                  class="flex-shrink-0 flex items-center gap-2 h-11 pl-3 pr-4 rounded-2xl border text-left transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  :class="txForm.account_id === acc.id
                    ? 'border-transparent shadow-sm'
                    : 'border-border/50 bg-muted/30 text-muted-foreground hover:bg-muted/60'"
                  :style="txForm.account_id === acc.id ? 'background: oklch(0.62 0.16 22 / 0.15); color: oklch(0.62 0.16 22)' : ''"
                  @click="txForm.account_id = txForm.account_id === acc.id ? '' : acc.id"
                >
                  <span class="flex items-center justify-center size-7 rounded-xl text-xs font-bold uppercase shrink-0 bg-muted text-foreground">
                    {{ acc.name.charAt(0) }}
                  </span>
                  <div>
                    <p class="text-[12px] font-semibold leading-none">{{ acc.name }}</p>
                    <p class="text-[10px] opacity-60 mt-0.5 leading-none">{{ acc.type }}</p>
                  </div>
                </button>
              </div>
            </div>

            <!-- Destination account -->
            <div>
              <p class="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50 mb-2">
                Conta de destino <span class="text-destructive">*</span>
              </p>
              <div class="flex gap-2 overflow-x-auto pb-1">
                <button
                  v-for="acc in financeStore.activeAccounts"
                  :key="acc.id"
                  type="button"
                  :disabled="acc.id === txForm.account_id"
                  class="flex-shrink-0 flex items-center gap-2 h-11 pl-3 pr-4 rounded-2xl border text-left transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  :class="txForm.destination_account_id === acc.id
                    ? 'border-transparent shadow-sm'
                    : 'border-border/50 bg-muted/30 text-muted-foreground hover:bg-muted/60'"
                  :style="txForm.destination_account_id === acc.id ? 'background: oklch(0.68 0.12 155 / 0.15); color: oklch(0.68 0.12 155)' : ''"
                  @click="txForm.destination_account_id = txForm.destination_account_id === acc.id ? '' : acc.id"
                >
                  <span class="flex items-center justify-center size-7 rounded-xl text-xs font-bold uppercase shrink-0 bg-muted text-foreground">
                    {{ acc.name.charAt(0) }}
                  </span>
                  <div>
                    <p class="text-[12px] font-semibold leading-none">{{ acc.name }}</p>
                    <p class="text-[10px] opacity-60 mt-0.5 leading-none">{{ acc.type }}</p>
                  </div>
                </button>
              </div>
            </div>
          </div>

          <!-- CTA footer -->
          <div class="sticky bottom-0 bg-card px-4 pt-2 pb-5">
            <button
              type="submit"
              class="w-full h-14 rounded-2xl font-bold text-[15px] flex items-center justify-center gap-2.5 transition-all active:scale-[0.98] text-white"
              style="background: oklch(0.68 0.18 280)"
              :disabled="submitting"
            >
              <Loader2 v-if="submitting" :size="18" class="animate-spin" />
              <template v-else>
                <ArrowLeftRight :size="18" :stroke-width="2.5" />
                Salvar Transferência
              </template>
            </button>
          </div>
        </form>
      </template>

      <!-- ── Task Form ── -->
      <template v-else-if="action === 'task'">
        <form class="flex flex-col" @submit.prevent="submitTask">
          <header class="flex items-center gap-2 px-3 pt-1 pb-3 border-b border-border sticky top-0 bg-card z-10">
            <button type="button" class="size-9 grid place-items-center rounded-md hover:bg-muted text-muted-foreground" @click="goBack">
              <ArrowLeft :size="16" />
            </button>
            <h3 class="text-sm font-semibold">Nova tarefa</h3>
          </header>
          <div class="px-5 py-4 space-y-4">
            <div>
              <p class="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-1">Título</p>
              <input
                v-model="taskForm.title"
                autofocus
                placeholder="O que precisa ser feito?"
                class="w-full h-11 px-3 rounded-md bg-muted/50 border border-transparent focus:border-border outline-none text-sm"
              />
            </div>
            <div>
              <p class="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-1">Data (opcional)</p>
              <DatePicker v-model="taskForm.due_date" />
            </div>
          </div>
          <div class="sticky bottom-0 bg-card border-t border-border px-4 py-3">
            <button
              type="submit"
              class="w-full h-12 rounded-lg font-semibold text-sm bg-foreground text-background flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
              :disabled="submitting"
            >
              <Loader2 v-if="submitting" :size="14" class="animate-spin" />
              <Check v-else :size="14" />
              Criar tarefa
            </button>
          </div>
        </form>
      </template>

      <!-- ── Habit Toggle Form ── -->
      <template v-else-if="action === 'habit'">
        <form class="flex flex-col" @submit.prevent="submitHabits">
          <header class="flex items-center gap-2 px-3 pt-1 pb-3 border-b border-border sticky top-0 bg-card z-10">
            <button type="button" class="size-9 grid place-items-center rounded-md hover:bg-muted text-muted-foreground" @click="goBack">
              <ArrowLeft :size="16" />
            </button>
            <h3 class="text-sm font-semibold">Marcar hábito de hoje</h3>
          </header>
          <div class="px-5 py-2">
            <p v-if="todayActiveHabits.length === 0" class="text-sm text-muted-foreground py-6 text-center">
              Nenhum hábito ativo encontrado.
            </p>
            <ul v-else class="divide-y divide-border">
              <li v-for="habit in todayActiveHabits" :key="habit.id">
                <label class="flex items-center gap-3 py-3 cursor-pointer min-h-[56px]">
                  <div
                    class="size-5 rounded border-2 flex items-center justify-center shrink-0 transition-all"
                    :class="selectedHabits.has(habit.id)
                      ? 'bg-foreground border-foreground'
                      : 'border-border'"
                    @click="toggleHabit(habit.id)"
                  >
                    <Check v-if="selectedHabits.has(habit.id)" :size="12" class="text-background" />
                  </div>
                  <span
                    class="flex items-center justify-center w-7 h-7 rounded-md shrink-0"
                    :style="{ backgroundColor: (habit.color ?? 'hsl(var(--muted))') + '25', color: habit.color ?? 'hsl(var(--muted-foreground))' }"
                  >
                    <component
                      :is="habit.icon && findIcon(habit.icon) ? findIcon(habit.icon)!.component : null"
                      v-if="habit.icon && findIcon(habit.icon)"
                      :size="14"
                    />
                  </span>
                  <span class="text-sm flex-1">{{ habit.name }}</span>
                  <span v-if="isCompletedToday(habit)" class="text-[10px] text-success/70">✓ hoje</span>
                </label>
              </li>
            </ul>
          </div>
          <div class="sticky bottom-0 bg-card border-t border-border px-4 py-3">
            <button
              type="submit"
              class="w-full h-12 rounded-lg font-semibold text-sm bg-success text-background flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
              :disabled="submitting"
            >
              <Loader2 v-if="submitting" :size="14" class="animate-spin" />
              Confirmar
            </button>
          </div>
        </form>
      </template>

      <!-- ── Event Form ── -->
      <template v-else-if="action === 'event'">
        <form class="flex flex-col" @submit.prevent="submitEvent">
          <header class="flex items-center gap-2 px-3 pt-1 pb-3 border-b border-border sticky top-0 bg-card z-10">
            <button type="button" class="size-9 grid place-items-center rounded-md hover:bg-muted text-muted-foreground" @click="goBack">
              <ArrowLeft :size="16" />
            </button>
            <h3 class="text-sm font-semibold">Novo evento</h3>
          </header>
          <div class="px-5 py-4 space-y-4">
            <div>
              <p class="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-1">Título</p>
              <input
                v-model="eventForm.title"
                autofocus
                placeholder="Reunião, almoço, dentista..."
                class="w-full h-11 px-3 rounded-md bg-muted/50 border border-transparent focus:border-border outline-none text-sm"
              />
            </div>
            <div>
              <p class="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-1">Data</p>
              <DatePicker v-model="eventForm.start_date" />
            </div>
          </div>
          <div class="sticky bottom-0 bg-card border-t border-border px-4 py-3">
            <button
              type="submit"
              class="w-full h-12 rounded-lg font-semibold text-sm bg-foreground text-background flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
              :disabled="submitting"
            >
              <Loader2 v-if="submitting" :size="14" class="animate-spin" />
              Criar evento
            </button>
          </div>
        </form>
      </template>
    </SheetContent>
  </Sheet>
</template>
