<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { ROUTES } from '@/constants/routes'

/**
 * Sub-navegação do módulo Finanças para mobile (a sidebar cobre o desktop).
 * 1 toque para qualquer tela do módulo — antes eram 3 (Mais → Finanças → tela).
 */
const route = useRoute()
const router = useRouter()

const ITEMS: { label: string; route: string }[] = [
  { label: 'Visão', route: ROUTES.FINANCE },
  { label: 'Contas', route: ROUTES.FINANCE_ACCOUNTS },
  { label: 'Cartões', route: ROUTES.FINANCE_CARDS },
  { label: 'Orçamento', route: ROUTES.FINANCE_BUDGET },
  { label: 'Metas', route: ROUTES.FINANCE_GOALS },
  { label: 'Relatórios', route: ROUTES.FINANCE_REPORTS },
]

function isActive(name: string): boolean {
  if (name === ROUTES.FINANCE_REPORTS) {
    return route.name === ROUTES.FINANCE_REPORTS || route.name === ROUTES.FINANCE_REPORTS_YEARLY
  }
  return route.name === name
}
</script>

<template>
  <div class="lg:hidden -mx-5 px-5 mb-4 overflow-x-auto scrollbar-none scroll-fade-x">
    <div class="flex items-center gap-1.5 w-max">
      <button
        v-for="item in ITEMS"
        :key="item.route"
        type="button"
        class="h-8 px-3.5 rounded-full text-[12px] font-medium whitespace-nowrap transition-colors duration-150 shrink-0"
        :class="isActive(item.route)
          ? 'bg-primary text-primary-foreground'
          : 'bg-muted text-muted-foreground hover:text-foreground'"
        @click="router.push({ name: item.route })"
      >
        {{ item.label }}
      </button>
    </div>
  </div>
</template>
