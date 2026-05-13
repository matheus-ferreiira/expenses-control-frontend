<script setup lang="ts">
defineProps<{
  title: string
  subtitle?: string
}>()
</script>

<template>
  <div class="flex items-center justify-between gap-3 mb-4">
    <div class="min-w-0">
      <h2 class="text-base font-semibold text-foreground truncate">{{ title }}</h2>
      <p v-if="subtitle" class="text-xs text-muted-foreground mt-0.5">{{ subtitle }}</p>
    </div>

    <div v-if="$slots.right" class="flex items-center gap-2 shrink-0">
      <slot name="right" />
    </div>
  </div>
</template>
