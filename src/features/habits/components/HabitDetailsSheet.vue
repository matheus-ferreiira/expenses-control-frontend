<script setup lang="ts">
import { watch } from 'vue'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@ui/sheet'
import { Button } from '@ui/button'
import { Separator } from '@ui/separator'
import { Pencil, Archive, Trash2, Check } from 'lucide-vue-next'
import HabitFrequencyBadge from './HabitFrequencyBadge.vue'
import HabitStreakBadge from './HabitStreakBadge.vue'
import HabitStatsCard from './HabitStatsCard.vue'
import HabitHeatmap from './HabitHeatmap.vue'
import { ConfirmDialog } from '@/components/shared'
import type { Habit } from '@/types/habits'
import { isCompletedToday, formatLogDate } from '../utils/habitHelpers'
import { useHabitStats } from '../composables/useHabitStats'
import { useHabitStore } from '@/stores/habits'
import { useToast } from '@/composables/useToast'
import { ref } from 'vue'

const props = defineProps<{
  open: boolean
  habit: Habit | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  edit: [habit: Habit]
  deleted: [id: string]
}>()

const store = useHabitStore()
const toast = useToast()
const statsHelper = useHabitStats()
const showDeleteConfirm = ref(false)
const deleting = ref(false)

watch(
  () => [props.open, props.habit?.id],
  ([isOpen, habitId]) => {
    if (isOpen && habitId && typeof habitId === 'string') {
      statsHelper.fetchStats(habitId)
    }
  },
  { immediate: true },
)

async function handleLog() {
  if (!props.habit) return
  try {
    await store.optimisticLog(props.habit.id)
    statsHelper.invalidate(props.habit.id)
    statsHelper.fetchStats(props.habit.id)
  } catch {
    toast.error('Erro ao registrar hábito')
  }
}

async function handleDelete() {
  if (!props.habit) return
  deleting.value = true
  try {
    await store.deleteHabit(props.habit.id)
    emit('deleted', props.habit.id)
    emit('update:open', false)
    toast.success('Hábito excluído')
  } catch {
    toast.error('Erro ao excluir hábito')
  } finally {
    deleting.value = false
    showDeleteConfirm.value = false
  }
}

async function handleArchive() {
  if (!props.habit) return
  try {
    await store.archiveHabit(props.habit.id)
    toast.success('Hábito arquivado')
  } catch {
    toast.error('Erro ao arquivar hábito')
  }
}
</script>

<template>
  <Sheet :open="open" @update:open="emit('update:open', $event)">
    <SheetContent class="w-full sm:max-w-lg overflow-y-auto" side="right">
      <template v-if="habit">
        <SheetHeader class="pr-8">
          <!-- Color dot + name -->
          <div class="flex items-center gap-3">
            <span
              class="w-3 h-3 rounded-full shrink-0"
              :style="{ backgroundColor: habit.color }"
            />
            <SheetTitle class="text-left leading-snug">{{ habit.name }}</SheetTitle>
          </div>
        </SheetHeader>

        <div class="mt-5 space-y-5">
          <!-- Badges + quick log -->
          <div class="flex items-center gap-2 flex-wrap">
            <HabitFrequencyBadge :frequency="habit.frequency" />
            <HabitStreakBadge :streak="habit.current_streak" size="md" />
            <Button
              class="ml-auto h-8 gap-1.5"
              :variant="isCompletedToday(habit) ? 'outline' : 'default'"
              :class="isCompletedToday(habit) && 'border-emerald-500/40 text-emerald-400 hover:border-emerald-500'"
              size="sm"
              @click="handleLog"
            >
              <Check :size="13" />
              {{ isCompletedToday(habit) ? 'Feito hoje' : 'Marcar hoje' }}
            </Button>
          </div>

          <p v-if="habit.description" class="text-sm text-muted-foreground">
            {{ habit.description }}
          </p>

          <Separator />

          <!-- Stats -->
          <div>
            <p class="text-sm font-semibold mb-3">Estatísticas</p>
            <HabitStatsCard
              :stats="statsHelper.getStats(habit.id)"
              :loading="statsHelper.isLoading(habit.id)"
            />
          </div>

          <Separator />

          <!-- Heatmap -->
          <div>
            <p class="text-sm font-semibold mb-3">Histórico de conclusões</p>
            <HabitHeatmap
              :entries="statsHelper.getHeatmap(habit.id)"
              :loading="statsHelper.isLoading(habit.id)"
            />
          </div>

          <!-- Recent logs -->
          <div v-if="habit.logs.length > 0">
            <Separator class="mb-4" />
            <p class="text-sm font-semibold mb-2">Últimos registros</p>
            <div class="space-y-1.5">
              <div
                v-for="log in habit.logs.slice().reverse().slice(0, 10)"
                :key="log.id"
                class="flex items-center gap-2 text-sm"
              >
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span class="text-muted-foreground">{{ formatLogDate(log.completed_date) }}</span>
                <span v-if="log.notes" class="text-foreground truncate">{{ log.notes }}</span>
              </div>
            </div>
          </div>

          <Separator />

          <!-- Actions -->
          <div class="flex items-center gap-2">
            <Button variant="outline" size="sm" class="gap-1.5" @click="emit('edit', habit)">
              <Pencil :size="13" />
              Editar
            </Button>
            <Button
              v-if="habit.is_active"
              variant="outline"
              size="sm"
              class="gap-1.5"
              @click="handleArchive"
            >
              <Archive :size="13" />
              Arquivar
            </Button>
            <Button
              variant="outline"
              size="sm"
              class="gap-1.5 text-destructive hover:text-destructive border-destructive/30 hover:border-destructive/60 ml-auto"
              @click="showDeleteConfirm = true"
            >
              <Trash2 :size="13" />
              Excluir
            </Button>
          </div>

          <!-- Metadata -->
          <div class="text-xs text-muted-foreground/60 space-y-0.5 pt-2">
            <p>Criado em {{ new Date(habit.created_at).toLocaleDateString('pt-BR') }}</p>
          </div>
        </div>
      </template>
    </SheetContent>
  </Sheet>

  <ConfirmDialog
    v-model:open="showDeleteConfirm"
    title="Excluir hábito"
    description="Esta ação não pode ser desfeita. Todo o histórico de conclusões será perdido."
    confirm-label="Excluir"
    variant="destructive"
    :loading="deleting"
    @confirm="handleDelete"
  />
</template>
