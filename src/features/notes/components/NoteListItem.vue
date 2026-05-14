<script setup lang="ts">
import { computed } from 'vue'
import { Pin, Star } from 'lucide-vue-next'
import type { Note } from '@/types/notes'

const props = defineProps<{
  note: Note
  active: boolean
}>()

const emit = defineEmits<{
  select: [note: Note]
}>()

const preview = computed(() => {
  if (!props.note.content) return ''
  return props.note.content.replace(/\n+/g, ' ').trim().slice(0, 120)
})

const timeLabel = computed(() => {
  const d = new Date(props.note.updated_at)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'agora'
  if (mins < 60) return `${mins}min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d`
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
})
</script>

<template>
  <button
    class="w-full text-left px-3 py-2.5 border-b transition-base group"
    :style="[
      'border-color: hsl(var(--border) / 0.35)',
      active
        ? 'background: hsl(var(--foreground) / 0.04); box-shadow: inset 2px 0 0 hsl(var(--primary) / 0.7)'
        : 'background: transparent',
    ]"
    @click="emit('select', note)"
    @mouseenter="(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = 'hsl(var(--foreground) / 0.03)' }"
    @mouseleave="(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent' }"
  >
    <!-- Top row: title + indicators + time -->
    <div class="flex items-start justify-between gap-2 mb-0.5">
      <span
        class="text-[13px] leading-snug truncate"
        :class="active ? 'font-semibold text-foreground' : 'font-medium text-foreground/80'"
      >
        {{ note.title || 'Sem título' }}
      </span>
      <div class="flex items-center gap-1 shrink-0 mt-px">
        <Pin
          v-if="note.is_pinned"
          :size="10"
          class="text-muted-foreground/40"
        />
        <Star
          v-if="note.is_favorite"
          :size="10"
          class="text-warning/60"
          :fill="'currentColor'"
        />
        <span class="text-[10px] text-muted-foreground/30 tabular-nums">{{ timeLabel }}</span>
      </div>
    </div>

    <!-- Preview -->
    <p
      v-if="preview"
      class="text-[11.5px] text-muted-foreground/40 leading-snug line-clamp-2 text-left"
    >
      {{ preview }}
    </p>
    <p v-else class="text-[11.5px] text-muted-foreground/25 leading-snug italic text-left">
      Sem conteúdo
    </p>

    <!-- Tags -->
    <div v-if="note.tags.length > 0" class="flex flex-wrap gap-1 mt-1.5">
      <span
        v-for="tag in note.tags.slice(0, 3)"
        :key="tag.id"
        class="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-px rounded-full"
        style="background: hsl(var(--border) / 0.6); color: hsl(var(--muted-foreground) / 0.6)"
      >
        <span class="h-1.5 w-1.5 rounded-full" :style="{ background: tag.color }" />
        {{ tag.name }}
      </span>
      <span
        v-if="note.tags.length > 3"
        class="text-[10px]"
        style="color: hsl(var(--muted-foreground) / 0.3)"
      >
        +{{ note.tags.length - 3 }}
      </span>
    </div>
  </button>
</template>
