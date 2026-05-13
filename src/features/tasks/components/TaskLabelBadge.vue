<script setup lang="ts">
import type { TaskLabel } from '@/types/tasks'

defineProps<{
  label: TaskLabel
}>()
</script>

<template>
  <span class="inline-flex items-center gap-1 text-[11px] text-muted-foreground font-medium">
    <span class="inline-block w-1.5 h-1.5 rounded-full shrink-0" :style="{ backgroundColor: label.color }" />
    {{ label.name }}
  </span>
</template>
