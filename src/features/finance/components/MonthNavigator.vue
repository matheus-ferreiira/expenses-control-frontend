<script setup lang="ts">
import { ref, watch } from 'vue'
import { Button } from '@ui/button'
import { ChevronLeft, ChevronRight, ChevronDown, RotateCcw } from 'lucide-vue-next'
import { Popover, PopoverContent, PopoverTrigger } from '@ui/popover'
import { monthLabel } from '../utils/financeHelpers'

const props = defineProps<{
  month: string
  isCurrentMonth: boolean
}>()

const emit = defineEmits<{
  prev: []
  next: []
  reset: []
  selectMonth: [month: string]
}>()

// ── Month picker ──────────────────────────────────────────────────────────────
const pickerOpen = ref(false)
const pickerYear = ref(new Date().getFullYear())

const MONTHS_SHORT = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'] as const

watch(pickerOpen, (open) => {
  if (open) {
    const [year] = props.month.split('-').map(Number)
    pickerYear.value = year ?? new Date().getFullYear()
  }
})

function selectMonthFromPicker(monthIdx: number) {
  const m = String(monthIdx + 1).padStart(2, '0')
  emit('selectMonth', `${pickerYear.value}-${m}`)
  pickerOpen.value = false
}

function isPickerCurrentRealMonth(monthIdx: number): boolean {
  const now = new Date()
  return pickerYear.value === now.getFullYear() && monthIdx === now.getMonth()
}

function isPickerSelectedMonth(monthIdx: number): boolean {
  const m = String(monthIdx + 1).padStart(2, '0')
  return props.month === `${pickerYear.value}-${m}`
}
</script>

<template>
  <div class="flex items-center gap-1">
    <Button variant="ghost" size="icon" class="min-h-[44px] min-w-[44px]" @click="emit('prev')">
      <ChevronLeft :size="14" />
    </Button>

    <!-- Month label — opens picker on click -->
    <Popover v-model:open="pickerOpen">
      <PopoverTrigger as-child>
        <button
          type="button"
          class="flex items-center gap-1 min-w-28 justify-center hover:text-primary transition-colors group"
        >
          <span class="text-[13px] font-medium text-foreground group-hover:text-primary transition-colors">
            {{ monthLabel(month) }}
          </span>
          <ChevronDown
            :size="12"
            class="text-muted-foreground group-hover:text-primary transition-colors shrink-0"
          />
        </button>
      </PopoverTrigger>

      <PopoverContent class="w-60 p-4" align="center" :side-offset="8">
        <!-- Year navigation -->
        <div class="flex items-center justify-between mb-3">
          <button
            type="button"
            class="size-7 flex items-center justify-center rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            @click="pickerYear--"
          >
            <ChevronLeft :size="14" />
          </button>
          <span class="text-[14px] font-semibold tabular-nums">{{ pickerYear }}</span>
          <button
            type="button"
            class="size-7 flex items-center justify-center rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            @click="pickerYear++"
          >
            <ChevronRight :size="14" />
          </button>
        </div>

        <!-- Month grid 6×2 -->
        <div class="grid grid-cols-6 gap-1">
          <button
            v-for="(abbr, idx) in MONTHS_SHORT"
            :key="abbr"
            type="button"
            class="h-8 rounded-md text-[11px] font-medium transition-colors"
            :class="isPickerCurrentRealMonth(idx)
              ? 'bg-primary text-primary-foreground'
              : isPickerSelectedMonth(idx)
                ? 'bg-muted text-primary'
                : 'text-foreground hover:bg-muted'"
            @click="selectMonthFromPicker(idx)"
          >{{ abbr }}</button>
        </div>

        <!-- Footer -->
        <div class="flex items-center justify-between mt-3 pt-2 border-t border-border">
          <button
            type="button"
            class="text-primary text-[13px] font-medium hover:text-primary transition-colors"
            @click="emit('reset'); pickerOpen = false"
          >Mês atual</button>
          <button
            type="button"
            class="text-muted-foreground text-[13px] hover:text-foreground transition-colors"
            @click="pickerOpen = false"
          >Cancelar</button>
        </div>
      </PopoverContent>
    </Popover>

    <Button variant="ghost" size="icon" class="min-h-[44px] min-w-[44px]" @click="emit('next')">
      <ChevronRight :size="14" />
    </Button>

    <Button
      v-if="!isCurrentMonth"
      variant="ghost"
      size="sm"
      class="min-h-[44px] px-2 text-[11px] text-muted-foreground ml-1"
      @click="emit('reset')"
    >
      <RotateCcw :size="11" class="mr-1" />
      Hoje
    </Button>
  </div>
</template>
