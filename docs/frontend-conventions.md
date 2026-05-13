# Frontend Conventions — Productivity Control

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | Vue 3.5 + `<script setup lang="ts">` |
| Build | Vite 7 + @tailwindcss/vite |
| Estado | Pinia 3 (Setup API) |
| Roteamento | Vue Router 4 |
| HTTP | Axios + envelope unwrapping |
| UI | shadcn-vue (reka-ui/radix-vue) |
| Estilos | Tailwind CSS v4 |
| Ícones | lucide-vue-next |
| Tipos | TypeScript 5.9 |

---

## Estrutura de Pastas

```
src/
├── assets/styles/    CSS global + design tokens
├── components/
│   ├── ui/           shadcn-vue components (via npx shadcn-vue@latest add)
│   └── shared/       App shell (AppSidebar, AppHeader) e componentes cross-domain
├── composables/      useXxx hooks reutilizáveis
├── constants/        ROUTES, API_ENDPOINTS (typed const)
├── layouts/          AuthLayout, AppLayout
├── lib/              utils.ts (cn helper)
├── pages/            Páginas roteáveis (uma por rota)
│   ├── auth/
│   ├── tasks/
│   ├── habits/
│   ├── finance/
│   ├── goals/
│   └── calendar/
├── router/           index.ts + guards.ts + routes/
├── services/api/     client.ts (axios) + módulos por domínio
├── stores/           Pinia stores por domínio
├── types/            Interfaces TypeScript espelhando o backend
└── utils/            Helpers puros (date, currency)
```

---

## Nomenclatura

| Artefato | Padrão | Exemplo |
|---|---|---|
| Páginas (roteáveis) | `PascalCase + Page` | `TasksPage.vue` |
| Componentes | `PascalCase` | `TaskCard.vue`, `AppSidebar.vue` |
| Composables | `use + camelCase` | `useToast.ts` |
| Stores (arquivo) | `camelCase` | `tasks.ts` |
| Stores (função) | `use + PascalCase + Store` | `useTaskStore()` |
| Services (arquivo) | `camelCase` | `tasks.ts` |
| Services (objeto) | `camelCase + Api` | `tasksApi` |
| Types/Interfaces | `PascalCase` | `interface Task {}` |
| Constantes | `UPPER_SNAKE_CASE` | `ROUTES.TASKS` |
| Enums/Labels | `PascalCase + _LABELS` | `TASK_STATUS_LABELS` |

---

## Regras Absolutas

### Componentes
- **Sempre** `<script setup lang="ts">` — nunca Options API
- Props: `defineProps<{ ... }>()`
- Emits: `defineEmits<{ eventName: [payload: Type] }>()`
- Nunca `any` — criar tipos explícitos

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

### Barrel Exports
Todo diretório com múltiplos arquivos precisa de `index.ts`:
```typescript
// src/stores/index.ts
export { useAuthStore } from './auth'
export { useTaskStore } from './tasks'
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

## Design System (Lovable Dark Theme)

Baseado em shadcn/ui + Tailwind CSS v4. Design tokens via CSS custom properties em HSL:

| Token | Uso |
|---|---|
| `bg-background` | Fundo da página |
| `bg-card` | Cards e painéis |
| `bg-muted` | Seções secundárias |
| `text-foreground` | Texto principal |
| `text-muted-foreground` | Texto secundário |
| `text-primary` | Acento (violeta) |
| `border-border` | Bordas |
| `bg-destructive` | Erros e ações destrutivas |

Dark mode é o padrão. Light mode disponível via classe `.light` no `<html>`.

---

## Keyboard Shortcuts (Lovable)

Ativados via `useKeyboardShortcut()` no AppLayout:

| Shortcut | Destino |
|---|---|
| `G` → `D` | Dashboard |
| `G` → `T` | Tarefas |
| `G` → `H` | Hábitos |
| `G` → `A` | Agenda (Calendar) |
| `G` → `F` | Finanças |
| `G` → `M` | Metas |
| `G` → `R` | Relatórios |

---

## Adicionando Componentes shadcn-vue

```bash
# Adicionar um componente
npx shadcn-vue@latest add button
npx shadcn-vue@latest add card badge input dialog dropdown-menu

# O componente é copiado para src/components/ui/
# Adicionar ao barrel src/components/ui/index.ts
```

---

## Tipos do Backend (Envelope)

```typescript
// Todos os endpoints retornam:
{ success: boolean, data: T, message: string, meta?: PaginationMeta }

// O unwrap() em client.ts extrai automaticamente o .data
// PaginatedResponse<T> adiciona meta com current_page, last_page, total, etc.
```

---

## Checklist antes de commitar

- [ ] `npm run type-check` sem erros
- [ ] `npm run lint` sem erros
- [ ] `npm run build` sem erros
- [ ] Nenhum `any` nos services/stores
- [ ] Props e emits tipados
- [ ] Barrel export atualizado se criou novo arquivo em diretório existente
