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
import { MoreHorizontal, Pencil, Trash2, TrendingUp } from 'lucide-vue-next'
import GoalProgressBar from './GoalProgressBar.vue'
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
</script>

<template>
  <div class="group flex items-center gap-4 px-4 py-3 hover:bg-accent/20 transition-colors">

    <!-- Left: title + meta -->
    <div class="flex-1 min-w-0">
      <p
        :class="[
          'text-[13px] font-medium truncate',
          goal.status === 'completed' ? 'text-foreground/50 line-through' : 'text-foreground/90',
        ]"
      >
        {{ goal.title }}
      </p>
      <div class="flex items-center gap-1.5 mt-0.5 flex-wrap">
        <p v-if="goal.description" class="text-[11px] text-muted-foreground/45 truncate max-w-[200px]">
          {{ goal.description }}
        </p>
        <span
          v-if="goal.description && goal.target_date"
          class="text-[11px] text-muted-foreground/20"
        >·</span>
        <p
          v-if="goal.target_date"
          :class="[
            'text-[11px] shrink-0',
            goal.is_overdue ? 'text-warning/70' : 'text-muted-foreground/40',
          ]"
        >
          {{ deadline }}
        </p>
      </div>
    </div>

    <!-- Center: progress bar + values -->
    <div class="hidden sm:flex flex-col gap-1.5 w-[180px] shrink-0">
      <GoalProgressBar :percentage="pct" />
      <p class="text-[11px] text-muted-foreground/40 tabular-nums">
        <template v-if="hasAmount">
          {{ formatCurrency(goal.current_amount) }} / {{ formatCurrency(goal.target_amount!) }}
        </template>
        <template v-else>
          {{ pct }}% concluído
        </template>
      </p>
    </div>

    <!-- Right: percentage badge + actions -->
    <div class="flex items-center gap-2 shrink-0">
      <span
        :class="[
          'text-[11px] font-semibold tabular-nums px-1.5 py-0.5 rounded',
          pct >= 100
            ? 'text-success bg-success/10'
            : goal.is_overdue
              ? 'text-warning/80 bg-warning/10'
              : 'text-muted-foreground/60 bg-foreground/[0.04]',
        ]"
      >
        {{ pct }}%
      </span>

      <div class="opacity-0 group-hover:opacity-100 transition-opacity" @click.stop>
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button variant="ghost" size="icon" class="h-7 w-7">
              <MoreHorizontal :size="13" />
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

  </div>
</template>
