<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUiStore } from '@/stores/ui'
import { ROUTES } from '@/constants/routes'
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from '@ui/command'
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
} from 'lucide-vue-next'

const ui = useUiStore()
const router = useRouter()

const open = computed({
  get: () => ui.commandOpen,
  set: (v) => (ui.commandOpen = v),
})

const navGroups = [
  {
    heading: 'Produtividade',
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
    heading: 'Pessoal',
    items: [
      { label: 'Notas', icon: FileText, route: ROUTES.NOTES, shortcut: 'G N' },
      { label: 'Daily Log', icon: BookOpen, route: ROUTES.DAILY_LOG, shortcut: 'G L' },
      { label: 'Bookmarks', icon: Bookmark, route: ROUTES.BOOKMARKS, shortcut: 'G B' },
      { label: 'Compras', icon: ShoppingCart, route: ROUTES.PURCHASES, shortcut: 'G C' },
      { label: 'Cofre', icon: Lock, route: ROUTES.VAULT, shortcut: 'G V' },
    ],
  },
  {
    heading: 'Sistema',
    items: [
      { label: 'Configurações', icon: Settings, route: ROUTES.SETTINGS, shortcut: '' },
    ],
  },
]

function navigate(routeName: string) {
  ui.commandOpen = false
  router.push({ name: routeName })
}
</script>

<template>
  <CommandDialog v-model:open="open">
    <CommandInput placeholder="Buscar páginas e ações..." />
    <CommandList>
      <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
      <template v-for="(group, idx) in navGroups" :key="group.heading">
        <CommandSeparator v-if="idx > 0" />
        <CommandGroup :heading="group.heading">
          <CommandItem
            v-for="item in group.items"
            :key="item.route"
            :value="item.label"
            @select="navigate(item.route)"
          >
            <component :is="item.icon" :size="14" class="mr-2 text-muted-foreground shrink-0" />
            <span>{{ item.label }}</span>
            <span v-if="item.shortcut" class="ml-auto text-[10px] font-mono text-muted-foreground">
              {{ item.shortcut }}
            </span>
          </CommandItem>
        </CommandGroup>
      </template>
    </CommandList>
  </CommandDialog>
</template>
