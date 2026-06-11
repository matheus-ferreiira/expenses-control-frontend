<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Skeleton } from '@ui/skeleton'
import { Check, ArrowRight, Loader2, ClipboardList } from 'lucide-vue-next'
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
  normal: 'bg-muted-foreground/40',
  low: 'bg-muted-foreground/30',
}

function priorityDotClass(priority: Task['priority']): string {
  return PRIORITY_DOT[priority] ?? 'bg-muted-foreground/30'
}

function timeLabel(task: Task): string {
  if (!task.due_time) return ''
  const [h, m] = task.due_time.split(':')
  if (!h || !m) return ''
  const hour = parseInt(h)
  const min = m
  const period = hour >= 12 ? 'PM' : 'AM'
  const display = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
  return `${display}:${min} ${period}`
}
</script>

<template>
  <div class="rounded-lg border border-border/50 bg-card">
    <!-- Header -->
    <div class="flex items-center justify-between px-4 py-3 border-b border-border/40">
      <div class="flex items-center gap-2">
        <ClipboardList :size="13" class="text-muted-foreground" />
        <span class="text-[14px] font-medium text-foreground">Tarefas de hoje</span>
        <span
          v-if="!loading && tasks.length > 0"
          class="text-[10px] text-muted-foreground/60 bg-muted/60 px-1.5 py-0.5 rounded-full tabular-nums"
        >
          {{ tasks.filter(t => t.status === 'completed').length }}/{{ tasks.length }}
        </span>
      </div>
      <button
        class="flex items-center gap-1 text-[12px] text-muted-foreground hover:text-foreground transition-base"
        @click="router.push({ name: ROUTES.TASKS })"
      >
        Ver todas <ArrowRight :size="10" />
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="divide-y divide-border/40">
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
      <ClipboardList :size="20" class="text-muted-foreground/30" />
      <p class="text-[13px] text-muted-foreground/50">Nenhuma tarefa para hoje</p>
    </div>

    <!-- Task list -->
    <div v-else class="divide-y divide-border/40">
      <div
        v-for="task in shown"
        :key="task.id"
        class="group flex items-center gap-3 px-4 py-2.5 hover:bg-accent/20 transition-base"
      >
        <!-- Toggle circle -->
        <button
          :class="[
            'shrink-0 h-[18px] w-[18px] rounded-full border flex items-center justify-center transition-all',
            task.status === 'completed'
              ? 'bg-success/80 border-success/80 text-primary-foreground'
              : 'border-border/80 hover:border-success/50 hover:bg-success/5',
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
                'text-[13px] leading-none truncate',
                task.status === 'completed'
                  ? 'line-through text-muted-foreground/50'
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
            <span v-if="timeLabel(task)" class="text-[10px] text-muted-foreground/50 leading-none">
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
      <div v-if="hasMore" class="px-4 py-2.5 text-center">
        <button
          class="text-[11px] text-muted-foreground/60 hover:text-foreground transition-base"
          @click="router.push({ name: ROUTES.TASKS })"
        >
          + {{ tasks.length - MAX_SHOWN }} mais
        </button>
      </div>
    </div>
  </div>
</template>
