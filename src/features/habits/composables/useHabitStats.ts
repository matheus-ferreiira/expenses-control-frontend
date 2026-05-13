import { ref, reactive } from 'vue'
import { habitsApi } from '@/services/api/habits'
import type { HabitStats, HabitHeatmapEntry } from '@/types/habits'

interface StatsCache {
  stats: HabitStats | null
  heatmap: HabitHeatmapEntry[]
  loading: boolean
  error: string | null
}

export function useHabitStats() {
  const cache = reactive<Map<string, StatsCache>>(new Map())
  const currentId = ref<string | null>(null)

  function getOrCreate(id: string): StatsCache {
    if (!cache.has(id)) {
      cache.set(id, { stats: null, heatmap: [], loading: false, error: null })
    }
    return cache.get(id) as StatsCache
  }

  async function fetchStats(id: string): Promise<void> {
    currentId.value = id
    const entry = getOrCreate(id)
    if (entry.stats) return // already cached

    entry.loading = true
    entry.error = null
    try {
      const [stats, heatmap] = await Promise.all([
        habitsApi.stats(id),
        habitsApi.heatmap(id),
      ])
      entry.stats = stats
      entry.heatmap = heatmap
    } catch {
      entry.error = 'Erro ao carregar estatísticas'
    } finally {
      entry.loading = false
    }
  }

  function invalidate(id: string): void {
    cache.delete(id)
  }

  function getStats(id: string): HabitStats | null {
    return cache.get(id)?.stats ?? null
  }

  function getHeatmap(id: string): HabitHeatmapEntry[] {
    return cache.get(id)?.heatmap ?? []
  }

  function isLoading(id: string): boolean {
    return cache.get(id)?.loading ?? false
  }

  return {
    currentId,
    fetchStats,
    invalidate,
    getStats,
    getHeatmap,
    isLoading,
  }
}
