<script setup lang="ts">
import { computed, watch } from 'vue'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@ui/dialog'
import { Button } from '@ui/button'
import { Input } from '@ui/input'
import { Loader2, ArrowLeft, Activity, Check, Heart, Brain, BookOpen, Target, Wallet } from 'lucide-vue-next'
import type { Habit } from '@/types/habits'
import { HABIT_FREQUENCY_LABELS } from '@/types/habits'
import { WEEKDAY_LABELS } from '../types'
import { useHabitForm } from '../composables/useHabitForm'
import { useHabitStore } from '@/stores/habits'
import { useToast } from '@/composables/useToast'
import { IconPicker, ColorPicker } from '@/components/shared'
import { findIcon } from '@/lib/icons'

const CATEGORIES = [
  { label: 'Saúde', icon: Heart, color: 'hsl(var(--destructive))' },
  { label: 'Mente', icon: Brain, color: 'hsl(217 91% 68%)' },
  { label: 'Aprendizado', icon: BookOpen, color: 'hsl(var(--chart-1, 220 70% 60%))' },
  { label: 'Foco', icon: Target, color: 'hsl(var(--warning))' },
  { label: 'Finanças', icon: Wallet, color: 'hsl(var(--success))' },
] as const

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

const selectedCategoryColor = computed(() => {
  const cat = CATEGORIES.find((c) => c.label === form.category)
  return cat?.color ?? null
})
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent
      hide-close
      class="fixed bottom-0 left-0 right-0 top-auto max-w-none w-full max-h-[92vh] rounded-t-2xl rounded-b-none border-0 border-t border-border p-0 flex flex-col translate-x-0 translate-y-0 gap-0"
    >
      <!-- Header -->
      <div class="flex items-center gap-3 px-4 h-14 border-b border-border shrink-0">
        <Button variant="ghost" size="icon" class="h-8 w-8 shrink-0" @click="close">
          <ArrowLeft :size="18" />
        </Button>
        <DialogTitle class="text-[15px] font-semibold">
          {{ habit ? 'Editar hábito' : 'Novo hábito' }}
        </DialogTitle>
      </div>

      <!-- Scrollable body -->
      <div class="flex-1 overflow-y-auto">
        <div class="max-w-lg mx-auto px-5 py-6 space-y-5">

          <!-- Live preview card -->
          <div
            class="flex items-center gap-3 p-3 rounded-lg bg-muted"
            :style="{ borderColor: (selectedCategoryColor ?? form.color) + '40' }"
          >
            <span
              class="flex items-center justify-center w-10 h-10 rounded-lg shrink-0"
              :style="{ backgroundColor: form.color + '25', color: form.color }"
            >
              <component :is="previewIcon" :size="20" />
            </span>
            <div class="min-w-0">
              <p class="text-sm font-medium truncate text-foreground">
                {{ form.name || 'Nome do hábito' }}
              </p>
              <p class="text-xs text-muted-foreground mt-0.5">
                {{ form.category ?? HABIT_FREQUENCY_LABELS[form.frequency] ?? form.frequency }}
              </p>
            </div>
          </div>

          <!-- Name -->
          <div class="space-y-1.5">
            <label class="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Nome do hábito
            </label>
            <Input
              id="habit-name"
              v-model="form.name"
              placeholder="Ex: Meditar 10 minutos"
              autofocus
              :class="[
                'h-11 bg-muted focus-visible:border-border focus-visible:ring-0 focus-visible:ring-offset-0',
                errors.name && 'border-destructive',
              ]"
            />
            <p v-if="errors.name" class="text-xs text-destructive">{{ errors.name }}</p>
          </div>

          <!-- Frequency buttons -->
          <div class="space-y-1.5">
            <label class="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Frequência
            </label>
            <div class="grid grid-cols-3 gap-1.5">
              <button
                v-for="f in frequencies"
                :key="f"
                type="button"
                :class="[
                  'h-9 rounded-md text-xs font-medium  transition-all',
                  form.frequency === f
                    ? 'bg-foreground text-background'
                    : 'border-border text-muted-foreground hover:bg-accent',
                ]"
                @click="form.frequency = f"
              >
                {{ HABIT_FREQUENCY_LABELS[f] }}
              </button>
            </div>
          </div>

          <!-- Category chips -->
          <div class="space-y-1.5">
            <label class="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Categoria
            </label>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="cat in CATEGORIES"
                :key="cat.label"
                type="button"
                class="inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-xs font-medium  transition-all"
                :style="form.category === cat.label
                  ? `background: color-mix(in oklab, ${cat.color} 18%, transparent); color: ${cat.color}; border-color: color-mix(in oklab, ${cat.color} 40%, transparent)`
                  : 'border-color: hsl(var(--border)); color: hsl(var(--muted-foreground))'"
                @click="form.category = form.category === cat.label ? null : cat.label"
              >
                <component :is="cat.icon" :size="12" />
                {{ cat.label }}
              </button>
            </div>
          </div>

          <!-- Target days (weekly/monthly only) -->
          <div v-if="form.frequency !== 'daily'" class="space-y-1.5">
            <label class="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Dias da semana
            </label>
            <div class="flex gap-1.5">
              <button
                v-for="day in weekdays"
                :key="day"
                type="button"
                :class="[
                  'flex-1 h-8 text-xs font-medium rounded-md  transition-base',
                  form.target_days.includes(day)
                    ? 'bg-foreground text-background'
                    : 'border-border text-muted-foreground ',
                ]"
                @click="toggleTargetDay(day)"
              >
                {{ WEEKDAY_LABELS[day]?.charAt(0) }}
              </button>
            </div>
            <p v-if="errors.target_days" class="text-xs text-destructive">{{ errors.target_days }}</p>
          </div>

          <!-- Color -->
          <div class="space-y-1.5">
            <label class="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Cor
            </label>
            <ColorPicker v-model="form.color" />
          </div>

          <!-- Icon -->
          <div class="space-y-1.5">
            <label class="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Ícone
            </label>
            <IconPicker v-model="form.icon" :color="form.color" />
          </div>

        </div>
      </div>

      <!-- Footer — full-width green submit -->
      <div class="shrink-0 px-5 py-4 border-t border-border">
        <div class="max-w-lg mx-auto">
          <Button
            class="w-full h-12 text-sm font-medium rounded-lg bg-success text-background hover:bg-muted"
            :disabled="submitting"
            @click="submit"
          >
            <Loader2 v-if="submitting" :size="14" class="mr-1.5 animate-spin" />
            <Check v-else :size="14" class="mr-1.5" />
            {{ habit ? 'Salvar alterações' : 'Criar hábito' }}
          </Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>
