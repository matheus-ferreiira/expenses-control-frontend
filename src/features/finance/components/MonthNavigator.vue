<script setup lang="ts">
import { Button } from '@ui/button'
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-vue-next'
import { monthLabel } from '../utils/financeHelpers'

defineProps<{
  month: string
  isCurrentMonth: boolean
}>()

const emit = defineEmits<{
  prev: []
  next: []
  reset: []
}>()
</script>

<template>
  <div class="flex items-center gap-1">
    <Button variant="ghost" size="icon" class="min-h-[44px] min-w-[44px]" @click="emit('prev')">
      <ChevronLeft :size="14" />
    </Button>

    <span class="text-[13px] font-medium text-foreground min-w-28 text-center">
      {{ monthLabel(month) }}
    </span>

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
