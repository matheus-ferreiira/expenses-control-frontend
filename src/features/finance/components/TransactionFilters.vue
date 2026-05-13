<script setup lang="ts">
import { computed } from 'vue'
import { Button } from '@ui/button'
import { Badge } from '@ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@ui/popover'
import { Separator } from '@ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@ui/select'
import { SlidersHorizontal, X } from 'lucide-vue-next'
import type { TransactionType } from '@/types/finance'
import { TRANSACTION_TYPE_LABELS } from '@/types/finance'
import { useFinanceStore } from '@/stores/finance'
import type { useTransactionFilters } from '../composables/useTransactionFilters'

const props = defineProps<{
  filterState: ReturnType<typeof useTransactionFilters>
}>()

const store = useFinanceStore()
const activeCount = computed(() => props.filterState.activeCount.value)

const transactionTypes: TransactionType[] = ['income', 'expense', 'transfer']

const TYPE_STYLE: Record<TransactionType, { text: string; bg: string }> = {
  income: { text: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  expense: { text: 'text-red-400', bg: 'bg-red-400/10' },
  transfer: { text: 'text-blue-400', bg: 'bg-blue-400/10' },
}

function toggleType(t: TransactionType) {
  props.filterState.setType(props.filterState.type.value === t ? undefined : t)
}
</script>

<template>
  <Popover>
    <PopoverTrigger as-child>
      <Button variant="outline" size="sm" class="h-8 gap-1.5 relative">
        <SlidersHorizontal :size="14" />
        Filtros
        <Badge
          v-if="activeCount > 0"
          class="absolute -top-1.5 -right-1.5 h-4 w-4 p-0 flex items-center justify-center text-[10px]"
        >
          {{ activeCount }}
        </Badge>
      </Button>
    </PopoverTrigger>

    <PopoverContent align="end" class="w-60 p-3 space-y-4">
      <!-- Type -->
      <div>
        <p class="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Tipo</p>
        <div class="flex gap-1.5 flex-wrap">
          <button
            v-for="t in transactionTypes"
            :key="t"
            :class="[
              'text-[11px] font-medium px-2 py-0.5 rounded-full border transition-colors',
              filterState.type.value === t
                ? [TYPE_STYLE[t].bg, TYPE_STYLE[t].text, 'border-transparent']
                : 'border-border text-muted-foreground hover:border-foreground/30',
            ]"
            @click="toggleType(t)"
          >
            {{ TRANSACTION_TYPE_LABELS[t] }}
          </button>
        </div>
      </div>

      <Separator />

      <!-- Category -->
      <div>
        <p class="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Categoria</p>
        <Select
          :model-value="filterState.category_id.value ?? ''"
          @update:model-value="filterState.setCategoryId(($event as string) || undefined)"
        >
          <SelectTrigger class="h-7 text-xs">
            <SelectValue placeholder="Todas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todas</SelectItem>
            <SelectItem
              v-for="cat in store.categories.filter(c => !filterState.type.value || c.type === filterState.type.value)"
              :key="cat.id"
              :value="cat.id"
            >
              {{ cat.name }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Separator />

      <!-- Account -->
      <div>
        <p class="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Conta</p>
        <Select
          :model-value="filterState.account_id.value ?? ''"
          @update:model-value="filterState.setAccountId(($event as string) || undefined)"
        >
          <SelectTrigger class="h-7 text-xs">
            <SelectValue placeholder="Todas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todas</SelectItem>
            <SelectItem
              v-for="acc in store.activeAccounts"
              :key="acc.id"
              :value="acc.id"
            >
              {{ acc.name }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <!-- Reset -->
      <template v-if="activeCount > 0">
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
