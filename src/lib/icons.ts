import {
  // Finance
  DollarSign, CreditCard, Wallet, PiggyBank, TrendingUp, TrendingDown,
  BarChart2, ShoppingCart, ShoppingBag, Receipt, Banknote, Landmark,
  // Food & Dining
  UtensilsCrossed, Coffee, Pizza, Apple, Beef, Wine, Beer, IceCream,
  // Transport
  Car, Bus, Train, Bike, Plane, Fuel,
  // Home
  Home, Sofa, Lamp, Wrench, BedDouble,
  // Health
  Heart, Activity, Stethoscope, Pill, Dumbbell, Brain,
  // Entertainment
  Film, Music, Gamepad2, Tv, BookOpen, Headphones,
  // Education
  GraduationCap, School, Pencil, BookMarked, FlaskConical,
  // Work & Productivity
  Briefcase, Laptop, Building2, Users, FolderOpen,
  // Personal
  User, Smile, Gift, Star, Sun, Moon,
  // Tech
  Smartphone, Wifi, Monitor, HardDrive, Cloud, Code,
  // Nature & Misc
  Leaf, Flower2, Globe, Zap, Flame, Trophy,
} from 'lucide-vue-next'
import type { Component } from 'vue'

export interface IconEntry {
  name: string
  component: Component
  label: string
}

export interface IconCategory {
  id: string
  label: string
  icons: IconEntry[]
}

export const ICON_CATEGORIES: IconCategory[] = [
  {
    id: 'finance',
    label: 'Finanças',
    icons: [
      { name: 'DollarSign',    component: DollarSign,    label: 'Dólar' },
      { name: 'CreditCard',    component: CreditCard,    label: 'Cartão' },
      { name: 'Wallet',        component: Wallet,        label: 'Carteira' },
      { name: 'PiggyBank',     component: PiggyBank,     label: 'Porquinho' },
      { name: 'TrendingUp',    component: TrendingUp,    label: 'Alta' },
      { name: 'TrendingDown',  component: TrendingDown,  label: 'Baixa' },
      { name: 'BarChart2',     component: BarChart2,     label: 'Gráfico' },
      { name: 'Banknote',      component: Banknote,      label: 'Nota' },
      { name: 'Landmark',      component: Landmark,      label: 'Banco' },
      { name: 'Receipt',       component: Receipt,       label: 'Recibo' },
    ],
  },
  {
    id: 'shopping',
    label: 'Compras',
    icons: [
      { name: 'ShoppingCart',  component: ShoppingCart,  label: 'Carrinho' },
      { name: 'ShoppingBag',   component: ShoppingBag,   label: 'Sacola' },
    ],
  },
  {
    id: 'food',
    label: 'Alimentação',
    icons: [
      { name: 'UtensilsCrossed', component: UtensilsCrossed, label: 'Restaurante' },
      { name: 'Coffee',          component: Coffee,          label: 'Café' },
      { name: 'Pizza',           component: Pizza,           label: 'Pizza' },
      { name: 'Apple',           component: Apple,           label: 'Fruta' },
      { name: 'Beef',            component: Beef,            label: 'Carne' },
      { name: 'Wine',            component: Wine,            label: 'Vinho' },
      { name: 'Beer',            component: Beer,            label: 'Cerveja' },
      { name: 'IceCream',        component: IceCream,        label: 'Sorvete' },
    ],
  },
  {
    id: 'transport',
    label: 'Transporte',
    icons: [
      { name: 'Car',   component: Car,   label: 'Carro' },
      { name: 'Bus',   component: Bus,   label: 'Ônibus' },
      { name: 'Train', component: Train, label: 'Trem' },
      { name: 'Bike',  component: Bike,  label: 'Bicicleta' },
      { name: 'Plane', component: Plane, label: 'Avião' },
      { name: 'Fuel',  component: Fuel,  label: 'Combustível' },
    ],
  },
  {
    id: 'home',
    label: 'Casa',
    icons: [
      { name: 'Home',      component: Home,      label: 'Casa' },
      { name: 'Sofa',      component: Sofa,      label: 'Sofá' },
      { name: 'Lamp',      component: Lamp,      label: 'Luminária' },
      { name: 'Wrench',    component: Wrench,    label: 'Ferramentas' },
      { name: 'BedDouble', component: BedDouble, label: 'Quarto' },
    ],
  },
  {
    id: 'health',
    label: 'Saúde',
    icons: [
      { name: 'Heart',       component: Heart,       label: 'Coração' },
      { name: 'Activity',    component: Activity,    label: 'Atividade' },
      { name: 'Stethoscope', component: Stethoscope, label: 'Médico' },
      { name: 'Pill',        component: Pill,        label: 'Medicamento' },
      { name: 'Dumbbell',    component: Dumbbell,    label: 'Academia' },
      { name: 'Brain',       component: Brain,       label: 'Mental' },
    ],
  },
  {
    id: 'entertainment',
    label: 'Lazer',
    icons: [
      { name: 'Film',       component: Film,       label: 'Cinema' },
      { name: 'Music',      component: Music,      label: 'Música' },
      { name: 'Gamepad2',   component: Gamepad2,   label: 'Games' },
      { name: 'Tv',         component: Tv,         label: 'TV' },
      { name: 'BookOpen',   component: BookOpen,   label: 'Livro' },
      { name: 'Headphones', component: Headphones, label: 'Fones' },
    ],
  },
  {
    id: 'education',
    label: 'Educação',
    icons: [
      { name: 'GraduationCap', component: GraduationCap, label: 'Formação' },
      { name: 'School',        component: School,        label: 'Escola' },
      { name: 'Pencil',        component: Pencil,        label: 'Escrita' },
      { name: 'BookMarked',    component: BookMarked,    label: 'Curso' },
      { name: 'FlaskConical',  component: FlaskConical,  label: 'Ciência' },
    ],
  },
  {
    id: 'work',
    label: 'Trabalho',
    icons: [
      { name: 'Briefcase',  component: Briefcase,  label: 'Trabalho' },
      { name: 'Laptop',     component: Laptop,     label: 'Computador' },
      { name: 'Building2',  component: Building2,  label: 'Empresa' },
      { name: 'Users',      component: Users,      label: 'Equipe' },
      { name: 'FolderOpen', component: FolderOpen, label: 'Pasta' },
    ],
  },
  {
    id: 'personal',
    label: 'Pessoal',
    icons: [
      { name: 'User',  component: User,  label: 'Pessoa' },
      { name: 'Smile', component: Smile, label: 'Feliz' },
      { name: 'Gift',  component: Gift,  label: 'Presente' },
      { name: 'Star',  component: Star,  label: 'Favorito' },
      { name: 'Sun',   component: Sun,   label: 'Sol' },
      { name: 'Moon',  component: Moon,  label: 'Lua' },
    ],
  },
  {
    id: 'tech',
    label: 'Tecnologia',
    icons: [
      { name: 'Smartphone', component: Smartphone, label: 'Celular' },
      { name: 'Monitor',    component: Monitor,    label: 'Monitor' },
      { name: 'Wifi',       component: Wifi,       label: 'Internet' },
      { name: 'HardDrive',  component: HardDrive,  label: 'HD' },
      { name: 'Cloud',      component: Cloud,      label: 'Nuvem' },
      { name: 'Code',       component: Code,       label: 'Código' },
    ],
  },
  {
    id: 'misc',
    label: 'Outros',
    icons: [
      { name: 'Leaf',    component: Leaf,    label: 'Natureza' },
      { name: 'Flower2', component: Flower2, label: 'Flor' },
      { name: 'Globe',   component: Globe,   label: 'Mundo' },
      { name: 'Zap',     component: Zap,     label: 'Energia' },
      { name: 'Flame',   component: Flame,   label: 'Fogo' },
      { name: 'Trophy',  component: Trophy,  label: 'Troféu' },
    ],
  },
]

export const ALL_ICONS: IconEntry[] = ICON_CATEGORIES.flatMap((c) => c.icons)

export function findIcon(name: string): IconEntry | undefined {
  return ALL_ICONS.find((i) => i.name === name)
}

export const ICON_PALETTE_COLORS = [
  '#8b5cf6',
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#ec4899',
  '#06b6d4',
  '#f97316',
  '#84cc16',
  '#6366f1',
  '#14b8a6',
  '#64748b',
] as const

export type IconPaletteColor = (typeof ICON_PALETTE_COLORS)[number]
