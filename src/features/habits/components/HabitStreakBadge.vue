<script setup lang="ts">
import { computed } from 'vue'
import { Flame } from 'lucide-vue-next'
import { streakLabel } from '../utils/habitHelpers'

const props = defineProps<{
  streak: number
  size?: 'sm' | 'md'
}>()

const label = computed(() => streakLabel(props.streak))
const hasStreak = computed(() => props.streak > 0)
</script>

<template>
  <span
    :class="[
      'inline-flex items-center gap-1 font-medium',
      size === 'md' ? 'text-sm' : 'text-[11px]',
      hasStreak ? 'text-orange-400' : 'text-muted-foreground/50',
    ]"
  >
    <Flame :size="size === 'md' ? 14 : 11" :class="hasStreak && 'drop-shadow-[0_0_4px_rgb(251,146,60)]'" />
    {{ label }}
  </span>
</template>
