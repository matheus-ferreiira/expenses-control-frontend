<script setup lang="ts">
import { Card, CardHeader, CardContent, CardFooter } from '@ui/card'
import { Skeleton } from '@ui/skeleton'

withDefaults(
  defineProps<{
    loading?: boolean
    noPadding?: boolean
    ghost?: boolean
  }>(),
  { loading: false, noPadding: false, ghost: false },
)
</script>

<template>
  <Card :class="ghost ? 'border-transparent bg-transparent shadow-none' : undefined">
    <CardHeader v-if="$slots.header" :class="noPadding ? 'p-0' : undefined">
      <slot name="header" />
    </CardHeader>

    <CardContent :class="noPadding ? 'p-0' : undefined">
      <template v-if="loading">
        <div class="space-y-3">
          <Skeleton class="h-4 w-3/4" />
          <Skeleton class="h-4 w-full" />
          <Skeleton class="h-4 w-1/2" />
        </div>
      </template>
      <slot v-else />
    </CardContent>

    <CardFooter v-if="$slots.footer && !loading" :class="noPadding ? 'p-0 pt-4' : undefined">
      <slot name="footer" />
    </CardFooter>
  </Card>
</template>
