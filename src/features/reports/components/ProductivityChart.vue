<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { Skeleton } from '@ui/skeleton'

interface ChartPoint {
  label: string
  value: number
}

const props = defineProps<{
  data: ChartPoint[]
  loading?: boolean
}>()

const canvasRef = ref<HTMLCanvasElement | null>(null)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let chartInstance: any = null

function getCSSVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

function hsl(token: string, alpha = 1): string {
  const val = getCSSVar(token)
  return alpha < 1 ? `hsla(${val}, ${alpha})` : `hsl(${val})`
}

async function buildChart() {
  if (!canvasRef.value || props.loading) return
  const { Chart, BarController, BarElement, CategoryScale, LinearScale, Tooltip } =
    await import('chart.js')
  Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip)

  if (chartInstance) { chartInstance.destroy(); chartInstance = null }

  chartInstance = new Chart(canvasRef.value, {
    type: 'bar',
    data: {
      labels: props.data.map((d) => d.label),
      datasets: [
        {
          data: props.data.map((d) => d.value),
          backgroundColor: hsl('--primary', 0.5),
          borderColor: hsl('--primary', 0.8),
          borderWidth: 1,
          borderRadius: 3,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: hsl('--card'),
          borderColor: hsl('--border'),
          borderWidth: 1,
          titleColor: hsl('--foreground'),
          bodyColor: hsl('--muted-foreground'),
          padding: 10,
          callbacks: {
            label: (ctx) => ` ${ctx.parsed.y} tarefa${ctx.parsed.y !== 1 ? 's' : ''}`,
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          border: { display: false },
          ticks: {
            color: hsl('--muted-foreground', 0.5),
            font: { size: 10 },
            maxRotation: 0,
          },
        },
        y: {
          grid: { color: hsl('--border', 0.35), lineWidth: 0.5 },
          border: { display: false },
          ticks: {
            color: hsl('--muted-foreground', 0.5),
            font: { size: 10 },
            stepSize: 1,
            maxTicksLimit: 5,
          },
          min: 0,
        },
      },
    },
  })
}

watch(
  [() => props.data, () => props.loading],
  async ([, isLoading]) => {
    if (isLoading) return
    await nextTick()
    buildChart()
  },
)

onMounted(() => {
  if (!props.loading) buildChart()
})

onBeforeUnmount(() => {
  if (chartInstance) { chartInstance.destroy(); chartInstance = null }
})
</script>

<template>
  <div class="rounded-lg border border-border/50 bg-card">
    <div class="px-4 py-3 border-b border-border/50">
      <span class="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/50">
        Produtividade — Tarefas concluídas
      </span>
    </div>
    <div class="px-4 pt-3 pb-4 h-[180px] relative">
      <div v-if="loading" class="absolute inset-4">
        <Skeleton class="h-full w-full rounded" />
      </div>
      <canvas v-show="!loading" ref="canvasRef" />
    </div>
  </div>
</template>
