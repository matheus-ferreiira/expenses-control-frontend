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
import { MoreHorizontal, Pencil, Trash2, CreditCard } from 'lucide-vue-next'
import type { CreditCard as CreditCardType } from '@/types/finance'
import { formatCurrency } from '@/utils/currency'

const props = defineProps<{
  card: CreditCardType
}>()

const daysUntilDue = computed(() => {
  const today = new Date().getDate()
  const due = props.card.due_day
  if (due >= today) return due - today
  const now = new Date()
  const nextDue = new Date(now.getFullYear(), now.getMonth() + 1, due)
  return Math.ceil((nextDue.getTime() - now.setHours(0, 0, 0, 0)) / (1000 * 60 * 60 * 24))
})

const emit = defineEmits<{
  edit: [card: CreditCardType]
  delete: [id: string]
}>()
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
            Fecha dia {{ card.closing_day }} · Vence dia {{ card.due_day }}
          </p>
          <span
            v-if="daysUntilDue <= 10"
            :class="[
              'inline-block mt-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full',
              daysUntilDue === 0
                ? 'bg-destructive/15 text-destructive/80'
                : daysUntilDue <= 3
                  ? 'bg-warning/15 text-warning/80'
                  : 'bg-muted/60 text-muted-foreground/60',
            ]"
          >
            {{ daysUntilDue === 0 ? 'Vence hoje' : `Vence em ${daysUntilDue} dias` }}
          </span>
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

    <!-- Limit -->
    <div class="pt-2 border-t border-border/40">
      <div class="flex items-end justify-between">
        <div>
          <p class="text-[10px] uppercase tracking-[0.08em] text-muted-foreground/40 mb-1">Limite</p>
          <p class="text-[18px] font-semibold tabular-nums leading-none text-foreground">
            {{ formatCurrency(card.limit_amount) }}
          </p>
        </div>
        <div class="text-right">
          <p class="text-[10px] uppercase tracking-[0.08em] text-muted-foreground/40 mb-1">Status</p>
          <span
            :class="[
              'text-[10px] font-medium px-1.5 py-0.5 rounded',
              card.is_active
                ? 'bg-success/10 text-success/80'
                : 'bg-muted/50 text-muted-foreground/50',
            ]"
          >
            {{ card.is_active ? 'Ativo' : 'Inativo' }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
