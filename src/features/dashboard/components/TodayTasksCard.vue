<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Skeleton } from '@ui/skeleton'
import { Check, Loader2, ClipboardList } from 'lucide-vue-next'
import DashboardCardHeader from './DashboardCardHeader.vue'
import type { Task } from '@/types/tasks'
import { ROUTES } from '@/constants/routes'

const MAX_SHOWN = 6

const props = defineProps<{
  tasks: Task[]
  loading?: boolean
}>()

const emit = defineEmits<{
  toggle: [id: string]
}>()

const router = useRouter()
const togglingIds = ref<Set<string>>(new Set())

const shown = computed(() => props.tasks.slice(0, MAX_SHOWN))
const hasMore = computed(() => props.tasks.length > MAX_SHOWN)

function handleToggle(id: string) {
  if (togglingIds.value.has(id)) return
  togglingIds.value.add(id)
  emit('toggle', id)
  setTimeout(() => togglingIds.value.delete(id), 800)
}

const PRIORITY_DOT: Record<string, string> = {
  urgent: 'bg-destructive',
  high: 'bg-warning',
  normal: 'bg-border',
  low: 'bg-border',
}

function priorityDotClass(priority: Task['priority']): string {
  return PRIORITY_DOT[priority] ?? 'bg-border'
}

/** "14:30" — 24-hour clock, as everywhere else in the app (it used to read "2:30 PM") */
function timeLabel(task: Task): string {
  if (!task.due_time) return ''
  const [h, m] = task.due_time.split(':')
  if (!h || !m) return ''
  return `${h.padStart(2, '0')}:${m}`
}
</script>

<template>
  <div class="rounded-lg bg-card">
    <DashboardCardHeader
      title="Tarefas de hoje"
      :icon="ClipboardList"
      :count="!loading && tasks.length ? `${tasks.filter(t => t.status === 'completed').length}/${tasks.length}` : null"
      action-label="Ver todas"
      :to="ROUTES.TASKS"
    />

    <!-- Loading -->
    <div v-if="loading" class="divide-y divide-border">
      <div v-for="i in 4" :key="i" class="flex items-center gap-3 px-4 py-2.5">
        <Skeleton class="h-4 w-4 rounded-full shrink-0" />
        <div class="flex-1 space-y-1.5">
          <Skeleton class="h-3 w-3/4" />
          <Skeleton class="h-2.5 w-1/3" />
        </div>
        <Skeleton class="h-2 w-2 rounded-full shrink-0" />
      </div>
    </div>

    <!-- Empty -->
    <div
      v-else-if="tasks.length === 0"
      class="flex flex-col items-center justify-center py-10 px-4 text-center gap-2"
    >
      <ClipboardList :size="20" class="text-muted-foreground" />
      <p class="text-[13px] text-muted-foreground">Nenhuma tarefa para hoje</p>
    </div>

    <!-- Task list -->
    <div v-else class="divide-y divide-border">
      <div
        v-for="task in shown"
        :key="task.id"
        class="group flex items-center gap-3 px-4 py-2.5 hover:bg-muted/50 transition-base"
      >
        <!-- Toggle circle -->
        <button
          :class="[
            'shrink-0 h-[18px] w-[18px] rounded-full border flex items-center justify-center transition-all',
            task.status === 'completed'
              ? 'bg-primary border-primary text-primary-foreground'
              : 'border-muted-foreground hover:bg-muted',
          ]"
          :disabled="togglingIds.has(task.id)"
          @click="handleToggle(task.id)"
        >
          <Loader2 v-if="togglingIds.has(task.id)" :size="9" class="animate-spin" />
          <Check v-else-if="task.status === 'completed'" :size="9" />
        </button>

        <!-- Content -->
        <div class="flex-1 min-w-0">
          <div class="flex items-baseline gap-1.5">
            <span
              :class="[
                'text-[14px] font-medium leading-tight truncate',
                task.status === 'completed'
                  ? 'line-through text-muted-foreground'
                  : 'text-foreground',
              ]"
            >
              {{ task.title }}
            </span>
          </div>
          <!-- Labels + time -->
          <div
            v-if="task.labels.length > 0 || timeLabel(task)"
            class="flex items-center gap-1.5 mt-0.5"
          >
            <span v-if="timeLabel(task)" class="text-[12px] text-muted-foreground tabular-nums leading-none">
              {{ timeLabel(task) }}
            </span>
            <span
              v-for="label in task.labels.slice(0, 2)"
              :key="label.id"
              class="inline-flex items-center h-3.5 px-1 rounded text-[9px] font-medium leading-none"
              :style="{ backgroundColor: label.color + '22', color: label.color }"
            >
              {{ label.name }}
            </span>
          </div>
        </div>

        <!-- Priority dot -->
        <div
          v-if="task.status !== 'completed'"
          :class="['shrink-0 h-1.5 w-1.5 rounded-full', priorityDotClass(task.priority)]"
        />
      </div>

      <!-- More row -->
      <button
        v-if="hasMore"
        type="button"
        class="w-full py-2.5 text-[12px] font-medium text-primary hover:bg-muted/50 transition-colors"
        @click="router.push({ name: ROUTES.TASKS })"
      >
        Ver mais {{ tasks.length - MAX_SHOWN }}
      </button>
    </div>
  </div>
</template>
