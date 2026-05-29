<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { ROUTES } from '@/constants/routes'
import { ScrollArea } from '@ui/scroll-area'
import { Avatar, AvatarFallback } from '@ui/avatar'
import {
  LayoutDashboard, CheckSquare, Flame, Target, CalendarDays,
  Wallet, FileText, BookOpen, Bookmark, ShoppingCart,
  Lock, Settings, Search, Plus, Moon, Sun,
  PanelLeftClose, PanelLeftOpen, ChevronDown,
  ArrowUpDown, Landmark, CreditCard, PieChart, Tag,
} from 'lucide-vue-next'

defineProps<{ open: boolean }>()
const emit = defineEmits<{
  toggle: []
  search: []
  quickAdd: []
  navigate: []
}>()

const route = useRoute()
const auth = useAuthStore()
const ui = useUiStore()

// ── Finance group ─────────────────────────────────────────────────────────────
const financeGroupOpen = ref(false)
const isOnFinance = computed(() => String(route.name).startsWith('finance'))
watch(isOnFinance, (val) => { if (val) financeGroupOpen.value = true }, { immediate: true })

const FINANCE_CHILDREN = [
  { label: 'Visão Geral', icon: LayoutDashboard, route: ROUTES.FINANCE },
  { label: 'Transações', icon: ArrowUpDown, route: ROUTES.FINANCE_TRANSACTIONS },
  { label: 'Contas', icon: Landmark, route: ROUTES.FINANCE_ACCOUNTS },
  { label: 'Cartões', icon: CreditCard, route: ROUTES.FINANCE_CARDS },
  { label: 'Relatórios', icon: PieChart, route: ROUTES.FINANCE_REPORTS },
  { label: 'Categorias', icon: Tag, route: ROUTES.FINANCE_CATEGORIES },
]

// ── Nav sections ──────────────────────────────────────────────────────────────
const ALL_NAV_SECTIONS: Array<{
  label: string | null
  items: Array<{
    label: string
    icon: typeof LayoutDashboard
    route: string
    shortcut: string
    module: string | null
    children?: typeof FINANCE_CHILDREN
  }>
}> = [
  {
    label: null,
    items: [
      { label: 'Dashboard', icon: LayoutDashboard, route: ROUTES.DASHBOARD, shortcut: 'G D', module: null },
    ],
  },
  {
    label: 'FINANÇAS',
    items: [
      { label: 'Finanças', icon: Wallet, route: ROUTES.FINANCE, shortcut: 'G F', module: null, children: FINANCE_CHILDREN },
    ],
  },
  {
    label: 'PRODUTIVIDADE',
    items: [
      { label: 'Tarefas', icon: CheckSquare, route: ROUTES.TASKS, shortcut: 'G T', module: 'tasks' },
      { label: 'Hábitos', icon: Flame, route: ROUTES.HABITS, shortcut: 'G H', module: 'habits' },
      { label: 'Metas', icon: Target, route: ROUTES.GOALS, shortcut: 'G M', module: 'goals' },
      { label: 'Agenda', icon: CalendarDays, route: ROUTES.CALENDAR, shortcut: 'G A', module: 'calendar' },
    ],
  },
  {
    label: 'CONTEÚDO',
    items: [
      { label: 'Notas', icon: FileText, route: ROUTES.NOTES, shortcut: 'G N', module: 'notes' },
      { label: 'Daily Log', icon: BookOpen, route: ROUTES.DAILY_LOG, shortcut: 'G L', module: 'daily_log' },
      { label: 'Bookmarks', icon: Bookmark, route: ROUTES.BOOKMARKS, shortcut: 'G B', module: 'bookmarks' },
    ],
  },
  {
    label: 'SISTEMA',
    items: [
      { label: 'Compras', icon: ShoppingCart, route: ROUTES.PURCHASES, shortcut: 'G C', module: 'purchases' },
      { label: 'Cofre', icon: Lock, route: ROUTES.VAULT, shortcut: 'G V', module: 'vault' },
      { label: 'Configurações', icon: Settings, route: ROUTES.SETTINGS, shortcut: '', module: null },
    ],
  },
]

const navSections = computed(() =>
  ALL_NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) =>
      item.module === null || auth.moduleEnabled(item.module),
    ),
  })).filter((section) => section.items.length > 0),
)

function isActive(routeName: string): boolean {
  const name = String(route.name)
  return name === routeName || name.startsWith(routeName + '-')
}

function isChildActive(routeName: string): boolean {
  const name = String(route.name)
  if (routeName === ROUTES.FINANCE) return name === routeName
  return name === routeName || name.startsWith(routeName + '-')
}

function initials(name?: string | null): string {
  if (!name) return '?'
  return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
}

const searchShortcut = typeof navigator !== 'undefined' && navigator.platform.includes('Mac')
  ? '⌘K'
  : 'Ctrl K'
</script>

<template>
  <aside
    class="flex flex-col h-full bg-background border-r border-border transition-[width] duration-300 ease-in-out overflow-hidden"
    :class="open ? 'w-56' : 'w-[52px]'"
  >
    <!-- ─── Logo ─────────────────────────────────────────────── -->
    <div class="flex items-center h-[52px] px-3 border-b border-border shrink-0">
      <div v-if="open" class="flex items-center gap-2 flex-1 min-w-0">
        <span class="text-[15px] font-semibold text-foreground tracking-tight select-none">Vault</span>
        <span class="text-[9px] font-medium tracking-widest uppercase leading-none px-1 py-0.5 rounded border select-none text-muted-foreground/40 border-border">
          Beta
        </span>
      </div>
      <div v-else class="w-full flex justify-center">
        <span class="text-[14px] font-bold text-foreground select-none">V</span>
      </div>
      <button
        v-if="open"
        class="shrink-0 p-1 rounded text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors duration-150 ml-1"
        @click="emit('toggle')"
      >
        <PanelLeftClose :size="14" />
      </button>
    </div>

    <!-- ─── Search + Quick add ────────────────────────────────── -->
    <div class="px-2 pt-2.5 pb-1 space-y-0.5 shrink-0">
      <template v-if="open">
        <button
          class="flex items-center gap-2 w-full px-2.5 py-[7px] rounded-md transition-colors duration-150 text-muted-foreground/50 hover:bg-white/[0.04] hover:text-muted-foreground/80"
          @click="emit('search')"
        >
          <Search :size="13" class="shrink-0" />
          <span class="flex-1 text-[12.5px]">Buscar...</span>
          <kbd class="text-[10px] font-mono text-muted-foreground/25">{{ searchShortcut }}</kbd>
        </button>
        <button
          class="flex items-center gap-2 w-full px-2.5 py-[7px] rounded-md transition-colors duration-150 text-muted-foreground/50 hover:bg-white/[0.04] hover:text-muted-foreground/80"
          @click="emit('quickAdd')"
        >
          <Plus :size="13" class="shrink-0" />
          <span class="flex-1 text-[12.5px]">Quick add</span>
          <kbd class="text-[10px] font-mono text-muted-foreground/25">N</kbd>
        </button>
      </template>
      <template v-else>
        <button
          class="flex justify-center w-full p-2 rounded-md transition-colors duration-150 text-muted-foreground/40 hover:bg-white/5 hover:text-muted-foreground/70"
          @click="emit('search')"
        >
          <Search :size="14" />
        </button>
        <button
          class="flex justify-center w-full p-2 rounded-md transition-colors duration-150 text-muted-foreground/40 hover:bg-white/5 hover:text-muted-foreground/70"
          @click="emit('quickAdd')"
        >
          <Plus :size="14" />
        </button>
      </template>
    </div>

    <!-- ─── Navigation ────────────────────────────────────────── -->
    <ScrollArea class="flex-1 overflow-hidden">
      <nav class="px-2 pb-2">
        <template v-for="(section, sectionIdx) in navSections" :key="sectionIdx">

          <!-- Section label (expanded) -->
          <div v-if="open && section.label" :class="['px-3 mb-1', sectionIdx > 0 ? 'mt-4' : '']">
            <span class="text-[10px] font-medium text-muted-foreground/50 uppercase tracking-widest">
              {{ section.label }}
            </span>
          </div>
          <!-- Section divider (collapsed) -->
          <div v-else-if="!open && sectionIdx > 0" class="mt-3 mb-1 mx-2 border-t border-border" />

          <template v-for="item in section.items" :key="item.route">

            <!-- ── Finance group (expandable) ──────────────────── -->
            <template v-if="'children' in item && item.children">

              <!-- Expanded: group header button -->
              <button
                v-if="open"
                type="button"
                class="group flex items-center gap-3 w-full rounded-lg text-sm transition-colors duration-150 mb-0.5"
                :class="isOnFinance
                  ? 'bg-white/[0.08] pl-[10px] pr-3 py-2 border-l-2 border-primary text-foreground font-medium'
                  : 'px-3 py-2 text-muted-foreground hover:bg-white/5 hover:text-foreground'"
                @click="financeGroupOpen = !financeGroupOpen"
              >
                <component :is="item.icon" :size="18" class="shrink-0" />
                <span class="flex-1 truncate text-left">{{ item.label }}</span>
                <ChevronDown
                  :size="12"
                  class="shrink-0 transition-transform duration-200 text-muted-foreground"
                  :class="financeGroupOpen ? 'rotate-180' : ''"
                />
              </button>

              <!-- Expanded: subitems -->
              <template v-if="open && financeGroupOpen">
                <RouterLink
                  v-for="child in item.children"
                  :key="child.route"
                  :to="{ name: child.route }"
                  class="flex items-center gap-2 pl-9 pr-3 py-1.5 rounded-lg text-xs transition-colors duration-150 mb-0.5"
                  :class="isChildActive(child.route)
                    ? 'text-primary font-medium'
                    : 'text-muted-foreground/70 hover:bg-white/5 hover:text-foreground'"
                  @click="emit('navigate')"
                >
                  <component :is="child.icon" :size="14" class="shrink-0" />
                  <span class="truncate">{{ child.label }}</span>
                </RouterLink>
              </template>

              <!-- Collapsed: icon links to Finance root -->
              <RouterLink
                v-if="!open"
                :to="{ name: item.route }"
                class="flex justify-center w-full p-2 rounded-lg transition-colors duration-150 mb-0.5"
                :class="isOnFinance
                  ? 'bg-white/[0.08] text-foreground'
                  : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'"
                @click="emit('navigate')"
              >
                <component :is="item.icon" :size="18" />
              </RouterLink>
            </template>

            <!-- ── Regular nav item ────────────────────────────── -->
            <template v-else>

              <!-- Expanded -->
              <RouterLink
                v-if="open"
                :to="{ name: item.route }"
                class="group flex items-center gap-3 rounded-lg text-sm transition-colors duration-150 mb-0.5"
                :class="isActive(item.route)
                  ? 'bg-white/[0.08] pl-[10px] pr-3 py-2 border-l-2 border-primary text-foreground font-medium'
                  : 'px-3 py-2 text-muted-foreground hover:bg-white/5 hover:text-foreground'"
                @click="emit('navigate')"
              >
                <component :is="item.icon" :size="18" class="shrink-0" />
                <span class="flex-1 truncate">{{ item.label }}</span>
                <span
                  v-if="item.shortcut"
                  class="text-[9.5px] font-mono text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                >{{ item.shortcut }}</span>
              </RouterLink>

              <!-- Collapsed -->
              <RouterLink
                v-else
                :to="{ name: item.route }"
                class="flex justify-center w-full p-2 rounded-lg transition-colors duration-150 mb-0.5"
                :class="isActive(item.route)
                  ? 'bg-white/[0.08] text-foreground'
                  : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'"
                @click="emit('navigate')"
              >
                <component :is="item.icon" :size="18" />
              </RouterLink>

            </template>

          </template>
        </template>
      </nav>
    </ScrollArea>

    <!-- ─── Footer ────────────────────────────────────────────── -->
    <div class="border-t border-border shrink-0">

      <!-- Theme toggle (expanded) -->
      <button
        v-if="open"
        class="flex items-center gap-2 w-full px-3 py-2 text-muted-foreground/50 hover:bg-white/5 hover:text-muted-foreground transition-colors duration-150"
        @click="ui.toggleTheme()"
      >
        <Moon v-if="ui.theme === 'dark'" :size="13" class="shrink-0" />
        <Sun v-else :size="13" class="shrink-0" />
        <span class="flex-1 text-[12px] text-left">Aparência</span>
        <span class="text-[10px] text-muted-foreground/30">
          {{ ui.theme === 'dark' ? 'Escuro' : 'Claro' }}
        </span>
      </button>

      <!-- Expand toggle (collapsed) -->
      <button
        v-if="!open"
        class="flex justify-center w-full p-2 text-muted-foreground/30 hover:bg-white/5 hover:text-muted-foreground/60 transition-colors duration-150 mt-1 mb-1"
        @click="emit('toggle')"
      >
        <PanelLeftOpen :size="14" />
      </button>

      <!-- User row (expanded) -->
      <div v-if="open" class="flex items-center gap-2.5 px-3 py-3">
        <Avatar class="h-8 w-8 shrink-0">
          <AvatarFallback class="text-xs font-medium bg-primary/20 text-primary">
            {{ initials(auth.user?.name) }}
          </AvatarFallback>
        </Avatar>
        <div class="min-w-0 flex-1">
          <p class="text-sm font-medium text-foreground truncate leading-tight">
            {{ auth.user?.name ?? 'Usuário' }}
          </p>
        </div>
        <RouterLink
          :to="{ name: ROUTES.SETTINGS }"
          class="shrink-0 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors duration-150"
          @click="emit('navigate')"
        >
          <Settings :size="16" />
        </RouterLink>
      </div>

      <!-- Avatar only (collapsed) -->
      <div v-else class="flex justify-center px-2 py-3">
        <Avatar class="h-8 w-8">
          <AvatarFallback class="text-xs font-medium bg-primary/20 text-primary">
            {{ initials(auth.user?.name) }}
          </AvatarFallback>
        </Avatar>
      </div>

    </div>
  </aside>
</template>
