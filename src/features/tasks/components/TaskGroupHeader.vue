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
        'border-l-2 border-destructive': groupId === 'overdue',
        'border-l-2 border-primary': groupId === 'today',
        'border-l-2 border-border': !['overdue', 'today'].includes(groupId),
      }"
    >
      <span
        class="uppercase tracking-widest text-[11px] font-semibold"
        :class="{
          'text-destructive': groupId === 'overdue',
          'text-muted-foreground': groupId !== 'overdue',
        }"
      >{{ label }}</span>
      <span class="text-[11px] text-muted-foreground">{{ count }}</span>
    </div>
  </div>
</template>
