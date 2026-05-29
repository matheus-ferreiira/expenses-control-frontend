<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { ROUTES } from '@/constants/routes'

const route = useRoute()
const router = useRouter()

const tabs = [
  { label: 'Visão Geral',    route: ROUTES.FINANCE },
  { label: 'Transações',    route: ROUTES.FINANCE_TRANSACTIONS },
  { label: 'Contas',        route: ROUTES.FINANCE_ACCOUNTS },
  { label: 'Cartões',       route: ROUTES.FINANCE_CARDS },
  { label: 'Relatório',     route: ROUTES.FINANCE_REPORTS },
  { label: 'Categorias',    route: ROUTES.FINANCE_CATEGORIES },
]

function isActive(routeName: string): boolean {
  return String(route.name) === routeName
}
</script>

<template>
  <div class="-mx-5 px-5 lg:mx-0 lg:px-0 mb-5 overflow-x-auto scrollbar-none scroll-fade-x">
    <div class="flex items-center gap-1 w-max border-b border-border">
      <button
        v-for="tab in tabs"
        :key="tab.route"
        :class="[
          'relative px-3 h-10 text-sm font-medium whitespace-nowrap transition-colors shrink-0',
          isActive(tab.route) ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
        ]"
        @click="router.push({ name: tab.route })"
      >
        {{ tab.label }}
        <span
          v-if="isActive(tab.route)"
          class="absolute left-2 right-2 -bottom-px h-[2px] rounded-full bg-primary"
        />
      </button>
    </div>
  </div>
</template>
