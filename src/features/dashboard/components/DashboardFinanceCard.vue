<script setup lang="ts">
import { ChevronRight, PiggyBank } from 'lucide-vue-next'
import { Skeleton } from '@ui/skeleton'
import { ROUTES } from '@/constants/routes'
import { formatCurrency } from '@/utils/currency'

/** Hoje's finance summary, as the Visão Geral "Saldo" card: what is in the accounts, what is put away, the month so far */
defineProps<{
  available: number
  reserve: number
  monthIncome: number
  monthExpenses: number
  loading?: boolean
}>()
</script>

<template>
  <div class="bg-card rounded-lg p-4">
    <div class="flex items-center justify-between gap-3 mb-3">
      <p class="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Finanças</p>
      <RouterLink :to="{ name: ROUTES.FINANCE }" class="inline-flex items-center gap-0.5 text-[12px] font-medium text-primary">
        Visão Geral
        <ChevronRight :size="14" aria-hidden="true" />
      </RouterLink>
    </div>

    <div v-if="loading" class="grid grid-cols-2 gap-3">
      <Skeleton class="h-10 w-full" />
      <Skeleton class="h-10 w-full" />
    </div>

    <template v-else>
      <div class="grid gap-3" :class="reserve !== 0 ? 'grid-cols-2' : 'grid-cols-1'">
        <div>
          <p class="text-[12px] text-muted-foreground mb-1">Nas contas</p>
          <p class="text-[20px] font-semibold tabular-nums leading-none whitespace-nowrap" :class="available >= 0 ? 'text-success' : 'text-destructive'">
            {{ formatCurrency(available) }}
          </p>
        </div>
        <div v-if="reserve !== 0">
          <p class="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground mb-1">
            <PiggyBank :size="14" class="text-primary shrink-0" />
            Guardado
          </p>
          <p class="text-[20px] font-semibold tabular-nums leading-none whitespace-nowrap text-primary">{{ formatCurrency(reserve) }}</p>
        </div>
      </div>

      <div class="mt-3 rounded-md bg-muted px-3 py-2 space-y-1 text-[12px]">
        <div class="flex items-center justify-between gap-3">
          <span class="text-muted-foreground">Recebido no mês</span>
          <span class="tabular-nums font-medium text-success whitespace-nowrap">+{{ formatCurrency(monthIncome) }}</span>
        </div>
        <div class="flex items-center justify-between gap-3">
          <span class="text-muted-foreground">Gasto no mês</span>
          <span class="tabular-nums font-medium text-destructive whitespace-nowrap">−{{ formatCurrency(monthExpenses) }}</span>
        </div>
      </div>
    </template>
  </div>
</template>
