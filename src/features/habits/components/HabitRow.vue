<script setup lang="ts">
import { ref, computed } from 'vue'
import { Button } from '@ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@ui/dropdown-menu'
import { Check, Loader2, MoreHorizontal, Pencil, Archive, Trash2, Activity } from 'lucide-vue-next'
import type { Habit, HabitFrequency } from '@/types/habits'
import { isCompletedToday, getWeeklyDots } from '../utils/habitHelpers'
import { HABIT_FREQUENCY_LABELS } from '@/types/habits'

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
    class="sm:hidden flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-foreground/[0.03] transition-base"
    @click="emit('open', habit)"
  >
    <!-- Colored icon -->
    <div
      class="flex items-center justify-center h-10 w-10 rounded-xl shrink-0"
      :style="{ background: habit.color ? `${habit.color}20` : 'hsl(var(--accent) / 0.15)' }"
    >
      <Activity :size="18" :style="{ color: habit.color ?? 'hsl(var(--primary))' }" />
    </div>

    <!-- Info + dots -->
    <div class="flex-1 min-w-0">
      <div class="flex items-center gap-2 mb-0.5">
        <p :class="['text-[14px] font-medium leading-tight truncate', doneToday ? 'text-foreground/45' : 'text-foreground/90']">
          {{ habit.name }}
        </p>
      </div>
      <p class="text-[11px] text-muted-foreground/50 mb-2">
        {{ freqLabel }}
        <span v-if="habit.current_streak > 0" class="ml-2 tabular-nums" style="color: hsl(var(--warning) / 0.8)">
          🔥 {{ habit.current_streak }}
        </span>
      </p>
      <!-- Colored dots row (no labels) -->
      <div class="flex items-center gap-1">
        <div
          v-for="dot in weeklyDots"
          :key="dot.date"
          class="h-[7px] w-[7px] rounded-full transition-base"
          :style="
            dot.isFuture
              ? 'background: hsl(var(--border) / 0.4)'
              : dot.isLogged && habit.color
                ? `background: ${habit.color}`
                : dot.isLogged
                  ? 'background: hsl(var(--success) / 0.7)'
                  : 'background: hsl(var(--border) / 0.5)'
          "
        />
      </div>
    </div>

    <!-- Large check button -->
    <div class="shrink-0" @click.stop>
      <button
        :class="[
          'flex items-center justify-center h-11 w-11 rounded-full border-2 transition-all active:scale-90',
          doneToday ? 'border-transparent' : 'border-border/40 hover:border-success/60 hover:bg-success/10',
        ]"
        :style="doneToday ? `background: hsl(var(--success) / 0.2); border-color: hsl(var(--success) / 0.6)` : undefined"
        :disabled="logging"
        @click="handleLog"
      >
        <Loader2 v-if="logging" :size="18" class="animate-spin text-muted-foreground" />
        <Check
          v-else
          :size="18"
          :style="doneToday ? 'color: hsl(var(--success))' : 'color: hsl(var(--muted-foreground) / 0.3)'"
        />
      </button>
    </div>
  </div>

  <!-- ─── Desktop table row ───────────────────────────────────── -->
  <div
    class="hidden sm:flex group items-center gap-3 px-4 py-2.5 hover:bg-foreground/[0.025] transition-base cursor-pointer relative overflow-hidden"
    @click="emit('open', habit)"
  >
    <!-- Left border accent -->
    <div
      class="absolute left-0 top-0 bottom-0 w-[3px] shrink-0"
      :style="{ background: habit.color ?? 'hsl(var(--primary) / 0.6)' }"
    />

    <!-- Name + frequency as subtitle -->
    <div class="flex-1 min-w-0 pl-1">
      <p
        :class="[
          'text-[13px] font-medium truncate',
          doneToday ? 'line-through text-foreground/40' : 'text-foreground/90',
        ]"
      >
        {{ habit.name }}
      </p>
      <p class="text-[11px] mt-0.5 truncate" style="color: hsl(var(--muted-foreground) / 0.45)">
        {{ freqLabel }}
      </p>
    </div>

    <!-- Meta badge — colored per frequency -->
    <div class="hidden lg:flex items-center shrink-0 w-[88px]" @click.stop>
      <span
        class="text-[11px] px-2 py-0.5 rounded-full border"
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
        class="text-[12px] tabular-nums"
        style="color: hsl(var(--warning) / 0.75)"
      >
        🔥 {{ habit.current_streak }}
      </span>
      <span v-else class="text-[12px]" style="color: hsl(var(--muted-foreground) / 0.25)">—</span>
    </div>

    <!-- Check today — rounded square -->
    <div class="shrink-0" @click.stop>
      <button
        :class="[
          'flex items-center justify-center h-7 w-7 rounded-md border-2 transition-all active:scale-90',
          doneToday ? 'border-transparent' : 'border-border/50 hover:border-success/50 hover:bg-success/10',
        ]"
        :style="doneToday && habit.color
          ? `background: ${habit.color}30; border-color: ${habit.color}80`
          : doneToday
            ? 'background: hsl(var(--success) / 0.2); border-color: hsl(var(--success) / 0.6)'
            : undefined"
        :disabled="logging"
        @click="handleLog"
      >
        <Loader2 v-if="logging" :size="12" class="animate-spin text-muted-foreground" />
        <Check
          v-else
          :size="12"
          :style="doneToday && habit.color ? `color: ${habit.color}` : doneToday ? 'color: hsl(var(--success))' : 'color: hsl(var(--muted-foreground) / 0.35)'"
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
