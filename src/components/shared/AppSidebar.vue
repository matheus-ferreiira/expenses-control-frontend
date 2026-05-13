<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ROUTES } from '@/constants/routes'
import {
  LayoutDashboard,
  CheckSquare,
  Flame,
  CalendarDays,
  Wallet,
  Target,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from 'lucide-vue-next'

defineProps<{ open: boolean }>()
const emit = defineEmits<{ toggle: [] }>()

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, route: ROUTES.DASHBOARD, shortcut: 'G D' },
  { label: 'Tarefas', icon: CheckSquare, route: ROUTES.TASKS, shortcut: 'G T' },
  { label: 'Hábitos', icon: Flame, route: ROUTES.HABITS, shortcut: 'G H' },
  { label: 'Agenda', icon: CalendarDays, route: ROUTES.CALENDAR, shortcut: 'G A' },
  { label: 'Finanças', icon: Wallet, route: ROUTES.FINANCE, shortcut: 'G F' },
  { label: 'Metas', icon: Target, route: ROUTES.GOALS, shortcut: 'G M' },
  { label: 'Relatórios', icon: BarChart3, route: ROUTES.REPORTS, shortcut: 'G R' },
]

function isActive(routeName: string): boolean {
  return route.name === routeName
}

async function handleLogout() {
  await auth.logout()
  router.push({ name: ROUTES.LOGIN })
}
</script>

<template>
  <aside
    class="fixed inset-y-0 left-0 z-40 flex flex-col bg-card border-r border-border transition-all duration-300"
    :class="open ? 'w-64' : 'w-16'"
  >
    <!-- Logo + toggle -->
    <div class="flex items-center justify-between h-16 px-4 border-b border-border">
      <span v-if="open" class="font-semibold text-foreground truncate">Productivity</span>
      <button
        class="ml-auto p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        @click="emit('toggle')"
      >
        <ChevronLeft v-if="open" :size="16" />
        <ChevronRight v-else :size="16" />
      </button>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
      <RouterLink
        v-for="item in navItems"
        :key="item.route"
        :to="{ name: item.route }"
        class="flex items-center gap-3 px-2.5 py-2 rounded-md text-sm transition-colors group"
        :class="
          isActive(item.route)
            ? 'bg-primary/10 text-primary'
            : 'text-muted-foreground hover:bg-accent hover:text-foreground'
        "
        :title="!open ? item.label : undefined"
      >
        <component :is="item.icon" :size="18" class="shrink-0" />
        <span v-if="open" class="flex-1 truncate">{{ item.label }}</span>
        <span
          v-if="open"
          class="text-xs text-muted-foreground/60 shrink-0 hidden group-hover:block"
        >
          {{ item.shortcut }}
        </span>
      </RouterLink>
    </nav>

    <!-- Footer: user + logout -->
    <div class="border-t border-border p-2">
      <button
        class="flex items-center gap-3 w-full px-2.5 py-2 rounded-md text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
        :title="!open ? 'Sair' : undefined"
        @click="handleLogout"
      >
        <LogOut :size="18" class="shrink-0" />
        <span v-if="open">Sair</span>
      </button>
    </div>
  </aside>
</template>
