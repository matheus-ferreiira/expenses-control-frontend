<script setup lang="ts">
import { computed } from 'vue'
import { Checkbox } from '@ui/checkbox'
import { Button } from '@ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@ui/dropdown-menu'
import { MoreHorizontal, Pencil, Archive, Trash2, GripVertical } from 'lucide-vue-next'
import type { Task } from '@/types/tasks'
import { formatDueDateShort, isTaskOverdue, isTaskDueToday } from '../utils/taskHelpers'

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
const dueDateLabel = computed(() => formatDueDateShort(props.task.due_date))

const priorityDotStyle = computed<string | null>(() => {
  switch (props.task.priority) {
    case 'urgent': return 'background: hsl(var(--destructive))'
    case 'high':   return 'background: hsl(var(--warning))'
    case 'low':    return 'background: hsl(var(--muted-foreground) / 0.4)'
    default:       return null
  }
})

const dueDateStyle = computed(() => {
  if (overdue.value) return 'color: hsl(var(--destructive) / 0.6)'
  if (dueToday.value) return 'color: hsl(var(--warning) / 0.7)'
  return 'color: hsl(var(--muted-foreground) / 0.4)'
})

const statusIndicatorStyle = computed(() => {
  if (isCompleted.value) return 'background: hsl(var(--success) / 0.7)'
  if (overdue.value) return 'background: hsl(var(--destructive) / 0.7)'
  return 'background: hsl(var(--info) / 0.6)'
})
</script>

<template>
  <div
    :class="[
      'group flex items-center gap-2.5 px-4 py-2 hover:bg-accent/20 transition-base cursor-pointer border-b border-border/30 last:border-0',
      (isCompleted || isCancelled) && 'opacity-50',
    ]"
    @click="emit('open', task)"
  >
    <!-- Status indicator -->
    <div
      class="h-2 w-2 rounded-full shrink-0"
      :style="statusIndicatorStyle"
    />

    <!-- Drag handle -->
    <div
      v-if="draggable"
      class="drag-handle shrink-0 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
      style="color: hsl(var(--muted-foreground) / 0.3)"
      @click.stop
    >
      <GripVertical :size="14" />
    </div>

    <!-- Priority dot -->
    <div
      v-if="priorityDotStyle"
      class="h-2 w-2 rounded-full shrink-0"
      :style="priorityDotStyle"
    />

    <!-- Checkbox -->
    <div class="shrink-0" @click.stop>
      <Checkbox
        :checked="isCompleted"
        :disabled="isCancelled"
        @update:checked="emit('toggle', task.id)"
      />
    </div>

    <!-- Title -->
    <span
      :class="[
        'flex-1 min-w-0 text-[13px] font-medium truncate',
        isCompleted || isCancelled ? 'line-through text-muted-foreground/50' : 'text-foreground/90',
      ]"
    >
      {{ task.title }}
    </span>

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
      <span
        v-if="task.due_date"
        class="text-[11px] tabular-nums"
        :style="dueDateStyle"
      >
        {{ dueDateLabel }}
      </span>
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
