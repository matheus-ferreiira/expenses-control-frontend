<script setup lang="ts">
import { ref, computed, type Component } from 'vue'
import { Button } from '@ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@ui/dropdown-menu'
import { Check, Loader2, MoreHorizontal, Pencil, Archive, Trash2, Flame, Heart, Brain, BookOpen, Target, Wallet } from 'lucide-vue-next'
import type { Habit, HabitFrequency } from '@/types/habits'
import { isCompletedToday, getWeeklyDots } from '../utils/habitHelpers'
import { HABIT_FREQUENCY_LABELS } from '@/types/habits'

const CATEGORY_ICON: Record<string, Component> = {
  'Saúde': Heart,
  'Mente': Brain,
  'Aprendizado': BookOpen,
  'Foco': Target,
  'Finanças': Wallet,
}

const CATEGORY_COLOR: Record<string, string> = {
  'Saúde': 'hsl(var(--destructive))',
  'Mente': 'hsl(217 91% 68%)',
  'Aprendizado': 'hsl(var(--chart-1, 220 70% 60%))',
  'Foco': 'hsl(var(--warning))',
  'Finanças': 'hsl(var(--success))',
}

const props = defineProps<{
  habit: Habit
}>()

const emit = defineEmits<{
  log: [id: string]
  edit: [habit: Habit]
  delete: [id: string]
  archive: [id: string]
  open: [habit: Habit]
}>()

const logging = ref(false)

const doneToday = computed(() => isCompletedToday(props.habit))
const freqLabel = computed(() => HABIT_FREQUENCY_LABELS[props.habit.frequency])
const weeklyDots = computed(() => getWeeklyDots(props.habit))
const categoryIcon = computed(() => CATEGORY_ICON[props.habit.category ?? ''] ?? Target)
const categoryIconColor = computed(() => CATEGORY_COLOR[props.habit.category ?? ''] ?? 'hsl(var(--muted-foreground))')

// Frequency badge colors (matching Lovable)
const FREQ_BADGE: Record<HabitFrequency, { bg: string; text: string; border: string }> = {
  daily:   { bg: 'hsl(217 91% 60% / 0.15)', text: 'hsl(217 91% 70%)', border: 'hsl(217 91% 60% / 0.3)' },
  weekly:  { bg: 'hsl(40 65% 56% / 0.15)',  text: 'hsl(40 80% 65%)',  border: 'hsl(40 65% 56% / 0.3)' },
  monthly: { bg: 'hsl(142 45% 46% / 0.15)', text: 'hsl(142 55% 55%)', border: 'hsl(142 45% 46% / 0.3)' },
}

const badgeStyle = computed(() => {
  const c = FREQ_BADGE[props.habit.frequency]
  return `background: ${c.bg}; color: ${c.text}; border-color: ${c.border}`
})

async function handleLog() {
  if (logging.value) return
  logging.value = true
  try {
    emit('log', props.habit.id)
  } finally {
    setTimeout(() => { logging.value = false }, 600)
  }
}
</script>

<template>
  <!-- ─── Mobile card layout ─────────────────────────────────── -->
  <div
    class="sm:hidden bg-card border border-border rounded-lg p-3 flex items-center gap-3 cursor-pointer"
    @click="emit('open', habit)"
  >
    <!-- Category icon -->
    <span class="h-10 w-10 rounded-lg bg-muted grid place-items-center shrink-0">
      <component :is="categoryIcon" :size="16" :style="{ color: categoryIconColor }" />
    </span>

    <!-- Info + dots -->
    <div class="flex-1 min-w-0">
      <p class="text-sm font-medium truncate text-foreground">{{ habit.name }}</p>
      <p class="text-[11px] text-muted-foreground mt-0.5">{{ habit.category ?? freqLabel }}</p>
      <div class="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
        <span>{{ freqLabel }}</span>
        <span v-if="habit.current_streak > 0" class="inline-flex items-center gap-1 tabular-nums">
          <Flame :size="12" style="color: hsl(var(--warning))" />{{ habit.current_streak }}
        </span>
      </div>
      <!-- Week dots -->
      <div class="flex items-center gap-1 mt-2">
        <div
          v-for="dot in weeklyDots"
          :key="dot.date"
          class="h-2 w-2 rounded-full"
          :class="dot.isLogged && !dot.isFuture ? 'bg-success' : 'bg-muted border border-border'"
        />
      </div>
    </div>

    <!-- Check button -->
    <button
      class="h-12 w-12 rounded-full grid place-items-center shrink-0 border-2 transition-colors"
      :class="doneToday ? 'bg-success border-success' : 'bg-transparent border-border hover:border-foreground/40'"
      :disabled="logging"
      @click.stop="handleLog"
    >
      <Loader2 v-if="logging" :size="18" class="animate-spin text-muted-foreground" />
      <Check
        v-else-if="doneToday"
        :size="24"
        :stroke-width="3"
        style="color: hsl(var(--background))"
      />
    </button>
  </div>

  <!-- ─── Desktop table row ───────────────────────────────────── -->
  <div
    class="hidden sm:flex group items-center gap-3 px-4 py-2.5 hover:bg-muted/40 transition-base cursor-pointer relative overflow-hidden"
    @click="emit('open', habit)"
  >
    <!-- Left border accent -->
    <div
      class="absolute left-0 top-0 bottom-0 w-[3px] shrink-0"
      :style="{ background: habit.color ?? 'hsl(var(--primary) / 0.6)' }"
    />

    <!-- Name + frequency as subtitle -->
    <div class="flex-1 min-w-0 pl-1">
      <p class="text-[14px] font-medium truncate text-foreground/90">
        {{ habit.name }}
      </p>
      <p class="text-[11px] mt-0.5 truncate text-muted-foreground">
        {{ habit.category ?? freqLabel }}
      </p>
    </div>

    <!-- Meta badge — colored per frequency -->
    <div class="hidden lg:flex items-center shrink-0 w-[88px]" @click.stop>
      <span
        class="text-[10px] font-medium px-1.5 py-0.5 rounded border"
        :style="badgeStyle"
      >
        {{ freqLabel }}
      </span>
    </div>

    <!-- Esta semana — 7 squares (desktop) -->
    <div class="hidden sm:flex items-end gap-[3px] shrink-0 w-[123px]" @click.stop>
      <div
        v-for="(dot, i) in weeklyDots"
        :key="dot.date"
        class="flex flex-col items-center gap-[2px]"
      >
        <div
          :class="[
            'h-[15px] w-[15px] rounded-sm transition-base',
            dot.isFuture ? 'bg-border/15' : dot.isLogged ? 'opacity-90' : 'bg-border/30',
          ]"
          :style="dot.isLogged && !dot.isFuture && habit.color ? `background: ${habit.color}` : undefined"
        />
        <span class="text-[8px] leading-none" style="color: hsl(var(--muted-foreground) / 0.25)">
          {{ ['S','T','Q','Q','S','S','D'][i] }}
        </span>
      </div>
    </div>

    <!-- Streak -->
    <div class="hidden md:flex items-center gap-1 shrink-0 min-w-[48px]" @click.stop>
      <span
        v-if="habit.current_streak > 0"
        class="inline-flex items-center gap-1 text-[12px] tabular-nums"
        style="color: hsl(var(--warning) / 0.75)"
      >
        <Flame :size="13" />{{ habit.current_streak }}
      </span>
      <span v-else class="text-[12px]" style="color: hsl(var(--muted-foreground) / 0.25)">—</span>
    </div>

    <!-- Check today — 24px, solid fill when done, semi-transparent border when not (Lovable) -->
    <div class="shrink-0" @click.stop>
      <button
        class="grid place-items-center h-6 w-6 rounded-md border transition-all active:scale-90"
        :style="doneToday
          ? `background: ${habit.color ?? 'hsl(var(--primary))'}; border-color: ${habit.color ?? 'hsl(var(--primary))'}`
          : 'background: transparent; border-color: hsl(var(--foreground) / 0.07)'"
        :disabled="logging"
        @click="handleLog"
      >
        <Loader2 v-if="logging" :size="11" class="animate-spin text-muted-foreground" />
        <Check
          v-else
          :size="11"
          :style="doneToday ? 'color: hsl(var(--background))' : 'color: transparent'"
        />
      </button>
    </div>

    <!-- Actions -->
    <div class="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" @click.stop>
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <Button variant="ghost" size="icon" class="h-7 w-7">
            <MoreHorizontal :size="13" />
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
</template>
