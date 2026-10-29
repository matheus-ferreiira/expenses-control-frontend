# CLAUDE.md — Frontend (VaultOS, Vue 3)

SPA + PWA do VaultOS: finanças pessoais (módulo principal), tarefas, hábitos, agenda, notas,
bookmarks, preços e compras. API em `../expenses-control-backend`.

## Regra de documentação (obrigatória)

**Todo commit atualiza a documentação que ficou desatualizada por ele, no mesmo commit.**
Antes de commitar, confira:

- `CLAUDE.md` (este arquivo) — estrutura, padrões, comandos
- `docs/design-system.md` — padrões visuais (sempre que a Visão Geral ou um padrão visual mudar)
- `docs/frontend-conventions.md` — convenções de código
- `README.md` — módulos, rotas, instalação
- `../README.md` e `../CLAUDE.md` (pasta principal, fora do Git) — quando mudar algo do workspace
- Se o commit também mexe no backend: docs do backend (`../expenses-control-backend/CLAUDE.md`, `README.md`, `docs/`)

## Referência de design: a tela Visão Geral

**A tela Visão Geral de Finanças (`/finance`, `src/pages/finance/FinancePage.vue`) é a referência
de design, organização e visual do projeto.** Telas novas ou refeitas seguem os padrões dela.
Não existe outro site de referência; menções antigas a outro site estão obsoletas.

Guia completo: **[`docs/design-system.md`](docs/design-system.md)**. Resumo:

- **Mobile primeiro**, cards empilhados (`space-y-3`); no desktop, grid
  `lg:grid-cols-[400px_minmax(0,1fr)] xl:grid-cols-[440px_minmax(0,1fr)]` (resumo à esquerda, lista à direita).
- **Card:** `bg-card rounded-lg p-4`, sem borda e sem sombra. **Caixa interna:** `rounded-md bg-muted px-3 py-2 text-[12px]`.
- **Título de seção:** `text-[11px] font-semibold uppercase tracking-widest text-muted-foreground`.
- **Valores:** `formatCurrency()` + `tabular-nums` + `whitespace-nowrap`; destaque `text-[20px] font-semibold`.
- **Cores:** fundo `#09090b` → card `#18181b` → muted `#27272a`; `primary` verde `#34d399` (ação, seleção,
  positivo); `destructive` `#FF6F5C`; `warning` `#F5A623`. Texto sobre `bg-primary` é `text-primary-foreground` (preto).
- **Seleção:** toggle segmentado `bg-muted p-1` com opção ativa `bg-primary/15 text-primary font-semibold`;
  pílulas ativas `bg-primary text-primary-foreground`.
- **Superfícies sólidas.** Transparência só para seleção suave (`bg-primary/15`), hover (`hover:bg-muted/50`),
  fundo de ícone de categoria (cor + alfa), parte prevista de barra (`opacity-40`) e desabilitado.
- **Borda só como divisor interno** (`border-b border-border`, `divide-y divide-border`).
- **Cor de módulo** (`accent-*`, `constants/modules.ts`) só em ícone/dot/gráfico, nunca em botão ou seleção.
- **Detalhes e filtros em bottom sheet** (`rounded-t-2xl`, alça, `px-5`, ações `h-11` no rodapé).
- **Números do backend**, nunca somados da lista paginada. Nada baseado em ritmo diário.
- Textos curtos em português do dia a dia ("Nas contas", "No fim do mês", "Sobrou", "A confirmar").

Valores de cor: só em `src/assets/styles/tokens.css` (o `base.css` não define cores).

### Componentes de referência

| Se criar | Ler primeiro |
|---|---|
| Página com cards de resumo + lista | `src/pages/finance/FinancePage.vue` |
| Card com métricas | `src/features/finance/components/MonthSummaryCard.vue` |
| Card com lista e ação rápida | `src/features/finance/components/PendingThisWeekCard.vue` |
| Lista compacta (top N + "Ver todas") | `src/features/finance/components/CategoryBreakdownList.vue` |
| Lista agrupada / linha de item | `src/features/finance/components/TransactionList.vue`, `TransactionCard.vue` |
| Sheet de filtros | sheet "Filtros" em `FinancePage.vue` |
| Sheet de detalhe | `src/features/finance/components/TransactionDetailSheet.vue`, `BalanceDetailSheet.vue` |
| Formulário em sheet | `src/features/finance/components/TransactionFormDialog.vue`, `CreditCardFormDialog.vue` |
| Cabeçalho de página | `src/components/shared/PageHeader.vue` (`compact-mobile`) |

O antigo `TransactionSummaryCard.vue` foi removido; o card de métricas de referência é o `MonthSummaryCard.vue`.

## Stack

- **Vue 3.5** (`<script setup lang="ts">`) | **TypeScript 5.9** | **Pinia 3** (Setup API) | **Vue Router 4**
- Build: **Vite 7** + **@tailwindcss/vite** (Tailwind CSS v4) + **vite-plugin-pwa** (app instalável "VaultOS")
- UI: **shadcn-vue** (reka-ui) em `components/ui` | Ícones: **lucide-vue-next** | Toasts: **vue-sonner**
- Formulários: **vee-validate + zod** | Gráficos: **chart.js + vue-chartjs** | Drag: **vue-draggable-plus**
- HTTP: **Axios** com envelope unwrapping
- Testes: Vitest + Vue Test Utils + Cypress | Lint: ESLint + Prettier

## Estrutura

```
src/
├── assets/styles/
│   ├── tokens.css          Valores de cor/raio/motion (CSS custom properties, HSL)
│   └── base.css            Entrada do Tailwind v4: @theme inline + utilitários (col-label, num, animações)
├── components/
│   ├── ui/                 shadcn-vue (npx shadcn-vue@latest add <name>)
│   └── shared/             AppSidebar, CommandPalette, QuickAddDialog, PageHeader, AppPageContainer,
│                           AppBreadcrumbs, SectionHeader, EmptyState, LoadingState, ConfirmDialog, pickers…
├── composables/            useToast, useDebounce, usePagination, useKeyboardShortcut, usePwaUpdate,
│                           useTransactionFormLauncher
├── constants/              routes.ts (ROUTES), api.ts (API_ENDPOINTS), modules.ts (ícone + cor por módulo)
├── features/<módulo>/      components/, composables/, types/, utils/, views/ — código de cada módulo
│                           (auth, bookmarks, calendar, dashboard, finance, habits, notes, prices,
│                           purchases, reports, tasks)
├── layouts/                AuthLayout, AppLayout (sidebar desktop + barra inferior mobile + "+" global)
├── lib/                    utils.ts (cn), icons.ts (findIcon)
├── pages/                  Páginas roteáveis (finance/, prices/, tasks/, habits/, calendar/, notes/,
│                           purchases/, auth/, DashboardPage, ReportsPage, SettingsPage, VaultPage…)
├── router/                 index.ts, guards.ts, routes/auth.ts, routes/app.ts
├── services/api/           client.ts (axios + Bearer + 401 + unwrap) e um arquivo por domínio
├── stores/                 Pinia por domínio (finance, tasks, habits, calendar, notes, bookmarks, prices…)
├── types/                  Interfaces espelhando o backend
└── utils/                  date.ts, currency.ts (formatCurrency BRL), color.ts
```

### Módulo Finanças (principal)

| Tela | Rota | Página |
|---|---|---|
| **Visão Geral** (referência de design) | `/finance` | `pages/finance/FinancePage.vue` |
| Contas | `/finance/accounts` | `AccountsPage.vue` |
| Cartões | `/finance/cards` | `CardsPage.vue` |
| Orçamento | `/finance/budget` | `BudgetPage.vue` |
| Metas | `/finance/goals` | `GoalsPage.vue` |
| Categorias | `/finance/categories` | `CategoriesPage.vue` |
| Relatórios (mensal / anual) | `/finance/reports`, `/finance/reports/yearly` | `MonthlyReportPage.vue`, `YearlyReportPage.vue` |

`/finance/transactions` redireciona para a Visão Geral (a antiga tela Transações foi fundida nela).
No mobile, `FinanceSubNav` dá acesso a todas as telas do módulo em 1 toque; no desktop, a sidebar.

Conceitos usados nas telas:
- **Disponível × Guardado:** contas do tipo `investment` são reserva (caixinhas). Ficam fora de "Nas contas"
  e do saldo previsto, e aparecem à parte como "Guardado" (`store.availableBalance` / `store.reserveBalance`).
- **Modo do mês** (`past` / `current` / `future`): muda rótulos, cards visíveis e cálculos da Visão Geral.
- **Pendente × confirmado:** previsões (`status: pending`) são confirmadas com valor e data reais
  ("Paguei / Recebi", `ConfirmTransactionSheet`).
- **Cartões:** fatura a pagar, fatura aberta e limite livre vêm de `GET /finance/cards/{id}/overview`.
- **Saldo no fim do mês:** `GET /finance/balance/historical` (saldo + previstos − faturas que vencem até lá).

## Path Aliases

```typescript
'@' → src/   '@ui' → src/components/ui/   '@shared' → src/components/shared/
'@composables' '@stores' '@services' '@types' '@utils' '@layouts' '@pages' '@constants' '@lib'
```

## Padrões de código

### Composition API (sempre `<script setup lang="ts">`)
```vue
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useFinanceStore } from '@/stores/finance'

const store = useFinanceStore()
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
    client.get<PaginatedResponse<Task>>(API_ENDPOINTS.TASKS.BASE, { params: filters }).then(unwrap),
  create: (payload: CreateTaskPayload) =>
    client.post<ApiResponse<Task>>(API_ENDPOINTS.TASKS.BASE, payload).then(unwrap),
}
```

### Respostas fora de ordem
Ao trocar de mês/filtro, ignore respostas antigas: guarde o valor pedido e só aplique o resultado se ele
ainda for o atual (ver `loadCurrentMonthSummary` em `FinancePage.vue`).

### Adicionando shadcn-vue components
```bash
npx shadcn-vue@latest add <nome>   # copiado para src/components/ui/ — adicionar ao barrel index.ts
```

### Nomenclatura
- Páginas: `PascalCase + Page` → `TasksPage.vue`
- Componentes: `PascalCase` → `TaskCard.vue`
- Composables: `use + camelCase` → `useToast.ts`
- Stores: arquivo `camelCase` (`tasks.ts`), função `use + PascalCase + Store` (`useTaskStore()`)
- Services: `camelCase + Api` → `tasksApi`
- Types: `PascalCase` → `interface Task {}`
- Constantes: `UPPER_SNAKE_CASE` → `ROUTES.TASKS`

## Comandos

```bash
npm run dev            # Vite (local: npm run dev -- --host localhost --port 5176 --strictPort)
npm run build          # type-check + build de produção
npm run preview        # preview do build
npm run test:unit      # Vitest
npm run test:e2e:dev   # Cypress em dev
npm run lint           # ESLint + fix
npm run type-check     # vue-tsc
npm run format         # Prettier
```

## Variáveis de Ambiente

```env
# .env.local (desenvolvimento) — backend local
VITE_API_URL=http://localhost:8001
# .env (build de produção)
VITE_API_URL=https://vault-api.matheus-dev.com
```

`VITE_API_URL` é só o host: os caminhos em `constants/api.ts` já começam com `/api/v1`.

## Deploy

Imagem Docker (`Dockerfile`) com build Vite servido por nginx (`nginx.conf`). `nixpacks.toml` não é usado.
O PWA busca uma versão nova ao voltar para o app, ao ganhar foco, ao voltar a ficar online e a cada 5 minutos
(`usePwaUpdate`); a chamada à API nunca é cacheada.

## Regras de Qualidade

- Sempre `lang="ts"` em `<script setup>`; nunca `any`
- Props: `defineProps<{...}>()` · Emits: `defineEmits<{ event: [payload: Type] }>()`
- Barrel exports em diretórios com vários arquivos
- Antes de commitar: `npm run type-check`, `npm run lint`, `npm run build`, `npm run test:unit`
  **e a documentação atualizada** (ver topo deste arquivo)

## Credenciais de Teste (Playwright)

Conta no banco **local** para validação visual:

```
Email:  dev@vault.test
Senha:  VaultDev2026!
Nome:   Playwright Dev
```

O `App.vue` chama `fetchMe()` no mount — token falso é limpo ao receber 401.
