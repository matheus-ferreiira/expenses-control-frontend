<script setup lang="ts">
import { computed, watch } from 'vue'
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
import { Loader2, Activity } from 'lucide-vue-next'
import type { Habit } from '@/types/habits'
import { HABIT_FREQUENCY_LABELS } from '@/types/habits'
import { WEEKDAY_LABELS } from '../types'
import { useHabitForm } from '../composables/useHabitForm'
import { useHabitStore } from '@/stores/habits'
import { useToast } from '@/composables/useToast'
import { IconPicker, ColorPicker } from '@/components/shared'
import { findIcon } from '@/lib/icons'

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

const previewIcon = computed(() => {
  if (form.icon) return findIcon(form.icon)?.component
  return Activity
})
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="max-w-md">
      <DialogHeader>
        <DialogTitle>{{ habit ? 'Editar hábito' : 'Novo hábito' }}</DialogTitle>
      </DialogHeader>

      <div class="space-y-4 py-2">

        <!-- Live preview card -->
        <div
          class="flex items-center gap-3 p-3 rounded-xl border border-border/60 bg-card/50"
          :style="{ borderColor: form.color + '40' }"
        >
          <span
            class="flex items-center justify-center w-10 h-10 rounded-lg shrink-0"
            :style="{ backgroundColor: form.color + '25', color: form.color }"
          >
            <component :is="previewIcon" :size="20" />
          </span>
          <div class="min-w-0">
            <p class="text-sm font-medium truncate text-foreground/90">
              {{ form.name || 'Nome do hábito' }}
            </p>
            <p class="text-xs text-muted-foreground mt-0.5">
              {{ HABIT_FREQUENCY_LABELS[form.frequency] ?? form.frequency }}
            </p>
          </div>
        </div>

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

        <!-- Frequency buttons -->
        <div class="space-y-1.5">
          <Label>Frequência</Label>
          <div class="grid grid-cols-3 gap-1.5">
            <button
              v-for="f in frequencies"
              :key="f"
              type="button"
              :class="[
                'h-8 rounded-md text-xs font-medium border transition-all',
                form.frequency === f
                  ? 'bg-violet-500/20 text-violet-400 border-violet-500/60'
                  : 'border-border text-muted-foreground hover:bg-accent',
              ]"
              @click="form.frequency = f"
            >
              {{ HABIT_FREQUENCY_LABELS[f] }}
            </button>
          </div>
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

        <!-- Color -->
        <div class="space-y-1.5">
          <Label>Cor</Label>
          <ColorPicker v-model="form.color" />
        </div>

        <!-- Icon -->
        <div class="space-y-1.5">
          <Label>Ícone</Label>
          <IconPicker v-model="form.icon" :color="form.color" />
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
