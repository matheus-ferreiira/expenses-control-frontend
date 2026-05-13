<script setup lang="ts">
import { AppPageContainer, PageHeader } from '@/components/shared'
</script>

<template>
  <AppPageContainer>
    <PageHeader
      category="ANÁLISE"
      title="Relatórios"
      subtitle="Produtividade, hábitos e finanças em uma visão integrada."
    >
      <template #actions>
        <button
          class="flex items-center gap-1.5 h-8 px-3 rounded-md text-[13px] font-medium text-muted-foreground border border-border hover:bg-foreground/[0.05] transition-colors"
        >
          Período: 30 dias
        </button>
        <button
          class="flex items-center gap-1.5 h-8 px-3 rounded-md text-[13px] font-medium text-foreground border border-border hover:bg-foreground/[0.05] transition-colors"
        >
          Exportar
        </button>
      </template>
    </PageHeader>
    <div class="flex flex-col items-center justify-center py-24 text-center">
      <div class="w-10 h-10 rounded-xl bg-foreground/[0.04] border border-border flex items-center justify-center mb-4">
        <span class="text-lg">📊</span>
      </div>
      <p class="text-sm font-medium text-foreground/60">Em construção</p>
      <p class="text-xs text-muted-foreground/40 mt-1">O módulo de relatórios está sendo desenvolvido.</p>
    </div>
  </AppPageContainer>
</template>
