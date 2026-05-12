# CLAUDE.md — Frontend (Vue 3)

## Stack
- **Vue 3** (Composition API) | **TypeScript** | **Pinia** | **Vue Router**
- Build: Vite | Testes: Vitest + Vue Test Utils + Cypress | Lint: ESLint + Prettier

## Estrutura Planejada

```
src/
├── assets/             Imagens, fontes, estilos globais
├── components/
│   ├── ui/             Componentes base (Button, Input, Modal, etc.)
│   └── [domain]/       Componentes específicos do domínio
├── composables/        useXxx hooks reutilizáveis
├── layouts/            AppLayout, AuthLayout, etc.
├── pages/              Views por rota
│   ├── auth/           Login, Register, ForgotPassword
│   ├── dashboard/      Dashboard principal
│   ├── tasks/          Tasks CRUD + kanban
│   ├── habits/         Habits + heatmap
│   ├── finance/        Finance + charts
│   ├── goals/          Goals + progress
│   └── calendar/       Calendar view
├── router/
│   └── index.ts        Rotas + navigation guards
├── services/
│   └── api/            Camada de comunicação com o backend
│       ├── client.ts   Axios instance + interceptors
│       ├── auth.ts
│       ├── tasks.ts
│       ├── habits.ts
│       ├── finance.ts
│       ├── goals.ts
│       └── calendar.ts
├── stores/             Pinia stores por domínio
│   ├── auth.ts
│   ├── tasks.ts
│   ├── habits.ts
│   ├── finance.ts
│   ├── goals.ts
│   └── calendar.ts
├── types/              TypeScript interfaces/types
│   └── api.ts          Response types espelhando o backend
└── utils/              Helpers, formatters, validators
```

## Padrões Obrigatórios

### Composition API (sempre `<script setup>`)
```vue
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useTaskStore } from '@/stores/tasks'

const store = useTaskStore()
// ...
</script>
```

### Pinia Stores
```typescript
// stores/tasks.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { tasksApi } from '@/services/api/tasks'

export const useTaskStore = defineStore('tasks', () => {
  const tasks = ref<Task[]>([])
  const loading = ref(false)
  
  const pendingTasks = computed(() => tasks.value.filter(t => t.status === 'pending'))
  
  async function fetchTasks(filters?: TaskFilters) {
    loading.value = true
    try {
      const response = await tasksApi.list(filters)
      tasks.value = response.data.data
    } finally {
      loading.value = false
    }
  }
  
  return { tasks, loading, pendingTasks, fetchTasks }
})
```

### API Service Layer
```typescript
// services/api/client.ts — Axios com interceptors de token e erro
// services/api/tasks.ts — funções específicas do domínio Tasks

import type { ApiResponse, PaginatedResponse } from '@/types/api'

export const tasksApi = {
  list: (filters?: TaskFilters) => 
    client.get<PaginatedResponse<Task>>('/v1/tasks', { params: filters }),
  
  create: (data: CreateTaskDto) => 
    client.post<ApiResponse<Task>>('/v1/tasks', data),
    
  // ...
}
```

### TypeScript Types (espelhar o backend)
```typescript
// types/api.ts
export interface ApiResponse<T> {
  success: boolean
  data: T
  message: string
  meta?: PaginationMeta
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: PaginationMeta
  links: PaginationLinks
}
```

### Nomenclatura
- Componentes: `PascalCase.vue`
- Composables: `useCamelCase.ts`
- Stores: `useCamelCaseStore` / arquivo `camelCase.ts`
- Types/interfaces: `PascalCase`
- Funções e variáveis: `camelCase`
- Constantes: `UPPER_SNAKE_CASE`

## Configuração de Prettier
```json
{
  "singleQuote": true,
  "semi": false,
  "printWidth": 100
}
```

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
VITE_API_URL=http://localhost:8000/api
VITE_APP_NAME=Productivity Control
```

## Regras de Qualidade

- Sempre `lang="ts"` em `<script setup>`
- Evitar `any` — criar tipos explícitos
- Props sempre tipadas com `defineProps<{...}>()`
- Emits sempre tipados com `defineEmits<{...}>()`
- Composables para lógica reutilizável (evitar duplicação entre pages)
- Testes unitários para composables e stores
