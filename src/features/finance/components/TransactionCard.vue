<script setup lang="ts">
import { computed } from 'vue'
import { ArrowUp, ArrowDown, ArrowLeftRight, ArrowRight, Clock, Repeat } from 'lucide-vue-next'
import type { Transaction } from '@/types/finance'
import { formatCurrency } from '@/utils/currency'
import { findIcon } from '@/lib/icons'

const props = defineProps<{
  transaction: Transaction
  highlighted?: boolean
}>()

const emit = defineEmits<{
  select: [transaction: Transaction]
}>()

const isPending = computed(() => props.transaction.status === 'pending')

/** Fallback color when no category */
const sideColor = computed(() => {
  if (props.transaction.type === 'income') return 'hsl(var(--success))'
  if (props.transaction.type === 'expense') return 'hsl(var(--destructive))'
  return 'hsl(var(--muted-foreground))'
})

const highlightBg = computed(() => {
  if (!props.highlighted) return ''
  if (props.transaction.type === 'income') return 'bg-success/[0.08]'
  if (props.transaction.type === 'expense') return 'bg-destructive/[0.08]'
  return 'bg-muted/50'
})
</script>

<template>
  <li :id="`tx-${transaction.id}`" class="relative">
    <button
      type="button"
      class="w-full flex items-center gap-3 pl-4 pr-4 min-h-[56px] text-left hover:bg-white/[0.025] active:bg-white/[0.04] transition-colors cursor-pointer"
      :class="[isPending ? 'opacity-60' : '', highlightBg]"
      @click="emit('select', transaction)"
    >
      <!-- Avatar — 36px, rounded-lg (8px) -->
      <div :class="isPending ? 'ring-1 ring-dashed ring-muted-foreground/40 rounded-lg p-0.5 shrink-0' : 'shrink-0'">
        <span
          v-if="transaction.type !== 'transfer'"
          class="rounded-lg grid place-items-center size-9"
          :style="{
            background: transaction.category?.color
              ? transaction.category.color + '26'
              : 'rgba(255,255,255,0.08)',
            color: transaction.category?.color ?? '#888888',
          }"
        >
          <component
            v-if="transaction.category?.icon && findIcon(transaction.category.icon)"
            :is="findIcon(transaction.category.icon)!.component"
            :size="18"
            :stroke-width="1.9"
          />
          <span v-else class="text-sm font-bold">
            {{ transaction.description.charAt(0).toUpperCase() }}
          </span>
        </span>
        <span
          v-else
          class="rounded-lg grid place-items-center size-9 bg-white/[0.08] text-muted-foreground"
        >
          <ArrowLeftRight :size="16" :stroke-width="1.9" />
        </span>
      </div>

      <!-- Description + subtitle -->
      <div class="flex-1 min-w-0 py-3.5">
        <div class="flex items-center gap-1.5">
          <Clock v-if="isPending" :size="10" class="text-warning shrink-0" />
          <p class="text-[14px] truncate font-medium text-foreground">{{ transaction.description }}</p>
          <Repeat
            v-if="transaction.is_recurring"
            :size="12"
            class="text-muted-foreground shrink-0"
          />
          <span
            v-if="transaction.installment_number && transaction.total_installments"
            class="inline-flex items-center h-4 px-1.5 rounded text-[9.5px] font-semibold border border-white/8 text-muted-foreground/60 shrink-0 bg-white/5"
          >
            {{ transaction.installment_number }}/{{ transaction.total_installments }}
          </span>
        </div>
        <p class="text-[12px] text-muted-foreground truncate mt-0.5 flex items-center gap-1.5">
          <span class="truncate">
            <template v-if="transaction.type === 'transfer'">
              <span class="inline-flex items-center gap-1">
                {{ transaction.account?.name ?? 'Conta' }}
                <ArrowRight :size="10" class="shrink-0 opacity-50" />
                {{ transaction.destination_account?.name ?? '?' }}
              </span>
            </template>
            <template v-else>
              <template v-if="transaction.category">{{ transaction.category.name }}</template>
              <template v-if="transaction.account">
                {{ transaction.category ? ' · ' : '' }}{{ transaction.account.name }}
              </template>
              <template v-else-if="transaction.card">
                {{ transaction.category ? ' · ' : '' }}{{ transaction.card.name }}
              </template>
            </template>
          </span>
          <span
            v-if="isPending"
            class="inline-flex items-center h-4 px-1.5 rounded text-[9.5px] font-semibold border shrink-0 bg-warning/12 border-warning/25 text-warning"
          >
            Pendente
          </span>
        </p>
      </div>

      <!-- Amount -->
      <span
        class="text-[14px] tabular-nums font-semibold shrink-0"
        :class="transaction.type === 'income' ? 'text-success' : transaction.type === 'expense' ? 'text-destructive' : 'text-muted-foreground'"
      >
        {{ transaction.type === 'income' ? '+' : transaction.type === 'expense' ? '-' : '' }}{{ formatCurrency(transaction.amount) }}
      </span>
    </button>
  </li>
</template>
