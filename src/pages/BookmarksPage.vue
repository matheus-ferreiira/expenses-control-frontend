<script setup lang="ts">
import { AppPageContainer, PageHeader, EmptyState } from '@/components/shared'
import { Bookmark } from 'lucide-vue-next'
</script>

<template>
  <AppPageContainer>
    <PageHeader
      category="PESSOAL"
      title="Bookmarks"
      subtitle="Salve ferramentas, artigos e referências com tags e pastas."
    />
    <EmptyState
      :icon="Bookmark"
      title="Bookmarks não disponíveis ainda"
      description="Organize links, artigos e ferramentas em pastas e tags. Em breve."
    />
  </AppPageContainer>
</template>
