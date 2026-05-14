<script setup lang="ts">
import { Button } from '@ui/button'
import { Flame, Plus } from 'lucide-vue-next'
import HabitRow from '../components/HabitRow.vue'
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
</script>

<template>
  <!-- Loading skeleton -->
  <div
    v-if="loading"
    class="rounded-lg border border-border overflow-hidden divide-y divide-border/40"
  >
    <div v-for="i in 5" :key="i" class="flex items-center gap-3 px-4 py-2.5">
      <div class="h-2 w-2 rounded-full bg-muted animate-pulse shrink-0" />
      <div class="flex-1 space-y-1.5">
        <div class="h-3 w-1/3 rounded bg-muted animate-pulse" />
        <div class="h-2.5 w-1/6 rounded bg-muted animate-pulse" />
      </div>
      <div class="hidden sm:flex gap-[3px]">
        <div v-for="j in 7" :key="j" class="h-[7px] w-[7px] rounded-full bg-muted animate-pulse" />
      </div>
      <div class="h-7 w-7 rounded-md bg-muted animate-pulse" />
    </div>
  </div>

  <!-- Empty state -->
  <div
    v-else-if="habits.length === 0"
    class="flex flex-col items-center justify-center py-16 gap-3"
  >
    <div class="flex items-center justify-center h-10 w-10 rounded-full bg-muted/40">
      <Flame :size="18" style="color: hsl(var(--muted-foreground) / 0.4)" />
    </div>
    <p class="text-[13px] font-medium text-muted-foreground/60">Nenhum hábito encontrado</p>
    <p class="text-[12px] text-muted-foreground/35">Crie seu primeiro hábito e construa consistência.</p>
    <Button size="sm" class="mt-1 h-8 text-[12px]" @click="emit('create')">
      <Plus :size="12" class="mr-1.5" />
      Novo hábito
    </Button>
  </div>

  <!-- Table -->
  <div v-else class="rounded-lg border border-border overflow-hidden">
    <!-- Column headers -->
    <div class="flex items-center gap-3 px-4 py-2 border-b border-border/40">
      <div class="w-2 shrink-0" />
      <div class="flex-1 min-w-0">
        <span class="text-[9px] font-semibold uppercase tracking-[0.1em]" style="color: hsl(var(--muted-foreground) / 0.35)">
          Hábito
        </span>
      </div>
      <div class="hidden sm:block shrink-0 w-[67px]">
        <span class="text-[9px] font-semibold uppercase tracking-[0.1em]" style="color: hsl(var(--muted-foreground) / 0.35)">
          Esta semana
        </span>
      </div>
      <div class="hidden md:block shrink-0 min-w-[48px]">
        <span class="text-[9px] font-semibold uppercase tracking-[0.1em]" style="color: hsl(var(--muted-foreground) / 0.35)">
          Streak
        </span>
      </div>
      <div class="shrink-0 w-7">
        <span class="text-[9px] font-semibold uppercase tracking-[0.1em]" style="color: hsl(var(--muted-foreground) / 0.35)">
          Hoje
        </span>
      </div>
      <!-- Actions column spacer -->
      <div class="shrink-0 w-7" />
    </div>

    <!-- Rows -->
    <div class="divide-y divide-border/30">
      <HabitRow
        v-for="habit in habits"
        :key="habit.id"
        :habit="habit"
        @log="emit('log', $event)"
        @edit="emit('edit', $event)"
        @delete="emit('delete', $event)"
        @archive="emit('archive', $event)"
        @open="emit('open', $event)"
      />
    </div>
  </div>
</template>
