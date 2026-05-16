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
  DollarSign, Heart, User, Zap, Activity, BookOpen,
} from 'lucide-vue-next'
import type { Goal, GoalType } from '@/types/goals'
import { formatCurrency } from '@/utils/currency'

const props = defineProps<{
  goal: Goal
}>()

const emit = defineEmits<{
  edit: [goal: Goal]
  delete: [id: string]
  'update-progress': [goal: Goal]
}>()

const TYPE_ICONS: Record<GoalType, typeof DollarSign> = {
  financial:   DollarSign,
  health:      Heart,
  personal:    User,
  productivity: Zap,
  habit:       Activity,
  learning:    BookOpen,
}

const pct = computed(() => Math.min(Math.round(props.goal.progress_percentage), 100))
const hasAmount = computed(() => props.goal.target_amount !== null)
const TypeIcon = computed(() => TYPE_ICONS[props.goal.type] ?? DollarSign)

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

const pctTextStyle = computed(() => {
  if (pct.value >= 100) return 'color: hsl(var(--success))'
  if (props.goal.is_overdue) return 'color: hsl(var(--warning) / 0.8)'
  return 'color: hsl(var(--muted-foreground) / 0.6)'
})
</script>

<template>
  <div class="group flex items-start gap-3 px-4 py-3 hover:bg-accent/20 transition-base">

    <!-- Type icon -->
    <div class="mt-[1px] shrink-0 rounded p-1" style="background: hsl(var(--accent))">
      <component :is="TypeIcon" :size="12" style="color: hsl(var(--muted-foreground) / 0.7)" />
    </div>

    <!-- Left: title + meta + progress bar -->
    <div class="flex-1 min-w-0">
      <!-- Title row -->
      <div class="flex items-center justify-between gap-2 mb-1.5">
        <p
          :class="[
            'text-[13px] font-medium truncate flex-1',
            goal.status === 'completed' ? 'text-foreground/50 line-through' : 'text-foreground/90',
          ]"
        >
          {{ goal.title }}
        </p>
        <span class="text-[11px] font-semibold tabular-nums shrink-0" :style="pctTextStyle">
          {{ pct }}%
        </span>
      </div>

      <!-- Full-width progress bar -->
      <div class="h-1 w-full rounded-full overflow-hidden mb-2" style="background: hsl(var(--border) / 0.5)">
        <div
          class="h-full rounded-full transition-all duration-500"
          :style="{ width: `${pct}%`, background: barColor }"
        />
      </div>

      <!-- Sub-row: amount values + deadline badge -->
      <div class="flex items-center justify-between gap-2">
        <p v-if="hasAmount" class="text-[11px] tabular-nums" style="color: hsl(var(--muted-foreground) / 0.5)">
          {{ formatCurrency(goal.current_amount) }}
          <span style="color: hsl(var(--muted-foreground) / 0.3)"> / </span>
          {{ formatCurrency(goal.target_amount!) }}
        </p>
        <div v-if="goal.target_date" class="flex items-center gap-1.5 ml-auto">
          <span
            v-if="goal.is_overdue && pct < 100"
            class="text-[10px] font-medium px-1.5 py-0.5 rounded bg-warning/15 text-warning/80 select-none"
          >
            Vencida
          </span>
          <span
            v-else
            class="text-[11px]"
            style="color: hsl(var(--muted-foreground) / 0.35)"
          >
            {{ deadline }}
          </span>
        </div>
      </div>
    </div>

    <!-- Right: progress button + dropdown -->
    <div class="shrink-0 mt-0.5 flex items-center gap-1" @click.stop>
      <Button
        v-if="goal.status !== 'completed'"
        variant="ghost"
        size="sm"
        class="h-7 px-2 text-xs text-muted-foreground hover:text-foreground gap-1"
        @click="emit('update-progress', goal)"
      >
        <TrendingUp :size="11" />
        Progresso
      </Button>
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
</template>
