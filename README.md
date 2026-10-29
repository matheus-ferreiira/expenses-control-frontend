# VaultOS — Frontend

SPA Vue 3 (instalável como PWA) para finanças pessoais, tarefas, hábitos, agenda, notas, bookmarks,
preços e compras. Consome a API Laravel de [`../expenses-control-backend`](../expenses-control-backend/README.md).

**Referência de design:** a tela **Visão Geral** de Finanças (`/finance`). Veja
[`docs/design-system.md`](docs/design-system.md).

## Stack

| Tecnologia | Versão |
|-----------|--------|
| Vue | ^3.5 |
| TypeScript | ~5.9 |
| Vite | ^7 (+ vite-plugin-pwa) |
| Tailwind CSS | v4 (@tailwindcss/vite) |
| shadcn-vue / reka-ui | ^2.9 |
| Pinia | ^3.0 |
| Vue Router | ^4.6 |
| Chart.js / vue-chartjs | ^4.5 / ^5.3 |
| Vitest | ^4.0 |
| Cypress | ^15.8 |

## Pré-requisitos

- Node.js `^20.19` ou `>=22.12`
- Backend rodando (local: `http://localhost:8001`, ver `../README.md`)

## Instalação e execução

```bash
npm install
# .env.local → VITE_API_URL=http://localhost:8001
npm run dev -- --host localhost --port 5176 --strictPort
```

Acesse `http://localhost:5176/login`.

## Variáveis de Ambiente

| Arquivo | `VITE_API_URL` | Uso |
|---|---|---|
| `.env.local` | `http://localhost:8001` | desenvolvimento (tem prioridade no `npm run dev`) |
| `.env` | `https://vault-api.matheus-dev.com` | build de produção |

`VITE_API_URL` é só o host; os caminhos da API (`src/constants/api.ts`) já incluem `/api/v1`.

## Comandos

```bash
npm run dev            # Servidor de desenvolvimento (Vite)
npm run build          # type-check + build de produção
npm run preview        # Preview do build
npm run test:unit      # Testes unitários (Vitest)
npm run test:e2e       # Testes E2E (Cypress + build)
npm run test:e2e:dev   # Testes E2E em desenvolvimento
npm run type-check     # vue-tsc
npm run lint           # ESLint com auto-fix
npm run format         # Prettier
```

## Arquitetura

```
src/
├── assets/styles/     tokens.css (cores) + base.css (Tailwind v4)
├── components/
│   ├── ui/            shadcn-vue
│   └── shared/        App shell e componentes comuns (PageHeader, AppPageContainer, sheets…)
├── composables/       Lógica reutilizável (toast, atalhos, PWA, paginação…)
├── constants/         Rotas, endpoints e identidade dos módulos
├── features/<módulo>/ Componentes, composables, tipos e utils de cada módulo
├── layouts/           AppLayout, AuthLayout
├── pages/             Páginas roteáveis
├── router/            Vue Router + guards
├── services/api/      Integração com o backend
├── stores/            Pinia stores por domínio
├── types/             Interfaces TypeScript
└── utils/             Datas, moeda, cor
```

Detalhes e padrões: [`CLAUDE.md`](CLAUDE.md) e [`docs/frontend-conventions.md`](docs/frontend-conventions.md).

## Módulos

| Módulo | Rota | Descrição |
|--------|------|-----------|
| Auth | `/login`, `/forgot-password`, `/reset-password` | Autenticação (e-mail/senha e Google). Cadastro fechado no backend; `/register` mostra o aviso |
| Hoje (Dashboard) | `/dashboard` | Resumo do dia: finanças (saldo, guardado, mês), contas a vencer, metas, tarefas, agenda, hábitos e transações recentes |
| **Finanças** | `/finance` | **Visão Geral** (mês, saldo, a confirmar, cartões, categorias, transações) |
| | `/finance/accounts` | Contas (disponível e guardado, conferência de saldo) |
| | `/finance/cards` | Cartões, faturas e limite |
| | `/finance/budget` | Orçamento do mês |
| | `/finance/goals` | Metas financeiras |
| | `/finance/categories` | Categorias |
| | `/finance/reports`, `/finance/reports/yearly` | Relatório mensal e anual |
| Tarefas | `/tasks` | Listas, tags, subtarefas, recorrência |
| Hábitos | `/habits`, `/habits/:id` | Tracking, streaks e heatmap |
| Agenda | `/calendar` | Eventos |
| Relatórios | `/reports` | Produtividade e comparativos |
| Preços | `/prices`, `/prices/records`, `/prices/products`, `/prices/purchases` | Histórico de preços e patrimônio |
| Compras | `/purchases` | Lista e sessões de compra |
| Notas | `/notes` | Notas com tags |
| Bookmarks | `/bookmarks` | Coleções de links |
| Cofre | `/vault` | Placeholder ("Cofre não disponível ainda") |
| Configurações | `/settings` | Perfil, senha e preferências |

## Padrões de Código

- `<script setup lang="ts">` em todos os componentes
- Composition API + composables para lógica reutilizável
- Pinia stores com Setup API
- Tipagem estrita — sem `any`
- Prettier: single quotes, 100 chars, sem ponto e vírgula
- Todo commit atualiza a documentação afetada (ver `CLAUDE.md`)
