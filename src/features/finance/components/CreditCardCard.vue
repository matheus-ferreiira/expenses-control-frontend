<script setup lang="ts">
import { computed } from 'vue'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@ui/dropdown-menu'
import { Button } from '@ui/button'
import { MoreHorizontal, Pencil, Trash2, CreditCard } from 'lucide-vue-next'
import type { CreditCard as CreditCardType } from '@/types/finance'
import { formatCurrency } from '@/utils/currency'
import { NETWORK_LABELS } from '../types'
import { utilizationPercent, utilizationColorClass } from '../utils/financeHelpers'

const props = defineProps<{
  card: CreditCardType
}>()

const emit = defineEmits<{
  edit: [card: CreditCardType]
  delete: [id: string]
}>()

const utilPct = computed(() => utilizationPercent(props.card.current_balance, props.card.credit_limit))
const utilClass = computed(() => utilizationColorClass(utilPct.value))
const available = computed(() => props.card.credit_limit - props.card.current_balance)
</script>

<template>
  <div class="rounded-lg border border-border bg-card p-4 flex flex-col gap-3">
    <!-- Header -->
    <div class="flex items-start justify-between">
      <div class="flex items-center gap-3">
        <div
          class="h-9 w-9 rounded-lg flex items-center justify-center shrink-0"
          :style="{ backgroundColor: card.color + '20' }"
        >
          <CreditCard :size="18" :style="{ color: card.color }" />
        </div>

        <div class="min-w-0">
          <p class="text-sm font-semibold text-foreground truncate">{{ card.name }}</p>
          <p class="text-xs text-muted-foreground">
            {{ NETWORK_LABELS[card.network] }}
            · Fecha dia {{ card.closing_day }}
          </p>
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <Button variant="ghost" size="icon" class="h-7 w-7 shrink-0">
            <MoreHorizontal :size="14" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" class="w-32">
          <DropdownMenuItem @click="emit('edit', card)">
            <Pencil :size="12" class="mr-2" />
            Editar
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            class="text-destructive focus:text-destructive"
            @click="emit('delete', card.id)"
          >
            <Trash2 :size="12" class="mr-2" />
            Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>

    <!-- Balance info -->
    <div class="pt-2 border-t border-border/50 space-y-2">
      <div class="flex items-end justify-between">
        <div>
          <p class="text-xs text-muted-foreground mb-0.5">Fatura atual</p>
          <p class="text-base font-semibold text-foreground tabular-nums">
            {{ formatCurrency(card.current_balance) }}
          </p>
        </div>
        <div class="text-right">
          <p class="text-xs text-muted-foreground mb-0.5">Disponível</p>
          <p class="text-sm font-medium text-emerald-400 tabular-nums">
            {{ formatCurrency(available) }}
          </p>
        </div>
      </div>

      <!-- Utilization bar -->
      <div>
        <div class="flex items-center justify-between mb-1">
          <span class="text-[10px] text-muted-foreground">
            Limite: {{ formatCurrency(card.credit_limit) }}
          </span>
          <span class="text-[10px] text-muted-foreground">{{ utilPct }}%</span>
        </div>
        <div class="h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            :class="['h-full rounded-full transition-all', utilClass]"
            :style="{ width: `${utilPct}%` }"
          />
        </div>
      </div>

      <p class="text-[10px] text-muted-foreground">Vence dia {{ card.due_day }}</p>
    </div>
  </div>
</template>
