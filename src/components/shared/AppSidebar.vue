<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { ROUTES } from '@/constants/routes'
import { ScrollArea } from '@ui/scroll-area'
import { Avatar, AvatarFallback } from '@ui/avatar'
import {
  LayoutDashboard,
  CheckSquare,
  Flame,
  Target,
  CalendarDays,
  Wallet,
  BarChart3,
  FileText,
  BookOpen,
  Bookmark,
  ShoppingCart,
  Lock,
  Settings,
  Search,
  Plus,
  Moon,
  Sun,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronDown,
  ArrowUpDown,
  Landmark,
  CreditCard,
  PieChart,
  Tag,
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
const ALL_NAV_SECTIONS = [
  {
    label: 'PRODUTIVIDADE',
    items: [
      { label: 'Dashboard', icon: LayoutDashboard, route: ROUTES.DASHBOARD, shortcut: 'G D', module: null },
      { label: 'Tarefas', icon: CheckSquare, route: ROUTES.TASKS, shortcut: 'G T', module: 'tasks' },
      { label: 'Hábitos', icon: Flame, route: ROUTES.HABITS, shortcut: 'G H', module: 'habits' },
      { label: 'Metas', icon: Target, route: ROUTES.GOALS, shortcut: 'G M', module: 'goals' },
      { label: 'Agenda', icon: CalendarDays, route: ROUTES.CALENDAR, shortcut: 'G A', module: 'calendar' },
      { label: 'Finanças', icon: Wallet, route: ROUTES.FINANCE, shortcut: 'G F', module: null, children: FINANCE_CHILDREN },
      { label: 'Relatórios', icon: BarChart3, route: ROUTES.REPORTS, shortcut: 'G R', module: null },
    ],
  },
  {
    label: 'PESSOAL',
    items: [
      { label: 'Notas', icon: FileText, route: ROUTES.NOTES, shortcut: 'G N', module: 'notes' },
      { label: 'Daily Log', icon: BookOpen, route: ROUTES.DAILY_LOG, shortcut: 'G L', module: 'daily_log' },
      { label: 'Bookmarks', icon: Bookmark, route: ROUTES.BOOKMARKS, shortcut: 'G B', module: 'bookmarks' },
      { label: 'Compras', icon: ShoppingCart, route: ROUTES.PURCHASES, shortcut: 'G C', module: 'purchases' },
      { label: 'Cofre', icon: Lock, route: ROUTES.VAULT, shortcut: 'G V', module: 'vault' },
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

// Child active: ROUTES.FINANCE needs exact match (it's a prefix of all finance routes)
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
    class="flex flex-col h-full transition-[width] duration-300 ease-in-out overflow-hidden"
    :class="open ? 'w-56' : 'w-[52px]'"
    :style="{
      backgroundColor: 'hsl(var(--sidebar))',
      borderRight: '1px solid hsl(var(--sidebar-border))',
    }"
  >
    <!-- ─── Logo ─────────────────────────────────────────────── -->
    <div
      class="flex items-center h-[52px] px-3 shrink-0"
      :style="{ borderBottom: '1px solid hsl(var(--sidebar-border))' }"
    >
      <div v-if="open" class="flex items-center gap-2 flex-1 min-w-0">
        <span class="text-[15px] font-semibold text-foreground tracking-tight select-none">Vault</span>
        <span
          class="text-[9px] font-medium tracking-widest uppercase leading-none px-1 py-0.5 rounded border select-none"
          style="color: hsl(var(--muted-foreground) / 0.4); border-color: hsl(var(--border))"
        >Beta</span>
      </div>
      <div v-else class="w-full flex justify-center">
        <span class="text-[14px] font-bold text-foreground select-none">V</span>
      </div>
      <button
        class="shrink-0 p-1 rounded transition-base"
        style="color: hsl(var(--muted-foreground) / 0.3)"
        :class="open ? 'ml-1' : 'hidden'"
        @click="emit('toggle')"
        @mouseenter="($event.currentTarget as HTMLElement).style.color = 'hsl(var(--muted-foreground) / 0.6)'"
        @mouseleave="($event.currentTarget as HTMLElement).style.color = 'hsl(var(--muted-foreground) / 0.3)'"
      >
        <PanelLeftClose :size="14" />
      </button>
    </div>

    <!-- ─── Search + Quick add ────────────────────────────────── -->
    <div class="px-2 pt-2.5 pb-1 space-y-0.5 shrink-0">
      <template v-if="open">
        <button
          class="flex items-center gap-2 w-full px-2.5 py-[7px] rounded-md text-left transition-base"
          style="color: hsl(var(--muted-foreground) / 0.5)"
          @click="emit('search')"
          @mouseenter="($event.currentTarget as HTMLElement).style.cssText += '; background: hsl(var(--foreground) / 0.04); color: hsl(var(--muted-foreground) / 0.8)'"
          @mouseleave="($event.currentTarget as HTMLElement).style.cssText += '; background: transparent; color: hsl(var(--muted-foreground) / 0.5)'"
        >
          <Search :size="13" class="shrink-0" />
          <span class="flex-1 text-[12.5px]">Buscar...</span>
          <kbd class="text-[10px] font-mono" style="color: hsl(var(--muted-foreground) / 0.25)">{{ searchShortcut }}</kbd>
        </button>
        <button
          class="flex items-center gap-2 w-full px-2.5 py-[7px] rounded-md text-left transition-base"
          style="color: hsl(var(--muted-foreground) / 0.5)"
          @click="emit('quickAdd')"
          @mouseenter="($event.currentTarget as HTMLElement).style.cssText += '; background: hsl(var(--foreground) / 0.04); color: hsl(var(--muted-foreground) / 0.8)'"
          @mouseleave="($event.currentTarget as HTMLElement).style.cssText += '; background: transparent; color: hsl(var(--muted-foreground) / 0.5)'"
        >
          <Plus :size="13" class="shrink-0" />
          <span class="flex-1 text-[12.5px]">Quick add</span>
          <kbd class="text-[10px] font-mono" style="color: hsl(var(--muted-foreground) / 0.25)">N</kbd>
        </button>
      </template>
      <template v-else>
        <button
          class="flex justify-center w-full p-2 rounded-md transition-base"
          style="color: hsl(var(--muted-foreground) / 0.4)"
          @click="emit('search')"
          @mouseenter="($event.currentTarget as HTMLElement).style.cssText += '; background: hsl(var(--foreground) / 0.04); color: hsl(var(--muted-foreground) / 0.7)'"
          @mouseleave="($event.currentTarget as HTMLElement).style.cssText += '; background: transparent; color: hsl(var(--muted-foreground) / 0.4)'"
        >
          <Search :size="14" />
        </button>
        <button
          class="flex justify-center w-full p-2 rounded-md transition-base"
          style="color: hsl(var(--muted-foreground) / 0.4)"
          @click="emit('quickAdd')"
          @mouseenter="($event.currentTarget as HTMLElement).style.cssText += '; background: hsl(var(--foreground) / 0.04); color: hsl(var(--muted-foreground) / 0.7)'"
          @mouseleave="($event.currentTarget as HTMLElement).style.cssText += '; background: transparent; color: hsl(var(--muted-foreground) / 0.4)'"
        >
          <Plus :size="14" />
        </button>
      </template>
    </div>

    <!-- ─── Navigation ────────────────────────────────────────── -->
    <ScrollArea class="flex-1 overflow-hidden">
      <nav class="px-2 pb-2">
        <template v-for="section in navSections" :key="section.label">
          <div v-if="open" class="mt-4 mb-1 px-2.5">
            <span
              class="text-[9.5px] font-semibold tracking-[0.12em] uppercase select-none"
              style="color: hsl(var(--muted-foreground) / 0.38)"
            >{{ section.label }}</span>
          </div>
          <div v-else class="mt-3 mb-1 mx-2" style="border-top: 1px solid hsl(var(--sidebar-border))" />

          <template v-for="item in section.items" :key="item.route">

            <!-- ── Group item (Finance) ──────────────────────── -->
            <template v-if="'children' in item && item.children">

              <!-- Expanded: group header button -->
              <button
                v-if="open"
                type="button"
                class="group flex items-center gap-2 w-full px-2 h-7 rounded mb-px transition-base text-[13px]"
                :style="isOnFinance
                  ? 'background: hsl(var(--foreground) / 0.04); color: hsl(var(--foreground))'
                  : 'color: hsl(var(--muted-foreground) / 0.65)'"
                @click="financeGroupOpen = !financeGroupOpen"
                @mouseenter="(e) => { if (!isOnFinance) { (e.currentTarget as HTMLElement).style.background = 'hsl(var(--foreground) / 0.04)'; (e.currentTarget as HTMLElement).style.color = 'hsl(var(--foreground))' } }"
                @mouseleave="(e) => { if (!isOnFinance) { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'hsl(var(--muted-foreground) / 0.65)' } }"
              >
                <component :is="item.icon" :size="15" class="shrink-0" />
                <span class="flex-1 truncate text-left">{{ item.label }}</span>
                <ChevronDown
                  :size="12"
                  class="shrink-0 transition-transform duration-200"
                  :class="financeGroupOpen ? 'rotate-180' : ''"
                />
              </button>

              <!-- Expanded: subitems -->
              <template v-if="open && financeGroupOpen">
                <RouterLink
                  v-for="child in item.children"
                  :key="child.route"
                  :to="{ name: child.route }"
                  class="group flex items-center gap-2 h-7 rounded mb-px transition-base text-[13px]"
                  style="padding-left: 28px; padding-right: 8px"
                  :style="isChildActive(child.route)
                    ? { background: 'hsl(var(--foreground) / 0.04)', color: 'hsl(var(--foreground))' }
                    : { color: 'hsl(var(--muted-foreground) / 0.55)' }"
                  @click="emit('navigate')"
                  @mouseenter="(e) => { if (!isChildActive(child.route)) { (e.currentTarget as HTMLElement).style.background = 'hsl(var(--foreground) / 0.04)'; (e.currentTarget as HTMLElement).style.color = 'hsl(var(--foreground))' } }"
                  @mouseleave="(e) => { if (!isChildActive(child.route)) { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'hsl(var(--muted-foreground) / 0.55)' } }"
                >
                  <component :is="child.icon" :size="14" class="shrink-0" />
                  <span class="flex-1 truncate">{{ child.label }}</span>
                </RouterLink>
              </template>

              <!-- Collapsed: parent icon links to root finance route -->
              <RouterLink
                v-if="!open"
                :to="{ name: item.route }"
                class="flex justify-center w-full p-2 rounded-md transition-base mb-px"
                :style="isOnFinance
                  ? { background: 'hsl(var(--foreground) / 0.04)', color: 'hsl(var(--foreground))' }
                  : { color: 'hsl(var(--muted-foreground) / 0.65)' }"
                @click="emit('navigate')"
                @mouseenter="(e) => { if (!isOnFinance) { (e.currentTarget as HTMLElement).style.background = 'hsl(var(--foreground) / 0.04)'; (e.currentTarget as HTMLElement).style.color = 'hsl(var(--foreground))' } }"
                @mouseleave="(e) => { if (!isOnFinance) { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'hsl(var(--muted-foreground) / 0.65)' } }"
              >
                <component :is="item.icon" :size="15" />
              </RouterLink>
            </template>

            <!-- ── Regular item ────────────────────────────────── -->
            <RouterLink
              v-else
              :to="{ name: item.route }"
              class="group flex items-center gap-2 px-2 h-7 rounded mb-px transition-base"
              :class="[open ? 'text-[13px]' : 'justify-center']"
              :style="isActive(item.route)
                ? 'background: hsl(var(--foreground) / 0.04); color: hsl(var(--foreground))'
                : 'color: hsl(var(--muted-foreground) / 0.65)'"
              @click="emit('navigate')"
              @mouseenter="(e) => { if (!isActive(item.route)) { (e.currentTarget as HTMLElement).style.background = 'hsl(var(--foreground) / 0.04)'; (e.currentTarget as HTMLElement).style.color = 'hsl(var(--foreground))' } }"
              @mouseleave="(e) => { if (!isActive(item.route)) { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'hsl(var(--muted-foreground) / 0.65)' } }"
            >
              <component :is="item.icon" :size="15" class="shrink-0" />
              <span v-if="open" class="flex-1 truncate">{{ item.label }}</span>
              <span
                v-if="open && item.shortcut"
                class="text-[9.5px] font-mono tabular-nums shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                :style="isActive(item.route)
                  ? 'color: hsl(var(--muted-foreground) / 0.45)'
                  : 'color: hsl(var(--muted-foreground) / 0.35)'"
              >{{ item.shortcut }}</span>
            </RouterLink>
          </template>
        </template>
      </nav>
    </ScrollArea>

    <!-- ─── Footer ────────────────────────────────────────────── -->
    <div
      class="px-2 pb-3 pt-2 shrink-0 space-y-1"
      :style="{ borderTop: '1px solid hsl(var(--sidebar-border))' }"
    >
      <button
        v-if="open"
        class="flex items-center gap-2 w-full px-2.5 py-[7px] rounded-md transition-base"
        style="color: hsl(var(--muted-foreground) / 0.4)"
        @click="ui.toggleTheme()"
        @mouseenter="($event.currentTarget as HTMLElement).style.cssText += '; background: hsl(var(--foreground) / 0.04); color: hsl(var(--muted-foreground) / 0.7)'"
        @mouseleave="($event.currentTarget as HTMLElement).style.cssText += '; background: transparent; color: hsl(var(--muted-foreground) / 0.4)'"
      >
        <Moon v-if="ui.theme === 'dark'" :size="13" class="shrink-0" />
        <Sun v-else :size="13" class="shrink-0" />
        <span class="flex-1 text-[12.5px] text-left">Aparência</span>
        <span class="text-[11px]" style="color: hsl(var(--muted-foreground) / 0.28)">
          {{ ui.theme === 'dark' ? 'Escuro' : 'Claro' }}
        </span>
      </button>
      <button
        v-if="!open"
        class="flex justify-center w-full p-2 rounded-md mb-1 transition-base"
        style="color: hsl(var(--muted-foreground) / 0.3)"
        @click="emit('toggle')"
        @mouseenter="($event.currentTarget as HTMLElement).style.cssText += '; background: hsl(var(--foreground) / 0.04); color: hsl(var(--muted-foreground) / 0.6)'"
        @mouseleave="($event.currentTarget as HTMLElement).style.cssText += '; background: transparent; color: hsl(var(--muted-foreground) / 0.3)'"
      >
        <PanelLeftOpen :size="14" />
      </button>
      <div v-if="open" class="flex items-center gap-2.5 px-2.5 py-1.5 rounded-md">
        <Avatar class="h-6 w-6 shrink-0">
          <AvatarFallback class="text-[9px] font-semibold" style="background: hsl(var(--primary) / 0.15); color: hsl(var(--primary))">
            {{ initials(auth.user?.name) }}
          </AvatarFallback>
        </Avatar>
        <div class="min-w-0 flex-1">
          <p class="text-[12px] font-medium leading-tight truncate" style="color: hsl(var(--foreground) / 0.75)">
            {{ auth.user?.name ?? 'Usuário' }}
          </p>
          <p class="text-[10.5px] leading-tight truncate" style="color: hsl(var(--muted-foreground) / 0.35)">
            {{ auth.user?.email ?? '' }}
          </p>
        </div>
      </div>
      <div v-else class="flex justify-center px-2">
        <Avatar class="h-6 w-6">
          <AvatarFallback class="text-[9px] font-semibold" style="background: hsl(var(--primary) / 0.15); color: hsl(var(--primary))">
            {{ initials(auth.user?.name) }}
          </AvatarFallback>
        </Avatar>
      </div>
    </div>
  </aside>
</template>
