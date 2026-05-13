import { onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ROUTES } from '@/constants/routes'

const SHORTCUT_MAP: Record<string, string> = {
  d: ROUTES.DASHBOARD,
  t: ROUTES.TASKS,
  h: ROUTES.HABITS,
  a: ROUTES.CALENDAR,
  f: ROUTES.FINANCE,
  m: ROUTES.GOALS,
  r: ROUTES.REPORTS,
}

export function useKeyboardShortcut() {
  const router = useRouter()
  let waitingForSecond = false
  let resetTimer: ReturnType<typeof setTimeout>

  function handleKeydown(e: KeyboardEvent) {
    const tag = (e.target as HTMLElement).tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return

    if (e.key.toLowerCase() === 'g' && !waitingForSecond) {
      waitingForSecond = true
      resetTimer = setTimeout(() => {
        waitingForSecond = false
      }, 1000)
      return
    }

    if (waitingForSecond) {
      clearTimeout(resetTimer)
      waitingForSecond = false
      const routeName = SHORTCUT_MAP[e.key.toLowerCase()]
      if (routeName) {
        router.push({ name: routeName })
      }
    }
  }

  onMounted(() => window.addEventListener('keydown', handleKeydown))
  onUnmounted(() => window.removeEventListener('keydown', handleKeydown))
}
