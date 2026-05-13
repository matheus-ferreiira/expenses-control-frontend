<script setup lang="ts">
import { AppPageContainer, PageHeader } from '@/components/shared'
</script>

<template>
  <AppPageContainer>
    <PageHeader
      category="PESSOAL"
      title="Bookmarks"
      subtitle="Salve ferramentas, artigos e referências com tags e pastas."
    />
    <div class="flex flex-col items-center justify-center py-24 text-center">
      <div class="w-10 h-10 rounded-xl bg-foreground/[0.04] border border-border flex items-center justify-center mb-4">
        <span class="text-lg">🔖</span>
      </div>
      <p class="text-sm font-medium text-foreground/60">Em breve</p>
      <p class="text-xs text-muted-foreground/40 mt-1">Este módulo está sendo desenvolvido.</p>
    </div>
  </AppPageContainer>
</template>
