<script setup lang="ts">
import { ref, computed, nextTick, watch } from 'vue'
import { Sheet, SheetContent } from '@ui/sheet'
import { DatePicker } from '@ui/date-picker'
import {
  Calendar,
  Clock,
  Flag,
  FolderOpen,
  Tag,
  X,
  CheckCircle2,
  RotateCcw,
  Trash2,
} from 'lucide-vue-next'
import TaskSubtaskList from './TaskSubtaskList.vue'
import { ConfirmDialog } from '@/components/shared'
import type { Task, TaskPriority } from '@/types/tasks'
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

// ── Date picker row ──────────────────────────────────────────────────────────
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

// ── Priority picker row ──────────────────────────────────────────────────────
const showPriorityPicker = ref(false)

interface PriorityDef {
  value: TaskPriority
  activeClass: string
}

const PRIORITIES: PriorityDef[] = [
  { value: 'urgent', activeClass: 'bg-destructive/15 text-destructive' },
  { value: 'high',   activeClass: 'bg-warning/15 text-warning' },
  { value: 'normal', activeClass: 'bg-muted/60 text-foreground' },
  { value: 'low',    activeClass: 'bg-muted/30 text-muted-foreground' },
]

async function selectPriority(p: TaskPriority) {
  if (!props.task || p === props.task.priority) { showPriorityPicker.value = false; return }
  showPriorityPicker.value = false
  try {
    await store.optimisticUpdate(props.task.id, { priority: p })
  } catch {
    toast.error('Erro ao salvar')
  }
}

// ── Priority colour helper (using CSS vars) ───────────────────────────────────
function priorityDotStyle(p: TaskPriority): string {
  switch (p) {
    case 'urgent': return 'color: hsl(var(--destructive))'
    case 'high':   return 'color: hsl(var(--warning))'
    default:       return 'color: hsl(var(--muted-foreground) / 0.5)'
  }
}

// ── Status badge ─────────────────────────────────────────────────────────────
function statusBadgeClass(task: Task): string {
  switch (task.status) {
    case 'completed':   return 'bg-success/15 border-success/30 text-success'
    case 'in_progress': return 'bg-warning/15 border-warning/30 text-warning'
    case 'cancelled':   return 'bg-muted/30 border-border/30 text-muted-foreground'
    default:            return 'bg-muted/20 border-border/30 text-muted-foreground'
  }
}

// ── Actions ──────────────────────────────────────────────────────────────────
const isCompleted = computed(() => props.task?.status === 'completed')
const progress = computed(() => props.task ? getSubtaskProgress(props.task) : 0)
const dueDateLabel = computed(() =>
  props.task?.due_date ? formatDueDate(props.task.due_date) : null,
)

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

// ── Subtasks ─────────────────────────────────────────────────────────────────
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

// Reset inline pickers when task changes or sheet closes
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
      <div class="mx-auto mt-3 mb-0 h-1 w-10 rounded-full bg-muted-foreground/20 shrink-0" />

      <template v-if="task">
        <!-- Header: status badge + close -->
        <div class="flex items-center justify-between px-5 pt-2 pb-3 shrink-0">
          <span
            class="inline-flex items-center h-6 px-2.5 rounded text-[11px] font-semibold border"
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
        <div class="flex-1 overflow-y-auto px-5 pb-4 space-y-4">

          <!-- Title (inline edit) -->
          <div>
            <input
              v-if="editingTitle"
              ref="titleRef"
              v-model="titleDraft"
              type="text"
              class="w-full text-[17px] font-semibold text-foreground bg-transparent border-b border-primary/60 outline-none pb-0.5"
              @blur="saveTitle"
              @keydown.enter="saveTitle"
              @keydown.escape="editingTitle = false"
            />
            <button
              v-else
              type="button"
              class="text-left w-full text-[17px] font-semibold leading-snug"
              :class="task.status === 'completed' || task.status === 'cancelled'
                ? 'line-through text-muted-foreground/50'
                : 'text-foreground'"
              @click="startEditTitle"
            >{{ task.title }}</button>
          </div>

          <!-- Description (inline edit) -->
          <div>
            <textarea
              v-if="editingDesc"
              ref="descRef"
              v-model="descDraft"
              rows="3"
              class="w-full text-[13px] text-foreground bg-card border border-border/60 rounded-lg px-3 py-2 outline-none resize-none focus:border-primary/60 transition-colors placeholder:text-muted-foreground/40"
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
              <p
                v-if="task.description"
                class="text-[13px] text-muted-foreground leading-relaxed"
              >{{ task.description }}</p>
              <p
                v-else
                class="text-[13px] text-muted-foreground/35 italic"
              >Adicionar descrição...</p>
            </button>
          </div>

          <!-- Date row -->
          <div>
            <button
              type="button"
              class="flex items-center gap-2 w-full py-2 rounded-lg hover:bg-muted/20 transition-colors -mx-1 px-1"
              @click="showDatePicker = !showDatePicker; showPriorityPicker = false"
            >
              <Calendar :size="15" class="text-muted-foreground/60 shrink-0" />
              <span
                v-if="dueDateLabel"
                class="text-[13px] font-medium"
                :class="task.due_date && task.due_date < new Date().toLocaleDateString('en-CA') && task.status !== 'completed'
                  ? 'text-destructive'
                  : 'text-foreground'"
              >{{ dueDateLabel }}</span>
              <span v-else class="text-[13px] text-muted-foreground/40">Sem data de entrega</span>
            </button>
            <div v-if="showDatePicker" class="mt-2 ml-1">
              <DatePicker
                :model-value="task.due_date ?? ''"
                @update:model-value="saveDate($event)"
              />
            </div>
          </div>

          <!-- Priority row -->
          <div>
            <button
              type="button"
              class="flex items-center gap-2 w-full py-2 rounded-lg hover:bg-muted/20 transition-colors -mx-1 px-1"
              @click="showPriorityPicker = !showPriorityPicker; showDatePicker = false"
            >
              <Flag :size="15" class="shrink-0" :style="priorityDotStyle(task.priority)" />
              <span class="text-[13px] font-medium text-foreground">
                {{ TASK_PRIORITY_LABELS[task.priority] }}
              </span>
            </button>
            <div v-if="showPriorityPicker" class="mt-2 ml-1 grid grid-cols-4 gap-1.5">
              <button
                v-for="p in PRIORITIES"
                :key="p.value"
                type="button"
                class="h-9 rounded-lg text-[11px] font-medium transition-all"
                :class="task.priority === p.value
                  ? p.activeClass
                  : 'bg-muted/30 text-muted-foreground/60 hover:bg-muted/50'"
                @click="selectPriority(p.value)"
              >{{ TASK_PRIORITY_LABELS[p.value] }}</button>
            </div>
          </div>

          <!-- List row -->
          <div v-if="task.task_list">
            <div class="flex items-center gap-2 w-full py-2 -mx-1 px-1">
              <FolderOpen :size="15" class="text-muted-foreground/60 shrink-0" />
              <span class="text-[13px] text-muted-foreground">{{ task.task_list.name }}</span>
            </div>
          </div>

          <!-- Tags row -->
          <div v-if="task.tags && task.tags.length">
            <div class="flex items-start gap-2 w-full py-2 -mx-1 px-1">
              <Tag :size="15" class="text-muted-foreground/60 shrink-0 mt-0.5" />
              <div class="flex flex-wrap gap-1.5">
                <span
                  v-for="tag in task.tags"
                  :key="tag.id"
                  class="inline-flex items-center h-5 px-2 rounded text-[11px] font-medium bg-muted/40 text-muted-foreground"
                >{{ tag.name }}</span>
              </div>
            </div>
          </div>

          <!-- Estimated time row -->
          <div v-if="task.estimated_minutes">
            <div class="flex items-center gap-2 w-full py-2 -mx-1 px-1">
              <Clock :size="15" class="text-muted-foreground/60 shrink-0" />
              <span class="text-[13px] text-muted-foreground tabular-nums">
                {{ task.estimated_minutes >= 60
                  ? `${Math.floor(task.estimated_minutes / 60)}h${task.estimated_minutes % 60 ? ` ${task.estimated_minutes % 60}min` : ''}`
                  : `${task.estimated_minutes}min` }}
              </span>
            </div>
          </div>

          <!-- Subtasks -->
          <div class="pt-1">
            <div class="flex items-center justify-between mb-2">
              <p class="text-[11px] font-medium uppercase tracking-widest text-muted-foreground/70">
                SUBTAREFAS
              </p>
              <span
                v-if="task.subtasks_count > 0"
                class="text-[11px] text-muted-foreground/50 tabular-nums"
              >{{ task.completed_subtasks_count }}/{{ task.subtasks_count }}</span>
            </div>
            <!-- Progress bar -->
            <div
              v-if="task.subtasks_count > 0"
              class="h-1 rounded-full bg-muted/30 mb-3 overflow-hidden"
            >
              <div
                class="h-full rounded-full transition-all duration-300 bg-success/70"
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
        <div class="px-4 pt-3 pb-8 border-t border-border/40 shrink-0 space-y-2">

          <!-- Primary action -->
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
            class="w-full h-[52px] rounded-xl border border-border/60 text-foreground font-semibold text-[15px] flex items-center justify-center gap-2 transition-all active:scale-[0.98] hover:bg-muted/30"
            @click="handleToggleComplete"
          >
            <RotateCcw :size="16" />
            Reabrir tarefa
          </button>

          <!-- Destructive action -->
          <button
            type="button"
            class="w-full flex items-center justify-center gap-2 h-11 rounded-lg text-[13px] font-medium text-destructive hover:bg-destructive/8 transition-colors"
            @click="showDeleteConfirm = true"
          >
            <Trash2 :size="15" />
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
