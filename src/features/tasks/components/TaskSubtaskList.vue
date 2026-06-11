<script setup lang="ts">
import { ref } from 'vue'
import { Checkbox } from '@ui/checkbox'
import { Button } from '@ui/button'
import { Input } from '@ui/input'
import { Trash2, Plus, Loader2 } from 'lucide-vue-next'
import type { Subtask } from '@/types/tasks'

defineProps<{
  taskId: string
  subtasks: Subtask[]
}>()

const emit = defineEmits<{
  toggle: [subtaskId: string]
  delete: [subtaskId: string]
  create: [title: string]
}>()

const newTitle = ref('')
const adding = ref(false)
const creating = ref(false)

async function submitNew() {
  if (!newTitle.value.trim()) return
  creating.value = true
  try {
    emit('create', newTitle.value.trim())
    newTitle.value = ''
    adding.value = false
  } finally {
    creating.value = false
  }
}

function cancelNew() {
  newTitle.value = ''
  adding.value = false
}
</script>

<template>
  <div class="space-y-1">
    <!-- Existing subtasks -->
    <div
      v-for="sub in subtasks"
      :key="sub.id"
      class="group flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-accent/40 transition-base"
    >
      <Checkbox
        :checked="sub.completed"
        class="shrink-0"
        @update:checked="emit('toggle', sub.id)"
      />
      <span
        :class="['flex-1 text-[13px]', sub.completed && 'line-through text-muted-foreground']"
      >
        {{ sub.title }}
      </span>
      <Button
        variant="ghost"
        size="icon"
        class="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
        @click="emit('delete', sub.id)"
      >
        <Trash2 :size="12" />
      </Button>
    </div>

    <!-- Add new subtask -->
    <div v-if="adding" class="flex items-center gap-2 px-2 py-1.5">
      <div class="h-4 w-4 shrink-0 rounded border border-border" />
      <Input
        v-model="newTitle"
        autofocus
        placeholder="Nome da subtarefa..."
        class="h-7 text-[13px] flex-1"
        @keydown.enter="submitNew"
        @keydown.esc="cancelNew"
      />
      <Button size="sm" class="h-7 px-2 text-[11px]" :disabled="creating || !newTitle.trim()" @click="submitNew">
        <Loader2 v-if="creating" :size="12" class="animate-spin" />
        <span v-else>Adicionar</span>
      </Button>
      <Button variant="ghost" size="sm" class="h-7 px-2 text-[11px]" @click="cancelNew">
        Cancelar
      </Button>
    </div>

    <!-- Add trigger -->
    <button
      v-if="!adding"
      class="flex items-center gap-2 px-2 py-1.5 text-[13px] text-muted-foreground hover:text-foreground transition-base rounded-md hover:bg-accent/40 w-full"
      @click="adding = true"
    >
      <Plus :size="14" />
      Adicionar subtarefa
    </button>
  </div>
</template>
