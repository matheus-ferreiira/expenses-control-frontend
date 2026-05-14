<script setup lang="ts">
import { ref, watch, computed, nextTick } from 'vue'
import { Pin, Star, Archive, Trash2, Tag, ArchiveRestore, Plus } from 'lucide-vue-next'
import { useNoteStore } from '@/stores/notes'
import { useNoteAutosave } from '@/features/notes/composables/useNoteAutosave'
import type { Note, NoteTag } from '@/types/notes'

const TAG_COLORS = ['#6366f1','#8b5cf6','#ec4899','#ef4444','#f59e0b','#10b981','#06b6d4','#3b82f6']

const props = defineProps<{
  note: Note | null
  allTags: NoteTag[]
}>()

const emit = defineEmits<{
  deleted: [id: string]
  archived: [id: string]
}>()

const store = useNoteStore()
const title = ref('')
const content = ref('')
const tagPickerOpen = ref(false)
const newTagName = ref('')
const creatingTag = ref(false)

const autosave = useNoteAutosave(() => props.note?.id ?? null)

watch(
  () => props.note,
  (n) => {
    autosave.cancel()
    title.value = n?.title ?? ''
    content.value = n?.content ?? ''
    autosave.status.value = 'idle'
  },
  { immediate: true },
)

watch([title, content], ([t, c]) => {
  if (!props.note) return
  autosave.schedule(t, c)
})

const saveStatusLabel = computed(() => {
  if (autosave.status.value === 'saving') return 'Salvando…'
  if (autosave.status.value === 'saved') return 'Salvo'
  if (autosave.status.value === 'error') return 'Erro ao salvar'
  return ''
})

async function togglePin() {
  if (!props.note) return
  await store.togglePin(props.note.id)
}

async function toggleFavorite() {
  if (!props.note) return
  await store.toggleFavorite(props.note.id)
}

async function handleArchive() {
  if (!props.note) return
  await store.archiveNote(props.note.id)
  emit('archived', props.note.id)
}

async function handleUnarchive() {
  if (!props.note) return
  await store.unarchiveNote(props.note.id)
}

async function handleDelete() {
  if (!props.note) return
  autosave.cancel()
  await store.deleteNote(props.note.id)
  emit('deleted', props.note.id)
}

async function toggleTag(tag: NoteTag) {
  if (!props.note) return
  const currentTagIds = props.note.tags.map((t) => t.id)
  const hasTag = currentTagIds.includes(tag.id)
  const newTagIds = hasTag
    ? currentTagIds.filter((id) => id !== tag.id)
    : [...currentTagIds, tag.id]
  await store.updateNote(props.note.id, { tag_ids: newTagIds })
}

function hasTag(tagId: string) {
  return props.note?.tags.some((t) => t.id === tagId) ?? false
}

async function createAndApplyTag() {
  const name = newTagName.value.trim()
  if (!name || !props.note || creatingTag.value) return
  creatingTag.value = true
  try {
    const color = TAG_COLORS[store.tags.length % TAG_COLORS.length]
    const tag = await store.createTag({ name, color })
    await toggleTag(tag)
    newTagName.value = ''
  } finally {
    creatingTag.value = false
  }
}

async function focusContent() {
  await nextTick()
  const el = document.getElementById('note-content')
  el?.focus()
}
</script>

<template>
  <!-- Empty state -->
  <div
    v-if="!note"
    class="flex-1 flex flex-col items-center justify-center gap-3 h-full"
    style="color: hsl(var(--muted-foreground) / 0.3)"
  >
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
      <polyline points="10 9 9 9 8 9"/>
    </svg>
    <p class="text-[12px]">Selecione uma nota ou crie uma nova</p>
  </div>

  <!-- Editor -->
  <div v-else class="flex flex-col h-full min-h-0">

    <!-- Toolbar -->
    <div
      class="flex items-center justify-between px-5 py-2.5 border-b shrink-0"
      style="border-color: hsl(var(--border) / 0.4)"
    >
      <div class="flex items-center gap-1">
        <!-- Pin -->
        <button
          class="flex items-center justify-center w-7 h-7 rounded-md transition-colors"
          :style="note.is_pinned
            ? 'color: hsl(var(--primary)); background: hsl(var(--primary) / 0.1)'
            : 'color: hsl(var(--muted-foreground) / 0.4)'"
          :title="note.is_pinned ? 'Desafixar' : 'Fixar'"
          @mouseenter="(e) => { if (!note?.is_pinned) (e.currentTarget as HTMLElement).style.color = 'hsl(var(--foreground))' }"
          @mouseleave="(e) => { if (!note?.is_pinned) (e.currentTarget as HTMLElement).style.color = 'hsl(var(--muted-foreground) / 0.4)' }"
          @click="togglePin"
        >
          <Pin :size="13" />
        </button>

        <!-- Favorite -->
        <button
          class="flex items-center justify-center w-7 h-7 rounded-md transition-colors"
          :style="note.is_favorite
            ? 'color: hsl(var(--warning)); background: hsl(var(--warning) / 0.1)'
            : 'color: hsl(var(--muted-foreground) / 0.4)'"
          :title="note.is_favorite ? 'Remover dos favoritos' : 'Favoritar'"
          @mouseenter="(e) => { if (!note?.is_favorite) (e.currentTarget as HTMLElement).style.color = 'hsl(var(--foreground))' }"
          @mouseleave="(e) => { if (!note?.is_favorite) (e.currentTarget as HTMLElement).style.color = 'hsl(var(--muted-foreground) / 0.4)' }"
          @click="toggleFavorite"
        >
          <Star :size="13" />
        </button>

        <!-- Tag picker -->
        <div class="relative">
          <button
            class="flex items-center justify-center w-7 h-7 rounded-md transition-colors"
            :style="tagPickerOpen
              ? 'color: hsl(var(--foreground)); background: hsl(var(--accent))'
              : 'color: hsl(var(--muted-foreground) / 0.4)'"
            title="Gerenciar tags"
            @mouseenter="(e) => { if (!tagPickerOpen) (e.currentTarget as HTMLElement).style.color = 'hsl(var(--foreground))' }"
            @mouseleave="(e) => { if (!tagPickerOpen) (e.currentTarget as HTMLElement).style.color = 'hsl(var(--muted-foreground) / 0.4)' }"
            @click="tagPickerOpen = !tagPickerOpen"
          >
            <Tag :size="13" />
          </button>

          <!-- Tag picker dropdown -->
          <div
            v-if="tagPickerOpen"
            class="absolute left-0 top-full mt-1 w-48 rounded-lg border shadow-lg z-10 py-1"
            style="background: hsl(var(--popover)); border-color: hsl(var(--border))"
          >
            <div
              v-if="allTags.length === 0"
              class="px-3 py-2 text-[11px]"
              style="color: hsl(var(--muted-foreground) / 0.5)"
            >
              Nenhuma tag criada
            </div>
            <button
              v-for="tag in allTags"
              :key="tag.id"
              class="flex items-center justify-between gap-2 w-full px-3 py-1.5 text-left text-[12px] transition-colors"
              :style="hasTag(tag.id) ? 'color: hsl(var(--foreground))' : 'color: hsl(var(--muted-foreground) / 0.7)'"
              @mouseenter="(e) => (e.currentTarget as HTMLElement).style.background = 'hsl(var(--accent))'"
              @mouseleave="(e) => (e.currentTarget as HTMLElement).style.background = 'transparent'"
              @click="toggleTag(tag)"
            >
              <div class="flex items-center gap-1.5">
                <span class="h-2 w-2 rounded-full" :style="{ background: tag.color }" />
                <span>{{ tag.name }}</span>
              </div>
              <span v-if="hasTag(tag.id)" class="text-[10px]" style="color: hsl(var(--primary))">✓</span>
            </button>

            <!-- Divider + create tag input -->
            <div class="border-t mt-1 pt-1" style="border-color: hsl(var(--border) / 0.5)">
              <div class="flex items-center gap-1.5 px-3 py-1">
                <input
                  v-model="newTagName"
                  type="text"
                  placeholder="Nova tag…"
                  class="flex-1 bg-transparent outline-none text-[11.5px] text-foreground placeholder:text-muted-foreground/30"
                  @keydown.enter.prevent="createAndApplyTag"
                  @keydown.stop
                />
                <button
                  class="flex items-center justify-center w-5 h-5 rounded transition-colors"
                  :style="newTagName.trim() ? 'color: hsl(var(--primary))' : 'color: hsl(var(--muted-foreground) / 0.3)'"
                  :disabled="!newTagName.trim() || creatingTag"
                  @click.stop="createAndApplyTag"
                >
                  <Plus :size="11" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="flex items-center gap-1">
        <!-- Archive / Unarchive -->
        <button
          v-if="!note.is_archived"
          class="flex items-center justify-center w-7 h-7 rounded-md transition-colors"
          style="color: hsl(var(--muted-foreground) / 0.4)"
          title="Arquivar"
          @mouseenter="(e) => (e.currentTarget as HTMLElement).style.color = 'hsl(var(--foreground))'"
          @mouseleave="(e) => (e.currentTarget as HTMLElement).style.color = 'hsl(var(--muted-foreground) / 0.4)'"
          @click="handleArchive"
        >
          <Archive :size="13" />
        </button>
        <button
          v-else
          class="flex items-center justify-center w-7 h-7 rounded-md transition-colors"
          style="color: hsl(var(--muted-foreground) / 0.4)"
          title="Desarquivar"
          @mouseenter="(e) => (e.currentTarget as HTMLElement).style.color = 'hsl(var(--foreground))'"
          @mouseleave="(e) => (e.currentTarget as HTMLElement).style.color = 'hsl(var(--muted-foreground) / 0.4)'"
          @click="handleUnarchive"
        >
          <ArchiveRestore :size="13" />
        </button>

        <!-- Delete -->
        <button
          class="flex items-center justify-center w-7 h-7 rounded-md transition-colors"
          style="color: hsl(var(--muted-foreground) / 0.4)"
          title="Excluir"
          @mouseenter="(e) => (e.currentTarget as HTMLElement).style.color = 'hsl(var(--destructive))'"
          @mouseleave="(e) => (e.currentTarget as HTMLElement).style.color = 'hsl(var(--muted-foreground) / 0.4)'"
          @click="handleDelete"
        >
          <Trash2 :size="13" />
        </button>
      </div>
    </div>

    <!-- Title input -->
    <div
      class="px-5 pt-4 pb-2 shrink-0"
      @click="focusContent"
    >
      <input
        v-model="title"
        type="text"
        placeholder="Sem título"
        class="w-full bg-transparent outline-none text-[20px] font-semibold text-foreground placeholder:text-muted-foreground/20 leading-tight"
      />
    </div>

    <!-- Tags row -->
    <div v-if="note.tags.length > 0" class="px-5 pb-2 flex flex-wrap gap-1.5 shrink-0">
      <span
        v-for="tag in note.tags"
        :key="tag.id"
        class="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full"
        style="background: hsl(var(--border) / 0.6); color: hsl(var(--muted-foreground) / 0.7)"
      >
        <span class="h-1.5 w-1.5 rounded-full" :style="{ background: tag.color }" />
        {{ tag.name }}
      </span>
    </div>

    <!-- Content textarea -->
    <div class="flex-1 min-h-0 relative px-5 pb-10">
      <textarea
        id="note-content"
        v-model="content"
        placeholder="Escreva algo…"
        class="w-full h-full resize-none bg-transparent outline-none text-[13.5px] leading-relaxed text-foreground/80 placeholder:text-muted-foreground/20"
        style="font-family: inherit"
      />
    </div>

    <!-- Footer: autosave status + metadata -->
    <div
      class="flex items-center justify-between px-5 py-2.5 border-t shrink-0"
      style="border-color: hsl(var(--border) / 0.3)"
    >
      <span class="text-[10px]" style="color: hsl(var(--muted-foreground) / 0.3)">
        {{ new Date(note.updated_at).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) }}
      </span>
      <span
        class="text-[10px] transition-opacity"
        :style="saveStatusLabel
          ? 'color: hsl(var(--muted-foreground) / 0.5); opacity: 1'
          : 'opacity: 0'"
      >
        {{ saveStatusLabel || '·' }}
      </span>
    </div>

  </div>
</template>
