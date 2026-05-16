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
  // Build a map of date → total logs across all habits
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

// Group cells into weeks (columns of 7)
const weeks = computed(() => {
  const result: HeatCell[][] = []
  for (let w = 0; w < WEEKS; w++) {
    result.push(cells.value.slice(w * 7, w * 7 + 7))
  }
  return result
})

// Month labels above heatmap
const monthLabels = computed(() => {
  const labels: { label: string; colIndex: number }[] = []
  let lastMonth = -1

  weeks.value.forEach((week, wi) => {
    const firstCell = week[0]
    if (!firstCell) return
    const month = new Date(firstCell.date + 'T12:00:00').getMonth()
    if (month !== lastMonth) {
      lastMonth = month
      const name = new Date(firstCell.date + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'short' })
      labels.push({ label: name.charAt(0).toUpperCase() + name.slice(1, 3), colIndex: wi })
    }
  })

  return labels
})

function cellStyle(count: number): string {
  if (count === 0) return 'background: hsl(var(--border) / 0.25)'
  if (count === 1) return 'background: hsl(var(--success) / 0.3)'
  if (count <= 3) return 'background: hsl(var(--success) / 0.55)'
  if (count <= 5) return 'background: hsl(var(--success) / 0.75)'
  return 'background: hsl(var(--success))'
}
</script>

<template>
  <div>
    <p class="text-[11px] font-medium mb-4" style="color: hsl(var(--muted-foreground) / 0.5)">
      Heatmap de consistência — últimas {{ WEEKS }} semanas
    </p>

    <div class="overflow-x-auto">
      <div class="inline-flex flex-col min-w-max">
        <!-- Month labels row -->
        <div class="flex gap-[4px] mb-1.5 ml-8">
          <template v-for="wi in WEEKS" :key="wi">
            <div class="w-[28px] text-center">
              <span
                v-if="monthLabels.some(l => l.colIndex === wi - 1)"
                class="text-[9px] font-medium"
                style="color: hsl(var(--muted-foreground) / 0.4)"
              >
                {{ monthLabels.find(l => l.colIndex === wi - 1)?.label }}
              </span>
            </div>
          </template>
        </div>

        <!-- Grid: day labels + week columns -->
        <div class="flex gap-[4px]">
          <!-- Weekday labels (every other row) -->
          <div class="flex flex-col gap-[4px] mr-1 w-7">
            <div
              v-for="(dayLabel, di) in ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']"
              :key="di"
              class="h-[28px] flex items-center justify-end pr-1 text-[9px] font-medium"
              style="color: hsl(var(--muted-foreground) / 0.4)"
            >
              {{ di % 2 === 0 ? dayLabel : '' }}
            </div>
          </div>

          <!-- Week columns -->
          <div
            v-for="(week, wi) in weeks"
            :key="wi"
            class="flex flex-col gap-[4px]"
          >
            <div
              v-for="cell in week"
              :key="cell.date"
              class="h-[28px] w-[28px] rounded-[4px] cursor-default transition-opacity hover:opacity-80"
              :style="cellStyle(cell.count)"
              :title="`${cell.label}: ${cell.count} hábito${cell.count !== 1 ? 's' : ''}`"
            />
          </div>
        </div>

        <!-- Legend -->
        <div class="flex items-center gap-[4px] mt-3 ml-8 justify-start">
          <span class="text-[9px] mr-1" style="color: hsl(var(--muted-foreground) / 0.4)">Menos</span>
          <div v-for="n in [0, 1, 3, 5, 6]" :key="n" class="h-[12px] w-[12px] rounded-[2px]" :style="cellStyle(n)" />
          <span class="text-[9px] ml-1" style="color: hsl(var(--muted-foreground) / 0.4)">Mais</span>
        </div>
      </div>
    </div>
  </div>
</template>
