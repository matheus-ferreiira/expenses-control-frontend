<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RotateCcw, Flame, TrendingUp } from 'lucide-vue-next'
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
    // silently ignore — recurrence history is non-critical
  } finally {
    loading.value = false
  }
})

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}
</script>

<template>
  <!-- Skip render when no history or only one occurrence -->
  <div
    v-if="!loading && history && history.total_count > 1"
    class="pt-3 border-t border-border/30 mt-3"
  >
    <div class="flex items-center gap-1.5 mb-3">
      <RotateCcw :size="11" class="text-primary" />
      <p class="text-[11px] font-medium uppercase tracking-widest text-muted-foreground/70">
        HISTÓRICO
      </p>
    </div>

    <!-- KPIs row -->
    <div class="grid grid-cols-3 gap-2 mb-3">
      <!-- Streak -->
      <div class="bg-card border border-border rounded-lg p-2.5 text-center">
        <div class="flex items-center justify-center gap-1 mb-0.5">
          <Flame :size="11" class="text-warning" />
          <p class="text-[10px] uppercase tracking-widest text-muted-foreground/50">Sequência</p>
        </div>
        <p class="text-[20px] font-semibold tabular-nums text-foreground leading-none">
          {{ history.current_streak }}
        </p>
      </div>

      <!-- Completion rate -->
      <div class="bg-card border border-border rounded-lg p-2.5 text-center">
        <div class="flex items-center justify-center gap-1 mb-0.5">
          <TrendingUp :size="11" class="text-primary" />
          <p class="text-[10px] uppercase tracking-widest text-muted-foreground/50">Taxa</p>
        </div>
        <p class="text-[20px] font-semibold tabular-nums leading-none"
          :class="history.completion_rate >= 80 ? 'text-success' : history.completion_rate >= 50 ? 'text-warning' : 'text-muted-foreground'"
        >
          {{ history.completion_rate }}%
        </p>
      </div>

      <!-- Total completed -->
      <div class="bg-card border border-border rounded-lg p-2.5 text-center">
        <div class="flex items-center justify-center gap-1 mb-0.5">
          <p class="text-[10px] uppercase tracking-widest text-muted-foreground/50">Concluídas</p>
        </div>
        <p class="text-[20px] font-semibold tabular-nums text-foreground leading-none">
          {{ history.completed_count }}<span class="text-[13px] text-muted-foreground/50">/{{ history.total_count }}</span>
        </p>
      </div>
    </div>

    <!-- Dot grid: recent completions -->
    <div v-if="history.recent_completions.length" class="flex flex-col gap-0">
      <p class="text-[11px] uppercase tracking-widest text-muted-foreground/40 mb-1.5">Últimas ocorrências</p>
      <div class="flex flex-wrap gap-1.5">
        <div
          v-for="entry in history.recent_completions"
          :key="entry.id"
          class="flex items-center gap-1 h-6 px-2 rounded-full text-[10px] tabular-nums font-medium bg-success/15 text-success"
        >
          ✓ {{ formatDate(entry.completed_at ?? entry.due_date) }}
        </div>
      </div>
    </div>
  </div>
</template>
