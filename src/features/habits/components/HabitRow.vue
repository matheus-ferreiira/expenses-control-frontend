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
import HabitWeekDots from './HabitWeekDots.vue'
import type { Habit } from '@/types/habits'
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
const DAY_LABELS = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D']

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
  <!-- Mobile card layout -->
  <div
    class="sm:hidden flex items-center gap-3 p-4 cursor-pointer"
    @click="emit('open', habit)"
  >
    <!-- Colored icon -->
    <div
      class="flex items-center justify-center h-10 w-10 rounded-xl shrink-0"
      :style="{ background: habit.color ? `${habit.color}25` : 'hsl(var(--accent))' }"
    >
      <Activity :size="18" :style="{ color: habit.color ?? 'hsl(var(--muted-foreground))' }" />
    </div>

    <!-- Info + weekly dots -->
    <div class="flex-1 min-w-0">
      <div class="flex items-center gap-2 mb-0.5">
        <p :class="['text-[14px] font-medium leading-tight truncate', doneToday ? 'text-foreground/50' : 'text-foreground/90']">
          {{ habit.name }}
        </p>
        <span v-if="habit.current_streak > 0" class="text-[11px] tabular-nums shrink-0" style="color: hsl(var(--warning) / 0.8)">
          🔥 {{ habit.current_streak }}
        </span>
      </div>
      <p class="text-[11px] text-muted-foreground/50 mb-2">{{ freqLabel }}</p>
      <!-- 7-day squares -->
      <div class="flex items-center gap-[3px]">
        <div
          v-for="(dot, i) in weeklyDots"
          :key="dot.date"
          class="flex flex-col items-center gap-[3px]"
        >
          <div
            :class="[
              'h-[14px] w-[14px] rounded-sm transition-base',
              dot.isFuture ? 'bg-border/15' : dot.isLogged ? 'opacity-90' : 'bg-border/30',
            ]"
            :style="dot.isLogged && !dot.isFuture && habit.color ? `background: ${habit.color}` : undefined"
          />
          <span class="text-[8px] text-muted-foreground/30 leading-none">{{ DAY_LABELS[i] }}</span>
        </div>
      </div>
    </div>

    <!-- Large check button -->
    <div class="shrink-0" @click.stop>
      <button
        :class="[
          'flex items-center justify-center h-12 w-12 rounded-full border-2 transition-all active:scale-90',
          doneToday ? 'border-transparent' : 'border-border/40 hover:border-success/60 hover:bg-success/10',
        ]"
        :style="doneToday && habit.color ? `background: ${habit.color}30; border-color: ${habit.color}80` : undefined"
        :disabled="logging"
        @click="handleLog"
      >
        <Loader2 v-if="logging" :size="18" class="animate-spin text-muted-foreground" />
        <Check
          v-else
          :size="18"
          :style="doneToday && habit.color ? `color: ${habit.color}` : 'color: hsl(var(--muted-foreground) / 0.3)'"
        />
      </button>
    </div>
  </div>

  <!-- Desktop table row -->
  <div
    class="hidden sm:flex group items-center gap-3 px-4 py-2.5 hover:bg-accent/20 transition-base cursor-pointer"
    @click="emit('open', habit)"
  >
    <!-- Color dot -->
    <div
      class="h-2 w-2 rounded-full shrink-0"
      :style="{ background: habit.color ?? undefined }"
    />

    <!-- Name + frequency -->
    <div class="flex-1 min-w-0">
      <p
        :class="[
          'text-[13px] font-medium truncate',
          doneToday ? 'text-foreground/50' : 'text-foreground/90',
        ]"
      >
        {{ habit.name }}
      </p>
      <p class="text-[11px] text-muted-foreground/40 mt-0.5">{{ freqLabel }}</p>
    </div>

    <!-- Weekly dots -->
    <div class="hidden sm:block shrink-0" @click.stop>
      <HabitWeekDots :habit="habit" />
    </div>

    <!-- Streak -->
    <div class="hidden md:flex items-center gap-1 shrink-0 min-w-[48px]" @click.stop>
      <span
        v-if="habit.current_streak > 0"
        class="text-[12px] tabular-nums"
        style="color: hsl(var(--warning) / 0.7)"
      >
        🔥 {{ habit.current_streak }}
      </span>
      <span
        v-else
        class="text-[12px]"
        style="color: hsl(var(--muted-foreground) / 0.3)"
      >
        —
      </span>
    </div>

    <!-- Check today -->
    <div class="shrink-0" @click.stop>
      <button
        :class="[
          'flex items-center justify-center h-7 w-7 rounded-full border transition-all active:scale-90',
          doneToday
            ? 'border-transparent'
            : 'border-border/50 hover:border-success/50 hover:bg-success/10',
        ]"
        :style="doneToday && habit.color ? `background: ${habit.color}20; border-color: ${habit.color}50` : undefined"
        :disabled="logging"
        @click="handleLog"
      >
        <Loader2 v-if="logging" :size="12" class="animate-spin text-muted-foreground" />
        <Check
          v-else
          :size="12"
          :style="doneToday && habit.color ? `color: ${habit.color}` : 'color: hsl(var(--muted-foreground) / 0.4)'"
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
