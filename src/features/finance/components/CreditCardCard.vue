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
import { utilizationPercent } from '../utils/financeHelpers'

const props = defineProps<{
  card: CreditCardType
}>()

const emit = defineEmits<{
  edit: [card: CreditCardType]
  delete: [id: string]
}>()

const utilPct = computed(() => utilizationPercent(props.card.current_balance, props.card.credit_limit))
const available = computed(() => props.card.credit_limit - props.card.current_balance)

const utilBarClass = computed(() => {
  if (utilPct.value >= 80) return 'bg-destructive/60'
  if (utilPct.value >= 50) return 'bg-warning/70'
  return 'bg-success/60'
})
</script>

<template>
  <div class="rounded-lg border border-border/50 bg-card p-3.5 flex flex-col gap-2.5">
    <!-- Header -->
    <div class="flex items-start justify-between">
      <div class="flex items-center gap-2.5 min-w-0">
        <CreditCard :size="15" :style="{ color: card.color }" class="shrink-0" />
        <div class="min-w-0">
          <p class="text-[13px] font-medium text-foreground truncate">{{ card.name }}</p>
          <p class="text-[10px] uppercase tracking-[0.08em] text-muted-foreground/40 mt-0.5">
            {{ NETWORK_LABELS[card.network] }} · Fecha dia {{ card.closing_day }}
          </p>
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <Button variant="ghost" size="icon" class="h-6 w-6 shrink-0 -mr-1 -mt-0.5">
            <MoreHorizontal :size="13" />
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

    <!-- Invoice + available -->
    <div class="pt-2 border-t border-border/40">
      <div class="flex items-end justify-between mb-2">
        <div>
          <p class="text-[10px] uppercase tracking-[0.08em] text-muted-foreground/40 mb-1">Fatura</p>
          <p class="text-[18px] font-semibold tabular-nums leading-none text-foreground">
            {{ formatCurrency(card.current_balance) }}
          </p>
        </div>
        <div class="text-right">
          <p class="text-[10px] uppercase tracking-[0.08em] text-muted-foreground/40 mb-1">Disponível</p>
          <p class="text-[13px] font-medium tabular-nums text-success/80">
            {{ formatCurrency(available) }}
          </p>
        </div>
      </div>

      <!-- Utilization bar -->
      <div class="h-1 rounded-full bg-muted/50 overflow-hidden">
        <div
          :class="['h-full rounded-full transition-all', utilBarClass]"
          :style="{ width: `${utilPct}%` }"
        />
      </div>

      <div class="flex items-center justify-between mt-1.5">
        <span class="text-[10px] text-muted-foreground/40">
          Limite: {{ formatCurrency(card.credit_limit) }}
        </span>
        <span class="text-[10px] text-muted-foreground/40">
          {{ utilPct }}% · Vence dia {{ card.due_day }}
        </span>
      </div>
    </div>
  </div>
</template>
