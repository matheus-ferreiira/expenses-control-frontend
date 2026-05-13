<script setup lang="ts">
import { Button } from '@ui/button'
import { Input } from '@ui/input'
import { Plus, Search } from 'lucide-vue-next'
import TransactionFilters from './TransactionFilters.vue'
import type { useTransactionFilters } from '../composables/useTransactionFilters'

defineProps<{
  filterState: ReturnType<typeof useTransactionFilters>
  search: string
  loading?: boolean
}>()

const emit = defineEmits<{
  create: []
  'update:search': [value: string]
}>()
</script>

<template>
  <div class="flex items-center gap-2">
    <!-- Search -->
    <div class="relative flex-1 max-w-xs">
      <Search :size="14" class="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
      <Input
        :value="search"
        placeholder="Buscar transação..."
        class="h-8 pl-8 text-sm"
        @input="emit('update:search', ($event.target as HTMLInputElement).value)"
      />
    </div>

    <!-- Filters -->
    <TransactionFilters :filter-state="filterState" />

    <div class="flex-1" />

    <!-- Create -->
    <Button size="sm" class="h-8 gap-1.5" :disabled="loading" @click="emit('create')">
      <Plus :size="14" />
      Nova transação
    </Button>
  </div>
</template>
