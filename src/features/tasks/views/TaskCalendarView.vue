<script setup lang="ts">
import { ref, computed } from 'vue'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'
import TaskCard from '../components/TaskCard.vue'
import type { Task } from '@/types/tasks'

const props = defineProps<{
  tasks: Task[]
}>()

const emit = defineEmits<{
  toggle: [id: string]
  edit: [task: Task]
  delete: [id: string]
  archive: [id: string]
  open: [task: Task]
}>()

const today = new Date().toLocaleDateString('en-CA')
const now = new Date()

const currentYear = ref(now.getFullYear())
const currentMonth = ref(now.getMonth()) // 0-indexed

const selectedDate = ref<string | null>(null)

const WEEKDAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

const monthLabel = computed(() => {
  const d = new Date(currentYear.value, currentMonth.value, 1)
  const s = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  return s.charAt(0).toUpperCase() + s.slice(1)
})

function prevMonth() {
  if (currentMonth.value === 0) {
    currentMonth.value = 11
    currentYear.value--
  } else {
    currentMonth.value--
  }
  selectedDate.value = null
}

function nextMonth() {
  if (currentMonth.value === 11) {
    currentMonth.value = 0
    currentYear.value++
  } else {
    currentMonth.value++
  }
  selectedDate.value = null
}

interface CalendarDay {
  dateStr: string
  day: number
  isCurrentMonth: boolean
  isToday: boolean
  tasks: Task[]
}

const calendarDays = computed<CalendarDay[]>(() => {
  const year = currentYear.value
  const month = currentMonth.value

  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)

  // Grid starts on Sunday
  const startOffset = firstDay.getDay() // 0=Sun
  const totalDays = lastDay.getDate()

  const days: CalendarDay[] = []

  // Previous month fill
  for (let i = startOffset - 1; i >= 0; i--) {
    const d = new Date(year, month, -i)
    const dateStr = d.toLocaleDateString('en-CA')
    days.push({
      dateStr,
      day: d.getDate(),
      isCurrentMonth: false,
      isToday: dateStr === today,
      tasks: [],
    })
  }

  // Current month
  for (let d = 1; d <= totalDays; d++) {
    const date = new Date(year, month, d)
    const dateStr = date.toLocaleDateString('en-CA')
    const dayTasks = props.tasks.filter(
      (t) => t.due_date === dateStr && t.status !== 'cancelled',
    )
    days.push({
      dateStr,
      day: d,
      isCurrentMonth: true,
      isToday: dateStr === today,
      tasks: dayTasks,
    })
  }

  // Next month fill to complete grid (multiples of 7)
  const remaining = 7 - (days.length % 7)
  if (remaining < 7) {
    for (let d = 1; d <= remaining; d++) {
      const date = new Date(year, month + 1, d)
      const dateStr = date.toLocaleDateString('en-CA')
      days.push({
        dateStr,
        day: d,
        isCurrentMonth: false,
        isToday: dateStr === today,
        tasks: [],
      })
    }
  }

  return days
})

const selectedTasks = computed(() => {
  if (!selectedDate.value) return []
  return props.tasks.filter(
    (t) => t.due_date === selectedDate.value && t.status !== 'cancelled',
  )
})

function selectDay(day: CalendarDay) {
  if (!day.isCurrentMonth) return
  selectedDate.value = selectedDate.value === day.dateStr ? null : day.dateStr
}

function isOverdue(task: Task): boolean {
  return !!task.due_date && task.due_date < today && task.status !== 'completed'
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <!-- Calendar header -->
    <div class="flex items-center justify-between px-1">
      <button
        class="flex items-center justify-center h-7 w-7 rounded-md transition-colors"
        style="color: hsl(var(--muted-foreground) / 0.5)"
        @mouseenter="($event.currentTarget as HTMLElement).style.color = 'hsl(var(--foreground))'"
        @mouseleave="($event.currentTarget as HTMLElement).style.color = 'hsl(var(--muted-foreground) / 0.5)'"
        @click="prevMonth"
      >
        <ChevronLeft :size="16" />
      </button>

      <span class="text-[13px] font-medium text-foreground/80">
        {{ monthLabel }}
      </span>

      <button
        class="flex items-center justify-center h-7 w-7 rounded-md transition-colors"
        style="color: hsl(var(--muted-foreground) / 0.5)"
        @mouseenter="($event.currentTarget as HTMLElement).style.color = 'hsl(var(--foreground))'"
        @mouseleave="($event.currentTarget as HTMLElement).style.color = 'hsl(var(--muted-foreground) / 0.5)'"
        @click="nextMonth"
      >
        <ChevronRight :size="16" />
      </button>
    </div>

    <!-- Calendar grid -->
    <div class="rounded-lg border border-border overflow-hidden">
      <!-- Weekday headers -->
      <div class="grid grid-cols-7 border-b border-border/40">
        <div
          v-for="wd in WEEKDAYS"
          :key="wd"
          class="flex items-center justify-center py-2 text-[10px] font-semibold uppercase tracking-[0.08em]"
          style="color: hsl(var(--muted-foreground) / 0.4)"
        >
          {{ wd }}
        </div>
      </div>

      <!-- Day cells -->
      <div class="grid grid-cols-7">
        <div
          v-for="(day, idx) in calendarDays"
          :key="day.dateStr"
          :class="[
            'min-h-[80px] p-1.5 border-border/25 cursor-pointer transition-colors',
            idx % 7 !== 6 ? 'border-r' : '',
            Math.floor(idx / 7) < Math.floor((calendarDays.length - 1) / 7) ? 'border-b' : '',
            !day.isCurrentMonth ? 'opacity-30 cursor-default' : 'hover:bg-accent/10',
            day.isToday ? 'border-primary/30' : '',
            selectedDate === day.dateStr ? 'bg-accent/15' : '',
          ]"
          @click="selectDay(day)"
        >
          <!-- Day number -->
          <div
            :class="[
              'text-[11px] font-medium w-5 h-5 flex items-center justify-center rounded-full mb-1',
              day.isToday
                ? 'bg-primary text-primary-foreground text-[10px]'
                : 'text-muted-foreground/60',
            ]"
          >
            {{ day.day }}
          </div>

          <!-- Task pills (up to 2) -->
          <div class="space-y-0.5">
            <div
              v-for="task in day.tasks.slice(0, 2)"
              :key="task.id"
              :class="[
                'text-[10px] truncate px-1 py-0.5 rounded',
                task.status === 'completed'
                  ? 'opacity-40 line-through'
                  : isOverdue(task)
                    ? 'text-destructive/70'
                    : 'text-foreground/70',
              ]"
              :style="task.status !== 'completed' && !isOverdue(task) ? 'background: hsl(var(--accent) / 0.5)' : ''"
            >
              {{ task.title }}
            </div>
            <!-- Overflow indicator -->
            <div
              v-if="day.tasks.length > 2"
              class="text-[10px] px-1"
              style="color: hsl(var(--muted-foreground) / 0.45)"
            >
              +{{ day.tasks.length - 2 }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Selected day task list -->
    <div v-if="selectedDate && selectedTasks.length > 0" class="rounded-lg border border-border overflow-hidden">
      <div class="flex items-center gap-2 px-4 py-2 border-b border-border/30">
        <span class="text-[10px] font-semibold uppercase tracking-[0.1em]" style="color: hsl(var(--muted-foreground) / 0.5)">
          {{ new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }) }}
        </span>
        <span class="text-[10px]" style="color: hsl(var(--muted-foreground) / 0.35)">
          {{ selectedTasks.length }}
        </span>
      </div>
      <TaskCard
        v-for="task in selectedTasks"
        :key="task.id"
        :task="task"
        @toggle="emit('toggle', $event)"
        @edit="emit('edit', $event)"
        @delete="emit('delete', $event)"
        @archive="emit('archive', $event)"
        @open="emit('open', $event)"
      />
    </div>
  </div>
</template>
