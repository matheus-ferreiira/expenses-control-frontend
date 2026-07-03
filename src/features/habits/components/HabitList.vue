<script setup lang="ts">
import { Button } from '@ui/button'
import { Skeleton } from '@ui/skeleton'
import { Check, Flame, Plus, Loader2 } from 'lucide-vue-next'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@ui/dropdown-menu'
import { EmptyState } from '@/components/shared'
import HabitFrequencyBadge from './HabitFrequencyBadge.vue'
import HabitStreakBadge from './HabitStreakBadge.vue'
import type { Habit } from '@/types/habits'
import { isCompletedToday } from '../utils/habitHelpers'
import { ref } from 'vue'
import { Pencil, Archive, Trash2, MoreHorizontal } from 'lucide-vue-next'

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

function handleLog(id: string) {
  if (loggingIds.value.has(id)) return
  loggingIds.value.add(id)
  emit('log', id)
  setTimeout(() => loggingIds.value.delete(id), 600)
}
</script>

<template>
  <!-- Loading -->
  <div v-if="loading" class="rounded-lg overflow-hidden divide-y divide-border">
    <div v-for="i in 5" :key="i" class="flex items-center gap-3 px-4 py-3">
      <Skeleton class="w-1.5 h-8 rounded-full" />
      <div class="flex-1 space-y-1.5">
        <Skeleton class="h-3.5 w-1/2" />
        <Skeleton class="h-3 w-1/4" />
      </div>
      <Skeleton class="h-7 w-7 rounded-full" />
    </div>
  </div>

  <!-- Empty -->
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

  <!-- List -->
  <div v-else class="rounded-lg overflow-hidden">
    <div
      v-for="habit in habits"
      :key="habit.id"
      class="group flex items-center gap-3 px-4 py-3 border-b border-border last:border-0 hover:bg-muted transition-base cursor-pointer"
      @click="emit('open', habit)"
    >
      <!-- Color dot -->
      <div
        class="w-1.5 h-8 rounded-full shrink-0"
        :style="{ backgroundColor: habit.color ?? undefined }"
      />

      <!-- Content -->
      <div class="flex-1 min-w-0">
        <p class="text-sm font-medium text-foreground truncate">{{ habit.name }}</p>
        <div class="flex items-center gap-2 mt-0.5">
          <HabitFrequencyBadge :frequency="habit.frequency" />
          <HabitStreakBadge :streak="habit.current_streak" />
        </div>
      </div>

      <!-- Quick log -->
      <div class="shrink-0" @click.stop>
        <Button
          :variant="isCompletedToday(habit) ? 'default' : 'outline'"
          size="icon"
          :class="[
            'h-7 w-7 transition-all',
            isCompletedToday(habit)
              ? 'bg-emerald-500 hover:bg-emerald-600 border-emerald-500 text-white'
              : 'hover:border-emerald-500/50 hover:text-emerald-400',
          ]"
          :disabled="loggingIds.has(habit.id)"
          @click="handleLog(habit.id)"
        >
          <Loader2 v-if="loggingIds.has(habit.id)" :size="12" class="animate-spin" />
          <Check v-else :size="12" />
        </Button>
      </div>

      <!-- Actions -->
      <div class="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" @click.stop>
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button variant="ghost" size="icon" class="h-7 w-7">
              <MoreHorizontal :size="14" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" class="w-36">
            <DropdownMenuItem @click="emit('edit', habit)">
              <Pencil :size="12" class="mr-2" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem v-if="habit.is_active" @click="emit('archive', habit.id)">
              <Archive :size="12" class="mr-2" />
              Arquivar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              class="text-destructive focus:text-destructive"
              @click="emit('delete', habit.id)"
            >
              <Trash2 :size="12" class="mr-2" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  </div>
</template>
