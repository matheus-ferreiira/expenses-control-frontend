<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ROUTES } from '@/constants/routes'
import { Tooltip, TooltipContent, TooltipTrigger } from '@ui/tooltip'
import { Separator } from '@ui/separator'
import { ScrollArea } from '@ui/scroll-area'
import {
  LayoutDashboard,
  CheckSquare,
  Flame,
  CalendarDays,
  Wallet,
  Target,
  BarChart3,
  ShoppingCart,
  PanelLeftClose,
  PanelLeftOpen,
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
  { label: 'Compras', icon: ShoppingCart, route: ROUTES.PURCHASES, shortcut: 'G P' },
]

function isActive(routeName: string): boolean {
  return String(route.name) === routeName
}

async function handleLogout() {
  await auth.logout()
  router.push({ name: ROUTES.LOGIN })
}
</script>

<template>
  <aside
    class="fixed inset-y-0 left-0 z-40 flex flex-col transition-all duration-300 ease-in-out"
    :style="{ backgroundColor: 'hsl(var(--sidebar))', borderRight: '1px solid hsl(var(--sidebar-border))' }"
    :class="open ? 'w-64' : 'w-[60px]'"
  >
    <!-- Header -->
    <div
      class="flex items-center h-14 px-3 border-b"
      :style="{ borderColor: 'hsl(var(--sidebar-border))' }"
    >
      <div class="flex items-center gap-2.5 flex-1 min-w-0 overflow-hidden">
        <div class="w-6 h-6 rounded bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold shrink-0">
          P
        </div>
        <span
          v-if="open"
          class="text-sm font-semibold text-foreground truncate transition-all"
        >
          Productivity
        </span>
      </div>

      <Tooltip>
        <TooltipTrigger as-child>
          <button
            class="ml-1 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/70 transition-colors shrink-0"
            @click="emit('toggle')"
          >
            <PanelLeftClose v-if="open" :size="16" />
            <PanelLeftOpen v-else :size="16" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="right">
          {{ open ? 'Colapsar' : 'Expandir' }}
        </TooltipContent>
      </Tooltip>
    </div>

    <!-- Navigation -->
    <ScrollArea class="flex-1 py-3">
      <nav class="px-2 space-y-0.5">
        <template v-for="item in navItems" :key="item.route">
          <Tooltip :disabled="open">
            <TooltipTrigger as-child>
              <RouterLink
                :to="{ name: item.route }"
                class="group flex items-center gap-3 px-2.5 py-2 rounded-md text-sm font-medium transition-colors"
                :class="
                  isActive(item.route)
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground'
                "
              >
                <component :is="item.icon" :size="17" class="shrink-0" />
                <span
                  v-if="open"
                  class="flex-1 truncate"
                >
                  {{ item.label }}
                </span>
                <span
                  v-if="open"
                  class="text-[10px] text-muted-foreground/50 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity tabular-nums"
                >
                  {{ item.shortcut }}
                </span>
              </RouterLink>
            </TooltipTrigger>
            <TooltipContent side="right" class="flex items-center gap-2">
              <span>{{ item.label }}</span>
              <span class="text-muted-foreground text-xs">{{ item.shortcut }}</span>
            </TooltipContent>
          </Tooltip>
        </template>
      </nav>
    </ScrollArea>

    <!-- Footer -->
    <div class="px-2 pb-3 pt-2 border-t" :style="{ borderColor: 'hsl(var(--sidebar-border))' }">
      <Separator class="mb-2 opacity-50" />

      <Tooltip :disabled="open">
        <TooltipTrigger as-child>
          <button
            class="flex items-center gap-3 w-full px-2.5 py-2 rounded-md text-sm text-muted-foreground hover:bg-accent/60 hover:text-foreground transition-colors"
            @click="handleLogout"
          >
            <LogOut :size="17" class="shrink-0" />
            <span v-if="open">Sair</span>
          </button>
        </TooltipTrigger>
        <TooltipContent side="right">Sair</TooltipContent>
      </Tooltip>
    </div>
  </aside>
</template>
