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
import {
  MoreHorizontal,
  CalendarDays,
  CheckSquare2,
  Pencil,
  Archive,
  Trash2,
  GripVertical,
} from 'lucide-vue-next'
import TaskPriorityBadge from './TaskPriorityBadge.vue'
import TaskLabelBadge from './TaskLabelBadge.vue'
import type { Task } from '@/types/tasks'
import { formatDueDateShort, isTaskOverdue, isTaskDueToday } from '../utils/taskHelpers'

const props = defineProps<{
  task: Task
}>()

const emit = defineEmits<{
  toggle: [id: string]
  edit: [task: Task]
  delete: [id: string]
  archive: [id: string]
  open: [task: Task]
}>()

const isCompleted = computed(() => props.task.status === 'completed')
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
      'group bg-card border border-border rounded-lg p-3 cursor-pointer hover:border-border/80 hover:bg-accent/20 transition-all',
      isCompleted && 'opacity-60',
    ]"
    @click="emit('open', task)"
  >
    <div class="flex items-start gap-2">
      <!-- Drag handle -->
      <div
        class="drag-handle mt-0.5 shrink-0 cursor-grab active:cursor-grabbing text-muted-foreground/30 hover:text-muted-foreground/60 opacity-0 group-hover:opacity-100 transition-opacity"
        @click.stop
      >
        <GripVertical :size="14" />
      </div>

      <div class="flex-1 min-w-0">
        <!-- Title -->
        <p
          :class="[
            'text-sm font-medium leading-snug text-foreground',
            isCompleted && 'line-through text-muted-foreground',
          ]"
        >
          {{ task.title }}
        </p>

        <!-- Labels -->
        <div v-if="task.labels.length" class="flex flex-wrap gap-1 mt-1.5">
          <TaskLabelBadge
            v-for="label in task.labels.slice(0, 2)"
            :key="label.id"
            :label="label"
          />
        </div>

        <!-- Meta row -->
        <div class="flex items-center gap-2 mt-2">
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

          <!-- Subtasks -->
          <span
            v-if="task.subtasks_count > 0"
            class="inline-flex items-center gap-1 text-[11px] text-muted-foreground font-medium ml-auto"
          >
            <CheckSquare2 :size="11" />
            {{ task.completed_subtasks_count }}/{{ task.subtasks_count }}
          </span>
        </div>
      </div>

      <!-- Actions -->
      <div class="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" @click.stop>
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button variant="ghost" size="icon" class="h-6 w-6">
              <MoreHorizontal :size="13" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" class="w-36">
            <DropdownMenuItem @click="emit('edit', task)">
              <Pencil :size="12" class="mr-2" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem @click="emit('archive', task.id)">
              <Archive :size="12" class="mr-2" />
              Arquivar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              class="text-destructive focus:text-destructive"
              @click="emit('delete', task.id)"
            >
              <Trash2 :size="12" class="mr-2" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  </div>
</template>
