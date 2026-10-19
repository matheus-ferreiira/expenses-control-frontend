<script setup lang="ts">
import { PiggyBank } from 'lucide-vue-next'
import { useFinanceStore } from '@/stores/finance'
import { formatCurrency } from '@/utils/currency'
import { Sheet, SheetContent } from '@/components/ui/sheet'

const props = defineProps<{
  open: boolean
  title: string
  totalAmount: number
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const store = useFinanceStore()
</script>

<template>
  <Sheet :open="props.open" @update:open="emit('update:open', $event)">
    <SheetContent
      side="bottom"
      class="rounded-t-2xl max-w-lg mx-auto bg-background p-0 border-t-2 border-primary [&>button]:hidden"
    >
      <div class="mx-auto mt-3 h-1 w-10 rounded-full bg-border shrink-0" />
      <div class="px-5 pt-4 mb-4">
        <p class="text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5">
          {{ props.title }}
        </p>
        <p
          class="text-[22px] font-bold tabular-nums leading-none"
          :class="props.totalAmount >= 0 ? 'text-success' : 'text-destructive'"
        >
          {{ formatCurrency(props.totalAmount) }}
        </p>
      </div>
      <div class="border-t border-border pt-2 px-5 pb-6">
        <p v-if="!store.availableAccounts.length" class="text-[12px] text-muted-foreground py-2">
          Nenhuma conta ativa
        </p>
        <div
          v-for="account in store.availableAccounts"
          :key="account.id"
          class="flex items-center gap-3 py-3 border-b border-border last:border-0"
        >
          <div class="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
            <span class="text-[13px] font-semibold text-primary">
              {{ account.name.slice(0, 2).toUpperCase() }}
            </span>
          </div>
          <span class="flex-1 text-[14px] font-medium truncate">{{ account.name }}</span>
          <span
            class="tabular-nums font-semibold text-[14px]"
            :class="account.balance >= 0 ? 'text-success' : 'text-destructive'"
          >{{ formatCurrency(account.balance) }}</span>
        </div>
        <!-- Caixinhas: listadas à parte, não somam no saldo acima -->
        <template v-if="store.reserveAccounts.length">
          <p class="text-[10px] uppercase tracking-widest text-muted-foreground mt-4 mb-1">
            Guardado · {{ formatCurrency(store.reserveBalance) }}
          </p>
          <div
            v-for="account in store.reserveAccounts"
            :key="account.id"
            class="flex items-center gap-3 py-3 border-b border-border last:border-0"
          >
            <div class="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
              <PiggyBank :size="16" class="text-primary" />
            </div>
            <span class="flex-1 text-[14px] font-medium truncate">{{ account.name }}</span>
            <span class="tabular-nums font-semibold text-[14px] text-primary">{{ formatCurrency(account.balance) }}</span>
          </div>
        </template>
      </div>
    </SheetContent>
  </Sheet>
</template>
