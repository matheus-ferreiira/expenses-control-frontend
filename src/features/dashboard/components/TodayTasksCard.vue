<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { Button } from '@ui/button'
import { Skeleton } from '@ui/skeleton'
import { Check, ClipboardList, ArrowRight, Loader2 } from 'lucide-vue-next'
import type { Task } from '@/types/tasks'
import { ROUTES } from '@/constants/routes'
import { ref } from 'vue'

const MAX_SHOWN = 5

const props = defineProps<{
  tasks: Task[]
  loading?: boolean
}>()

const emit = defineEmits<{
  toggle: [id: string]
}>()

const router = useRouter()
const togglingIds = ref<Set<string>>(new Set())

const shown = computed(() => props.tasks.slice(0, MAX_SHOWN))
const hasMore = computed(() => props.tasks.length > MAX_SHOWN)

function handleToggle(id: string) {
  if (togglingIds.value.has(id)) return
  togglingIds.value.add(id)
  emit('toggle', id)
  setTimeout(() => togglingIds.value.delete(id), 800)
}
</script>

<template>
  <div class="rounded-lg border border-border bg-card flex flex-col">
    <!-- Header -->
    <div class="flex items-center justify-between px-4 py-3 border-b border-border/60">
      <div class="flex items-center gap-2">
        <ClipboardList :size="14" class="text-muted-foreground" />
        <span class="text-sm font-medium text-foreground">Tarefas de hoje</span>
        <span
          v-if="!loading && tasks.length > 0"
          class="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full"
        >
          {{ tasks.length }}
        </span>
      </div>
      <Button variant="ghost" size="sm" class="h-6 px-2 text-xs text-muted-foreground gap-1" @click="router.push({ name: ROUTES.TASKS })">
        Ver todas
        <ArrowRight :size="10" />
      </Button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="p-4 space-y-3">
      <div v-for="i in 3" :key="i" class="flex items-center gap-3">
        <Skeleton class="h-6 w-6 rounded-full shrink-0" />
        <div class="flex-1 space-y-1.5">
          <Skeleton class="h-3.5 w-2/3" />
          <Skeleton class="h-3 w-1/3" />
        </div>
      </div>
    </div>

    <!-- Empty -->
    <div v-else-if="tasks.length === 0" class="flex flex-col items-center justify-center py-10 px-4 text-center">
      <div class="p-2.5 rounded-lg bg-muted mb-3">
        <ClipboardList :size="18" class="text-muted-foreground" />
      </div>
      <p class="text-sm font-medium text-foreground">Nenhuma tarefa para hoje</p>
      <p class="text-xs text-muted-foreground mt-0.5">Você está em dia!</p>
    </div>

    <!-- Task list -->
    <div v-else class="divide-y divide-border/50">
      <div
        v-for="task in shown"
        :key="task.id"
        class="flex items-center gap-3 px-4 py-2.5 group hover:bg-accent/30 transition-colors"
      >
        <!-- Toggle button -->
        <button
          :class="[
            'shrink-0 h-5 w-5 rounded-full border transition-all flex items-center justify-center',
            task.status === 'completed'
              ? 'bg-emerald-500 border-emerald-500 text-white'
              : 'border-border hover:border-emerald-500/60',
          ]"
          :disabled="togglingIds.has(task.id)"
          @click="handleToggle(task.id)"
        >
          <Loader2 v-if="togglingIds.has(task.id)" :size="10" class="animate-spin" />
          <Check v-else-if="task.status === 'completed'" :size="10" />
        </button>

        <!-- Title -->
        <span
          :class="[
            'flex-1 text-sm truncate',
            task.status === 'completed'
              ? 'line-through text-muted-foreground'
              : 'text-foreground',
          ]"
        >
          {{ task.title }}
        </span>

        <!-- Priority dot -->
        <span
          v-if="task.priority === 'urgent' || task.priority === 'high'"
          :class="[
            'shrink-0 h-1.5 w-1.5 rounded-full',
            task.priority === 'urgent' ? 'bg-red-400' : 'bg-orange-400',
          ]"
        />
      </div>

      <!-- "X more" row -->
      <div v-if="hasMore" class="px-4 py-2 text-center">
        <button
          class="text-xs text-muted-foreground hover:text-foreground transition-colors"
          @click="router.push({ name: ROUTES.TASKS })"
        >
          +{{ tasks.length - MAX_SHOWN }} mais tarefas
        </button>
      </div>
    </div>
  </div>
</template>
