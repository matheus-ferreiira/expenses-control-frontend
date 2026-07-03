<script setup lang="ts">
import { ref, watch } from 'vue'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@ui/dialog'
import { Button } from '@ui/button'
import { Input } from '@ui/input'
import { DatePicker } from '@ui/date-picker'
import { Textarea } from '@ui/textarea'
import { Label } from '@ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@ui/select'
import { Loader2 } from 'lucide-vue-next'
import type { Goal, GoalType, GoalStatus } from '@/types/goals'
import {
  GOAL_TYPE_LABELS,
  GOAL_TYPE_ORDER,
  GOAL_STATUS_LABELS,
} from '@/types/goals'
import { useGoalStore } from '@/stores/goals'
import { useToast } from '@/composables/useToast'

const props = defineProps<{
  open: boolean
  goal?: Goal | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  created: [goal: Goal]
  updated: [goal: Goal]
}>()

const store = useGoalStore()
const toast = useToast()
const submitting = ref(false)

const form = ref({
  title: '',
  description: '',
  type: 'personal' as GoalType,
  target_amount: '',
  current_amount: '',
  target_date: '',
  status: 'active' as GoalStatus,
})

const errors = ref<Partial<Record<keyof typeof form.value, string>>>({})

function resetForm() {
  errors.value = {}
  form.value = {
    title: '',
    description: '',
    type: 'personal',
    target_amount: '',
    current_amount: '',
    target_date: '',
    status: 'active',
  }
}

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      errors.value = {}
      if (props.goal) {
        form.value = {
          title: props.goal.title,
          description: props.goal.description ?? '',
          type: props.goal.type,
          target_amount: props.goal.target_amount != null ? String(props.goal.target_amount) : '',
          current_amount: props.goal.current_amount ? String(props.goal.current_amount) : '',
          target_date: props.goal.target_date ?? '',
          status: props.goal.status,
        }
      } else {
        resetForm()
      }
    } else {
      resetForm()
    }
  },
)

function validate() {
  errors.value = {}
  if (!form.value.title.trim()) errors.value.title = 'Título é obrigatório'
  return Object.keys(errors.value).length === 0
}

function close() {
  emit('update:open', false)
}

async function submit() {
  if (!validate()) return
  submitting.value = true
  try {
    const payload = {
      title: form.value.title.trim(),
      description: form.value.description.trim() || undefined,
      type: form.value.type,
      target_amount: form.value.target_amount ? Number(form.value.target_amount) : undefined,
      current_amount: form.value.current_amount ? Number(form.value.current_amount) : undefined,
      target_date: form.value.target_date || undefined,
      status: form.value.status,
    }
    if (props.goal) {
      const updated = await store.updateGoal(props.goal.id, payload)
      emit('updated', updated)
      toast.success('Meta atualizada')
    } else {
      const created = await store.createGoal(payload)
      emit('created', created)
      toast.success('Meta criada')
    }
    close()
  } catch {
    toast.error('Erro ao salvar meta')
  } finally {
    submitting.value = false
  }
}

const statuses: GoalStatus[] = ['active', 'paused', 'completed', 'cancelled']
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="max-w-md">
      <DialogHeader>
        <DialogTitle>{{ goal ? 'Editar meta' : 'Nova meta' }}</DialogTitle>
      </DialogHeader>

      <div class="space-y-4 py-2">

        <!-- Title -->
        <div class="space-y-1.5">
          <Label class="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            Título <span class="text-destructive">*</span>
          </Label>
          <Input
            v-model="form.title"
            class="h-8 text-[13px]"
            placeholder="Ex: Reserva de emergência"
            autofocus
            :class="errors.title && 'border-destructive'"
          />
          <p v-if="errors.title" class="text-xs text-destructive">{{ errors.title }}</p>
        </div>

        <!-- Description -->
        <div class="space-y-1.5">
          <Label class="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            Descrição
          </Label>
          <Textarea
            v-model="form.description"
            class="min-h-[60px] resize-none text-[13px]"
            placeholder="Detalhes opcionais..."
          />
        </div>

        <!-- Type + Status row -->
        <div class="grid grid-cols-2 gap-3">
          <div class="space-y-1.5">
            <Label class="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              Tipo
            </Label>
            <Select v-model="form.type">
              <SelectTrigger class="h-8 text-[13px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="t in GOAL_TYPE_ORDER" :key="t" :value="t" class="text-[13px]">
                  {{ GOAL_TYPE_LABELS[t] }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="space-y-1.5">
            <Label class="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              Status
            </Label>
            <Select v-model="form.status">
              <SelectTrigger class="h-8 text-[13px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="s in statuses" :key="s" :value="s" class="text-[13px]">
                  {{ GOAL_STATUS_LABELS[s] }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <!-- Target amount + Current amount row -->
        <div class="grid grid-cols-2 gap-3">
          <div class="space-y-1.5">
            <Label class="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              Valor alvo
            </Label>
            <Input
              v-model="form.target_amount"
              type="number"
              min="0"
              step="0.01"
              class="h-8 text-[13px]"
              placeholder="0,00"
            />
          </div>

          <div class="space-y-1.5">
            <Label class="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              Valor atual
            </Label>
            <Input
              v-model="form.current_amount"
              type="number"
              min="0"
              step="0.01"
              class="h-8 text-[13px]"
              placeholder="0,00"
            />
          </div>
        </div>

        <!-- Target date -->
        <div class="space-y-1.5">
          <Label class="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            Prazo
          </Label>
          <DatePicker v-model="form.target_date" placeholder="Sem prazo" />
        </div>

      </div>

      <DialogFooter class="gap-2">
        <Button variant="outline" size="sm" :disabled="submitting" @click="close">
          Cancelar
        </Button>
        <Button size="sm" :disabled="submitting" @click="submit">
          <Loader2 v-if="submitting" :size="13" class="mr-1.5 animate-spin" />
          {{ goal ? 'Salvar' : 'Criar meta' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
