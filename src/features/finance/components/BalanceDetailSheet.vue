<script setup lang="ts">
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
      class="rounded-t-2xl max-w-lg mx-auto bg-card border-t-2 border-primary [&>button]:hidden"
    >
      <div class="mx-auto mt-3 h-1 w-10 rounded-full bg-muted-foreground/20 shrink-0" />
      <div class="mb-4">
        <p class="text-[10px] uppercase tracking-widest text-muted-foreground/50 mb-1.5">
          {{ props.title }}
        </p>
        <p
          class="text-[22px] font-bold tabular-nums leading-none"
          :class="props.totalAmount >= 0 ? 'text-success' : 'text-destructive'"
        >
          {{ formatCurrency(props.totalAmount) }}
        </p>
      </div>
      <div class="border-t border-border/40 pt-2">
        <p v-if="!store.activeAccounts.length" class="text-[12px] text-muted-foreground/50 py-2">
          Nenhuma conta ativa
        </p>
        <div
          v-for="account in store.activeAccounts"
          :key="account.id"
          class="flex items-center gap-3 py-3 border-b border-border/20 last:border-0"
        >
          <div class="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <span class="text-[12px] font-semibold text-primary">
              {{ account.name.slice(0, 2).toUpperCase() }}
            </span>
          </div>
          <span class="flex-1 text-[14px] font-medium truncate">{{ account.name }}</span>
          <span
            class="tabular-nums font-semibold text-[14px]"
            :class="account.balance >= 0 ? 'text-success' : 'text-destructive'"
          >{{ formatCurrency(account.balance) }}</span>
        </div>
      </div>
    </SheetContent>
  </Sheet>
</template>
