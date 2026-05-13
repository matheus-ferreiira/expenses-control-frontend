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
import { CalendarDays, Tag, CheckSquare2, MoreHorizontal, Pencil, Archive, Trash2, GripVertical } from 'lucide-vue-next'
import TaskPriorityBadge from './TaskPriorityBadge.vue'
import TaskLabelBadge from './TaskLabelBadge.vue'
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

const dueDateClass = computed(() => {
  if (overdue.value) return 'text-red-400'
  if (dueToday.value) return 'text-orange-400'
  return 'text-muted-foreground'
})
</script>

<template>
  <div
    :class="[
      'group flex items-start gap-3 px-4 py-3 hover:bg-accent/40 transition-colors cursor-pointer border-b border-border/50 last:border-0',
      (isCompleted || isCancelled) && 'opacity-60',
    ]"
    @click="emit('open', task)"
  >
    <!-- Drag handle -->
    <div
      v-if="draggable"
      class="drag-handle mt-0.5 shrink-0 cursor-grab active:cursor-grabbing text-muted-foreground/30 hover:text-muted-foreground/60 opacity-0 group-hover:opacity-100 transition-opacity"
      @click.stop
    >
      <GripVertical :size="16" />
    </div>

    <!-- Checkbox -->
    <div class="mt-0.5 shrink-0" @click.stop>
      <Checkbox
        :checked="isCompleted"
        :disabled="isCancelled"
        @update:checked="emit('toggle', task.id)"
      />
    </div>

    <!-- Content -->
    <div class="flex-1 min-w-0">
      <!-- Title -->
      <p
        :class="[
          'text-sm font-medium leading-snug text-foreground truncate',
          (isCompleted || isCancelled) && 'line-through text-muted-foreground',
        ]"
      >
        {{ task.title }}
      </p>

      <!-- Meta row -->
      <div class="flex flex-wrap items-center gap-2 mt-1.5">
        <!-- Priority -->
        <TaskPriorityBadge v-if="task.priority !== 'normal'" :priority="task.priority" dot />

        <!-- Due date -->
        <span
          v-if="task.due_date"
          :class="['inline-flex items-center gap-1 text-[11px] font-medium', dueDateClass]"
        >
          <CalendarDays :size="11" />
          {{ dueDateLabel }}
        </span>

        <!-- Labels -->
        <template v-if="task.labels.length">
          <TaskLabelBadge
            v-for="label in task.labels.slice(0, 3)"
            :key="label.id"
            :label="label"
          />
        </template>

        <!-- Subtasks counter -->
        <span
          v-if="task.subtasks_count > 0"
          class="inline-flex items-center gap-1 text-[11px] text-muted-foreground font-medium"
        >
          <CheckSquare2 :size="11" />
          {{ task.completed_subtasks_count }}/{{ task.subtasks_count }}
        </span>

        <!-- Label count overflow -->
        <span
          v-if="task.labels.length > 3"
          class="inline-flex items-center gap-1 text-[11px] text-muted-foreground"
        >
          <Tag :size="11" />
          +{{ task.labels.length - 3 }}
        </span>
      </div>
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
