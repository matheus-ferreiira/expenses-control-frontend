# Design System — VaultOS

> **Referência de design: a tela Visão Geral de Finanças** (`/finance`, `src/pages/finance/FinancePage.vue`).
> Organização, visual, tipografia, cores, espaçamento, textos e comportamento de qualquer tela nova
> ou refeita seguem o que a Visão Geral faz hoje. Em caso de dúvida, abra a Visão Geral e copie o padrão.
> Não existe mais nenhum site externo de referência: qualquer menção antiga a outro site está obsoleta.

Os valores de cor ficam em `src/assets/styles/tokens.css`. Este documento descreve as **regras de uso**.
Quando a Visão Geral mudar, atualize este arquivo no mesmo commit.

---

## 1. Arquivos de referência

| O que | Arquivo |
|---|---|
| Página (layout, ordem dos cards, filtros, sheets) | `src/pages/finance/FinancePage.vue` |
| Card principal com métricas | `src/features/finance/components/MonthSummaryCard.vue` |
| Card de lista com ações rápidas | `src/features/finance/components/PendingThisWeekCard.vue` |
| Card de resumo com caixa interna e barra | `src/features/finance/components/CreditCardCard.vue` (modo `compact`) |
| Lista compacta com barra e "Ver todas" | `src/features/finance/components/CategoryBreakdownList.vue` (`boxed compact selectable`) |
| Lista agrupada por dia, blocos recolhíveis | `src/features/finance/components/TransactionList.vue` + `TransactionCard.vue` |
| Navegação de mês (toda tela com mês usa este, nunca setas feitas à mão) | `src/features/finance/components/MonthNavigator.vue` |
| Sub-navegação do módulo (mobile) | `src/features/finance/components/FinanceSubNav.vue` |
| Cabeçalho de página | `src/components/shared/PageHeader.vue` (`compact-mobile`) |
| Container de página | `src/components/shared/AppPageContainer.vue` |
| Bottom sheet de detalhe | `src/features/finance/components/BalanceDetailSheet.vue`, `TransactionDetailSheet.vue` |
| Bottom sheet de filtros | sheet "Filtros" dentro de `FinancePage.vue` |

O card de métricas de referência é o `MonthSummaryCard.vue` (o antigo `TransactionSummaryCard.vue` foi removido).

---

## 2. Princípios

1. **Mobile primeiro.** A tela é pensada para o celular (PWA). O desktop reaproveita os mesmos cards em duas colunas.
2. **Uma coluna de cards empilhados**, cada card responde a uma pergunta (Como está o mês? Quanto tenho? O que falta confirmar? Quanto devo no cartão? Onde gastei? O que aconteceu?).
3. **O card se adapta ao contexto.** A Visão Geral muda conforme o mês visto: fechado (`past`), em andamento (`current`) ou previsão (`future`). Cards sobre "agora" (A confirmar, cartão) só aparecem no mês em andamento.
4. **Números vêm do backend.** Totais, saldos e categorias usam os endpoints de relatório, nunca a soma da lista paginada no front.
5. **Nada baseado em ritmo diário.** Sem "livre por dia", sem comparação com a fração do mês que passou. O mês em andamento é comparado com o mês anterior inteiro ("Até agora, …").
6. **Pouca coisa por vez.** Listas mostram os principais itens (top 5 categorias, últimas 20 transações) com "Ver todas" / "Ver mais". Filtros secundários ficam num sheet.
7. **Toque abre o detalhe.** Valor ou linha tocável abre um bottom sheet com a explicação ou a lista correspondente, sinalizado por `ChevronRight`.
8. **Texto curto e direto, em português do dia a dia.** "Nas contas", "No fim do mês", "Sobrou", "A confirmar", "Guardado". Uma nota curta explica como um número é calculado quando não é óbvio.

---

## 3. Cores

Paleta escura (zinc frio) definida em `tokens.css`:

| Papel | Token / classe | Valor (dark) |
|---|---|---|
| Fundo da página e sidebar | `bg-background` | `#09090b` |
| Card, sheet (nível 1) | `bg-card` | `#18181b` |
| Caixa dentro do card, controles, trilho de barra, divisor (nível 2) | `bg-muted`, `border-border` | `#27272a` |
| Ação, seleção, foco, positivo | `primary` / `success` | `#34d399` |
| Despesa, negativo, excluir, vencido | `destructive` | `#FF6F5C` |
| Atenção, pendente | `warning` | `#F5A623` |
| Texto principal / secundário | `text-foreground` / `text-muted-foreground` | `#E4E4E7` / `#A1A1AA` |

- **Texto sobre `bg-primary` é `text-primary-foreground` (preto)**, nunca `text-white`.
- **Elevação pela cor de fundo** (background → card → muted). Sem sombra, sem borda em volta de card.
- Borda só como **divisor interno**: `border-b border-border`, `border-t border-border`, `divide-y divide-border`.
- Cores de módulo (`accent-*`, ver `src/constants/modules.ts`) aparecem só em ícone, dot e gráfico. Nunca em botão, CTA ou seleção (que são sempre `primary`).

### Cor de valores monetários

| Situação | Classe |
|---|---|
| Receita, entrada, "a receber" | `text-success` (com `+`) |
| Despesa no card do mês e em "a pagar" | `text-destructive` (com `−`) |
| Despesa na lista de transações | cor normal do texto; vermelho só quando **vencida** |
| Saldo / sobra | `text-success` (ou `text-foreground`) se ≥ 0, `text-destructive` se < 0 |
| Dinheiro guardado (caixinhas, metas) | `text-primary` + ícone `PiggyBank` |
| Neutro (fatura aberta, limite, totais de dia) | `text-foreground` ou `text-muted-foreground` |

### Transparência

Superfícies (card, caixa interna, sheet) são **sempre sólidas**. A transparência só é usada nestes casos, como na Visão Geral:

| Uso | Classe |
|---|---|
| Opção selecionada em toggle, botão "Filtros" ativo, pílula de filtro | `bg-primary/15 text-primary` |
| Hover de linha tocável | `hover:bg-muted/50` (ou `/40`) |
| Fundo do ícone de categoria | cor da categoria + alfa (`cat.color + '22'` / `'26'`) com o ícone na cor cheia. A cor precisa ter 6 dígitos; se puder vir curta (`#888`), use `withAlpha(cor, '26')` de `@/utils/color` |
| Parte "prevista" de uma barra de progresso | mesma cor da barra com `opacity-40` |
| Estado desabilitado | `disabled:opacity-40` |
| Hover de valor tocável | `hover:opacity-80` |

Qualquer outro uso de `/N` em cor é exceção e precisa de motivo.

---

## 4. Tipografia

Fonte Inter Variable. Os tamanhos são fixos em px (classes `text-[Npx]`), como na Visão Geral:

| Elemento | Classes |
|---|---|
| Título de seção do card (rótulo em caixa alta) | `text-[11px] font-semibold uppercase tracking-widest text-muted-foreground` |
| Título de card com lista (ex.: "Transações") | `text-[14px] font-semibold` |
| Rótulo de métrica | `text-[12px] text-muted-foreground` (ou `text-[10px] uppercase tracking-widest` nas 3 colunas do card do mês) |
| Valor de destaque | `text-[20px] font-semibold tabular-nums leading-none whitespace-nowrap` |
| Valor em 3 colunas | `text-[15px] min-[400px]:text-[17px] font-semibold tabular-nums whitespace-nowrap` |
| Valor secundário | `text-[16px] font-semibold tabular-nums` |
| Linha de lista: título / subtítulo / valor | `text-[14px] font-medium` / `text-[12px] text-muted-foreground` / `text-[14px] font-semibold tabular-nums` |
| Texto de caixa interna, status | `text-[12px]` |
| Nota explicativa | `text-[11px] text-muted-foreground leading-snug` |
| Título de página (desktop) | `text-[22px] md:text-[26px] font-semibold` (via `PageHeader`) |
| Título de sheet / descrição | `text-[15px]` / `text-[12px]` |

- Todo valor monetário usa `formatCurrency()` (`@/utils/currency`) e `tabular-nums`.
- Percentual com casa decimal usa `formatPercent()` ("39,6%", vírgula pt-BR); nunca `toFixed()` direto na tela. Percentual inteiro: `Math.round(x)%`.
- Valores não quebram linha: `whitespace-nowrap`.

---

## 5. Layout da página

```
AppPageContainer            px-4 md:px-6 py-4 md:py-8
├─ FinanceSubNav            pílulas do módulo, só mobile (lg:hidden)
├─ PageHeader compact-mobile
│    mobile: só as ações · desktop: trilha + chip de ícone + título + subtítulo + borda inferior
└─ grid                     lg:grid-cols-[400px_minmax(0,1fr)] xl:grid-cols-[440px_minmax(0,1fr)] lg:gap-5 xl:gap-6 lg:items-start
   ├─ coluna de resumo      space-y-3 — cards empilhados
   └─ coluna principal      card de lista (Transações)
```

Ordem dos cards da Visão Geral (mobile e coluna esquerda no desktop):

1. **Card do mês** (`MonthSummaryCard`): navegação de mês, modo do mês, 3 colunas (entrou · saiu · sobrou), resultado previsto, barra contra orçamento/receita prevista, status, comparação com o mês anterior, guardado no mês.
2. **Saldo** (mês atual e futuros): "Nas contas" e "No fim do mês", faturas descontadas, guardado, nota de cálculo, aviso de contas não conferidas.
3. **A confirmar** (só mês atual): pendentes vencidos e da semana, confirmação em 1 toque.
4. **Cartões** em versão compacta (só mês atual): fatura a pagar, fatura aberta e limite livre.
5. **Categorias**: toggle Despesas/Receitas, top 5 com "Ver todas".
6. Alerta de categoria acima da meta (quando houver).
7. **Transações** (coluna direita no desktop): busca, toggle Todas/Receitas/Despesas, "Filtros", bloco "Agendadas" recolhido, lista por dia.

Ao criar uma tela nova, siga a mesma lógica: cards de resumo em cima/à esquerda, lista principal embaixo/à direita.
Quando a tela é uma coleção de cards grandes do mesmo tipo (ex.: Cartões), use `lg:grid-cols-2` com o mesmo gap: cada card fica com a largura de uma coluna, nunca esticado na tela inteira.

---

## 6. Componentes visuais

### Card

```html
<div class="bg-card rounded-lg p-4">
  <p class="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">Saldo</p>
  …
</div>
```

- Sem borda, sem sombra. Cantos `rounded-lg` (8px). Espaço entre cards `space-y-3`.
- Cabeçalho com ação: título à esquerda, contador ou botão à direita (`flex items-center justify-between`).
- Ícone opcional no título: lucide `:size="14"` na cor do status (ex.: `Clock` em `text-warning`).

### Caixa interna (box dentro do card)

```html
<div class="mt-3 rounded-md bg-muted px-3 py-2 text-[12px]"> … </div>
```

Para: resultado previsto, status do mês, faturas descontadas, guardado, fatura a pagar. Linha interna: `flex items-center justify-between gap-3`, rótulo `text-muted-foreground truncate`, valor `tabular-nums font-medium shrink-0`.

Caixa interna tocável (atalho para um sheet ou outra tela, ex.: "Guardado" na Visão Geral, "Saldo em uma data" em Contas):
`mt-3 w-full flex items-center justify-between gap-3 rounded-md bg-muted px-3 py-2 text-[12px] hover:opacity-80`, com ícone 14 à esquerda e `ChevronRight :size="14"` à direita.

Dentro de um sheet (fundo `bg-card`), a caixa interna é `bg-muted` sem divisores (`px-3 py-1`, linhas `py-2`); o divisor `border-border` tem a mesma cor do `bg-muted` e não aparece.

### Métricas lado a lado

- 2 valores: `grid grid-cols-2 gap-3`, cada um com rótulo `text-[12px]` em cima e valor `text-[20px]`.
- 3 valores: `grid grid-cols-3 gap-2 text-center`, rótulo com altura fixa (`h-[26px] flex items-end justify-center`) para os valores ficarem alinhados quando um rótulo quebra.
- Várias métricas relacionadas ficam **num card só**, não em vários boxes.

### Valor tocável

```html
<button class="flex items-center gap-1 hover:opacity-80 transition-opacity">
  <span class="text-[20px] font-semibold tabular-nums …">R$ 1.234,56</span>
  <ChevronRight :size="14" class="text-muted-foreground" />
</button>
```

### Barra de progresso

```html
<div class="relative h-1.5 bg-muted rounded-full overflow-hidden">
  <div class="absolute inset-y-0 left-0 rounded-full bg-primary" :style="{ width: gasto }" />
  <div class="absolute inset-y-0 rounded-full bg-primary opacity-40" :style="{ left: gasto, width: previsto }" />
</div>
```

`bg-primary` normal, `bg-destructive` quando passa de 100% (orçamento) ou `bg-success` ao completar (meta). O preenchimento nunca usa `bg-muted`, que é a cor do trilho e some.
Em lista, a barra fica abaixo da linha, alinhada com o texto (`mt-2 ml-11`, depois do ícone de 32px). Legenda acima em `text-[11px]`: rótulo da base à esquerda, "X de Y" e percentuais à direita.

### Gráfico

Card `bg-card rounded-lg p-4` com título em caixa alta 11px e ícone 14 (`PieChart`, `BarChart3`). Cores das séries: `success` (receitas), `destructive` (despesas), cor da categoria (rosca, sempre com `withAlpha`). Eixo de valores em reais curto e sem repetir rótulo ("R$ 2,5k"), `maxTicksLimit: 6`. Legenda da rosca como lista abaixo (dot 8px, nome, `formatPercent`).

### Alternar entre telas irmãs

Duas telas que mostram o mesmo assunto em períodos diferentes (Relatório mensal / anual) usam o toggle segmentado no topo, com a largura da coluna de resumo no desktop (`lg:w-[400px] xl:w-[440px]`). Nunca abas sublinhadas.

### Status

```html
<div class="mt-3 flex items-center gap-2 rounded-md bg-muted px-2.5 py-2 text-[12px] font-medium text-success">
  <CheckCircle2 :size="14" /> <span>Pelo previsto, sobram 20% do que entra</span>
</div>
```

Tom `text-success` (ok), `text-warning` (atenção) ou `text-destructive` (problema), com `CheckCircle2` ou `AlertTriangle`.

### Toggle segmentado

```html
<div class="flex gap-1 rounded-lg bg-muted p-1" role="group" aria-label="…">
  <button :aria-pressed="ativo"
    class="flex-1 rounded-md px-3 py-1.5 text-[12px] font-medium transition-colors"
    :class="ativo ? 'bg-primary/15 text-primary font-semibold' : 'text-muted-foreground hover:text-foreground'">
    Despesas
  </button>
</div>
```

Para 2–3 opções exclusivas que mudam o conteúdo do card (Despesas/Receitas, Todas/Receitas/Despesas).

### Pílulas

| Tipo | Classes |
|---|---|
| Sub-navegação do módulo | `h-8 px-3.5 rounded-full text-[12px] font-medium`; ativa `bg-primary text-primary-foreground`, inativa `bg-muted text-muted-foreground` |
| Opções dentro de sheet (conta, categoria, "mostrar só") | `h-8 px-3 rounded-full text-[12px] font-medium`, mesmas cores acima |
| Filtro ativo removível | `h-7 pl-2.5 pr-1.5 rounded-full bg-primary/15 text-primary text-[12px]` + `X :size="12"`, com "Limpar" ao lado |

### Botões

| Tipo | Classes |
|---|---|
| Primário (cabeçalho) | `h-9 px-3.5 rounded-lg text-[13px] font-medium bg-primary text-primary-foreground hover:brightness-110` |
| Primário pequeno em card | `h-8 px-3 rounded-lg text-[12px] font-semibold bg-primary text-primary-foreground` |
| Secundário | `bg-muted text-foreground` (ou `text-muted-foreground hover:text-foreground`) |
| Ações no rodapé de sheet | `flex gap-2`, cada botão `flex-1 h-11 rounded-lg text-[14px] font-medium` (Limpar `bg-muted`, ação `bg-primary`) |
| Ícone | `size-9 grid place-items-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground` |
| Ação rápida em linha | `size-8 rounded-lg bg-muted grid place-items-center` |
| Link de texto ("Ver todas", "Mês atual") | `text-[12px] font-medium text-primary` |

Alvos de toque de navegação têm no mínimo 44px (`min-h-[44px] min-w-[44px]`).

### Lista dentro de card

- Card de lista: `bg-card rounded-lg overflow-hidden`; cabeçalho `px-4 py-3 border-b border-border`; faixa de filtros `px-3 py-2 border-b border-border`.
- Linhas: `divide-y divide-border`, cada linha `px-4 py-2.5`, `flex items-center gap-3`.
- Ícone da linha: `size-8 rounded-lg` com fundo na cor da categoria + alfa e ícone na cor cheia (`:size="15"`). Em lista compacta: `size-6 rounded-md`, ícone 12.
- Cabeçalho de grupo (dia): `px-4 pt-3 pb-1`, rótulo em caixa alta 11px à esquerda, total `text-[12px] tabular-nums text-muted-foreground` alinhado com os valores à direita.
- Bloco recolhível (ex.: "Agendadas (n)"): botão em largura total com `ChevronRight` que gira (`rotate-90`), ícone de status e totais à direita.
- Indicador de pendente: dot `w-2 h-2 rounded-full bg-warning`. Parcela: badge `h-4 px-1.5 rounded text-[10px] bg-muted`.
- Ver mais / Ver todas: botão em largura total `py-2.5 text-[12px] font-medium text-primary hover:bg-muted/50`.
- Lista dentro de card com padding (`p-4`): use margem negativa para encostar nas bordas (`-mx-4 -mb-4 border-t border-border`).
- Grupo de itens com subtotal (ex.: Disponível / Guardado em Contas): um card por grupo, cabeçalho **dentro** do card (`px-4 py-3 border-b border-border`, rótulo em caixa alta à esquerda, subtotal `text-[12px] tabular-nums text-muted-foreground` à direita).
- Linha editável: a linha inteira abre a edição; ações destrutivas (excluir, arquivar) ficam num menu `⋯` (`size-10`, `MoreHorizontal :size="15"`) no fim da linha, nunca como botões sempre à mostra.
- Adicionar item a uma lista: última linha do card, `py-2.5 text-[12px] font-medium text-primary` com `Plus :size="14"`. Nunca botão com borda tracejada.
- Valor secundário de um item vai num subtítulo que diz o que é ("Meta de R$ 300,00 por mês"), não solto ao lado do nome.
- Itens inativos/arquivados: bloco recolhível no fim (como "Agendadas"), com texto e ícone em `text-muted-foreground`. Nunca deixar a linha semitransparente.

### Bottom sheet

```html
<Sheet v-model:open="aberto">
  <SheetContent side="bottom" class="rounded-t-2xl p-0 max-w-lg mx-auto max-h-[85vh] overflow-y-auto">
    <div class="mx-auto mt-3 h-1 w-10 rounded-full bg-border" />
    <SheetHeader class="text-left px-5 pt-3">
      <SheetTitle class="text-[15px]">Filtros</SheetTitle>
      <SheetDescription class="text-[12px]">Valem para a lista de transações do mês.</SheetDescription>
    </SheetHeader>
    <div class="px-5 pb-6 space-y-5 mt-4">
      <section> <p class="…rótulo em caixa alta… mb-2">Conta</p> … </section>
      <div class="flex gap-2 pt-1"> …botões h-11… </div>
    </div>
  </SheetContent>
</Sheet>
```

Detalhes, filtros, confirmação e drill-down abrem como bottom sheet (não como diálogo centralizado). O botão de ação diz o resultado ("Ver 12 transações", "Registrar conferência").

- Campo dentro de sheet: `h-11 rounded-lg bg-muted px-3 text-[14px]` com `focus-visible:ring-2 focus-visible:ring-primary` (campo com prefixo "R$": `flex items-center gap-2` no container e `focus-within:ring-2`). Rótulo em caixa alta 11px acima.
- Diálogo centralizado (`ConfirmDialog`) só para confirmar uma ação destrutiva (excluir, arquivar).

**Dois estilos de bottom sheet** — escolha pelo conteúdo:

| Estilo | Quando | Exemplos |
|---|---|---|
| **Cinza** — `bg-card`, sem borda (o modelo acima) | Escolhas, filtros, listas e ações curtas | Filtros, transações da categoria, "Conferir saldo", "Saldo em uma data" |
| **Escuro com borda verde** — `bg-background`, `border-t-2 border-primary`, cabeçalho próprio | Formulário de criação/edição e detalhe de um item | `TransactionFormDialog`, `AccountFormDialog`, `CreditCardFormDialog`, `TransactionDetailSheet`, `BalanceDetailSheet`, `CardStatementSheet` |

No estilo escuro, caixas internas usam `bg-card`; os campos continuam `bg-muted h-11`. Opções exclusivas em qualquer sheet (tipo de conta, conta que pagou a fatura…) seguem a seleção da Visão Geral: ativa `bg-primary/15 text-primary font-semibold`, inativa `bg-muted text-muted-foreground`, com `aria-pressed`. Rótulos de campo em caixa alta 11px.

### Ícone de página e de módulo

`PageHeader` mostra o chip `size-11 md:size-12 rounded-xl bg-muted` com o ícone na cor do módulo (`constants/modules.ts`). Com `compact-mobile`, no celular só aparecem as ações (o título fica `sr-only`).

---

## 7. Estados

- **Carregando:** `Skeleton` no lugar de cada valor (não um spinner na tela toda). Cards que dependem de dados ficam ocultos até carregar (`v-if="!store.loading && …"`).
- **Vazio:** ícone em `w-12 h-12 rounded-2xl bg-muted`, título `text-[15px] font-semibold`, frase `text-[13px] text-muted-foreground`, ação opcional. O texto muda com o contexto (filtro ativo, mês passado, mês atual).
- **Erro:** mesmo formato do vazio com `AlertCircle text-destructive` e "Tentar novamente". Um card que falha não derruba os outros.
- **Ação concluída:** toast curto (`useToast`), recarregar só o que mudou e destacar o item novo.
- **Foco:** `focus-visible:ring-2 focus-visible:ring-primary`. Toggles usam `aria-pressed`, grupos `role="group"` + `aria-label`, botões só com ícone têm `aria-label`.

---

## 8. Textos

- Português do dia a dia, frases curtas. Nada de jargão contábil.
- Rótulos de métrica descrevem o que o número é naquele contexto: "Recebido"/"Gasto"/"Sobra até hoje" no mês atual, "Receitas"/"Despesas"/"Sobrou" no mês fechado, "Receita prevista"/"Despesa prevista"/"Sobra prevista" no futuro.
- Status em frase completa: "Pelo previsto, sobram 20% do que entra", "Saiu R$ 300,00 a mais do que entrou".
- Notas explicam o cálculo quando necessário: "O fim do mês soma o que está agendado e desconta as faturas que vencem até lá."
- Avisos dizem o que fazer: "Confira em Contas."

---

## 9. Telas do módulo Finanças no padrão

| Tela | Situação |
|---|---|
| Visão Geral (`FinancePage.vue`) | Referência |
| Contas (`AccountsPage.vue`) | No padrão (2026-10-29) |
| Cartões (`CardsPage.vue`) | No padrão (2026-10-29) |
| Orçamento (`BudgetPage.vue`) | No padrão (2026-10-29) |
| Metas (`GoalsPage.vue`) | No padrão (2026-10-29) |
| Categorias (`CategoriesPage.vue`) | No padrão (2026-10-29) |
| Relatórios (`MonthlyReportPage.vue`, `YearlyReportPage.vue`) | No padrão (2026-10-29) |

Atualize esta tabela no commit que trouxer uma tela para o padrão.

---

## 10. Checklist para uma tela nova ou refeita

- [ ] Abri a Visão Geral e usei os mesmos padrões de card, tipografia e cor.
- [ ] Cards `bg-card rounded-lg p-4`, sem borda nem sombra; caixas internas `bg-muted rounded-md`.
- [ ] Títulos de seção em caixa alta 11px; valores com `formatCurrency` + `tabular-nums` + `whitespace-nowrap`.
- [ ] Seleção com `bg-primary/15 text-primary` (toggle) ou `bg-primary text-primary-foreground` (pílula); nenhuma cor de módulo em botão.
- [ ] Funciona primeiro no celular; no desktop usa o grid de 2 colunas.
- [ ] Números do backend, não somados da lista.
- [ ] Skeleton, vazio e erro tratados; `aria-*` nos toggles e ícones.
- [ ] Atualizei este documento se criei um padrão novo.
