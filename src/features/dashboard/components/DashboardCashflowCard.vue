<script setup lang="ts">
import type { Transaction } from '@/types/finance'
import type { CashflowPeriod, CashflowPoint } from '../types'
import { ref } from 'vue'
import { Skeleton } from '@ui/skeleton'

defineProps<{
  transactions: Transaction[]
  computeCashflow: (period: CashflowPeriod) => CashflowPoint[]
  loading?: boolean
}>()

const period = ref<CashflowPeriod>('1M')
const PERIODS: CashflowPeriod[] = ['1S', '1M', '6M', '1A']
</script>

<template>
  <div class="rounded-lg border border-border bg-card">
    <div class="flex items-center justify-between px-4 py-3 border-b border-border/60">
      <span class="text-sm font-medium text-foreground">Cashflow</span>
      <div class="flex items-center gap-0.5">
        <button
          v-for="p in PERIODS"
          :key="p"
          :class="[
            'px-2 py-0.5 rounded text-[11px] font-medium transition-colors',
            period === p
              ? 'bg-foreground/10 text-foreground'
              : 'text-muted-foreground hover:text-foreground',
          ]"
          @click="period = p"
        >
          {{ p }}
        </button>
      </div>
    </div>
    <div class="p-4 h-[160px] flex items-center justify-center">
      <Skeleton v-if="loading" class="h-full w-full rounded" />
      <p v-else class="text-xs text-muted-foreground/40">Gráfico em breve</p>
    </div>
  </div>
</template>
