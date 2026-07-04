import type { Component } from 'vue'
import {
  Wallet,
  Tag,
  CheckSquare,
  Flame,
  CalendarDays,
  FileText,
  Bookmark,
  ShoppingCart,
  LayoutDashboard,
  BarChart3,
  Settings,
} from 'lucide-vue-next'
import { ROUTES } from './routes'

/**
 * Identidade visual de cada módulo — FONTE ÚNICA para ícone + cor.
 * A cor de módulo aparece APENAS em ícones/dots/gráficos (lei do design system);
 * botões, CTAs e seleção continuam sempre `primary`.
 */
export interface ModuleDef {
  /** Prefixo do nome de rota (route.name.startsWith) */
  prefix: string
  label: string
  /** Rota raiz do módulo */
  root: string
  icon: Component
  /** Classe de cor do ícone (text-accent-* ou text-primary) */
  colorClass: string
}

export const MODULES: ModuleDef[] = [
  { prefix: 'finance',   label: 'Finanças',  root: ROUTES.FINANCE,   icon: Wallet,          colorClass: 'text-primary' },
  { prefix: 'prices',    label: 'Preços',    root: ROUTES.PRICES,    icon: Tag,             colorClass: 'text-accent-cyan' },
  { prefix: 'task',      label: 'Tarefas',   root: ROUTES.TASKS,     icon: CheckSquare,     colorClass: 'text-accent-blue' },
  { prefix: 'habit',     label: 'Hábitos',   root: ROUTES.HABITS,    icon: Flame,           colorClass: 'text-accent-orange' },
  { prefix: 'calendar',  label: 'Agenda',    root: ROUTES.CALENDAR,  icon: CalendarDays,    colorClass: 'text-accent-violet' },
  { prefix: 'note',      label: 'Notas',     root: ROUTES.NOTES,     icon: FileText,        colorClass: 'text-accent-amber' },
  { prefix: 'bookmark',  label: 'Bookmarks', root: ROUTES.BOOKMARKS, icon: Bookmark,        colorClass: 'text-accent-rose' },
  { prefix: 'purchase',  label: 'Compras',   root: ROUTES.PURCHASES, icon: ShoppingCart,    colorClass: 'text-accent-lime' },
  { prefix: 'dashboard', label: 'Dashboard', root: ROUTES.DASHBOARD, icon: LayoutDashboard, colorClass: 'text-primary' },
  { prefix: 'reports',   label: 'Relatórios', root: ROUTES.REPORTS,  icon: BarChart3,       colorClass: 'text-primary' },
  { prefix: 'settings',  label: 'Configurações', root: ROUTES.SETTINGS, icon: Settings,     colorClass: 'text-muted-foreground' },
]

/** Módulo dono da rota atual (pelo prefixo do nome da rota) */
export function moduleForRoute(routeName: string): ModuleDef | undefined {
  return MODULES.find((m) => routeName.startsWith(m.prefix))
}
