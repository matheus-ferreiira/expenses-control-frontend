<script setup lang="ts">
import { computed } from 'vue'
import { Button } from '@ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@ui/dropdown-menu'
import { Check, MoreHorizontal, Pencil, Archive, Trash2, Loader2 } from 'lucide-vue-next'
import HabitFrequencyBadge from './HabitFrequencyBadge.vue'
import HabitStreakBadge from './HabitStreakBadge.vue'
import type { Habit } from '@/types/habits'
import { isCompletedToday, getWeeklyDots } from '../utils/habitHelpers'

const props = defineProps<{
  habit: Habit
  logging?: boolean
}>()

const emit = defineEmits<{
  log: [id: string]
  edit: [habit: Habit]
  delete: [id: string]
  archive: [id: string]
  open: [habit: Habit]
}>()

const completed = computed(() => isCompletedToday(props.habit))
const dots = computed(() => getWeeklyDots(props.habit))
const isArchived = computed(() => !props.habit.is_active)
</script>

<template>
  <div
    :class="[
      'group relative rounded-lg border border-border bg-card overflow-hidden cursor-pointer hover:border-border/70 hover:bg-accent/10 transition-all duration-200',
      isArchived && 'opacity-60',
    ]"
    @click="emit('open', habit)"
  >
    <!-- Color accent bar -->
    <div
      class="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg"
      :style="{ backgroundColor: habit.color ?? undefined }"
    />

    <div class="pl-4 pr-3 py-3">
      <!-- Header row -->
      <div class="flex items-start justify-between gap-2">
        <div class="flex-1 min-w-0">
          <p class="text-sm font-semibold text-foreground leading-snug truncate">
            {{ habit.name }}
          </p>
          <p v-if="habit.description" class="text-[11px] text-muted-foreground mt-0.5 truncate">
            {{ habit.description }}
          </p>
        </div>

        <!-- Quick log button -->
        <div class="flex items-center gap-1 shrink-0" @click.stop>
          <Button
            :variant="completed ? 'default' : 'outline'"
            size="icon"
            :class="[
              'h-7 w-7 transition-all',
              completed
                ? 'bg-emerald-500 hover:bg-emerald-600 border-emerald-500 text-white'
                : 'hover:border-emerald-500/50 hover:text-emerald-400',
            ]"
            :disabled="logging || isArchived"
            @click="emit('log', habit.id)"
          >
            <Loader2 v-if="logging" :size="13" class="animate-spin" />
            <Check v-else :size="13" />
          </Button>
        </div>
      </div>

      <!-- Meta row -->
      <div class="flex items-center gap-2 mt-2">
        <HabitFrequencyBadge :frequency="habit.frequency" />
        <HabitStreakBadge :streak="habit.current_streak" />
      </div>

      <!-- Weekly dots -->
      <div class="flex items-center gap-1 mt-3">
        <div
          v-for="dot in dots"
          :key="dot.date"
          :title="dot.dayLabel"
          :class="[
            'flex-1 h-1.5 rounded-full transition-all',
            dot.isFuture
              ? 'bg-muted/30'
              : dot.isLogged
                ? 'bg-emerald-500'
                : dot.isTarget
                  ? 'bg-muted-foreground/20'
                  : 'bg-muted/20',
            dot.isToday && !dot.isLogged && dot.isTarget && 'ring-1 ring-primary/50',
          ]"
        />
      </div>

      <!-- Day labels -->
      <div class="flex items-center gap-1 mt-1">
        <span
          v-for="dot in dots"
          :key="dot.date"
          :class="[
            'flex-1 text-center text-[9px] font-medium',
            dot.isToday ? 'text-primary' : 'text-muted-foreground/40',
          ]"
        >
          {{ dot.dayLabel.charAt(0) }}
        </span>
      </div>
    </div>

    <!-- Actions dropdown -->
    <div
      class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
      @click.stop
    >
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <Button variant="ghost" size="icon" class="h-6 w-6">
            <MoreHorizontal :size="13" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" class="w-36">
          <DropdownMenuItem @click="emit('edit', habit)">
            <Pencil :size="12" class="mr-2" />
            Editar
          </DropdownMenuItem>
          <DropdownMenuItem v-if="!isArchived" @click="emit('archive', habit.id)">
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
