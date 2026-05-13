<script setup lang="ts">
import { Button } from '@ui/button'
import { Input } from '@ui/input'
import { Plus, Search, LayoutGrid, LayoutList } from 'lucide-vue-next'
import { DropdownMenuSeparator } from '@ui/dropdown-menu'
import HabitFilters from './HabitFilters.vue'
import type { useHabitFilters } from '../composables/useHabitFilters'
import type { ViewMode } from '../types'

defineProps<{
  filterState: ReturnType<typeof useHabitFilters>
  search: string
  viewMode: ViewMode
  loading?: boolean
}>()

const emit = defineEmits<{
  create: []
  'update:viewMode': [mode: ViewMode]
  'update:search': [value: string]
}>()
</script>

<template>
  <div class="flex items-center gap-2 flex-wrap">
    <!-- Search -->
    <div class="relative flex-1 min-w-[180px] max-w-xs">
      <Search class="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" :size="14" />
      <Input
        :value="search"
        placeholder="Buscar hábitos..."
        class="pl-8 h-8 text-sm"
        @input="emit('update:search', ($event.target as HTMLInputElement).value)"
      />
    </div>

    <!-- Filters -->
    <HabitFilters :filter-state="filterState" />

    <!-- View toggle -->
    <div class="flex items-center rounded-md border border-border overflow-hidden">
      <Button
        variant="ghost"
        size="icon"
        :class="['h-8 w-8 rounded-none', viewMode === 'grid' && 'bg-accent']"
        @click="emit('update:viewMode', 'grid')"
      >
        <LayoutGrid :size="15" />
      </Button>
      <DropdownMenuSeparator class="h-5 w-px m-0 bg-border" />
      <Button
        variant="ghost"
        size="icon"
        :class="['h-8 w-8 rounded-none', viewMode === 'list' && 'bg-accent']"
        @click="emit('update:viewMode', 'list')"
      >
        <LayoutList :size="15" />
      </Button>
    </div>

    <!-- New habit -->
    <Button size="sm" class="h-8 gap-1.5" @click="emit('create')">
      <Plus :size="14" />
      Novo hábito
    </Button>
  </div>
</template>
