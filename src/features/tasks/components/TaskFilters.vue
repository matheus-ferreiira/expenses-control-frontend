<script setup lang="ts">
import { computed } from 'vue'
import { Button } from '@ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@ui/popover'
import { Separator } from '@ui/separator'
import { SlidersHorizontal, X } from 'lucide-vue-next'
import type { TaskStatus, TaskPriority, TaskLabel } from '@/types/tasks'
import { TASK_STATUS_LABELS, TASK_PRIORITY_LABELS } from '@/types/tasks'
import { PRIORITY_STYLE, STATUS_STYLE } from '../types'
import type { useTaskFilters } from '../composables/useTaskFilters'

const props = defineProps<{
  filterState: ReturnType<typeof useTaskFilters>
  labels: TaskLabel[]
}>()

const statuses: TaskStatus[] = ['pending', 'in_progress', 'completed', 'cancelled']
const priorities: TaskPriority[] = ['urgent', 'high', 'normal', 'low']

const activeFilters = computed(() => props.filterState.activeCount.value)

function toggleStatus(status: TaskStatus) {
  const current = props.filterState.filters.value.status
  props.filterState.setStatus(current === status ? undefined : status)
}

function togglePriority(priority: TaskPriority) {
  const current = props.filterState.filters.value.priority
  props.filterState.setPriority(current === priority ? undefined : priority)
}
</script>

<template>
  <Popover>
    <PopoverTrigger as-child>
      <button
        class="relative flex items-center gap-1.5 h-8 px-2.5 rounded-md  text-[12px] transition-base"
        :style="
          activeFilters > 0
            ? 'border-color: hsl(var(--primary) / 0.4); color: hsl(var(--primary) / 0.8)'
            : 'border-color: hsl(var(--border) / 0.5); color: hsl(var(--muted-foreground) / 0.6)'
        "
        @mouseenter="(e) => { if (!activeFilters) (e.currentTarget as HTMLElement).style.color = 'hsl(var(--foreground))' }"
        @mouseleave="(e) => { if (!activeFilters) (e.currentTarget as HTMLElement).style.color = 'hsl(var(--muted-foreground) / 0.6)' }"
      >
        <SlidersHorizontal :size="12" />
        Filtros
        <span
          v-if="activeFilters > 0"
          class="ml-0.5 text-[10px] font-semibold tabular-nums"
        >
          {{ activeFilters }}
        </span>
      </button>
    </PopoverTrigger>

    <PopoverContent align="end" class="w-64 p-3 space-y-4">
      <!-- Status -->
      <div>
        <p class="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Status</p>
        <div class="flex flex-wrap gap-1.5">
          <button
            v-for="s in statuses"
            :key="s"
            :class="[
              'text-[11px] font-medium px-2 py-0.5 rounded-full  transition-base',
              filterState.filters.value.status === s
                ? [STATUS_STYLE[s].bg, STATUS_STYLE[s].text, '']
                : 'border-border text-muted-foreground ',
            ]"
            @click="toggleStatus(s)"
          >
            {{ TASK_STATUS_LABELS[s] }}
          </button>
        </div>
      </div>

      <Separator />

      <!-- Priority -->
      <div>
        <p class="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Prioridade</p>
        <div class="flex flex-wrap gap-1.5">
          <button
            v-for="p in priorities"
            :key="p"
            :class="[
              'text-[11px] font-medium px-2 py-0.5 rounded-full  transition-base',
              filterState.filters.value.priority === p
                ? [PRIORITY_STYLE[p].bg, PRIORITY_STYLE[p].text, '']
                : 'border-border text-muted-foreground ',
            ]"
            @click="togglePriority(p)"
          >
            {{ TASK_PRIORITY_LABELS[p] }}
          </button>
        </div>
      </div>

      <!-- Labels -->
      <template v-if="labels.length > 0">
        <Separator />
        <div>
          <p class="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Label</p>
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="label in labels"
              :key="label.id"
              :class="[
                'inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full  transition-base',
                filterState.filters.value.label_id === label.id
                  ? 'bg-muted text-primary'
                  : 'border-border text-muted-foreground ',
              ]"
              @click="filterState.setLabel(filterState.filters.value.label_id === label.id ? undefined : label.id)"
            >
              <span class="w-1.5 h-1.5 rounded-full" :style="{ backgroundColor: label.color }" />
              {{ label.name }}
            </button>
          </div>
        </div>
      </template>

      <!-- Reset -->
      <Separator v-if="activeFilters > 0" />
      <Button
        v-if="activeFilters > 0"
        variant="ghost"
        size="sm"
        class="w-full h-7 text-xs text-muted-foreground"
        @click="filterState.reset()"
      >
        <X :size="12" class="mr-1.5" />
        Limpar filtros
      </Button>
    </PopoverContent>
  </Popover>
</template>
