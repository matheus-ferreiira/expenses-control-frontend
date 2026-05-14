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
  <div>
    <!-- Group header -->
    <div class="flex items-center justify-between px-1 mb-2">
      <span class="text-[9px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/40">
        {{ label }}
      </span>
      <span class="text-[10px] text-muted-foreground/30 tabular-nums">{{ goals.length }}</span>
    </div>

    <!-- Goals container -->
    <div class="rounded-lg border border-border/50 overflow-hidden divide-y divide-border/25">
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
