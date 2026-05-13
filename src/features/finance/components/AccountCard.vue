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
import { ACCOUNT_TYPE_ICONS } from '../utils/financeHelpers'

defineProps<{
  account: BankAccount
}>()

const emit = defineEmits<{
  edit: [account: BankAccount]
  delete: [id: string]
}>()
</script>

<template>
  <div class="rounded-lg border border-border/50 bg-card p-3.5 flex flex-col gap-2.5">
    <!-- Header -->
    <div class="flex items-start justify-between">
      <div class="flex items-center gap-2.5 min-w-0">
        <!-- Icon with color only, no background box -->
        <component
          :is="ACCOUNT_TYPE_ICONS[account.type]"
          :size="15"
          :style="{ color: account.color }"
          class="shrink-0"
        />
        <div class="min-w-0">
          <p class="text-[13px] font-medium text-foreground truncate">{{ account.name }}</p>
          <p class="text-[10px] uppercase tracking-[0.08em] text-muted-foreground/40 mt-0.5">
            {{ ACCOUNT_TYPE_LABELS[account.type] }}
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

    <!-- Balance -->
    <div class="pt-2 border-t border-border/40">
      <p class="text-[10px] uppercase tracking-[0.08em] text-muted-foreground/40 mb-1">Saldo</p>
      <p
        :class="[
          'text-[18px] font-semibold tabular-nums leading-none',
          account.balance >= 0 ? 'text-foreground' : 'text-destructive/80',
        ]"
      >
        {{ formatCurrency(account.balance) }}
      </p>
    </div>
  </div>
</template>
