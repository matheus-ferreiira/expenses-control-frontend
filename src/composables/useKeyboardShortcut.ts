import { onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ROUTES } from '@/constants/routes'
import { useUiStore } from '@/stores/ui'

const SHORTCUT_MAP: Record<string, string> = {
  d: ROUTES.DASHBOARD,
  t: ROUTES.TASKS,
  h: ROUTES.HABITS,
  m: ROUTES.FINANCE_GOALS,
  a: ROUTES.CALENDAR,
  f: ROUTES.FINANCE,
  r: ROUTES.REPORTS,
  c: ROUTES.PURCHASES,
  n: ROUTES.NOTES,
  b: ROUTES.BOOKMARKS,
  v: ROUTES.VAULT,
}

export function useKeyboardShortcut() {
  const router = useRouter()
  const ui = useUiStore()

  let waitingForSecond = false
  let resetTimer: ReturnType<typeof setTimeout>

  function handleKeydown(e: KeyboardEvent) {
    const tag = (e.target as HTMLElement).tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
    if ((e.target as HTMLElement).isContentEditable) return

    // Ctrl+K / Cmd+K → command palette
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault()
      ui.commandOpen = !ui.commandOpen
      return
    }

    // N (no modifier, no dialog open) → quick add
    if (
      e.key.toLowerCase() === 'n' &&
      !e.ctrlKey &&
      !e.metaKey &&
      !e.altKey &&
      !ui.commandOpen &&
      !ui.quickAddOpen
    ) {
      ui.quickAddOpen = true
      return
    }

    // G + letter → navigate
    if (e.key.toLowerCase() === 'g' && !e.ctrlKey && !e.metaKey && !waitingForSecond) {
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
