<script setup lang="ts">
import { computed } from 'vue'
import { useTaskStore } from '@/stores/tasks'
import { isTaskOverdue } from '@/features/tasks/utils/taskHelpers'
import type { TaskViewId } from '@/features/tasks/types'

const props = defineProps<{
  selectedView: TaskViewId
}>()

const emit = defineEmits<{
  'update:selectedView': [view: TaskViewId]
}>()

const store = useTaskStore()

function todayStr() {
  return new Date().toLocaleDateString('en-CA')
}
function addDaysStr(n: number) {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d.toLocaleDateString('en-CA')
}

const counts = computed(() => {
  const tasks = store.tasks
  const today = todayStr()
  const nextWeek = addDaysStr(7)
  return {
    all:       tasks.filter((t) => t.status !== 'cancelled' && t.status !== 'completed').length,
    today:     tasks.filter((t) => t.due_date === today && t.status !== 'completed' && t.status !== 'cancelled').length,
    upcoming:  tasks.filter((t) => t.due_date && t.due_date > today && t.due_date <= nextWeek && t.status !== 'completed' && t.status !== 'cancelled').length,
    overdue:   tasks.filter((t) => isTaskOverdue(t)).length,
    completed: tasks.filter((t) => t.status === 'completed').length,
  }
})

const tabs = computed(() => [
  { id: 'all' as TaskViewId,       label: 'Todas',      count: counts.value.all },
  { id: 'today' as TaskViewId,     label: 'Hoje',       count: counts.value.today },
  { id: 'upcoming' as TaskViewId,  label: 'Próximas',   count: counts.value.upcoming },
  { id: 'overdue' as TaskViewId,   label: 'Atrasadas',  count: counts.value.overdue, danger: true },
  { id: 'completed' as TaskViewId, label: 'Concluídas', count: counts.value.completed },
])

function isActive(id: TaskViewId): boolean {
  if (props.selectedView === id) return true
  if (id === 'all' && !['today','upcoming','overdue','completed','no-date'].includes(props.selectedView)) return true
  return false
}
</script>

<template>
  <div class="-mx-5 px-5 lg:mx-0 lg:px-0 mb-5 overflow-x-auto scrollbar-none scroll-fade-x">
    <div class="flex items-center gap-1 w-max border-b border-border">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        class="relative flex items-center gap-1.5 px-3 h-10 text-sm font-medium whitespace-nowrap transition-colors shrink-0"
        :class="isActive(tab.id) ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'"
        @click="emit('update:selectedView', tab.id)"
      >
        {{ tab.label }}
        <span
          v-if="tab.count > 0"
          class="text-[10px] tabular-nums font-semibold"
          :class="tab.danger && !isActive(tab.id) ? 'text-destructive' : isActive(tab.id) ? 'text-foreground/60' : 'text-muted-foreground/50'"
        >{{ tab.count }}</span>
        <span
          v-if="isActive(tab.id)"
          class="absolute left-2 right-2 -bottom-px h-[2px] rounded-full bg-primary"
        />
      </button>
    </div>
  </div>
</template>
