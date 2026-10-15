<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RefreshCw, Trash2 } from 'lucide-vue-next'
import type { RecurrenceUpdateScope } from '@/types/finance'

/** mode "delete" asks which occurrences to remove; what was already paid is never rewritten or deleted. */
const props = withDefaults(defineProps<{ open: boolean; mode?: 'edit' | 'delete'; loading?: boolean }>(), {
  mode: 'edit',
  loading: false,
})

const emit = defineEmits<{
  'update:open': [value: boolean]
  confirm: [scope: RecurrenceUpdateScope]
}>()

const selected = ref<RecurrenceUpdateScope>('this_only')
watch(() => props.open, (open) => { if (open) selected.value = 'this_only' })

const editOptions: { value: RecurrenceUpdateScope; label: string; description: string }[] = [
  {
    value: 'this_only',
    label: 'Só esta',
    description: 'Altera apenas a ocorrência selecionada',
  },
  {
    value: 'this_and_future',
    label: 'Esta e as futuras',
    description: 'Altera esta e as próximas ainda não pagas',
  },
  {
    value: 'all',
    label: 'Todas as não pagas',
    description: 'Altera todas as previsões ainda não pagas da série. O que já foi pago não muda',
  },
]

const deleteOptions: { value: RecurrenceUpdateScope; label: string; description: string }[] = [
  {
    value: 'this_only',
    label: 'Só esta',
    description: 'Exclui apenas esta ocorrência; a série continua',
  },
  {
    value: 'this_and_future',
    label: 'Esta e as futuras',
    description: 'Encerra a série a partir daqui. O que já foi pago continua no histórico',
  },
]

const options = computed(() => (props.mode === 'delete' ? deleteOptions : editOptions))

function confirm() {
  emit('confirm', selected.value)
  // In delete mode the parent closes the dialog once the API answers
  if (props.mode === 'edit') emit('update:open', false)
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
          class="absolute inset-0 bg-background backdrop-blur-sm"
          @click="cancel"
        />

        <!-- Panel -->
        <div class="relative w-full sm:max-w-sm bg-card rounded-t-lg sm:rounded-lg  p-5 pb-safe">
          <!-- Icon + title -->
          <div class="flex items-center gap-3 mb-4">
            <div
              class="flex items-center justify-center w-9 h-9 rounded-xl bg-muted shrink-0"
              :class="mode === 'delete' ? 'text-destructive' : 'text-primary'"
            >
              <Trash2 v-if="mode === 'delete'" :size="16" />
              <RefreshCw v-else :size="16" />
            </div>
            <div>
              <h3 class="text-[14px] font-semibold text-foreground">
                {{ mode === 'delete' ? 'Excluir transação fix' : 'Editar transação fix' }}
              </h3>
              <p class="text-[11px] text-muted-foreground mt-0.5">
                {{ mode === 'delete' ? 'O que deve ser excluído?' : 'Qual o escopo da alteração?' }}
              </p>
            </div>
          </div>

          <!-- Options -->
          <div class="space-y-2 mb-5">
            <button
              v-for="opt in options"
              :key="opt.value"
              type="button"
              class="w-full text-left flex items-start gap-3 p-3 rounded-xl  transition-all"
              :class="selected === opt.value
                ? 'border-primary bg-muted'
                : 'border-border hover:border-border hover:bg-muted'"
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
                <p class="text-[11px] text-muted-foreground mt-1 leading-snug">{{ opt.description }}</p>
              </div>
            </button>
          </div>

          <!-- Actions -->
          <div class="flex gap-2">
            <button
              type="button"
              class="flex-1 h-10 rounded-lg text-[13px] font-medium text-muted-foreground hover:bg-muted transition-colors"
              @click="cancel"
            >
              Cancelar
            </button>
            <button
              type="button"
              :disabled="loading"
              class="flex-1 h-10 rounded-lg text-[14px] font-semibold hover:brightness-110 transition-colors disabled:opacity-60"
              :class="mode === 'delete' ? 'bg-destructive text-background' : 'bg-primary text-primary-foreground'"
              @click="confirm"
            >
              {{ mode === 'delete' ? (loading ? 'Excluindo...' : 'Excluir') : 'Confirmar' }}
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
