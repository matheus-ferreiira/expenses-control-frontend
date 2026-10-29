<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ChevronRight, Tag } from 'lucide-vue-next'
import { formatCurrency, formatPercent } from '@/utils/currency'
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
  /** Uma linha por categoria (nome, barra e valor) e só as maiores, com "Ver todas" */
  compact?: boolean
  /** Quantas categorias o modo compacto mostra antes de "Ver todas" */
  limit?: number
}>(), {
  title: 'Por categoria',
  emptyText: undefined,
  limit: 5,
})

const store = useFinanceStore()
const emit = defineEmits<{ select: [category: CategoryBreakdownItem] }>()

const sorted = computed(() => props.categories.slice().sort((a, b) => b.total - a.total))
const maxTotal = computed(() => Math.max(...sorted.value.map((c) => c.total), 1))

const expanded = ref(false)
// Another month or type starts collapsed again
watch(() => props.categories, () => { expanded.value = false })
const visible = computed(() => (props.compact && !expanded.value ? sorted.value.slice(0, props.limit) : sorted.value))
const barWidth = (cat: CategoryBreakdownItem) => `${Math.min(100, Math.round((cat.total / maxTotal.value) * 100))}%`

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
        v-for="cat in visible"
        :key="cat.category_id ?? cat.category"
      >
        <component
          :is="selectable ? 'button' : 'div'"
          :type="selectable ? 'button' : undefined"
          :aria-label="selectable ? `Ver transações de ${cat.category}` : undefined"
          class="block w-full px-4 text-left"
          :class="[compact ? 'py-2.5' : 'py-3', selectable ? 'hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary transition-colors' : '']"
          @click="selectable && emit('select', cat)"
        >
          <!-- Compacto: ícone, nome, barra e valor numa linha -->
          <div v-if="compact" class="flex items-center gap-2.5">
            <span
              class="size-6 rounded-md grid place-items-center shrink-0"
              :style="{ background: cat.color + '22', color: cat.color }"
            >
              <component :is="categoryIcon(cat)" :size="12" :stroke-width="2" />
            </span>
            <span class="flex-1 min-w-0 text-[13px] text-foreground truncate">{{ cat.category }}</span>
            <span class="w-12 h-1.5 bg-muted rounded-full overflow-hidden shrink-0" aria-hidden="true">
              <span class="block h-full rounded-full" :style="{ width: barWidth(cat), background: cat.color }" />
            </span>
            <span class="min-w-[84px] text-right text-[13px] tabular-nums font-medium whitespace-nowrap shrink-0">{{ formatCurrency(cat.total) }}</span>
            <ChevronRight v-if="selectable" :size="14" class="shrink-0 text-muted-foreground" aria-hidden="true" />
          </div>

          <template v-else>
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
              <span class="block text-[12px] tabular-nums text-muted-foreground">{{ formatPercent(cat.percentage) }} do total</span>
            </div>
            <ChevronRight v-if="selectable" :size="14" class="shrink-0 text-muted-foreground" aria-hidden="true" />
          </div>
          <div class="mt-1.5 ml-10 h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              class="h-full rounded-full transition-all duration-500"
              :style="{ width: barWidth(cat), background: cat.color }"
            />
          </div>
          <p class="ml-10 mt-1 text-[10.5px] text-muted-foreground tabular-nums">
            {{ cat.count }} transaç{{ cat.count !== 1 ? 'ões' : 'ão' }}
          </p>
          </template>
        </component>
      </li>
      <li v-if="compact && sorted.length > limit">
        <button
          type="button"
          class="w-full py-2.5 text-[12px] font-medium text-primary hover:bg-muted/50 transition-colors"
          @click="expanded = !expanded"
        >
          {{ expanded ? 'Mostrar menos' : `Ver todas (${sorted.length})` }}
        </button>
      </li>
    </ul>
  </div>
</template>
