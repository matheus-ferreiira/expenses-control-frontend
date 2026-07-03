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

Dark frio zinc **near-black premium** (jul/2026). **Paleta FECHADA — 4 cores sólidas, ZERO opacidade (`/N`):**

| Cor | Hex | Token / classe | Papel |
|-----|-----|----------------|-------|
| Preto | `#09090b` | `--background` / `bg-background` | fundo do sistema (+ sidebar) |
| Cinza escuro | `#18181b` | `--card` `--sheet` / `bg-card` | card / box / sheet (nível 1) |
| Cinza claro | `#27272a` | `--muted` `--popover` `--input` `--border` / `bg-muted` | box-em-box, controles, botões, hover, divisor (nível 2) |
| Verde | `#34d399` | `--primary` `--success` / `bg-primary` | ação, seleção, foco, success |

Exceções funcionais SÓLIDAS (nunca `/N`, nunca decorativas): `--destructive` #FF6F5C (excluir/despesa), `--warning` #F5A623 (alerta).
Texto: 2 níveis sólidos — `text-foreground` (#E4E4E7) e `text-muted-foreground` (#A1A1AA). Sem `/50`,`/60`,`/70`.
**`--primary-foreground` é PRETO** — botões `bg-primary` usam `text-primary-foreground`, nunca `text-white`.

**A fonte de verdade canônica das regras de design é o CLAUDE.md da RAIZ do monorepo** (paleta, filosofia de bordas, seleção, tipografia). `tokens.css` é a fonte de verdade dos valores. Este bloco é só um resumo.

Regras inegociáveis:
- **Zero opacidade `/N`** em cor — toda cor é sólida (escolher o token certo)
- **Sem borda em volta de box/card** — separação vem da cor de fundo (escada de cinza). Borda só como divisor interno sólido (`border-b border-border`)
- **Elevação por cor**, nunca por sombra/opacidade/borda
- Cor de módulo (`accent-*`) só em ícone/dot/gráfico, sólida, nunca em botão/CTA/seleção
- **Chip de ícone**: `size-9 rounded-lg grid place-items-center bg-muted text-accent-X` + lucide `:size="18"` — chip cinza sólido, cor do módulo só no ícone. Entidade com cor própria → cor dinâmica no ícone via `:style`

### Cores de identidade de módulo
Tarefas `accent-blue` #5CA8F5 · Hábitos `accent-orange` #FB923C · Agenda `accent-violet` #A78BFA ·
Preços `accent-cyan` #3ECFDB · Notas `accent-amber` #F5A623 · Bookmarks `accent-rose` #F472B6 ·
Compras `accent-lime` #A3D65C · Dashboard/Finanças/Metas = `primary`.

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
