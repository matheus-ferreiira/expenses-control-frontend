<script setup lang="ts">
import { Input } from '@ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@ui/dropdown-menu'
import {
  Search,
  LayoutList,
  Columns3,
  CalendarDays,
  ArrowUpDown,
  AlertCircle,
  Clock,
  ArrowDownAZ,
} from 'lucide-vue-next'
import TaskFilters from './TaskFilters.vue'
import type { TaskLabel } from '@/types/tasks'
import type { useTaskFilters } from '../composables/useTaskFilters'
import type { SortField, SortDirection } from '../utils/taskHelpers'
import type { ViewMode } from '../types'

defineProps<{
  filterState: ReturnType<typeof useTaskFilters>
  search: string
  labels: TaskLabel[]
  viewMode: ViewMode
  loading?: boolean
}>()

const emit = defineEmits<{
  create: []
  'update:viewMode': [mode: ViewMode]
  'update:search': [value: string]
  sort: [field: SortField, direction: SortDirection]
}>()

interface SortOption {
  label: string
  icon: typeof CalendarDays
  field: SortField
  direction: SortDirection
}

const sortOptions: SortOption[] = [
  { label: 'Ordem manual',    icon: ArrowUpDown,  field: 'order',      direction: 'asc'  },
  { label: 'Prioridade',      icon: AlertCircle,  field: 'priority',   direction: 'asc'  },
  { label: 'Data de entrega', icon: CalendarDays, field: 'due_date',   direction: 'asc'  },
  { label: 'Mais recentes',   icon: Clock,        field: 'created_at', direction: 'desc' },
  { label: 'Título A→Z',     icon: ArrowDownAZ,  field: 'title',      direction: 'asc'  },
]
</script>

<template>
  <div class="flex items-center gap-1.5">
    <!-- Search -->
    <div class="relative flex-1 min-w-[160px] max-w-[240px]">
      <Search
        class="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/40 pointer-events-none"
        :size="13"
      />
      <Input
        :value="search"
        placeholder="Buscar tarefas..."
        class="pl-8 h-8 text-[12.5px] border-border/50 bg-transparent placeholder:text-muted-foreground/35"
        @input="emit('update:search', ($event.target as HTMLInputElement).value)"
      />
    </div>

    <!-- Filters -->
    <TaskFilters :filter-state="filterState" :labels="labels" />

    <!-- Sort dropdown -->
    <DropdownMenu>
      <DropdownMenuTrigger as-child>
        <button
          class="flex items-center gap-1.5 h-8 px-2.5 rounded-md border text-[12px] transition-base"
          style="border-color: hsl(var(--border) / 0.5); color: hsl(var(--muted-foreground) / 0.6)"
          @mouseenter="($event.currentTarget as HTMLElement).style.color = 'hsl(var(--foreground))'"
          @mouseleave="($event.currentTarget as HTMLElement).style.color = 'hsl(var(--muted-foreground) / 0.6)'"
        >
          <ArrowUpDown :size="12" />
          Ordenar
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" class="w-48">
        <DropdownMenuItem
          v-for="opt in sortOptions"
          :key="opt.field"
          class="text-[12px]"
          @click="emit('sort', opt.field, opt.direction)"
        >
          <component :is="opt.icon" :size="12" class="mr-2 text-muted-foreground/50" />
          {{ opt.label }}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>

    <!-- Spacer -->
    <div class="flex-1" />

    <!-- View toggle -->
    <div
      class="flex items-center rounded-md overflow-hidden"
      style="border: 1px solid hsl(var(--border) / 0.5)"
    >
      <button
        v-for="(view, i) in [
          { mode: 'list' as ViewMode, icon: LayoutList },
          { mode: 'kanban' as ViewMode, icon: Columns3 },
          { mode: 'calendar' as ViewMode, icon: CalendarDays },
        ]"
        :key="view.mode"
        class="flex items-center justify-center h-8 w-8 transition-base"
        :class="i > 0 ? 'border-l' : ''"
        :style="[
          i > 0 ? 'border-color: hsl(var(--border) / 0.5);' : '',
          viewMode === view.mode
            ? 'background: hsl(var(--accent)); color: hsl(var(--foreground))'
            : 'color: hsl(var(--muted-foreground) / 0.45)',
        ]"
        @click="emit('update:viewMode', view.mode)"
        @mouseenter="(e) => { if (viewMode !== view.mode) (e.currentTarget as HTMLElement).style.color = 'hsl(var(--foreground))' }"
        @mouseleave="(e) => { if (viewMode !== view.mode) (e.currentTarget as HTMLElement).style.color = 'hsl(var(--muted-foreground) / 0.45)' }"
      >
        <component :is="view.icon" :size="14" />
      </button>
    </div>
  </div>
</template>
