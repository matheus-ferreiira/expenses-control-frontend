<script setup lang="ts">
import { AppPageContainer, PageHeader } from '@/components/shared'
</script>

<template>
  <AppPageContainer>
    <PageHeader
      category="PESSOAL"
      title="Notas"
      subtitle="Capture ideias, reflexões e informações importantes."
    />
    <div class="flex flex-col items-center justify-center py-24 text-center">
      <div class="w-10 h-10 rounded-xl bg-foreground/[0.04] flex items-center justify-center mb-4">
        <span class="text-lg">📝</span>
      </div>
      <p class="text-sm font-medium text-foreground">Em breve</p>
      <p class="text-xs text-muted-foreground mt-1">Este módulo está sendo desenvolvido.</p>
    </div>
  </AppPageContainer>
</template>
