<script setup lang="ts">
import { ref, computed, nextTick, watch, onMounted } from 'vue'
import { Sheet, SheetContent } from '@ui/sheet'
import { DatePicker } from '@ui/date-picker'
import { Loader2, ChevronDown, Plus, X } from 'lucide-vue-next'
import { useTaskStore } from '@/stores/tasks'
import { useTaskListStore } from '@/stores/taskLists'
import { useTaskTagStore } from '@/stores/taskTags'
import { useToast } from '@/composables/useToast'
import type { TaskPriority, RecurrenceType } from '@/types/tasks'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ 'update:open': [boolean] }>()

const store = useTaskStore()
const listStore = useTaskListStore()
const tagStore = useTaskTagStore()
const toast = useToast()

// ── Core fields ──────────────────────────────────────────────────────────────
const titleRef = ref<HTMLInputElement | null>(null)
const title = ref('')
const dueDate = ref<string | null>(null)
const dueTime = ref('')
const priority = ref<TaskPriority>('normal')
const selectedListId = ref<string | null>(null)
const selectedTagIds = ref<string[]>([])
const estimatedMinutes = ref('')

// ── Recurrence ───────────────────────────────────────────────────────────────
const recurrenceExpanded = ref(false)
const recurrenceType = ref<RecurrenceType>('none')
const weeklyDays = ref<number[]>([])
const customInterval = ref('1')
const customUnit = ref<'days' | 'weeks' | 'months' | 'years'>('days')

// ── Inline list creation ─────────────────────────────────────────────────────
const creatingList = ref(false)
const newListName = ref('')
const newListInputRef = ref<HTMLInputElement | null>(null)
const savingList = ref(false)

const submitting = ref(false)

onMounted(async () => {
  if (!listStore.lists.length) await listStore.fetchLists().catch(() => {})
  if (!tagStore.tags.length) await tagStore.fetchTags().catch(() => {})
})

watch(
  () => props.open,
  (open) => {
    if (open) {
      title.value = ''
      dueDate.value = null
      dueTime.value = ''
      priority.value = 'normal'
      selectedListId.value = null
      selectedTagIds.value = []
      estimatedMinutes.value = ''
      recurrenceExpanded.value = false
      recurrenceType.value = 'none'
      weeklyDays.value = []
      customInterval.value = '1'
      customUnit.value = 'days'
      creatingList.value = false
      newListName.value = ''
      nextTick(() => titleRef.value?.focus())
    }
  },
)

// ── Period badge from dueTime ────────────────────────────────────────────────
const timePeriod = computed(() => {
  if (!dueTime.value) return null
  const hour = parseInt(dueTime.value.split(':')[0] ?? '0', 10)
  if (hour < 12) return { label: 'MANHÃ', cls: 'bg-warning/15 text-warning' }
  if (hour < 18) return { label: 'TARDE', cls: 'bg-primary/15 text-primary' }
  return { label: 'NOITE', cls: 'bg-muted/50 text-muted-foreground' }
})

// ── Recurrence label for collapsed state ─────────────────────────────────────
const recurrenceSummary = computed(() => {
  const labels: Record<RecurrenceType, string> = {
    none: '', daily: 'Diária', weekly: 'Semanal',
    monthly: 'Mensal', yearly: 'Anual', weekday: 'Dias úteis', custom: 'Personalizado',
  }
  return recurrenceType.value !== 'none' ? labels[recurrenceType.value] : null
})

// ── Quick dates ──────────────────────────────────────────────────────────────
function todayStr() { return new Date().toLocaleDateString('en-CA') }
function tomorrowStr() {
  const d = new Date(); d.setDate(d.getDate() + 1); return d.toLocaleDateString('en-CA')
}
function nextWeekStr() {
  const d = new Date(); d.setDate(d.getDate() + 7); return d.toLocaleDateString('en-CA')
}

const QUICK_DATES = [
  { id: 'today',    label: 'Hoje',           date: () => todayStr() },
  { id: 'tomorrow', label: 'Amanhã',         date: () => tomorrowStr() },
  { id: 'week',     label: 'Próxima semana', date: () => nextWeekStr() },
  { id: 'none',     label: 'Sem data',       date: () => null as string | null },
]

function isQuickActive(id: string): boolean {
  if (id === 'none') return dueDate.value === null
  if (id === 'today') return dueDate.value === todayStr()
  if (id === 'tomorrow') return dueDate.value === tomorrowStr()
  if (id === 'week') return dueDate.value === nextWeekStr()
  return false
}

// ── Priorities ───────────────────────────────────────────────────────────────
interface PriorityDef { value: TaskPriority; label: string; activeClass: string }
const PRIORITIES: PriorityDef[] = [
  { value: 'urgent', label: 'P1 Urgente', activeClass: 'bg-destructive/15 text-destructive' },
  { value: 'high',   label: 'P2 Alta',    activeClass: 'bg-warning/15 text-warning' },
  { value: 'normal', label: 'P3 Média',   activeClass: 'bg-muted/60 text-foreground' },
  { value: 'low',    label: 'P4 Baixa',   activeClass: 'bg-muted/30 text-muted-foreground' },
]

// ── Recurrence ───────────────────────────────────────────────────────────────
interface RecurrenceDef { value: RecurrenceType; label: string }
const RECURRENCE_TYPES: RecurrenceDef[] = [
  { value: 'none',    label: 'Não repete' },
  { value: 'daily',   label: 'Diária' },
  { value: 'weekly',  label: 'Semanal' },
  { value: 'monthly', label: 'Mensal' },
  { value: 'yearly',  label: 'Anual' },
  { value: 'weekday', label: 'Dias úteis' },
  { value: 'custom',  label: 'Personalizado' },
]

const WEEKDAYS = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB']
const CUSTOM_UNITS = [
  { value: 'days' as const,   label: 'dias' },
  { value: 'weeks' as const,  label: 'semanas' },
  { value: 'months' as const, label: 'meses' },
  { value: 'years' as const,  label: 'anos' },
]

function selectRecurrenceType(type: RecurrenceType) {
  recurrenceType.value = type
  if (type !== 'weekly') weeklyDays.value = []
}

function toggleWeekday(day: number) {
  const idx = weeklyDays.value.indexOf(day)
  if (idx === -1) weeklyDays.value.push(day)
  else weeklyDays.value.splice(idx, 1)
}

function toggleTag(id: string) {
  const idx = selectedTagIds.value.indexOf(id)
  if (idx === -1) selectedTagIds.value.push(id)
  else selectedTagIds.value.splice(idx, 1)
}

// ── Inline list creation ─────────────────────────────────────────────────────
async function startCreatingList() {
  creatingList.value = true
  newListName.value = ''
  await nextTick()
  newListInputRef.value?.focus()
}

async function confirmNewList() {
  const name = newListName.value.trim()
  if (!name) { creatingList.value = false; return }
  savingList.value = true
  try {
    const list = await listStore.createList({ name })
    selectedListId.value = list.id
    creatingList.value = false
    newListName.value = ''
  } catch {
    toast.error('Erro ao criar lista')
  } finally {
    savingList.value = false
  }
}

function cancelNewList() {
  creatingList.value = false
  newListName.value = ''
}

// ── Build payload ────────────────────────────────────────────────────────────
function buildRecurrenceConfig(): Record<string, unknown> | undefined {
  if (recurrenceType.value === 'weekly' && weeklyDays.value.length) {
    return { days_of_week: [...weeklyDays.value] }
  }
  if (recurrenceType.value === 'custom') {
    return { interval: parseInt(customInterval.value, 10) || 1, interval_unit: customUnit.value }
  }
  return undefined
}

function close() { emit('update:open', false) }

async function submit() {
  if (!title.value.trim()) return
  submitting.value = true
  try {
    const config = buildRecurrenceConfig()
    await store.createTask({
      title: title.value.trim(),
      priority: priority.value,
      ...(dueDate.value ? { due_date: dueDate.value } : {}),
      ...(dueTime.value ? { due_time: dueTime.value } : {}),
      ...(selectedListId.value ? { task_list_id: selectedListId.value } : {}),
      ...(selectedTagIds.value.length ? { tag_ids: selectedTagIds.value } : {}),
      ...(estimatedMinutes.value ? { estimated_minutes: parseInt(estimatedMinutes.value, 10) } : {}),
      ...(recurrenceType.value !== 'none' ? { recurrence_type: recurrenceType.value } : {}),
      ...(config ? { recurrence_config: config } : {}),
    })
    toast.success('Tarefa criada')
    close()
  } catch {
    toast.error('Erro ao criar tarefa')
  } finally {
    submitting.value = false
  }
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && title.value.trim()) { e.preventDefault(); submit() }
}
</script>

<template>
  <Sheet :open="open" @update:open="emit('update:open', $event)">
    <SheetContent
      side="bottom"
      class="rounded-t-2xl border-t-2 border-primary bg-background p-0 max-h-[95vh] flex flex-col [&>button]:hidden"
    >
      <!-- Drag handle -->
      <div class="mx-auto mt-3 mb-0 h-1 w-10 rounded-full bg-muted-foreground/20 shrink-0" />

      <!-- Header -->
      <div class="flex items-center gap-2 px-4 pt-3 pb-4 border-b border-border/50 shrink-0">
        <h3 class="text-[15px] font-semibold leading-none">Nova tarefa</h3>
      </div>

      <!-- Body -->
      <div class="flex-1 overflow-y-auto px-4 py-5 space-y-5">

        <!-- TÍTULO -->
        <div>
          <p class="text-[11px] font-medium uppercase tracking-widest text-muted-foreground/70 mb-2">
            TÍTULO <span class="text-destructive ml-0.5">*</span>
          </p>
          <input
            ref="titleRef"
            v-model="title"
            type="text"
            placeholder="O que precisa ser feito?"
            class="w-full h-12 rounded-lg bg-card border border-border/60 px-3 text-[15px] text-foreground outline-none transition-colors focus:border-primary/60 placeholder:text-muted-foreground/40"
            @keydown="handleKeydown"
          />
        </div>

        <!-- DATA -->
        <div>
          <p class="text-[11px] font-medium uppercase tracking-widest text-muted-foreground/70 mb-2">
            DATA (OPCIONAL)
          </p>
          <div class="flex flex-wrap gap-2 mb-3">
            <button
              v-for="qd in QUICK_DATES"
              :key="qd.id"
              type="button"
              class="rounded-xl px-3 py-1.5 text-[13px] transition-colors"
              :class="isQuickActive(qd.id)
                ? 'bg-primary/15 text-primary font-medium'
                : 'bg-muted/40 text-muted-foreground hover:bg-muted/60'"
              @click="dueDate = qd.date()"
            >{{ qd.label }}</button>
          </div>
          <DatePicker
            :model-value="dueDate ?? ''"
            @update:model-value="dueDate = $event || null"
          />
        </div>

        <!-- HORÁRIO -->
        <div>
          <p class="text-[11px] font-medium uppercase tracking-widest text-muted-foreground/70 mb-2">
            HORÁRIO (OPCIONAL)
          </p>
          <div class="flex items-center gap-2">
            <input
              v-model="dueTime"
              type="time"
              style="color-scheme: dark"
              class="flex-1 h-10 rounded-lg bg-card border border-border/60 px-3 text-[13px] text-foreground outline-none transition-colors focus:border-primary/60"
            />
            <span
              v-if="timePeriod"
              class="h-7 px-2.5 rounded-lg text-[11px] font-semibold inline-flex items-center shrink-0"
              :class="timePeriod.cls"
            >{{ timePeriod.label }}</span>
          </div>
        </div>

        <!-- PRIORIDADE -->
        <div>
          <p class="text-[11px] font-medium uppercase tracking-widest text-muted-foreground/70 mb-2">
            PRIORIDADE
          </p>
          <div class="grid grid-cols-4 gap-1.5">
            <button
              v-for="p in PRIORITIES"
              :key="p.value"
              type="button"
              class="h-9 rounded-lg text-[12px] font-medium transition-all"
              :class="priority === p.value
                ? p.activeClass
                : 'bg-muted/30 text-muted-foreground/60 hover:bg-muted/50'"
              @click="priority = p.value"
            >{{ p.label }}</button>
          </div>
        </div>

        <!-- LISTA -->
        <div>
          <p class="text-[11px] font-medium uppercase tracking-widest text-muted-foreground/70 mb-2">
            LISTA
          </p>
          <div class="flex flex-wrap gap-2">
            <button
              type="button"
              class="rounded-xl px-3 py-1.5 text-[13px] transition-colors"
              :class="selectedListId === null
                ? 'bg-primary/15 text-primary font-medium'
                : 'bg-muted/40 text-muted-foreground hover:bg-muted/60'"
              @click="selectedListId = null"
            >Nenhuma</button>

            <button
              v-for="list in listStore.lists"
              :key="list.id"
              type="button"
              class="rounded-xl px-3 py-1.5 text-[13px] transition-colors"
              :class="selectedListId === list.id
                ? 'bg-primary/15 text-primary font-medium'
                : 'bg-muted/40 text-muted-foreground hover:bg-muted/60'"
              @click="selectedListId = list.id"
            >{{ list.name }}</button>

            <!-- Inline create input -->
            <div v-if="creatingList" class="flex items-center gap-1.5">
              <input
                ref="newListInputRef"
                v-model="newListName"
                type="text"
                placeholder="Nome da lista"
                class="h-8 w-36 rounded-lg bg-card border border-primary/60 px-2 text-[13px] text-foreground outline-none placeholder:text-muted-foreground/40"
                @keydown.enter="confirmNewList"
                @keydown.escape="cancelNewList"
              />
              <button
                type="button"
                class="size-8 rounded-lg bg-primary/15 text-primary flex items-center justify-center hover:bg-primary/25 transition-colors disabled:opacity-40"
                :disabled="savingList"
                @click="confirmNewList"
              >
                <Loader2 v-if="savingList" :size="12" class="animate-spin" />
                <span v-else class="text-[12px] font-bold leading-none">✓</span>
              </button>
              <button
                type="button"
                class="size-8 rounded-lg bg-muted/40 text-muted-foreground flex items-center justify-center hover:bg-muted/60 transition-colors"
                @click="cancelNewList"
              >
                <X :size="12" />
              </button>
            </div>

            <button
              v-else
              type="button"
              class="rounded-xl px-3 py-1.5 text-[13px] transition-colors bg-muted/20 text-muted-foreground/50 hover:bg-muted/40 flex items-center gap-1"
              @click="startCreatingList"
            >
              <Plus :size="12" />
              Nova lista
            </button>
          </div>
        </div>

        <!-- TAGS -->
        <div v-if="tagStore.tags.length">
          <p class="text-[11px] font-medium uppercase tracking-widest text-muted-foreground/70 mb-2">
            TAGS
          </p>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="tag in tagStore.tags"
              :key="tag.id"
              type="button"
              class="rounded-xl px-3 py-1.5 text-[13px] transition-colors"
              :class="selectedTagIds.includes(tag.id)
                ? 'bg-primary/15 text-primary font-medium'
                : 'bg-muted/40 text-muted-foreground hover:bg-muted/60'"
              @click="toggleTag(tag.id)"
            >{{ tag.name }}</button>
          </div>
        </div>

        <!-- REPETIR -->
        <div>
          <button
            type="button"
            class="flex items-center justify-between w-full"
            @click="recurrenceExpanded = !recurrenceExpanded"
          >
            <p class="text-[11px] font-medium uppercase tracking-widest text-muted-foreground/70">
              REPETIR
            </p>
            <div class="flex items-center gap-1.5">
              <span v-if="recurrenceSummary" class="text-[12px] text-primary font-medium">
                {{ recurrenceSummary }}
              </span>
              <ChevronDown
                :size="14"
                class="text-muted-foreground/50 transition-transform duration-200"
                :class="recurrenceExpanded ? 'rotate-180' : ''"
              />
            </div>
          </button>

          <div v-if="recurrenceExpanded" class="mt-3 space-y-3">
            <!-- Type chips -->
            <div class="flex flex-wrap gap-1.5">
              <button
                v-for="rt in RECURRENCE_TYPES"
                :key="rt.value"
                type="button"
                class="rounded-xl px-3 py-1.5 text-[13px] transition-colors"
                :class="recurrenceType === rt.value
                  ? 'bg-primary/15 text-primary font-medium'
                  : 'bg-muted/40 text-muted-foreground hover:bg-muted/60'"
                @click="selectRecurrenceType(rt.value)"
              >{{ rt.label }}</button>
            </div>

            <!-- Weekday grid (semanal) -->
            <div v-if="recurrenceType === 'weekly'" class="grid grid-cols-7 gap-1">
              <button
                v-for="(day, idx) in WEEKDAYS"
                :key="idx"
                type="button"
                class="h-9 rounded-lg text-[11px] font-semibold transition-all"
                :class="weeklyDays.includes(idx)
                  ? 'bg-primary/15 text-primary'
                  : 'bg-muted/30 text-muted-foreground/60 hover:bg-muted/50'"
                @click="toggleWeekday(idx)"
              >{{ day }}</button>
            </div>

            <!-- Custom interval -->
            <div v-if="recurrenceType === 'custom'" class="flex items-center gap-2">
              <span class="text-[13px] text-muted-foreground shrink-0">A cada</span>
              <input
                v-model="customInterval"
                type="text"
                inputmode="numeric"
                placeholder="1"
                class="w-16 h-9 rounded-lg bg-card border border-border/60 px-2 text-[13px] text-foreground text-center outline-none focus:border-primary/60 transition-colors"
              />
              <div class="relative flex-1">
                <select
                  v-model="customUnit"
                  class="w-full h-9 rounded-lg border border-border bg-card px-3 text-[13px] text-foreground focus:outline-none focus:border-primary/60 appearance-none cursor-pointer"
                >
                  <option v-for="u in CUSTOM_UNITS" :key="u.value" :value="u.value">
                    {{ u.label }}
                  </option>
                </select>
                <ChevronDown
                  :size="12"
                  class="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/50 pointer-events-none"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- ESTIMATIVA -->
        <div>
          <p class="text-[11px] font-medium uppercase tracking-widest text-muted-foreground/70 mb-2">
            ESTIMATIVA (MIN)
          </p>
          <input
            v-model="estimatedMinutes"
            type="text"
            inputmode="numeric"
            placeholder="Ex: 30"
            class="w-full h-10 rounded-lg bg-card border border-border/60 px-3 text-[14px] text-foreground outline-none transition-colors focus:border-primary/60 placeholder:text-muted-foreground/40"
          />
        </div>

      </div>

      <!-- Footer -->
      <div class="px-4 pt-3 pb-8 border-t border-border/40 shrink-0">
        <button
          type="button"
          class="w-full h-[52px] rounded-xl bg-primary text-primary-foreground font-semibold text-[15px] flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-40"
          :disabled="!title.trim() || submitting"
          @click="submit"
        >
          <Loader2 v-if="submitting" :size="16" class="animate-spin" />
          Criar tarefa
        </button>
      </div>
    </SheetContent>
  </Sheet>
</template>
