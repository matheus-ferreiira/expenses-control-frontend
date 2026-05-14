<script setup lang="ts">
import { AppPageContainer, PageHeader, EmptyState } from '@/components/shared'
import { BookOpen } from 'lucide-vue-next'
</script>

<template>
  <AppPageContainer>
    <PageHeader
      category="PESSOAL"
      title="Daily Log"
      subtitle="Registre seu dia em segundos. Humor, highlights e aprendizados."
    />
    <EmptyState
      :icon="BookOpen"
      title="Daily Log não disponível ainda"
      description="Capture seu dia com humor, destaques e aprendizados. Em breve."
    />
  </AppPageContainer>
</template>
