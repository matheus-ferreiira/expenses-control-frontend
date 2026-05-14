<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { Download } from 'lucide-vue-next'
import { Button } from '@ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@ui/select'
import ReportsStats from '@/features/reports/components/ReportsStats.vue'
import { useReportsData } from '@/features/reports/composables/useReportsData'
import { REPORT_PERIOD_LABELS, REPORT_PERIODS } from '@/types/reports'

const {
  period,
  loading,
  tasksCompletedCount,
  habitsLoggedCount,
  financeNet,
  activeGoalsCount,
  load,
} = useReportsData()

watch(period, () => load())

onMounted(() => load())
</script>

<template>
  <div class="flex flex-col min-h-full">

    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-start justify-between px-4 sm:px-6 pt-6 pb-4 gap-3 sm:gap-0 shrink-0">
      <div>
        <p class="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/40 mb-1.5">
          Análise
        </p>
        <h1 class="text-2xl font-semibold tracking-tight text-foreground leading-none mb-1.5">
          Relatórios
        </h1>
        <p class="text-[13px] text-muted-foreground/50">
          Produtividade, hábitos e finanças em uma visão integrada.
        </p>
      </div>

      <!-- Actions -->
      <div class="flex items-center gap-2 sm:mt-1 shrink-0">
        <Select v-model="period">
          <SelectTrigger class="h-8 w-[110px] text-[12px]">
            <SelectValue :placeholder="REPORT_PERIOD_LABELS[period]" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem
              v-for="p in REPORT_PERIODS"
              :key="p"
              :value="p"
              class="text-[12px]"
            >
              {{ REPORT_PERIOD_LABELS[p] }}
            </SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" size="sm" class="h-8 text-[12px]">
          <Download :size="12" class="mr-1.5" />
          Exportar
        </Button>
      </div>
    </div>

    <!-- Stats row -->
    <div class="px-4 sm:px-6 pb-5 shrink-0">
      <ReportsStats
        :tasks-completed="tasksCompletedCount"
        :habits-logged="habitsLoggedCount"
        :finance-net="financeNet"
        :active-goals="activeGoalsCount"
        :period="period"
        :loading="loading"
      />
    </div>

    <!-- Charts + summary placeholder for Sprint 3 & 4 -->
    <div class="flex-1 px-4 sm:px-6 pb-8 space-y-5">
      <!-- Charts come in Sprint 3 -->
    </div>

  </div>
</template>
