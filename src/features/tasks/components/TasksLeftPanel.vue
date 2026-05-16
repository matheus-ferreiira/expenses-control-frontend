<script setup lang="ts">
import { computed } from 'vue'
import {
  Inbox,
  Sun,
  CalendarDays,
  Clock,
  CheckCircle2,
  CircleDashed,
} from 'lucide-vue-next'
import { useTaskStore } from '@/stores/tasks'
import { isTaskOverdue } from '@/features/tasks/utils/taskHelpers'
import type { TaskLabel } from '@/types/tasks'
import type { TaskViewId } from '@/features/tasks/types'

const props = defineProps<{
  selectedView: TaskViewId
  labels: TaskLabel[]
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
    all: tasks.filter((t) => t.status !== 'cancelled').length,
    today: tasks.filter(
      (t) => t.due_date === today && t.status !== 'completed' && t.status !== 'cancelled',
    ).length,
    upcoming: tasks.filter(
      (t) =>
        t.due_date &&
        t.due_date > today &&
        t.due_date <= nextWeek &&
        t.status !== 'completed' &&
        t.status !== 'cancelled',
    ).length,
    overdue: tasks.filter((t) => isTaskOverdue(t)).length,
    completed: tasks.filter((t) => t.status === 'completed').length,
    noDate: tasks.filter(
      (t) => !t.due_date && t.status !== 'completed' && t.status !== 'cancelled',
    ).length,
  }
})

const labelCounts = computed(() =>
  props.labels.reduce(
    (acc, label) => {
      acc[label.id] = store.tasks.filter(
        (t) => t.labels.some((l) => l.id === label.id) && t.status !== 'cancelled',
      ).length
      return acc
    },
    {} as Record<string, number>,
  ),
)

const views = computed(() => {
  const c = counts.value
  return [
    { id: 'all' as TaskViewId, label: 'Todas', icon: Inbox, count: c.all },
    { id: 'today' as TaskViewId, label: 'Hoje', icon: Sun, count: c.today },
    { id: 'upcoming' as TaskViewId, label: 'Próximas', icon: CalendarDays, count: c.upcoming },
    { id: 'overdue' as TaskViewId, label: 'Atrasadas', icon: Clock, count: c.overdue },
    { id: 'completed' as TaskViewId, label: 'Concluídas', icon: CheckCircle2, count: c.completed },
    { id: 'no-date' as TaskViewId, label: 'Sem data', icon: CircleDashed, count: c.noDate },
  ]
})

function select(view: TaskViewId) {
  emit('update:selectedView', view)
}

function isActive(id: TaskViewId) {
  return props.selectedView === id
}
</script>

<template>
  <aside
    class="flex flex-col w-[180px] shrink-0 h-full overflow-y-auto"
    style="background: hsl(var(--sidebar)); border-right: 1px solid hsl(var(--border) / 0.5)"
  >
    <nav class="flex-1 px-2 py-3">

      <!-- Views -->
      <div>
        <button
          v-for="view in views"
          :key="view.id"
          class="flex items-center gap-2 w-full px-2.5 py-[5px] rounded-md mb-px text-left text-[12.5px] transition-base"
          :style="
            isActive(view.id)
              ? 'background: hsl(var(--sidebar-accent)); color: hsl(var(--foreground))'
              : 'color: hsl(var(--muted-foreground) / 0.65)'
          "
          @click="select(view.id)"
          @mouseenter="
            (e) => {
              if (!isActive(view.id)) {
                ;(e.currentTarget as HTMLElement).style.background = 'hsl(var(--foreground) / 0.04)'
                ;(e.currentTarget as HTMLElement).style.color = 'hsl(var(--foreground))'
              }
            }
          "
          @mouseleave="
            (e) => {
              if (!isActive(view.id)) {
                ;(e.currentTarget as HTMLElement).style.background = 'transparent'
                ;(e.currentTarget as HTMLElement).style.color = 'hsl(var(--muted-foreground) / 0.65)'
              }
            }
          "
        >
          <component
            :is="view.icon"
            :size="13"
            class="shrink-0"
          />
          <span
            class="flex-1 truncate"
            :class="isActive(view.id) ? 'font-medium' : 'font-normal'"
          >
            {{ view.label }}
          </span>
          <span
            v-if="view.count > 0"
            class="text-[10px] tabular-nums shrink-0"
            :style="
              isActive(view.id)
                ? 'color: hsl(var(--muted-foreground) / 0.5)'
                : 'color: hsl(var(--muted-foreground) / 0.3)'
            "
          >
            {{ view.count }}
          </span>
        </button>
      </div>

      <!-- Labels / Projects -->
      <template v-if="labels.length > 0">
        <div class="mt-4 mb-1 px-2.5">
          <span
            class="text-[9px] font-semibold tracking-[0.12em] uppercase select-none"
            style="color: hsl(var(--muted-foreground) / 0.38)"
          >
            Projetos
          </span>
        </div>

        <button
          v-for="label in labels"
          :key="label.id"
          class="flex items-center gap-2 w-full px-2.5 py-[5px] rounded-md mb-px text-left text-[12.5px] transition-base"
          :style="
            isActive(`label:${label.id}`)
              ? 'background: hsl(var(--sidebar-accent)); color: hsl(var(--foreground))'
              : 'color: hsl(var(--muted-foreground) / 0.65)'
          "
          @click="select(`label:${label.id}`)"
          @mouseenter="
            (e) => {
              if (!isActive(`label:${label.id}`)) {
                ;(e.currentTarget as HTMLElement).style.background = 'hsl(var(--foreground) / 0.04)'
                ;(e.currentTarget as HTMLElement).style.color = 'hsl(var(--foreground))'
              }
            }
          "
          @mouseleave="
            (e) => {
              if (!isActive(`label:${label.id}`)) {
                ;(e.currentTarget as HTMLElement).style.background = 'transparent'
                ;(e.currentTarget as HTMLElement).style.color = 'hsl(var(--muted-foreground) / 0.65)'
              }
            }
          "
        >
          <span class="h-2 w-2 rounded-full shrink-0" :style="{ background: label.color }" />
          <span
            class="flex-1 truncate"
            :class="isActive(`label:${label.id}`) ? 'font-medium' : 'font-normal'"
          >
            {{ label.name }}
          </span>
          <span
            v-if="(labelCounts[label.id] ?? 0) > 0"
            class="text-[10px] tabular-nums shrink-0"
            :style="
              isActive(`label:${label.id}`)
                ? 'color: hsl(var(--muted-foreground) / 0.5)'
                : 'color: hsl(var(--muted-foreground) / 0.3)'
            "
          >
            {{ labelCounts[label.id] }}
          </span>
        </button>
      </template>

    </nav>
  </aside>
</template>
