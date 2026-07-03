<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { RotateCcw, Flame } from 'lucide-vue-next'
import { tasksApi } from '@/services/api/tasks'
import type { RecurrenceHistory } from '@/types/tasks'

const props = defineProps<{
  taskId: string
}>()

const history = ref<RecurrenceHistory | null>(null)
const loading = ref(true)

onMounted(async () => {
  try {
    history.value = await tasksApi.recurrenceHistory(props.taskId)
  } catch {
    // non-critical — silently ignore
  } finally {
    loading.value = false
  }
})

// Dot grid: up to 10 dots representing overall completion ratio
const DOTS_MAX = 10
const totalDots = computed(() => Math.min(history.value?.total_count ?? 0, DOTS_MAX))
const filledDots = computed(() => {
  const h = history.value
  if (!h) return 0
  const ratio = h.total_count > 0 ? h.completed_count / h.total_count : 0
  return Math.round(ratio * totalDots.value)
})

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

function formatTime(iso: string | null): string {
  if (!iso) return ''
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
  <!-- Only render when non-loading, has history, and more than 1 occurrence -->
  <div
    v-if="!loading && history && history.total_count > 1"
    class="pt-3 border-t border-border mt-3"
  >
    <!-- Section header -->
    <div class="flex items-center justify-between mb-3">
      <div class="flex items-center gap-1.5">
        <RotateCcw :size="11" class="text-primary" />
        <p class="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          HISTÓRICO
        </p>
      </div>
      <!-- Streak badge -->
      <div
        v-if="history.current_streak > 0"
        class="flex items-center gap-1 h-6 px-2 rounded-full"
        style="background: hsl(38 90% 60% / 0.12); color: hsl(38 90% 60%)"
      >
        <Flame :size="11" />
        <span class="text-[11px] font-semibold tabular-nums">{{ history.current_streak }}</span>
      </div>
    </div>

    <!-- Stats row -->
    <div class="flex items-center gap-4 mb-3">
      <div>
        <p class="text-[11px] uppercase tracking-widest text-muted-foreground mb-0.5">Taxa</p>
        <p
          class="text-[17px] font-semibold tabular-nums leading-none"
          :class="history.completion_rate >= 80 ? 'text-success' : history.completion_rate >= 50 ? 'text-warning' : 'text-muted-foreground'"
        >{{ history.completion_rate }}%</p>
      </div>
      <div>
        <p class="text-[11px] uppercase tracking-widest text-muted-foreground mb-0.5">Concluídas</p>
        <p class="text-[17px] font-semibold tabular-nums text-foreground leading-none">
          {{ history.completed_count }}<span class="text-[13px] text-muted-foreground">/{{ history.total_count }}</span>
        </p>
      </div>
    </div>

    <!-- Dot grid representing completion ratio -->
    <div class="flex items-center gap-1 mb-3">
      <span
        v-for="i in totalDots"
        :key="i"
        class="size-2 rounded-full"
        :class="i <= filledDots ? 'bg-success' : 'bg-muted'"
      />
    </div>

    <!-- Recent completions list -->
    <div v-if="history.recent_completions.length" class="space-y-0">
      <p class="text-[11px] uppercase tracking-widest text-muted-foreground mb-1.5">Últimas</p>
      <div
        v-for="entry in history.recent_completions.slice(0, 5)"
        :key="entry.id"
        class="flex items-center gap-2 py-1.5 border-b border-border last:border-0"
      >
        <span class="text-[11px] text-success shrink-0">✓</span>
        <span class="text-[12px] text-foreground tabular-nums">
          {{ formatDate(entry.completed_at ?? entry.due_date) }}
        </span>
        <span v-if="entry.completed_at" class="text-[11px] text-muted-foreground tabular-nums ml-auto">
          {{ formatTime(entry.completed_at) }}
        </span>
      </div>
    </div>
  </div>
</template>
