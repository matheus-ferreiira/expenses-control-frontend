<script setup lang="ts">
import { computed, ref } from 'vue'
import { Skeleton } from '@ui/skeleton'
import type { HabitHeatmapEntry } from '@/types/habits'
import { buildHeatmapGrid, heatmapColorClass } from '../utils/habitHelpers'
import { WEEKDAY_LABELS } from '../types'

const props = defineProps<{
  entries: HabitHeatmapEntry[]
  loading?: boolean
  weeks?: number
}>()

const grid = computed(() => buildHeatmapGrid(props.entries, props.weeks ?? 12))

// Tooltip
const tooltip = ref<{ date: string; count: number; x: number; y: number } | null>(null)

function showTooltip(e: MouseEvent, date: string, count: number) {
  if (!date) return
  const rect = (e.target as HTMLElement).getBoundingClientRect()
  tooltip.value = { date, count, x: rect.left, y: rect.top }
}

function hideTooltip() {
  tooltip.value = null
}

// Month labels: first cell of each month gets a label
const monthLabels = computed(() => {
  const labels: { week: number; label: string }[] = []
  let lastMonth = -1
  grid.value.forEach((week, wi) => {
    const firstCell = week.find((c) => !c.isEmpty)
    if (firstCell) {
      const month = new Date(firstCell.date).getMonth()
      if (month !== lastMonth) {
        labels.push({ week: wi, label: new Date(firstCell.date).toLocaleDateString('pt-BR', { month: 'short' }) })
        lastMonth = month
      }
    }
  })
  return labels
})
</script>

<template>
  <div>
    <!-- Loading -->
    <div v-if="loading" class="space-y-1">
      <div class="flex gap-1">
        <div v-for="w in (weeks ?? 12)" :key="w" class="flex flex-col gap-1">
          <div v-for="d in 7" :key="d" class="w-3 h-3 rounded-sm bg-muted animate-pulse" />
        </div>
      </div>
    </div>

    <!-- Heatmap -->
    <div v-else class="overflow-x-auto">
      <!-- Month labels -->
      <div class="flex gap-1 mb-1 ml-5">
        <div
          v-for="w in (weeks ?? 12)"
          :key="w"
          class="w-3 shrink-0 text-center"
        >
          <span
            v-if="monthLabels.some(ml => ml.week === w - 1)"
            class="text-[9px] text-muted-foreground/60"
          >
            {{ monthLabels.find(ml => ml.week === w - 1)?.label }}
          </span>
        </div>
      </div>

      <div class="flex gap-1">
        <!-- Day labels -->
        <div class="flex flex-col gap-1 mr-1">
          <span
            v-for="(label, i) in WEEKDAY_LABELS"
            :key="i"
            class="w-4 h-3 flex items-center justify-center text-[9px] text-muted-foreground/50 leading-none"
          >
            {{ i % 2 === 1 ? label.charAt(0) : '' }}
          </span>
        </div>

        <!-- Week columns -->
        <div
          v-for="(week, wi) in grid"
          :key="wi"
          class="flex flex-col gap-1"
        >
          <div
            v-for="(cell, di) in week"
            :key="di"
            :class="[
              'w-3 h-3 rounded-sm transition-colors cursor-default',
              cell.isEmpty ? 'bg-transparent' : heatmapColorClass(cell.count),
            ]"
            @mouseenter="(e) => showTooltip(e, cell.date, cell.count)"
            @mouseleave="hideTooltip"
          />
        </div>
      </div>

      <!-- Tooltip -->
      <Teleport to="body">
        <div
          v-if="tooltip && tooltip.date"
          class="fixed z-50 pointer-events-none px-2 py-1 rounded-md bg-popover border border-border text-xs text-popover-foreground shadow-md"
          :style="{ top: `${tooltip.y - 36}px`, left: `${tooltip.x - 20}px` }"
        >
          <span class="font-medium">{{ tooltip.date }}</span>
          <span class="text-muted-foreground ml-1">
            {{ tooltip.count > 0 ? `${tooltip.count}×` : 'sem registro' }}
          </span>
        </div>
      </Teleport>
    </div>
  </div>
</template>
