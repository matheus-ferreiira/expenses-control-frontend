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
import { MoreHorizontal, Pencil, Archive, Trash2, GripVertical } from 'lucide-vue-next'
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
</script>

<template>
  <div
    :class="[
      'group border border-border/40 rounded-lg p-2.5 cursor-pointer hover:border-border/70 hover:bg-accent/15 transition-all',
      isCompleted && 'opacity-50',
    ]"
    @click="emit('open', task)"
  >
    <div class="flex items-start gap-1.5">
      <!-- Drag handle -->
      <div
        class="drag-handle mt-0.5 shrink-0 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
        style="color: hsl(var(--muted-foreground) / 0.3)"
        @click.stop
      >
        <GripVertical :size="13" />
      </div>

      <div class="flex-1 min-w-0">
        <!-- Title -->
        <p
          :class="[
            'text-[13px] font-medium leading-snug',
            isCompleted ? 'line-through text-muted-foreground/50' : 'text-foreground/90',
          ]"
        >
          {{ task.title }}
        </p>

        <!-- Meta row -->
        <div class="flex items-center gap-2 mt-1.5 flex-wrap">
          <!-- Priority dot -->
          <div
            v-if="priorityDotStyle"
            class="h-1.5 w-1.5 rounded-full shrink-0"
            :style="priorityDotStyle"
          />

          <!-- Due date -->
          <span
            v-if="task.due_date"
            class="text-[11px] tabular-nums"
            :style="dueDateStyle"
          >
            {{ dueDateLabel }}
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

          <!-- Subtasks -->
          <span
            v-if="task.subtasks_count > 0"
            class="text-[11px] tabular-nums ml-auto"
            style="color: hsl(var(--muted-foreground) / 0.4)"
          >
            {{ task.completed_subtasks_count }}/{{ task.subtasks_count }}
          </span>
        </div>
      </div>

      <!-- Actions -->
      <div class="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" @click.stop>
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button variant="ghost" size="icon" class="h-6 w-6 -mt-0.5">
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
