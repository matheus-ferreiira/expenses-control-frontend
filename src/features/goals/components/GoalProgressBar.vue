<script setup lang="ts">
defineProps<{
  percentage: number
}>()
</script>

<template>
  <div class="h-1 rounded-full overflow-hidden bg-border">
    <div
      class="h-full rounded-full transition-all duration-500"
      :style="{
        width: `${Math.min(percentage, 100)}%`,
        background: percentage >= 100 ? 'hsl(var(--success))' : 'hsl(var(--primary))',
      }"
    />
  </div>
</template>
