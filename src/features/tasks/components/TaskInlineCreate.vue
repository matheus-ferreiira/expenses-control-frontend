<script setup lang="ts">
import { ref, nextTick } from 'vue'
import { Plus } from 'lucide-vue-next'
import { useTaskStore } from '@/stores/tasks'

const props = defineProps<{
  groupDate: string | null
}>()

const store = useTaskStore()

const editing = ref(false)
const title = ref('')
const loading = ref(false)
const inputRef = ref<HTMLInputElement | null>(null)

function open() {
  editing.value = true
  title.value = ''
  nextTick(() => inputRef.value?.focus())
}

function cancel() {
  editing.value = false
  title.value = ''
}

async function submit() {
  const t = title.value.trim()
  if (!t) {
    cancel()
    return
  }
  loading.value = true
  try {
    await store.createTask({
      title: t,
      due_date: props.groupDate ?? undefined,
    })
    title.value = ''
    nextTick(() => inputRef.value?.focus())
  } finally {
    loading.value = false
  }
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') {
    e.preventDefault()
    submit()
  } else if (e.key === 'Escape') {
    cancel()
  }
}
</script>

<template>
  <!-- Trigger row -->
  <div
    v-if="!editing"
    class="flex items-center gap-2 px-4 py-2 cursor-pointer transition-colors"
    style="color: hsl(var(--muted-foreground) / 0.35)"
    @mouseenter="($event.currentTarget as HTMLElement).style.color = 'hsl(var(--muted-foreground) / 0.65)'"
    @mouseleave="($event.currentTarget as HTMLElement).style.color = 'hsl(var(--muted-foreground) / 0.35)'"
    @click="open"
  >
    <Plus :size="12" />
    <span class="text-[12px]">Adicionar tarefa</span>
  </div>

  <!-- Inline input -->
  <div v-else class="flex items-center gap-2.5 px-4 py-2 border-t border-border/20">
    <div class="h-3.5 w-3.5 shrink-0" />
    <input
      ref="inputRef"
      v-model="title"
      type="text"
      placeholder="Nome da tarefa…"
      :disabled="loading"
      class="flex-1 min-w-0 bg-transparent text-[13px] text-foreground/90 placeholder:text-muted-foreground/30 outline-none disabled:opacity-50"
      @keydown="onKeydown"
      @blur="cancel"
    />
    <span
      v-if="loading"
      class="text-[10px] shrink-0"
      style="color: hsl(var(--muted-foreground) / 0.4)"
    >
      Salvando…
    </span>
  </div>
</template>
