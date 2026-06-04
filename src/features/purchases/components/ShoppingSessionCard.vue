<script setup lang="ts">
import { computed } from 'vue'
import { ShoppingCart, Link } from 'lucide-vue-next'
import { formatCurrency } from '@/utils/currency'
import type { ShoppingSession } from '@/types/shopping'

const props = defineProps<{
  session: ShoppingSession
}>()

const finishedDate = computed(() => {
  if (!props.session.finished_at) return ''
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).format(
    new Date(props.session.finished_at),
  )
})
</script>

<template>
  <div class="bg-card border border-border/60 rounded-xl overflow-hidden flex">
    <!-- Left accent bar -->
    <div class="w-[2px] bg-primary/40 shrink-0" />

    <!-- Content -->
    <div class="flex-1 p-4">
      <!-- Top row: icon + info + badge -->
      <div class="flex items-center gap-3">
        <span class="size-9 rounded-xl bg-primary/10 text-primary grid place-items-center shrink-0">
          <ShoppingCart :size="16" />
        </span>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 flex-wrap">
            <p class="text-[14px] font-semibold text-foreground truncate">{{ session.title }}</p>
            <span
              v-if="session.transaction_id"
              class="shrink-0 flex items-center gap-1 text-[10px] font-medium text-primary bg-primary/10 rounded-full px-2 py-0.5"
            >
              <Link :size="10" />
              vinculada
            </span>
          </div>
          <p class="text-[12px] text-muted-foreground mt-0.5">{{ finishedDate }}</p>
        </div>
      </div>

      <!-- Bottom row: value + items count -->
      <div class="flex items-baseline justify-between mt-3">
        <span
          v-if="session.total !== null"
          class="text-[15px] font-bold tabular-nums text-foreground"
        >
          {{ formatCurrency(session.total) }}
        </span>
        <span v-else class="text-[15px] font-bold text-muted-foreground/40">—</span>
        <span class="text-[12px] text-muted-foreground">
          {{ session.items_count }} item{{ session.items_count !== 1 ? 's' : '' }}
        </span>
      </div>
    </div>
  </div>
</template>
