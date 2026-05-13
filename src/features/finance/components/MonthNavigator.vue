<script setup lang="ts">
import { Button } from '@ui/button'
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-vue-next'
import { monthLabel } from '../utils/financeHelpers'

const props = defineProps<{
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
    <Button variant="ghost" size="icon" class="h-7 w-7" @click="emit('prev')">
      <ChevronLeft :size="14" />
    </Button>

    <span class="text-sm font-medium text-foreground min-w-28 text-center capitalize">
      {{ monthLabel(month) }}
    </span>

    <Button variant="ghost" size="icon" class="h-7 w-7" @click="emit('next')">
      <ChevronRight :size="14" />
    </Button>

    <Button
      v-if="!isCurrentMonth"
      variant="ghost"
      size="sm"
      class="h-7 px-2 text-xs text-muted-foreground ml-1"
      @click="emit('reset')"
    >
      <RotateCcw :size="11" class="mr-1" />
      Hoje
    </Button>
  </div>
</template>
