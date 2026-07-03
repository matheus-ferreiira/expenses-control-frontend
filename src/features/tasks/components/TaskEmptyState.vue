<script setup lang="ts">
import { CheckSquare } from 'lucide-vue-next'

defineProps<{
  title?: string
  description?: string
}>()

defineEmits<{ create: [] }>()
</script>

<template>
  <div class="flex flex-col items-center justify-center py-16 text-center px-4">
    <span class="size-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
      <CheckSquare :size="28" class="text-primary" />
    </span>
    <p class="text-[15px] font-semibold text-foreground mb-1">
      {{ title ?? 'Nenhuma tarefa' }}
    </p>
    <p class="text-[13px] text-muted-foreground mb-5">
      {{ description ?? 'Toque em "+ Nova tarefa" para começar.' }}
    </p>
    <button
      type="button"
      class="h-10 px-5 rounded-xl bg-primary text-primary-foreground text-[13px] font-semibold transition-all active:scale-95"
      @click="$emit('create')"
    >
      + Nova tarefa
    </button>
  </div>
</template>
