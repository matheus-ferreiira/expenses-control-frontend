<script setup lang="ts">
import GoalRow from './GoalRow.vue'
import type { Goal } from '@/types/goals'

defineProps<{
  label: string
  goals: Goal[]
}>()

const emit = defineEmits<{
  edit: [goal: Goal]
  delete: [id: string]
  'update-progress': [goal: Goal]
}>()
</script>

<template>
  <div class="rounded-lg overflow-hidden">
    <!-- Group header -->
    <div class="flex items-center justify-between px-4 py-2.5 bg-card border-b border-border">
      <span class="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {{ label }}
      </span>
      <span
        class="text-[10px] font-medium tabular-nums px-1.5 py-0.5 rounded-full"
        style="background: hsl(var(--muted) / 0.6); color: hsl(var(--muted-foreground) / 0.5)"
      >
        {{ goals.length }}
      </span>
    </div>

    <!-- Goals list -->
    <div class="divide-y divide-border">
      <GoalRow
        v-for="goal in goals"
        :key="goal.id"
        :goal="goal"
        @edit="emit('edit', $event)"
        @delete="emit('delete', $event)"
        @update-progress="emit('update-progress', $event)"
      />
    </div>
  </div>
</template>
