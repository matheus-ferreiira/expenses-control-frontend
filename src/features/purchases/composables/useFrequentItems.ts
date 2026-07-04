import { ref, computed, type Ref } from 'vue'
import { shoppingApi } from '@/services/api/shopping'

/** Normaliza para comparação: caixa e acentos não diferenciam itens */
export function normalizeItemName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
}

/**
 * Itens frequentes do histórico, filtrados pelo que o usuário digita e
 * excluindo o que já está na lista atual — chips de 1 toque + autocomplete.
 */
export function useFrequentItems(options: {
  /** Texto sendo digitado — filtra os chips como autocomplete */
  query: Ref<string>
  /** Nomes já presentes na lista atual (não sugerir de novo) */
  existingNames: () => string[]
  /** Máximo de chips exibidos */
  limit?: number
}) {
  const frequent = ref<Array<{ name: string; uses: number }>>([])
  const loaded = ref(false)

  async function loadFrequent() {
    if (loaded.value) return
    try {
      frequent.value = await shoppingApi.items.frequent()
      loaded.value = true
    } catch {
      frequent.value = []
    }
  }

  /** Força recarga na próxima abertura (após adicionar itens novos) */
  function invalidate() {
    loaded.value = false
  }

  const suggestions = computed(() => {
    const existing = new Set(options.existingNames().map(normalizeItemName))
    const q = normalizeItemName(options.query.value)

    return frequent.value
      .filter((f) => !existing.has(normalizeItemName(f.name)))
      .filter((f) => !q || normalizeItemName(f.name).includes(q))
      .slice(0, options.limit ?? 8)
  })

  return { loadFrequent, invalidate, suggestions }
}
