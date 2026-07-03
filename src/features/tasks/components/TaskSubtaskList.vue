<script setup lang="ts">
import { ref, nextTick } from 'vue'
import { Plus, Trash2, Check } from 'lucide-vue-next'
import type { Subtask } from '@/types/tasks'

defineProps<{ taskId: string; subtasks: Subtask[] }>()

const emit = defineEmits<{
  toggle: [subtaskId: string]
  delete: [subtaskId: string]
  create: [title: string]
}>()

const adding = ref(false)
const newTitle = ref('')
const inputRef = ref<HTMLInputElement | null>(null)

async function startAdding() {
  adding.value = true
  await nextTick()
  inputRef.value?.focus()
}

function submitNew() {
  const title = newTitle.value.trim()
  if (!title) { adding.value = false; return }
  emit('create', title)
  newTitle.value = ''
  adding.value = false
}

function cancelNew() {
  newTitle.value = ''
  adding.value = false
}

function handleBlur() {
  if (!newTitle.value.trim()) cancelNew()
}
</script>

<template>
  <div>
    <!-- Existing subtasks -->
    <div
      v-for="sub in subtasks"
      :key="sub.id"
      class="group flex items-center border-b border-border last:border-0"
    >
      <!-- Circular checkbox — large touch area -->
      <button
        type="button"
        class="size-11 flex items-center justify-center shrink-0 -ml-1 rounded-full transition-all active:scale-95"
        :aria-label="sub.is_completed ? 'Desmarcar subtarefa' : 'Concluir subtarefa'"
        @click="emit('toggle', sub.id)"
      >
        <span
          class="size-5 rounded-full border-2 flex items-center justify-center transition-all duration-200"
          :class="sub.is_completed
            ? ' bg-muted'
            : ''"
        >
          <Check
            v-if="sub.is_completed"
            :size="10"
            :stroke-width="3"
            style="color: hsl(var(--background))"
          />
        </span>
      </button>

      <!-- Title -->
      <span
        class="flex-1 min-w-0 py-3 pr-2 text-[13px] leading-snug"
        :class="sub.is_completed
          ? 'line-through text-muted-foreground'
          : 'text-foreground'"
      >{{ sub.title }}</span>

      <!-- Delete — reveal on hover -->
      <button
        type="button"
        class="size-9 flex items-center justify-center opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all shrink-0"
        @click="emit('delete', sub.id)"
      >
        <Trash2 :size="13" />
      </button>
    </div>

    <!-- New subtask input -->
    <div v-if="adding" class="flex items-center border-b border-border">
      <div class="size-11 flex items-center justify-center shrink-0 -ml-1">
        <span class="size-5 rounded-full border-2" />
      </div>
      <input
        ref="inputRef"
        v-model="newTitle"
        type="text"
        placeholder="Nome da subtarefa..."
        class="flex-1 py-3 pr-2 bg-transparent text-[13px] text-foreground outline-none placeholder:text-muted-foreground"
        @keydown.enter="submitNew"
        @keydown.escape="cancelNew"
        @blur="handleBlur"
      />
    </div>

    <!-- Add trigger -->
    <button
      v-if="!adding"
      type="button"
      class="flex items-center gap-1.5 w-full py-2.5 pl-2 text-[13px] text-muted-foreground hover:text-muted-foreground transition-colors"
      @click="startAdding"
    >
      <Plus :size="13" />
      Adicionar subtarefa
    </button>
  </div>
</template>
