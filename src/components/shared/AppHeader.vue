<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { ROUTES } from '@/constants/routes'
import { Button } from '@ui/button'
import { Avatar, AvatarFallback } from '@ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@ui/dropdown-menu'
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@ui/command'
import {
  PanelLeftOpen,
  Search,
  LayoutDashboard,
  CheckSquare,
  Flame,
  CalendarDays,
  Wallet,
  Target,
  BarChart3,
  LogOut,
  Settings,
} from 'lucide-vue-next'

const auth = useAuthStore()
const ui = useUiStore()
const router = useRouter()

const commandOpen = ref(false)

const searchItems = [
  { label: 'Dashboard', icon: LayoutDashboard, route: ROUTES.DASHBOARD },
  { label: 'Tarefas', icon: CheckSquare, route: ROUTES.TASKS },
  { label: 'Hábitos', icon: Flame, route: ROUTES.HABITS },
  { label: 'Agenda', icon: CalendarDays, route: ROUTES.CALENDAR },
  { label: 'Finanças', icon: Wallet, route: ROUTES.FINANCE },
  { label: 'Metas', icon: Target, route: ROUTES.GOALS },
  { label: 'Relatórios', icon: BarChart3, route: ROUTES.REPORTS },
]

function initials(name?: string | null): string {
  if (!name) return '?'
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}

async function handleLogout() {
  await auth.logout()
  router.push({ name: ROUTES.LOGIN })
}

function navigateTo(routeName: string) {
  commandOpen.value = false
  router.push({ name: routeName })
}
</script>

<template>
  <header
    class="sticky top-0 z-30 flex items-center h-14 gap-3 px-4 border-b border-border bg-background/80 backdrop-blur-sm"
  >
    <!-- Sidebar toggle (shown when sidebar is collapsed) -->
    <Button
      v-if="!ui.sidebarOpen"
      variant="ghost"
      size="icon"
      class="h-8 w-8 shrink-0"
      @click="ui.toggleSidebar"
    >
      <PanelLeftOpen :size="16" />
    </Button>

    <!-- Search trigger -->
    <Button
      variant="outline"
      class="h-8 flex-1 max-w-xs justify-start gap-2 text-muted-foreground text-sm font-normal px-3"
      @click="commandOpen = true"
    >
      <Search :size="14" />
      <span>Buscar...</span>
      <kbd class="ml-auto text-[10px] font-mono text-muted-foreground/60 hidden sm:inline">⌘K</kbd>
    </Button>

    <div class="flex-1" />

    <!-- User menu -->
    <DropdownMenu>
      <DropdownMenuTrigger as-child>
        <Button variant="ghost" class="h-8 w-8 rounded-full p-0">
          <Avatar class="h-7 w-7">
            <AvatarFallback class="text-xs bg-primary/15 text-primary font-medium">
              {{ initials(auth.user?.name) }}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" class="w-48">
        <DropdownMenuLabel class="font-normal">
          <div class="flex flex-col gap-0.5">
            <span class="text-sm font-medium text-foreground">{{ auth.user?.name }}</span>
            <span class="text-xs text-muted-foreground truncate">{{ auth.user?.email }}</span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <Settings :size="14" class="mr-2" />
          Configurações
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem class="text-destructive focus:text-destructive" @click="handleLogout">
          <LogOut :size="14" class="mr-2" />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </header>

  <!-- Command palette -->
  <CommandDialog v-model:open="commandOpen">
    <CommandInput placeholder="Buscar páginas..." />
    <CommandList>
      <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
      <CommandGroup heading="Navegação">
        <CommandItem
          v-for="item in searchItems"
          :key="item.route"
          :value="item.label"
          @select="navigateTo(item.route)"
        >
          <component :is="item.icon" :size="15" class="mr-2 text-muted-foreground" />
          {{ item.label }}
        </CommandItem>
      </CommandGroup>
    </CommandList>
  </CommandDialog>
</template>
