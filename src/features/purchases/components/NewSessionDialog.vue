<script setup lang="ts">
import { ref } from 'vue'
import { Loader2, Check } from 'lucide-vue-next'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@ui/dialog'
import { useShoppingSessionStore } from '@/stores/shoppingSessions'
import { useToast } from '@/composables/useToast'

const open = defineModel<boolean>('open', { default: false })

const store = useShoppingSessionStore()
const toast = useToast()

const title = ref('')
const submitting = ref(false)

const today = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' }).format(new Date())

async function submit() {
  const value = title.value.trim()
  if (!value) return
  submitting.value = true
  try {
    await store.createSession(value)
    toast.success('Lista criada')
    title.value = ''
    open.value = false
  } catch {
    toast.error('Erro ao criar lista')
  } finally {
    submitting.value = false
  }
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') submit()
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="max-w-sm">
      <DialogHeader>
        <DialogTitle class="text-[16px] font-semibold">Nova lista de compras</DialogTitle>
      </DialogHeader>

      <div class="space-y-4 pt-1">
        <div>
          <p class="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-1.5">
            Nome da lista
          </p>
          <input
            v-model="title"
            autofocus
            :placeholder="`Mercado ${today}`"
            class="w-full h-11 px-3 rounded-lg bg-card border border-border/60 focus:border-primary/60 outline-none text-[13px] transition-colors"
            @keydown="handleKeydown"
          />
        </div>

        <button
          type="button"
          class="w-full h-[52px] rounded-xl font-semibold text-[13px] bg-primary text-primary-foreground flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
          :disabled="submitting || !title.trim()"
          @click="submit"
        >
          <Loader2 v-if="submitting" :size="14" class="animate-spin" />
          <Check v-else :size="14" />
          Criar lista
        </button>
      </div>
    </DialogContent>
  </Dialog>
</template>
