<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@ui/dialog'
import { Button } from '@ui/button'
import { Input } from '@ui/input'
import { Label } from '@ui/label'
import { Loader2, Minus, Plus } from 'lucide-vue-next'
import GoalProgressBar from './GoalProgressBar.vue'
import type { Goal } from '@/types/goals'
import { formatCurrency } from '@/utils/currency'
import { useGoalStore } from '@/stores/goals'
import { useToast } from '@/composables/useToast'

const props = defineProps<{
  open: boolean
  goal: Goal | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  updated: [goal: Goal]
}>()

const store = useGoalStore()
const toast = useToast()
const submitting = ref(false)
const currentValue = ref(0)

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen && props.goal) {
      currentValue.value = props.goal.current_amount
    }
  },
)

const previewPct = computed(() => {
  if (!props.goal?.target_amount) return 0
  return Math.min(Math.round((currentValue.value / props.goal.target_amount) * 100), 100)
})

const exceedsTarget = computed(() =>
  !!props.goal?.target_amount && currentValue.value > props.goal.target_amount,
)

const step = computed(() => {
  if (!props.goal?.target_amount) return 1
  return props.goal.target_amount >= 10000 ? 500 : props.goal.target_amount >= 1000 ? 100 : 10
})

function decrement() {
  currentValue.value = Math.max(0, currentValue.value - step.value)
}

function increment() {
  const max = props.goal?.target_amount ?? Infinity
  currentValue.value = Math.min(max, currentValue.value + step.value)
}

function close() {
  emit('update:open', false)
}

async function submit() {
  if (!props.goal) return
  submitting.value = true
  try {
    const updated = await store.updateProgress(props.goal.id, currentValue.value)
    emit('updated', updated)
    toast.success('Progresso atualizado')
    close()
  } catch {
    toast.error('Erro ao atualizar progresso')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <Dialog :open="open && !!goal" @update:open="emit('update:open', $event)">
    <DialogContent class="max-w-sm">
      <DialogHeader>
        <DialogTitle class="text-[15px]">Atualizar progresso</DialogTitle>
      </DialogHeader>

      <div v-if="goal" class="space-y-5 py-2">

        <!-- Goal title -->
        <p class="text-[12px] text-muted-foreground/60 truncate -mt-1">{{ goal.title }}</p>

        <!-- Progress preview -->
        <div class="space-y-2">
          <GoalProgressBar :percentage="goal.target_amount ? previewPct : 0" />
          <div class="flex items-center justify-between">
            <span class="text-[11px] text-muted-foreground/50 tabular-nums">
              <template v-if="goal.target_amount">
                {{ formatCurrency(currentValue) }} / {{ formatCurrency(goal.target_amount) }}
              </template>
              <template v-else>
                valor atual
              </template>
            </span>
            <span
              :class="[
                'text-[12px] font-semibold tabular-nums',
                previewPct >= 100 ? 'text-success' : 'text-muted-foreground/70',
              ]"
            >
              {{ goal.target_amount ? previewPct : '' }}{{ goal.target_amount ? '%' : '' }}
            </span>
          </div>
        </div>

        <!-- Input + step buttons -->
        <div class="space-y-1.5">
          <Label class="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/60">
            Valor atual
          </Label>
          <div class="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              class="h-8 w-8 shrink-0"
              :disabled="currentValue <= 0"
              @click="decrement"
            >
              <Minus :size="13" />
            </Button>
            <Input
              v-model.number="currentValue"
              type="number"
              min="0"
              :max="goal?.target_amount ?? undefined"
              step="any"
              :class="['h-8 text-[13px] text-center tabular-nums', exceedsTarget ? 'border-warning/60' : '']"
            />
            <Button
              variant="outline"
              size="icon"
              class="h-8 w-8 shrink-0"
              @click="increment"
            >
              <Plus :size="13" />
            </Button>
          </div>
          <p v-if="exceedsTarget" class="text-[11px]" style="color: hsl(var(--warning))">
            Valor ultrapassa a meta ({{ formatCurrency(goal!.target_amount!) }})
          </p>
          <p v-else-if="goal.target_amount" class="text-[11px] text-muted-foreground/40">
            Incremento: {{ formatCurrency(step) }}
          </p>
        </div>

      </div>

      <DialogFooter class="gap-2">
        <Button variant="outline" size="sm" :disabled="submitting" @click="close">
          Cancelar
        </Button>
        <Button size="sm" :disabled="submitting" @click="submit">
          <Loader2 v-if="submitting" :size="13" class="mr-1.5 animate-spin" />
          Salvar
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
