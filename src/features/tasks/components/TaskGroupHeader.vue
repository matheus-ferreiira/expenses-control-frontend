<script setup lang="ts">
defineProps<{
  label: string
  count: number
  groupId: string
}>()
</script>

<template>
  <div class="flex items-center gap-2 pt-3 pb-1">
    <span
      class="uppercase tracking-widest text-[11px] font-semibold"
      :class="groupId === 'overdue' ? 'text-destructive' : groupId === 'today' ? 'text-primary' : 'text-muted-foreground'"
    >{{ label }}</span>
    <span class="text-[11px] text-muted-foreground tabular-nums">{{ count }}</span>
  </div>
</template>
