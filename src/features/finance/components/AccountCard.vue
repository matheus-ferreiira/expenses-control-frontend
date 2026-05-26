<script setup lang="ts">
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@ui/dropdown-menu'
import { Button } from '@ui/button'
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-vue-next'
import type { BankAccount } from '@/types/finance'
import { ACCOUNT_TYPE_LABELS } from '@/types/finance'
import { formatCurrency } from '@/utils/currency'

defineProps<{
  account: BankAccount
}>()

const emit = defineEmits<{
  edit: [account: BankAccount]
  delete: [id: string]
}>()
</script>

<template>
  <div class="rounded-lg border border-border/50 bg-card overflow-hidden flex flex-col">
    <!-- Color accent bar on top -->
    <div class="h-[3px] w-full" :style="{ background: account.color || 'hsl(var(--muted-foreground) / 0.3)' }" />

    <div class="p-3.5 flex flex-col gap-2.5 flex-1">
      <!-- Header -->
      <div class="flex items-start justify-between">
        <div class="flex items-center gap-2.5 min-w-0">
          <!-- Colored avatar with initials -->
          <span
            class="rounded-lg grid place-items-center shrink-0 w-9 h-9 text-[11px] font-bold text-white"
            :style="{ background: account.color || 'hsl(var(--muted-foreground) / 0.4)' }"
          >
            {{ account.name.substring(0, 2).toUpperCase() }}
          </span>
          <div class="min-w-0">
            <p class="text-[13px] font-semibold text-foreground truncate">{{ account.name }}</p>
            <p class="text-[10px] uppercase tracking-[0.08em] text-muted-foreground/40 mt-0.5">
              {{ account.bank_name || ACCOUNT_TYPE_LABELS[account.type] }}
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
            <DropdownMenuItem @click="emit('edit', account)">
              <Pencil :size="12" class="mr-2" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              class="text-destructive focus:text-destructive"
              @click="emit('delete', account.id)"
            >
              <Trash2 :size="12" class="mr-2" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <!-- Balance — inline with type label -->
      <div class="flex items-center justify-between pt-1.5 border-t border-border/40">
        <span class="text-[10px] uppercase tracking-[0.08em] text-muted-foreground/40">
          {{ ACCOUNT_TYPE_LABELS[account.type] }}
        </span>
        <p
          :class="[
            'text-[20px] font-semibold tabular-nums leading-none',
            account.balance >= 0 ? 'text-foreground' : 'text-destructive/80',
          ]"
        >
          {{ formatCurrency(account.balance) }}
        </p>
      </div>
    </div>
  </div>
</template>
