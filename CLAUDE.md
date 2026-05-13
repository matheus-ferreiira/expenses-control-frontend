# CLAUDE.md — Frontend (Vue 3)

## Stack
- **Vue 3.5** (Composition API, `<script setup lang="ts">`) | **TypeScript 5.9** | **Pinia 3** | **Vue Router 4**
- Build: **Vite 7** + **@tailwindcss/vite** (Tailwind CSS v4)
- UI: **shadcn-vue** (reka-ui/radix-vue) | Ícones: **lucide-vue-next**
- HTTP: **Axios** com envelope unwrapping
- Testes: Vitest + Vue Test Utils + Cypress | Lint: ESLint + Prettier

## Estrutura Implementada

```
src/
├── assets/styles/
│   ├── tokens.css          Design tokens — todas as CSS custom properties (cores, radius)
│   └── base.css            Tailwind v4 entry point — importa tokens.css + @theme inline
├── components/
│   ├── ui/                 shadcn-vue components (npx shadcn-vue@latest add <name>)
│   └── shared/             AppSidebar, AppHeader
├── composables/
│   ├── useToast.ts         Toast state manager
│   ├── useDebounce.ts      Reactive debounce
│   ├── usePagination.ts    Pagination state + helpers
│   └── useKeyboardShortcut.ts  G+D/T/H/A/F/M/R navigation
├── constants/
│   ├── routes.ts           ROUTES typed const
│   └── api.ts              API_ENDPOINTS typed const
├── layouts/
│   ├── AuthLayout.vue      Centered card (login/register)
│   └── AppLayout.vue       Sidebar + Header + <RouterView>
├── lib/
│   └── utils.ts            cn() helper (clsx + tailwind-merge)
├── pages/
│   ├── auth/               LoginPage, RegisterPage, ForgotPasswordPage, ResetPasswordPage
│   ├── tasks/              TasksPage, TaskDetailPage
│   ├── habits/             HabitsPage, HabitDetailPage
│   ├── finance/            FinancePage, AccountsPage, CardsPage
│   ├── goals/              GoalsPage, GoalDetailPage
│   ├── calendar/           CalendarPage
│   ├── DashboardPage.vue
│   └── ReportsPage.vue
├── router/
│   ├── index.ts
│   ├── guards.ts           Auth guard + guest guard
│   └── routes/
│       ├── auth.ts         requiresGuest routes
│       └── app.ts          requiresAuth routes (nested in AppLayout)
├── services/api/
│   ├── client.ts           Axios instance + Bearer token + 401 redirect + unwrap()
│   ├── auth.ts             login, register, logout, me, forgot/reset
│   ├── tasks.ts            CRUD + archive/reorder + subtasks + labels
│   ├── habits.ts           CRUD + log/unlog/stats/heatmap/today
│   ├── finance.ts          accounts, cards, transactions, categories, reports
│   ├── goals.ts            CRUD + progress patch
│   ├── calendar.ts         CRUD + upcoming
│   └── dashboard.ts        aggregate dashboard
├── stores/
│   ├── auth.ts             token (localStorage), user, isAuthenticated
│   ├── ui.ts               sidebar open, global loading
│   ├── tasks.ts            + pendingTasks/overdueTasks computed
│   ├── habits.ts           + todayHabits, log/unlog
│   ├── finance.ts          accounts, cards, transactions, categories
│   ├── goals.ts            + activeGoals/completedGoals computed
│   └── calendar.ts         events + upcoming
├── types/
│   ├── api.ts              ApiResponse<T>, PaginatedResponse<T>, PaginationMeta
│   ├── auth.ts             User, LoginCredentials, RegisterPayload, AuthTokenResponse
│   ├── tasks.ts            Task, Subtask, TaskLabel, TaskStatus, TaskPriority + LABELS
│   ├── habits.ts           Habit, HabitLog, HabitStats, HabitFrequency + LABELS
│   ├── finance.ts          Transaction, BankAccount, CreditCard, Category + LABELS
│   ├── goals.ts            Goal, GoalType, GoalStatus + LABELS
│   └── calendar.ts         CalendarEvent, EventColor, EventSource
└── utils/
    ├── date.ts             formatDate, formatRelative, isOverdue, isToday, weekdayName
    └── currency.ts         formatCurrency (BRL), parseCurrency, formatPercent
```

## Path Aliases

```typescript
'@'           → src/
'@ui'         → src/components/ui/
'@shared'     → src/components/shared/
'@composables' → src/composables/
'@stores'     → src/stores/
'@services'   → src/services/
'@types'      → src/types/
'@utils'      → src/utils/
'@layouts'    → src/layouts/
'@pages'      → src/pages/
'@constants'  → src/constants/
'@lib'        → src/lib/
```

## Padrões Obrigatórios

### Composition API (sempre `<script setup lang="ts">`)
```vue
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useTaskStore } from '@stores/tasks'

const store = useTaskStore()
</script>
```

### Pinia Stores (Setup API)
```typescript
export const useTaskStore = defineStore('tasks', () => {
  const items = ref<Task[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchAll() {
    loading.value = true
    try { items.value = await tasksApi.list() }
    catch { error.value = 'Erro ao carregar tarefas' }
    finally { loading.value = false }
  }

  return { items, loading, error, fetchAll }
})
```

### API Service Layer (com unwrap)
```typescript
export const tasksApi = {
  list: (filters?: TaskFilters) =>
    client.get<PaginatedResponse<Task>>(API_ENDPOINTS.TASKS.BASE, { params: filters })
      .then(unwrap),

  create: (payload: CreateTaskPayload) =>
    client.post<ApiResponse<Task>>(API_ENDPOINTS.TASKS.BASE, payload).then(unwrap),
}
```

### Adicionando shadcn-vue components
```bash
npx shadcn-vue@latest add button card badge input dialog dropdown-menu separator avatar
# Componente é copiado para src/components/ui/
# Adicionar ao barrel src/components/ui/index.ts
```

### Nomenclatura
- Páginas: `PascalCase + Page` → `TasksPage.vue`
- Componentes: `PascalCase` → `TaskCard.vue`
- Composables: `use + camelCase` → `useToast.ts`
- Stores (arquivo): `camelCase` → `tasks.ts`
- Stores (função): `use + PascalCase + Store` → `useTaskStore()`
- Services: `camelCase + Api` → `tasksApi`
- Types: `PascalCase` → `interface Task {}`
- Constantes: `UPPER_SNAKE_CASE` → `ROUTES.TASKS`

## Comandos de Desenvolvimento

```bash
npm run dev            # servidor Vite
npm run build          # build produção
npm run preview        # preview do build
npm run test:unit      # Vitest
npm run test:e2e:dev   # Cypress em dev
npm run lint           # ESLint + fix
npm run type-check     # vue-tsc
npm run format         # Prettier
```

## Variáveis de Ambiente

```env
VITE_API_URL=http://localhost:8000
VITE_APP_NAME=Productivity Control
```

## Design System

Dark mode por padrão. Paleta violet/slate definida como CSS custom properties.

**Arquivo de tokens:** `src/assets/styles/tokens.css` — fonte única de verdade para todas as variáveis CSS.

| Token | Dark (padrão) | Light (.light) | Tailwind class |
|-------|--------------|----------------|----------------|
| `--primary` | `262 83% 58%` (violet) | `262 83% 58%` | `bg-primary` |
| `--background` | `222 47% 6%` (deep slate) | `0 0% 100%` (white) | `bg-background` |
| `--foreground` | `213 31% 91%` | `222 47% 11%` | `text-foreground` |
| `--card` | `222 47% 8%` | `0 0% 100%` | `bg-card` |
| `--secondary` | `217 33% 13%` | `210 40% 96%` | `bg-secondary` |
| `--muted` | `217 33% 13%` | `210 40% 96%` | `bg-muted` |
| `--accent` | `217 33% 15%` | `210 40% 96%` | `bg-accent` |
| `--destructive` | `0 63% 51%` (red) | `0 84% 60%` | `bg-destructive` |
| `--border` | `217 33% 12%` | `214 32% 91%` | `border-border` |
| `--ring` | `262 83% 58%` (violet) | `262 83% 58%` | `outline-ring` |
| `--success` | `142 71% 45%` (green) | — | `bg-success` |
| `--warning` | `38 92% 50%` (amber) | — | `bg-warning` |
| `--radius` | `0.5rem` (8px) | — | `rounded-lg` |

Para alterar o design system, edite apenas `tokens.css`. O `base.css` não deve conter valores de cores.

## Regras de Qualidade

- Sempre `lang="ts"` em `<script setup>`
- Nunca `any` — criar tipos explícitos
- Props: `defineProps<{...}>()`
- Emits: `defineEmits<{ event: [payload: Type] }>()`
- Barrel exports em todos os diretórios com múltiplos arquivos
- `npm run type-check` + `npm run build` antes de commitar

## Credenciais de Teste (Playwright)

Conta criada no banco local para validação visual com Playwright:

```
Email:  dev@vault.test
Senha:  VaultDev2026!
Nome:   Playwright Dev
```

Usar quando precisar acessar páginas protegidas (`requiresAuth`) no Playwright.
O `App.vue` chama `fetchMe()` no mount — token fake é limpo ao receber 401.
Com essa conta, o login via formulário funciona normalmente.
