<script setup lang="ts">
import { computed } from 'vue'
import { Badge } from '@ui/badge'
import type { HabitFrequency } from '@/types/habits'
import { HABIT_FREQUENCY_LABELS } from '@/types/habits'
import { FREQUENCY_STYLE } from '../types'

const props = defineProps<{
  frequency: HabitFrequency
}>()

const style = computed(() => FREQUENCY_STYLE[props.frequency])
const label = computed(() => HABIT_FREQUENCY_LABELS[props.frequency])
</script>

<template>
  <Badge
    variant="outline"
    :class="['border-transparent font-medium text-[11px] px-1.5 py-0.5', style.bg, style.text]"
  >
    {{ label }}
  </Badge>
</template>
