<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Skeleton } from '@ui/skeleton'
import { Check, Flame, ArrowRight, Loader2 } from 'lucide-vue-next'
import type { Habit } from '@/types/habits'
import { isCompletedToday, getWeeklyDots } from '@/features/habits/utils/habitHelpers'
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
const completedCount = computed(() => props.habits.filter(isCompletedToday).length)
const completionPct = computed(() =>
  props.habits.length > 0
    ? Math.round((completedCount.value / props.habits.length) * 100)
    : 0,
)

function handleLog(id: string) {
  if (loggingIds.value.has(id)) return
  loggingIds.value.add(id)
  emit('log', id)
  setTimeout(() => loggingIds.value.delete(id), 800)
}
</script>

<template>
  <div class="rounded-lg border border-border/50 bg-card">
    <!-- Header -->
    <div class="flex items-center justify-between px-4 py-3 border-b border-border/40">
      <div class="flex items-center gap-2">
        <Flame :size="13" class="text-muted-foreground" />
        <span class="text-sm font-medium text-foreground">Hábitos</span>
        <span
          v-if="!loading && habits.length > 0"
          class="text-[10px] text-muted-foreground/60 bg-muted/60 px-1.5 py-0.5 rounded-full tabular-nums"
        >
          {{ completedCount }}/{{ habits.length }}
        </span>
      </div>
      <button
        class="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        @click="router.push({ name: ROUTES.HABITS })"
      >
        Ver todos <ArrowRight :size="10" />
      </button>
    </div>

    <!-- Progress bar -->
    <div v-if="!loading && habits.length > 0" class="px-4 pt-3 pb-1">
      <div class="flex items-center justify-between mb-1">
        <span class="text-[10px] text-muted-foreground/50">Hoje</span>
        <span class="text-[10px] text-muted-foreground/70 tabular-nums">{{ completionPct }}%</span>
      </div>
      <div class="h-1 w-full bg-muted/50 rounded-full overflow-hidden">
        <div
          class="h-full bg-primary/60 rounded-full transition-all duration-500"
          :style="{ width: `${completionPct}%` }"
        />
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="p-4 space-y-3">
      <div v-for="i in 3" :key="i" class="flex items-center gap-3">
        <Skeleton class="h-1.5 w-1.5 rounded-full shrink-0" />
        <div class="flex-1 space-y-1.5">
          <Skeleton class="h-3 w-1/2" />
          <Skeleton class="h-2 w-20" />
        </div>
        <Skeleton class="h-5 w-5 rounded-full shrink-0" />
      </div>
    </div>

    <!-- Empty -->
    <div
      v-else-if="habits.length === 0"
      class="flex flex-col items-center justify-center py-8 px-4 text-center"
    >
      <Flame :size="18" class="text-muted-foreground/30 mb-2" />
      <p class="text-sm text-muted-foreground/50">Nenhum hábito ativo.</p>
    </div>

    <!-- Habit list -->
    <div v-else class="divide-y divide-border/40">
      <div
        v-for="habit in shown"
        :key="habit.id"
        class="flex items-center gap-3 px-4 py-2.5 hover:bg-accent/20 transition-colors"
      >
        <!-- Color dot -->
        <div
          class="shrink-0 h-1.5 w-1.5 rounded-full mt-0.5"
          :style="{ backgroundColor: habit.color }"
        />

        <!-- Name + weekly dots -->
        <div class="flex-1 min-w-0">
          <p class="text-[13px] text-foreground leading-none truncate mb-1">
            {{ habit.name }}
          </p>
          <!-- 7-day weekly dots -->
          <div class="flex items-center gap-0.5">
            <div
              v-for="(dot, i) in getWeeklyDots(habit)"
              :key="i"
              :class="[
                'h-1.5 w-1.5 rounded-full transition-colors',
                dot.isFuture
                  ? 'bg-muted/30'
                  : dot.isLogged
                    ? 'bg-primary/70'
                    : dot.isTarget
                      ? 'bg-muted-foreground/20'
                      : 'bg-transparent',
              ]"
            />
          </div>
        </div>

        <!-- Streak -->
        <span
          v-if="habit.current_streak > 1"
          class="shrink-0 flex items-center gap-0.5 text-[10px] text-orange-400/80"
        >
          <Flame :size="9" />
          {{ habit.current_streak }}
        </span>

        <!-- Log button -->
        <button
          :class="[
            'shrink-0 h-[18px] w-[18px] rounded-full border flex items-center justify-center transition-all',
            isCompletedToday(habit)
              ? 'bg-emerald-500/80 border-emerald-500/80 text-white'
              : 'border-border/80 hover:border-emerald-500/50 hover:bg-emerald-500/5',
          ]"
          :disabled="loggingIds.has(habit.id)"
          @click="handleLog(habit.id)"
        >
          <Loader2 v-if="loggingIds.has(habit.id)" :size="9" class="animate-spin" />
          <Check v-else-if="isCompletedToday(habit)" :size="9" />
        </button>
      </div>

      <!-- More row -->
      <div v-if="hasMore" class="px-4 py-2.5 text-center">
        <button
          class="text-xs text-muted-foreground/60 hover:text-foreground transition-colors"
          @click="router.push({ name: ROUTES.HABITS })"
        >
          + {{ habits.length - MAX_SHOWN }} mais
        </button>
      </div>
    </div>
  </div>
</template>
