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

const pctTextStyle = computed(() => {
  if (pct.value >= 100) return 'color: hsl(var(--success))'
  if (props.goal.is_overdue) return 'color: hsl(var(--warning) / 0.8)'
  return 'color: hsl(var(--muted-foreground) / 0.6)'
})
</script>

<template>
  <div class="group flex items-start gap-3 px-4 py-3 hover:bg-accent/20 transition-colors">

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
      <div class="h-[3px] w-full rounded-full overflow-hidden mb-1.5" style="background: hsl(var(--border) / 0.5)">
        <div
          class="h-full rounded-full transition-all duration-500"
          :style="{ width: `${pct}%`, background: barColor }"
        />
      </div>

      <!-- Sub-row: amount values + deadline -->
      <div class="flex items-center justify-between gap-2">
        <div class="flex items-center gap-1.5 flex-wrap">
          <p v-if="hasAmount" class="text-[11px] tabular-nums" style="color: hsl(var(--muted-foreground) / 0.5)">
            {{ formatCurrency(goal.current_amount) }}
            <span style="color: hsl(var(--muted-foreground) / 0.3)"> / </span>
            {{ formatCurrency(goal.target_amount!) }}
          </p>
          <p
            v-if="goal.target_date"
            :class="[
              'text-[11px] shrink-0',
              goal.is_overdue ? 'text-warning/70' : 'text-muted-foreground/35',
            ]"
          >
            {{ hasAmount ? '·' : '' }} {{ deadline }}
          </p>
        </div>
      </div>
    </div>

    <!-- Right: actions dropdown -->
    <div class="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5" @click.stop>
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
