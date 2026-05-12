# Productivity Control — Frontend

SPA Vue 3 para controle financeiro, tarefas, hábitos, metas e produtividade pessoal.

## Stack

| Tecnologia | Versão |
|-----------|--------|
| Vue | ^3.5 |
| TypeScript | ~5.9 |
| Vite | ^7.3 |
| Pinia | ^3.0 |
| Vue Router | ^4.6 |
| Vitest | ^4.0 |
| Cypress | ^15.8 |

## Pré-requisitos

- Node.js 20+
- Backend rodando em `http://localhost:8000`

## Instalação

```bash
npm install
cp .env.example .env   # configurar VITE_API_URL
npm run dev
```

## Variáveis de Ambiente

```env
VITE_API_URL=http://localhost:8000/api
VITE_APP_NAME=Productivity Control
```

## Comandos

```bash
npm run dev            # Servidor de desenvolvimento (Vite)
npm run build          # Build para produção
npm run preview        # Preview do build
npm run test:unit      # Testes unitários (Vitest)
npm run test:e2e       # Testes E2E (Cypress + build)
npm run test:e2e:dev   # Testes E2E em desenvolvimento
npm run type-check     # Verificação de tipos (vue-tsc)
npm run lint           # ESLint com auto-fix
npm run format         # Prettier
```

## Arquitetura

```
src/
├── assets/            Imagens, fontes, estilos globais
├── components/
│   ├── ui/            Componentes base reutilizáveis
│   └── [domain]/      Componentes específicos de cada módulo
├── composables/       Lógica reutilizável com Composition API
├── layouts/           AppLayout, AuthLayout
├── pages/             Views por rota (espelham os módulos do backend)
├── router/            Vue Router + navigation guards
├── services/api/      Camada de integração com o backend
├── stores/            Pinia stores por domínio
├── types/             TypeScript interfaces e tipos
└── utils/             Helpers e formatadores
```

## Módulos

| Módulo | Rota | Descrição |
|--------|------|-----------|
| Auth | `/login`, `/register` | Autenticação |
| Dashboard | `/` | Visão geral consolidada |
| Tasks | `/tasks` | Gerenciamento de tarefas |
| Habits | `/habits` | Tracking de hábitos + heatmap |
| Finance | `/finance` | Controle financeiro + gráficos |
| Goals | `/goals` | Metas e progresso |
| Calendar | `/calendar` | Agenda de eventos |

## Backend

A API está em `back/`. Documentação completa em [`back/README.md`](../back/README.md).

## Padrões de Código

- `<script setup lang="ts">` em todos os componentes
- Composition API + Composables para lógica reutilizável
- Pinia stores com Setup API (não Options API)
- Tipagem estrita — evitar `any`
- Prettier: single quotes, 100 chars, sem ponto e vírgula
