<script setup lang="ts">
import { watch } from 'vue'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@ui/dialog'
import { Button } from '@ui/button'
import { Input } from '@ui/input'
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
import type { Habit } from '@/types/habits'
import { HABIT_FREQUENCY_LABELS } from '@/types/habits'
import { HABIT_COLORS, WEEKDAY_LABELS } from '../types'
import { useHabitForm } from '../composables/useHabitForm'
import { useHabitStore } from '@/stores/habits'
import { useToast } from '@/composables/useToast'

const props = defineProps<{
  open: boolean
  habit?: Habit | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  created: [habit: Habit]
  updated: [habit: Habit]
}>()

const store = useHabitStore()
const toast = useToast()
const { form, errors, submitting, fromHabit, reset, validate, toggleTargetDay, toPayload } = useHabitForm()

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      if (props.habit) fromHabit(props.habit)
      else reset()
    }
  },
)

function close() {
  emit('update:open', false)
}

async function submit() {
  if (!validate()) return
  submitting.value = true
  try {
    if (props.habit) {
      const updated = await store.updateHabit(props.habit.id, toPayload())
      emit('updated', updated)
      toast.success('Hábito atualizado')
    } else {
      const created = await store.createHabit(toPayload())
      emit('created', created)
      toast.success('Hábito criado')
    }
    close()
  } catch {
    toast.error('Erro ao salvar hábito')
  } finally {
    submitting.value = false
  }
}

const frequencies = ['daily', 'weekly', 'monthly'] as const

const weekdays = [0, 1, 2, 3, 4, 5, 6] as const
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="max-w-md">
      <DialogHeader>
        <DialogTitle>{{ habit ? 'Editar hábito' : 'Novo hábito' }}</DialogTitle>
      </DialogHeader>

      <div class="space-y-4 py-2">
        <!-- Name -->
        <div class="space-y-1.5">
          <Label for="habit-name">Nome <span class="text-destructive">*</span></Label>
          <Input
            id="habit-name"
            v-model="form.name"
            placeholder="Ex: Meditar 10 minutos"
            autofocus
            :class="errors.name && 'border-destructive'"
          />
          <p v-if="errors.name" class="text-xs text-destructive">{{ errors.name }}</p>
        </div>

        <!-- Description -->
        <div class="space-y-1.5">
          <Label for="habit-desc">Descrição</Label>
          <Textarea
            id="habit-desc"
            v-model="form.description"
            placeholder="Detalhes opcionais..."
            class="min-h-[64px] resize-none text-sm"
          />
        </div>

        <!-- Frequency -->
        <div class="space-y-1.5">
          <Label>Frequência</Label>
          <Select v-model="form.frequency">
            <SelectTrigger class="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="f in frequencies" :key="f" :value="f">
                {{ HABIT_FREQUENCY_LABELS[f] }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <!-- Target days (weekly/monthly only) -->
        <div v-if="form.frequency !== 'daily'" class="space-y-1.5">
          <Label>Dias da semana</Label>
          <div class="flex gap-1.5">
            <button
              v-for="day in weekdays"
              :key="day"
              type="button"
              :class="[
                'flex-1 h-8 text-xs font-medium rounded-md border transition-base',
                form.target_days.includes(day)
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border text-muted-foreground hover:border-foreground/30',
              ]"
              @click="toggleTargetDay(day)"
            >
              {{ WEEKDAY_LABELS[day]?.charAt(0) }}
            </button>
          </div>
        </div>

        <!-- Color palette -->
        <div class="space-y-1.5">
          <Label>Cor</Label>
          <div class="flex gap-2 flex-wrap">
            <button
              v-for="c in HABIT_COLORS"
              :key="c.value"
              type="button"
              :title="c.label"
              :class="[
                'w-7 h-7 rounded-full transition-transform hover:scale-110',
                form.color === c.value && 'ring-2 ring-offset-2 ring-offset-background ring-foreground scale-110',
              ]"
              :style="{ backgroundColor: c.value }"
              @click="form.color = c.value"
            />
          </div>
        </div>
      </div>

      <DialogFooter class="gap-2">
        <Button variant="outline" :disabled="submitting" @click="close">Cancelar</Button>
        <Button :disabled="submitting" @click="submit">
          <Loader2 v-if="submitting" :size="14" class="mr-1.5 animate-spin" />
          {{ habit ? 'Salvar' : 'Criar hábito' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
