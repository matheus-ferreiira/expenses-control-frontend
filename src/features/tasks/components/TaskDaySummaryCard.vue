<script setup lang="ts">
import { computed } from 'vue'
import { CheckCircle2, AlertTriangle, ListTodo } from 'lucide-vue-next'

/**
 * Card-resumo do dia — espelho do MonthSummaryCard (padrão-ouro) para Tarefas:
 * data centralizada, 3 colunas de stats, barra de progresso e chip de status.
 */
const props = defineProps<{
  /** Tarefas com vencimento hoje (pendentes + concluídas) */
  todayTotal: number
  todayCompleted: number
  overdueCount: number
}>()

const dateLabel = computed(() => {
  const raw = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
  return raw.charAt(0).toUpperCase() + raw.slice(1)
})

const remaining = computed(() => Math.max(0, props.todayTotal - props.todayCompleted))
const percent = computed(() =>
  props.todayTotal > 0 ? Math.round((props.todayCompleted / props.todayTotal) * 100) : 0,
)
const allDone = computed(() => props.todayTotal > 0 && remaining.value === 0)

const status = computed<{ tone: 'ok' | 'warn' | 'info'; text: string }>(() => {
  if (props.overdueCount > 0) {
    return {
      tone: 'warn',
      text: `${props.overdueCount} atrasada${props.overdueCount > 1 ? 's' : ''} precisando de atenção`,
    }
  }
  if (allDone.value) {
    return { tone: 'ok', text: 'Tudo concluído por hoje. Bom trabalho!' }
  }
  if (props.todayTotal === 0) {
    return { tone: 'info', text: 'Nenhuma tarefa com data para hoje' }
  }
  return {
    tone: 'info',
    text: `Falta${remaining.value > 1 ? 'm' : ''} ${remaining.value} tarefa${remaining.value > 1 ? 's' : ''} para fechar o dia`,
  }
})
</script>

<template>
  <div class="bg-card rounded-lg p-4">
    <!-- Data centralizada -->
    <div class="flex justify-center mb-3">
      <span class="text-[15px] font-semibold text-foreground">{{ dateLabel }}</span>
    </div>

    <!-- 3-column stats -->
    <div class="grid grid-cols-3 gap-2 text-center">
      <div>
        <p class="text-[10px] text-muted-foreground uppercase tracking-widest">Para hoje</p>
        <p class="text-[17px] font-semibold text-foreground tabular-nums mt-1">{{ todayTotal }}</p>
      </div>
      <div>
        <p class="text-[10px] text-muted-foreground uppercase tracking-widest">Concluídas</p>
        <p class="text-[17px] font-semibold text-success tabular-nums mt-1">{{ todayCompleted }}</p>
      </div>
      <div>
        <p class="text-[10px] text-muted-foreground uppercase tracking-widest">Atrasadas</p>
        <p
          class="text-[17px] font-semibold tabular-nums mt-1"
          :class="overdueCount > 0 ? 'text-destructive' : 'text-foreground'"
        >{{ overdueCount }}</p>
      </div>
    </div>

    <!-- Progress bar -->
    <div v-if="todayTotal > 0" class="mt-3 pt-3 border-t border-border">
      <div class="flex items-center justify-between mb-1.5">
        <p class="text-[11px] uppercase tracking-widest text-muted-foreground">Progresso do dia</p>
        <p class="text-[11px] text-muted-foreground tabular-nums">
          {{ todayCompleted }} de {{ todayTotal }} · {{ percent }}%
        </p>
      </div>
      <div class="h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          class="h-full rounded-full transition-all duration-700"
          :class="allDone ? 'bg-success' : 'bg-primary'"
          :style="{ width: `${percent}%` }"
        />
      </div>
    </div>

    <!-- Status chip -->
    <div
      class="mt-3 flex items-center gap-2 rounded-md px-2.5 py-2 text-[12px] font-medium bg-muted"
      :class="status.tone === 'warn'
        ? 'text-destructive'
        : status.tone === 'ok'
          ? 'text-success'
          : 'text-muted-foreground'"
    >
      <AlertTriangle v-if="status.tone === 'warn'" :size="14" class="shrink-0" />
      <CheckCircle2 v-else-if="status.tone === 'ok'" :size="14" class="shrink-0" />
      <ListTodo v-else :size="14" class="shrink-0" />
      <span class="leading-snug">{{ status.text }}</span>
    </div>
  </div>
</template>
