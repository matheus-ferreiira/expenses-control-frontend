import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { authApi } from '@/services/api/auth'
import type { User, LoginCredentials, RegisterPayload } from '@/types/auth'

const TOKEN_KEY = 'auth_token'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(localStorage.getItem(TOKEN_KEY))
  const loading = ref(false)
  const error = ref<string | null>(null)

  const isAuthenticated = computed(() => !!token.value)

  function setToken(value: string) {
    token.value = value
    localStorage.setItem(TOKEN_KEY, value)
  }

  function clearAuth() {
    token.value = null
    user.value = null
    localStorage.removeItem(TOKEN_KEY)
  }

  async function login(credentials: LoginCredentials) {
    loading.value = true
    error.value = null
    try {
      const data = await authApi.login(credentials)
      setToken(data.token)
      user.value = data.user
    } catch (e: unknown) {
      error.value = extractError(e)
      throw e
    } finally {
      loading.value = false
    }
  }

  async function register(payload: RegisterPayload) {
    loading.value = true
    error.value = null
    try {
      const data = await authApi.register(payload)
      setToken(data.token)
      user.value = data.user
    } catch (e: unknown) {
      error.value = extractError(e)
      throw e
    } finally {
      loading.value = false
    }
  }

  async function logout() {
    try {
      if (token.value) await authApi.logout()
    } finally {
      clearAuth()
    }
  }

  async function fetchMe() {
    if (!token.value) return
    try {
      user.value = await authApi.me()
    } catch {
      clearAuth()
    }
  }

  async function loginWithToken(tokenValue: string) {
    setToken(tokenValue)
    loading.value = true
    try {
      user.value = await authApi.me()
    } catch {
      clearAuth()
      throw new Error('Failed to fetch user')
    } finally {
      loading.value = false
    }
  }

  return {
    user,
    token,
    loading,
    error,
    isAuthenticated,
    login,
    register,
    logout,
    fetchMe,
    clearAuth,
    loginWithToken,
  }
})

function extractError(e: unknown): string {
  if (e && typeof e === 'object' && 'response' in e) {
    const res = (e as { response?: { data?: { message?: string } } }).response
    return res?.data?.message ?? 'Erro inesperado'
  }
  return 'Erro inesperado'
}
