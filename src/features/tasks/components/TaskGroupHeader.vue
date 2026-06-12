<script setup lang="ts">
defineProps<{
  label: string
  count: number
  groupId: string
}>()
</script>

<template>
  <div class="flex items-center gap-2 pt-5 pb-2 first:pt-1">
    <div
      class="flex items-center gap-2 pl-2"
      :class="{
        'border-l-2 border-destructive/60': groupId === 'overdue',
        'border-l-2 border-primary': groupId === 'today',
        'border-l-2 border-success/40': groupId === 'completed',
        'border-l-2 border-border/60': ['tomorrow', 'week', 'upcoming'].includes(groupId),
        'border-l-2 border-border/40': groupId === 'no-date',
      }"
    >
      <span
        class="uppercase tracking-widest text-[11px] font-semibold"
        :class="{
          'text-destructive/70': groupId === 'overdue',
          'text-muted-foreground/50': groupId === 'completed',
          'text-muted-foreground/70': !['overdue', 'completed'].includes(groupId),
        }"
      >{{ label }}</span>
      <span class="text-[11px] text-muted-foreground/40">{{ count }}</span>
    </div>
  </div>
</template>
