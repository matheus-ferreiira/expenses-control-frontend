<script setup lang="ts">
import { Button } from '@ui/button'
import { Input } from '@ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@ui/dropdown-menu'
import {
  Plus,
  Search,
  LayoutList,
  LayoutGrid,
  ArrowUpDown,
  CalendarDays,
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
  { label: 'Ordem manual',   icon: ArrowUpDown,   field: 'order',      direction: 'asc'  },
  { label: 'Prioridade',     icon: AlertCircle,   field: 'priority',   direction: 'asc'  },
  { label: 'Data de entrega',icon: CalendarDays,  field: 'due_date',   direction: 'asc'  },
  { label: 'Mais recentes',  icon: Clock,         field: 'created_at', direction: 'desc' },
  { label: 'Título A→Z',    icon: ArrowDownAZ,   field: 'title',      direction: 'asc'  },
]
</script>

<template>
  <div class="flex items-center gap-2 flex-wrap">
    <!-- Search -->
    <div class="relative flex-1 min-w-[180px] max-w-xs">
      <Search class="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" :size="14" />
      <Input
        :value="search"
        placeholder="Buscar tarefas..."
        class="pl-8 h-8 text-sm"
        @input="emit('update:search', ($event.target as HTMLInputElement).value)"
      />
    </div>

    <!-- Filters popover -->
    <TaskFilters :filter-state="filterState" :labels="labels" />

    <!-- Sort dropdown -->
    <DropdownMenu>
      <DropdownMenuTrigger as-child>
        <Button variant="outline" size="sm" class="h-8 gap-1.5">
          <ArrowUpDown :size="14" />
          Ordenar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" class="w-48">
        <DropdownMenuItem
          v-for="opt in sortOptions"
          :key="opt.field"
          @click="emit('sort', opt.field, opt.direction)"
        >
          <component :is="opt.icon" :size="13" class="mr-2 text-muted-foreground" />
          {{ opt.label }}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>

    <!-- View toggle -->
    <div class="flex items-center rounded-md border border-border overflow-hidden">
      <Button
        variant="ghost"
        size="icon"
        :class="['h-8 w-8 rounded-none', viewMode === 'list' && 'bg-accent']"
        @click="emit('update:viewMode', 'list')"
      >
        <LayoutList :size="15" />
      </Button>
      <DropdownMenuSeparator class="h-5 w-px m-0 bg-border" />
      <Button
        variant="ghost"
        size="icon"
        :class="['h-8 w-8 rounded-none', viewMode === 'kanban' && 'bg-accent']"
        @click="emit('update:viewMode', 'kanban')"
      >
        <LayoutGrid :size="15" />
      </Button>
    </div>

    <!-- New task -->
    <Button size="sm" class="h-8 gap-1.5" @click="emit('create')">
      <Plus :size="14" />
      Nova tarefa
    </Button>
  </div>
</template>
