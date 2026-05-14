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
import { Check, Loader2, MoreHorizontal, Pencil, Archive, Trash2 } from 'lucide-vue-next'
import HabitWeekDots from './HabitWeekDots.vue'
import type { Habit } from '@/types/habits'
import { isCompletedToday } from '../utils/habitHelpers'
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
  <div
    class="group flex items-center gap-3 px-4 py-2.5 hover:bg-accent/20 transition-colors cursor-pointer"
    @click="emit('open', habit)"
  >
    <!-- Color dot -->
    <div
      class="h-2 w-2 rounded-full shrink-0"
      :style="{ background: habit.color }"
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
          'flex items-center justify-center h-7 w-7 rounded-md border transition-all',
          doneToday
            ? 'border-transparent'
            : 'border-border/50 hover:border-success/50 hover:bg-success/10',
        ]"
        :style="doneToday ? `background: ${habit.color}20; border-color: ${habit.color}50` : undefined"
        :disabled="logging"
        @click="handleLog"
      >
        <Loader2 v-if="logging" :size="12" class="animate-spin text-muted-foreground" />
        <Check
          v-else
          :size="12"
          :style="doneToday ? `color: ${habit.color}` : 'color: hsl(var(--muted-foreground) / 0.4)'"
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
