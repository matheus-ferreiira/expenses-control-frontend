<script setup lang="ts">
import { computed } from 'vue'
import type { PriceGoalStatus } from '@/features/prices/types'
import {
  PRICE_GOAL_STATUS_COLORS,
  PRICE_GOAL_STATUS_DOT_COLORS,
  PRICE_GOAL_STATUS_LABELS,
} from '@/features/prices/types'

const props = withDefaults(
  defineProps<{
    status: PriceGoalStatus | null
    /** Compact = dot only, no label text. */
    compact?: boolean
    /** Distinguishes the null case: target exists but no price recorded yet. */
    hasTarget?: boolean
  }>(),
  { compact: false, hasTarget: false },
)

const SHORT_LABELS: Record<PriceGoalStatus, string> = {
  excellent: 'Na meta',
  near: 'Perto da meta',
  above: 'Acima da meta',
}

const textClass = computed(() =>
  props.status ? PRICE_GOAL_STATUS_COLORS[props.status] : 'text-muted-foreground/50',
)
const dotClass = computed(() =>
  props.status ? PRICE_GOAL_STATUS_DOT_COLORS[props.status] : 'bg-muted-foreground/30',
)
const label = computed(() => {
  if (props.status) return SHORT_LABELS[props.status]
  return props.hasTarget ? 'Sem registros' : 'Sem meta'
})
const title = computed(() => {
  if (props.status) return PRICE_GOAL_STATUS_LABELS[props.status]
  return props.hasTarget ? 'Meta definida, nenhum preço registrado ainda' : 'Sem meta definida'
})
</script>

<template>
  <span
    class="inline-flex items-center gap-1.5 text-[11px] font-medium whitespace-nowrap"
    :class="textClass"
    :title="title"
  >
    <span class="size-1.5 rounded-full shrink-0" :class="dotClass" />
    <template v-if="!compact">{{ label }}</template>
  </span>
</template>
