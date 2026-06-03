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
│   ├── finance/            FinancePage, TransactionsPage, AccountsPage, CardsPage, MonthlyReportPage, YearlyReportPage
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

Dark mode por padrão. Fintech premium — verde esmeralda como primária. Sem azul ou roxo.

**Arquivo de tokens:** `src/assets/styles/tokens.css` — fonte única de verdade para todas as variáveis CSS.
**Referência visual completa:** `.tasks/vaultos_visual_reference.md`

⚠️ Os valores abaixo são verificados diretamente de `tokens.css` — não editar sem verificar o arquivo real.

| Token | Dark (padrão) | Light (.light) | Tailwind class |
|-------|--------------|----------------|----------------|
| `--background` | `0 0% 3%` (#080808) | `0 0% 98%` | `bg-background` |
| `--surface` / `--card` | `0 0% 7%` (#111111) | `0 0% 100%` | `bg-card` |
| `--sheet` | `0 0% 8.6%` (#161616) | `0 0% 99%` | — |
| `--popover` | `0 0% 10%` (#1a1a1a) | `0 0% 100%` | `bg-popover` |
| `--foreground` | `0 0% 94%` (#F0F0F0) | `222 47% 11%` | `text-foreground` |
| `--muted-foreground` | `0 0% 53%` (#888888) | `240 5% 46%` | `text-muted-foreground` |
| `--primary` | `162 100% 39%` (#00C896 — verde) | `162 80% 35%` | `bg-primary`, `text-primary` |
| `--primary-foreground` | `0 0% 0%` (#000000 — preto!) | `0 0% 98%` | `text-primary-foreground` |
| `--muted` | `0 0% 10%` (#1a1a1a) | `240 10% 96%` | `bg-muted` |
| `--border` | `0 0% 9%` (~#171717) | `240 6% 88%` | `border-border` |
| `--ring` | `162 100% 39%` (#00C896) | `162 80% 35%` | `outline-ring` |
| `--destructive` | `0 100% 65%` (#FF4D4D) | `0 85% 55%` | `text-destructive` |
| `--success` | `162 100% 39%` (#00C896 — = primary) | `162 80% 35%` | `text-success` |
| `--warning` | `38 90% 55%` (#F5A623) | `38 80% 52%` | `text-warning` |
| `--radius` | `0.5rem` (8px) | — | `rounded-lg` |

**Atenção:** `--primary-foreground` é PRETO em dark mode. Botões `bg-primary` usam `text-primary-foreground` (preto), não `text-white`.

Para alterar o design system, edite apenas `tokens.css`. O `base.css` não deve conter valores de cores.

## Referências canônicas de componente

Antes de criar qualquer componente visual, ler o canônico correspondente:

| Se criar | Ler primeiro |
|---|---|
| Card com dados/métricas | `src/features/finance/components/TransactionSummaryCard.vue` |
| Formulário em sheet | `src/features/finance/components/CreditCardFormDialog.vue` |
| Sheet de seleção | `src/components/shared/QuickAddDialog.vue` |
| Sheet de detalhe | `src/features/finance/components/TransactionDetailSheet.vue` |

## Padrão de KPI Visual — Card Único

**Regra:** Múltiplas métricas relacionadas devem usar **um card único** com valores internos, não múltiplos boxes separados.

```
┌──────────────────────────────────────────┐
│  RECEITAS      DESPESAS      SALDO       │
│  R$ 7.705      R$ 8.173    -R$ 468       │
│──────────────────────────────────────────│
│  [linha de contexto: saldo atual, etc.]  │
└──────────────────────────────────────────┘
```

**Componente de referência:** `TransactionSummaryCard.vue`
- Aceita `month`, `income`, `expenses`, `totalBalance`, `pendingIncome`, `pendingExpenses`
- Emite `prev`, `next`, `reset` para navegação de mês
- Inclui MonthNavigator integrado
- Linha de contexto dinâmica: "Saldo atual" (mês atual), "Saldo previsto" (mês futuro), "Saldo final do mês" (mês passado, calculado via API)
- **Cálculo de saldo histórico:** busca transações confirmadas após o mês e reverte do saldo atual

**Exceção:** máx 2 métricas com destaque individual direto (ex: Saldo Atual vs Saldo Previsto) podem usar 2 cards lado a lado.

**Não use** `grid grid-cols-2 gap-3` para múltiplos KPI boxes — consolide em 1 card.

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
