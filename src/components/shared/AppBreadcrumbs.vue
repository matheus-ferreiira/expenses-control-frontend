<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ChevronRight, House } from 'lucide-vue-next'
import { ROUTES } from '@/constants/routes'
import { MODULES as SYSTEM_MODULES } from '@/constants/modules'

/**
 * Trilha de navegação global: Home › Módulo › Página.
 * Derivada do nome da rota — módulos são detectados pelo prefixo do nome
 * (finance-*, prices-*...), a folha pelo mapa de labels abaixo.
 */
const route = useRoute()
const router = useRouter()

type Crumb = { label: string; route?: string }

/** Módulo por prefixo de rota — fonte única em constants/modules.ts */
const MODULES = SYSTEM_MODULES.filter((m) => !['dashboard', 'settings', 'reports'].includes(m.prefix))

/** Label da página atual por nome de rota (folha da trilha) */
const LEAF_LABELS: Record<string, string> = {
  [ROUTES.FINANCE]: 'Visão Geral',
  [ROUTES.FINANCE_ACCOUNTS]: 'Contas',
  [ROUTES.FINANCE_CARDS]: 'Cartões',
  [ROUTES.FINANCE_BUDGET]: 'Orçamento',
  [ROUTES.FINANCE_GOALS]: 'Metas',
  [ROUTES.FINANCE_REPORTS]: 'Relatório mensal',
  [ROUTES.FINANCE_REPORTS_YEARLY]: 'Relatório anual',
  [ROUTES.FINANCE_CATEGORIES]: 'Categorias',
  [ROUTES.PRICES]: 'Visão Geral',
  [ROUTES.PRICES_RECORDS]: 'Registros',
  [ROUTES.PRICES_PRODUCTS]: 'Produtos',
  [ROUTES.PRICES_PRODUCT_DETAIL]: 'Produto',
  [ROUTES.PRICES_PURCHASES]: 'Minhas Compras',
  [ROUTES.SETTINGS]: 'Configurações',
  [ROUTES.REPORTS]: 'Relatórios',
  [ROUTES.NOTES]: 'Notas',
  [ROUTES.BOOKMARKS]: 'Bookmarks',
  [ROUTES.PURCHASES]: 'Compras',
  [ROUTES.TASKS]: 'Tarefas',
  [ROUTES.HABITS]: 'Hábitos',
  [ROUTES.HABIT_DETAIL]: 'Detalhe',
  [ROUTES.CALENDAR]: 'Agenda',
}

const crumbs = computed<Crumb[]>(() => {
  const name = String(route.name ?? '')
  const trail: Crumb[] = [{ label: 'Home', route: ROUTES.DASHBOARD }]

  const module_ = MODULES.find((m) => name.startsWith(m.prefix))
  if (module_) trail.push({ label: module_.label, route: module_.root })

  const leaf = LEAF_LABELS[name]
  if (leaf && leaf !== module_?.label) trail.push({ label: leaf })

  return trail
})

function go(crumb: Crumb) {
  if (crumb.route && route.name !== crumb.route) router.push({ name: crumb.route })
}
</script>

<template>
  <nav aria-label="Trilha de navegação" class="flex items-center gap-1 select-none">
    <template v-for="(crumb, i) in crumbs" :key="i">
      <ChevronRight v-if="i > 0" :size="13" class="text-muted-foreground shrink-0" aria-hidden="true" />
      <button
        v-if="crumb.route && i < crumbs.length - 1"
        type="button"
        class="inline-flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground hover:text-foreground transition-colors"
        @click="go(crumb)"
      >
        <House v-if="i === 0" :size="13" aria-hidden="true" />
        {{ crumb.label }}
      </button>
      <span
        v-else
        class="inline-flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-widest text-primary"
      >
        {{ crumb.label }}
      </span>
    </template>
  </nav>
</template>
