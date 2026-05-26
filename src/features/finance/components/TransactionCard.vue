<script setup lang="ts">
import { computed } from 'vue'
import { ArrowUp, ArrowDown, ArrowLeftRight, Clock, Repeat2 } from 'lucide-vue-next'
import type { Transaction } from '@/types/finance'
import { formatCurrency } from '@/utils/currency'
import { findIcon } from '@/lib/icons'

const props = defineProps<{
  transaction: Transaction
}>()

const emit = defineEmits<{
  select: [transaction: Transaction]
}>()

/** Left accent bar color: category color > type color fallback */
const accentColor = computed(() => {
  if (props.transaction.category?.color) return props.transaction.category.color
  if (props.transaction.type === 'income') return 'hsl(var(--success))'
  if (props.transaction.type === 'expense') return 'hsl(var(--destructive))'
  return 'hsl(var(--muted-foreground) / 0.4)'
})
</script>

<template>
  <button
    type="button"
    class="w-full text-left group relative flex items-center gap-3 pl-4 pr-4 py-3 hover:bg-accent/20 active:bg-accent/30 transition-colors cursor-pointer"
    :class="transaction.status === 'pending' ? 'opacity-60' : ''"
    @click="emit('select', transaction)"
  >

    <!-- ── Left color accent bar ─────────────────────────────────── -->
    <span
      class="absolute inset-y-2 left-0 w-[3px] rounded-r-full"
      :style="{ background: accentColor }"
    />

    <!-- ── Category icon swatch — 36px ──────────────────────────── -->
    <span
      v-if="transaction.type !== 'transfer'"
      class="rounded-lg grid place-items-center shrink-0 w-9 h-9"
      :style="{
        background: transaction.category?.color
          ? transaction.category.color + '22'
          : transaction.type === 'income'
            ? 'hsl(var(--success) / 0.13)'
            : 'hsl(var(--destructive) / 0.13)',
        color: transaction.category?.color
          ?? (transaction.type === 'income' ? 'hsl(var(--success))' : 'hsl(var(--destructive))'),
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

    <!-- ── Description + subtitle + tags ────────────────────────── -->
    <div class="flex-1 min-w-0">
      <div class="flex items-center gap-1 mb-0.5">
        <p class="text-sm truncate text-foreground font-medium leading-none">
          {{ transaction.description }}
        </p>
        <Repeat2
          v-if="transaction.is_recurring"
          :size="11"
          class="text-violet-400 shrink-0 flex-none"
        />
      </div>
      <p class="text-[11px] text-muted-foreground/70 truncate leading-none">
        <template v-if="transaction.category">{{ transaction.category.name }}</template>
        <template v-if="transaction.account">
          {{ transaction.category ? ' · ' : '' }}{{ transaction.account.name }}
        </template>
        <template v-else-if="transaction.card">
          {{ transaction.category ? ' · ' : '' }}{{ transaction.card.name }}
        </template>
      </p>
      <!-- Tag chips -->
      <div v-if="transaction.tags && transaction.tags.length > 0" class="flex flex-wrap gap-1 mt-1">
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

    <!-- ── Pending badge (only for pending status) ───────────────── -->
    <span
      v-if="transaction.status === 'pending'"
      class="inline-flex items-center gap-1 h-5 px-1.5 rounded text-[10px] font-medium border shrink-0 bg-muted/40 text-muted-foreground border-border/60"
    >
      <Clock :size="9" :stroke-width="2" />
      Agendada
    </span>

    <!-- ── Amount with direction arrow ──────────────────────────── -->
    <span
      class="inline-flex items-center gap-0.5 text-sm tabular-nums font-semibold shrink-0"
      :class="
        transaction.type === 'income'
          ? 'text-success'
          : transaction.type === 'expense'
            ? 'text-destructive'
            : 'text-muted-foreground'
      "
    >
      <ArrowUp v-if="transaction.type === 'income'" :size="12" />
      <ArrowDown v-else-if="transaction.type === 'expense'" :size="12" />
      {{ formatCurrency(transaction.amount) }}
    </span>

  </button>
</template>
