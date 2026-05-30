<script setup lang="ts">
import { computed, ref } from 'vue'
import { Search, X, ChevronDown } from 'lucide-vue-next'
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
  <!-- Trigger button — alinhado com inputs do formulário -->
  <button
    type="button"
    class="flex items-center gap-2.5 h-10 px-3 rounded-lg border border-border/60 bg-card text-[13px] w-full text-left hover:border-border transition-colors"
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
    <span class="flex-1" :class="modelValue ? 'text-foreground' : 'text-muted-foreground'">
      {{ modelValue && findIcon(modelValue) ? findIcon(modelValue)!.label : 'Escolher ícone' }}
    </span>
    <ChevronDown
      :size="14"
      class="text-muted-foreground/50 transition-transform duration-200 shrink-0"
      :class="open ? 'rotate-180' : ''"
    />
  </button>

  <!-- Grid expansível — sem card wrapper, fluxo direto -->
  <div v-if="open" class="mt-1">

    <!-- Search bar — input standalone -->
    <div class="relative mb-2">
      <Search
        :size="13"
        class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
      />
      <input
        v-model="search"
        placeholder="Buscar ícone..."
        class="h-9 pl-8 pr-8 w-full rounded-lg border border-border/60 bg-card text-[13px] outline-none placeholder:text-muted-foreground/50 focus:border-primary transition-colors"
      />
      <button
        v-if="modelValue"
        type="button"
        class="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-foreground transition-colors"
        @click="clear"
      >
        <X :size="12" />
      </button>
    </div>

    <!-- Grid de ícones — max 280px, 5 colunas, 48px touch targets -->
    <div class="max-h-[280px] overflow-y-auto space-y-2">
      <div v-for="cat in filteredCategories" :key="cat.id">
        <p class="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-semibold px-1 mb-1.5 mt-1">
          {{ cat.label }}
        </p>
        <div class="grid grid-cols-5 gap-2">
          <button
            v-for="icon in cat.icons"
            :key="icon.name"
            type="button"
            :title="icon.label"
            class="flex items-center justify-center size-12 rounded-xl transition-all active:scale-95"
            :style="modelValue === icon.name
              ? { background: color, color: '#fff' }
              : { background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }"
            :class="modelValue !== icon.name ? 'hover:brightness-110' : ''"
            @click="select(icon.name)"
          >
            <component :is="icon.component" :size="22" />
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
