<script setup lang="ts">
import { computed } from 'vue'
import { ArrowUp, ArrowDown, ArrowLeftRight, ArrowRight, Clock, Repeat } from 'lucide-vue-next'
import type { Transaction } from '@/types/finance'
import { formatCurrency } from '@/utils/currency'
import { findIcon } from '@/lib/icons'

const props = defineProps<{
  transaction: Transaction
  /** When true, applies a temporary highlight background to confirm a just-created transaction */
  highlighted?: boolean
}>()

const emit = defineEmits<{
  select: [transaction: Transaction]
}>()

/** Category color or type fallback */
const isPending = computed(() => props.transaction.status === 'pending')

/** Highlight background class based on transaction type */
const highlightBg = computed(() => {
  if (!props.highlighted) return ''
  if (props.transaction.type === 'income') return 'bg-success/[0.12]'
  if (props.transaction.type === 'expense') return 'bg-destructive/[0.10]'
  return 'bg-muted/50'
})
</script>

<template>
  <li :id="`tx-${transaction.id}`" class="relative">
    <button
      type="button"
      class="w-full flex items-center gap-3 pl-4 pr-4 py-3 min-h-[56px] lg:min-h-[48px] text-left hover:bg-foreground/[0.025] active:bg-foreground/[0.04] transition-colors cursor-pointer"
      :class="[isPending ? 'opacity-65' : '', highlightBg]"
      @click="emit('select', transaction)"
    >
      <!-- Category icon swatch — 40px, dashed ring when pending -->
      <div :class="isPending ? 'ring-1 ring-dashed ring-muted-foreground/50 rounded-xl p-0.5 saturate-50 shrink-0' : 'shrink-0'">
        <span
          v-if="transaction.type !== 'transfer'"
          class="rounded-xl grid place-items-center size-10"
          :style="{
            background: (transaction.category?.color ?? sideColor) + '22',
            color: transaction.category?.color ?? sideColor,
          }"
        >
          <component
            v-if="transaction.category?.icon && findIcon(transaction.category.icon)"
            :is="findIcon(transaction.category.icon)!.component"
            :size="22"
            :stroke-width="1.9"
          />
          <span v-else class="text-sm font-bold">
            {{ transaction.description.charAt(0).toUpperCase() }}
          </span>
        </span>
        <span
          v-else
          class="rounded-xl grid place-items-center size-10 text-muted-foreground"
          style="background: hsl(var(--muted) / 0.6)"
        >
          <ArrowLeftRight :size="18" :stroke-width="1.9" />
        </span>
      </div>

      <!-- Description + subtitle -->
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-1.5">
          <!-- Clock icon inline for pending -->
          <Clock v-if="isPending" :size="10" class="text-warning shrink-0" aria-label="Pendente" />
          <p class="text-[14px] lg:text-sm truncate font-medium">{{ transaction.description }}</p>
          <Repeat
            v-if="transaction.is_recurring"
            :size="13"
            class="text-muted-foreground shrink-0"
            aria-label="Recorrente"
          />
          <!-- Installment badge "(3/12)" -->
          <span
            v-if="transaction.installment_number && transaction.total_installments"
            class="inline-flex items-center h-4 px-1.5 rounded text-[9.5px] font-semibold border border-border/50 text-muted-foreground/60 bg-muted/40 shrink-0"
          >
            {{ transaction.installment_number }}/{{ transaction.total_installments }}
          </span>
        </div>
        <p class="subtle-meta truncate flex items-center gap-1.5">
          <span class="truncate">
            <!-- For transfers: show "Conta A → Conta B" -->
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
          <!-- Pendente badge inline in subtitle -->
          <span
            v-if="isPending"
            class="inline-flex items-center h-4 px-1.5 rounded text-[9.5px] font-semibold border shrink-0"
            style="background: color-mix(in oklab, oklch(0.76 0.12 80) 10%, transparent); color: oklch(0.76 0.12 80); border-color: color-mix(in oklab, oklch(0.76 0.12 80) 30%, transparent)"
          >
            Pendente
          </span>
        </p>
      </div>

      <!-- Amount -->
      <span
        class="inline-flex items-center gap-0.5 text-sm tabular-nums font-semibold shrink-0"
        :class="transaction.type === 'income' ? 'text-success' : transaction.type === 'expense' ? 'text-destructive' : 'text-muted-foreground'"
      >
        <ArrowUp v-if="transaction.type === 'income'" :size="12" />
        <ArrowDown v-else-if="transaction.type === 'expense'" :size="12" />
        {{ formatCurrency(transaction.amount) }}
      </span>
    </button>
  </li>
</template>
