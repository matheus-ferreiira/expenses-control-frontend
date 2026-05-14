<script setup lang="ts">
defineProps<{
  label: string
  count: number
}>()
</script>

<template>
  <div class="flex items-center gap-2 px-4 py-2 border-b border-border/30">
    <span
      class="text-[10px] font-semibold uppercase tracking-[0.1em]"
      style="color: hsl(var(--muted-foreground) / 0.5)"
    >
      {{ label }}
    </span>
    <span class="text-[10px]" style="color: hsl(var(--muted-foreground) / 0.35)">
      {{ count }}
    </span>
  </div>
</template>
