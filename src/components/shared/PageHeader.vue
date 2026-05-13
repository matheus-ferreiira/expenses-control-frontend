<script setup lang="ts">
defineProps<{
  title: string
  subtitle?: string
}>()
</script>

<template>
  <div class="flex items-start justify-between gap-4 mb-6">
    <div class="min-w-0">
      <h1 class="text-2xl font-semibold text-foreground tracking-tight truncate">
        {{ title }}
      </h1>
      <p v-if="subtitle" class="mt-0.5 text-sm text-muted-foreground">
        {{ subtitle }}
      </p>
    </div>

    <div v-if="$slots.actions" class="flex items-center gap-2 shrink-0">
      <slot name="actions" />
    </div>
  </div>
</template>
