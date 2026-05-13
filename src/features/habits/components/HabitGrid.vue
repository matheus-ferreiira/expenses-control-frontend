<script setup lang="ts">
import { ref } from 'vue'
import { Button } from '@ui/button'
import { Flame, Plus } from 'lucide-vue-next'
import { EmptyState } from '@/components/shared'
import HabitCard from './HabitCard.vue'
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

const loggingIds = ref<Set<string>>(new Set())

async function handleLog(id: string) {
  if (loggingIds.value.has(id)) return
  loggingIds.value.add(id)
  try {
    emit('log', id)
  } finally {
    setTimeout(() => loggingIds.value.delete(id), 600)
  }
}
</script>

<template>
  <!-- Loading skeleton -->
  <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
    <div
      v-for="i in 6"
      :key="i"
      class="rounded-lg border border-border bg-card overflow-hidden h-32 animate-pulse"
    >
      <div class="absolute left-0 top-0 bottom-0 w-1 bg-muted" />
      <div class="p-3 pl-4 space-y-2">
        <div class="h-4 w-3/4 rounded bg-muted" />
        <div class="h-3 w-1/2 rounded bg-muted" />
        <div class="flex gap-1 mt-4">
          <div v-for="j in 7" :key="j" class="flex-1 h-1.5 rounded-full bg-muted" />
        </div>
      </div>
    </div>
  </div>

  <!-- Empty state -->
  <EmptyState
    v-else-if="habits.length === 0"
    :icon="Flame"
    title="Nenhum hábito encontrado"
    description="Crie seu primeiro hábito e comece a construir consistência."
  >
    <template #action>
      <Button size="sm" @click="emit('create')">
        <Plus :size="14" class="mr-1.5" />
        Novo hábito
      </Button>
    </template>
  </EmptyState>

  <!-- Grid -->
  <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
    <HabitCard
      v-for="habit in habits"
      :key="habit.id"
      :habit="habit"
      :logging="loggingIds.has(habit.id)"
      @log="handleLog"
      @edit="emit('edit', $event)"
      @delete="emit('delete', $event)"
      @archive="emit('archive', $event)"
      @open="emit('open', $event)"
    />
  </div>
</template>
