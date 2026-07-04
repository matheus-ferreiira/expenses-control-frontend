<script setup lang="ts">
import { computed } from 'vue'
import { CheckCircle2, Repeat } from 'lucide-vue-next'
import type { Task } from '@/types/tasks'
import { isTaskOverdue, isTaskDueToday, isTaskDueTomorrow, formatDueDateShort } from '../utils/taskHelpers'

const props = withDefaults(defineProps<{
  task: Task
  /** false na period view (hora exibida na coluna externa) */
  showTime?: boolean
  /** false na period view (toda linha é de hoje — label redundante) */
  showDate?: boolean
  /** true quando o wrapper fornece o divisor */
  noBorder?: boolean
}>(), {
  // prop booleana ausente vira false no Vue — o default precisa ser explícito
  showTime: true,
  showDate: true,
  noBorder: false,
})

const emit = defineEmits<{
  toggle: [id: string]
  open: [task: Task]
}>()

const isCompleted = computed(() => props.task.status === 'completed')
const isCancelled = computed(() => props.task.status === 'cancelled')
const overdue = computed(() => isTaskOverdue(props.task))
const dueToday = computed(() => isTaskDueToday(props.task))
const dueTomorrow = computed(() => isTaskDueTomorrow(props.task))
const dueDateLabel = computed(() => formatDueDateShort(props.task.due_date))
const displayTime = computed(() => props.showTime !== false)

// Anel do checkbox comunica prioridade — cores sólidas do sistema
const checkboxClass = computed(() => {
  switch (props.task.priority) {
    case 'urgent': return 'border-destructive'
    case 'high':   return 'border-warning'
    case 'normal': return 'border-muted-foreground'
    default:       return 'border-border'
  }
})
</script>

<template>
  <div
    class="group flex items-center transition-colors hover:bg-muted"
    :class="noBorder ? '' : 'border-b border-border last:border-0'"
  >
    <!-- Checkbox — large touch target -->
    <button
      type="button"
      class="size-11 flex items-center justify-center shrink-0 -ml-1 rounded-full transition-all active:scale-95"
      :disabled="isCancelled"
      :aria-label="isCompleted ? 'Desmarcar tarefa' : 'Concluir tarefa'"
      @click.stop="emit('toggle', task.id)"
    >
      <!-- Completed: solid check icon -->
      <CheckCircle2 v-if="isCompleted" :size="20" class="text-success" />
      <!-- Pending: priority-coloured ring -->
      <span
        v-else
        class="size-5 rounded-full border-2 transition-all"
        :class="checkboxClass"
      />
    </button>

    <!-- Content — opens detail sheet -->
    <div
      class="flex-1 min-w-0 flex items-center gap-2 py-3 pr-3 cursor-pointer"
      @click="emit('open', task)"
    >
      <!-- Left: title + secondary meta -->
      <div class="flex-1 min-w-0">
        <p
          class="text-[14px] font-medium leading-snug truncate"
          :class="isCompleted || isCancelled
            ? 'line-through text-muted-foreground'
            : 'text-foreground'"
        >
          {{ task.title }}
          <Repeat
            v-if="task.recurrence_type && task.recurrence_type !== 'none'"
            :size="11"
            class="inline ml-1 mb-0.5 align-middle text-muted-foreground"
          />
        </p>
        <div class="flex items-center gap-1.5 mt-0.5">
          <p
            v-if="task.description"
            class="text-[12px] text-muted-foreground truncate"
          >{{ task.description }}</p>
          <span
            v-else-if="task.task_list"
            class="text-[11px] text-muted-foreground"
          >{{ task.task_list.name }}</span>
        </div>
      </div>

      <!-- Right: badges in two rows -->
      <div class="flex flex-col items-end gap-0.5 shrink-0">
        <!-- Top row: priority badge + subtask count -->
        <div class="flex items-center gap-1">
          <span
            v-if="task.priority === 'urgent' && !isCompleted"
            class="text-[10px] rounded-full px-1.5 py-0.5 bg-muted text-destructive font-medium"
          >P1</span>
          <span
            v-else-if="task.priority === 'high' && !isCompleted"
            class="text-[10px] rounded-full px-1.5 py-0.5 bg-muted text-warning font-medium"
          >P2</span>
          <span
            v-if="task.subtasks_count > 0"
            class="text-[10px] tabular-nums text-muted-foreground"
          >{{ task.completed_subtasks_count }}/{{ task.subtasks_count }}</span>
        </div>

        <!-- Bottom row: time + date -->
        <div class="flex items-center gap-1">
          <span
            v-if="task.due_time && displayTime"
            class="text-[11px] tabular-nums text-muted-foreground"
          >{{ task.due_time.slice(0, 5) }}</span>

          <template v-if="task.due_date && showDate">
            <span
              v-if="overdue"
              class="text-[11px] font-medium text-destructive"
            >Atrasada</span>
            <span
              v-else-if="dueToday"
              class="text-[11px] font-medium text-warning"
            >Hoje</span>
            <span
              v-else-if="dueTomorrow"
              class="text-[11px] font-medium text-primary"
            >Amanhã</span>
            <span
              v-else
              class="text-[11px] text-muted-foreground tabular-nums"
            >{{ dueDateLabel }}</span>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>
