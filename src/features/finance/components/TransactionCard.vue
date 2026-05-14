<script setup lang="ts">
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@ui/dropdown-menu'
import { Button } from '@ui/button'
import { MoreHorizontal, Pencil, Trash2, ArrowLeftRight } from 'lucide-vue-next'
import type { Transaction } from '@/types/finance'
import { formatCurrency } from '@/utils/currency'
import { transactionAmountClass, transactionAmountPrefix } from '../utils/financeHelpers'
import CategoryBadge from './CategoryBadge.vue'

defineProps<{
  transaction: Transaction
}>()

const emit = defineEmits<{
  edit: [transaction: Transaction]
  delete: [id: string]
}>()

function sourceName(t: Transaction): string {
  if (t.account) return t.account.name
  if (t.credit_card) return t.credit_card.name
  return ''
}
</script>

<template>
  <div class="group flex items-center gap-3 px-4 py-2.5 hover:bg-accent/20 transition-base">

    <!-- Dot indicator — 8px, no background circle -->
    <div class="shrink-0 flex items-center justify-center w-5">
      <span
        v-if="transaction.type === 'transfer'"
        class="text-muted-foreground/40"
      >
        <ArrowLeftRight :size="11" />
      </span>
      <span
        v-else
        class="h-2 w-2 rounded-full"
        :style="transaction.category
          ? { backgroundColor: transaction.category.color }
          : transaction.type === 'income'
            ? { backgroundColor: 'hsl(var(--success))' }
            : { backgroundColor: 'hsl(var(--destructive) / 0.7)' }
        "
      />
    </div>

    <!-- Description + meta -->
    <div class="flex-1 min-w-0">
      <p class="text-[13px] font-medium text-foreground/90 truncate leading-none mb-0.5">
        {{ transaction.description }}
      </p>
      <div class="flex items-center gap-2">
        <CategoryBadge v-if="transaction.category" :category="transaction.category" size="xs" />
        <span
          v-if="sourceName(transaction)"
          class="text-[10px] text-muted-foreground/40"
        >
          {{ sourceName(transaction) }}
        </span>
      </div>
    </div>

    <!-- Amount -->
    <span
      :class="[
        'shrink-0 text-[13px] font-medium tabular-nums',
        transactionAmountClass(transaction.type),
      ]"
    >
      {{ transactionAmountPrefix(transaction.type) }}{{ formatCurrency(transaction.amount) }}
    </span>

    <!-- Menu (appears on hover) -->
    <div class="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" @click.stop>
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <Button variant="ghost" size="icon" class="h-6 w-6">
            <MoreHorizontal :size="13" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" class="w-32">
          <DropdownMenuItem @click="emit('edit', transaction)">
            <Pencil :size="12" class="mr-2" />
            Editar
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            class="text-destructive focus:text-destructive"
            @click="emit('delete', transaction.id)"
          >
            <Trash2 :size="12" class="mr-2" />
            Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>

  </div>
</template>
