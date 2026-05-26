<script setup lang="ts">
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@ui/dropdown-menu'
import { Button } from '@ui/button'
import { computed } from 'vue'
import { MoreHorizontal, Pencil, Trash2, CreditCard, CheckCircle2 } from 'lucide-vue-next'
import type { CreditCard as CreditCardType } from '@/types/finance'
import { formatCurrency } from '@/utils/currency'
import { utilizationPercent } from '../utils/financeHelpers'

const props = defineProps<{
  card: CreditCardType
  /** Amount used this month (from transactions with this card_id) */
  usedAmount?: number
}>()

const emit = defineEmits<{
  edit: [card: CreditCardType]
  delete: [id: string]
  pay: [card: CreditCardType]
}>()

/** Days until due this month, wrapping to next month if already past */
const daysUntilDue = computed(() => {
  const today = new Date().getDate()
  const due = props.card.due_day
  if (due >= today) return due - today
  const now = new Date()
  const nextDue = new Date(now.getFullYear(), now.getMonth() + 1, due)
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.ceil((nextDue.getTime() - todayMidnight.getTime()) / (1000 * 60 * 60 * 24))
})

/** Badge color classes based on days until due */
const dueBadgeClass = computed(() => {
  const d = daysUntilDue.value
  if (d === 0) return 'bg-destructive/20 text-destructive border-destructive/30'
  if (d === 1) return 'bg-destructive/15 text-destructive/80 border-destructive/20'
  if (d <= 5) return 'bg-warning/20 text-warning border-warning/30'
  return 'bg-success/15 text-success/80 border-success/20'
})

const dueBadgeLabel = computed(() => {
  const d = daysUntilDue.value
  if (d === 0) return 'Vence hoje'
  if (d === 1) return 'Vence amanhã'
  return `Vence em ${d} dias`
})

const used = computed(() => props.usedAmount ?? 0)
const utilPct = computed(() => utilizationPercent(used.value, props.card.limit_amount))

/** Limit bar color based on utilization percentage */
const limitBarClass = computed(() => {
  if (utilPct.value < 50) return 'bg-success'
  if (utilPct.value < 76) return 'bg-warning'
  return 'bg-destructive'
})

/** Show "Registrar pagamento" button for cards due within 7 days */
const showPayButton = computed(() => daysUntilDue.value <= 7)
</script>

<template>
  <div class="rounded-lg border border-border/50 bg-card overflow-hidden flex flex-col">
    <!-- Color accent top bar -->
    <div class="h-[3px] w-full" :style="{ background: card.color }" />

    <div class="p-3.5 flex flex-col gap-2.5 flex-1">
      <!-- Header -->
      <div class="flex items-start justify-between">
        <div class="flex items-center gap-2.5 min-w-0">
          <!-- Colored avatar with initials -->
          <span
            class="rounded-lg grid place-items-center shrink-0 w-8 h-8 text-[11px] font-bold text-white"
            :style="{ background: card.color }"
          >
            {{ card.name.substring(0, 2).toUpperCase() }}
          </span>
          <div class="min-w-0">
            <p class="text-[13px] font-medium text-foreground truncate">{{ card.name }}</p>
            <p class="text-[10px] uppercase tracking-[0.08em] text-muted-foreground/40 mt-0.5">
              Fecha dia {{ card.closing_day }} · Vence dia {{ card.due_day }}
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

      <!-- Due date badge — always visible -->
      <span
        class="inline-flex items-center self-start gap-1 px-2 py-0.5 rounded-full border text-[10px] font-medium"
        :class="dueBadgeClass"
      >
        <CreditCard :size="9" />
        {{ dueBadgeLabel }}
      </span>

      <!-- Limit + usage bar -->
      <div class="pt-1.5 border-t border-border/40">
        <div class="flex items-end justify-between mb-1.5">
          <div>
            <p class="text-[10px] uppercase tracking-[0.08em] text-muted-foreground/40 mb-0.5">Limite</p>
            <p class="text-[17px] font-semibold tabular-nums leading-none text-foreground">
              {{ formatCurrency(card.limit_amount) }}
            </p>
          </div>
          <span class="text-[11px] text-muted-foreground/50 tabular-nums">
            {{ utilPct }}% usado
          </span>
        </div>
        <!-- Limit usage bar -->
        <div class="h-1.5 bg-muted/60 rounded-full overflow-hidden">
          <div
            class="h-full rounded-full transition-all"
            :class="limitBarClass"
            :style="{ width: `${utilPct}%` }"
          />
        </div>
        <p v-if="used > 0" class="text-[10px] text-muted-foreground/40 mt-1 tabular-nums">
          {{ formatCurrency(used) }} de {{ formatCurrency(card.limit_amount) }}
        </p>
      </div>

      <!-- Pay button — shown for cards due within 7 days -->
      <button
        v-if="showPayButton"
        type="button"
        class="mt-0.5 flex items-center justify-center gap-1.5 w-full h-8 rounded-lg text-[12px] font-medium border border-success/30 bg-success/10 text-success hover:bg-success/15 transition-colors"
        @click="emit('pay', card)"
      >
        <CheckCircle2 :size="13" />
        Registrar pagamento
      </button>
    </div>
  </div>
</template>
