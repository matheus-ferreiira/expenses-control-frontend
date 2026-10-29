<script setup lang="ts">
import { Skeleton } from '@ui/skeleton'
import { ArrowLeftRight, Receipt } from 'lucide-vue-next'
import type { Transaction } from '@/types/finance'
import { formatDate } from '@/utils/date'
import { formatCurrency } from '@/utils/currency'
import { withAlpha } from '@/utils/color'
import { findIcon } from '@/lib/icons'
import { ROUTES } from '@/constants/routes'
import DashboardCardHeader from './DashboardCardHeader.vue'

defineProps<{
  transactions: Transaction[]
  loading?: boolean
}>()

/** Same colours as the Visão Geral list: income green, spending in the normal text colour */
function amountColor(type: Transaction['type']): string {
  if (type === 'income') return 'text-success'
  if (type === 'expense') return 'text-foreground'
  return 'text-muted-foreground'
}

function amountPrefix(type: Transaction['type']): string {
  if (type === 'income') return '+'
  if (type === 'expense') return '−'
  return ''
}

/** "Categoria · Conta" without placeholders for what is missing (it used to read "— · Nubank") */
function subtitle(tx: Transaction): string {
  return [tx.category?.name, tx.account?.name ?? (tx.card ? `Cartão ${tx.card.name}` : null)].filter(Boolean).join(' · ')
}
</script>

<template>
  <div class="rounded-lg bg-card overflow-hidden">
    <DashboardCardHeader title="Transações recentes" :icon="Receipt" action-label="Ver todas" :to="ROUTES.FINANCE" />

    <!-- Loading -->
    <div v-if="loading" class="divide-y divide-border">
      <div v-for="i in 4" :key="i" class="flex items-center gap-3 px-4 py-2.5">
        <Skeleton class="size-8 rounded-lg shrink-0" />
        <div class="flex-1 space-y-1.5">
          <Skeleton class="h-3 w-2/3" />
          <Skeleton class="h-2.5 w-1/3" />
        </div>
        <Skeleton class="h-3 w-16" />
      </div>
    </div>

    <p v-else-if="transactions.length === 0" class="px-4 py-6 text-center text-[12px] text-muted-foreground">
      Nenhuma transação recente.
    </p>

    <!-- Rows like TransactionCard on Visão Geral -->
    <ul v-else class="divide-y divide-border">
      <li v-for="tx in transactions" :key="tx.id" class="flex items-center gap-3 px-4 py-2.5">
        <span
          v-if="tx.type === 'transfer'"
          class="size-8 rounded-lg grid place-items-center shrink-0 bg-muted text-muted-foreground"
        >
          <ArrowLeftRight :size="14" :stroke-width="1.9" aria-hidden="true" />
        </span>
        <span
          v-else
          class="size-8 rounded-lg grid place-items-center shrink-0"
          :style="tx.category?.color
            ? { background: withAlpha(tx.category.color, '26'), color: tx.category.color }
            : { background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }"
        >
          <component
            :is="findIcon(tx.category.icon)!.component"
            v-if="tx.category?.icon && findIcon(tx.category.icon)"
            :size="15"
            :stroke-width="1.9"
            aria-hidden="true"
          />
          <span v-else class="text-[12px] font-semibold">{{ tx.description.charAt(0).toUpperCase() }}</span>
        </span>

        <div class="flex-1 min-w-0">
          <p class="text-[14px] font-medium text-foreground leading-tight truncate">{{ tx.description }}</p>
          <p v-if="subtitle(tx)" class="text-[12px] text-muted-foreground truncate mt-0.5">{{ subtitle(tx) }}</p>
        </div>

        <div class="text-right shrink-0">
          <p :class="['text-[14px] font-semibold tabular-nums', amountColor(tx.type)]">
            {{ amountPrefix(tx.type) }}{{ formatCurrency(tx.amount) }}
          </p>
          <p class="text-[11px] text-muted-foreground mt-0.5">
            {{ formatDate(tx.transaction_date, { day: '2-digit', month: 'short' }) }}
          </p>
        </div>
      </li>
    </ul>
  </div>
</template>
