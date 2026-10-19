<script setup lang="ts">
import { computed } from 'vue'
import { ChevronRight, Tag } from 'lucide-vue-next'
import { formatCurrency } from '@/utils/currency'
import { useFinanceStore } from '@/stores/finance'
import { findIcon } from '@/lib/icons'

import type { CategoryBreakdownItem } from '@/types/finance'

const props = withDefaults(defineProps<{
  categories: CategoryBreakdownItem[]
  title?: string
  /** Mensagem quando o mês não tem transações; sem ela o componente não renderiza nada */
  emptyText?: string
  /** Card próprio (título dentro), como os boxes da Visão Geral */
  boxed?: boolean
  selectable?: boolean
}>(), {
  title: 'Por categoria',
  emptyText: undefined,
})

const store = useFinanceStore()
const emit = defineEmits<{ select: [category: CategoryBreakdownItem] }>()

const sorted = computed(() => props.categories.slice().sort((a, b) => b.total - a.total))
const maxTotal = computed(() => Math.max(...sorted.value.map((c) => c.total), 1))

function categoryIcon(item: CategoryBreakdownItem): object {
  const cat = store.categories.find((c) => (item.category_id ? c.id === item.category_id : c.name === item.category))
  const found = cat?.icon ? findIcon(cat.icon) : null
  return (found?.component as object | undefined) ?? Tag
}
</script>

<template>
  <div v-if="sorted.length || emptyText" :class="boxed ? 'bg-card rounded-lg p-4' : ''">
    <div class="flex items-center justify-between mb-3">
      <p class="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
        {{ title }}
      </p>
      <span v-if="sorted.length" class="text-[11px] text-muted-foreground">
        {{ sorted.length }} categoria{{ sorted.length !== 1 ? 's' : '' }}
      </span>
    </div>

    <slot name="controls" />

    <p v-if="!sorted.length" class="text-[12px] text-muted-foreground" :class="boxed ? '' : 'bg-card rounded-md px-4 py-3'">
      {{ emptyText }}
    </p>

    <ul v-else class="divide-y divide-border overflow-hidden" :class="boxed ? '-mx-4 -mb-4 border-t border-border' : 'bg-card rounded-md'">
      <li
        v-for="cat in sorted"
        :key="cat.category_id ?? cat.category"
      >
        <component
          :is="selectable ? 'button' : 'div'"
          :type="selectable ? 'button' : undefined"
          :aria-label="selectable ? `Ver transações de ${cat.category}` : undefined"
          class="block w-full px-4 py-3 text-left"
          :class="selectable ? 'hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary transition-colors' : ''"
          @click="selectable && emit('select', cat)"
        >
          <div class="flex items-center gap-3">
            <span
              class="size-7 rounded-lg grid place-items-center shrink-0"
              :style="{ background: cat.color + '22', color: cat.color }"
            >
              <component :is="categoryIcon(cat)" :size="14" :stroke-width="1.9" />
            </span>
            <span class="flex-1 text-[13px] text-foreground truncate">{{ cat.category }}</span>
            <div class="text-right shrink-0">
              <span class="block text-[13px] tabular-nums font-medium">{{ formatCurrency(cat.total) }}</span>
              <span class="block text-[12px] tabular-nums text-muted-foreground">{{ cat.percentage }}% do total</span>
            </div>
            <ChevronRight v-if="selectable" :size="14" class="shrink-0 text-muted-foreground" aria-hidden="true" />
          </div>
          <div class="mt-1.5 ml-10 h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              class="h-full rounded-full transition-all duration-500"
              :style="{
                width: `${Math.min(100, Math.round((cat.total / maxTotal) * 100))}%`,
                background: cat.color,
              }"
            />
          </div>
          <p class="ml-10 mt-1 text-[10.5px] text-muted-foreground tabular-nums">
            {{ cat.count }} transaç{{ cat.count !== 1 ? 'ões' : 'ão' }}
          </p>
        </component>
      </li>
    </ul>
  </div>
</template>
