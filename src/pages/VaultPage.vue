<script setup lang="ts">
import { AppPageContainer, PageHeader, EmptyState } from '@/components/shared'
import { Lock } from 'lucide-vue-next'
</script>

<template>
  <AppPageContainer>
    <PageHeader
      category="PESSOAL"
      title="Cofre"
      subtitle="Senhas e credenciais protegidas com criptografia forte."
    />
    <EmptyState
      :icon="Lock"
      title="Cofre não disponível ainda"
      description="Armazenamento seguro de senhas e credenciais está chegando em breve."
    />
  </AppPageContainer>
</template>
