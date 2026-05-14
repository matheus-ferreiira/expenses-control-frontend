<script setup lang="ts">
import { useRouter } from 'vue-router'
import { Skeleton } from '@ui/skeleton'
import { ArrowRight } from 'lucide-vue-next'
import type { Transaction } from '@/types/finance'
import { formatDate } from '@/utils/date'
import { formatCurrency } from '@/utils/currency'
import { ROUTES } from '@/constants/routes'

defineProps<{
  transactions: Transaction[]
  loading?: boolean
}>()

const router = useRouter()

function amountColor(type: Transaction['type']): string {
  if (type === 'income') return 'text-emerald-400'
  if (type === 'expense') return 'text-red-400'
  return 'text-muted-foreground'
}

function amountPrefix(type: Transaction['type']): string {
  if (type === 'income') return '+'
  if (type === 'expense') return '-'
  return ''
}

function accountLabel(tx: Transaction): string {
  return tx.account?.name ?? tx.card?.name ?? '—'
}
</script>

<template>
  <div class="rounded-lg border border-border/50 bg-card">
    <div class="flex items-center justify-between px-4 py-3 border-b border-border/40">
      <span class="text-sm font-medium text-foreground">Transações recentes</span>
      <button
        class="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-base"
        @click="router.push({ name: ROUTES.FINANCE })"
      >
        Ver todas <ArrowRight :size="10" />
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="divide-y divide-border/50">
      <div v-for="i in 4" :key="i" class="flex items-center gap-3 px-4 py-3">
        <Skeleton class="h-6 w-6 rounded-full shrink-0" />
        <div class="flex-1 space-y-1">
          <Skeleton class="h-3 w-2/3" />
          <Skeleton class="h-2.5 w-1/3" />
        </div>
        <Skeleton class="h-3 w-16" />
      </div>
    </div>

    <!-- Empty -->
    <div
      v-else-if="transactions.length === 0"
      class="flex flex-col items-center justify-center py-10 text-center"
    >
      <p class="text-sm text-muted-foreground/50">Nenhuma transação recente.</p>
    </div>

    <!-- List -->
    <div v-else class="divide-y divide-border/40">
      <div
        v-for="tx in transactions"
        :key="tx.id"
        class="flex items-center gap-3 px-4 py-2.5 hover:bg-accent/20 transition-base"
      >
        <!-- Category color dot -->
        <div
          class="h-6 w-6 rounded-full shrink-0 flex items-center justify-center text-[10px] font-bold text-white"
          :style="{ backgroundColor: tx.category?.color ?? '#6b7280' }"
        >
          {{ (tx.category?.name ?? tx.description).charAt(0).toUpperCase() }}
        </div>

        <!-- Description + account -->
        <div class="flex-1 min-w-0">
          <p class="text-[13px] text-foreground truncate leading-none mb-0.5">
            {{ tx.description }}
          </p>
          <p class="text-[11px] text-muted-foreground/60 leading-none">
            {{ tx.category?.name ?? '—' }} · {{ accountLabel(tx) }}
          </p>
        </div>

        <!-- Amount + date -->
        <div class="text-right shrink-0">
          <p :class="['text-[13px] font-medium tabular-nums leading-none mb-0.5', amountColor(tx.type)]">
            {{ amountPrefix(tx.type) }}{{ formatCurrency(tx.amount) }}
          </p>
          <p class="text-[10px] text-muted-foreground/50 leading-none">
            {{ formatDate(tx.transaction_date, { day: '2-digit', month: 'short' }) }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
