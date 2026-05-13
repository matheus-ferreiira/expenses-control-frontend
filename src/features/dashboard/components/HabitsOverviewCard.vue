<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Button } from '@ui/button'
import { Skeleton } from '@ui/skeleton'
import { Check, Flame, ArrowRight, Loader2 } from 'lucide-vue-next'
import type { Habit } from '@/types/habits'
import { isCompletedToday, streakLabel } from '@/features/habits/utils/habitHelpers'
import { ROUTES } from '@/constants/routes'

const MAX_SHOWN = 5

const props = defineProps<{
  habits: Habit[]
  loading?: boolean
}>()

const emit = defineEmits<{
  log: [id: string]
}>()

const router = useRouter()
const loggingIds = ref<Set<string>>(new Set())

const shown = computed(() => props.habits.slice(0, MAX_SHOWN))
const hasMore = computed(() => props.habits.length > MAX_SHOWN)

function handleLog(id: string) {
  if (loggingIds.value.has(id)) return
  loggingIds.value.add(id)
  emit('log', id)
  setTimeout(() => loggingIds.value.delete(id), 800)
}
</script>

<template>
  <div class="rounded-lg border border-border bg-card flex flex-col">
    <!-- Header -->
    <div class="flex items-center justify-between px-4 py-3 border-b border-border/60">
      <div class="flex items-center gap-2">
        <Flame :size="14" class="text-muted-foreground" />
        <span class="text-sm font-medium text-foreground">Hábitos</span>
        <span
          v-if="!loading && habits.length > 0"
          class="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full"
        >
          {{ habits.filter(isCompletedToday).length }}/{{ habits.length }}
        </span>
      </div>
      <Button
        variant="ghost"
        size="sm"
        class="h-6 px-2 text-xs text-muted-foreground gap-1"
        @click="router.push({ name: ROUTES.HABITS })"
      >
        Ver todos
        <ArrowRight :size="10" />
      </Button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="p-4 space-y-3">
      <div v-for="i in 3" :key="i" class="flex items-center gap-3">
        <Skeleton class="h-2 w-2 rounded-full shrink-0" />
        <div class="flex-1 space-y-1.5">
          <Skeleton class="h-3.5 w-1/2" />
        </div>
        <Skeleton class="h-6 w-6 rounded-full shrink-0" />
      </div>
    </div>

    <!-- Empty -->
    <div v-else-if="habits.length === 0" class="flex flex-col items-center justify-center py-10 px-4 text-center">
      <div class="p-2.5 rounded-lg bg-muted mb-3">
        <Flame :size="18" class="text-muted-foreground" />
      </div>
      <p class="text-sm font-medium text-foreground">Nenhum hábito ativo</p>
      <p class="text-xs text-muted-foreground mt-0.5">Crie seu primeiro hábito.</p>
    </div>

    <!-- Habit list -->
    <div v-else class="divide-y divide-border/50">
      <div
        v-for="habit in shown"
        :key="habit.id"
        class="flex items-center gap-3 px-4 py-2.5 hover:bg-accent/30 transition-colors"
      >
        <!-- Color dot -->
        <span
          class="shrink-0 h-2 w-2 rounded-full"
          :style="{ backgroundColor: habit.color }"
        />

        <!-- Name + streak -->
        <span class="flex-1 text-sm text-foreground truncate">{{ habit.name }}</span>

        <!-- Streak -->
        <span
          v-if="habit.current_streak > 0"
          class="shrink-0 flex items-center gap-0.5 text-xs text-orange-400"
        >
          <Flame :size="10" />
          {{ streakLabel(habit.current_streak) }}
        </span>

        <!-- Log button -->
        <div class="shrink-0" @click.stop>
          <button
            :class="[
              'h-6 w-6 rounded-full border flex items-center justify-center transition-all',
              isCompletedToday(habit)
                ? 'bg-emerald-500 border-emerald-500 text-white'
                : 'border-border hover:border-emerald-500/60',
            ]"
            :disabled="loggingIds.has(habit.id)"
            @click="handleLog(habit.id)"
          >
            <Loader2 v-if="loggingIds.has(habit.id)" :size="10" class="animate-spin" />
            <Check v-else-if="isCompletedToday(habit)" :size="10" />
          </button>
        </div>
      </div>

      <!-- "X more" row -->
      <div v-if="hasMore" class="px-4 py-2 text-center">
        <button
          class="text-xs text-muted-foreground hover:text-foreground transition-colors"
          @click="router.push({ name: ROUTES.HABITS })"
        >
          +{{ habits.length - MAX_SHOWN }} mais hábitos
        </button>
      </div>
    </div>
  </div>
</template>
