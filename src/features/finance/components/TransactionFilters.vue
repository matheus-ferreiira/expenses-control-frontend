<script setup lang="ts">
import { computed } from 'vue'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@ui/select'
import { X } from 'lucide-vue-next'
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
  income:   { text: 'text-success',         bg: 'bg-success/10' },
  expense:  { text: 'text-destructive',      bg: 'bg-destructive/10' },
  transfer: { text: 'text-muted-foreground', bg: 'bg-muted' },
}

function toggleType(t: TransactionType) {
  props.filterState.setType(props.filterState.type.value === t ? undefined : t)
}
</script>

<template>
  <div class="flex items-center gap-1.5 flex-wrap">

    <!-- Tipo: chips de tipo -->
    <button
      v-for="t in transactionTypes"
      :key="t"
      type="button"
      class="h-7 px-3 rounded-full text-[11.5px] font-medium border transition-colors duration-150 whitespace-nowrap"
      :class="filterState.type.value === t
        ? [TYPE_STYLE[t].bg, TYPE_STYLE[t].text, 'border-transparent']
        : 'border-border text-muted-foreground hover:text-foreground hover:border-border/60'"
      @click="toggleType(t)"
    >
      {{ TRANSACTION_TYPE_LABELS[t] }}
    </button>

    <!-- Separador visual -->
    <span class="w-px h-4 bg-border mx-0.5 shrink-0" />

    <!-- Conta: Select compacto -->
    <Select
      :model-value="filterState.account_id.value ?? ''"
      @update:model-value="filterState.setAccountId(($event as string) || undefined)"
    >
      <SelectTrigger
        class="h-7 px-3 rounded-full text-[11.5px] border-border w-auto min-w-0 max-w-[140px]"
        :class="filterState.account_id.value ? 'border-primary/40 text-foreground' : 'text-muted-foreground'"
      >
        <SelectValue placeholder="Conta" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="">Todas as contas</SelectItem>
        <SelectItem
          v-for="acc in store.activeAccounts"
          :key="acc.id"
          :value="acc.id"
        >
          {{ acc.name }}
        </SelectItem>
      </SelectContent>
    </Select>

    <!-- Categoria: Select compacto -->
    <Select
      :model-value="filterState.category_id.value ?? ''"
      @update:model-value="filterState.setCategoryId(($event as string) || undefined)"
    >
      <SelectTrigger
        class="h-7 px-3 rounded-full text-[11.5px] border-border w-auto min-w-0 max-w-[140px]"
        :class="filterState.category_id.value ? 'border-primary/40 text-foreground' : 'text-muted-foreground'"
      >
        <SelectValue placeholder="Categoria" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="">Todas as categorias</SelectItem>
        <SelectItem
          v-for="cat in store.categories.filter(c => !filterState.type.value || c.type === filterState.type.value)"
          :key="cat.id"
          :value="cat.id"
        >
          {{ cat.name }}
        </SelectItem>
      </SelectContent>
    </Select>

    <!-- Limpar — só quando há filtro ativo -->
    <button
      v-if="activeCount > 0"
      type="button"
      class="h-7 px-2.5 rounded-full text-[11px] font-medium text-muted-foreground border border-border hover:text-foreground hover:border-border/60 transition-colors duration-150 flex items-center gap-1"
      @click="filterState.reset()"
    >
      <X :size="11" />
      Limpar
    </button>

  </div>
</template>
