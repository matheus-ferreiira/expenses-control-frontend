<script setup lang="ts">
import { computed, ref } from 'vue'
import { Search, X } from 'lucide-vue-next'
import { findIcon, ICON_CATEGORIES } from '@/lib/icons'

defineProps<{
  modelValue: string  // icon name or ''
  color: string       // category color for active highlight
}>()

const emit = defineEmits<{
  'update:modelValue': [name: string]
}>()

const open = ref(false)
const search = ref('')

const filteredCategories = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return ICON_CATEGORIES
  return ICON_CATEGORIES
    .map((cat) => ({
      ...cat,
      icons: cat.icons.filter(
        (i) => i.label.toLowerCase().includes(q) || i.name.toLowerCase().includes(q),
      ),
    }))
    .filter((cat) => cat.icons.length > 0)
})

function select(name: string) {
  emit('update:modelValue', name)
  open.value = false
  search.value = ''
}

function clear() {
  emit('update:modelValue', '')
}
</script>

<template>
  <!-- Trigger button -->
  <button
    type="button"
    class="flex items-center gap-2.5 h-9 px-3 rounded-lg border border-border/60 bg-muted text-sm hover:border-border transition-colors w-full text-left"
    @click="open = !open"
  >
    <span
      class="flex items-center justify-center size-6 rounded-md shrink-0"
      :style="modelValue ? { background: color + '30', color } : {}"
    >
      <component
        v-if="modelValue && findIcon(modelValue)"
        :is="findIcon(modelValue)!.component"
        :size="14"
      />
      <span v-else class="text-muted-foreground/40 text-[10px]">—</span>
    </span>
    <span class="flex-1 text-[13px]" :class="modelValue ? 'text-foreground' : 'text-muted-foreground'">
      {{ modelValue && findIcon(modelValue) ? findIcon(modelValue)!.label : 'Escolher ícone' }}
    </span>
    <span class="text-muted-foreground/40 text-[11px]">{{ open ? '▲' : '▼' }}</span>
  </button>

  <!-- Expandable icon grid -->
  <div v-if="open" class="mt-2 border border-border/60 rounded-xl bg-muted/30 overflow-hidden">
    <!-- Search bar -->
    <div class="flex items-center gap-2 px-3 py-2 border-b border-border/40">
      <Search :size="13" class="text-muted-foreground shrink-0" />
      <input
        v-model="search"
        placeholder="Buscar ícone..."
        class="flex-1 bg-transparent text-[12px] outline-none placeholder:text-muted-foreground/50"
      />
      <button
        v-if="modelValue"
        type="button"
        class="text-muted-foreground/50 hover:text-foreground"
        @click="clear"
      >
        <X :size="12" />
      </button>
    </div>

    <!-- Scrollable grid — max 220px height, 6 columns, min 44px touch targets -->
    <div class="max-h-[220px] overflow-y-auto p-2 space-y-3">
      <div v-for="cat in filteredCategories" :key="cat.id">
        <p class="text-[9px] uppercase tracking-widest text-muted-foreground/50 font-semibold px-1 mb-1">
          {{ cat.label }}
        </p>
        <div class="grid grid-cols-6 gap-1">
          <button
            v-for="icon in cat.icons"
            :key="icon.name"
            type="button"
            :title="icon.label"
            class="flex items-center justify-center min-h-[44px] min-w-[44px] rounded-xl transition-all active:scale-95"
            :style="modelValue === icon.name
              ? { background: color, color: '#fff' }
              : {}"
            :class="modelValue !== icon.name ? 'hover:bg-muted text-muted-foreground' : ''"
            @click="select(icon.name)"
          >
            <component :is="icon.component" :size="18" />
          </button>
        </div>
      </div>
      <div
        v-if="filteredCategories.length === 0"
        class="py-4 text-center text-[12px] text-muted-foreground/50"
      >
        Nenhum ícone encontrado
      </div>
    </div>
  </div>
</template>
