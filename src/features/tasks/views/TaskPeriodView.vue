<script setup lang="ts">
import { computed } from 'vue'
import { Inbox, Plus, Sunrise, Sun, Moon, Clock } from 'lucide-vue-next'
import { EmptyState } from '@/components/shared'
import TaskItem from '../components/TaskItem.vue'
import type { Task } from '@/types/tasks'
import type { Component } from 'vue'

const props = defineProps<{
  tasks: Task[]
  loading?: boolean
}>()

const emit = defineEmits<{
  toggle: [id: string]
  open: [task: Task]
  create: []
}>()

interface PeriodDef {
  id: string
  label: string
  sublabel: string
  icon: Component
  test: (h: number) => boolean
}

const PERIOD_DEFS: PeriodDef[] = [
  { id: 'morning',   label: 'MANHÃ',       sublabel: '06:00 – 12:00', icon: Sunrise, test: (h) => h < 12  },
  { id: 'afternoon', label: 'TARDE',       sublabel: '12:00 – 18:00', icon: Sun,     test: (h) => h >= 12 && h < 18 },
  { id: 'evening',   label: 'NOITE',       sublabel: '18:00 – 00:00', icon: Moon,    test: (h) => h >= 18 },
]

interface PeriodGroup {
  id: string
  label: string
  sublabel: string
  icon: Component
  tasks: Task[]
}

const groups = computed<PeriodGroup[]>(() => {
  const withTime = props.tasks.filter((t) => t.due_time)
  const noTime = props.tasks.filter((t) => !t.due_time)

  const periods: PeriodGroup[] = PERIOD_DEFS.map((def) => ({
    id: def.id,
    label: def.label,
    sublabel: def.sublabel,
    icon: def.icon,
    tasks: withTime
      .filter((t) => {
        const h = parseInt(t.due_time!.split(':')[0] ?? '0', 10)
        return def.test(h)
      })
      .sort((a, b) => (a.due_time ?? '').localeCompare(b.due_time ?? '')),
  })).filter((g) => g.tasks.length > 0)

  if (noTime.length) {
    periods.push({
      id: 'no_time',
      label: 'SEM HORÁRIO',
      sublabel: '',
      icon: Clock,
      tasks: noTime,
    })
  }

  return periods
})
</script>

<template>
  <!-- Empty state -->
  <EmptyState
    v-if="!loading && groups.length === 0"
    :icon="Inbox"
    title="Nenhuma tarefa para hoje"
    description="Crie uma nova tarefa para começar o dia."
    :cta-icon="Plus"
    cta-label="Nova tarefa"
    @cta="emit('create')"
  />

  <!-- Period groups — no outer border -->
  <div v-else class="space-y-2">
    <div
      v-for="group in groups"
      :key="group.id"
    >
      <!-- Period header -->
      <div class="flex items-center gap-2 py-2 pl-1 mb-1">
        <component
          :is="group.icon"
          :size="13"
          class="text-muted-foreground/50 shrink-0"
        />
        <span class="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60">
          {{ group.label }}
          <span v-if="group.sublabel" class="text-muted-foreground/35 font-normal lowercase tracking-normal ml-1">
            · {{ group.sublabel }}
          </span>
        </span>
        <span class="text-[11px] text-muted-foreground/35">{{ group.tasks.length }}</span>
      </div>

      <!-- Task rows with time column -->
      <div
        v-for="task in group.tasks"
        :key="task.id"
        class="flex items-center gap-1 border-b border-border/20 last:border-0"
      >
        <!-- Time column (left) -->
        <span class="text-[12px] tabular-nums text-muted-foreground/40 w-10 text-right shrink-0 pr-1">
          {{ task.due_time ? task.due_time.slice(0, 5) : '' }}
        </span>
        <!-- Task item (no border, no time in right col) -->
        <div class="flex-1 min-w-0">
          <TaskItem
            :task="task"
            :show-time="false"
            :no-border="true"
            @toggle="emit('toggle', $event)"
            @open="emit('open', $event)"
          />
        </div>
      </div>
    </div>
  </div>
</template>
