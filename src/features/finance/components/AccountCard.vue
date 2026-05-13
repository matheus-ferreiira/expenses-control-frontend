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
  <div class="rounded-lg border border-border bg-card p-4 flex flex-col gap-3">
    <!-- Header -->
    <div class="flex items-start justify-between">
      <div class="flex items-center gap-3">
        <!-- Icon with account color -->
        <div
          class="h-9 w-9 rounded-lg flex items-center justify-center shrink-0"
          :style="{ backgroundColor: account.color + '20' }"
        >
          <component
            :is="ACCOUNT_TYPE_ICONS[account.type]"
            :size="18"
            :style="{ color: account.color }"
          />
        </div>

        <div class="min-w-0">
          <p class="text-sm font-semibold text-foreground truncate">{{ account.name }}</p>
          <p class="text-xs text-muted-foreground">{{ ACCOUNT_TYPE_LABELS[account.type] }}</p>
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <Button variant="ghost" size="icon" class="h-7 w-7 shrink-0">
            <MoreHorizontal :size="14" />
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
    <div class="pt-1 border-t border-border/50">
      <p class="text-xs text-muted-foreground mb-0.5">Saldo atual</p>
      <p
        :class="[
          'text-lg font-semibold tabular-nums',
          account.balance >= 0 ? 'text-foreground' : 'text-red-400',
        ]"
      >
        {{ formatCurrency(account.balance) }}
      </p>
    </div>
  </div>
</template>
