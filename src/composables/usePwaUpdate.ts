import { useRegisterSW } from 'virtual:pwa-register/vue'

/** While the app is open and visible, look for a new deploy this often. */
const POLL_MS = 5 * 60 * 1000
/** Coming back to the app checks right away, but not more than once in this window. */
const MIN_GAP_MS = 30 * 1000
const RELOADED_KEY = 'pwa-preload-reload-at'

/**
 * Keeps the installed app on the latest deploy without clearing the cache.
 *
 * The service worker serves the app from its precache, and the browser only looks for a new
 * service worker on a full page load. An installed PWA is usually resumed from the background,
 * which is not a page load, and timers stop while it is hidden, so an old version could stay
 * for days. So the app also checks when it becomes visible again, gains focus or comes back
 * online, and every few minutes while open. With `autoUpdate` (skipWaiting + clientsClaim) the
 * plugin reloads the page as soon as the new service worker takes over.
 */
export function usePwaUpdate() {
  let registration: ServiceWorkerRegistration | undefined
  let lastCheck = 0

  function checkForUpdate() {
    if (!registration || registration.installing || !navigator.onLine) return
    if (Date.now() - lastCheck < MIN_GAP_MS) return
    lastCheck = Date.now()
    registration.update().catch(() => {
      // offline or server hiccup: the next check tries again
    })
  }

  useRegisterSW({
    immediate: true,
    onRegisteredSW(_swUrl, r) {
      registration = r
      setInterval(() => {
        if (document.visibilityState === 'visible') checkForUpdate()
      }, POLL_MS)
    },
  })

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') checkForUpdate()
  })
  window.addEventListener('focus', checkForUpdate)
  window.addEventListener('online', checkForUpdate)

  window.addEventListener('vite:preloadError', (event) => {
    if (reloadForNewBuild()) event.preventDefault()
  })
}

/** Message of a failed lazy import, as Chrome, Firefox and Safari word it. */
const CHUNK_ERROR = /dynamically imported module|Importing a module script failed|error loading dynamically imported module/i

export function isChunkLoadError(error: unknown): boolean {
  return error instanceof Error && CHUNK_ERROR.test(error.message)
}

/**
 * A page still running the previous build asks for a lazy chunk the new deploy no longer has:
 * reload once to pick up the new build instead of showing a broken screen. Returns false (no
 * reload) when it already reloaded in the last 10 s, so a real outage cannot loop.
 */
export function reloadForNewBuild(): boolean {
  let last = 0
  try {
    last = Number(sessionStorage.getItem(RELOADED_KEY) ?? 0)
  } catch {
    // storage blocked: the loop guard cannot apply, reload anyway
  }
  if (Date.now() - last < 10_000) return false
  try {
    sessionStorage.setItem(RELOADED_KEY, String(Date.now()))
  } catch {
    // ignore
  }
  window.location.reload()
  return true
}
