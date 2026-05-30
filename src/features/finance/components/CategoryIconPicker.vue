<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { ChevronDown } from 'lucide-vue-next'
import { findIcon, ICON_CATEGORIES } from '@/lib/icons'

defineProps<{
  modelValue: string
  color: string
}>()

const emit = defineEmits<{
  'update:modelValue': [name: string]
}>()

const open = ref(false)
const search = ref('')
const searchInputRef = ref<HTMLInputElement | null>(null)

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

async function toggle() {
  open.value = !open.value
  if (open.value) {
    await nextTick()
    searchInputRef.value?.focus()
  } else {
    search.value = ''
  }
}

function select(name: string) {
  emit('update:modelValue', name)
  open.value = false
  search.value = ''
}
</script>

<template>
  <!-- Card único — estado fechado parece input, estado aberto expande -->
  <div
    class="rounded-lg border border-border/60 bg-card overflow-hidden transition-all duration-200"
    :class="!open ? 'cursor-pointer hover:border-border' : ''"
    @click="!open && toggle()"
  >
    <!-- Linha superior — sempre visível -->
    <div class="flex items-center gap-2.5 h-10 px-3">

      <!-- Preview do ícone selecionado (ou dash) -->
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

      <!-- Fechado: label do ícone ou placeholder -->
      <span
        v-if="!open"
        class="flex-1 text-[13px]"
        :class="modelValue ? 'text-foreground' : 'text-muted-foreground'"
      >
        {{ modelValue && findIcon(modelValue) ? findIcon(modelValue)!.label : 'Escolher ícone' }}
      </span>

      <!-- Aberto: input de busca inline -->
      <input
        v-else
        ref="searchInputRef"
        v-model="search"
        placeholder="Buscar ícone..."
        class="flex-1 bg-transparent text-[13px] outline-none placeholder:text-muted-foreground/50"
        @click.stop
      />

      <!-- Chevron — rotaciona quando aberto -->
      <ChevronDown
        :size="14"
        class="text-muted-foreground/50 transition-transform duration-200 shrink-0 cursor-pointer"
        :class="open ? 'rotate-180' : ''"
        @click.stop="toggle"
      />
    </div>

    <!-- Seção expandida -->
    <template v-if="open">
      <div class="border-t border-border/40" />

      <div class="max-h-[280px] overflow-y-auto p-2 space-y-3">
        <div v-for="cat in filteredCategories" :key="cat.id">
          <p class="text-[10px] uppercase tracking-widest text-muted-foreground/40 font-medium px-1 mb-1 mt-2">
            {{ cat.label }}
          </p>
          <div class="grid grid-cols-5 gap-1.5">
            <button
              v-for="icon in cat.icons"
              :key="icon.name"
              type="button"
              :title="icon.label"
              class="size-11 rounded-xl flex items-center justify-center transition-all active:scale-95"
              :class="modelValue === icon.name
                ? 'text-white'
                : 'bg-muted text-muted-foreground hover:bg-muted/70'"
              :style="modelValue === icon.name ? { background: color } : {}"
              @click.stop="select(icon.name)"
            >
              <component :is="icon.component" :size="20" />
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
    </template>
  </div>
</template>
