<script setup lang="ts">
import { ref } from 'vue'
import { ExternalLink, CheckCircle2, Calendar } from 'lucide-vue-next'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@ui/dialog'
import { Button } from '@ui/button'

defineProps<{
  open: boolean
  connected: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  connect: []
  disconnect: []
}>()

const confirmDisconnect = ref(false)
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="sm:max-w-[400px]">
      <DialogHeader>
        <div class="flex items-center gap-2.5 mb-1">
          <Calendar :size="18" style="color: hsl(var(--primary))" />
          <DialogTitle class="text-[15px]">Google Calendar</DialogTitle>
        </div>
        <DialogDescription class="text-[13px] leading-relaxed">
          Sincronize seus eventos do Google Calendar com o Vault.
          Eventos importados ficam marcados com a fonte "Google".
        </DialogDescription>
      </DialogHeader>

      <!-- Connected state -->
      <div v-if="connected" class="space-y-4">
        <div
          class="flex items-center gap-3 px-3 py-2.5 rounded-md"
          style="background: hsl(var(--success) / 0.08); border: 1px solid hsl(var(--success) / 0.2)"
        >
          <CheckCircle2 :size="14" style="color: hsl(var(--success))" />
          <span class="text-[13px] font-medium" style="color: hsl(var(--success))">
            Conta conectada
          </span>
        </div>

        <div v-if="!confirmDisconnect" class="flex justify-end">
          <Button variant="ghost" size="sm" class="text-[13px] h-8" @click="confirmDisconnect = true">
            Desconectar
          </Button>
        </div>
        <div v-else class="space-y-2">
          <p class="text-[12px]" style="color: hsl(var(--muted-foreground))">
            Tem certeza? Os eventos importados serão mantidos.
          </p>
          <div class="flex justify-end gap-2">
            <Button variant="ghost" size="sm" class="h-8 text-[13px]" @click="confirmDisconnect = false">
              Cancelar
            </Button>
            <Button variant="destructive" size="sm" class="h-8 text-[13px]" @click="emit('disconnect')">
              Desconectar
            </Button>
          </div>
        </div>
      </div>

      <!-- Disconnected state -->
      <div v-else class="space-y-4">
        <div class="space-y-2 text-[12px]" style="color: hsl(var(--muted-foreground))">
          <p class="flex items-start gap-2">
            <span class="text-primary font-medium shrink-0">→</span>
            Leitura dos eventos do Google Calendar
          </p>
          <p class="flex items-start gap-2">
            <span class="text-primary font-medium shrink-0">→</span>
            Sincronização automática a cada hora
          </p>
          <p class="flex items-start gap-2">
            <span class="text-primary font-medium shrink-0">→</span>
            Eventos do Vault não são enviados para o Google
          </p>
        </div>

        <div class="flex items-center justify-between pt-1">
          <Button variant="ghost" size="sm" class="h-8 text-[13px]" @click="emit('update:open', false)">
            Cancelar
          </Button>
          <Button size="sm" class="h-8 text-[13px] gap-1.5" @click="emit('connect')">
            <ExternalLink :size="12" />
            Conectar com Google
          </Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>
