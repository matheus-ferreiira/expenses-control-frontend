<script setup lang="ts">
import { Skeleton } from '@ui/skeleton'

withDefaults(
  defineProps<{
    rows?: number
    message?: string
    variant?: 'rows' | 'cards' | 'list'
  }>(),
  { rows: 4, variant: 'rows' },
)
</script>

<template>
  <div class="w-full space-y-3 animate-pulse" role="status" aria-busy="true">
    <!-- Rows variant: full-width horizontal lines -->
    <template v-if="variant === 'rows'">
      <div v-for="i in rows" :key="i" class="flex items-center gap-3">
        <Skeleton class="h-4 w-4 rounded-sm shrink-0" />
        <Skeleton :class="['h-4', i % 3 === 0 ? 'w-3/4' : i % 2 === 0 ? 'w-full' : 'w-5/6']" />
      </div>
    </template>

    <!-- Cards variant: skeleton cards in grid -->
    <template v-else-if="variant === 'cards'">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div v-for="i in rows" :key="i" class="rounded-lg border border-border p-4 space-y-3">
          <Skeleton class="h-4 w-2/3" />
          <Skeleton class="h-3 w-full" />
          <Skeleton class="h-3 w-1/2" />
        </div>
      </div>
    </template>

    <!-- List variant: items with avatar/icon placeholder -->
    <template v-else>
      <div v-for="i in rows" :key="i" class="flex items-center gap-3 py-2">
        <Skeleton class="h-8 w-8 rounded-md shrink-0" />
        <div class="flex-1 space-y-1.5">
          <Skeleton :class="['h-3.5', i % 2 === 0 ? 'w-3/4' : 'w-1/2']" />
          <Skeleton class="h-3 w-full" />
        </div>
      </div>
    </template>

    <span class="sr-only">{{ message ?? 'Carregando...' }}</span>
  </div>
</template>
