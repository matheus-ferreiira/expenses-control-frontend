# Frontend Conventions — VaultOS

Convenções de código do frontend. Padrões visuais ficam em [`design-system.md`](design-system.md)
(referência: a tela **Visão Geral** de Finanças, `src/pages/finance/FinancePage.vue`).

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | Vue 3.5 + `<script setup lang="ts">` |
| Build | Vite 7 + @tailwindcss/vite + vite-plugin-pwa |
| Estado | Pinia 3 (Setup API) |
| Roteamento | Vue Router 4 |
| HTTP | Axios + envelope unwrapping |
| UI | shadcn-vue (reka-ui) |
| Estilos | Tailwind CSS v4 (tokens em `tokens.css`) |
| Ícones | lucide-vue-next |
| Formulários | vee-validate + zod |
| Gráficos | chart.js + vue-chartjs |
| Tipos | TypeScript 5.9 |

---

## Estrutura de Pastas

```
src/
├── assets/styles/    tokens.css (valores) + base.css (Tailwind v4, utilitários)
├── components/
│   ├── ui/           shadcn-vue (via npx shadcn-vue@latest add)
│   └── shared/       App shell e componentes usados por vários módulos
├── composables/      useXxx reutilizáveis entre módulos
├── constants/        ROUTES, API_ENDPOINTS, MODULES (typed const)
├── features/
│   └── <módulo>/     components/, composables/, types/, utils/, views/ — tudo que é de um módulo só
├── layouts/          AuthLayout, AppLayout
├── lib/              utils.ts (cn), icons.ts (findIcon)
├── pages/            Páginas roteáveis (uma por rota)
├── router/           index.ts + guards.ts + routes/
├── services/api/     client.ts (axios) + um arquivo por domínio
├── stores/           Pinia stores por domínio
├── types/            Interfaces TypeScript espelhando o backend
└── utils/            Helpers puros (date, currency, color)
```

Regra: o componente que só um módulo usa vai em `features/<módulo>/components/`. Só sobe para
`components/shared/` quando dois módulos usam.

---

## Nomenclatura

| Artefato | Padrão | Exemplo |
|---|---|---|
| Páginas (roteáveis) | `PascalCase + Page` | `FinancePage.vue` |
| Componentes | `PascalCase` | `MonthSummaryCard.vue` |
| Bottom sheets | `PascalCase + Sheet` | `BalanceDetailSheet.vue` |
| Composables | `use + camelCase` | `useHistoricalBalance.ts` |
| Stores (arquivo) | `camelCase` | `finance.ts` |
| Stores (função) | `use + PascalCase + Store` | `useFinanceStore()` |
| Services (arquivo) | `camelCase` | `finance.ts` |
| Services (objeto) | `camelCase + Api` | `financeApi` |
| Types/Interfaces | `PascalCase` | `interface Transaction {}` |
| Constantes | `UPPER_SNAKE_CASE` | `ROUTES.FINANCE` |
| Enums/Labels | `PascalCase + _LABELS` | `TASK_STATUS_LABELS` |

---

## Regras Absolutas

### Componentes
- **Sempre** `<script setup lang="ts">` — nunca Options API
- Props: `defineProps<{ ... }>()` (com `withDefaults` quando houver padrão)
- Emits: `defineEmits<{ eventName: [payload: Type] }>()`
- Nunca `any` — criar tipos explícitos
- Textos da interface em português; comentários de código curtos, explicando o porquê

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

### API Service Layer
```typescript
// Sempre usar o unwrap() helper
export const tasksApi = {
  list: (filters?: TaskFilters) =>
    client.get<PaginatedResponse<Task>>(API_ENDPOINTS.TASKS.BASE, { params: filters })
      .then(unwrap),
}
```

### Dados financeiros
- Totais, saldos e categorias vêm dos endpoints de relatório/saldo do backend. Não somar a lista
  paginada de transações no front.
- Ao trocar de mês ou filtro, descarte respostas atrasadas (compare com o valor pedido antes de aplicar).
- Datas locais: montar com `new Date(ano, mês - 1, dia)`; `new Date('2026-10-01')` é UTC e cai no dia anterior no Brasil.
- Moeda sempre com `formatCurrency()`; percentual decimal com `formatPercent()` (vírgula pt-BR).

### Barrel Exports
Todo diretório com múltiplos arquivos compartilhados precisa de `index.ts`:
```typescript
// src/components/shared/index.ts
export { default as PageHeader } from './PageHeader.vue'
```

---

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

---

## Design System

Resumo — o guia completo é [`design-system.md`](design-system.md):

| Token | Uso |
|---|---|
| `bg-background` | Fundo da página (`#09090b`) |
| `bg-card` | Cards e sheets (`#18181b`) |
| `bg-muted` | Caixa dentro do card, controles, trilho de barra (`#27272a`) |
| `border-border` | Só divisor interno |
| `text-foreground` / `text-muted-foreground` | Texto principal / secundário |
| `primary` / `success` | Verde `#34d399`: ação, seleção, positivo |
| `destructive` | `#FF6F5C`: despesa, negativo, excluir |
| `warning` | `#F5A623`: pendente, atenção |

Tema escuro é o padrão; existe um tema claro via classe `.light` no `<html>`.

---

## Atalhos de Teclado

`useKeyboardShortcut()` no AppLayout:

| Atalho | Destino / ação |
|---|---|
| `Ctrl/⌘ + K` | Paleta de comandos |
| `N` | Adicionar rápido (QuickAddDialog) |
| `G` → `D` | Dashboard (Hoje) |
| `G` → `F` | Finanças (Visão Geral) |
| `G` → `M` | Metas financeiras |
| `G` → `T` | Tarefas |
| `G` → `H` | Hábitos |
| `G` → `A` | Agenda |
| `G` → `R` | Relatórios |
| `G` → `C` | Compras |
| `G` → `N` | Notas |
| `G` → `B` | Bookmarks |
| `G` → `V` | Cofre |

---

## Adicionando Componentes shadcn-vue

```bash
npx shadcn-vue@latest add button
# O componente é copiado para src/components/ui/ — adicionar ao barrel src/components/ui/index.ts
```

---

## Tipos do Backend (Envelope)

```typescript
// Todos os endpoints retornam:
{ success: boolean, data: T, message: string, meta?: PaginationMeta }

// unwrap() em client.ts extrai o .data; unwrapPaginated() mantém o meta
// PaginatedResponse<T> adiciona meta com current_page, last_page, total, etc.
```

Valores em centavos vêm com sufixo `_cents` (cartões, faturas, conferência de saldo); o resto em reais.

---

## Checklist antes de commitar

- [ ] `npm run type-check` sem erros
- [ ] `npm run lint` sem erros
- [ ] `npm run build` sem erros
- [ ] `npm run test:unit` passando
- [ ] Mexeu numa tela de Finanças: `cypress/e2e/finance.cy.ts` passando (comando no `CLAUDE.md`)
- [ ] Nenhum `any` nos services/stores
- [ ] Props e emits tipados
- [ ] Tela nova/alterada segue a Visão Geral (`design-system.md`)
- [ ] **Documentação atualizada no mesmo commit** (`CLAUDE.md`, `README.md`, `docs/*`)
