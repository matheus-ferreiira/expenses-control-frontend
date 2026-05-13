<script setup lang="ts">
import { useRouter } from 'vue-router'
import { Button } from '@ui/button'
import { ClipboardList, Flame, Plus } from 'lucide-vue-next'
import { ROUTES } from '@/constants/routes'

const router = useRouter()
</script>

<template>
  <div class="rounded-lg border border-border bg-card p-4">
    <p class="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
      Ações rápidas
    </p>
    <div class="flex flex-wrap gap-2">
      <Button
        variant="outline"
        size="sm"
        class="gap-1.5 h-8"
        @click="router.push({ name: ROUTES.TASKS })"
      >
        <Plus :size="12" />
        <ClipboardList :size="12" />
        Nova tarefa
      </Button>
      <Button
        variant="outline"
        size="sm"
        class="gap-1.5 h-8"
        @click="router.push({ name: ROUTES.HABITS })"
      >
        <Plus :size="12" />
        <Flame :size="12" />
        Novo hábito
      </Button>
    </div>
  </div>
</template>
