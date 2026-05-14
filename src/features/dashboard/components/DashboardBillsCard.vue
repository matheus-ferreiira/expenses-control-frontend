<script setup lang="ts">
import { Skeleton } from '@ui/skeleton'
import { CreditCard } from 'lucide-vue-next'
import type { UpcomingBill } from '../types'
import { formatCurrency } from '@/utils/currency'

defineProps<{
  bills: UpcomingBill[]
  loading?: boolean
}>()

function dueLabel(days: number): string {
  if (days === 0) return 'Hoje'
  if (days === 1) return 'Amanhã'
  return `Em ${days} dias`
}

function dueLabelClass(days: number): string {
  if (days <= 2) return 'text-destructive'
  if (days <= 5) return 'text-warning'
  return 'text-muted-foreground/60'
}
</script>

<template>
  <div class="rounded-lg border border-border/50 bg-card">
    <div class="flex items-center gap-2 px-4 py-3 border-b border-border/40">
      <CreditCard :size="13" class="text-muted-foreground" />
      <span class="text-sm font-medium text-foreground">Contas a vencer</span>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="p-4 space-y-3">
      <div v-for="i in 2" :key="i" class="flex items-center justify-between">
        <Skeleton class="h-3 w-24" />
        <Skeleton class="h-3 w-16" />
      </div>
    </div>

    <!-- Empty -->
    <div v-else-if="bills.length === 0" class="px-4 py-4 text-center">
      <p class="text-xs text-muted-foreground/50">Nenhuma conta nos próximos 10 dias.</p>
    </div>

    <!-- List -->
    <div v-else class="divide-y divide-border/40">
      <div
        v-for="bill in bills"
        :key="bill.id"
        class="flex items-center justify-between px-4 py-2.5 hover:bg-accent/20 transition-base"
      >
        <div>
          <p class="text-[13px] text-foreground leading-none mb-0.5 truncate">{{ bill.name }}</p>
          <p :class="['text-[11px] leading-none', dueLabelClass(bill.daysUntilDue)]">
            {{ dueLabel(bill.daysUntilDue) }}
          </p>
        </div>
        <p class="text-[13px] font-medium tabular-nums text-foreground shrink-0 ml-3">
          {{ formatCurrency(bill.amount) }}
        </p>
      </div>
    </div>
  </div>
</template>
