<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { ROUTES } from '@/constants/routes'

const route = useRoute()
const router = useRouter()

const tabs = [
  { label: 'Transações', route: ROUTES.FINANCE },
  { label: 'Contas', route: ROUTES.FINANCE_ACCOUNTS },
  { label: 'Cartões', route: ROUTES.FINANCE_CARDS },
]

function isActive(routeName: string): boolean {
  return String(route.name) === routeName
}
</script>

<template>
  <div class="flex gap-1 border-b border-border/60 mb-4">
    <button
      v-for="tab in tabs"
      :key="tab.route"
      :class="[
        'px-3 py-2 text-sm font-medium transition-colors border-b-2 -mb-px',
        isActive(tab.route)
          ? 'border-primary text-foreground'
          : 'border-transparent text-muted-foreground hover:text-foreground',
      ]"
      @click="router.push({ name: tab.route })"
    >
      {{ tab.label }}
    </button>
  </div>
</template>
