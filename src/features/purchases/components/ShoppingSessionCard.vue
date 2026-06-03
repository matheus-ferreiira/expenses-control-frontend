<script setup lang="ts">
import { computed } from 'vue'
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
  <div class="bg-card border border-border rounded-xl p-4">
    <!-- Linha 1: título + badge -->
    <div class="flex items-start justify-between gap-2">
      <p class="text-[14px] font-medium text-foreground truncate">{{ session.title }}</p>
      <span
        v-if="session.transaction_id"
        class="shrink-0 text-[10px] text-primary bg-primary/10 rounded-full px-2 py-0.5 font-medium"
      >
        vinculada
      </span>
    </div>

    <!-- Linha 2: data -->
    <p class="text-[12px] text-muted-foreground mt-0.5">{{ finishedDate }}</p>

    <!-- Linha 3: itens + total -->
    <div class="flex items-center justify-between mt-2">
      <span class="text-[12px] text-muted-foreground">
        {{ session.items_count }} item{{ session.items_count !== 1 ? 's' : '' }}
      </span>
      <span
        v-if="session.total !== null"
        class="text-[14px] font-semibold tabular-nums text-foreground"
      >
        {{ formatCurrency(session.total) }}
      </span>
    </div>
  </div>
</template>
