<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { Plus, Search, PanelLeft, X } from 'lucide-vue-next'
import { Button } from '@ui/button'
import { Skeleton } from '@ui/skeleton'
import { Sheet, SheetContent } from '@ui/sheet'
import NotesSidebar from '@/features/notes/components/NotesSidebar.vue'
import NoteListItem from '@/features/notes/components/NoteListItem.vue'
import NotesEditor from '@/features/notes/components/NotesEditor.vue'
import { useNoteStore } from '@/stores/notes'
import { useDebounce } from '@/composables/useDebounce'
import type { Note } from '@/types/notes'
import type { NoteViewId } from '@/types/notes'

const store = useNoteStore()
const mobileLeftOpen = ref(false)
const searchOpen = ref(false)
const searchQuery = ref('')
const debouncedSearch = useDebounce(searchQuery, 300)

// Persisted state
const VIEW_KEY = 'notes:selectedView'
const selectedView = ref<NoteViewId>(
  (localStorage.getItem(VIEW_KEY) as NoteViewId) ?? 'all',
)
watch(selectedView, (v) => localStorage.setItem(VIEW_KEY, v))

const activeNoteId = ref<string | null>(null)

// Filter by view
const filteredByView = computed(() => {
  const all = store.notes
  switch (selectedView.value) {
    case 'favorites':
      return all.filter((n) => n.is_favorite && !n.is_archived)
    case 'pinned':
      return all.filter((n) => n.is_pinned && !n.is_archived)
    case 'archived':
      return all.filter((n) => n.is_archived)
    default:
      if (selectedView.value.startsWith('tag:')) {
        const tagId = selectedView.value.slice(4)
        return all.filter((n) => !n.is_archived && n.tags.some((t) => t.id === tagId))
      }
      return all.filter((n) => !n.is_archived)
  }
})

// Apply search
const displayNotes = computed(() => {
  const q = debouncedSearch.value.toLowerCase().trim()
  if (!q) return filteredByView.value
  return filteredByView.value.filter(
    (n) =>
      n.title.toLowerCase().includes(q) ||
      (n.content ?? '').toLowerCase().includes(q),
  )
})

const activeNote = computed(() =>
  store.notes.find((n) => n.id === activeNoteId.value) ?? null,
)

async function createNote() {
  const note = await store.createNote({ title: '', content: '' })
  activeNoteId.value = note.id
  // Switch to all view when creating
  selectedView.value = 'all'
}

function selectNote(note: Note) {
  activeNoteId.value = note.id
}

function handleDeleted(id: string) {
  if (activeNoteId.value === id) activeNoteId.value = null
}

function handleArchived(id: string) {
  if (activeNoteId.value === id) activeNoteId.value = null
}

// Keyboard shortcut: C to create, Escape to close search
function onKeyDown(e: KeyboardEvent) {
  const tag = (e.target as HTMLElement).tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA') return
  if (e.key === 'c' || e.key === 'C') createNote()
  if (e.key === 'Escape' && searchOpen.value) {
    searchOpen.value = false
    searchQuery.value = ''
  }
}

onMounted(async () => {
  window.addEventListener('keydown', onKeyDown)
  await Promise.all([store.fetchNotes(), store.fetchTags()])
  // Auto-select first note
  if (!activeNoteId.value && store.activeNotes.length > 0) {
    activeNoteId.value = store.activeNotes[0]?.id ?? null
  }
})

onUnmounted(() => window.removeEventListener('keydown', onKeyDown))
</script>

<template>
  <div class="flex overflow-hidden h-[calc(100dvh-3rem)] md:h-dvh">

    <!-- Sidebar — desktop -->
    <NotesSidebar
      class="hidden sm:flex"
      :selected-view="selectedView"
      :tags="store.tags"
      @update:selected-view="selectedView = $event"
    />

    <!-- Sidebar — mobile Sheet -->
    <Sheet v-model:open="mobileLeftOpen">
      <SheetContent side="left" class="p-0 w-[200px]">
        <NotesSidebar
          :selected-view="selectedView"
          :tags="store.tags"
          @update:selected-view="(v) => { selectedView = v; mobileLeftOpen = false }"
        />
      </SheetContent>
    </Sheet>

    <!-- Notes list column -->
    <div
      class="flex flex-col shrink-0 overflow-hidden"
      :class="activeNote ? 'hidden sm:flex sm:w-[260px]' : 'flex-1 sm:w-[260px]'"
      style="border-right: 1px solid hsl(var(--border) / 0.4)"
    >

      <!-- List header -->
      <div class="flex flex-col shrink-0">
        <!-- Top bar -->
        <div
          class="flex items-center justify-between px-3 py-2.5 border-b"
          style="border-color: hsl(var(--border) / 0.4)"
        >
          <!-- Mobile: sidebar toggle -->
          <button
            class="sm:hidden flex items-center justify-center w-7 h-7 rounded-md"
            style="color: hsl(var(--muted-foreground) / 0.5)"
            @click="mobileLeftOpen = true"
          >
            <PanelLeft :size="14" />
          </button>

          <!-- Page title on desktop -->
          <div class="hidden sm:block">
            <p class="text-[9px] font-semibold uppercase tracking-[0.12em]" style="color: hsl(var(--muted-foreground) / 0.35)">
              Pessoal
            </p>
            <h1 class="text-[14px] font-semibold text-foreground leading-none">Notas</h1>
          </div>

          <div class="flex items-center gap-1">
            <button
              class="flex items-center justify-center w-7 h-7 rounded-md transition-colors"
              style="color: hsl(var(--muted-foreground) / 0.5)"
              title="Buscar notas"
              @mouseenter="(e) => (e.currentTarget as HTMLElement).style.color = 'hsl(var(--foreground))'"
              @mouseleave="(e) => (e.currentTarget as HTMLElement).style.color = 'hsl(var(--muted-foreground) / 0.5)'"
              @click="searchOpen = !searchOpen; searchQuery = ''"
            >
              <X v-if="searchOpen" :size="13" />
              <Search v-else :size="13" />
            </button>
            <Button
              variant="ghost"
              size="icon"
              class="w-7 h-7"
              title="Nova nota (C)"
              @click="createNote"
            >
              <Plus :size="14" />
            </Button>
          </div>
        </div>

        <!-- Search bar -->
        <div v-if="searchOpen" class="px-3 py-2 border-b" style="border-color: hsl(var(--border) / 0.4)">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Buscar notas…"
            autofocus
            class="w-full bg-transparent outline-none text-[12.5px] text-foreground placeholder:text-muted-foreground/30"
          />
        </div>

        <!-- Count -->
        <div class="px-3 py-1.5 border-b" style="border-color: hsl(var(--border) / 0.3)">
          <span class="text-[10px]" style="color: hsl(var(--muted-foreground) / 0.3)">
            {{ displayNotes.length }} {{ displayNotes.length === 1 ? 'nota' : 'notas' }}
          </span>
        </div>
      </div>

      <!-- Notes list -->
      <div class="flex-1 overflow-y-auto">
        <!-- Loading -->
        <div v-if="store.loading" class="px-3 py-4 flex flex-col gap-2">
          <Skeleton v-for="i in 5" :key="i" class="h-[60px] rounded-md" />
        </div>

        <!-- Empty state -->
        <div
          v-else-if="displayNotes.length === 0"
          class="flex flex-col items-center justify-center py-10 px-4 text-center select-none"
        >
          <p class="text-[12px] font-medium mb-1" style="color: hsl(var(--foreground) / 0.45)">
            <template v-if="debouncedSearch">Sem resultados</template>
            <template v-else-if="selectedView === 'favorites'">Sem favoritas</template>
            <template v-else-if="selectedView === 'pinned'">Sem fixadas</template>
            <template v-else-if="selectedView === 'archived'">Sem arquivadas</template>
            <template v-else>Nenhuma nota ainda</template>
          </p>
          <p v-if="debouncedSearch" class="text-[11px]" style="color: hsl(var(--muted-foreground) / 0.3)">
            "{{ debouncedSearch }}"
          </p>
          <button
            v-if="!debouncedSearch && selectedView === 'all'"
            class="mt-3 text-[11px] font-medium transition-base"
            style="color: hsl(var(--primary) / 0.6)"
            @mouseenter="(e) => (e.currentTarget as HTMLElement).style.color = 'hsl(var(--primary))'"
            @mouseleave="(e) => (e.currentTarget as HTMLElement).style.color = 'hsl(var(--primary) / 0.6)'"
            @click="createNote"
          >
            Criar primeira nota →
          </button>
        </div>

        <!-- Notes -->
        <template v-else>
          <NoteListItem
            v-for="note in displayNotes"
            :key="note.id"
            :note="note"
            :active="note.id === activeNoteId"
            @select="selectNote"
          />
        </template>
      </div>
    </div>

    <!-- Editor column -->
    <div
      class="flex-1 min-w-0 overflow-hidden flex flex-col"
      :class="activeNote ? 'flex' : 'hidden sm:flex'"
    >
      <!-- Mobile back button -->
      <div v-if="activeNote" class="sm:hidden flex items-center px-3 py-2 border-b" style="border-color: hsl(var(--border) / 0.4)">
        <button
          class="flex items-center gap-1.5 text-[12px]"
          style="color: hsl(var(--muted-foreground) / 0.6)"
          @click="activeNoteId = null"
        >
          ← Notas
        </button>
      </div>

      <NotesEditor
        :note="activeNote"
        :all-tags="store.tags"
        @deleted="handleDeleted"
        @archived="handleArchived"
      />
    </div>

  </div>
</template>
