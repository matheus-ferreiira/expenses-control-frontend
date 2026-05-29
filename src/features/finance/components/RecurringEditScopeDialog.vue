<script setup lang="ts">
import { ref } from 'vue'
import { RefreshCw } from 'lucide-vue-next'
import type { RecurrenceUpdateScope } from '@/types/finance'

defineProps<{ open: boolean }>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  confirm: [scope: RecurrenceUpdateScope]
}>()

const selected = ref<RecurrenceUpdateScope>('this_only')

const options: { value: RecurrenceUpdateScope; label: string; description: string }[] = [
  {
    value: 'this_only',
    label: 'Só esta',
    description: 'Altera apenas a ocorrência selecionada',
  },
  {
    value: 'this_and_future',
    label: 'Esta e as futuras',
    description: 'Altera esta e todas as ocorrências seguintes da série',
  },
  {
    value: 'all',
    label: 'Todas',
    description: 'Altera todas as ocorrências da série (passadas e futuras)',
  },
]

function confirm() {
  emit('confirm', selected.value)
  emit('update:open', false)
}

function cancel() {
  emit('update:open', false)
}
</script>

<template>
  <!-- Backdrop -->
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="open"
        class="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center"
      >
        <!-- Overlay -->
        <div
          class="absolute inset-0 bg-black/60 backdrop-blur-sm"
          @click="cancel"
        />

        <!-- Panel -->
        <div class="relative w-full sm:max-w-sm bg-card border border-border rounded-t-lg sm:rounded-lg shadow-xl p-5 pb-safe">
          <!-- Icon + title -->
          <div class="flex items-center gap-3 mb-4">
            <div class="flex items-center justify-center w-9 h-9 rounded-xl bg-primary/10 text-primary shrink-0">
              <RefreshCw :size="16" />
            </div>
            <div>
              <h3 class="text-sm font-semibold text-foreground">Editar transação fix</h3>
              <p class="text-[11px] text-muted-foreground/60 mt-0.5">Qual o escopo da alteração?</p>
            </div>
          </div>

          <!-- Options -->
          <div class="space-y-2 mb-5">
            <button
              v-for="opt in options"
              :key="opt.value"
              type="button"
              class="w-full text-left flex items-start gap-3 p-3 rounded-xl border transition-all"
              :class="selected === opt.value
                ? 'border-primary bg-primary/5'
                : 'border-border/50 hover:border-border hover:bg-muted/40'"
              @click="selected = opt.value"
            >
              <!-- Radio dot -->
              <span
                class="mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors"
                :class="selected === opt.value ? 'border-primary' : 'border-border'"
              >
                <span
                  v-if="selected === opt.value"
                  class="w-1.5 h-1.5 rounded-full bg-primary"
                />
              </span>
              <div class="flex-1 min-w-0">
                <p class="text-[13px] font-medium text-foreground leading-none">{{ opt.label }}</p>
                <p class="text-[11px] text-muted-foreground/60 mt-1 leading-snug">{{ opt.description }}</p>
              </div>
            </button>
          </div>

          <!-- Actions -->
          <div class="flex gap-2">
            <button
              type="button"
              class="flex-1 h-10 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:bg-muted/50 transition-colors"
              @click="cancel"
            >
              Cancelar
            </button>
            <button
              type="button"
              class="flex-1 h-10 rounded-lg bg-foreground text-background text-sm font-semibold hover:opacity-90 transition-opacity"
              @click="confirm"
            >
              Confirmar
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
