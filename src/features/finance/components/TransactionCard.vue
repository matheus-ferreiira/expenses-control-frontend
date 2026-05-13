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
  <div class="group flex items-center gap-3 px-4 py-3 hover:bg-accent/30 transition-colors">
    <!-- Type/Category indicator -->
    <div class="shrink-0">
      <span
        v-if="transaction.category"
        class="flex h-7 w-7 items-center justify-center rounded-full"
        :style="{
          backgroundColor: transaction.category.color + '20',
        }"
      >
        <span
          class="h-2.5 w-2.5 rounded-full"
          :style="{ backgroundColor: transaction.category.color }"
        />
      </span>
      <span
        v-else-if="transaction.type === 'transfer'"
        class="flex h-7 w-7 items-center justify-center rounded-full bg-muted"
      >
        <ArrowLeftRight :size="12" class="text-muted-foreground" />
      </span>
      <span
        v-else
        class="flex h-7 w-7 items-center justify-center rounded-full"
        :class="
          transaction.type === 'income'
            ? 'bg-emerald-500/10'
            : 'bg-red-500/10'
        "
      >
        <span
          class="h-2.5 w-2.5 rounded-full"
          :class="
            transaction.type === 'income' ? 'bg-emerald-400' : 'bg-red-400'
          "
        />
      </span>
    </div>

    <!-- Description + source -->
    <div class="flex-1 min-w-0">
      <p class="text-sm font-medium text-foreground truncate">
        {{ transaction.description }}
      </p>
      <div class="flex items-center gap-1.5 mt-0.5 flex-wrap">
        <CategoryBadge v-if="transaction.category" :category="transaction.category" size="xs" />
        <span
          v-if="sourceName(transaction)"
          class="text-[10px] text-muted-foreground/60"
        >
          {{ transaction.category ? '·' : '' }} {{ sourceName(transaction) }}
        </span>
      </div>
    </div>

    <!-- Amount -->
    <span
      :class="[
        'shrink-0 text-sm font-semibold tabular-nums',
        transactionAmountClass(transaction.type),
      ]"
    >
      {{ transactionAmountPrefix(transaction.type) }}{{ formatCurrency(transaction.amount) }}
    </span>

    <!-- Menu -->
    <div class="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" @click.stop>
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <Button variant="ghost" size="icon" class="h-7 w-7">
            <MoreHorizontal :size="14" />
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
