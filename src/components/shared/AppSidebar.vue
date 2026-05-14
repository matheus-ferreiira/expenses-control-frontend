<script setup lang="ts">
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
} from 'lucide-vue-next'

defineProps<{ open: boolean }>()
const emit = defineEmits<{
  toggle: []
  search: []
  quickAdd: []
}>()

const route = useRoute()
const auth = useAuthStore()
const ui = useUiStore()

const navSections = [
  {
    label: 'PRODUTIVIDADE',
    items: [
      { label: 'Dashboard', icon: LayoutDashboard, route: ROUTES.DASHBOARD, shortcut: 'G D' },
      { label: 'Tarefas', icon: CheckSquare, route: ROUTES.TASKS, shortcut: 'G T' },
      { label: 'Hábitos', icon: Flame, route: ROUTES.HABITS, shortcut: 'G H' },
      { label: 'Metas', icon: Target, route: ROUTES.GOALS, shortcut: 'G M' },
      { label: 'Agenda', icon: CalendarDays, route: ROUTES.CALENDAR, shortcut: 'G A' },
      { label: 'Finanças', icon: Wallet, route: ROUTES.FINANCE, shortcut: 'G F' },
      { label: 'Relatórios', icon: BarChart3, route: ROUTES.REPORTS, shortcut: 'G R' },
    ],
  },
  {
    label: 'PESSOAL',
    items: [
      { label: 'Notas', icon: FileText, route: ROUTES.NOTES, shortcut: 'G N' },
      { label: 'Daily Log', icon: BookOpen, route: ROUTES.DAILY_LOG, shortcut: 'G L' },
      { label: 'Bookmarks', icon: Bookmark, route: ROUTES.BOOKMARKS, shortcut: 'G B' },
      { label: 'Compras', icon: ShoppingCart, route: ROUTES.PURCHASES, shortcut: 'G C' },
      { label: 'Cofre', icon: Lock, route: ROUTES.VAULT, shortcut: 'G V' },
    ],
  },
  {
    label: 'SISTEMA',
    items: [
      { label: 'Configurações', icon: Settings, route: ROUTES.SETTINGS, shortcut: '' },
    ],
  },
]

function isActive(routeName: string): boolean {
  const name = String(route.name)
  return name === routeName || name.startsWith(routeName + '-')
}

function initials(name?: string | null): string {
  if (!name) return '?'
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}

const searchShortcut = typeof navigator !== 'undefined' && navigator.platform.includes('Mac')
  ? '⌘K'
  : 'Ctrl K'
</script>

<template>
  <aside
    class="flex flex-col h-full transition-[width] duration-300 ease-in-out overflow-hidden"
    :class="open ? 'w-[220px]' : 'w-[52px]'"
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
        >
          Beta
        </span>
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
      <!-- expanded -->
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
          <kbd class="text-[10px] font-mono" style="color: hsl(var(--muted-foreground) / 0.25)">
            {{ searchShortcut }}
          </kbd>
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
      <!-- collapsed -->
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
          <!-- Section divider / label -->
          <div v-if="open" class="mt-4 mb-1 px-2.5">
            <span
              class="text-[9.5px] font-semibold tracking-[0.12em] uppercase select-none"
              style="color: hsl(var(--muted-foreground) / 0.28)"
            >
              {{ section.label }}
            </span>
          </div>
          <div
            v-else
            class="mt-3 mb-1 mx-2"
            style="border-top: 1px solid hsl(var(--sidebar-border))"
          />

          <!-- Items -->
          <RouterLink
            v-for="item in section.items"
            :key="item.route"
            :to="{ name: item.route }"
            class="group flex items-center gap-2.5 px-2.5 py-[6px] rounded-md mb-px transition-base"
            :class="[
              open ? 'text-[13px]' : 'justify-center',
              isActive(item.route)
                ? 'text-foreground font-medium'
                : 'font-normal',
            ]"
            :style="
              isActive(item.route)
                ? 'background: hsl(var(--foreground) / 0.04); color: hsl(var(--foreground))'
                : 'color: hsl(var(--muted-foreground) / 0.65)'
            "
            @mouseenter="
              (e) => {
                if (!isActive(item.route)) {
                  ;(e.currentTarget as HTMLElement).style.background =
                    'hsl(var(--foreground) / 0.04)'
                  ;(e.currentTarget as HTMLElement).style.color = 'hsl(var(--foreground))'
                }
              }
            "
            @mouseleave="
              (e) => {
                if (!isActive(item.route)) {
                  ;(e.currentTarget as HTMLElement).style.background = 'transparent'
                  ;(e.currentTarget as HTMLElement).style.color =
                    'hsl(var(--muted-foreground) / 0.65)'
                }
              }
            "
          >
            <component :is="item.icon" :size="15" class="shrink-0" />
            <span v-if="open" class="flex-1 truncate">{{ item.label }}</span>
            <span
              v-if="open && item.shortcut"
              class="text-[9.5px] font-mono tabular-nums shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
              :style="
                isActive(item.route)
                  ? 'color: hsl(var(--muted-foreground) / 0.45)'
                  : 'color: hsl(var(--muted-foreground) / 0.28)'
              "
            >
              {{ item.shortcut }}
            </span>
          </RouterLink>
        </template>
      </nav>
    </ScrollArea>

    <!-- ─── Footer ────────────────────────────────────────────── -->
    <div
      class="px-2 pb-3 pt-2 shrink-0 space-y-1"
      :style="{ borderTop: '1px solid hsl(var(--sidebar-border))' }"
    >
      <!-- Theme toggle -->
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

      <!-- Expand button (collapsed mode) -->
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

      <!-- User -->
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
