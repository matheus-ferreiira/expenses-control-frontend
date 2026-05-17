<script setup lang="ts">
import { computed } from 'vue'
import type { Habit } from '@/types/habits'

const props = defineProps<{
  habits: Habit[]
}>()

const WEEKS = 12
const TOTAL_DAYS = WEEKS * 7

interface HeatCell {
  date: string
  count: number
  label: string
}

const cells = computed<HeatCell[]>(() => {
  const countMap = new Map<string, number>()

  for (const habit of props.habits) {
    for (const log of habit.logs) {
      const d = log.completed_date
      countMap.set(d, (countMap.get(d) ?? 0) + 1)
    }
  }

  const today = new Date()
  const result: HeatCell[] = []

  for (let i = TOTAL_DAYS - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    const dateStr = d.toLocaleDateString('en-CA')
    const label = d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })
    result.push({
      date: dateStr,
      count: countMap.get(dateStr) ?? 0,
      label,
    })
  }

  return result
})

function cellStyle(count: number): string {
  if (count === 0) return 'background: hsl(var(--muted))'
  if (count === 1) return 'background: hsl(var(--success) / 0.2)'
  if (count <= 3) return 'background: hsl(var(--success) / 0.4)'
  if (count <= 5) return 'background: hsl(var(--success) / 0.6)'
  return 'background: hsl(var(--success) / 0.8)'
}
</script>

<template>
  <div class="p-4">
    <div class="grid grid-cols-[auto_1fr] gap-3">
      <!-- Day labels: Seg / Qua / Sex / Dom -->
      <div class="flex flex-col justify-between text-[10px] text-muted-foreground py-1">
        <span>Seg</span>
        <span>Qua</span>
        <span>Sex</span>
        <span>Dom</span>
      </div>

      <!-- Heatmap grid: 7 rows × 12 cols -->
      <div class="grid grid-rows-7 grid-flow-col gap-1">
        <div
          v-for="cell in cells"
          :key="cell.date"
          class="h-3 w-3 rounded-sm cursor-default transition-opacity hover:opacity-80"
          :style="cellStyle(cell.count)"
          :title="`${cell.label}: ${cell.count} hábito${cell.count !== 1 ? 's' : ''}`"
        />
      </div>
    </div>

    <!-- Legend -->
    <div class="mt-3 flex items-center justify-end gap-2 text-[10px] text-muted-foreground">
      Menos
      <div v-for="n in [0, 1, 2, 3, 4]" :key="n" class="h-2.5 w-2.5 rounded-sm" :style="cellStyle(n)" />
      Mais
    </div>
  </div>
</template>
