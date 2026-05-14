<script setup lang="ts">
import { AppPageContainer, PageHeader, EmptyState } from '@/components/shared'
import { CalendarDays } from 'lucide-vue-next'
</script>

<template>
  <AppPageContainer>
    <PageHeader
      category="PRODUTIVIDADE"
      title="Agenda"
      subtitle="Eventos, compromissos e tarefas em um só lugar."
    >
      <template #actions>
        <button
          class="flex items-center gap-1.5 h-8 px-3 rounded-md text-[13px] font-medium text-muted-foreground border border-border hover:bg-foreground/[0.05] transition-base"
        >
          Conectar Google
        </button>
        <button
          class="flex items-center gap-1.5 h-8 px-3 rounded-md text-[13px] font-medium text-foreground border border-border hover:bg-foreground/[0.05] transition-base"
        >
          + Novo evento
        </button>
      </template>
    </PageHeader>
    <EmptyState
      :icon="CalendarDays"
      title="Agenda em desenvolvimento"
      description="Month view, semana, drag & drop e integração Google Calendar. Em breve."
    />
  </AppPageContainer>
</template>
