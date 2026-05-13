<script setup lang="ts">
import HabitGrid from '../components/HabitGrid.vue'
import type { Habit } from '@/types/habits'

defineProps<{
  habits: Habit[]
  loading?: boolean
}>()

const emit = defineEmits<{
  log: [id: string]
  edit: [habit: Habit]
  delete: [id: string]
  archive: [id: string]
  open: [habit: Habit]
  create: []
}>()
</script>

<template>
  <HabitGrid
    :habits="habits"
    :loading="loading"
    @log="emit('log', $event)"
    @edit="emit('edit', $event)"
    @delete="emit('delete', $event)"
    @archive="emit('archive', $event)"
    @open="emit('open', $event)"
    @create="emit('create')"
  />
</template>
