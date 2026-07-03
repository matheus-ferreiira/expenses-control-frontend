<script setup lang="ts">
import { computed } from 'vue'
import { Button } from '@ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@ui/dropdown-menu'
import {
  MoreHorizontal, Pencil, Trash2, TrendingUp,
} from 'lucide-vue-next'
import type { Goal } from '@/types/goals'
import { formatCurrency } from '@/utils/currency'

const props = defineProps<{
  goal: Goal
}>()

const emit = defineEmits<{
  edit: [goal: Goal]
  delete: [id: string]
  'update-progress': [goal: Goal]
}>()

const pct = computed(() => Math.min(Math.round(props.goal.progress_percentage), 100))
const hasAmount = computed(() => props.goal.target_amount !== null)

const deadline = computed(() => {
  if (!props.goal.target_date) return null
  const d = new Date(props.goal.target_date + 'T00:00:00')
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
})

const barColor = computed(() => {
  if (pct.value >= 100) return 'hsl(var(--success))'
  if (props.goal.is_overdue) return 'hsl(var(--warning))'
  return 'hsl(var(--primary))'
})
</script>

<template>
  <div class="rounded-lg bg-card px-5 py-5 transition-base hover:border-border">

    <!-- Top row: title + % badge + actions -->
    <div class="flex items-start justify-between gap-3 mb-3">
      <div class="flex-1 min-w-0">
        <p
          :class="[
            'text-[15px] font-semibold leading-snug',
            goal.status === 'completed' ? 'text-foreground line-through' : 'text-foreground',
          ]"
        >
          {{ goal.title }}
        </p>
        <p v-if="goal.target_date" class="text-[12px] mt-0.5" style="color: hsl(var(--muted-foreground) / 0.45)">
          <span v-if="goal.is_overdue && pct < 100" class="text-warning">Vencida · </span>
          Prazo: {{ deadline }}
        </p>
      </div>

      <!-- % badge + menu -->
      <div class="flex items-center gap-2 shrink-0" @click.stop>
        <span
          class="text-[12px] font-semibold tabular-nums px-2 py-0.5 rounded-md"
          :style="[
            pct >= 100
              ? 'background: hsl(var(--success) / 0.15); color: hsl(var(--success))'
              : goal.is_overdue
              ? 'background: hsl(var(--warning) / 0.12); color: hsl(var(--warning) / 0.85)'
              : 'background: hsl(var(--border) / 0.5); color: hsl(var(--muted-foreground) / 0.7)',
          ]"
        >
          {{ pct }}%
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button variant="ghost" size="icon" class="h-7 w-7 -mr-1">
              <MoreHorizontal :size="14" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" class="w-44">
            <DropdownMenuItem @click="emit('update-progress', goal)">
              <TrendingUp :size="12" class="mr-2" />
              Atualizar progresso
            </DropdownMenuItem>
            <DropdownMenuItem @click="emit('edit', goal)">
              <Pencil :size="12" class="mr-2" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              class="text-destructive focus:text-destructive"
              @click="emit('delete', goal.id)"
            >
              <Trash2 :size="12" class="mr-2" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>

    <!-- Progress bar -->
    <div class="h-2 w-full rounded-full overflow-hidden mb-2.5" style="background: hsl(var(--border) / 0.4)">
      <div
        class="h-full rounded-full transition-all duration-500"
        :style="{ width: `${pct}%`, background: barColor }"
      />
    </div>

    <!-- Bottom row: amounts + progress button -->
    <div class="flex items-center justify-between gap-3">
      <p v-if="hasAmount" class="text-[12px] tabular-nums" style="color: hsl(var(--muted-foreground) / 0.5)">
        {{ formatCurrency(goal.current_amount) }}
        <span class="mx-1" style="color: hsl(var(--muted-foreground) / 0.25)">de</span>
        {{ formatCurrency(goal.target_amount!) }}
      </p>
      <div v-else class="flex-1" />

      <Button
        v-if="goal.status !== 'completed'"
        variant="outline"
        size="sm"
        class="h-7 px-3 text-[11px] gap-1 shrink-0"
        @click="emit('update-progress', goal)"
      >
        <TrendingUp :size="11" />
        Adicionar progresso
      </Button>
    </div>

  </div>
</template>
