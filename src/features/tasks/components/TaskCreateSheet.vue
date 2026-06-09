<script setup lang="ts">
import { ref, nextTick, watch } from 'vue'
import { Sheet, SheetContent } from '@ui/sheet'
import { DatePicker } from '@ui/date-picker'
import { Loader2 } from 'lucide-vue-next'
import { useTaskStore } from '@/stores/tasks'
import { useToast } from '@/composables/useToast'
import type { TaskPriority } from '@/types/tasks'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ 'update:open': [boolean] }>()

const store = useTaskStore()
const toast = useToast()

const titleRef = ref<HTMLInputElement | null>(null)
const title = ref('')
const dueDate = ref<string | null>(null)
const priority = ref<TaskPriority>('normal')
const submitting = ref(false)

watch(
  () => props.open,
  (open) => {
    if (open) {
      title.value = ''
      dueDate.value = null
      priority.value = 'normal'
      nextTick(() => titleRef.value?.focus())
    }
  },
)

function todayStr() {
  return new Date().toLocaleDateString('en-CA')
}
function tomorrowStr() {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toLocaleDateString('en-CA')
}
function nextWeekStr() {
  const d = new Date()
  d.setDate(d.getDate() + 7)
  return d.toLocaleDateString('en-CA')
}

const QUICK_DATES = [
  { id: 'today',    label: 'Hoje',           date: () => todayStr() },
  { id: 'tomorrow', label: 'Amanhã',         date: () => tomorrowStr() },
  { id: 'week',     label: 'Próxima semana', date: () => nextWeekStr() },
  { id: 'none',     label: 'Sem data',       date: () => null as string | null },
]

function isQuickActive(id: string): boolean {
  if (id === 'none') return dueDate.value === null
  if (id === 'today')    return dueDate.value === todayStr()
  if (id === 'tomorrow') return dueDate.value === tomorrowStr()
  if (id === 'week')     return dueDate.value === nextWeekStr()
  return false
}

function selectQuickDate(item: typeof QUICK_DATES[0]) {
  dueDate.value = item.date()
}

interface PriorityDef {
  value: TaskPriority
  label: string
  activeClass: string
}

const PRIORITIES: PriorityDef[] = [
  { value: 'urgent', label: 'P1 Urgente', activeClass: 'bg-destructive/15 text-destructive' },
  { value: 'high',   label: 'P2 Alta',    activeClass: 'bg-warning/15 text-warning' },
  { value: 'normal', label: 'P3 Média',   activeClass: 'bg-muted/60 text-foreground' },
  { value: 'low',    label: 'P4 Baixa',   activeClass: 'bg-muted/30 text-muted-foreground' },
]

function close() {
  emit('update:open', false)
}

async function submit() {
  if (!title.value.trim()) return
  submitting.value = true
  try {
    await store.createTask({
      title: title.value.trim(),
      priority: priority.value,
      ...(dueDate.value ? { due_date: dueDate.value } : {}),
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
  if (e.key === 'Enter' && title.value.trim()) {
    e.preventDefault()
    submit()
  }
}
</script>

<template>
  <Sheet :open="open" @update:open="emit('update:open', $event)">
    <SheetContent
      side="bottom"
      class="rounded-t-2xl border-t-2 border-primary bg-background p-0 max-h-[92vh] flex flex-col [&>button]:hidden"
    >
      <!-- Drag handle -->
      <div class="mx-auto mt-3 mb-0 h-1 w-10 rounded-full bg-muted-foreground/20 shrink-0" />

      <!-- Header -->
      <div class="flex items-center gap-2 px-4 pt-3 pb-4 border-b border-border/50 shrink-0">
        <h3 class="text-[15px] font-semibold leading-none">Nova tarefa</h3>
      </div>

      <!-- Body -->
      <div class="flex-1 overflow-y-auto px-4 py-5 space-y-5">

        <!-- Título -->
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

        <!-- Data -->
        <div>
          <p class="text-[11px] font-medium uppercase tracking-widest text-muted-foreground/70 mb-2">
            DATA (OPCIONAL)
          </p>
          <!-- Quick chips -->
          <div class="flex flex-wrap gap-2 mb-3">
            <button
              v-for="qd in QUICK_DATES"
              :key="qd.id"
              type="button"
              class="rounded-xl px-3 py-1.5 text-[13px] transition-colors"
              :class="isQuickActive(qd.id)
                ? 'bg-primary/15 text-primary font-medium'
                : 'bg-muted/40 text-muted-foreground hover:bg-muted/60'"
              @click="selectQuickDate(qd)"
            >{{ qd.label }}</button>
          </div>
          <!-- Custom date picker -->
          <DatePicker
            :model-value="dueDate ?? ''"
            @update:model-value="dueDate = $event || null"
          />
        </div>

        <!-- Prioridade -->
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
