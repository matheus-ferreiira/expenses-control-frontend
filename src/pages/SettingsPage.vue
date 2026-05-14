<script setup lang="ts">
import { AppPageContainer, PageHeader, EmptyState } from '@/components/shared'
import { Settings } from 'lucide-vue-next'
</script>

<template>
  <AppPageContainer>
    <PageHeader
      category="SISTEMA"
      title="Configurações"
      subtitle="Gerencie sua conta, preferências e integrações."
    />
    <EmptyState
      :icon="Settings"
      title="Configurações não disponíveis ainda"
      description="Perfil, aparência, notificações e integrações. Em breve."
    />
  </AppPageContainer>
</template>
