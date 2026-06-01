<script setup lang="ts">
import { ref, computed, reactive, watch } from 'vue'
import { useUiStore } from '@/stores/ui'
import { useTaskStore } from '@/stores/tasks'
import { useHabitStore } from '@/stores/habits'
import { useCalendarStore } from '@/stores/calendar'
import { useToast } from '@/composables/useToast'
import { useTransactionForm } from '@/composables/useTransactionForm'
import { Sheet, SheetContent } from '@ui/sheet'
import {
  CheckSquare, TrendingDown, TrendingUp, Repeat, CalendarPlus,
  ArrowLeft, Loader2, Check, ArrowLeftRight,
} from 'lucide-vue-next'
import { findIcon } from '@/lib/icons'
import { isCompletedToday } from '@/features/habits/utils/habitHelpers'
import { DatePicker } from '@/components/ui/date-picker'
import type { TransactionType } from '@/types/finance'

type QuickAction = 'expense' | 'income' | 'transfer' | 'task' | 'habit' | 'event'

const ui = useUiStore()
const taskStore = useTaskStore()
const habitStore = useHabitStore()
const calendarStore = useCalendarStore()
const toast = useToast()
const { openTransactionForm } = useTransactionForm()

const open = computed({
  get: () => ui.quickAddOpen,
  set: (v) => (ui.quickAddOpen = v),
})

const action = ref<QuickAction | null>(null)
const submitting = ref(false)

watch(open, (val) => {
  if (val && !habitStore.habits.length) habitStore.fetchHabits()
})

function selectAction(a: QuickAction) {
  if (a === 'expense' || a === 'income' || a === 'transfer') {
    open.value = false
    setTimeout(() => openTransactionForm({ type: a as TransactionType }), 220)
    return
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
    resetTaskForm()
    resetEventForm()
  }, 300)
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
  { id: 'task' as QuickAction, label: 'Nova tarefa', desc: 'Item para sua lista', icon: CheckSquare, bgClass: 'bg-blue-500/15', iconClass: 'text-blue-400' },
  { id: 'expense' as QuickAction, label: 'Nova despesa', desc: 'Registre um gasto', icon: TrendingDown, bgClass: 'bg-destructive/15', iconClass: 'text-destructive' },
  { id: 'income' as QuickAction, label: 'Nova receita', desc: 'Registre uma entrada', icon: TrendingUp, bgClass: 'bg-success/15', iconClass: 'text-success' },
  { id: 'transfer' as QuickAction, label: 'Transferência', desc: 'Mover entre contas', icon: ArrowLeftRight, bgClass: 'bg-muted/60', iconClass: 'text-muted-foreground' },
  { id: 'habit' as QuickAction, label: 'Marcar hábito', desc: 'Concluir hábito de hoje', icon: Repeat, bgClass: 'bg-warning/15', iconClass: 'text-warning' },
  { id: 'event' as QuickAction, label: 'Novo evento', desc: 'Adicionar à agenda', icon: CalendarPlus, bgClass: 'bg-violet-500/15', iconClass: 'text-violet-400' },
]
</script>

<template>
  <Sheet v-model:open="open">
    <SheetContent side="bottom"
      class="rounded-t-2xl border-t-2 border-primary bg-background p-0 max-h-[92vh] overflow-y-auto [&>button]:hidden">
      <!-- Drag handle -->
      <div class="mx-auto mt-2 mb-1 h-1 w-10 rounded-full bg-muted-foreground/20" />

      <!-- ── Action menu ── -->
      <template v-if="!action">
        <div class="px-5 pt-2 pb-3">
          <p class="text-[15px] font-semibold">Adicionar rápido</p>
          <p class="text-[12px] text-muted-foreground mt-0.5">O que você quer registrar agora?</p>
        </div>
        <ul class="px-2 pb-6">
          <li v-for="a in QUICK_ACTIONS" :key="a.id">
            <button
              class="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left min-h-[56px] transition-colors hover:bg-muted/40"
              @click="selectAction(a.id)">
              <span class="size-10 rounded-lg grid place-items-center shrink-0" :class="a.bgClass">
                <component :is="a.icon" :size="20" :class="a.iconClass" />
              </span>
              <span class="flex-1 min-w-0">
                <span class="block text-[13px] font-medium">{{ a.label }}</span>
                <span class="block text-[11px] text-muted-foreground">{{ a.desc }}</span>
              </span>
            </button>
          </li>
        </ul>
      </template>

      <!-- ── Task Form ── -->
      <template v-else-if="action === 'task'">
        <form class="flex flex-col" @submit.prevent="submitTask">
          <header class="flex items-center gap-2 px-3 pt-1 pb-3 border-b border-border sticky top-0 bg-background z-10">
            <button type="button" class="size-9 grid place-items-center rounded-md hover:bg-card text-muted-foreground"
              @click="goBack">
              <ArrowLeft :size="16" />
            </button>
            <h3 class="text-[13px] font-semibold">Nova tarefa</h3>
          </header>
          <div class="px-5 py-4 space-y-4">
            <div>
              <p class="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-1">Título</p>
              <input v-model="taskForm.title" autofocus placeholder="O que precisa ser feito?"
                class="w-full h-11 px-3 rounded-lg bg-card border border-border/60 focus:border-border outline-none text-[13px]" />
            </div>
            <div>
              <p class="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-1">Data
                (opcional)</p>
              <DatePicker v-model="taskForm.due_date" />
            </div>
          </div>
          <div class="sticky bottom-0 bg-background border-t border-border px-4 py-3">
            <button type="submit"
              class="w-full h-12 rounded-lg font-semibold text-[13px] bg-primary text-primary-foreground flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
              :disabled="submitting">
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
          <header class="flex items-center gap-2 px-3 pt-1 pb-3 border-b border-border sticky top-0 bg-background z-10">
            <button type="button" class="size-9 grid place-items-center rounded-md hover:bg-card text-muted-foreground"
              @click="goBack">
              <ArrowLeft :size="16" />
            </button>
            <h3 class="text-[13px] font-semibold">Marcar hábito de hoje</h3>
          </header>
          <div class="px-5 py-2">
            <p v-if="todayActiveHabits.length === 0" class="text-[13px] text-muted-foreground py-6 text-center">
              Nenhum hábito ativo encontrado.
            </p>
            <ul v-else class="divide-y divide-border">
              <li v-for="habit in todayActiveHabits" :key="habit.id">
                <label class="flex items-center gap-3 py-3 cursor-pointer min-h-[56px]">
                  <div class="size-5 rounded border-2 flex items-center justify-center shrink-0 transition-all" :class="selectedHabits.has(habit.id)
                    ? 'bg-foreground border-foreground'
                    : 'border-border'" @click="toggleHabit(habit.id)">
                    <Check v-if="selectedHabits.has(habit.id)" :size="12" class="text-background" />
                  </div>
                  <span class="flex items-center justify-center w-7 h-7 rounded-md shrink-0"
                    :style="{ backgroundColor: (habit.color ?? 'hsl(var(--muted))') + '25', color: habit.color ?? 'hsl(var(--muted-foreground))' }">
                    <component :is="habit.icon && findIcon(habit.icon) ? findIcon(habit.icon)!.component : null"
                      v-if="habit.icon && findIcon(habit.icon)" :size="14" />
                  </span>
                  <span class="text-[13px] flex-1">{{ habit.name }}</span>
                  <span v-if="isCompletedToday(habit)" class="text-[10px] text-success/70">✓ hoje</span>
                </label>
              </li>
            </ul>
          </div>
          <div class="sticky bottom-0 bg-background border-t border-border px-4 py-3">
            <button type="submit"
              class="w-full h-12 rounded-lg font-semibold text-[13px] bg-primary text-primary-foreground flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
              :disabled="submitting">
              <Loader2 v-if="submitting" :size="14" class="animate-spin" />
              Confirmar
            </button>
          </div>
        </form>
      </template>

      <!-- ── Event Form ── -->
      <template v-else-if="action === 'event'">
        <form class="flex flex-col" @submit.prevent="submitEvent">
          <header class="flex items-center gap-2 px-3 pt-1 pb-3 border-b border-border sticky top-0 bg-background z-10">
            <button type="button" class="size-9 grid place-items-center rounded-md hover:bg-card text-muted-foreground"
              @click="goBack">
              <ArrowLeft :size="16" />
            </button>
            <h3 class="text-[13px] font-semibold">Novo evento</h3>
          </header>
          <div class="px-5 py-4 space-y-4">
            <div>
              <p class="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-1">Título</p>
              <input v-model="eventForm.title" autofocus placeholder="Reunião, almoço, dentista..."
                class="w-full h-11 px-3 rounded-lg bg-card border border-border/60 focus:border-border outline-none text-[13px]" />
            </div>
            <div>
              <p class="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-1">Data</p>
              <DatePicker v-model="eventForm.start_date" />
            </div>
          </div>
          <div class="sticky bottom-0 bg-background border-t border-border px-4 py-3">
            <button type="submit"
              class="w-full h-12 rounded-lg font-semibold text-[13px] bg-primary text-primary-foreground flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
              :disabled="submitting">
              <Loader2 v-if="submitting" :size="14" class="animate-spin" />
              Criar evento
            </button>
          </div>
        </form>
      </template>
    </SheetContent>
  </Sheet>
</template>
