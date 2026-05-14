<script setup lang="ts">
import { computed } from 'vue'
import { FileText, Star, Pin, Archive, Inbox } from 'lucide-vue-next'
import { useNoteStore } from '@/stores/notes'
import type { NoteViewId } from '@/types/notes'
import type { NoteTag } from '@/types/notes'

const props = defineProps<{
  selectedView: NoteViewId
  tags: NoteTag[]
}>()

const emit = defineEmits<{
  'update:selectedView': [view: NoteViewId]
}>()

const store = useNoteStore()

const counts = computed(() => ({
  all: store.activeNotes.length,
  favorites: store.favoriteNotes.length,
  pinned: store.pinnedNotes.length,
  archived: store.archivedNotes.length,
}))

const tagCounts = computed(() =>
  props.tags.reduce(
    (acc, tag) => {
      acc[tag.id] = store.activeNotes.filter((n) => n.tags.some((t) => t.id === tag.id)).length
      return acc
    },
    {} as Record<string, number>,
  ),
)

const views = computed(() => [
  { id: 'all' as NoteViewId, label: 'Todas', icon: Inbox, count: counts.value.all },
  { id: 'favorites' as NoteViewId, label: 'Favoritas', icon: Star, count: counts.value.favorites },
  { id: 'pinned' as NoteViewId, label: 'Fixadas', icon: Pin, count: counts.value.pinned },
  { id: 'archived' as NoteViewId, label: 'Arquivadas', icon: Archive, count: counts.value.archived },
])

function isActive(id: NoteViewId) {
  return props.selectedView === id
}

function select(id: NoteViewId) {
  emit('update:selectedView', id)
}
</script>

<template>
  <aside
    class="flex flex-col w-[180px] shrink-0 h-full overflow-y-auto"
    style="background: hsl(var(--sidebar)); border-right: 1px solid hsl(var(--border) / 0.5)"
  >
    <nav class="flex-1 px-2 py-3">

      <!-- Views -->
      <div>
        <button
          v-for="view in views"
          :key="view.id"
          class="flex items-center gap-2 w-full px-2.5 py-[5px] rounded-md mb-px text-left text-[12.5px] transition-colors"
          :style="
            isActive(view.id)
              ? 'background: hsl(var(--sidebar-accent)); color: hsl(var(--foreground))'
              : 'color: hsl(var(--muted-foreground) / 0.65)'
          "
          @click="select(view.id)"
          @mouseenter="(e) => {
            if (!isActive(view.id)) {
              ;(e.currentTarget as HTMLElement).style.background = 'hsl(var(--foreground) / 0.04)'
              ;(e.currentTarget as HTMLElement).style.color = 'hsl(var(--foreground))'
            }
          }"
          @mouseleave="(e) => {
            if (!isActive(view.id)) {
              ;(e.currentTarget as HTMLElement).style.background = 'transparent'
              ;(e.currentTarget as HTMLElement).style.color = 'hsl(var(--muted-foreground) / 0.65)'
            }
          }"
        >
          <component :is="view.icon" :size="13" class="shrink-0" />
          <span class="flex-1 truncate" :class="isActive(view.id) ? 'font-medium' : 'font-normal'">
            {{ view.label }}
          </span>
          <span
            v-if="view.count > 0"
            class="text-[10px] tabular-nums shrink-0"
            :style="isActive(view.id) ? 'color: hsl(var(--muted-foreground) / 0.5)' : 'color: hsl(var(--muted-foreground) / 0.3)'"
          >
            {{ view.count }}
          </span>
        </button>
      </div>

      <!-- Tags -->
      <template v-if="tags.length > 0">
        <div class="mt-4 mb-1 px-2.5">
          <span
            class="text-[9px] font-semibold tracking-[0.12em] uppercase select-none"
            style="color: hsl(var(--muted-foreground) / 0.28)"
          >
            Tags
          </span>
        </div>

        <button
          v-for="tag in tags"
          :key="tag.id"
          class="flex items-center gap-2 w-full px-2.5 py-[5px] rounded-md mb-px text-left text-[12.5px] transition-colors"
          :style="
            isActive(`tag:${tag.id}`)
              ? 'background: hsl(var(--sidebar-accent)); color: hsl(var(--foreground))'
              : 'color: hsl(var(--muted-foreground) / 0.65)'
          "
          @click="select(`tag:${tag.id}`)"
          @mouseenter="(e) => {
            if (!isActive(`tag:${tag.id}`)) {
              ;(e.currentTarget as HTMLElement).style.background = 'hsl(var(--foreground) / 0.04)'
              ;(e.currentTarget as HTMLElement).style.color = 'hsl(var(--foreground))'
            }
          }"
          @mouseleave="(e) => {
            if (!isActive(`tag:${tag.id}`)) {
              ;(e.currentTarget as HTMLElement).style.background = 'transparent'
              ;(e.currentTarget as HTMLElement).style.color = 'hsl(var(--muted-foreground) / 0.65)'
            }
          }"
        >
          <span class="h-1.5 w-1.5 rounded-full shrink-0" :style="{ background: tag.color }" />
          <span
            class="flex-1 truncate"
            :class="isActive(`tag:${tag.id}`) ? 'font-medium' : 'font-normal'"
          >
            {{ tag.name }}
          </span>
          <span
            v-if="(tagCounts[tag.id] ?? 0) > 0"
            class="text-[10px] tabular-nums shrink-0"
            :style="isActive(`tag:${tag.id}`) ? 'color: hsl(var(--muted-foreground) / 0.5)' : 'color: hsl(var(--muted-foreground) / 0.3)'"
          >
            {{ tagCounts[tag.id] }}
          </span>
        </button>
      </template>

      <!-- Empty tags state -->
      <template v-else>
        <div class="mt-4 mb-1 px-2.5 flex items-center gap-1.5">
          <span
            class="text-[9px] font-semibold tracking-[0.12em] uppercase select-none"
            style="color: hsl(var(--muted-foreground) / 0.28)"
          >
            Tags
          </span>
        </div>
        <div class="px-2.5 py-1">
          <p class="text-[11px]" style="color: hsl(var(--muted-foreground) / 0.3)">Sem tags</p>
        </div>
      </template>

    </nav>

    <!-- Footer icon -->
    <div class="px-3 pb-3 pt-1 border-t" style="border-color: hsl(var(--border) / 0.3)">
      <div class="flex items-center gap-1.5" style="color: hsl(var(--muted-foreground) / 0.25)">
        <FileText :size="11" />
        <span class="text-[10px]">Notas</span>
      </div>
    </div>

  </aside>
</template>
