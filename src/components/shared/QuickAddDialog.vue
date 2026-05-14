<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUiStore } from '@/stores/ui'
import { ROUTES } from '@/constants/routes'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@ui/dialog'
import { CheckSquare, FileText, Wallet, Flame } from 'lucide-vue-next'

const ui = useUiStore()
const router = useRouter()

const open = computed({
  get: () => ui.quickAddOpen,
  set: (v) => (ui.quickAddOpen = v),
})

const quickActions = [
  {
    label: 'Nova tarefa',
    icon: CheckSquare,
    description: 'Criar uma nova tarefa',
    action: () => router.push({ name: ROUTES.TASKS }),
  },
  {
    label: 'Nova nota',
    icon: FileText,
    description: 'Capturar uma ideia ou nota rápida',
    action: () => router.push({ name: ROUTES.NOTES }),
  },
  {
    label: 'Nova transação',
    icon: Wallet,
    description: 'Registrar receita ou despesa',
    action: () => router.push({ name: ROUTES.FINANCE }),
  },
  {
    label: 'Novo hábito',
    icon: Flame,
    description: 'Adicionar um hábito recorrente',
    action: () => router.push({ name: ROUTES.HABITS }),
  },
]

function handleAction(action: () => void) {
  ui.quickAddOpen = false
  action()
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="max-w-sm p-0 overflow-hidden">
      <DialogHeader class="px-5 pt-5 pb-3 border-b border-border">
        <DialogTitle class="text-[13px] font-medium text-foreground/80">Adicionar rapidamente</DialogTitle>
      </DialogHeader>
      <div class="p-2">
        <button
          v-for="item in quickActions"
          :key="item.label"
          class="flex items-center gap-3 w-full px-3 py-2.5 rounded-md text-left hover:bg-foreground/[0.05] transition-base group"
          @click="handleAction(item.action)"
        >
          <div class="w-7 h-7 rounded-md bg-foreground/[0.06] flex items-center justify-center shrink-0 group-hover:bg-foreground/[0.09] transition-base">
            <component :is="item.icon" :size="14" class="text-muted-foreground" />
          </div>
          <div class="min-w-0">
            <p class="text-[13px] font-medium text-foreground leading-none mb-0.5">{{ item.label }}</p>
            <p class="text-[11px] text-muted-foreground/50 leading-none">{{ item.description }}</p>
          </div>
        </button>
      </div>
      <div class="px-4 py-2.5 border-t border-border bg-foreground/[0.02]">
        <p class="text-[10px] text-muted-foreground/30 text-center">Atalho: <kbd class="font-mono">N</kbd></p>
      </div>
    </DialogContent>
  </Dialog>
</template>
