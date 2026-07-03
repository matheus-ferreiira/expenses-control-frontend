<script setup lang="ts">
import type { TransactionCategory } from '@/types/finance'

withDefaults(
  defineProps<{
    category?: TransactionCategory | null
    size?: 'sm' | 'xs'
  }>(),
  { size: 'sm' },
)
</script>

<template>
  <span
    v-if="category"
    class="inline-flex items-center gap-1"
  >
    <span
      class="inline-block rounded-full shrink-0 h-1.5 w-1.5"
      :style="{ backgroundColor: category.color }"
    />
    <span
      :class="size === 'xs' ? 'text-[10px]' : 'text-[11px]'"
      class="text-muted-foreground"
    >
      {{ category.name }}
    </span>
  </span>
</template>
