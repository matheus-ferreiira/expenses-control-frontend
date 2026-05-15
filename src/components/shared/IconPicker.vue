<script setup lang="ts">
import { ref, computed } from 'vue'
import { Search, X } from 'lucide-vue-next'
import { Input } from '@ui/input'
import { ICON_CATEGORIES, ALL_ICONS, findIcon } from '@/lib/icons'

const props = defineProps<{
  modelValue: string
  color?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const search = ref('')

const results = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return null
  return ALL_ICONS.filter(
    (i) => i.label.toLowerCase().includes(q) || i.name.toLowerCase().includes(q),
  )
})

const selectedEntry = computed(() => findIcon(props.modelValue))
</script>

<template>
  <div class="space-y-2">
    <!-- Search -->
    <div class="relative">
      <Search :size="13" class="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
      <Input
        v-model="search"
        placeholder="Buscar ícone..."
        class="h-8 pl-8 pr-8 text-sm"
      />
      <button
        v-if="search"
        type="button"
        class="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        @click="search = ''"
      >
        <X :size="12" />
      </button>
    </div>

    <!-- Search results -->
    <div v-if="results !== null" class="max-h-40 overflow-y-auto">
      <div v-if="results.length === 0" class="py-3 text-center text-xs text-muted-foreground">
        Nenhum ícone encontrado
      </div>
      <div v-else class="grid grid-cols-8 gap-1">
        <button
          v-for="icon in results"
          :key="icon.name"
          type="button"
          :title="icon.label"
          :class="[
            'flex items-center justify-center w-8 h-8 rounded-md transition-all',
            modelValue === icon.name
              ? 'bg-violet-500/20 text-violet-400 ring-1 ring-violet-500/50'
              : 'text-muted-foreground hover:bg-accent hover:text-foreground',
          ]"
          @click="emit('update:modelValue', icon.name)"
        >
          <component :is="icon.component" :size="16" />
        </button>
      </div>
    </div>

    <!-- Categories -->
    <div v-else class="max-h-48 overflow-y-auto space-y-3 pr-1">
      <div v-for="cat in ICON_CATEGORIES" :key="cat.id">
        <p class="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50 mb-1">
          {{ cat.label }}
        </p>
        <div class="grid grid-cols-8 gap-1">
          <button
            v-for="icon in cat.icons"
            :key="icon.name"
            type="button"
            :title="icon.label"
            :class="[
              'flex items-center justify-center w-8 h-8 rounded-md transition-all',
              modelValue === icon.name
                ? 'bg-violet-500/20 text-violet-400 ring-1 ring-violet-500/50'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground',
            ]"
            @click="emit('update:modelValue', icon.name)"
          >
            <component :is="icon.component" :size="16" />
          </button>
        </div>
      </div>
    </div>

    <!-- Selected display -->
    <div v-if="selectedEntry" class="flex items-center gap-2 pt-1 text-xs text-muted-foreground">
      <span
        class="flex items-center justify-center w-6 h-6 rounded-md"
        :style="color ? { backgroundColor: color + '33', color } : {}"
      >
        <component :is="selectedEntry.component" :size="14" />
      </span>
      {{ selectedEntry.label }} selecionado
    </div>
  </div>
</template>
