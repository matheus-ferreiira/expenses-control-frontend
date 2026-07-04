<script setup lang="ts">
import { ref, computed, nextTick, watch } from 'vue'
import { Sheet, SheetContent } from '@ui/sheet'
import { DatePicker } from '@ui/date-picker'
import {
  Calendar,
  Clock,
  Flag,
  FolderOpen,
  X,
  CheckCircle2,
  RotateCcw,
  Trash2,
  Pencil,
} from 'lucide-vue-next'
import TaskSubtaskList from './TaskSubtaskList.vue'
import TaskRecurrenceHistory from './TaskRecurrenceHistory.vue'
import { ConfirmDialog } from '@/components/shared'
import type { Task, TaskPriority, RecurrenceType } from '@/types/tasks'
import { TASK_STATUS_LABELS, TASK_PRIORITY_LABELS } from '@/types/tasks'
import { formatDueDate, getSubtaskProgress } from '../utils/taskHelpers'
import { useTaskStore } from '@/stores/tasks'
import { useToast } from '@/composables/useToast'

const props = defineProps<{
  open: boolean
  task: Task | null
}>()

const emit = defineEmits<{
  'update:open': [boolean]
  deleted: [id: string]
}>()

const store = useTaskStore()
const toast = useToast()

// ── Inline title edit ────────────────────────────────────────────────────────
const editingTitle = ref(false)
const titleDraft = ref('')
const titleRef = ref<HTMLInputElement | null>(null)

function startEditTitle() {
  if (!props.task) return
  titleDraft.value = props.task.title
  editingTitle.value = true
  nextTick(() => titleRef.value?.focus())
}

async function saveTitle() {
  editingTitle.value = false
  if (!props.task) return
  const trimmed = titleDraft.value.trim()
  if (!trimmed || trimmed === props.task.title) return
  try {
    await store.optimisticUpdate(props.task.id, { title: trimmed })
  } catch {
    toast.error('Erro ao salvar')
  }
}

// ── Inline description edit ──────────────────────────────────────────────────
const editingDesc = ref(false)
const descDraft = ref('')
const descRef = ref<HTMLTextAreaElement | null>(null)

function startEditDesc() {
  if (!props.task) return
  descDraft.value = props.task.description ?? ''
  editingDesc.value = true
  nextTick(() => descRef.value?.focus())
}

async function saveDesc() {
  editingDesc.value = false
  if (!props.task) return
  const trimmed = descDraft.value.trim()
  if (trimmed === (props.task.description ?? '')) return
  try {
    await store.optimisticUpdate(props.task.id, { description: trimmed || undefined })
  } catch {
    toast.error('Erro ao salvar')
  }
}

// ── Date picker ──────────────────────────────────────────────────────────────
const showDatePicker = ref(false)

async function saveDate(value: string | null) {
  if (!props.task) return
  const next = value || null
  if (next === props.task.due_date) return
  showDatePicker.value = false
  try {
    await store.optimisticUpdate(props.task.id, { due_date: next ?? undefined })
  } catch {
    toast.error('Erro ao salvar data')
  }
}

// ── Priority picker ──────────────────────────────────────────────────────────
const showPriorityPicker = ref(false)

interface PriorityDef { value: TaskPriority; activeClass: string }
const PRIORITIES: PriorityDef[] = [
  { value: 'urgent', activeClass: 'bg-muted text-destructive' },
  { value: 'high',   activeClass: 'bg-muted text-warning' },
  { value: 'normal', activeClass: 'bg-muted text-foreground' },
  { value: 'low',    activeClass: 'bg-muted text-muted-foreground' },
]

const PRIORITY_CHIP: Record<TaskPriority, string> = {
  urgent: 'bg-muted text-destructive',
  high:   'bg-muted text-warning',
  normal: 'bg-muted text-muted-foreground',
  low:    'bg-muted text-muted-foreground',
}

async function selectPriority(p: TaskPriority) {
  if (!props.task || p === props.task.priority) { showPriorityPicker.value = false; return }
  showPriorityPicker.value = false
  try {
    await store.optimisticUpdate(props.task.id, { priority: p })
  } catch {
    toast.error('Erro ao salvar')
  }
}

// ── Status badge ─────────────────────────────────────────────────────────────
function statusBadgeClass(task: Task): string {
  switch (task.status) {
    case 'completed':   return 'bg-muted text-success'
    case 'in_progress': return 'bg-muted text-warning'
    case 'cancelled':   return 'bg-muted border-border text-muted-foreground'
    default:            return 'bg-muted border-border text-muted-foreground'
  }
}

// ── Date chip class ───────────────────────────────────────────────────────────
const datechipClass = computed(() => {
  if (showDatePicker.value) return 'bg-muted text-primary'
  if (!props.task?.due_date) return 'bg-muted text-muted-foreground'
  const today = new Date().toLocaleDateString('en-CA')
  if (props.task.due_date < today && props.task.status !== 'completed' && props.task.status !== 'cancelled') {
    return 'bg-muted text-destructive'
  }
  if (props.task.due_date === today) return 'bg-muted text-warning'
  return 'bg-muted text-muted-foreground'
})

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatTimePeriod(time: string): string {
  const hour = parseInt(time.split(':')[0] ?? '0', 10)
  if (hour < 12) return 'MANHÃ'
  if (hour < 18) return 'TARDE'
  return 'NOITE'
}

function formatEstimated(min: number): string {
  if (min >= 60) {
    const h = Math.floor(min / 60)
    const m = min % 60
    return m ? `${h}h ${m}min` : `${h}h`
  }
  return `${min}min`
}

const RECURRENCE_LABELS: Record<RecurrenceType, string> = {
  none: '', daily: 'Diária', weekly: 'Semanal',
  monthly: 'Mensal', yearly: 'Anual', weekdays: 'Dias úteis', custom: 'Personalizado',
}

// ── Computed ──────────────────────────────────────────────────────────────────
const isCompleted = computed(() => props.task?.status === 'completed')
const progress = computed(() => props.task ? getSubtaskProgress(props.task) : 0)
const dueDateLabel = computed(() =>
  props.task?.due_date ? formatDueDate(props.task.due_date) : null,
)

// ── Actions ───────────────────────────────────────────────────────────────────
async function handleToggleComplete() {
  if (!props.task) return
  try {
    await store.toggleComplete(props.task.id)
  } catch {
    toast.error('Erro ao atualizar tarefa')
  }
}

const showDeleteConfirm = ref(false)
const deleting = ref(false)

async function handleDelete() {
  if (!props.task) return
  deleting.value = true
  try {
    await store.deleteTask(props.task.id)
    emit('deleted', props.task.id)
    emit('update:open', false)
    toast.success('Tarefa excluída')
  } catch {
    toast.error('Erro ao excluir tarefa')
  } finally {
    deleting.value = false
    showDeleteConfirm.value = false
  }
}

// ── Subtasks ──────────────────────────────────────────────────────────────────
async function handleSubtaskCreate(title: string) {
  if (!props.task) return
  try { await store.createSubtask(props.task.id, title) }
  catch { toast.error('Erro ao criar subtarefa') }
}

async function handleSubtaskToggle(subtaskId: string) {
  if (!props.task) return
  try { await store.toggleSubtask(props.task.id, subtaskId) }
  catch { toast.error('Erro ao atualizar subtarefa') }
}

async function handleSubtaskDelete(subtaskId: string) {
  if (!props.task) return
  try { await store.deleteSubtask(props.task.id, subtaskId) }
  catch { toast.error('Erro ao excluir subtarefa') }
}

// ── Tag removal ───────────────────────────────────────────────────────────────
async function removeTag(tagId: string) {
  if (!props.task) return
  const newTagIds = props.task.tags.filter((t) => t.id !== tagId).map((t) => t.id)
  try {
    await store.optimisticUpdate(props.task.id, { tag_ids: newTagIds })
  } catch {
    toast.error('Erro ao remover tag')
  }
}

// ── Reset pickers on close ────────────────────────────────────────────────────
watch(() => props.open, (open) => {
  if (!open) {
    editingTitle.value = false
    editingDesc.value = false
    showDatePicker.value = false
    showPriorityPicker.value = false
  }
})
</script>

<template>
  <Sheet :open="open" @update:open="emit('update:open', $event)">
    <SheetContent
      side="bottom"
      class="rounded-t-2xl border-t-2 border-primary bg-background max-h-[88vh] overflow-hidden p-0 focus:outline-none [&>button]:hidden flex flex-col"
    >
      <!-- Drag handle -->
      <div class="mx-auto mt-3 mb-0 h-1 w-10 rounded-full bg-border shrink-0" />

      <template v-if="task">
        <!-- Header: status badge + close -->
        <div class="flex items-center justify-between px-5 pt-2 pb-2 shrink-0">
          <span
            class="inline-flex items-center h-6 px-2.5 rounded text-[11px] font-semibold "
            :class="statusBadgeClass(task)"
          >
            {{ TASK_STATUS_LABELS[task.status] }}
          </span>
          <button
            type="button"
            aria-label="Fechar"
            class="size-7 rounded-full grid place-items-center text-muted-foreground hover:bg-muted transition-colors"
            @click="emit('update:open', false)"
          >
            <X :size="15" />
          </button>
        </div>

        <!-- Body -->
        <div class="flex-1 overflow-y-auto px-5 pb-4">

          <!-- Title (inline edit) -->
          <div class="mb-2">
            <input
              v-if="editingTitle"
              ref="titleRef"
              v-model="titleDraft"
              type="text"
              class="w-full text-[20px] font-semibold text-foreground bg-transparent border-b border-border focus:border-primary outline-none pb-0.5"
              @blur="saveTitle"
              @keydown.enter="saveTitle"
              @keydown.escape="editingTitle = false"
            />
            <button
              v-else
              type="button"
              class="text-left w-full text-[20px] font-semibold leading-snug"
              :class="task.status === 'completed' || task.status === 'cancelled'
                ? 'line-through text-muted-foreground'
                : 'text-foreground'"
              @click="startEditTitle"
            >{{ task.title }}</button>
          </div>

          <!-- Description (inline edit) -->
          <div class="mb-4">
            <textarea
              v-if="editingDesc"
              ref="descRef"
              v-model="descDraft"
              rows="3"
              class="w-full text-[13px] text-foreground bg-card rounded-lg px-3 py-2 outline-none resize-none focus:border-primary transition-colors placeholder:text-muted-foreground"
              placeholder="Adicionar descrição..."
              @blur="saveDesc"
              @keydown.escape="editingDesc = false"
            />
            <button
              v-else
              type="button"
              class="text-left w-full"
              @click="startEditDesc"
            >
              <p v-if="task.description" class="text-[13px] text-muted-foreground leading-relaxed">
                {{ task.description }}
              </p>
              <p v-else class="text-[13px] text-muted-foreground italic">
                Adicionar descrição...
              </p>
            </button>
          </div>

          <!-- Metadata chips row -->
          <div class="flex flex-wrap gap-1.5 mb-1">
            <!-- Date chip (tappable) -->
            <button
              type="button"
              class="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl text-[13px] font-medium transition-colors"
              :class="datechipClass"
              @click="showDatePicker = !showDatePicker; showPriorityPicker = false"
            >
              <Calendar :size="12" />
              {{ dueDateLabel || 'Sem data' }}
            </button>

            <!-- Priority chip (tappable) -->
            <button
              type="button"
              class="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl text-[13px] font-medium transition-colors"
              :class="showPriorityPicker ? 'bg-muted text-primary' : PRIORITY_CHIP[task.priority]"
              @click="showPriorityPicker = !showPriorityPicker; showDatePicker = false"
            >
              <Flag :size="12" />
              {{ TASK_PRIORITY_LABELS[task.priority] }}
            </button>

            <!-- Time chip -->
            <span
              v-if="task.due_time"
              class="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl text-[13px] font-medium bg-muted text-muted-foreground"
            >
              <Clock :size="12" />
              {{ task.due_time.slice(0, 5) }}
              <span class="text-muted-foreground text-[11px]">{{ formatTimePeriod(task.due_time) }}</span>
            </span>

            <!-- List chip -->
            <span
              v-if="task.task_list"
              class="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl text-[13px] font-medium bg-muted text-muted-foreground"
            >
              <FolderOpen :size="12" />
              {{ task.task_list.name }}
            </span>

            <!-- Estimated chip -->
            <span
              v-if="task.estimated_minutes"
              class="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl text-[13px] font-medium bg-muted text-muted-foreground"
            >
              <Clock :size="12" />
              {{ formatEstimated(task.estimated_minutes) }}
            </span>

            <!-- Recurrence chip -->
            <span
              v-if="task.recurrence_type && task.recurrence_type !== 'none'"
              class="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl text-[13px] font-medium bg-muted text-primary"
            >
              <RotateCcw :size="12" />
              {{ RECURRENCE_LABELS[task.recurrence_type] }}
            </span>
          </div>

          <!-- Date picker (inline expansion) -->
          <div v-if="showDatePicker" class="mt-2 mb-3">
            <DatePicker
              :model-value="task.due_date ?? ''"
              @update:model-value="saveDate($event)"
            />
          </div>

          <!-- Priority picker (inline expansion) -->
          <div v-if="showPriorityPicker" class="mt-2 mb-3 grid grid-cols-4 gap-1.5">
            <button
              v-for="p in PRIORITIES"
              :key="p.value"
              type="button"
              class="h-9 rounded-lg text-[11px] font-medium transition-all"
              :class="task.priority === p.value
                ? p.activeClass
                : 'bg-muted text-muted-foreground hover:bg-muted'"
              @click="selectPriority(p.value)"
            >{{ TASK_PRIORITY_LABELS[p.value] }}</button>
          </div>

          <!-- Tags row -->
          <div v-if="task.tags && task.tags.length" class="flex flex-wrap gap-1.5 mt-2 mb-3">
            <span
              v-for="tag in task.tags"
              :key="tag.id"
              class="inline-flex items-center gap-1 h-7 pl-2.5 pr-1.5 rounded-full text-[12px] font-medium bg-muted text-muted-foreground"
            >
              {{ tag.name }}
              <button
                type="button"
                class="size-4 rounded-full flex items-center justify-center hover:bg-border transition-colors shrink-0"
                @click="removeTag(tag.id)"
              >
                <X :size="10" />
              </button>
            </span>
          </div>

          <!-- Recurrence history (shown only for recurring tasks with history) -->
          <TaskRecurrenceHistory
            v-if="task.recurrence_type && task.recurrence_type !== 'none'"
            :task-id="task.id"
          />

          <!-- Subtasks -->
          <div class="pt-3 border-t border-border mt-3">
            <div class="flex items-center justify-between mb-2">
              <p class="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                SUBTAREFAS
              </p>
              <span
                v-if="task.subtasks_count > 0"
                class="text-[11px] text-muted-foreground tabular-nums"
              >{{ task.completed_subtasks_count }}/{{ task.subtasks_count }}</span>
            </div>

            <!-- Progress bar -->
            <div
              v-if="task.subtasks_count > 0"
              class="h-1.5 rounded-full bg-muted mb-3 overflow-hidden"
            >
              <div
                class="h-full rounded-full transition-all duration-300"
                :class="progress >= 100 ? 'bg-success' : 'bg-muted'"
                :style="{ width: `${progress}%` }"
              />
            </div>

            <TaskSubtaskList
              :task-id="task.id"
              :subtasks="task.subtasks"
              @toggle="handleSubtaskToggle"
              @delete="handleSubtaskDelete"
              @create="handleSubtaskCreate"
            />
          </div>

        </div>

        <!-- Footer actions -->
        <div class="px-4 pt-3 pb-8 border-t border-border shrink-0 space-y-2">

          <!-- Primary CTA -->
          <button
            v-if="!isCompleted"
            type="button"
            class="w-full h-[52px] rounded-xl bg-primary text-primary-foreground font-semibold text-[15px] flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            @click="handleToggleComplete"
          >
            <CheckCircle2 :size="18" />
            Marcar como concluída
          </button>
          <button
            v-else
            type="button"
            class="w-full h-[52px] rounded-xl text-foreground font-semibold text-[15px] flex items-center justify-center gap-2 transition-all active:scale-[0.98] hover:bg-muted"
            @click="handleToggleComplete"
          >
            <RotateCcw :size="16" />
            Reabrir tarefa
          </button>

          <!-- Secondary row: pending has Editar + Excluir; completed has just Excluir -->
          <div v-if="!isCompleted" class="flex gap-2">
            <button
              type="button"
              class="flex-1 h-10 rounded-xl text-[13px] text-muted-foreground hover:text-foreground hover:bg-muted flex items-center justify-center gap-1.5 transition-colors"
              @click="startEditTitle"
            >
              <Pencil :size="13" />
              Editar
            </button>
            <button
              type="button"
              class="flex-1 h-10 rounded-xl text-[13px] text-destructive hover:bg-muted flex items-center justify-center gap-1.5 transition-colors"
              @click="showDeleteConfirm = true"
            >
              <Trash2 :size="13" />
              Excluir
            </button>
          </div>
          <button
            v-else
            type="button"
            class="w-full h-10 rounded-xl text-[13px] text-destructive hover:bg-muted flex items-center justify-center gap-1.5 transition-colors"
            @click="showDeleteConfirm = true"
          >
            <Trash2 :size="13" />
            Excluir tarefa
          </button>

        </div>
      </template>
    </SheetContent>
  </Sheet>

  <ConfirmDialog
    v-model:open="showDeleteConfirm"
    title="Excluir tarefa"
    description="Esta ação não pode ser desfeita. A tarefa será permanentemente removida."
    confirm-label="Excluir"
    variant="destructive"
    :loading="deleting"
    @confirm="handleDelete"
  />
</template>
