<script setup lang="ts">
import { ArrowUp, ArrowDown, ArrowLeftRight, Clock } from 'lucide-vue-next'
import type { Transaction } from '@/types/finance'
import { formatCurrency } from '@/utils/currency'
import { findIcon } from '@/lib/icons'

defineProps<{
  transaction: Transaction
}>()

const emit = defineEmits<{
  select: [transaction: Transaction]
}>()
</script>

<template>
  <button
    type="button"
    class="w-full text-left group flex items-center gap-3 pl-4 pr-4 py-3 hover:bg-accent/20 active:bg-accent/30 transition-colors cursor-pointer"
    :class="transaction.status === 'pending' ? 'opacity-60' : ''"
    @click="emit('select', transaction)"
  >

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

    <!-- Description + subtitle + tags -->
    <div class="flex-1 min-w-0">
      <p class="text-sm truncate text-foreground">
        {{ transaction.description }}
      </p>
      <p class="text-[11px] text-muted-foreground truncate">
        <template v-if="transaction.category">{{ transaction.category.name }}</template>
        <template v-else>—</template>
        <template v-if="transaction.account"> · {{ transaction.account.name }}</template>
        <template v-else-if="transaction.card"> · {{ transaction.card.name }}</template>
      </p>
      <!-- Tag chips -->
      <div v-if="transaction.tags && transaction.tags.length > 0" class="flex flex-wrap gap-1 mt-0.5">
        <span
          v-for="tag in transaction.tags.slice(0, 3)"
          :key="tag.id"
          class="inline-flex items-center h-4 px-1.5 rounded-full text-[9px] font-medium text-white"
          :style="{ background: tag.color }"
        >
          {{ tag.name }}
        </span>
        <span
          v-if="transaction.tags.length > 3"
          class="inline-flex items-center h-4 px-1.5 rounded-full text-[9px] font-medium bg-muted text-muted-foreground"
        >
          +{{ transaction.tags.length - 3 }}
        </span>
      </div>
    </div>

    <!-- Status badge — "Agendada" for pending, type badge for confirmed -->
    <template v-if="transaction.status === 'pending'">
      <span class="inline-flex items-center gap-1 h-5 px-1.5 rounded text-[10px] font-medium border shrink-0 bg-muted/40 text-muted-foreground border-border/60">
        <Clock :size="9" :stroke-width="2" />
        Agendada
      </span>
    </template>
    <template v-else-if="transaction.type !== 'transfer'">
      <span
        class="inline-flex items-center h-5 px-1.5 rounded text-[10px] font-medium border shrink-0"
        :class="transaction.type === 'income'
          ? 'bg-success/10 text-success border-success/30'
          : 'bg-destructive/10 text-destructive border-destructive/30'"
      >
        {{ transaction.type === 'income' ? 'Receita' : 'Despesa' }}
      </span>
    </template>

    <!-- Amount with arrow icon -->
    <span
      class="inline-flex items-center gap-0.5 text-sm tabular-nums font-medium shrink-0"
      :class="transaction.type === 'income' ? 'text-success' : transaction.type === 'expense' ? 'text-destructive' : 'text-muted-foreground'"
    >
      <ArrowUp v-if="transaction.type === 'income'" :size="12" />
      <ArrowDown v-else-if="transaction.type === 'expense'" :size="12" />
      {{ formatCurrency(transaction.amount) }}
    </span>

  </button>
</template>
