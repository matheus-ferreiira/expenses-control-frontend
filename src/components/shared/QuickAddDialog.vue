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
  ArrowLeft, Loader2, Check,
} from 'lucide-vue-next'
import { findIcon } from '@/lib/icons'
import { isCompletedToday } from '@/features/habits/utils/habitHelpers'
import { DatePicker } from '@/components/ui/date-picker'
import type { TransactionType } from '@/types/finance'

type QuickAction = 'expense' | 'income' | 'task' | 'habit' | 'event'

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
    // pre-select first category of the type
    const cats = financeStore.categories.filter((c) => c.type === a || c.type === 'transfer')
    txForm.category_id = cats[0]?.id ?? ''
    txForm.account_id = financeStore.activeAccounts[0]?.id ?? ''
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
  is_recurring: false,
})

function resetTxForm() {
  txForm.type = 'expense'
  txForm.amount = ''
  txForm.description = ''
  txForm.transaction_date = new Date().toLocaleDateString('en-CA')
  txForm.category_id = ''
  txForm.account_id = ''
  txForm.is_recurring = false
}

const txCategories = computed(() =>
  financeStore.categories.filter((c) => c.type === txForm.type),
)

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
  submitting.value = true
  try {
    await financeStore.createTransaction({
      type: txForm.type,
      amount: amt,
      description: txForm.description.trim(),
      transaction_date: txForm.transaction_date,
      ...(txForm.category_id ? { category_id: txForm.category_id } : {}),
      ...(txForm.account_id ? { account_id: txForm.account_id } : {}),
      ...(txForm.is_recurring ? { is_recurring: true } : {}),
    })
    toast.success(txForm.type === 'income' ? 'Receita registrada' : 'Despesa registrada')
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
          <!-- Sticky header -->
          <header class="flex items-center gap-2 px-3 pt-1 pb-3 border-b border-border sticky top-0 bg-card z-10">
            <button type="button" class="size-9 grid place-items-center rounded-md hover:bg-muted text-muted-foreground" @click="goBack">
              <ArrowLeft :size="16" />
            </button>
            <h3 class="text-sm font-semibold">Nova transação</h3>
          </header>

          <div class="px-5 py-4 space-y-4">
            <!-- Segmented toggle -->
            <div class="flex rounded-lg overflow-hidden border border-border p-0.5 bg-muted/30 gap-0.5">
              <button
                v-for="t in (['expense', 'income'] as TransactionType[])"
                :key="t"
                type="button"
                class="flex-1 h-8 rounded-md text-xs font-medium transition-all"
                :class="txForm.type === t
                  ? t === 'expense'
                    ? 'bg-destructive/15 text-destructive'
                    : 'bg-success/15 text-success'
                  : 'text-muted-foreground hover:text-foreground'"
                @click="onTxTypeChange(t)"
              >
                {{ t === 'expense' ? 'Despesa' : 'Receita' }}
              </button>
            </div>

            <!-- Amount — large colored input -->
            <div>
              <p class="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-1">Valor</p>
              <div
                class="text-3xl font-semibold tabular-nums flex items-center gap-1"
                :class="txForm.type === 'expense' ? 'text-destructive' : 'text-success'"
              >
                <span>R$</span>
                <input
                  v-model="txForm.amount"
                  inputmode="decimal"
                  placeholder="0,00"
                  autofocus
                  class="bg-transparent outline-none w-full text-3xl font-semibold tabular-nums placeholder:text-muted-foreground/40"
                  @input="(e: Event) => { txForm.amount = (e.target as HTMLInputElement).value.replace(/[^\d.,]/g, '') }"
                />
              </div>
            </div>

            <!-- Title -->
            <div>
              <p class="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-1">Título</p>
              <input
                v-model="txForm.description"
                placeholder="Onde/o quê? Ex: iFood, Salário"
                class="w-full h-11 px-3 rounded-md bg-muted/50 border border-transparent focus:border-border outline-none text-sm"
              />
            </div>

            <!-- Date -->
            <div>
              <p class="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-1">Data</p>
              <DatePicker v-model="txForm.transaction_date" />
            </div>

            <!-- Category grid -->
            <div v-if="txCategories.length > 0">
              <p class="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-2">Categoria</p>
              <div class="grid grid-cols-4 gap-2">
                <button
                  v-for="cat in txCategories.slice(0, 8)"
                  :key="cat.id"
                  type="button"
                  class="h-20 rounded-lg border text-[11px] font-medium leading-tight px-1 flex flex-col items-center justify-center gap-1.5 transition-all"
                  :class="txForm.category_id === cat.id
                    ? 'bg-muted text-foreground'
                    : 'border-border text-muted-foreground hover:bg-muted/40'"
                  :style="txForm.category_id === cat.id ? { borderColor: cat.color } : {}"
                  @click="txForm.category_id = txForm.category_id === cat.id ? '' : cat.id"
                >
                  <span
                    class="flex items-center justify-center w-7 h-7 rounded-md"
                    :style="{ backgroundColor: cat.color + '25', color: cat.color }"
                  >
                    <component
                      :is="cat.icon && findIcon(cat.icon) ? findIcon(cat.icon)!.component : null"
                      v-if="cat.icon && findIcon(cat.icon)"
                      :size="16"
                    />
                    <span v-else class="text-xs font-bold">{{ cat.name.charAt(0) }}</span>
                  </span>
                  <span class="truncate w-full text-center">{{ cat.name }}</span>
                </button>
              </div>
            </div>

            <!-- Account pills -->
            <div v-if="financeStore.activeAccounts.length > 0">
              <p class="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-2">Conta</p>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="acc in financeStore.activeAccounts"
                  :key="acc.id"
                  type="button"
                  class="h-9 px-3 rounded-full text-xs font-medium border transition-all"
                  :class="txForm.account_id === acc.id
                    ? 'bg-foreground text-background border-foreground'
                    : 'border-border text-muted-foreground hover:bg-muted/40'"
                  @click="txForm.account_id = txForm.account_id === acc.id ? '' : acc.id"
                >
                  {{ acc.name }}
                </button>
              </div>
            </div>

            <!-- Recurring toggle -->
            <div class="flex items-center justify-between pt-1 pb-0.5 border-t border-border/30">
              <span class="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Repeat :size="12" />
                Transação recorrente
                <span class="text-[10px] text-muted-foreground/40">(60 meses)</span>
              </span>
              <button
                type="button"
                class="h-6 w-11 rounded-full transition-colors flex items-center px-0.5 shrink-0"
                :class="txForm.is_recurring ? 'bg-primary' : 'bg-muted'"
                @click="txForm.is_recurring = !txForm.is_recurring"
              >
                <span
                  class="size-5 rounded-full bg-background shadow transition-transform"
                  :class="txForm.is_recurring ? 'translate-x-5' : 'translate-x-0'"
                />
              </button>
            </div>
          </div>

          <!-- Sticky footer -->
          <div class="sticky bottom-0 bg-card border-t border-border px-4 py-3">
            <button
              type="submit"
              class="w-full h-12 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-opacity"
              :class="txForm.type === 'expense'
                ? 'bg-destructive text-destructive-foreground hover:opacity-90'
                : 'bg-success text-background hover:opacity-90'"
              :disabled="submitting"
            >
              <Loader2 v-if="submitting" :size="14" class="animate-spin" />
              Salvar {{ txForm.type === 'expense' ? 'despesa' : 'receita' }}
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
