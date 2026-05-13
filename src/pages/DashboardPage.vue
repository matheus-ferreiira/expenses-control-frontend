<script setup lang="ts">
import { formatDate } from '@/utils/date'

const today = formatDate(new Date(), { weekday: 'long', day: 'numeric', month: 'long' })
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-foreground capitalize">{{ today }}</h1>
      <p class="text-muted-foreground mt-1">Seu painel de controle</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div class="rounded-lg border border-border bg-card p-6">
        <p class="text-sm text-muted-foreground">Tarefas hoje</p>
        <p class="text-3xl font-bold text-foreground mt-1">—</p>
      </div>
      <div class="rounded-lg border border-border bg-card p-6">
        <p class="text-sm text-muted-foreground">Hábitos concluídos</p>
        <p class="text-3xl font-bold text-foreground mt-1">—</p>
      </div>
      <div class="rounded-lg border border-border bg-card p-6">
        <p class="text-sm text-muted-foreground">Saldo atual</p>
        <p class="text-3xl font-bold text-foreground mt-1">—</p>
      </div>
    </div>
  </div>
</template>
