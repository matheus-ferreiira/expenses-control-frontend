<script setup lang="ts">
import { computed } from 'vue'
import { Button } from '@ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@ui/popover'
import { Separator } from '@ui/separator'
import { Badge } from '@ui/badge'
import { SlidersHorizontal, X } from 'lucide-vue-next'
import type { HabitFrequency } from '@/types/habits'
import { HABIT_FREQUENCY_LABELS } from '@/types/habits'
import { FREQUENCY_STYLE } from '../types'
import type { useHabitFilters } from '../composables/useHabitFilters'

const props = defineProps<{
  filterState: ReturnType<typeof useHabitFilters>
}>()

const frequencies: HabitFrequency[] = ['daily', 'weekly', 'monthly']

const activeFilters = computed(() => props.filterState.activeCount.value)

function toggleFrequency(f: HabitFrequency) {
  props.filterState.setFrequency(props.filterState.frequency.value === f ? undefined : f)
}
</script>

<template>
  <Popover>
    <PopoverTrigger as-child>
      <Button variant="outline" size="sm" class="h-8 gap-1.5 relative">
        <SlidersHorizontal :size="14" />
        Filtros
        <Badge
          v-if="activeFilters > 0"
          class="absolute -top-1.5 -right-1.5 h-4 w-4 p-0 flex items-center justify-center text-[10px]"
        >
          {{ activeFilters }}
        </Badge>
      </Button>
    </PopoverTrigger>

    <PopoverContent align="end" class="w-56 p-3 space-y-4">
      <!-- Frequency -->
      <div>
        <p class="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Frequência</p>
        <div class="flex flex-wrap gap-1.5">
          <button
            v-for="f in frequencies"
            :key="f"
            :class="[
              'text-[11px] font-medium px-2 py-0.5 rounded-full border transition-colors',
              filterState.frequency.value === f
                ? [FREQUENCY_STYLE[f].bg, FREQUENCY_STYLE[f].text, 'border-transparent']
                : 'border-border text-muted-foreground hover:border-foreground/30',
            ]"
            @click="toggleFrequency(f)"
          >
            {{ HABIT_FREQUENCY_LABELS[f] }}
          </button>
        </div>
      </div>

      <Separator />

      <!-- Archived toggle -->
      <div class="flex items-center justify-between">
        <span class="text-sm text-foreground">Mostrar arquivados</span>
        <button
          :class="[
            'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:outline-none',
            filterState.showArchived.value ? 'bg-primary' : 'bg-muted',
          ]"
          role="switch"
          :aria-checked="filterState.showArchived.value"
          @click="filterState.toggleArchived()"
        >
          <span
            :class="[
              'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition duration-200',
              filterState.showArchived.value ? 'translate-x-4' : 'translate-x-0',
            ]"
          />
        </button>
      </div>

      <!-- Reset -->
      <template v-if="activeFilters > 0">
        <Separator />
        <Button
          variant="ghost"
          size="sm"
          class="w-full h-7 text-xs text-muted-foreground"
          @click="filterState.reset()"
        >
          <X :size="12" class="mr-1.5" />
          Limpar filtros
        </Button>
      </template>
    </PopoverContent>
  </Popover>
</template>
