<script setup lang="ts">
import { computed } from 'vue'
import { Button } from '@ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@ui/dropdown-menu'
import { MoreHorizontal, Pencil, Archive, Trash2, GripVertical, CheckCircle2 } from 'lucide-vue-next'
import type { Task } from '@/types/tasks'
import { formatDueDateShort, isTaskOverdue, isTaskDueToday, isTaskDueTomorrow, getSubtaskProgress } from '../utils/taskHelpers'

const props = defineProps<{
  task: Task
  draggable?: boolean
}>()

const emit = defineEmits<{
  toggle: [id: string]
  edit: [task: Task]
  delete: [id: string]
  archive: [id: string]
  open: [task: Task]
}>()

const isCompleted = computed(() => props.task.status === 'completed')
const isCancelled = computed(() => props.task.status === 'cancelled')
const overdue = computed(() => isTaskOverdue(props.task))
const dueToday = computed(() => isTaskDueToday(props.task))
const dueTomorrow = computed(() => isTaskDueTomorrow(props.task))
const dueDateLabel = computed(() => formatDueDateShort(props.task.due_date))
const subtaskProgress = computed(() => getSubtaskProgress(props.task))

// Color of the circular toggle button reflects priority
const priorityColor = computed<string>(() => {
  if (isCompleted.value) return 'hsl(var(--success) / 0.8)'
  switch (props.task.priority) {
    case 'urgent': return 'hsl(var(--destructive))'
    case 'high':   return 'hsl(var(--warning))'
    case 'low':    return 'hsl(var(--muted-foreground) / 0.35)'
    default:       return 'hsl(var(--muted-foreground) / 0.5)'
  }
})

const toggleBtnStyle = computed(() => {
  if (isCompleted.value) {
    return `background: hsl(var(--success) / 0.8); border-color: hsl(var(--success) / 0.8)`
  }
  return `border-color: ${priorityColor.value}`
})
</script>

<template>
  <div
    :class="[
      'group flex items-center gap-2.5 px-4 py-2.5 hover:bg-muted transition-base cursor-pointer border-b border-border last:border-0',
      (isCompleted || isCancelled) && 'opacity-50',
    ]"
    @click="emit('open', task)"
  >
    <!-- Drag handle -->
    <div
      v-if="draggable"
      class="drag-handle shrink-0 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
      style="color: hsl(var(--muted-foreground) / 0.3)"
      @click.stop
    >
      <GripVertical :size="14" />
    </div>

    <!-- Circular priority toggle button -->
    <button
      class="h-4 w-4 rounded-full grid place-items-center shrink-0 border-2 transition-colors flex-none"
      :style="toggleBtnStyle"
      :disabled="isCancelled"
      :aria-label="isCompleted ? 'Desmarcar' : 'Concluir'"
      @click.stop="emit('toggle', task.id)"
    >
      <CheckCircle2
        v-if="isCompleted"
        :size="10"
        :stroke-width="3"
        style="color: hsl(var(--background))"
      />
    </button>

    <!-- Title + subtask progress -->
    <div class="flex-1 min-w-0 flex flex-col gap-1">
      <span
        :class="[
          'text-[13px] font-medium truncate',
          isCompleted || isCancelled ? 'line-through text-muted-foreground' : 'text-foreground',
        ]"
      >
        {{ task.title }}
      </span>
      <!-- Subtask progress bar -->
      <div
        v-if="task.subtasks_count > 0"
        class="h-0.5 w-full rounded-full bg-muted overflow-hidden"
      >
        <div
          class="h-full rounded-full transition-all"
          :class="subtaskProgress === 100 ? 'bg-muted' : 'bg-border'"
          :style="{ width: `${subtaskProgress}%` }"
        />
      </div>
    </div>

    <!-- Meta (right side) -->
    <div class="flex items-center gap-2.5 shrink-0">
      <!-- Subtask count -->
      <span
        v-if="task.subtasks_count > 0"
        class="text-[11px] tabular-nums"
        style="color: hsl(var(--muted-foreground) / 0.4)"
      >
        {{ task.completed_subtasks_count }}/{{ task.subtasks_count }}
      </span>


      <!-- Label dots -->
      <div v-if="task.labels.length > 0" class="flex items-center gap-1">
        <span
          v-for="label in task.labels.slice(0, 4)"
          :key="label.id"
          class="h-1.5 w-1.5 rounded-full"
          :style="{ background: label.color }"
        />
      </div>

      <!-- Due date -->
      <template v-if="task.due_date">
        <span
          v-if="overdue"
          class="text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted text-destructive select-none"
        >
          Atrasada
        </span>
        <span
          v-else-if="dueToday"
          class="text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted text-warning select-none"
        >
          Hoje
        </span>
        <span
          v-else-if="dueTomorrow"
          class="text-[10px] font-medium px-1.5 py-0.5 rounded select-none"
          style="background: hsl(var(--primary) / 0.12); color: hsl(var(--primary) / 0.75)"
        >
          Amanhã
        </span>
        <span
          v-else
          class="text-[11px] tabular-nums"
          style="color: hsl(var(--muted-foreground) / 0.4)"
        >
          {{ dueDateLabel }}
        </span>
      </template>
    </div>

    <!-- Actions dropdown -->
    <div class="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" @click.stop>
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <Button variant="ghost" size="icon" class="h-7 w-7">
            <MoreHorizontal :size="14" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" class="w-40">
          <DropdownMenuItem @click="emit('edit', task)">
            <Pencil :size="13" class="mr-2" />
            Editar
          </DropdownMenuItem>
          <DropdownMenuItem @click="emit('archive', task.id)">
            <Archive :size="13" class="mr-2" />
            Arquivar
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            class="text-destructive focus:text-destructive"
            @click="emit('delete', task.id)"
          >
            <Trash2 :size="13" class="mr-2" />
            Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  </div>
</template>
