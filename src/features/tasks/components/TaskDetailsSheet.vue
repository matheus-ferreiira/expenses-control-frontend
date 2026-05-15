<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@ui/sheet'
import { Button } from '@ui/button'
import { Separator } from '@ui/separator'
import { Badge } from '@ui/badge'
import {
  CalendarDays,
  Pencil,
  Trash2,
  Archive,
  CheckCircle2,
  Circle,
  Ban,
  Clock,
} from 'lucide-vue-next'
import TaskPriorityBadge from './TaskPriorityBadge.vue'
import TaskStatusBadge from './TaskStatusBadge.vue'
import TaskLabelBadge from './TaskLabelBadge.vue'
import TaskSubtaskList from './TaskSubtaskList.vue'
import { ConfirmDialog } from '@/components/shared'
import type { Task } from '@/types/tasks'
import { formatDueDate, getSubtaskProgress } from '../utils/taskHelpers'
import { useTaskStore } from '@/stores/tasks'
import { useToast } from '@/composables/useToast'

const props = defineProps<{
  open: boolean
  task: Task | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  edit: [task: Task]
  deleted: [id: string]
}>()

const store = useTaskStore()
const toast = useToast()
const showDeleteConfirm = ref(false)
const deleting = ref(false)

const progress = computed(() =>
  props.task ? getSubtaskProgress(props.task) : 0,
)

const dueDateLabel = computed(() =>
  props.task?.due_date ? formatDueDate(props.task.due_date) : null,
)

async function handleToggle() {
  if (!props.task) return
  try {
    await store.toggleComplete(props.task.id)
  } catch {
    toast.error('Erro ao atualizar tarefa')
  }
}

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

async function handleArchive() {
  if (!props.task) return
  try {
    await store.archiveTask(props.task.id)
    emit('update:open', false)
    toast.success('Tarefa arquivada')
  } catch {
    toast.error('Erro ao arquivar tarefa')
  }
}

async function handleSubtaskCreate(title: string) {
  if (!props.task) return
  try {
    await store.createSubtask(props.task.id, title)
  } catch {
    toast.error('Erro ao criar subtarefa')
  }
}

async function handleSubtaskToggle(subtaskId: string) {
  if (!props.task) return
  try {
    await store.toggleSubtask(props.task.id, subtaskId)
  } catch {
    toast.error('Erro ao atualizar subtarefa')
  }
}

async function handleSubtaskDelete(subtaskId: string) {
  if (!props.task) return
  try {
    await store.deleteSubtask(props.task.id, subtaskId)
  } catch {
    toast.error('Erro ao excluir subtarefa')
  }
}
</script>

<template>
  <Sheet :open="open" @update:open="emit('update:open', $event)">
    <SheetContent class="w-full sm:max-w-lg overflow-y-auto" side="right">
      <template v-if="task">
        <SheetHeader class="pr-8">
          <div class="flex items-start gap-2">
            <!-- Completion toggle -->
            <button
              class="mt-1 shrink-0 text-muted-foreground hover:text-primary transition-base"
              @click="handleToggle"
            >
              <CheckCircle2
                v-if="task.status === 'completed'"
                :size="20"
                class="text-emerald-400"
              />
              <Ban v-else-if="task.status === 'cancelled'" :size="20" class="text-muted-foreground" />
              <Circle v-else :size="20" />
            </button>

            <SheetTitle
              :class="[
                'text-left leading-snug',
                (task.status === 'completed' || task.status === 'cancelled') &&
                  'line-through text-muted-foreground',
              ]"
            >
              {{ task.title }}
            </SheetTitle>
          </div>
        </SheetHeader>

        <div class="mt-6 space-y-5">
          <!-- Badges row -->
          <div class="flex flex-wrap items-center gap-2">
            <TaskStatusBadge :status="task.status" />
            <TaskPriorityBadge :priority="task.priority" dot />
            <TaskLabelBadge v-for="label in task.labels" :key="label.id" :label="label" />
          </div>

          <!-- Due date -->
          <div v-if="task.due_date" class="flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarDays :size="15" />
            <span>{{ dueDateLabel }}</span>
            <span v-if="task.due_time" class="flex items-center gap-1">
              <Clock :size="13" />
              {{ task.due_time }}
            </span>
          </div>

          <!-- Description -->
          <div v-if="task.description" class="text-sm text-muted-foreground leading-relaxed">
            {{ task.description }}
          </div>

          <Separator />

          <!-- Subtasks -->
          <div>
            <div class="flex items-center justify-between mb-3">
              <p class="text-sm font-medium">
                Subtarefas
                <span class="text-muted-foreground font-normal ml-1">
                  {{ task.completed_subtasks_count }}/{{ task.subtasks_count }}
                </span>
              </p>
              <Badge v-if="task.subtasks_count > 0" variant="outline" class="text-[10px] h-5">
                {{ progress }}%
              </Badge>
            </div>

            <!-- Progress bar -->
            <div
              v-if="task.subtasks_count > 0"
              class="h-1 rounded-full bg-muted mb-3 overflow-hidden"
            >
              <div
                class="h-full bg-emerald-500 transition-all duration-300"
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

          <Separator />

          <!-- Actions -->
          <div class="flex items-center gap-2">
            <Button variant="outline" size="sm" class="gap-1.5" @click="emit('edit', task)">
              <Pencil :size="13" />
              Editar
            </Button>
            <Button variant="outline" size="sm" class="gap-1.5" @click="handleArchive">
              <Archive :size="13" />
              Arquivar
            </Button>
            <Button
              variant="outline"
              size="sm"
              class="gap-1.5 text-destructive hover:text-destructive border-destructive/30 hover:border-destructive/60 ml-auto"
              @click="showDeleteConfirm = true"
            >
              <Trash2 :size="13" />
              Excluir
            </Button>
          </div>

          <!-- Metadata -->
          <div class="text-xs text-muted-foreground/60 space-y-0.5 pt-2">
            <p>Criada em {{ new Date(task.created_at).toLocaleDateString('pt-BR') }}</p>
            <p v-if="task.updated_at !== task.created_at">
              Atualizada em {{ new Date(task.updated_at).toLocaleDateString('pt-BR') }}
            </p>
          </div>
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
