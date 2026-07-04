<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { ROUTES } from '@/constants/routes'
import { ScrollArea } from '@ui/scroll-area'
import { Avatar, AvatarFallback } from '@ui/avatar'
import {
  LayoutDashboard, CheckSquare, Flame, CalendarDays,
  Wallet, FileText, Bookmark, ShoppingCart,
  Settings, Search, Plus, Moon, Sun,
  PanelLeftClose, PanelLeftOpen, ChevronDown, X,
  Landmark, CreditCard, PieChart, Tag, Flag,
  Package, ShoppingBag,
} from 'lucide-vue-next'

const props = withDefaults(defineProps<{ open: boolean; mobile?: boolean }>(), { mobile: false })
const emit = defineEmits<{
  toggle: []
  search: []
  quickAdd: []
  navigate: []
}>()

const route = useRoute()
const auth = useAuthStore()
const ui = useUiStore()

// ── Group open states ─────────────────────────────────────────────────────────
const openGroups = ref<Record<string, boolean>>({})

const isOnFinance = computed(() => String(route.name).startsWith('finance'))
const isOnTasks = computed(() => String(route.name).startsWith('task'))
const isOnPrices = computed(() => String(route.name).startsWith('prices'))

watch(isOnFinance, (val) => { if (val) openGroups.value[ROUTES.FINANCE] = true }, { immediate: true })
watch(isOnTasks, (val) => { if (val) openGroups.value[ROUTES.TASKS] = true }, { immediate: true })
watch(isOnPrices, (val) => { if (val) openGroups.value[ROUTES.PRICES] = true }, { immediate: true })

function isGroupOpen(routeKey: string): boolean {
  return openGroups.value[routeKey] ?? false
}
function toggleGroup(routeKey: string) {
  openGroups.value[routeKey] = !openGroups.value[routeKey]
}
function isGroupActive(routeKey: string): boolean {
  if (routeKey === ROUTES.FINANCE) return isOnFinance.value
  if (routeKey === ROUTES.TASKS) return isOnTasks.value
  if (routeKey === ROUTES.PRICES) return isOnPrices.value
  return false
}

// ── Child item types ──────────────────────────────────────────────────────────
interface NavChildItem {
  label: string
  icon?: typeof LayoutDashboard
  route: string
  viewKey?: string   // tasks: navigate to parent route + ?view=viewKey
  danger?: boolean
}

// Transações foi fundida na Visão Geral; Categorias é setup (acesso pelo menu "..." da Visão Geral)
const FINANCE_CHILDREN: NavChildItem[] = [
  { label: 'Visão Geral',  icon: LayoutDashboard, route: ROUTES.FINANCE },
  { label: 'Contas',       icon: Landmark,          route: ROUTES.FINANCE_ACCOUNTS },
  { label: 'Cartões',      icon: CreditCard,        route: ROUTES.FINANCE_CARDS },
  { label: 'Orçamento',    icon: PieChart,          route: ROUTES.FINANCE_BUDGET },
  { label: 'Metas',        icon: Flag,              route: ROUTES.FINANCE_GOALS },
  { label: 'Relatórios',   icon: PieChart,          route: ROUTES.FINANCE_REPORTS },
]

const PRICES_CHILDREN: NavChildItem[] = [
  { label: 'Visão Geral',   icon: LayoutDashboard, route: ROUTES.PRICES },
  { label: 'Registros',     icon: Tag,             route: ROUTES.PRICES_RECORDS },
  { label: 'Produtos',      icon: Package,         route: ROUTES.PRICES_PRODUCTS },
  { label: 'Minhas Compras', icon: ShoppingBag,    route: ROUTES.PRICES_PURCHASES },
]

const TASKS_CHILDREN: NavChildItem[] = [
  { label: 'Todas',      route: ROUTES.TASKS, viewKey: 'all' },
  { label: 'Hoje',       route: ROUTES.TASKS, viewKey: 'today' },
  { label: 'Próximas',   route: ROUTES.TASKS, viewKey: 'upcoming' },
  { label: 'Atrasadas',  route: ROUTES.TASKS, viewKey: 'overdue', danger: true },
  { label: 'Concluídas', route: ROUTES.TASKS, viewKey: 'completed' },
]

function isChildActive(child: NavChildItem): boolean {
  const name = String(route.name)
  if (child.viewKey) {
    if (!isOnTasks.value) return false
    const queryView = String(route.query.view ?? 'all')
    return queryView === child.viewKey
  }
  if (child.route === ROUTES.FINANCE || child.route === ROUTES.PRICES) return name === child.route
  return name === child.route || name.startsWith(child.route + '-')
}

function childTo(child: NavChildItem, parentRoute: string) {
  if (child.viewKey) {
    return { name: parentRoute, query: { view: child.viewKey } }
  }
  return { name: child.route }
}

// ── Nav sections ──────────────────────────────────────────────────────────────
interface NavItem {
  label: string
  icon: typeof LayoutDashboard
  route: string
  shortcut: string
  module: string | null
  children?: NavChildItem[]
}

interface NavSection {
  label: string | null
  items: NavItem[]
}

// Duas seções apenas: MÓDULOS (ordenados por frequência de uso) e SISTEMA.
// Labels de seção com item único (ex-"FINANÇAS" sobre "Finanças") eram ruído.
const ALL_NAV_SECTIONS: NavSection[] = [
  {
    label: null,
    items: [
      { label: 'Dashboard', icon: LayoutDashboard, route: ROUTES.DASHBOARD, shortcut: 'G D', module: null },
    ],
  },
  {
    label: 'MÓDULOS',
    items: [
      { label: 'Finanças', icon: Wallet,        route: ROUTES.FINANCE,   shortcut: 'G F', module: null, children: FINANCE_CHILDREN },
      { label: 'Preços',   icon: Tag,           route: ROUTES.PRICES,    shortcut: '',    module: null, children: PRICES_CHILDREN },
      { label: 'Tarefas',  icon: CheckSquare,   route: ROUTES.TASKS,     shortcut: 'G T', module: 'tasks', children: TASKS_CHILDREN },
      { label: 'Hábitos',  icon: Flame,         route: ROUTES.HABITS,    shortcut: 'G H', module: 'habits' },
      { label: 'Agenda',   icon: CalendarDays,  route: ROUTES.CALENDAR,  shortcut: 'G A', module: 'calendar' },
      { label: 'Notas',    icon: FileText,      route: ROUTES.NOTES,     shortcut: 'G N', module: 'notes' },
      { label: 'Bookmarks', icon: Bookmark,     route: ROUTES.BOOKMARKS, shortcut: 'G B', module: 'bookmarks' },
      { label: 'Compras',  icon: ShoppingCart,  route: ROUTES.PURCHASES, shortcut: 'G C', module: 'purchases' },
    ],
  },
  {
    label: 'SISTEMA',
    items: [
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

function initials(name?: string | null): string {
  if (!name) return '?'
  return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
}

const searchShortcut = typeof navigator !== 'undefined' && navigator.platform.includes('Mac')
  ? '⌘K'
  : 'Ctrl K'

const MOBILE_ICON_COLORS: Record<string, string> = {
  [ROUTES.DASHBOARD]: 'text-blue-400',
  [ROUTES.TASKS]:     'text-blue-400',
  [ROUTES.HABITS]:    'text-orange-400',
  [ROUTES.CALENDAR]:  'text-violet-400',
  [ROUTES.SETTINGS]:  'text-muted-foreground',
}
</script>

<template>
  <aside
    class="flex flex-col h-full bg-background transition-[width] duration-300 ease-in-out overflow-hidden"
    :class="props.mobile ? 'w-full' : (props.open ? 'w-56 border-r border-border' : 'w-[52px] border-r border-border')"
  >

    <!-- ─── Mobile header ─────────────────────────────────────── -->
    <div v-if="props.mobile" class="flex items-center justify-between px-5 pt-5 pb-4 shrink-0">
      <div class="flex items-center gap-2.5">
        <Avatar class="h-10 w-10 shrink-0">
          <AvatarFallback class="text-[13px] font-semibold bg-muted text-primary">
            {{ initials(auth.user?.name) }}
          </AvatarFallback>
        </Avatar>
        <div>
          <p class="text-[15px] font-semibold text-foreground leading-tight">
            {{ auth.user?.name ?? 'Usuário' }}
          </p>
          <p class="text-[12px] text-muted-foreground leading-tight">
            {{ auth.user?.email ?? '' }}
          </p>
        </div>
      </div>
      <button
        type="button"
        class="size-9 rounded-xl bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        @click="emit('toggle')"
      >
        <X :size="18" />
      </button>
    </div>

    <!-- ─── Desktop logo ─────────────────────────────────────── -->
    <div v-else class="flex items-center h-[52px] px-3 border-b border-border shrink-0">
      <div v-if="props.open" class="flex items-center gap-2 flex-1 min-w-0">
        <span class="text-[15px] font-semibold text-foreground tracking-tight select-none">Vault</span>
        <span class="text-[9px] font-medium tracking-widest uppercase leading-none px-1 py-0.5 rounded  select-none text-muted-foreground border-border">
          Beta
        </span>
      </div>
      <div v-else class="w-full flex justify-center">
        <span class="text-[14px] font-bold text-foreground select-none">V</span>
      </div>
      <button
        v-if="props.open"
        class="shrink-0 p-1 rounded text-muted-foreground hover:text-muted-foreground transition-colors duration-150 ml-1"
        @click="emit('toggle')"
      >
        <PanelLeftClose :size="14" />
      </button>
    </div>

    <!-- ─── Mobile search + quick add ─────────────────────────── -->
    <div v-if="props.mobile" class="px-4 pb-4 flex gap-2 shrink-0">
      <button
        class="flex-1 flex items-center gap-2.5 h-11 px-4 rounded-xl bg-muted text-[13px] text-muted-foreground hover:text-foreground transition-colors"
        @click="emit('search')"
      >
        <Search :size="15" class="shrink-0" />
        <span>Buscar...</span>
      </button>
      <button
        class="h-11 w-11 rounded-xl bg-primary flex items-center justify-center text-primary-foreground hover:opacity-90 transition-opacity shrink-0"
        @click="emit('quickAdd')"
      >
        <Plus :size="18" />
      </button>
    </div>

    <!-- ─── Desktop search + quick add ─────────────────────────── -->
    <div v-else class="px-2 pt-2.5 pb-1 space-y-0.5 shrink-0">
      <template v-if="props.open">
        <button
          class="flex items-center gap-2 w-full px-2.5 py-[7px] rounded-md transition-colors duration-150 text-muted-foreground hover:bg-muted hover:text-muted-foreground"
          @click="emit('search')"
        >
          <Search :size="13" class="shrink-0" />
          <span class="flex-1 text-[13px]">Buscar...</span>
          <kbd class="text-[10px] font-mono text-muted-foreground">{{ searchShortcut }}</kbd>
        </button>
        <button
          class="flex items-center gap-2 w-full px-2.5 py-[7px] rounded-md transition-colors duration-150 text-muted-foreground hover:bg-muted hover:text-muted-foreground"
          @click="emit('quickAdd')"
        >
          <Plus :size="13" class="shrink-0" />
          <span class="flex-1 text-[13px]">Quick add</span>
          <kbd class="text-[10px] font-mono text-muted-foreground">N</kbd>
        </button>
      </template>
      <template v-else>
        <button
          class="flex justify-center w-full p-2 rounded-md transition-colors duration-150 text-muted-foreground hover:bg-muted hover:text-muted-foreground"
          @click="emit('search')"
        >
          <Search :size="14" />
        </button>
        <button
          class="flex justify-center w-full p-2 rounded-md transition-colors duration-150 text-muted-foreground hover:bg-muted hover:text-muted-foreground"
          @click="emit('quickAdd')"
        >
          <Plus :size="14" />
        </button>
      </template>
    </div>

    <!-- ─── Navigation ────────────────────────────────────────── -->
    <ScrollArea class="flex-1 overflow-hidden">
      <nav :class="props.mobile ? 'px-3 pb-3' : 'px-2 pb-2'">
        <template v-for="(section, sectionIdx) in navSections" :key="sectionIdx">

          <!-- Section label (expanded) -->
          <div
            v-if="props.open && section.label"
            :class="props.mobile
              ? ['px-4 mb-1', sectionIdx > 0 ? 'mt-5' : '']
              : ['px-3 mb-1', sectionIdx > 0 ? 'mt-4' : '']"
          >
            <span
              :class="props.mobile
                ? 'text-[11px] font-medium text-muted-foreground uppercase tracking-widest'
                : 'text-[10px] font-medium text-muted-foreground uppercase tracking-widest'"
            >
              {{ section.label }}
            </span>
          </div>
          <!-- Section divider (collapsed desktop) -->
          <div v-else-if="!props.open && sectionIdx > 0" class="mt-3 mb-1 mx-2 border-t border-border" />

          <template v-for="item in section.items" :key="item.route">

            <!-- ── Expandable group ─────────────────────────────── -->
            <template v-if="item.children">

              <!-- Expanded: group header button -->
              <button
                v-if="props.open"
                type="button"
                class="group flex items-center w-full transition-colors duration-150 mb-0.5"
                :class="isGroupActive(item.route)
                  ? (props.mobile
                      ? 'bg-sidebar-accent pl-[10px] pr-4 py-3 border-l-2 border-primary text-foreground font-medium rounded-xl gap-3.5'
                      : 'bg-sidebar-accent pl-[10px] pr-3 py-2 border-l-2 border-primary text-foreground font-medium rounded-lg gap-3')
                  : (props.mobile
                      ? 'px-4 py-3 text-muted-foreground hover:bg-muted hover:text-foreground rounded-xl gap-3.5'
                      : 'px-3 py-2 text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg gap-3')"
                @click="toggleGroup(item.route)"
              >
                <component :is="item.icon" :size="props.mobile ? 20 : 18" class="shrink-0" />
                <span class="flex-1 truncate text-left" :class="props.mobile ? 'text-[14px]' : 'text-[13px]'">{{ item.label }}</span>
                <ChevronDown
                  :size="12"
                  class="shrink-0 transition-transform duration-200 text-muted-foreground"
                  :class="isGroupOpen(item.route) ? 'rotate-180' : ''"
                />
              </button>

              <!-- Expanded: subitems -->
              <template v-if="props.open && isGroupOpen(item.route)">
                <RouterLink
                  v-for="child in item.children"
                  :key="child.viewKey ?? child.route + child.label"
                  :to="childTo(child, item.route)"
                  class="flex items-center rounded-lg transition-colors duration-150 mb-0.5"
                  :class="[
                    props.mobile ? 'gap-2.5 pl-10 pr-4 py-2 text-[13px]' : 'gap-2 pl-9 pr-3 py-1.5 text-[12px]',
                    isChildActive(child)
                      ? 'text-primary font-medium'
                      : child.danger && !isChildActive(child)
                        ? 'text-destructive hover:bg-muted hover:text-destructive'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  ]"
                  @click="emit('navigate')"
                >
                  <component v-if="child.icon" :is="child.icon" :size="props.mobile ? 15 : 14" class="shrink-0" />
                  <span class="truncate">{{ child.label }}</span>
                </RouterLink>
              </template>

              <!-- Collapsed: icon only (desktop) -->
              <RouterLink
                v-if="!props.open"
                :to="{ name: item.route }"
                class="flex justify-center w-full p-2 rounded-lg transition-colors duration-150 mb-0.5"
                :class="isGroupActive(item.route)
                  ? 'bg-sidebar-accent text-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'"
                @click="emit('navigate')"
              >
                <component :is="item.icon" :size="18" />
              </RouterLink>
            </template>

            <!-- ── Regular nav item ────────────────────────────── -->
            <template v-else>

              <!-- Expanded -->
              <RouterLink
                v-if="props.open"
                :to="{ name: item.route }"
                class="group flex items-center transition-colors duration-150 mb-0.5"
                :class="isActive(item.route)
                  ? (props.mobile
                      ? 'bg-sidebar-accent pl-[10px] pr-4 py-3 border-l-2 border-primary text-foreground font-medium rounded-xl gap-3.5'
                      : 'bg-sidebar-accent pl-[10px] pr-3 py-2 border-l-2 border-primary text-foreground font-medium rounded-lg gap-3')
                  : (props.mobile
                      ? 'px-4 py-3 text-muted-foreground hover:bg-muted hover:text-foreground rounded-xl gap-3.5'
                      : 'px-3 py-2 text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg gap-3')"
                @click="emit('navigate')"
              >
                <component
                  :is="item.icon"
                  :size="props.mobile ? 20 : 18"
                  class="shrink-0"
                  :class="props.mobile
                    ? (isActive(item.route) ? (MOBILE_ICON_COLORS[item.route] ?? 'text-primary') : 'text-muted-foreground')
                    : ''"
                />
                <span class="flex-1 truncate" :class="props.mobile ? 'text-[14px]' : 'text-[13px]'">{{ item.label }}</span>
                <span
                  v-if="item.shortcut && !props.mobile"
                  class="text-[10px] font-mono text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                >{{ item.shortcut }}</span>
              </RouterLink>

              <!-- Collapsed (desktop only) -->
              <RouterLink
                v-else
                :to="{ name: item.route }"
                class="flex justify-center w-full p-2 rounded-lg transition-colors duration-150 mb-0.5"
                :class="isActive(item.route)
                  ? 'bg-sidebar-accent text-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'"
                @click="emit('navigate')"
              >
                <component :is="item.icon" :size="18" />
              </RouterLink>

            </template>

          </template>
        </template>
      </nav>
    </ScrollArea>

    <!-- ─── Mobile footer ───────────────────────────────────── -->
    <div v-if="props.mobile" class="px-4 pb-8 pt-3 border-t border-border mt-auto shrink-0">
      <button
        class="flex items-center gap-2.5 w-full py-2 text-muted-foreground hover:text-muted-foreground transition-colors"
        @click="ui.toggleTheme()"
      >
        <Moon v-if="ui.theme === 'dark'" :size="14" />
        <Sun v-else :size="14" />
        <span class="text-[12px]">
          {{ ui.theme === 'dark' ? 'Modo escuro' : 'Modo claro' }}
        </span>
      </button>
    </div>

    <!-- ─── Desktop footer ───────────────────────────────────── -->
    <div v-else class="border-t border-border shrink-0">

      <!-- Theme toggle (expanded) -->
      <button
        v-if="props.open"
        class="flex items-center gap-2 w-full px-3 py-2 text-muted-foreground hover:bg-muted hover:text-muted-foreground transition-colors duration-150"
        @click="ui.toggleTheme()"
      >
        <Moon v-if="ui.theme === 'dark'" :size="13" class="shrink-0" />
        <Sun v-else :size="13" class="shrink-0" />
        <span class="flex-1 text-[12px] text-left">Aparência</span>
        <span class="text-[10px] text-muted-foreground">
          {{ ui.theme === 'dark' ? 'Escuro' : 'Claro' }}
        </span>
      </button>

      <!-- Expand toggle (collapsed) -->
      <button
        v-if="!props.open"
        class="flex justify-center w-full p-2 text-muted-foreground hover:bg-muted hover:text-muted-foreground transition-colors duration-150 mt-1 mb-1"
        @click="emit('toggle')"
      >
        <PanelLeftOpen :size="14" />
      </button>

      <!-- User row (expanded) -->
      <div v-if="props.open" class="flex items-center gap-2.5 px-3 py-3">
        <Avatar class="h-8 w-8 shrink-0">
          <AvatarFallback class="text-[12px] font-medium bg-muted text-primary">
            {{ initials(auth.user?.name) }}
          </AvatarFallback>
        </Avatar>
        <div class="min-w-0 flex-1">
          <p class="text-[13px] font-medium text-foreground truncate leading-tight">
            {{ auth.user?.name ?? 'Usuário' }}
          </p>
        </div>
        <RouterLink
          :to="{ name: ROUTES.SETTINGS }"
          class="shrink-0 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors duration-150"
          @click="emit('navigate')"
        >
          <Settings :size="16" />
        </RouterLink>
      </div>

      <!-- Avatar only (collapsed) -->
      <div v-else class="flex justify-center px-2 py-3">
        <Avatar class="h-8 w-8">
          <AvatarFallback class="text-[11px] font-medium bg-muted text-primary">
            {{ initials(auth.user?.name) }}
          </AvatarFallback>
        </Avatar>
      </div>

    </div>
  </aside>
</template>
