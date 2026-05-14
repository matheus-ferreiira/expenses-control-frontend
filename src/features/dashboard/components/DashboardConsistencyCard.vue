<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { Skeleton } from '@ui/skeleton'
import { Flame, ArrowRight } from 'lucide-vue-next'
import type { Habit } from '@/types/habits'
import { isCompletedToday } from '@/features/habits/utils/habitHelpers'
import { ROUTES } from '@/constants/routes'

const props = defineProps<{
  habits: Habit[]
  loading?: boolean
}>()

const router = useRouter()

const completedCount = computed(() => props.habits.filter(isCompletedToday).length)
const totalCount = computed(() => props.habits.length)
const pct = computed(() =>
  totalCount.value > 0 ? Math.round((completedCount.value / totalCount.value) * 100) : 0,
)

const WEEK_LABELS = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D']

const weekDots = computed(() => {
  const today = new Date()
  const dayOfWeek = today.getDay()
  const monday = new Date(today)
  monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7))

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    const dateStr = d.toLocaleDateString('en-CA')
    const todayStr = today.toLocaleDateString('en-CA')
    const isFuture = dateStr > todayStr
    const isCurrentDay = dateStr === todayStr

    const logged = !isFuture && props.habits.some((h) =>
      h.logs?.some?.((log) => log.completed_date === dateStr),
    )

    return { label: WEEK_LABELS[i] ?? '', isFuture, isCurrentDay, logged }
  })
})
</script>

<template>
  <div class="rounded-lg border border-border/50 bg-card">
    <div class="flex items-center justify-between px-4 py-3 border-b border-border/40">
      <div class="flex items-center gap-2">
        <Flame :size="13" class="text-muted-foreground" />
        <span class="text-sm font-medium text-foreground">Consistência Semanal</span>
      </div>
      <button
        class="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-base"
        @click="router.push({ name: ROUTES.HABITS })"
      >
        Ver <ArrowRight :size="10" />
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="px-4 py-4 space-y-3">
      <Skeleton class="h-8 w-16" />
      <Skeleton class="h-3 w-40" />
      <div class="flex gap-2 mt-2">
        <Skeleton v-for="i in 7" :key="i" class="h-5 w-5 rounded-full" />
      </div>
    </div>

    <!-- Empty -->
    <div v-else-if="habits.length === 0" class="px-4 py-5 text-center">
      <p class="text-xs text-muted-foreground/50">Nenhum hábito ativo.</p>
    </div>

    <!-- Content -->
    <div v-else class="px-4 py-4">
      <!-- Percentage -->
      <p
        class="text-[28px] font-semibold tabular-nums leading-none mb-1"
        :style="pct >= 100 ? 'color: hsl(var(--success))' : pct > 0 ? 'color: hsl(var(--foreground))' : 'color: hsl(var(--muted-foreground) / 0.5)'"
      >
        {{ pct }}%
      </p>
      <p class="text-[11.5px] mb-3" style="color: hsl(var(--muted-foreground) / 0.55)">
        {{ completedCount }} de {{ totalCount }} hábito{{ totalCount !== 1 ? 's' : '' }} concluído{{ completedCount !== 1 ? 's' : '' }} hoje
      </p>

      <!-- Week dots -->
      <div class="flex items-center gap-0 justify-between">
        <div
          v-for="(dot, i) in weekDots"
          :key="i"
          class="flex flex-col items-center gap-1.5"
        >
          <span
            class="text-[9px] font-medium uppercase"
            :style="dot.isCurrentDay ? 'color: hsl(var(--primary))' : 'color: hsl(var(--muted-foreground) / 0.35)'"
          >
            {{ dot.label }}
          </span>
          <div
            :class="[
              'h-5 w-5 rounded-full flex items-center justify-center transition-base',
              dot.isFuture
                ? 'bg-transparent border border-border/30'
                : dot.logged
                  ? 'bg-primary/70'
                  : dot.isCurrentDay
                    ? 'border border-primary/40'
                    : 'bg-muted/40',
            ]"
          />
        </div>
      </div>
    </div>
  </div>
</template>
