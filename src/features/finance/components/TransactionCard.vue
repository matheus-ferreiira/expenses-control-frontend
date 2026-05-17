<script setup lang="ts">
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@ui/dropdown-menu'
import { Button } from '@ui/button'
import { MoreHorizontal, Pencil, Trash2, ArrowUp, ArrowDown, ArrowLeftRight } from 'lucide-vue-next'
import type { Transaction } from '@/types/finance'
import { formatCurrency } from '@/utils/currency'
import { findIcon } from '@/lib/icons'

defineProps<{
  transaction: Transaction
}>()

const emit = defineEmits<{
  edit: [transaction: Transaction]
  delete: [id: string]
}>()

function sourceName(t: Transaction): string {
  if (t.account) return t.account.name
  if (t.card) return t.card.name
  return ''
}
</script>

<template>
  <div class="group flex items-center gap-3 pl-4 pr-4 py-3 hover:bg-accent/20 transition-colors">

    <!-- IconSwatch — 36px -->
    <span
      v-if="transaction.type !== 'transfer'"
      class="rounded-lg grid place-items-center shrink-0 w-9 h-9"
      :style="{
        background: transaction.category?.color ? transaction.category.color + '22' : (transaction.type === 'income' ? 'hsl(var(--success) / 0.13)' : 'hsl(var(--destructive) / 0.13)'),
        color: transaction.category?.color ?? (transaction.type === 'income' ? 'hsl(var(--success))' : 'hsl(var(--destructive))'),
      }"
    >
      <component
        v-if="transaction.category?.icon && findIcon(transaction.category.icon)"
        :is="findIcon(transaction.category.icon)!.component"
        :size="20"
        :stroke-width="1.9"
      />
      <span v-else class="text-xs font-bold">
        {{ transaction.description.charAt(0).toUpperCase() }}
      </span>
    </span>
    <span
      v-else
      class="rounded-lg grid place-items-center shrink-0 w-9 h-9 text-muted-foreground"
      style="background: hsl(var(--muted) / 0.6)"
    >
      <ArrowLeftRight :size="16" :stroke-width="1.9" />
    </span>

    <!-- Description + subtitle -->
    <div class="flex-1 min-w-0">
      <p class="text-sm truncate text-foreground">
        {{ transaction.description }}
      </p>
      <p class="text-[11px] text-muted-foreground truncate">
        <template v-if="transaction.category">{{ transaction.category.name }}</template>
        <template v-else>—</template>
        <template v-if="sourceName(transaction)"> · {{ sourceName(transaction) }}</template>
      </p>
    </div>

    <!-- Type badge (hidden on mobile) -->
    <span
      v-if="transaction.type !== 'transfer'"
      class="hidden sm:inline-flex items-center h-5 px-1.5 rounded text-[10px] font-medium border shrink-0"
      :class="transaction.type === 'income'
        ? 'bg-success/10 text-success border-success/30'
        : 'bg-destructive/10 text-destructive border-destructive/30'"
    >
      {{ transaction.type === 'income' ? 'Receita' : 'Despesa' }}
    </span>

    <!-- Amount with arrow icon -->
    <span
      class="inline-flex items-center gap-0.5 text-sm tabular-nums font-medium shrink-0"
      :class="transaction.type === 'income' ? 'text-success' : transaction.type === 'expense' ? 'text-destructive' : 'text-muted-foreground'"
    >
      <ArrowUp v-if="transaction.type === 'income'" :size="12" />
      <ArrowDown v-else-if="transaction.type === 'expense'" :size="12" />
      {{ formatCurrency(transaction.amount) }}
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
