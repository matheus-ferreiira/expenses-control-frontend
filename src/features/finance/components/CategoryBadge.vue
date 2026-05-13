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
    :class="[
      'inline-flex items-center gap-1 rounded-full font-medium',
      size === 'xs'
        ? 'px-1.5 py-0.5 text-[10px]'
        : 'px-2 py-0.5 text-[11px]',
    ]"
    :style="{
      backgroundColor: category.color + '1a',
      color: category.color,
    }"
  >
    <span
      class="inline-block rounded-full shrink-0"
      :class="size === 'xs' ? 'h-1.5 w-1.5' : 'h-2 w-2'"
      :style="{ backgroundColor: category.color }"
    />
    {{ category.name }}
  </span>

  <span
    v-else
    :class="[
      'inline-flex items-center gap-1 rounded-full font-medium text-muted-foreground/60 bg-muted/60',
      size === 'xs' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-[11px]',
    ]"
  >
    Sem categoria
  </span>
</template>
